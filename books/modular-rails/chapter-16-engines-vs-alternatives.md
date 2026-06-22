---
layout: book
book: modular_rails
title: "Engines vs the Alternatives"
permalink: /books/modular-rails/chapter-16-engines-vs-alternatives/
description: "Rails engines vs Packwerk, gems and namespaced modules — a side-by-side comparison to choose the right modularisation tool for your context."
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-15-when-engines-are-wrong/">&larr; When Engines Are the Wrong Tool</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-17-the-microservices-question/">The Microservices Question &rarr;</a>
</nav>

<h1 id="chapter-16-engines-vs-the-alternatives">Chapter 16: Engines vs the Alternatives</h1>

<p>This chapter puts the tools side by side. Not to declare a winner – each has its sweet spot – but to help you choose the right one for your context.</p>

<hr />

<h2 id="packwerk-static-analysis-vs-structural-enforcement">Packwerk: Static Analysis vs Structural Enforcement</h2>

<p>Packwerk, from Shopify, adds boundary enforcement to Rails applications through static analysis. You define packages (directories with a <code>package.yml</code>), declare allowed dependencies, and <code>bin/packwerk check</code> flags violations.</p>

<h3 id="how-it-works">How it works</h3>

<p>Drop a <code>package.yml</code> in a directory:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/billing/package.yml</span>
<span class="na">enforce_dependencies</span><span class="pi">:</span> <span class="kc">true</span>
<span class="na">enforce_privacy</span><span class="pi">:</span> <span class="kc">true</span>
<span class="na">dependencies</span><span class="pi">:</span>
  <span class="pi">-</span> <span class="s2">"</span><span class="s">app/core"</span>
</code></pre></div></div>

<p>Packwerk parses your Ruby files, resolves constant references using the same rules as Zeitwerk, and checks whether each reference crosses a package boundary without a declared dependency.</p>

<p>Violations are tracked in <code>package_todo.yml</code> – existing violations are grandfathered, and CI prevents new ones. This enables gradual adoption.</p>

<h3 id="where-it-excels">Where it excels</h3>

<ul>
  <li><strong>Gradual adoption.</strong> You can introduce boundaries incrementally without restructuring any code. Add a <code>package.yml</code>, run <code>bin/packwerk update-todo</code>, and new violations are blocked. No class renaming, no table prefixing, no route changes.</li>
  <li><strong>Low overhead.</strong> No gemspecs, no dummy apps, no version management. Packages are just directories with a YAML file.</li>
  <li><strong>Visibility.</strong> Packwerk makes implicit dependencies visible. Running <code>bin/packwerk check</code> shows you exactly where boundaries are crossed. This is valuable even if you later decide to extract engines.</li>
  <li><strong>No runtime cost.</strong> Packwerk runs at analysis time, not at runtime. It adds zero overhead to your running application.</li>
</ul>

<h3 id="where-engines-are-stronger">Where engines are stronger</h3>

<ul>
  <li><strong>Runtime enforcement.</strong> <code>isolate_namespace</code> enforces boundaries at every layer: models, routes, views, helpers, tables. You can’t accidentally cross the boundary because the boundary is structural. Packwerk can only flag constant references in source files – it can’t see dynamic references, routes, or database access.</li>
  <li><strong>Independent testing.</strong> Engines have dummy apps. You can run an engine’s tests without loading the host application. Packwerk packages share the same test infrastructure.</li>
  <li><strong>Table ownership.</strong> <code>isolate_namespace</code> prefixes table names, making database ownership visible. Packwerk doesn’t touch the database.</li>
  <li><strong>Deployable independence.</strong> Engines can be versioned and released independently. Packwerk packages are always deployed together.</li>
</ul>

<h3 id="the-public-api-pattern">The Public API Pattern</h3>

<p>Mature Packwerk codebases go beyond <code>enforce_privacy: true</code>. They use <code>app/public/</code> directories to define explicit component interfaces – a dedicated surface area that other packages are allowed to touch.</p>

<pre><code>components/billing/
├── app/
│   ├── public/           # ← Only this code is accessible outside
│   │   ├── billing_api.rb
│   │   ├── get_invoice.rb
│   │   └── errors/
│   ├── models/           # Private to billing
│   ├── modules/          # Private business logic
│   └── jobs/             # Private jobs
├── package.yml
└── package_todo.yml
</code></pre>

<p>The <code>package.yml</code> configuration is straightforward:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="na">enforce_privacy</span><span class="pi">:</span> <span class="kc">true</span>
<span class="na">public_path</span><span class="pi">:</span> <span class="s">app/public/</span>
</code></pre></div></div>

<p>This makes the boundary explicit: other components can only call <code>Billing::GetInvoice</code> (in <code>app/public/</code>), not <code>Billing::Invoice</code> (the model). Everything outside <code>app/public/</code> is private to the package. Cross that boundary and <code>bin/packwerk check</code> will flag it.</p>

<p>This is Packwerk’s equivalent of an engine’s concern-based integration – but enforced by static analysis rather than namespace isolation. An engine hides internals through Ruby’s autoloader and module structure. Packwerk hides them through convention backed by CI. Different mechanism, same goal: a narrow, intentional interface between domains.</p>

<h3 id="dynamic-route-loading">Dynamic Route Loading</h3>

<p>One argument for engines is route ownership – each engine mounts its own routes, making it clear which domain handles which URLs. Packwerk components can achieve the same organisation without being full engines:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># lib/core_ext/action_dispatch/routing/mapper.rb</span>
<span class="k">module</span> <span class="nn">ActionDispatch::Routing::Mapper</span>
  <span class="k">def</span> <span class="nf">draw_component_routes</span>
    <span class="no">Rails</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s1">'components/*/config/routes.rb'</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">file</span><span class="o">|</span>
      <span class="nb">instance_eval</span><span class="p">(</span><span class="n">file</span><span class="p">.</span><span class="nf">read</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/routes.rb</span>
<span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">draw_component_routes</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This gives you route-per-component organisation without the overhead of engine mounting. Each component owns its routes, but they all live in the same application namespace. No <code>mount</code>, no <code>isolate_namespace</code>, no route proxy objects. The trade-off: you lose the URL prefix isolation that engine mounting gives you, and there’s no enforcement preventing route collisions between components.</p>

<h3 id="when-to-use-which">When to use which</h3>

<table>
  <thead>
    <tr>
      <th>Context</th>
      <th>Packwerk</th>
      <th>Engines</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Team of 3-6, want boundary visibility</td>
      <td>✓</td>
      <td> </td>
    </tr>
    <tr>
      <td>Team of 8+, need independent testing</td>
      <td> </td>
      <td>✓</td>
    </tr>
    <tr>
      <td>Existing large monolith, gradual migration</td>
      <td>✓</td>
      <td> </td>
    </tr>
    <tr>
      <td>New application, clean architecture from start</td>
      <td> </td>
      <td>✓</td>
    </tr>
    <tr>
      <td>Need to enforce boundaries in CI but not restructure</td>
      <td>✓</td>
      <td> </td>
    </tr>
    <tr>
      <td>Need independent versioning and release cycles</td>
      <td> </td>
      <td>✓</td>
    </tr>
    <tr>
      <td>Want to visualise dependencies before deciding</td>
      <td>✓</td>
      <td> </td>
    </tr>
    <tr>
      <td>Need database-level isolation</td>
      <td> </td>
      <td>✓</td>
    </tr>
    <tr>
      <td>Need explicit public interfaces</td>
      <td>✓</td>
      <td>✓</td>
    </tr>
  </tbody>
</table>

<div class="diagram"><img src="/img/books/modular-rails/97ed60cc4cd3557d5a8fedb300f6e9ba5babd53c258456aac433b81ef7596cb9.svg" alt="Mermaid diagram: Low Overhead"></div>

<p>They’re not mutually exclusive. You can use Packwerk to analyse an existing monolith, identify boundaries, and then extract the clearest domains into engines. Packwerk is the diagnostic tool; engines are the structural solution.</p>

<hr />

<h2 id="sorbet-type-safety-vs-architectural-boundaries">Sorbet: Type Safety vs Architectural Boundaries</h2>

<p>Sorbet adds gradual static typing to Ruby. You annotate methods with <code>sig</code> blocks, and the type checker catches mismatches at analysis time.</p>

<h3 id="what-it-does-well">What it does well</h3>

<p>Sorbet enforces method-level contracts: this method takes a <code>String</code> and returns an <code>Integer</code>. It also provides structural tools like <code>final!</code> (prevents subclassing), <code>sealed!</code> (restricts subclassing to the same file), and <code>abstract!</code> (forces method implementation).</p>

<p>These are genuinely useful. A <code>final!</code> class can’t be reopened or monkey-patched. A method with a <code>sig</code> block documents its contract in a machine-verifiable way.</p>

<h3 id="what-it-doesnt-do">What it doesn’t do</h3>

<p>Sorbet has no concept of modules, packages, or boundaries. It enforces contracts at the method level, not the architectural level. You can have perfect type coverage and still have a ball of mud where every class references every other class.</p>

<p>Types tell you <em>what</em> can flow between components. They don’t tell you <em>whether</em> those components should be talking at all.</p>

<h3 id="sorbet--engines">Sorbet + Engines</h3>

<p>They’re complementary. Use Sorbet for type safety within an engine. Use engines for architectural boundaries between domains. A billing engine with Sorbet-typed models and service objects gets both method-level contracts and component-level isolation.</p>

<p>But don’t reach for Sorbet to solve a modularity problem. If your issue is that billing code is coupled to notification code, types won’t fix that. Boundaries will.</p>

<hr />

<h2 id="plain-ruby-modules-and-namespaces">Plain Ruby Modules and Namespaces</h2>

<p>Sometimes you don’t need engines, Packwerk, or Sorbet. You need <code>module Billing</code> and a directory.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/models/billing/invoice.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="c1"># ...</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="when-namespaces-are-enough">When namespaces are enough</h3>

<ul>
  <li>The domain is small (under 10 files)</li>
  <li>You want code organisation, not isolation</li>
  <li>The domain doesn’t need independent testing</li>
  <li>You’re the only developer working on it</li>
  <li>The domain might merge back into the main namespace later</li>
</ul>

<h3 id="when-namespaces-arent-enough">When namespaces aren’t enough</h3>

<p>Namespaces don’t provide:</p>
<ul>
  <li>Table name prefixing</li>
  <li>Route isolation</li>
  <li>Independent test suites</li>
  <li>View resolution scoping</li>
  <li>Helper isolation</li>
  <li>Version management</li>
</ul>

<p>If you need any of these, you need an engine. Namespaces are organisational. Engines are structural.</p>

<h2 id="plain-ruby-gems-isolation-without-rails">Plain Ruby Gems: Isolation Without Rails</h2>

<p>There’s a step between namespaces and engines that’s often overlooked: the plain Ruby gem. Not a Rails Engine gem – a gem with no <code>require "rails"</code> anywhere in it.</p>

<h3 id="when-a-gem-is-the-right-tool">When a gem is the right tool</h3>

<p>Some domains don’t need Rails. They don’t have models, controllers, routes, or views. They’re pure business logic:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># lib/acme_pricing/calculator.rb</span>

<span class="k">module</span> <span class="nn">AcmePricing</span>
  <span class="k">class</span> <span class="nc">Calculator</span>
    <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">rules</span><span class="p">:)</span>
      <span class="vi">@rules</span> <span class="o">=</span> <span class="n">rules</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">compute</span><span class="p">(</span><span class="n">line_items</span><span class="p">,</span> <span class="n">customer</span><span class="p">:)</span>
      <span class="n">subtotal</span> <span class="o">=</span> <span class="n">line_items</span><span class="p">.</span><span class="nf">sum</span><span class="p">(</span><span class="o">&amp;</span><span class="ss">:amount</span><span class="p">)</span>
      <span class="n">discount</span> <span class="o">=</span> <span class="vi">@rules</span><span class="p">.</span><span class="nf">best_discount_for</span><span class="p">(</span><span class="n">customer</span><span class="p">,</span> <span class="n">subtotal</span><span class="p">)</span>
      <span class="n">tax</span> <span class="o">=</span> <span class="vi">@rules</span><span class="p">.</span><span class="nf">tax_for</span><span class="p">(</span><span class="n">customer</span><span class="p">.</span><span class="nf">tax_region</span><span class="p">,</span> <span class="n">subtotal</span> <span class="o">-</span> <span class="n">discount</span><span class="p">)</span>

      <span class="no">Result</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
        <span class="ss">subtotal: </span><span class="n">subtotal</span><span class="p">,</span>
        <span class="ss">discount: </span><span class="n">discount</span><span class="p">,</span>
        <span class="ss">tax: </span><span class="n">tax</span><span class="p">,</span>
        <span class="ss">total: </span><span class="n">subtotal</span> <span class="o">-</span> <span class="n">discount</span> <span class="o">+</span> <span class="n">tax</span>
      <span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This has no opinion about how it’s persisted, rendered, or routed. It takes inputs, applies rules, and returns a result. Wrapping this in a Rails Engine would mean creating a gemspec with a <code>rails</code> dependency, setting up a dummy app for testing, and dealing with engine initializers – all for code that has nothing to do with Rails.</p>

<p>A plain gem is simpler:</p>

<pre><code>acme_pricing/
├── lib/
│   ├── acme_pricing.rb
│   └── acme_pricing/
│       ├── calculator.rb
│       ├── result.rb
│       └── rules/
│           ├── volume_discount.rb
│           └── regional_tax.rb
├── spec/
│   ├── calculator_spec.rb
│   └── rules/
├── acme_pricing.gemspec
└── Gemfile
</code></pre>

<p>No dummy app. No <code>isolate_namespace</code>. No migration concerns. Just Ruby, a test suite, and a gemspec.</p>

<h3 id="what-gems-give-you">What gems give you</h3>

<ul>
  <li><strong>True independence.</strong> A gem has no framework coupling. It works in Rails, Sinatra, Hanami, a CLI script, or a background job runner. If you later extract a microservice, the gem comes along unchanged.</li>
  <li><strong>Independent versioning and release.</strong> Semantic versioning communicates intent. A major bump warns consumers. A patch is safe to pull. Engines can do this too, but the overhead of engine versioning (dummy apps, migration coordination) often discourages it in practice.</li>
  <li><strong>Enforced isolation.</strong> A gem physically can’t reach into your Rails app’s models or database. There’s no temptation to “just add a quick query” because there’s no Active Record to reach for.</li>
  <li><strong>Fast tests.</strong> No Rails boot. No database setup. Pure Ruby specs run in milliseconds.</li>
</ul>

<h3 id="what-gems-dont-give-you">What gems don’t give you</h3>

<p>Gems have no opinion about Rails-level concerns:</p>

<ul>
  <li>No table name prefixing</li>
  <li>No route mounting</li>
  <li>No view resolution</li>
  <li>No migration management</li>
  <li>No Active Record integration</li>
</ul>

<p>If your domain needs any of these, you need an engine or at least a thin engine wrapper around your gem. It’s perfectly valid to have a pure-logic gem consumed by an engine:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/services/billing/price_order.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">PriceOrder</span>
    <span class="k">def</span> <span class="nf">call</span><span class="p">(</span><span class="n">order</span><span class="p">)</span>
      <span class="n">calculator</span> <span class="o">=</span> <span class="no">AcmePricing</span><span class="o">::</span><span class="no">Calculator</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
        <span class="ss">rules: </span><span class="no">Billing</span><span class="p">.</span><span class="nf">pricing_rules</span>
      <span class="p">)</span>
      <span class="n">calculator</span><span class="p">.</span><span class="nf">compute</span><span class="p">(</span><span class="n">order</span><span class="p">.</span><span class="nf">line_items</span><span class="p">,</span> <span class="ss">customer: </span><span class="n">order</span><span class="p">.</span><span class="nf">customer</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The gem does the calculation. The engine handles persistence, routes, and Rails integration. Each layer does what it’s good at.</p>

<h3 id="the-crp-connection">The CRP connection</h3>

<p>This is the Common Reuse Principle (Chapter 2) in action. If your billing engine bundles pricing logic that’s also needed by your quoting tool, your reporting pipeline, and your mobile API – all separate applications – you’ve forced every consumer to depend on Active Record, Rails, and the billing engine’s entire dependency tree just to compute a price.</p>

<p>Extract the pricing logic into a gem and each consumer depends only on what it uses. That’s the CRP: don’t force users of a component to depend on things they don’t need.</p>

<h3 id="when-to-extract-vs-when-to-wait">When to extract vs. when to wait</h3>

<p>Don’t create a gem on day one. The same XP principle applies: start with the logic inside your application (or engine), and extract when you have evidence.</p>

<p>Evidence looks like:</p>

<ul>
  <li>A second application needs the same logic</li>
  <li>The domain has stabilised and the API rarely changes</li>
  <li>The code has no Rails dependencies (or you can cleanly separate what does from what doesn’t)</li>
  <li>You want to version the logic independently from the application</li>
</ul>

<p>If none of these are true, a module inside your engine is fine. Gems are a packaging decision, not an architecture. Make them when packaging serves you.</p>

<hr />

<h2 id="hanami-2-slices">Hanami 2 Slices</h2>

<p>Hanami 2 is the most direct framework-level competitor to the Rails engine approach. Its <strong>slices</strong> are first-class modular boundaries built into the framework from day one:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># slices/billing/actions/invoices/index.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">Actions</span>
    <span class="k">module</span> <span class="nn">Invoices</span>
      <span class="k">class</span> <span class="nc">Index</span> <span class="o">&lt;</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Action</span>
        <span class="k">def</span> <span class="nf">handle</span><span class="p">(</span><span class="n">request</span><span class="p">,</span> <span class="n">response</span><span class="p">)</span>
          <span class="n">invoices</span> <span class="o">=</span> <span class="n">billing_repo</span><span class="p">.</span><span class="nf">recent_invoices</span>
          <span class="n">response</span><span class="p">.</span><span class="nf">render</span><span class="p">(</span><span class="n">view</span><span class="p">,</span> <span class="ss">invoices: </span><span class="n">invoices</span><span class="p">)</span>
        <span class="k">end</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Slices provide automatic namespace isolation, dependency injection via <code>Dry::System</code>, and strict import controls between slices. Unlike Rails engines, you don’t need to configure <code>isolate_namespace</code> or manage gemspecs – the isolation is the default.</p>

<p>Where Hanami slices excel over Rails engines:</p>

<ul>
  <li><strong>Zero configuration isolation</strong> – no gemspec, no mount point, no <code>isolate_namespace</code> incantation</li>
  <li><strong>Explicit dependency injection</strong> – dependencies are declared, not inherited via class hierarchy</li>
  <li><strong>Strict imports</strong> – a slice can only access another slice’s exports, enforced at runtime</li>
</ul>

<p>Where Rails engines are stronger:</p>

<ul>
  <li><strong>Ecosystem</strong> – the Rails gem ecosystem (Devise, Sidekiq, ActiveAdmin) works out of the box with engines. Hanami’s ecosystem is smaller.</li>
  <li><strong>Incremental adoption</strong> – you can extract one engine from an existing Rails monolith. Adopting Hanami means rewriting.</li>
  <li><strong>Team familiarity</strong> – most Ruby developers know Rails conventions. Hanami requires learning a different mental model.</li>
  <li><strong>Maturity</strong> – Rails engines have been production-tested for over a decade. Hanami 2 is newer and evolving.</li>
</ul>

<p>If you’re starting a greenfield project and your team values explicit architecture over convention, Hanami 2 is worth evaluating. If you have an existing Rails monolith – which is most of you reading this book – engines are the pragmatic choice.</p>

<h3 id="dry-rb-and-rom">dry-rb and ROM</h3>

<p>The <code>dry-rb</code> gem suite and ROM (Ruby Object Mapper) deserve a brief mention. They provide the building blocks that Hanami uses internally: <code>Dry::System</code> for dependency injection, <code>Dry::Struct</code> for typed value objects, ROM for persistence without Active Record’s coupling.</p>

<p>You can use these inside Rails engines. A billing engine could use <code>Dry::Struct</code> for invoice value objects and <code>Dry::Validation</code> for payment parameter validation. But mixing paradigms (Active Record in some engines, ROM in others) creates cognitive overhead for your team. Unless you have a specific need that Active Record can’t serve, stick with Rails conventions inside your engines. The architectural boundary (the engine) matters more than the persistence library.</p>

<hr />

<h2 id="service-objects-interactors-and-other-in-process-patterns">Service Objects, Interactors, and Other In-Process Patterns</h2>

<p>The Ruby community has produced dozens of patterns for organising business logic within a monolith: service objects, interactors (Interactor gem), operations (Trailblazer), commands, form objects, query objects.</p>

<h3 id="these-solve-a-different-problem">These solve a different problem</h3>

<p>These patterns organise code <em>within</em> a domain. They answer “where does this business logic live?” – not “how do I isolate domains from each other?”</p>

<p>An engine can contain service objects:</p>

<pre><code>engines/billing/app/services/billing/
  invoice_generator.rb
  payment_processor.rb
  subscription_renewal.rb
</code></pre>

<p>An engine can contain interactors:</p>

<pre><code>engines/billing/app/interactors/billing/
  create_invoice.rb
  process_payment.rb
</code></pre>

<p>The in-process pattern organises code within the engine. The engine organises the domain within the application. They work at different levels and are fully compatible.</p>

<h3 id="dont-use-service-objects-as-a-substitute-for-boundaries">Don’t use service objects as a substitute for boundaries</h3>

<p>A common mistake: organising a monolith into <code>app/services/billing/</code>, <code>app/services/notifications/</code>, <code>app/services/reporting/</code> and calling it “modular.” The directories provide organisation, but:</p>

<ul>
  <li><code>Billing::InvoiceGenerator</code> can still call <code>Notifications::Notifier</code> directly</li>
  <li>Tests still load the entire application</li>
  <li>There’s no isolation of routes, views, or helpers</li>
  <li>Database tables aren’t scoped</li>
</ul>

<p>Service object directories are filing cabinets. Engines are walls with doors.</p>

<hr />

<h2 id="each-tools-sweet-spot">Each Tool’s Sweet Spot</h2>

<table>
  <thead>
    <tr>
      <th>Tool</th>
      <th>Sweet Spot</th>
      <th>Not Great For</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Rails Engines</strong></td>
      <td>Structural isolation between domains. Independent testing. Teams of 8+. Applications with 40+ models.</td>
      <td>Small apps. Small teams. Domains that aren’t ready for extraction.</td>
    </tr>
    <tr>
      <td><strong>Plain Ruby Gems</strong></td>
      <td>Framework-independent logic shared across applications. Independent versioning. Zero Rails overhead.</td>
      <td>Domains that need models, routes, views, or database tables.</td>
    </tr>
    <tr>
      <td><strong>Packwerk</strong></td>
      <td>Boundary visibility in existing monoliths. Gradual adoption. Dependency analysis.</td>
      <td>Runtime enforcement. Independent testing. Table isolation.</td>
    </tr>
    <tr>
      <td><strong>Sorbet</strong></td>
      <td>Method-level type safety. API contract documentation. Large codebases with many contributors.</td>
      <td>Architectural boundaries. Modularity. Code organisation.</td>
    </tr>
    <tr>
      <td><strong>Namespaces</strong></td>
      <td>Code organisation in smaller apps. Lightweight domain separation.</td>
      <td>Isolation. Independent testing. Route scoping.</td>
    </tr>
    <tr>
      <td><strong>Service objects</strong></td>
      <td>Organising business logic within a domain. Single-responsibility operations.</td>
      <td>Domain isolation. Boundary enforcement.</td>
    </tr>
  </tbody>
</table>

<p>The tools aren’t competitors. They’re layers:</p>

<div class="diagram"><img src="/img/books/modular-rails/ff7a147c4da07e88aad265a4cb2285de599d41a7500275443f867df63f5340ca.svg" alt="Mermaid diagram: 6. Sorbet — Type safety:&lt;br/&gt;method-level contracts, sig blocks, final!/sealed!"></div>

<ol>
  <li><strong>Namespaces</strong> give you organisation (always use these)</li>
  <li><strong>Service objects</strong> give you focused business logic (use when models get fat)</li>
  <li><strong>Packwerk</strong> gives you boundary visibility (use to analyse before extracting)</li>
  <li><strong>Plain Ruby gems</strong> give you packaged independence (use when logic is framework-free and shared across apps)</li>
  <li><strong>Engines</strong> give you structural isolation (use when boundaries are clear and need Rails integration)</li>
  <li><strong>Sorbet</strong> gives you type safety (use when method contracts matter)</li>
</ol>

<p>You might use several of these in the same application. A billing engine that delegates pricing to a plain Ruby gem, with namespaced service objects, Packwerk analysis for the non-extracted domains, and Sorbet types on the public API. Each tool at the layer where it’s most effective.</p>

<hr />

<p><em>Now that we’ve compared the tools, let’s address the elephant in the room: the microservices question.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-15-when-engines-are-wrong/">&larr; When Engines Are the Wrong Tool</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-17-the-microservices-question/">The Microservices Question &rarr;</a>
</nav>
{% endraw %}
