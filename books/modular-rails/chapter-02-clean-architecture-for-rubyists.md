---
layout: book
book: modular_rails
title: "Clean Architecture for Rubyists"
permalink: /books/modular-rails/chapter-02-clean-architecture-for-rubyists/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-01-why-architecture-matters/">&larr; Why Architecture Matters</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-03-the-hard-parts/">The Hard Parts — Reasoning About Trade-offs &rarr;</a>
</nav>

<h1 id="chapter-2-clean-architecture-for-rubyists">Chapter 2: Clean Architecture for Rubyists</h1>

<blockquote>
  <p><em>“Gather into components those classes that change for the same reasons and at the same times. Separate into different components those classes that change at different times and for different reasons.”</em><br />
– Robert C. Martin, <em>Clean Architecture</em></p>
</blockquote>

<p>Most Ruby developers encounter the SOLID principles at the class level. Single Responsibility for a class. Open-Closed for a module. But Martin’s principles don’t stop at classes – they scale up to components, packages, and entire systems. That’s where they become most powerful, and most relevant to Rails architecture.</p>

<p>This chapter translates each principle to the component level and shows what it means in a Rails application. If you’ve read <em>Clean Code</em> or <em>Clean Architecture</em>, you’ll recognise the ideas. What’s new here is the mapping to Rails – the specific, concrete way these principles manifest in a Ruby codebase and how engines implement them.</p>

<hr />

<h2 id="the-single-responsibility-principle-from-classes-to-modules">The Single Responsibility Principle: From Classes to Modules</h2>

<p>Martin’s mature definition of SRP is often misquoted. It’s not “a class should do only one thing.” The actual definition is:</p>

<blockquote>
  <p><em>“A module should be responsible to one, and only one, actor.”</em></p>
</blockquote>

<p>An “actor” isn’t a user. It’s a group of stakeholders who represent a single business function. The CFO cares about how pay is calculated. The COO cares about how hours are reported. The CTO cares about how data is persisted. These are different actors with different reasons to request changes.</p>

<p>Martin’s canonical example is an <code>Employee</code> class with three methods: <code>calculatePay()</code> (owned by the CFO’s team), <code>reportHours()</code> (owned by the COO’s team), and <code>save()</code> (owned by the CTO’s team). If the CFO requests a change to pay calculation, and that change accidentally breaks hour reporting, the COO’s team is furious – and rightly so. The violation wasn’t technical. It was organisational.</p>

<h3 id="the-rails-user-model-problem">The Rails User Model Problem</h3>

<p>Every Rails application has a <code>User</code> model. And in every Rails application that’s been around for more than a year, that model has become a dumping ground:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="c1"># Authentication (security team)</span>
  <span class="n">has_secure_password</span>
  <span class="n">validates</span> <span class="ss">:email</span><span class="p">,</span> <span class="ss">uniqueness: </span><span class="kp">true</span>
  <span class="k">def</span> <span class="nf">generate_reset_token</span><span class="p">;</span> <span class="k">end</span>

  <span class="c1"># Billing (finance team)</span>
  <span class="n">has_many</span> <span class="ss">:invoices</span>
  <span class="n">has_many</span> <span class="ss">:subscriptions</span>
  <span class="k">def</span> <span class="nf">current_plan</span><span class="p">;</span> <span class="k">end</span>
  <span class="k">def</span> <span class="nf">billing_email</span><span class="p">;</span> <span class="k">end</span>

  <span class="c1"># Notifications (product team)</span>
  <span class="n">has_many</span> <span class="ss">:notifications</span>
  <span class="n">has_many</span> <span class="ss">:notification_preferences</span>
  <span class="k">def</span> <span class="nf">notify</span><span class="p">(</span><span class="n">message</span><span class="p">);</span> <span class="k">end</span>

  <span class="c1"># Team management (operations team)</span>
  <span class="n">has_many</span> <span class="ss">:team_memberships</span>
  <span class="n">has_many</span> <span class="ss">:teams</span><span class="p">,</span> <span class="ss">through: :team_memberships</span>
  <span class="k">def</span> <span class="nf">admin_of?</span><span class="p">(</span><span class="n">team</span><span class="p">);</span> <span class="k">end</span>

  <span class="c1"># Reporting (data team)</span>
  <span class="n">scope</span> <span class="ss">:active_in_period</span><span class="p">,</span> <span class="o">-&gt;</span><span class="p">(</span><span class="n">start</span><span class="p">,</span> <span class="n">finish</span><span class="p">)</span> <span class="p">{</span> <span class="o">...</span> <span class="p">}</span>
  <span class="n">scope</span> <span class="ss">:churned</span><span class="p">,</span> <span class="o">-&gt;</span> <span class="p">{</span> <span class="o">...</span> <span class="p">}</span>
  <span class="k">def</span> <span class="nf">lifetime_value</span><span class="p">;</span> <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This model serves five different actors. When the finance team needs to change how billing emails work, they’re editing the same file the security team edits for authentication. When the data team adds a new reporting scope, they risk merge conflicts with the product team’s notification changes.</p>

<p>At the class level, the standard Rails fix is to extract concerns:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Authenticatable</span>
  <span class="kp">include</span> <span class="no">Billable</span>
  <span class="kp">include</span> <span class="no">Notifiable</span>
  <span class="kp">include</span> <span class="no">TeamMember</span>
  <span class="kp">include</span> <span class="no">Reportable</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Better. The code is organised. But the concerns still live in <code>app/models/concerns/</code>, they still share the same test suite, and they still deploy together. A change to <code>Billable</code> still requires running the full test suite because there’s no structural boundary between billing and authentication.</p>

<p>At the component level, the fix is different. Billing becomes an engine. The engine defines a <code>Billable</code> concern that the host app’s <code>User</code> includes. The billing logic – models, services, controllers, tests – lives in <code>engines/billing/</code>. A change to billing logic means running the billing engine’s tests. The SRP is enforced not by code organisation, but by structural boundaries.</p>

<p>This is Martin’s point scaled up: <strong>at the class level, SRP means one reason to change per class. At the component level, it means one reason to change per component.</strong> Rails Engines are the mechanism for implementing SRP at the component level.</p>

<hr />

<h2 id="the-common-closure-principle">The Common Closure Principle</h2>

<blockquote>
  <p><em>“Gather into components those classes that change for the same reasons and at the same times. Separate into different components those classes that change at different times and for different reasons.”</em></p>
</blockquote>

<p>This is the SRP restated for components. It answers the question: “which classes should go in the same engine?”</p>

<p>The answer: classes that change together.</p>

<h3 id="reading-your-git-history">Reading your git history</h3>

<p>Your git history already contains the answer to this question. You just need to ask it.</p>

<p>Consider a simplified git log:</p>

<pre><code>commit a1b2c3  "Update invoice calculation for tax changes"
  M app/models/invoice.rb
  M app/services/invoice_generator.rb
  M app/models/subscription.rb
  M spec/models/invoice_spec.rb

commit d4e5f6  "Add email notification for failed payments"
  M app/models/invoice.rb
  M app/mailers/billing_mailer.rb
  M app/services/payment_processor.rb
  M spec/mailers/billing_mailer_spec.rb

commit g7h8i9  "Fix notification preference toggle"
  M app/models/notification_preference.rb
  M app/controllers/notification_preferences_controller.rb
  M spec/models/notification_preference_spec.rb
</code></pre>

<p>The first two commits touch billing-related files together. The third commit touches notification files that never appear in billing commits. The CCP says: <code>Invoice</code>, <code>InvoiceGenerator</code>, <code>Subscription</code>, <code>BillingMailer</code>, and <code>PaymentProcessor</code> belong in the same component. <code>NotificationPreference</code> and its controller belong in a different one.</p>

<p>Co-change analysis – counting how often pairs of files appear in the same commit – turns this intuition into data. Files with high co-change frequency belong in the same engine; files that rarely change together belong in different engines. We’ll build the complete co-change analysis tool in Chapter 9.</p>

<p>The CCP isn’t a theoretical exercise – it’s a measurable property of your codebase.</p>

<hr />

<h2 id="the-common-reuse-principle">The Common Reuse Principle</h2>

<blockquote>
  <p><em>“Don’t force users of a component to depend on things they don’t need.”</em></p>
</blockquote>

<p>This is the Interface Segregation Principle restated for components. It answers the opposite question: “which classes should <em>not</em> be in the same engine?”</p>

<p>If a host application needs the billing engine’s <code>Invoice</code> model, it shouldn’t be forced to also load the billing engine’s <code>PaymentGateway</code> adapter, PDF generator, and Stripe webhook handler. If those unrelated pieces change, the host app shouldn’t need to rebuild or retest.</p>

<p>In practice, this means engines should be focused. A billing engine that also handles user onboarding and email campaigns has violated the CRP. The host app can’t use billing without dragging in onboarding and campaigns.</p>

<h3 id="the-tension-triangle">The tension triangle</h3>

<p>Martin describes a tension between three principles:</p>

<ul>
  <li><strong>CCP</strong> says: group classes that change together (makes components larger)</li>
  <li><strong>CRP</strong> says: don’t force dependencies on things you don’t need (makes components smaller)</li>
  <li><strong>REP</strong> (Reuse-Release Equivalence) says: components should be releasable as a cohesive unit</li>
</ul>

<div class="diagram"><img src="/img/books/modular-rails/d84659c16e6e5041eac63468f5b1413b025550642752c84a372bf3300d5b4283.svg" alt="Mermaid diagram: &lt;b&gt;CCP&lt;/b&gt;\nGroup what changes together\n&lt;i&gt;(makes components larger)&lt;/i&gt;"></div>

<p>These pull in different directions. A component that follows CCP strictly might become too large, violating CRP. A component that follows CRP strictly might become so small that it’s impractical to release.</p>

<p>Martin’s advice: <strong>in early development, favour CCP.</strong> Group by change reason. Get the boundaries roughly right. As the system matures and reuse becomes important, shift toward CRP – split components that have grown too large.</p>

<p>For Rails, this means: start with a billing engine that contains everything billing-related, even if some of it could be separated. Later, if you find that the payment gateway adapter is reused independently across multiple applications, extract it into its own gem. Don’t optimise for reuse until reuse actually happens.</p>

<h3 id="when-a-gem-is-the-crps-natural-conclusion">When a gem is the CRP’s natural conclusion</h3>

<p>Notice that the extraction target above is a <strong>gem</strong>, not another engine. This is deliberate. The CRP says: don’t force consumers to depend on things they don’t need. If your quoting tool only needs pricing logic, forcing it to depend on a Rails Engine – with its Active Record models, migration infrastructure, route definitions, and dummy app – violates the principle. A plain Ruby gem carries none of that baggage.</p>

<p>Gems are the purest expression of the CRP in Ruby. They package exactly what’s needed, nothing more. A pricing gem has no opinion about your database, your framework, or your test infrastructure. It’s reusable across Rails apps, Sinatra services, CLI tools, and background workers – because it depends on nothing it doesn’t use.</p>

<p>The progression looks like this:</p>

<ol>
  <li><strong>Start inside the engine.</strong> Pricing logic lives in <code>engines/billing/app/services/billing/calculator.rb</code>. It changes alongside invoices, subscriptions, and payment processing. CCP is satisfied.</li>
  <li><strong>Notice the tension.</strong> A second application needs the same pricing rules. You’re tempted to add the billing engine as a dependency, but that drags in Active Record, Stripe integration, and invoice models that the second app doesn’t need. CRP is violated.</li>
  <li><strong>Extract the gem.</strong> Pull the pricing logic into <code>acme_pricing</code> – a plain Ruby gem with no Rails dependency. Both applications depend on the gem. The billing engine calls it for invoice calculations. The quoting tool calls it for estimates. Each consumer gets exactly what it needs.</li>
</ol>

<p>This isn’t hypothetical. It’s the Reuse-Release Equivalence Principle (REP) at work: a component that’s reused across multiple consumers should be independently releasable. A gem with semantic versioning satisfies REP naturally – a version bump signals intent, and consumers upgrade on their own schedule.</p>

<p>The key judgement call is <em>when</em> to extract. Too early and you’re maintaining a separate gem for code that only has one consumer. Too late and you’ve got duplicated logic diverging across applications. The evidence-based approach: extract when the second consumer appears and the domain has stabilised enough that the gem’s API won’t churn.</p>

<blockquote>
  <p><strong>Checkpoint</strong> — You’ve now covered the three cohesion principles that determine what goes inside a component: SRP (one reason to change), CCP (group what changes together), and CRP (don’t bundle unrelated things). The remaining sections cover how dependencies flow between components – the Dependency Rule, boundaries, and stability. Good point for a break if you need one.</p>
</blockquote>

<hr />

<h2 id="the-dependency-rule">The Dependency Rule</h2>

<blockquote>
  <p><em>“Source code dependencies can only point inwards.”</em></p>
</blockquote>

<p>This is the core rule of Clean Architecture. In the concentric circles diagram, inner layers (business rules) know nothing about outer layers (frameworks, databases, web). Dependencies point from the volatile toward the stable, from the specific toward the abstract.</p>

<div class="diagram"><img src="/img/books/modular-rails/b5ee1c251c9725839edf6ce40038ee0cfe98dd6f2e5d41dc1b23ea61afee2e41.svg" alt="Mermaid diagram: Frameworks &amp; Drivers\n(Rails, Devise, Stripe)"></div>

<p><em>Source code dependencies point inward. Outer layers know about inner layers, never the reverse.</em></p>

<p>In a Rails application, this translates to a practical question: <strong>which way do the dependencies between your engines point?</strong></p>

<p>Consider three engines: <code>core</code> (shared domain concepts), <code>billing</code> (invoicing and payments), and <code>notifications</code> (email and push notifications).</p>

<div class="diagram"><img src="/img/books/modular-rails/ceac4f2c125c3c96412b1e4f93806a6f49969c2a88f2f15b9d516f0eceaf9aeb.svg" alt="Mermaid diagram: core&lt;br/&gt;&lt;i&gt;Stable — depended upon by others&lt;/i&gt;"></div>

<p><code>billing</code> depends on <code>core</code>. <code>notifications</code> depends on <code>core</code>. But <code>billing</code> should <strong>not</strong> depend on <code>notifications</code>, and <code>notifications</code> should <strong>not</strong> depend on <code>billing</code>. If billing needs to send a notification after an invoice is generated, it shouldn’t call <code>Notifications::Notifier.send(...)</code> directly. That would create a dependency from billing to notifications – and now a change in notifications can break billing.</p>

<p>Instead, billing publishes an event:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="n">after_create</span> <span class="ss">:publish_creation_event</span>

    <span class="kp">private</span>

    <span class="k">def</span> <span class="nf">publish_creation_event</span>
      <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span>
        <span class="s2">"invoice.created.billing"</span><span class="p">,</span>
        <span class="ss">invoice_id: </span><span class="nb">id</span><span class="p">,</span>
        <span class="ss">recipient_id: </span><span class="n">subscription</span><span class="p">.</span><span class="nf">user_id</span>
      <span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>And the notification engine subscribes:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/config/initializers/billing_events.rb</span>

<span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">event</span><span class="o">|</span>
  <span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span>
    <span class="ss">recipient_type: </span><span class="s2">"User"</span><span class="p">,</span>
    <span class="ss">recipient_id: </span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:recipient_id</span><span class="p">],</span>
    <span class="ss">subject: </span><span class="s2">"New invoice generated"</span><span class="p">,</span>
    <span class="ss">body: </span><span class="s2">"Invoice #</span><span class="si">#{</span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:invoice_id</span><span class="p">]</span><span class="si">}</span><span class="s2"> has been created."</span>
  <span class="p">)</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Billing doesn’t know notifications exist. Notifications knows that billing events happen. The dependency points one way. If you remove the notification engine entirely, billing keeps working. The event fires into the void and nothing subscribes to it. No errors, no broken tests, no coupling.</p>

<p>This is the Dependency Rule in practice. It’s not abstract – it’s a concrete design decision about which engine references which.</p>

<hr />

<h2 id="boundaries-plugins-and-the-concentric-circles">Boundaries, Plugins, and the Concentric Circles</h2>

<p>Martin’s Clean Architecture diagram shows concentric circles: Entities at the centre, Use Cases around them, Interface Adapters further out, and Frameworks &amp; Drivers at the edge. The rule: dependencies point inward. Nothing in an inner circle knows about an outer circle.</p>

<div class="diagram"><img src="/img/books/modular-rails/57e8f7dcd2699d1ccee8b68df1fcfe65a5c5bac70693442de31ccffe01c5cc3f.svg" alt="Mermaid diagram: Frameworks &amp; Drivers"></div>

<p>In a Rails application, the circles don’t map perfectly, because Rails is intentionally opinionated about merging layers (Active Record combines entities with persistence, controllers combine adapters with framework). But the spirit of the principle still applies:</p>

<p><strong>Your business rules should not depend on your web framework.</strong></p>

<p>This doesn’t mean abandoning Active Record. It means your billing engine’s <code>Invoice</code> model should express billing rules (tax calculation, proration, line item totals) without depending on controller concerns, view helpers, or request-specific state. The model is the inner circle. The controller is the outer circle.</p>

<h3 id="the-plugin-idea">The plugin idea</h3>

<p>Martin’s most powerful architectural idea: <strong>all low-level details should be plugins.</strong> The database is a plugin. The web framework is a plugin. The admin panel is a plugin.</p>

<p>Rails Engines are literally plugins. They plug into the host application at a specific mount point. They can be added, removed, or replaced without rewriting the host application. The admin panel is an engine (ActiveAdmin). The authentication system is an engine (Devise). Your billing domain can be an engine too.</p>

<p>The plugin architecture isn’t aspirational in Rails. It’s how the framework was built. Solid Queue is a plugin. Solid Cache is a plugin. Solid Cable is a plugin. These are all Rails Engines included as default gems in Rails 8 applications, and they can all be swapped for alternatives without touching your application code.</p>

<p>Your domain engines follow the same pattern. Billing is a plugin. Notifications is a plugin. Reporting is a plugin. Each plugs in, each can be developed independently, each can be replaced if the business needs change.</p>

<blockquote>
  <p><strong>Checkpoint</strong> — You’ve covered the Dependency Rule (dependencies point inward) and the plugin architecture that makes Rails Engines a natural fit for Clean Architecture boundaries. The last two sections on stability principles are shorter and bring everything together. Nearly there.</p>
</blockquote>

<h3 id="alternative-lenses-hexagonal-and-screaming-architecture">Alternative Lenses: Hexagonal and Screaming Architecture</h3>

<p>Clean Architecture isn’t the only way to frame these ideas. Two related concepts are worth knowing because you’ll encounter them in discussions and literature:</p>

<p><strong>Hexagonal Architecture (Ports and Adapters)</strong>, coined by Alistair Cockburn, describes the same dependency direction differently. Your domain logic sits at the centre. It communicates with the outside world through <strong>ports</strong> (interfaces) and <strong>adapters</strong> (implementations). The database adapter, the web adapter, and the email adapter are all interchangeable plugins around the core.</p>

<p>In Rails engine terms: the engine’s public concern (like <code>Billable</code>) is a port. The host app’s <code>User</code> model including that concern is an adapter. The event system from Pattern 5 (covered in Chapter 8) is a port; the subscriber that processes events is an adapter. You’re already building hexagonal architecture – you just call the ports “concerns” and the adapters “initializers.”</p>

<p>Clean Architecture and Hexagonal Architecture describe the same dependency direction. Clean Architecture draws concentric circles; Hexagonal Architecture draws a hexagon with ports. The insight is identical: dependencies point inward, and the core doesn’t know about the periphery.</p>

<p><strong>Screaming Architecture</strong>, another concept from Robert C. Martin, says your project’s directory structure should scream the business domain, not the framework. A Rails <code>app/</code> directory with <code>models/</code>, <code>controllers/</code>, <code>views/</code> screams “I’m a Rails app.” A directory with <code>engines/billing/</code>, <code>engines/notifications/</code>, <code>engines/reporting/</code> screams “I’m a business that does billing, notifications, and reporting.”</p>

<p>This is the practical payoff of the engine approach. Open the <code>engines/</code> directory and you see the business. Open <code>app/models/</code> and you see Rails conventions. Both are organised, but only one tells you what the application actually does.</p>

<hr />

<h2 id="the-stable-dependencies-principle">The Stable Dependencies Principle</h2>

<blockquote>
  <p><em>“Depend in the direction of stability.”</em></p>
</blockquote>

<p>A component that many other components depend on is stable – it’s hard to change because changes ripple outward. A component that depends on many others is unstable – it changes frequently as its dependencies evolve.</p>

<p>The rule: unstable components should depend on stable ones. Never the reverse.</p>

<p>In a Rails application with engines, this means your <code>core</code> or <code>shared</code> engine (the one that defines base models, common concerns, shared utilities) should be the most stable. It changes rarely. Other engines depend on it.</p>

<p>Your feature engines – billing, notifications, reporting – are less stable. They change as business requirements evolve. They depend on core, but core should never depend on them.</p>

<p>If you find that your core engine needs to reference a billing model, something is wrong. That dependency is pointing the wrong way. Invert it: billing should expose a concern or interface that core can consume without knowing about billing specifically.</p>

<hr />

<h2 id="the-stable-abstractions-principle">The Stable Abstractions Principle</h2>

<blockquote>
  <p><em>“A component should be as abstract as it is stable.”</em></p>
</blockquote>

<p>Stable components should be abstract – consisting of interfaces and base classes that can be extended without modification. Unstable components should be concrete – containing implementation details that change freely.</p>

<p>In Ruby, “abstract” doesn’t mean Java-style abstract classes. It means concerns, duck types, and configuration interfaces:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/core/app/models/concerns/core/payable.rb</span>

<span class="k">module</span> <span class="nn">Core</span>
  <span class="k">module</span> <span class="nn">Payable</span>
    <span class="kp">extend</span> <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Concern</span>

    <span class="c1"># This is the abstract interface.</span>
    <span class="c1"># Any engine that deals with payments includes this concern</span>
    <span class="c1"># and implements the required methods.</span>

    <span class="k">def</span> <span class="nf">payment_amount</span>
      <span class="k">raise</span> <span class="no">NotImplementedError</span><span class="p">,</span> <span class="s2">"</span><span class="si">#{</span><span class="nb">self</span><span class="p">.</span><span class="nf">class</span><span class="si">}</span><span class="s2"> must implement #payment_amount"</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">payment_description</span>
      <span class="k">raise</span> <span class="no">NotImplementedError</span><span class="p">,</span> <span class="s2">"</span><span class="si">#{</span><span class="nb">self</span><span class="p">.</span><span class="nf">class</span><span class="si">}</span><span class="s2"> must implement #payment_description"</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The core engine defines the interface. The billing engine provides the implementation:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="kp">include</span> <span class="no">Core</span><span class="o">::</span><span class="no">Payable</span>

    <span class="k">def</span> <span class="nf">payment_amount</span>
      <span class="n">line_items</span><span class="p">.</span><span class="nf">sum</span><span class="p">(</span><span class="ss">:amount_cents</span><span class="p">)</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">payment_description</span>
      <span class="s2">"Invoice #</span><span class="si">#{</span><span class="n">number</span><span class="si">}</span><span class="s2"> - </span><span class="si">#{</span><span class="n">due_date</span><span class="p">.</span><span class="nf">strftime</span><span class="p">(</span><span class="s1">'%B %Y'</span><span class="p">)</span><span class="si">}</span><span class="s2">"</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Core is stable and abstract. Billing is unstable and concrete. The dependency points from unstable to stable, from concrete to abstract. This is the Stable Abstractions Principle in Ruby.</p>

<hr />

<h2 id="mapping-these-ideas-to-a-rails-application">Mapping These Ideas to a Rails Application</h2>

<p>Let’s bring it all together. Here’s how Clean Architecture’s component principles map to a Rails application with engines:</p>

<table>
  <thead>
    <tr>
      <th>Principle</th>
      <th>Question It Answers</th>
      <th>Rails Implementation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>SRP (component level)</strong></td>
      <td>How many reasons does this engine have to change?</td>
      <td>Each engine serves one business domain, one set of stakeholders</td>
    </tr>
    <tr>
      <td><strong>CCP</strong></td>
      <td>Which classes change together?</td>
      <td>Git history reveals co-change patterns; these files belong in the same engine</td>
    </tr>
    <tr>
      <td><strong>CRP</strong></td>
      <td>What can I remove without breaking users of this engine?</td>
      <td>Keep engines focused; split when unrelated concerns get bundled together</td>
    </tr>
    <tr>
      <td><strong>Dependency Rule</strong></td>
      <td>Which way do dependencies point?</td>
      <td>Engines depend on core, not on each other; use events for cross-engine communication</td>
    </tr>
    <tr>
      <td><strong>SDP</strong></td>
      <td>Am I depending on something that changes a lot?</td>
      <td>Core/shared engines are stable; feature engines are unstable; dependencies point toward stability</td>
    </tr>
    <tr>
      <td><strong>SAP</strong></td>
      <td>Are my stable components abstract enough to extend?</td>
      <td>Core engine defines concerns and interfaces; feature engines provide implementations</td>
    </tr>
  </tbody>
</table>

<p>These aren’t rules to memorise. They’re questions to ask when you’re deciding where to draw a boundary, what goes inside it, and how components communicate across it. The principles give you a vocabulary for architectural decisions that would otherwise be gut feelings.</p>

<hr />

<p><em>In the next chapter, we’ll add another lens: Neal Ford and Mark Richards’ trade-off analysis from Software Architecture: The Hard Parts. Not every decision has a clean answer, and the Hard Parts framework gives us tools for reasoning about the messy ones.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-01-why-architecture-matters/">&larr; Why Architecture Matters</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-03-the-hard-parts/">The Hard Parts — Reasoning About Trade-offs &rarr;</a>
</nav>
{% endraw %}
