---
layout: book
book: modular_rails
title: "Why Architecture Matters"
permalink: /books/modular-rails/chapter-01-why-architecture-matters/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/introduction/">&larr; Introduction</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-02-clean-architecture-for-rubyists/">Clean Architecture for Rubyists &rarr;</a>
</nav>

<h1 id="chapter-1-why-architecture-matters">Chapter 1: Why Architecture Matters</h1>

<blockquote>
  <p><em>“The goal of software architecture is to minimize the human resources required to build and maintain the required system.”</em><br />
– Robert C. Martin, <em>Clean Architecture</em></p>
</blockquote>

<h2 id="the-cost-of-change-over-time">The Cost of Change Over Time</h2>

<p>Every Rails developer has lived this story. The application starts small. A handful of models, a few controllers, a test suite that runs in seconds. Adding a feature is straightforward – you create a model, write a migration, build a controller, add some views. The framework guides you. Convention over configuration. Life is good.</p>

<div class="diagram"><img src="/img/books/modular-rails/3aa2f3141586cea91ec8f448e7b59fdec7b72a575b4f7063fde2f879351bbb43.svg" alt="Mermaid diagram: Cost of Change Over Time"></div>

<p>Then the application grows. Not overnight, but steadily. The <code>app/models</code> directory fills up. The <code>User</code> model gains associations to everything. Service objects proliferate in <code>app/services/</code>. Someone introduces an <code>app/interactors/</code> directory. Then <code>app/queries/</code>. Then <code>app/decorators/</code>. Each new directory is a well-intentioned attempt to manage complexity, but none of them create actual boundaries. Everything can still reference everything. The <code>InvoiceService</code> reaches into the <code>NotificationMailer</code>. The <code>ReportQuery</code> joins across five tables that belong to three different business domains.</p>

<p>At this point, the cost of change starts to climb. Not linearly – exponentially. A small change to the billing logic triggers test failures in the notification suite. A database migration for user preferences locks a table that the checkout flow depends on. A new developer, trying to add a simple feature, spends three days understanding the web of dependencies they’ve accidentally wandered into.</p>

<p>Let’s make this concrete. You add a discount field to invoices – a straightforward billing change. You run the billing tests. They pass.</p>

<pre><code>$ bin/rails test test/models/billing/invoice_test.rb
# 3 tests, 3 assertions, 0 failures ✓

$ bin/rails test
# 847 tests, 1203 assertions, 4 failures ✗
# Failures in: notification_mailer_test.rb, report_generator_test.rb,
#              admin_dashboard_test.rb, webhook_handler_test.rb
</code></pre>

<p>Four failures in four files that have nothing to do with discounts. The <code>NotificationMailer</code> was formatting invoice totals. The <code>ReportGenerator</code> was aggregating revenue figures. The <code>AdminDashboard</code> was displaying recent invoices. The <code>WebhookHandler</code> was serialising invoice data for a third-party integration. None of these files are in the <code>billing/</code> directory. None of them showed up when you grepped for the code you changed. But they all reached into the invoice model directly, without going through any kind of boundary, and your change broke their assumptions.</p>

<p>Now imagine the same change in a codebase where billing lives inside an engine:</p>

<pre><code>$ cd engines/billing &amp;&amp; bundle exec rspec
# 94 examples, 0 failures ✓

$ cd ../.. &amp;&amp; bundle exec rspec  # host app integration tests
# 312 examples, 0 failures ✓
</code></pre>

<p>The same change. Zero collateral damage. The engine’s boundary means billing tests only load billing code. The notification mailer doesn’t reach into <code>Billing::Invoice</code> directly – it consumes a public interface that didn’t change. If the billing tests pass, the change is safe. The cost of this change was proportional to the scope of the change, not to the size of the entire application.</p>

<p>This is not a Rails problem. This is an architecture problem. Or more precisely, it’s the absence of architecture.</p>

<p>Robert C. Martin defines architecture as “the shape of the system” – the way you divide it into components, arrange those components, and manage the dependencies between them. When that shape is intentional and well-considered, the cost of change stays proportional to the scope of the change. When the shape is accidental – when it’s just whatever emerged from years of feature development – the cost of change becomes proportional to the size of the entire system.</p>

<p>That’s the tax. Every change, no matter how small, pays a tax proportional to everything that came before it.</p>

<h2 id="conways-law-and-team-structure">Conway’s Law and Team Structure</h2>

<p>In 1968, Melvin Conway observed that <em>“any organization that designs a system will produce a design whose structure is a copy of the organization’s communication structure.”</em></p>

<div class="diagram"><img src="/img/books/modular-rails/315ddb970778896f1d37c48cb7130f06aa087510c1ccba7d671ea184c316f436.svg" alt="Mermaid diagram: Single Team\n(no boundaries)"></div>

<p>This observation, known as Conway’s Law, has profound implications for Rails applications. If your team is structured as a single unit working on a single codebase with no internal boundaries, the application will reflect that: a single, undifferentiated mass where everything knows about everything.</p>

<p>But Conway’s Law also works in reverse – a principle called the “Inverse Conway Manoeuvre” (coined by Jonny LeRoy and Matt Simons in 2010, and later popularised by James Lewis and Martin Fowler). If you structure your codebase into well-bounded modules, each with a clear domain and interface, you create natural team boundaries. The billing engine has an owner. The notification engine has an owner. Changes to billing don’t require coordination with the notification team because the engine boundary makes the coupling explicit and manageable.</p>

<p>Neal Ford and Mark Richards, in <em>Software Architecture: The Hard Parts</em>, put it this way: architectural modularity isn’t just a technical concern – it’s an organisational one. The way you decompose your system determines how your teams can work independently. Get the decomposition wrong, and teams step on each other constantly. Get it right, and they move fast without breaking each other’s work.</p>

<p>In a Rails context, this means that your <code>app/</code> directory structure isn’t just a filing system. It’s an organisational decision. And <code>app/models/</code> with 200 files in it is an organisational decision that says “everyone works on everything, and good luck coordinating.”</p>

<p>Matthew Skelton and Manuel Pais formalised this thinking in <em>Team Topologies</em>, giving us a vocabulary that maps cleanly to engine-based architecture:</p>

<ul>
  <li>
    <p><strong>Stream-aligned teams</strong> own a single domain and deliver end-to-end. In engine terms, this is the team that owns <code>engines/billing/</code> – they build features, fix bugs, and deploy changes within the billing domain without needing permission from other teams.</p>
  </li>
  <li>
    <p><strong>Platform teams</strong> provide shared infrastructure that stream-aligned teams build on. The team that maintains <code>engines/core/</code> (the shared kernel from Chapter 8) is a platform team. They provide <code>Auditable</code>, <code>Tenantable</code>, and other cross-cutting concerns that domain engines depend on.</p>
  </li>
  <li>
    <p><strong>Enabling teams</strong> help other teams adopt new practices. In a modular monolith, this might be the team that writes the custom RuboCop cops (Chapter 13), maintains the CI pipeline for engine testing, or helps a team extract their first engine.</p>
  </li>
</ul>

<p>The interaction modes matter too. Stream-aligned teams should be able to work independently most of the time (the whole point of engine boundaries). When they need something from the platform team, the interaction should be “use the published interface” (a concern, an event contract), not “send a Slack message and wait.”</p>

<p>You don’t need to adopt the full Team Topologies framework to benefit from this vocabulary. But when someone asks “who owns this engine?” and “how do teams interact across engine boundaries?”, these terms give you a shared language for the answer.</p>

<h2 id="architecture-as-the-decisions-that-are-hard-to-reverse">Architecture as the Decisions That Are Hard to Reverse</h2>

<p>Not all technical decisions are architectural decisions. Choosing between <code>each</code> and <code>map</code> is a coding decision. Choosing between PostgreSQL and MySQL is an infrastructure decision. But choosing how to decompose your application into components, and how those components communicate – that’s architecture.</p>

<p>Martin’s framing is useful here: architecture is the set of decisions that are <strong>expensive to change later</strong>. Once you’ve built 200 models in a flat <code>app/models/</code> directory with cross-cutting associations, extracting a bounded domain is expensive. Once you’ve deployed five microservices with separate databases, merging them back is expensive. The architectural decisions are the ones that create inertia.</p>

<p>This is why it matters to get them roughly right early, and why Kent Beck’s XP philosophy is so relevant. Beck doesn’t argue for Big Design Up Front – he argues for <strong>simple design</strong> and <strong>refactoring</strong>. Start with the simplest structure that works. Pay attention to the signals the code gives you. When you notice that certain files always change together, that’s the code telling you they belong in the same component. When you notice that a change in one area keeps breaking tests in another, that’s the code telling you there’s a missing boundary.</p>

<p>The art is in recognising those signals and responding to them before the cost of change becomes prohibitive. Rails Engines give you a concrete mechanism for responding – a way to draw a boundary, enforce it structurally, and keep the cost of future changes contained.</p>

<h2 id="a-good-architect-maximizes-the-number-of-decisions-not-made">“A Good Architect Maximizes the Number of Decisions Not Made”</h2>

<p>This quote from Martin is perhaps the most counterintuitive idea in software architecture. We tend to think of architects as people who make decisions. Martin argues they’re people who <em>defer</em> decisions.</p>

<blockquote>
  <p><em>“A good architect pretends that the decision has not been made, and shapes the system such that those decisions can still be deferred or changed for as long as possible. A good architect maximizes the number of decisions not made.”</em></p>
</blockquote>

<p>In practice, this means designing your system so that the choice of database, the choice of web framework, the choice of external service can be changed without rewriting the core business logic. It means building boundaries that protect the important parts of your system from the volatile parts.</p>

<p>In a Rails application, the “important parts” are your business rules – the logic that makes your application valuable. The “volatile parts” are everything else: the web layer, the database schema, the third-party integrations, the admin panel.</p>

<p>When you build an engine for your billing domain, you’re making a specific architectural statement: “Billing is important enough to protect with a boundary. The rest of the application can change without affecting billing, and billing can change without affecting the rest of the application.”</p>

<p>Here’s what a deferred decision looks like in code. Your billing engine needs a payment gateway, but the right choice depends on which markets you’ll launch in – information you don’t have yet:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="n">mattr_accessor</span> <span class="ss">:payment_gateway</span><span class="p">,</span> <span class="ss">default: </span><span class="s2">"Billing::Gateways::Stripe"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The business logic calls <code>Billing.payment_gateway.constantize.new</code> and never mentions Stripe, Adyen, or anyone else by name. (Note: <code>constantize</code> is safe here because the value comes from application configuration, not user input. If the configuration source is untrusted – say, a database field editable by users – use a whitelist lookup instead.) When the business decides to expand into a market where Stripe isn’t available, you write a new gateway class and change one line of configuration. No billing logic changes. No tests break. The decision about which gateway to use was deferred until the last responsible moment, and the cost of changing it stayed low because the boundary kept the dependency pointing inward.</p>

<p>That boundary is itself a deferred decision. By keeping billing isolated in an engine, you’ve deferred the decision about whether billing should be a separate service, a separate application, or remain part of the monolith. You can make that decision later, with more information, at lower cost. The boundary is already drawn.</p>

<p>This is the essence of good architecture: not making the perfect decision now, but structuring the system so that you can make the right decision later.</p>

<hr />

<p><em>In the next chapter, we’ll examine the specific principles from Clean Architecture that inform how we design these boundaries – the Common Closure Principle, the Common Reuse Principle, and the Dependency Rule – and show how each one maps directly to Rails Engine design decisions.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/introduction/">&larr; Introduction</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-02-clean-architecture-for-rubyists/">Clean Architecture for Rubyists &rarr;</a>
</nav>
{% endraw %}
