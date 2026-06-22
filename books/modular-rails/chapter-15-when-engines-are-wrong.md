---
layout: book
book: modular_rails
title: "When Engines Are the Wrong Tool"
permalink: /books/modular-rails/chapter-15-when-engines-are-wrong/
description: "When Rails engines are the wrong tool: apps that are too small, premature boundaries, and the real costs of modularising before you need to."
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-14-team-workflow/">&larr; Team Workflow and Developer Experience</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-16-engines-vs-alternatives/">Engines vs the Alternatives &rarr;</a>
</nav>

<h1 id="chapter-15-when-engines-are-the-wrong-tool">Chapter 15: When Engines Are the Wrong Tool</h1>

<p>Every architecture book owes you a chapter about when its recommended approach is wrong. This is that chapter.</p>

<p>Rails Engines are powerful. They solve real problems. But they’re not free, and they’re not always the right answer. Reaching for engines when you don’t need them adds complexity without corresponding benefit. This chapter helps you recognise when that’s the case.</p>

<div class="diagram"><img src="/img/books/modular-rails/6f282840fce9483940dac68f332ff9431e82305d395b0a516f91327204474c4b.svg" alt="Mermaid diagram: flowchart TD"></div>

<hr />

<h2 id="applications-that-are-too-small">Applications That Are Too Small</h2>

<p>If your application has fewer than 20 models, you probably don’t need engines. The overhead of engine infrastructure – gemspecs, dummy apps, integration concerns, version management – isn’t justified when the whole application fits in your head.</p>

<p>A 15-model application can be modularised effectively with plain Ruby modules and namespaces:</p>

<pre><code>app/models/
  billing/
    invoice.rb
    subscription.rb
  notifications/
    notification.rb
    preference.rb
</code></pre>

<p>No engine needed. The namespace provides organisational clarity. Zeitwerk handles autoloading. The cost is zero and the benefit – code organisation – is immediate.</p>

<p>The inflection point is typically around 40-60 models, when <code>app/models/</code> becomes overwhelming and changes in one area start causing unexpected test failures in another. Below that, namespace directories within the host app are sufficient.</p>

<hr />

<h2 id="teams-that-are-too-small">Teams That Are Too Small</h2>

<p>Engines shine when multiple teams need to work independently on different parts of the same application. If your team is three developers, you don’t have a team coordination problem. You have a chat.</p>

<p>The overhead of engine boundaries – separate test suites, version management, integration concerns, CI pipeline configuration – is worth it when it prevents teams from stepping on each other. For a team of three, that prevention isn’t needed. Everyone already knows what everyone else is working on.</p>

<p>Consider engines when your team exceeds 6-8 developers, or when you have distinct sub-teams responsible for different business domains. Below that, the coordination cost of engines exceeds the coordination cost of a shared codebase.</p>

<hr />

<h2 id="when-the-overhead-isnt-worth-it">When the Overhead Isn’t Worth It</h2>

<p>Engine overhead is real:</p>

<ul>
  <li><strong>Maintenance:</strong> Each engine needs its own gemspec, CI pipeline, test configuration, and README</li>
  <li><strong>Indirection:</strong> Debugging across engine boundaries requires following concern includes, configuration objects, and event subscriptions</li>
  <li><strong>Migration coordination:</strong> Engine migrations must be copied to the host app and run in the correct order</li>
  <li><strong>Version management:</strong> For separate-repository engines, version bumps and tag releases add steps to the development workflow</li>
  <li><strong>Mental model:</strong> New developers must understand the engine pattern before they can contribute</li>
</ul>

<p>If the benefits (isolation, independent testing, clear ownership) don’t outweigh these costs for your specific situation, don’t use engines.</p>

<h3 id="the-honest-calculation">The honest calculation</h3>

<p>Ask yourself:</p>
<ul>
  <li>How many times in the last quarter did a change in one domain break something in another? If the answer is “zero” or “once,” the coupling cost is low and engines add more overhead than they prevent.</li>
  <li>How long does your test suite take? If it’s under 5 minutes, the testing benefit of engines is marginal.</li>
  <li>How often do developers step on each other? If merge conflicts are rare, team scaling isn’t a pressing concern.</li>
</ul>

<hr />

<h2 id="the-premature-boundary-trap">The Premature Boundary Trap</h2>

<p>Martin warns: <em>“Your goal is to implement the boundaries right at the inflection point where the cost of implementing becomes less than the cost of ignoring.”</em></p>

<p>Implementing boundaries too early is as harmful as implementing them too late. A premature engine boundary:</p>

<ul>
  <li>Locks in a decomposition that might be wrong (you haven’t learned enough about the domain yet)</li>
  <li>Adds integration complexity for a separation that isn’t justified</li>
  <li>Makes refactoring harder (moving code between engines is harder than moving it between directories)</li>
  <li>Creates coordination overhead without corresponding benefit</li>
</ul>

<p>The XP approach is the antidote: start with everything in the host app. Observe. Notice which areas change together and which change independently. When the pain of missing boundaries becomes concrete and measurable – slow tests, broken builds, merge conflicts – that’s when you extract.</p>

<p>Don’t extract a domain into an engine because it “might need to be separate later.” Extract it because it needs to be separate now, and you have evidence.</p>

<hr />

<h2 id="signs-youve-over-modularised">Signs You’ve Over-Modularised</h2>

<div class="diagram"><img src="/img/books/modular-rails/0e2fa79eeec328f1967ebc5abe42d202241a153e6357852ae8e849b24aeeee5a.svg" alt="Mermaid diagram: Warning Signs"></div>

<ul>
  <li><strong>Every PR touches three engines.</strong> If most features require changes across multiple engines, your boundaries are in the wrong places. Features that cross boundaries should be the exception, not the rule.</li>
  <li><strong>The shared kernel / core engine is enormous.</strong> If more code lives in the core engine than in any domain engine, you’ve pushed too much to the edges. Domain engines should contain domain logic, not delegate everything to core.</li>
  <li><strong>Engine version bumps are constant.</strong> If you’re bumping engine versions multiple times per day, the version management overhead is outweighing the benefits. Consider a monorepo instead of separate repositories.</li>
  <li><strong>Nobody can explain the architecture.</strong> If new developers spend days understanding the engine boundaries before writing their first line of code, the architecture is too complex for its context.</li>
  <li><strong>You have engines with 2-3 models.</strong> Engines have meaningful overhead. A domain with 2 models and 1 controller probably doesn’t justify that overhead. A namespace within the host app would suffice.</li>
</ul>

<p>The fix for over-modularisation is to merge engines back together. This is easier than it sounds: remove <code>isolate_namespace</code>, move the code into the host app, delete the engine directory. Engines are reversible – that’s one of their strengths over microservices.</p>

<hr />

<h2 id="performance-and-boot-time-considerations">Performance and Boot Time Considerations</h2>

<p>Every engine registers initializers, autoload paths, route files, and locale files. That registration isn’t free.</p>

<h3 id="boot-time-impact">Boot time impact</h3>

<p>With 3-5 engines, the impact is negligible – a few hundred milliseconds at most. With 20+ engines, boot time can increase by several seconds. Before you optimise anything, measure:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">time </span>bin/rails runner <span class="s2">"puts Rails.application.eager_load!"</span>
</code></pre></div></div>

<p>Run that a few times to get a stable number. If you’re under 10 seconds, you probably don’t have a boot time problem. If you’re over 30 seconds, engines might be contributing – but they’re rarely the only culprit. Gem count and database connection setup usually dominate.</p>

<h3 id="strategies-to-keep-boot-fast">Strategies to keep boot fast</h3>

<p><strong>Lazy loading.</strong> Zeitwerk handles autoloading automatically, so engine code isn’t eager-loaded in development by default. The trap is custom initializers that <code>require</code> files eagerly. Every <code>require</code> in an initializer bypasses Zeitwerk’s lazy loading. If your engine initializer loads 50 classes at boot, you’ve defeated the purpose. Keep initializers declarative – register configuration, don’t load code.</p>

<p><strong>Conditional engine loading.</strong> When running an engine’s own test suite through its dummy app, you only need that engine and its dependencies. Don’t load every engine in the system. Structure your dummy app’s <code>Gemfile</code> to include only what’s necessary.</p>

<p><strong>Minimal initializers.</strong> Engine initializers should do as little work as possible. Defer heavy setup:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Bad -- runs at boot</span>
<span class="n">initializer</span> <span class="s2">"billing.setup_gateway"</span> <span class="k">do</span>
  <span class="no">Billing</span><span class="p">.</span><span class="nf">gateway</span> <span class="o">=</span> <span class="no">Stripe</span><span class="o">::</span><span class="no">Client</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="no">ENV</span><span class="p">[</span><span class="s2">"STRIPE_KEY"</span><span class="p">])</span>
<span class="k">end</span>

<span class="c1"># Good -- runs after full initialisation</span>
<span class="n">initializer</span> <span class="s2">"billing.setup_gateway"</span> <span class="k">do</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">after_initialize</span> <span class="k">do</span>
    <span class="no">Billing</span><span class="p">.</span><span class="nf">gateway</span> <span class="o">=</span> <span class="no">Stripe</span><span class="o">::</span><span class="no">Client</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="no">ENV</span><span class="p">[</span><span class="s2">"STRIPE_KEY"</span><span class="p">])</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># Also good -- runs only when the framework component loads</span>
<span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:action_controller</span><span class="p">)</span> <span class="k">do</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">ControllerHelpers</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="route-compilation">Route compilation</h3>

<p>Each mounted engine adds to route compilation time. Rails compiles routes on the first request in development, and with many engines, this can add seconds to that first hit.</p>

<p>In development, <code>config.eager_load = false</code> is the default, which already defers most loading. If route compilation is still slow, the most effective approach is reducing the total number of mounted engines in development – mount only the engines you’re actively working on by conditionally loading them in your development <code>Gemfile</code>.</p>

<h3 id="memory-overhead">Memory overhead</h3>

<p>Each engine loads its own models, controllers, and helpers into memory. For most applications this is insignificant. But if you’re running 30+ engines with heavy model logic, it’s worth checking.</p>

<p>A quick way to see where you stand:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/initializers/memory_report.rb (development only)</span>
<span class="k">if</span> <span class="no">Rails</span><span class="p">.</span><span class="nf">env</span><span class="p">.</span><span class="nf">development?</span>
  <span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">config</span><span class="p">.</span><span class="nf">after_initialize</span> <span class="k">do</span>
    <span class="n">rss</span> <span class="o">=</span> <span class="sb">`ps -o rss= -p </span><span class="si">#{</span><span class="no">Process</span><span class="p">.</span><span class="nf">pid</span><span class="si">}</span><span class="sb">`</span><span class="p">.</span><span class="nf">to_i</span> <span class="o">/</span> <span class="mi">1024</span>
    <span class="no">Rails</span><span class="p">.</span><span class="nf">logger</span><span class="p">.</span><span class="nf">info</span> <span class="s2">"Boot RSS: </span><span class="si">#{</span><span class="n">rss</span><span class="si">}</span><span class="s2">MB"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>If boot memory is under 500MB, you’re fine. If it’s over 1GB, profile individual engines to find the heavy ones. Usually it’s a handful of engines loading large dependency trees, not the engine pattern itself.</p>

<h3 id="the-honest-take">The honest take</h3>

<p>For most teams running under 15 engines, performance overhead is negligible compared to the time saved by faster test suites and clearer boundaries. I’ve worked in a codebase with 20+ engines and boot time was never the bottleneck – slow gems and database setup were.</p>

<p>Don’t optimise boot time unless you’ve measured a real problem. And when you do measure one, check gem loading and initialiser work before blaming the engine count.</p>

<hr />

<h2 id="alternatives-that-might-be-enough">Alternatives That Might Be Enough</h2>

<p>Before reaching for engines, consider lighter-weight approaches:</p>

<p><strong>Namespaces.</strong> <code>app/models/billing/invoice.rb</code> gives you organisational clarity without engine overhead. Good enough for small teams and small domains.</p>

<p><strong>Concerns.</strong> Extract shared behaviour into concerns within the host app. No engine needed for code reuse within a single application.</p>

<p><strong>Service objects.</strong> If the problem is fat models, service objects (plain Ruby classes in <code>app/services/</code>) might be all you need. They organise business logic without creating structural boundaries.</p>

<p><strong>Packwerk.</strong> If you want boundary enforcement without structural isolation, Packwerk’s static analysis might be sufficient. It’s lighter than engines and allows gradual adoption (see Chapter 16 for a detailed comparison).</p>

<p><strong>Plain Ruby gems.</strong> If a domain has no Rails dependencies – no models, no controllers, no views – it doesn’t need an engine. A plain Ruby gem gives you packaging, versioning, and isolation without any Rails overhead. A tax calculation library, a currency converter, a business rule engine – these are pure Ruby. Wrapping them in a Rails Engine buys you nothing except unnecessary coupling to the framework. Extract them as gems. They get their own repository, their own test suite, their own release cycle, and they’re reusable across every application in your organisation – Rails or otherwise. We’ll compare gems to engines in detail in the next chapter.</p>

<p><strong>Just good Rails.</strong> Sometimes the answer is better code, not more structure. Smaller controllers. Focused models. Clear naming. The framework’s conventions handle a lot if you follow them well.</p>

<hr />

<p><em>Being honest about when your tool isn’t the right one is a sign of maturity, not weakness. Engines are powerful when the context calls for them. When it doesn’t, use something simpler. The next chapter compares engines to the alternatives in detail.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-14-team-workflow/">&larr; Team Workflow and Developer Experience</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-16-engines-vs-alternatives/">Engines vs the Alternatives &rarr;</a>
</nav>
{% endraw %}
