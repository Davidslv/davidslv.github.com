---
layout: book
book: modular_rails
title: "Engine Integration Patterns"
permalink: /books/modular-rails/chapter-08-engine-integration-patterns/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-07-building-your-first-engine/">&larr; Building Your First Engine</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-09-identifying-boundaries/">Identifying Boundaries in an Existing Application &rarr;</a>
</nav>

<h1 id="chapter-8-engine-integration-patterns">Chapter 8: Engine Integration Patterns</h1>

<p>Your engine works in isolation. It has models, controllers, routes, and a passing test suite. Now it needs to talk to the host application – and potentially to other engines. This is where most people get it wrong.</p>

<p>The temptation is to take shortcuts: reach directly into the host app’s models, hardcode a class name, call a method on a foreign object. Every shortcut is a crack in the boundary you just built. This chapter catalogues the patterns that keep boundaries clean.</p>

<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Pattern</th>
      <th>When to use</th>
      <th>Mechanism</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>1</td>
      <td><strong>Concern-Based Integration</strong></td>
      <td>Engine adds behaviour to host models</td>
      <td>Host model includes engine concern</td>
    </tr>
    <tr>
      <td>2</td>
      <td><strong>Configuration &amp; Dependency Inversion</strong></td>
      <td>Engine needs a host class or value</td>
      <td><code>mattr_accessor</code> with host app initializer</td>
    </tr>
    <tr>
      <td>3</td>
      <td><strong>Configurable Base Controllers</strong></td>
      <td>Engine controllers need host auth/layout</td>
      <td>Configurable parent controller class</td>
    </tr>
    <tr>
      <td>4</td>
      <td><strong>Engine Initializers &amp; Lifecycle Hooks</strong></td>
      <td>Engine wires into Rails boot process</td>
      <td><code>on_load</code> hooks and initializers</td>
    </tr>
    <tr>
      <td>5</td>
      <td><strong>Event-Based Communication</strong></td>
      <td>Engine A triggers behaviour in Engine B</td>
      <td><code>ActiveSupport::Notifications</code> pub/sub</td>
    </tr>
    <tr>
      <td>6</td>
      <td><strong>Shared Kernel</strong></td>
      <td>Multiple engines share common concerns</td>
      <td>Core engine with shared abstractions</td>
    </tr>
    <tr>
      <td>7</td>
      <td><strong>Authentication &amp; Authorisation</strong></td>
      <td>Engine actions check identity &amp; permissions</td>
      <td>Auth inherited from host, policies owned by engine</td>
    </tr>
    <tr>
      <td>8</td>
      <td><strong>Background Jobs Across Boundaries</strong></td>
      <td>Event triggers slow work in another engine</td>
      <td>Job lives in engine that owns the work</td>
    </tr>
  </tbody>
</table>

<hr />

<h2 id="pattern-1-concern-based-integration">Pattern 1: Concern-Based Integration</h2>

<p>This is the primary pattern. The engine defines a concern. The host app includes it.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/concerns/billing/billable.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">Billable</span>
    <span class="kp">extend</span> <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Concern</span>

    <span class="n">included</span> <span class="k">do</span>
      <span class="n">has_many</span> <span class="ss">:invoices</span><span class="p">,</span>
               <span class="ss">class_name: </span><span class="s2">"Billing::Invoice"</span><span class="p">,</span>
               <span class="ss">foreign_key: :user_id</span><span class="p">,</span>
               <span class="ss">dependent: :destroy</span>

      <span class="n">has_many</span> <span class="ss">:subscriptions</span><span class="p">,</span>
               <span class="ss">class_name: </span><span class="s2">"Billing::Subscription"</span><span class="p">,</span>
               <span class="ss">foreign_key: :user_id</span><span class="p">,</span>
               <span class="ss">dependent: :destroy</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">current_subscription</span>
      <span class="n">subscriptions</span><span class="p">.</span><span class="nf">active</span><span class="p">.</span><span class="nf">order</span><span class="p">(</span><span class="ss">created_at: :desc</span><span class="p">).</span><span class="nf">first</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">active_plan</span>
      <span class="n">current_subscription</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">plan</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">billable?</span>
      <span class="n">subscriptions</span><span class="p">.</span><span class="nf">active</span><span class="p">.</span><span class="nf">any?</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Host app: app/models/user.rb</span>

<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The engine provides behaviour. The host app decides who gets it. The engine never references <code>User</code> directly – it uses <code>foreign_key: :user_id</code> so the host app decides which model includes the concern.</p>

<div class="diagram"><img src="/img/books/modular-rails/5cf7fdb474eea627479f214a4990d86ce86c840c5f9069d9dc8867d673a554bc.svg" alt="Mermaid diagram: Billing Engine"></div>

<h3 id="why-this-pattern-works">Why this pattern works</h3>

<ul>
  <li><strong>The engine is in control of the interface.</strong> It defines what methods and associations exist.</li>
  <li><strong>The host app opts in.</strong> Including a concern is a deliberate choice, visible in the model file.</li>
  <li><strong>The coupling is minimal.</strong> The engine depends on <code>ActiveSupport::Concern</code> and Active Record associations. It doesn’t depend on any specific host app class.</li>
  <li><strong>It’s testable in isolation.</strong> The engine’s specs test the concern against a dummy model in the dummy app.</li>
</ul>

<h3 id="testing-concerns-in-the-engine">Testing concerns in the engine</h3>

<p>Create a minimal model in the dummy app that includes the concern:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/test/dummy/app/models/user.rb</span>

<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/models/billing/billable_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="no">User</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span><span class="ss">email: </span><span class="s2">"test@example.com"</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">describe</span> <span class="s2">"#current_subscription"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"returns the most recent active subscription"</span> <span class="k">do</span>
      <span class="n">old</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">,</span> <span class="ss">created_at: </span><span class="mi">1</span><span class="p">.</span><span class="nf">week</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>
      <span class="n">current</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">,</span> <span class="ss">created_at: </span><span class="mi">1</span><span class="p">.</span><span class="nf">hour</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>

      <span class="n">expect</span><span class="p">(</span><span class="n">user</span><span class="p">.</span><span class="nf">current_subscription</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="n">current</span><span class="p">)</span>
    <span class="k">end</span>

    <span class="n">it</span> <span class="s2">"returns nil when there are no active subscriptions"</span> <span class="k">do</span>
      <span class="n">expect</span><span class="p">(</span><span class="n">user</span><span class="p">.</span><span class="nf">current_subscription</span><span class="p">).</span><span class="nf">to</span> <span class="n">be_nil</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The dummy app’s <code>User</code> model is a lightweight stand-in. It exists only to test the concern. It doesn’t need authentication, notification preferences, or any other real-world complexity.</p>

<hr />

<h2 id="pattern-2-configuration-and-dependency-inversion">Pattern 2: Configuration and Dependency Inversion</h2>

<p>When the engine needs to reference a host app concept without hardcoding it, use configuration.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing.rb</span>

<span class="nb">require</span> <span class="s2">"billing/version"</span>
<span class="nb">require</span> <span class="s2">"billing/engine"</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="n">mattr_accessor</span> <span class="ss">:customer_class</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">customer_class</span> <span class="o">=</span> <span class="s2">"User"</span>

  <span class="n">mattr_accessor</span> <span class="ss">:currency</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">currency</span> <span class="o">=</span> <span class="s2">"GBP"</span>

  <span class="n">mattr_accessor</span> <span class="ss">:tax_rate</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">tax_rate</span> <span class="o">=</span> <span class="mf">0.20</span>

  <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">customer_model</span>
    <span class="n">customer_class</span><span class="p">.</span><span class="nf">constantize</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Host app: config/initializers/billing.rb</span>

<span class="no">Billing</span><span class="p">.</span><span class="nf">customer_class</span> <span class="o">=</span> <span class="s2">"User"</span>
<span class="no">Billing</span><span class="p">.</span><span class="nf">currency</span> <span class="o">=</span> <span class="s2">"GBP"</span>
<span class="no">Billing</span><span class="p">.</span><span class="nf">tax_rate</span> <span class="o">=</span> <span class="mf">0.20</span>
</code></pre></div></div>

<p>Inside the engine, use the configuration instead of hardcoded references:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="n">belongs_to</span> <span class="ss">:customer</span><span class="p">,</span> <span class="ss">polymorphic: </span><span class="kp">true</span>

    <span class="k">def</span> <span class="nf">customer_email</span>
      <span class="n">customer</span><span class="p">.</span><span class="nf">try</span><span class="p">(</span><span class="ss">:email</span><span class="p">)</span> <span class="o">||</span> <span class="n">customer</span><span class="p">.</span><span class="nf">try</span><span class="p">(</span><span class="ss">:billing_email</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The engine knows there’s a customer. It doesn’t know (or care) whether that customer is a <code>User</code>, an <code>Organisation</code>, or a <code>Team</code>.</p>

<h3 id="when-to-use-configuration-vs-concerns">When to use configuration vs concerns</h3>

<p><strong>Use a concern</strong> when the engine adds behaviour to a host app model (associations, methods, callbacks).</p>

<p><strong>Use configuration</strong> when the engine needs to know about a host app class or value but doesn’t add behaviour to it.</p>

<p>Most engines use both: a concern for the behaviour and configuration for the wiring.</p>

<hr />

<h2 id="pattern-3-configurable-base-controllers">Pattern 3: Configurable Base Controllers</h2>

<p>By default, engine controllers inherit from <code>ActionController::Base</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">ActionController</span><span class="o">::</span><span class="no">Base</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This means engine controllers don’t have access to the host app’s authentication, layouts, or before_actions. Often you want them to. The solution is a configurable parent class:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="n">mattr_accessor</span> <span class="ss">:parent_controller</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ActionController::Base"</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/application_controller.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="c1"># WARNING: constantize runs at class definition time. If the host app's</span>
  <span class="c1"># initializer hasn't set parent_controller yet, this resolves the default.</span>
  <span class="c1"># Ensure the initializer runs before this file is loaded (Rails initializers</span>
  <span class="c1"># run before autoload by default, so this is safe in practice).</span>
  <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span><span class="p">.</span><span class="nf">constantize</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Host app: config/initializers/billing.rb</span>

<span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ApplicationController"</span>
</code></pre></div></div>

<p>Now the engine’s controllers inherit from the host app’s <code>ApplicationController</code>, gaining authentication (<code>current_user</code>), layouts, CSRF protection, and any before_actions defined there – without the engine hardcoding that dependency.</p>

<p>The same pattern works for API controllers:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="no">Billing</span><span class="p">.</span><span class="nf">api_base_controller</span> <span class="o">=</span> <span class="s2">"Api::V1::AuthenticatedController"</span>
</code></pre></div></div>

<hr />

<h2 id="pattern-4-engine-initializers-and-lifecycle-hooks">Pattern 4: Engine Initializers and Lifecycle Hooks</h2>

<p>Engines participate in Rails’ boot process through initializers. Use them to wire the engine into the host app’s infrastructure.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing/engine.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Billing</span>

    <span class="c1"># Run after the host app loads Active Record</span>
    <span class="n">initializer</span> <span class="s2">"billing.configure_active_record"</span> <span class="k">do</span>
      <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:active_record</span><span class="p">)</span> <span class="k">do</span>
        <span class="c1"># Any AR-level configuration</span>
      <span class="k">end</span>
    <span class="k">end</span>

    <span class="c1"># Inject helpers into the host app's views</span>
    <span class="n">initializer</span> <span class="s2">"billing.helpers"</span> <span class="k">do</span>
      <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:action_view</span><span class="p">)</span> <span class="k">do</span>
        <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">InvoiceHelper</span>
      <span class="k">end</span>
    <span class="k">end</span>

    <span class="c1"># Register admin panel resources (if using ActiveAdmin)</span>
    <span class="n">initializer</span> <span class="s2">"billing.active_admin"</span> <span class="k">do</span>
      <span class="k">if</span> <span class="k">defined?</span><span class="p">(</span><span class="no">ActiveAdmin</span><span class="p">)</span>
        <span class="no">ActiveAdmin</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">load_paths</span> <span class="o">+=</span> <span class="no">Dir</span><span class="p">[</span><span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"app/admin"</span><span class="p">)]</span>
      <span class="k">end</span>
    <span class="k">end</span>

    <span class="c1"># Add the engine's locale files</span>
    <span class="n">initializer</span> <span class="s2">"billing.i18n"</span> <span class="k">do</span>
      <span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"config/locales/**/*.{rb,yml}"</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">path</span><span class="o">|</span>
        <span class="no">I18n</span><span class="p">.</span><span class="nf">load_path</span> <span class="o">&lt;&lt;</span> <span class="n">path</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="key-lifecycle-hooks">Key lifecycle hooks</h3>

<ul>
  <li><strong><code>ActiveSupport.on_load(:active_record)</code></strong> – runs when Active Record is loaded. Use for AR configuration.</li>
  <li><strong><code>ActiveSupport.on_load(:action_controller_base)</code></strong> – runs when ActionController::Base is loaded. Use for controller concerns.</li>
  <li><strong><code>ActiveSupport.on_load(:action_view)</code></strong> – runs when ActionView is loaded. Use for helper injection.</li>
  <li><strong><code>config.to_prepare</code></strong> – runs on every request in development, once in production. Use for code that needs the full app environment.</li>
  <li><strong><code>config.after_initialize</code></strong> – runs after the entire app is initialised. Use for setup that depends on all engines being loaded.</li>
</ul>

<p>The <code>on_load</code> hooks are lazy – they only fire when the relevant framework component is loaded. This keeps the engine lightweight and avoids unnecessary eager loading.</p>

<hr />

<h2 id="pattern-5-event-based-cross-engine-communication">Pattern 5: Event-Based Cross-Engine Communication</h2>

<p>When Engine A needs to trigger behaviour in Engine B without depending on it, use events.</p>

<p>Rails ships with <code>ActiveSupport::Notifications</code>, which provides a publish/subscribe mechanism. It’s simple, synchronous, and requires no additional dependencies.</p>

<h3 id="publishing-events">Publishing events</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="n">after_create_commit</span> <span class="ss">:publish_created_event</span>
    <span class="n">after_commit</span> <span class="ss">:publish_paid_event</span><span class="p">,</span> <span class="ss">on: :update</span><span class="p">,</span> <span class="ss">if: :saved_change_to_paid_at?</span>

    <span class="kp">private</span>

    <span class="k">def</span> <span class="nf">publish_created_event</span>
      <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">,</span> <span class="p">{</span>
        <span class="ss">invoice_id: </span><span class="nb">id</span><span class="p">,</span>
        <span class="ss">customer_id: </span><span class="n">customer_id</span><span class="p">,</span>
        <span class="ss">customer_type: </span><span class="n">customer_type</span><span class="p">,</span>
        <span class="ss">amount_cents: </span><span class="n">amount_cents</span><span class="p">,</span>
        <span class="ss">currency: </span><span class="n">currency</span>
      <span class="p">})</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">publish_paid_event</span>
      <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"invoice.paid.billing"</span><span class="p">,</span> <span class="p">{</span>
        <span class="ss">invoice_id: </span><span class="nb">id</span><span class="p">,</span>
        <span class="ss">customer_id: </span><span class="n">customer_id</span><span class="p">,</span>
        <span class="ss">customer_type: </span><span class="n">customer_type</span><span class="p">,</span>
        <span class="ss">amount_cents: </span><span class="n">amount_cents</span><span class="p">,</span>
        <span class="ss">paid_at: </span><span class="n">paid_at</span>
      <span class="p">})</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="subscribing-to-events">Subscribing to events</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/config/initializers/billing_events.rb</span>

<span class="k">if</span> <span class="k">defined?</span><span class="p">(</span><span class="no">Billing</span><span class="p">)</span>
  <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">event</span><span class="o">|</span>
    <span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span>
      <span class="ss">recipient_type: </span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:customer_type</span><span class="p">],</span>
      <span class="ss">recipient_id: </span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:customer_id</span><span class="p">],</span>
      <span class="ss">subject: </span><span class="s2">"New invoice"</span><span class="p">,</span>
      <span class="ss">body: </span><span class="s2">"A new invoice for </span><span class="si">#{</span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:amount_cents</span><span class="p">]</span> <span class="o">/</span> <span class="mf">100.0</span><span class="si">}</span><span class="s2"> "</span><span class="p">\</span>
            <span class="s2">"</span><span class="si">#{</span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:currency</span><span class="p">]</span><span class="si">}</span><span class="s2"> has been generated."</span>
    <span class="p">)</span>
  <span class="k">end</span>

  <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="s2">"invoice.paid.billing"</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">event</span><span class="o">|</span>
    <span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span>
      <span class="ss">recipient_type: </span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:customer_type</span><span class="p">],</span>
      <span class="ss">recipient_id: </span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:customer_id</span><span class="p">],</span>
      <span class="ss">subject: </span><span class="s2">"Payment received"</span><span class="p">,</span>
      <span class="ss">body: </span><span class="s2">"Your payment has been processed. Thank you!"</span>
    <span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<blockquote>
  <p><strong>Companion app note:</strong> The companion application takes a production-ready approach to event subscriptions. Instead of placing them in <code>config/initializers/</code> (which is not auto-loaded for engines), it registers subscriptions inside a named initializer in <code>engine.rb</code> and dispatches work to <code>Notifications::SendNotificationJob</code> – combining Pattern 5 (events) with Pattern 8 (background jobs). See <code>engines/notifications/lib/notifications/engine.rb</code> for the full implementation.</p>
</blockquote>

<div class="diagram"><img src="/img/books/modular-rails/2a51ec6b683add128870be08f7d439400c162dbb14ac98d665a365f916398b96.svg" alt="Mermaid diagram: invoice.created.billing"></div>

<p>The <code>if defined?(Billing)</code> guard makes the subscription conditional. If the billing engine isn’t loaded (perhaps in a test environment or a different deployment), the notification engine doesn’t crash.</p>

<h3 id="why-events-not-direct-calls">Why events, not direct calls?</h3>

<p>Direct call:</p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>
<span class="c1"># BAD: billing now depends on notifications</span>
<span class="no">Notifications</span><span class="o">::</span><span class="no">Notifier</span><span class="p">.</span><span class="nf">notify</span><span class="p">(</span><span class="n">customer</span><span class="p">,</span> <span class="s2">"New invoice generated"</span><span class="p">)</span>
</code></pre></div></div>

<p>This creates a dependency from billing to notifications. If you remove the notification engine, billing breaks. If you change the notification engine’s interface, billing needs updating.</p>

<p>With events, billing doesn’t know notifications exists. The dependency is inverted: notifications knows about billing events, but billing knows about nothing outside its boundary. Remove notifications, and billing keeps working. The event fires, nobody subscribes, nothing happens.</p>

<h3 id="for-asynchronous-events">For asynchronous events</h3>

<p>If you need asynchronous processing (the event triggers a slow operation), combine events with Active Job:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/jobs/notifications/billing_event_job.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">BillingEventJob</span> <span class="o">&lt;</span> <span class="no">ApplicationJob</span>
    <span class="k">def</span> <span class="nf">perform</span><span class="p">(</span><span class="n">event_name</span><span class="p">,</span> <span class="n">payload</span><span class="p">)</span>
      <span class="k">case</span> <span class="n">event_name</span>
      <span class="k">when</span> <span class="s2">"invoice.created.billing"</span>
        <span class="no">Notification</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span>
          <span class="ss">recipient_type: </span><span class="n">payload</span><span class="p">[</span><span class="s2">"customer_type"</span><span class="p">],</span>
          <span class="ss">recipient_id: </span><span class="n">payload</span><span class="p">[</span><span class="s2">"customer_id"</span><span class="p">],</span>
          <span class="ss">subject: </span><span class="s2">"New invoice"</span>
        <span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># In the subscriber:</span>
<span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">event</span><span class="o">|</span>
  <span class="no">Notifications</span><span class="o">::</span><span class="no">BillingEventJob</span><span class="p">.</span><span class="nf">perform_later</span><span class="p">(</span><span class="n">event</span><span class="p">.</span><span class="nf">name</span><span class="p">,</span> <span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">.</span><span class="nf">stringify_keys</span><span class="p">)</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This moves the notification creation to a background job, keeping the billing transaction fast.</p>

<h3 id="watch-out-events-inside-transactions">Watch Out: Events Inside Transactions</h3>

<p>There’s a common gotcha when combining events with Active Record callbacks. If you fire an event inside a transaction and a subscriber enqueues a background job, the job might execute before the transaction commits – or worse, the transaction rolls back and the job runs against data that no longer exists.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Dangerous: event fires before transaction commits</span>
<span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span><span class="p">.</span><span class="nf">transaction</span> <span class="k">do</span>
  <span class="n">invoice</span> <span class="o">=</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span><span class="n">attrs</span><span class="p">)</span>
  <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">,</span> <span class="p">{</span> <span class="ss">id: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">id</span> <span class="p">})</span>
  <span class="c1"># If this transaction rolls back, the notification job already ran</span>
<span class="k">end</span>

<span class="c1"># Safe: use an after_create_commit callback on the model</span>
<span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="n">after_create_commit</span> <span class="ss">:publish_created_event</span>

  <span class="kp">private</span>

  <span class="k">def</span> <span class="nf">publish_created_event</span>
    <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">,</span> <span class="p">{</span> <span class="ss">id: </span><span class="nb">id</span> <span class="p">})</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>after_create_commit</code> callback guarantees the record is persisted before any subscriber sees the event. This matters most when subscribers enqueue background jobs – the job picks up the record by ID, and that ID needs to exist in the database by the time the job runs.</p>

<h3 id="instrumentation-vs-domain-events">Instrumentation vs Domain Events</h3>

<p>Rails ships with two uses of <code>ActiveSupport::Notifications</code>, and it’s important not to confuse them in an engine context:</p>

<ul>
  <li>
    <p><strong>Domain events</strong> are what we’ve been building in this chapter. Events like <code>"invoice.created.billing"</code> carry business-domain payloads and trigger business logic in subscribing engines. You define these yourself.</p>
  </li>
  <li>
    <p><strong>Framework instrumentation</strong> events like <code>"process_action.action_controller"</code> and <code>"sql.active_record"</code> are emitted by Rails internals for performance monitoring. They feed APM tools, dashboards, and log aggregation.</p>
  </li>
</ul>

<p>The distinction matters for engines because mixing the two creates confusing code. Your notifications engine should subscribe to your domain events (<code>"invoice.created.billing"</code>), not to Rails instrumentation events (<code>"process_action.action_controller"</code>). Keep them separate: <code>ActiveSupport::Notifications.instrument</code> for your domain events, Rails’ built-in instrumentation for operational telemetry. If your engine needs observability data, use the framework events in a dedicated monitoring initializer, not in your domain event subscribers.</p>

<p>Event-driven communication isn’t unique to Rails Engines. The same publish/subscribe pattern appears in game development (Entity-Component-System architectures), distributed systems (Kafka, RabbitMQ), and front-end frameworks (Redux, Flux). If you’re interested in building an event-driven system from scratch in pure Ruby – without Rails, without frameworks – my earlier book <em>Building Your Own Roguelike</em> walks through the pattern in a completely different context. The underlying principles are the same: decouple producers from consumers, let events carry the data, and keep each component ignorant of who’s listening.</p>

<h3 id="scaling-beyond-activesupportnotifications">Scaling Beyond ActiveSupport::Notifications</h3>

<p><code>ActiveSupport::Notifications</code> works well within a single process, but it has real limitations:</p>

<ul>
  <li><strong>Events are lost if the process crashes before the subscriber runs.</strong> The event lives only in memory. If the process dies mid-request, the event never fires.</li>
  <li><strong>No replay capability.</strong> If a subscriber was down or hadn’t been deployed yet when the event fired, that event is gone. There’s no log to replay from.</li>
  <li><strong>No schema enforcement.</strong> The payload is a hash. Misspell a key or change a value type and you won’t know until runtime – possibly in production.</li>
</ul>

<p>For many applications, these trade-offs are perfectly acceptable. But when you outgrow them, the engine boundary you already drew makes the upgrade path clear.</p>

<h4 id="a-dual-mode-producer">A Dual-Mode Producer</h4>

<p>The simplest evolution is a producer class that uses a message queue in production and falls back to <code>ActiveSupport::Notifications</code> in development and test:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/event_streams/billing/invoice_producer.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">InvoiceProducer</span>
    <span class="no">TOPIC</span> <span class="o">=</span> <span class="s2">"billing.invoices"</span>

    <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">publish</span><span class="p">(</span><span class="n">event</span><span class="p">:,</span> <span class="n">payload</span><span class="p">:)</span>
      <span class="c1"># In development/test: fall back to ActiveSupport::Notifications</span>
      <span class="k">if</span> <span class="no">Rails</span><span class="p">.</span><span class="nf">env</span><span class="p">.</span><span class="nf">production?</span>
        <span class="n">message</span> <span class="o">=</span> <span class="n">payload</span><span class="p">.</span><span class="nf">merge</span><span class="p">(</span><span class="ss">event: </span><span class="n">event</span><span class="p">)</span>
        <span class="no">Kafka</span><span class="p">.</span><span class="nf">deliver_message</span><span class="p">(</span>
          <span class="n">message</span><span class="p">.</span><span class="nf">to_json</span><span class="p">,</span>
          <span class="ss">topic: </span><span class="no">TOPIC</span><span class="p">,</span>
          <span class="ss">key: </span><span class="n">payload</span><span class="p">[</span><span class="ss">:invoice_id</span><span class="p">].</span><span class="nf">to_s</span>
        <span class="p">)</span>
      <span class="k">else</span>
        <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span>
          <span class="s2">"</span><span class="si">#{</span><span class="n">event</span><span class="si">}</span><span class="s2">.billing"</span><span class="p">,</span> <span class="n">payload</span>
        <span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/event_streams/notifications/invoice_listener.rb</span>
<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">InvoiceListener</span>
    <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">consume</span><span class="p">(</span><span class="n">message</span><span class="p">)</span>
      <span class="n">payload</span> <span class="o">=</span> <span class="no">JSON</span><span class="p">.</span><span class="nf">parse</span><span class="p">(</span><span class="n">message</span><span class="p">.</span><span class="nf">value</span><span class="p">,</span> <span class="ss">symbolize_names: </span><span class="kp">true</span><span class="p">)</span>

      <span class="k">case</span> <span class="n">payload</span><span class="p">[</span><span class="ss">:event</span><span class="p">]</span>
      <span class="k">when</span> <span class="s2">"invoice.created"</span>
        <span class="no">NotifyRecipientJob</span><span class="p">.</span><span class="nf">perform_later</span><span class="p">(</span>
          <span class="ss">recipient_id: </span><span class="n">payload</span><span class="p">[</span><span class="ss">:recipient_id</span><span class="p">],</span>
          <span class="ss">invoice_id: </span><span class="n">payload</span><span class="p">[</span><span class="ss">:invoice_id</span><span class="p">]</span>
        <span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The dual-mode producer lets you develop locally without running Kafka, Redpanda, or any other broker infrastructure. Your development loop stays fast; your production path gets durable delivery.</p>

<h4 id="what-you-gain-from-a-message-queue">What you gain from a message queue</h4>

<ul>
  <li><strong>Schema enforcement.</strong> Use Avro or JSON Schema to validate payloads at publish time. A misspelled key or wrong type fails the producer, not the consumer three hours later.</li>
  <li><strong>Durability via the outbox pattern.</strong> Write events to a database table in the same transaction as your domain changes. A separate process reads the outbox and publishes to the broker. Events survive process crashes because they’re persisted before they’re sent.</li>
  <li><strong>Replay and auditability.</strong> Consumers can rewind to a previous offset and reprocess events. This is invaluable for debugging, backfilling, and onboarding new consumers after the fact.</li>
</ul>

<p>This is the natural evolution path: <code>ActiveSupport::Notifications</code> → message queue → separate service. Each step builds on the boundary the previous step established.</p>

<p>Most applications never need this. <code>ActiveSupport::Notifications</code> carries you further than you think. But when you outgrow it – high event volume, multi-process consumers, replay requirements – the engine boundary you already drew makes the upgrade well-defined.</p>

<hr />

<h2 id="pattern-6-the-shared-kernel">Pattern 6: The Shared Kernel</h2>

<p>Sometimes two engines need to share a small set of models or concerns that don’t belong to either domain. This is the “shared kernel” pattern from Domain-Driven Design.</p>

<p>In Rails, the shared kernel is typically a <code>core</code> or <code>shared</code> engine:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/core/app/models/concerns/core/auditable.rb</span>

<span class="k">module</span> <span class="nn">Core</span>
  <span class="k">module</span> <span class="nn">Auditable</span>
    <span class="kp">extend</span> <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Concern</span>

    <span class="n">included</span> <span class="k">do</span>
      <span class="n">has_many</span> <span class="ss">:audit_logs</span><span class="p">,</span> <span class="ss">class_name: </span><span class="s2">"Core::AuditLog"</span><span class="p">,</span> <span class="ss">as: :auditable</span>
      <span class="n">after_create</span> <span class="p">{</span> <span class="n">log_audit</span><span class="p">(</span><span class="s2">"created"</span><span class="p">)</span> <span class="p">}</span>
      <span class="n">after_update</span> <span class="p">{</span> <span class="n">log_audit</span><span class="p">(</span><span class="s2">"updated"</span><span class="p">)</span> <span class="p">}</span>
      <span class="n">after_destroy</span> <span class="p">{</span> <span class="n">log_audit</span><span class="p">(</span><span class="s2">"destroyed"</span><span class="p">)</span> <span class="p">}</span>
    <span class="k">end</span>

    <span class="kp">private</span>

    <span class="k">def</span> <span class="nf">log_audit</span><span class="p">(</span><span class="n">action</span><span class="p">)</span>
      <span class="no">Core</span><span class="o">::</span><span class="no">AuditLog</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span>
        <span class="ss">auditable: </span><span class="nb">self</span><span class="p">,</span>
        <span class="ss">action: </span><span class="n">action</span><span class="p">,</span>
        <span class="ss">changes_json: </span><span class="n">saved_changes</span><span class="p">.</span><span class="nf">to_json</span>
      <span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Both the billing and notification engines can depend on <code>core</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/billing.gemspec</span>
<span class="n">spec</span><span class="p">.</span><span class="nf">add_dependency</span> <span class="s2">"core"</span>

<span class="c1"># engines/billing/app/models/billing/invoice.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="kp">include</span> <span class="no">Core</span><span class="o">::</span><span class="no">Auditable</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<blockquote>
  <p><strong>Companion app note:</strong> The companion application uses a simplified <code>Core::Auditable</code> that tracks <code>created_by</code> and <code>updated_by</code> columns (set from <code>Current.user</code>) rather than the full <code>AuditLog</code> model shown above. Both approaches are valid – choose based on your audit requirements. The lightweight version works well when you only need to record who last touched a record; the full version is better when you need a complete audit trail with change history.</p>
</blockquote>

<p>The shared kernel should be:</p>
<ul>
  <li><strong>Small</strong> – it contains only what genuinely needs to be shared</li>
  <li><strong>Stable</strong> – it changes rarely, since multiple engines depend on it</li>
  <li><strong>Abstract</strong> – it provides interfaces and concerns, not business logic</li>
</ul>

<p>If your shared kernel keeps growing, it’s a sign that you’re putting too much in it. Push domain-specific logic into the domain engines. The shared kernel should contain only truly cross-cutting concerns: audit logging, soft deletion, common validations, shared value objects.</p>

<hr />

<h2 id="pattern-7-authentication-and-authorisation-across-engines">Pattern 7: Authentication and Authorisation Across Engines</h2>

<p>Every non-trivial engine eventually needs to answer two questions: “Who is this user?” and “Can they do this?” The trap is pulling Devise, Pundit, or whatever auth stack you use into the engine’s gemspec. Do that and you’ve welded the engine to one specific host app’s security stack. The engine should know nothing about how authentication works. It should just receive an authenticated user and make its own authorisation decisions.</p>

<h3 id="authentication-inherit-it-dont-import-it">Authentication: inherit it, don’t import it</h3>

<p>Pattern 3 already solved the hard part. When the engine’s <code>ApplicationController</code> inherits from the host app’s controller, it gets <code>current_user</code> for free:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="n">mattr_accessor</span> <span class="ss">:parent_controller</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ActionController::Base"</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/application_controller.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="c1"># See Pattern 3 note: constantize runs at class definition time.</span>
  <span class="c1"># The host app initializer must set parent_controller before this file loads.</span>
  <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span><span class="p">.</span><span class="nf">constantize</span>
    <span class="n">before_action</span> <span class="ss">:authenticate_user!</span>

    <span class="kp">private</span>

    <span class="c1"># Guard: ensure the host app actually provides current_user.</span>
    <span class="c1"># Raises on the first request if the parent controller doesn't provide it.</span>
    <span class="k">def</span> <span class="nf">authenticate_user!</span>
      <span class="k">unless</span> <span class="nb">respond_to?</span><span class="p">(</span><span class="ss">:current_user</span><span class="p">,</span> <span class="kp">true</span><span class="p">)</span>
        <span class="k">raise</span> <span class="no">NotImplementedError</span><span class="p">,</span>
              <span class="s2">"</span><span class="si">#{</span><span class="nb">self</span><span class="p">.</span><span class="nf">class</span><span class="si">}</span><span class="s2"> inherits from </span><span class="si">#{</span><span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span><span class="si">}</span><span class="s2"> "</span> <span class="p">\</span>
              <span class="s2">"but no current_user method is available. "</span> <span class="p">\</span>
              <span class="s2">"Set Billing.parent_controller to a controller that provides authentication."</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Host app: config/initializers/billing.rb</span>

<span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ApplicationController"</span>
</code></pre></div></div>

<p>The host app’s <code>ApplicationController</code> already calls Devise’s <code>authenticate_user!</code> (or whatever your auth library uses). The engine’s controllers inherit that entire before_action chain. The engine never references Devise. It just expects <code>current_user</code> to exist on the parent controller – and fails loudly if it doesn’t.</p>

<h4 id="rails-8s-built-in-authentication-generator">Rails 8’s built-in authentication generator</h4>

<p>Rails 8 ships with <code>bin/rails generate authentication</code>, which creates a complete session-based auth system: a <code>Session</code> model, <code>Authentication</code> concern, <code>passwords_controller</code>, and a <code>Current</code> class that exposes <code>Current.user</code>. No gem required.</p>

<p>This is the cleanest option for engine integration because the generated <code>Authentication</code> concern is included directly in <code>ApplicationController</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/controllers/application_controller.rb (generated)</span>
<span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">ActionController</span><span class="o">::</span><span class="no">Base</span>
  <span class="kp">include</span> <span class="no">Authentication</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>Authentication</code> concern provides <code>require_authentication</code> as a before_action and session management. It exposes the current user through <code>Current.user</code> (via <code>CurrentAttributes</code>), but it does <strong>not</strong> generate a <code>current_user</code> helper method on the controller. If your engine expects <code>current_user</code>, you’ll need to add it yourself in the host app’s <code>ApplicationController</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/controllers/application_controller.rb</span>
<span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">ActionController</span><span class="o">::</span><span class="no">Base</span>
  <span class="kp">include</span> <span class="no">Authentication</span>

  <span class="kp">private</span>

  <span class="k">def</span> <span class="nf">current_user</span>
    <span class="no">Current</span><span class="p">.</span><span class="nf">user</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>One nuance: Devise provides <code>current_user</code> as a helper method by default, while the Rails 8 generator gives you <code>Current.user</code> as a <code>CurrentAttributes</code> accessor. If your engine depends on <code>current_user</code> (the method), add the bridge above. The method is the contract; the implementation behind it is the host app’s business.</p>

<p>If you already use Devise and it’s working, there’s no reason to migrate. The pattern is the same either way: the host app handles authentication, the engine inherits it. The Rails 8 generator just happens to produce exactly the kind of thin, concern-based auth layer that this pattern expects.</p>

<h3 id="authorisation-two-approaches">Authorisation: two approaches</h3>

<p>Authentication is the easy part. Authorisation is where teams get stuck, because the question “can this user view this invoice?” feels like it belongs to both the engine and the host app. It doesn’t. Separate identity from permissions.</p>

<h4 id="approach-a-engine-scoped-policies-recommended">Approach A: Engine-scoped policies (recommended)</h4>

<p>The engine owns its own authorisation rules. It defines policy objects that take a user and a resource, and return a boolean. No dependency on Pundit, CanCanCan, or any external library.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/policies/billing/invoice_policy.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">InvoicePolicy</span>
    <span class="nb">attr_reader</span> <span class="ss">:user</span><span class="p">,</span> <span class="ss">:invoice</span>

    <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">user</span><span class="p">,</span> <span class="n">invoice</span><span class="p">)</span>
      <span class="vi">@user</span> <span class="o">=</span> <span class="n">user</span>
      <span class="vi">@invoice</span> <span class="o">=</span> <span class="n">invoice</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">show?</span>
      <span class="n">owner?</span> <span class="o">||</span> <span class="n">admin?</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">refund?</span>
      <span class="n">admin?</span> <span class="o">&amp;&amp;</span> <span class="n">invoice</span><span class="p">.</span><span class="nf">refundable?</span>
    <span class="k">end</span>

    <span class="kp">private</span>

    <span class="k">def</span> <span class="nf">owner?</span>
      <span class="n">invoice</span><span class="p">.</span><span class="nf">customer_id</span> <span class="o">==</span> <span class="n">user</span><span class="p">.</span><span class="nf">id</span> <span class="o">&amp;&amp;</span> <span class="n">invoice</span><span class="p">.</span><span class="nf">customer_type</span> <span class="o">==</span> <span class="n">user</span><span class="p">.</span><span class="nf">class</span><span class="p">.</span><span class="nf">name</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">admin?</span>
      <span class="n">user</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:admin?</span><span class="p">)</span> <span class="o">&amp;&amp;</span> <span class="n">user</span><span class="p">.</span><span class="nf">admin?</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/invoices_controller.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">InvoicesController</span> <span class="o">&lt;</span> <span class="no">ApplicationController</span>
    <span class="k">def</span> <span class="nf">show</span>
      <span class="vi">@invoice</span> <span class="o">=</span> <span class="no">Invoice</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:id</span><span class="p">])</span>
      <span class="n">policy</span> <span class="o">=</span> <span class="no">InvoicePolicy</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">current_user</span><span class="p">,</span> <span class="vi">@invoice</span><span class="p">)</span>

      <span class="k">unless</span> <span class="n">policy</span><span class="p">.</span><span class="nf">show?</span>
        <span class="n">head</span> <span class="ss">:forbidden</span>
        <span class="k">return</span>
      <span class="k">end</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">refund</span>
      <span class="vi">@invoice</span> <span class="o">=</span> <span class="no">Invoice</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:id</span><span class="p">])</span>
      <span class="n">policy</span> <span class="o">=</span> <span class="no">InvoicePolicy</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">current_user</span><span class="p">,</span> <span class="vi">@invoice</span><span class="p">)</span>

      <span class="k">unless</span> <span class="n">policy</span><span class="p">.</span><span class="nf">refund?</span>
        <span class="n">head</span> <span class="ss">:forbidden</span>
        <span class="k">return</span>
      <span class="k">end</span>

      <span class="vi">@invoice</span><span class="p">.</span><span class="nf">process_refund!</span>
      <span class="n">redirect_to</span> <span class="vi">@invoice</span><span class="p">,</span> <span class="ss">notice: </span><span class="s2">"Refund processed."</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The policy is a plain Ruby object. It doesn’t inherit from <code>Pundit::Policy</code> or include any framework module. It asks the user object simple questions (<code>admin?</code>, <code>id</code>) that any reasonable user model will answer. If the host app happens to use Pundit, that’s fine – Pundit can delegate to these same policy objects if it wants. The engine doesn’t care.</p>

<h4 id="approach-b-host-app-provides-authorisation-via-concern">Approach B: Host app provides authorisation via concern</h4>

<p>Sometimes the authorisation rules live outside the engine – the host app has a permissions system, role-based access control, or a third-party service that the engine shouldn’t replicate. In that case, define an interface and let the host app fill it in.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/concerns/billing/authorizable.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">Authorizable</span>
    <span class="kp">extend</span> <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Concern</span>

    <span class="c1"># The host app must override this method.</span>
    <span class="c1"># Returns true if the user is authorised for the given action on the record.</span>
    <span class="k">def</span> <span class="nf">authorize_billing_action!</span><span class="p">(</span><span class="n">record</span><span class="p">,</span> <span class="n">action</span><span class="p">)</span>
      <span class="k">raise</span> <span class="no">NotImplementedError</span><span class="p">,</span>
            <span class="s2">"Include Billing::Authorizable in your ApplicationController "</span> <span class="p">\</span>
            <span class="s2">"and implement #authorize_billing_action!(record, action)"</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Host app: app/controllers/application_controller.rb</span>

<span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">ActionController</span><span class="o">::</span><span class="no">Base</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Authorizable</span>

  <span class="kp">private</span>

  <span class="k">def</span> <span class="nf">authorize_billing_action!</span><span class="p">(</span><span class="n">record</span><span class="p">,</span> <span class="n">action</span><span class="p">)</span>
    <span class="c1"># Delegate to whatever auth system the host app uses.</span>
    <span class="c1"># Pundit example:</span>
    <span class="n">authorize</span><span class="p">(</span><span class="n">record</span><span class="p">,</span> <span class="s2">"</span><span class="si">#{</span><span class="n">action</span><span class="si">}</span><span class="s2">?"</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/invoices_controller.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">InvoicesController</span> <span class="o">&lt;</span> <span class="no">ApplicationController</span>
    <span class="k">def</span> <span class="nf">show</span>
      <span class="vi">@invoice</span> <span class="o">=</span> <span class="no">Invoice</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:id</span><span class="p">])</span>
      <span class="n">authorize_billing_action!</span><span class="p">(</span><span class="vi">@invoice</span><span class="p">,</span> <span class="ss">:show</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This approach is more flexible but introduces a contract the host app must honour. I prefer Approach A for most cases – the engine knows its own domain rules best. Use Approach B when authorisation genuinely depends on host-app-level concepts the engine cannot see (organisation hierarchies, feature flags, subscription tiers managed outside the engine).</p>

<h3 id="the-auth-flow">The auth flow</h3>

<div class="diagram"><img src="/img/books/modular-rails/b8f18ceb9a1d60ecd5ddb7cf0ec80ec1ffc6bb78dec2f98441a7b13e096dd889.svg" alt="Mermaid diagram: sequenceDiagram"></div>

<p>Authentication happens once, at the host app layer. Authorisation happens inside the engine, where the domain knowledge lives. The two concerns stay cleanly separated.</p>

<h3 id="testing-auth-in-the-engines-dummy-app">Testing auth in the engine’s dummy app</h3>

<p>The engine’s dummy app doesn’t use Devise. It doesn’t need to. Stub the authentication layer with the simplest possible implementation:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/test/dummy/app/controllers/application_controller.rb</span>

<span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">ActionController</span><span class="o">::</span><span class="no">Base</span>
  <span class="kp">private</span>

  <span class="k">def</span> <span class="nf">current_user</span>
    <span class="vi">@current_user</span> <span class="o">||=</span> <span class="no">User</span><span class="p">.</span><span class="nf">first</span>
  <span class="k">end</span>
  <span class="n">helper_method</span> <span class="ss">:current_user</span>

  <span class="c1"># Satisfy the engine's authenticate_user! check</span>
  <span class="k">def</span> <span class="nf">authenticate_user!</span>
    <span class="n">head</span> <span class="ss">:unauthorized</span> <span class="k">unless</span> <span class="n">current_user</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/controllers/billing/invoices_controller_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="no">Billing</span><span class="o">::</span><span class="no">InvoicesController</span><span class="p">,</span> <span class="ss">type: :controller</span> <span class="k">do</span>
  <span class="n">routes</span> <span class="p">{</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">routes</span> <span class="p">}</span>

  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="no">User</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span><span class="ss">email: </span><span class="s2">"owner@example.com"</span><span class="p">)</span> <span class="p">}</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:other_user</span><span class="p">)</span> <span class="p">{</span> <span class="no">User</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span><span class="ss">email: </span><span class="s2">"other@example.com"</span><span class="p">)</span> <span class="p">}</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:invoice</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:invoice</span><span class="p">,</span> <span class="ss">customer: </span><span class="n">user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">before</span> <span class="k">do</span>
    <span class="n">allow</span><span class="p">(</span><span class="n">controller</span><span class="p">).</span><span class="nf">to</span> <span class="n">receive</span><span class="p">(</span><span class="ss">:current_user</span><span class="p">).</span><span class="nf">and_return</span><span class="p">(</span><span class="n">user</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"GET #show"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"renders the invoice for the owner"</span> <span class="k">do</span>
      <span class="n">get</span> <span class="ss">:show</span><span class="p">,</span> <span class="ss">params: </span><span class="p">{</span> <span class="ss">id: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">id</span> <span class="p">}</span>
      <span class="n">expect</span><span class="p">(</span><span class="n">response</span><span class="p">).</span><span class="nf">to</span> <span class="n">have_http_status</span><span class="p">(</span><span class="ss">:ok</span><span class="p">)</span>
    <span class="k">end</span>

    <span class="n">it</span> <span class="s2">"returns 403 for a different user"</span> <span class="k">do</span>
      <span class="n">allow</span><span class="p">(</span><span class="n">controller</span><span class="p">).</span><span class="nf">to</span> <span class="n">receive</span><span class="p">(</span><span class="ss">:current_user</span><span class="p">).</span><span class="nf">and_return</span><span class="p">(</span><span class="n">other_user</span><span class="p">)</span>
      <span class="n">get</span> <span class="ss">:show</span><span class="p">,</span> <span class="ss">params: </span><span class="p">{</span> <span class="ss">id: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">id</span> <span class="p">}</span>
      <span class="n">expect</span><span class="p">(</span><span class="n">response</span><span class="p">).</span><span class="nf">to</span> <span class="n">have_http_status</span><span class="p">(</span><span class="ss">:forbidden</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>No Devise. No Warden. No test helpers that depend on the host app’s auth stack. You stub <code>current_user</code> directly and test the engine’s authorisation logic in isolation. If the policy works with a stubbed user, it’ll work with a real Devise-authenticated user – because the policy doesn’t know the difference.</p>

<hr />

<h2 id="pattern-8-background-jobs-across-engine-boundaries">Pattern 8: Background Jobs Across Engine Boundaries</h2>

<p>Pattern 5 showed how events decouple engines. But what happens when a subscriber needs to do slow work – send an email, generate a PDF, sync to an external API? You don’t want a billing transaction blocked because the notifications engine is talking to an SMTP server.</p>

<p>Background jobs are the answer. The question is: where do they live?</p>

<h3 id="rule-jobs-live-in-the-engine-that-owns-the-work">Rule: jobs live in the engine that owns the work</h3>

<p>If the notifications engine sends an email when an invoice is created, that job belongs to the notifications engine. Not billing. Billing fires the event and moves on. It doesn’t know or care what happens next.</p>

<p>This follows the same dependency direction as events: the subscribing engine depends on the publishing engine’s event contract, never the other way around.</p>

<h3 id="event-to-job-dispatch">Event-to-job dispatch</h3>

<p>The subscriber’s only responsibility is to translate the event into a job. Keep the subscriber thin – it validates the payload and enqueues. All the real logic lives in the job.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/config/initializers/billing_events.rb</span>

<span class="k">if</span> <span class="k">defined?</span><span class="p">(</span><span class="no">Billing</span><span class="p">)</span>
  <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">event</span><span class="o">|</span>
    <span class="no">Notifications</span><span class="o">::</span><span class="no">SendNotificationJob</span><span class="p">.</span><span class="nf">perform_later</span><span class="p">(</span>
      <span class="ss">recipient_id: </span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:customer_id</span><span class="p">],</span>
      <span class="ss">subject: </span><span class="s2">"New invoice"</span><span class="p">,</span>
      <span class="ss">body: </span><span class="s2">"Invoice for </span><span class="si">#{</span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:amount_cents</span><span class="p">]</span><span class="si">}</span><span class="s2"> cents has been created."</span>
    <span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The subscriber does one thing: enqueue a job. The job does the actual work. This separation means the billing request finishes in milliseconds, and the notification gets created asynchronously in the background.</p>

<h3 id="job-isolation">Job isolation</h3>

<p>The job class inherits from the engine’s own <code>ApplicationJob</code>, not the host app’s. This keeps the engine self-contained and testable in isolation.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/jobs/notifications/send_notification_job.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">SendNotificationJob</span> <span class="o">&lt;</span> <span class="no">ApplicationJob</span>
    <span class="n">queue_as</span> <span class="ss">:notifications</span>

    <span class="k">def</span> <span class="nf">perform</span><span class="p">(</span><span class="n">recipient_id</span><span class="p">:,</span> <span class="n">subject</span><span class="p">:,</span> <span class="n">body</span><span class="p">:)</span>
      <span class="n">recipient</span> <span class="o">=</span> <span class="no">Notifications</span><span class="p">.</span><span class="nf">recipient_class</span><span class="p">.</span><span class="nf">constantize</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">recipient_id</span><span class="p">)</span>
      <span class="no">Notification</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span><span class="ss">recipient: </span><span class="n">recipient</span><span class="p">,</span> <span class="ss">subject: </span><span class="n">subject</span><span class="p">,</span> <span class="ss">body: </span><span class="n">body</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Notice the <code>Notifications.recipient_class.constantize</code> call – the same dependency inversion from Pattern 2. The engine doesn’t hardcode <code>User</code>. It resolves the class at runtime from configuration.</p>

<h3 id="queue-naming-convention">Queue naming convention</h3>

<p>Namespace your queues by engine: <code>:billing</code>, <code>:notifications</code>, <code>:reporting</code>. This lets you configure workers per-engine in production – scale notification workers independently of billing workers, or pause a queue without affecting the rest of the system.</p>

<p>With Solid Queue (Rails 8’s default), the configuration is straightforward:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/queue.yml</span>

<span class="na">production</span><span class="pi">:</span>
  <span class="na">dispatchers</span><span class="pi">:</span>
    <span class="pi">-</span> <span class="na">polling_interval</span><span class="pi">:</span> <span class="m">1</span>
      <span class="na">batch_size</span><span class="pi">:</span> <span class="m">500</span>
  <span class="na">workers</span><span class="pi">:</span>
    <span class="pi">-</span> <span class="na">queues</span><span class="pi">:</span> <span class="s2">"</span><span class="s">billing"</span>
      <span class="na">threads</span><span class="pi">:</span> <span class="m">3</span>
      <span class="na">processes</span><span class="pi">:</span> <span class="m">1</span>
    <span class="pi">-</span> <span class="na">queues</span><span class="pi">:</span> <span class="s2">"</span><span class="s">notifications"</span>
      <span class="na">threads</span><span class="pi">:</span> <span class="m">5</span>
      <span class="na">processes</span><span class="pi">:</span> <span class="m">2</span>
    <span class="pi">-</span> <span class="na">queues</span><span class="pi">:</span> <span class="s2">"</span><span class="s">reporting"</span>
      <span class="na">threads</span><span class="pi">:</span> <span class="m">2</span>
      <span class="na">processes</span><span class="pi">:</span> <span class="m">1</span>
</code></pre></div></div>

<p>Three workers defined, three engines served, each with its own concurrency tuning. When invoice season hits and the notifications queue backs up, you scale the notifications worker without touching billing.</p>

<h3 id="data-serialisation-gotcha">Data serialisation gotcha</h3>

<p>Prefer passing IDs to jobs across engine boundaries rather than Active Record objects.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># FRAGILE: relies on the record's state at enqueue time</span>
<span class="no">Notifications</span><span class="o">::</span><span class="no">SendNotificationJob</span><span class="p">.</span><span class="nf">perform_later</span><span class="p">(</span>
  <span class="ss">recipient: </span><span class="n">user</span><span class="p">,</span>       <span class="c1"># &lt;- GlobalID handles serialisation, but the record may change or be deleted</span>
  <span class="ss">invoice: </span><span class="n">invoice</span>       <span class="c1"># &lt;- same risk</span>
<span class="p">)</span>

<span class="c1"># BETTER: pass primitive values, look up fresh state in the job</span>
<span class="no">Notifications</span><span class="o">::</span><span class="no">SendNotificationJob</span><span class="p">.</span><span class="nf">perform_later</span><span class="p">(</span>
  <span class="ss">recipient_id: </span><span class="n">user</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
  <span class="ss">subject: </span><span class="s2">"New invoice"</span><span class="p">,</span>
  <span class="ss">body: </span><span class="s2">"Your invoice is ready."</span>
<span class="p">)</span>
</code></pre></div></div>

<p>Active Job can serialise Active Record objects via GlobalID – passing a record won’t “break.” But the job runs in a separate process, potentially minutes or hours later. The record may have changed. It may have been deleted. Pass the ID, look it up fresh inside the job, and handle the case where it no longer exists. This is especially important across engine boundaries where the record’s class lives in a different engine with its own lifecycle.</p>

<h3 id="the-full-flow">The full flow</h3>

<p>Here’s what the complete sequence looks like, from invoice creation to notification delivery:</p>

<div class="diagram"><img src="/img/books/modular-rails/45dc2da4c7dca96228e37b19af5b15eaf2fc6292728a64a4f17f8b06fd536103.svg" alt="Mermaid diagram: invoice.created.billing"></div>

<p>The request is fast because nothing slow happens inline. The event fires, the subscriber enqueues, and the controller returns. The actual notification gets created later, in a worker process, at whatever pace the queue allows.</p>

<p>This pattern builds directly on Pattern 5. Events handle the decoupling; jobs handle the latency. Together they give you engines that stay fast, isolated, and independently scalable.</p>

<h3 id="resumable-jobs-the-cursor-pattern">Resumable Jobs: The Cursor Pattern</h3>

<p>When engine jobs process large datasets, Kamal’s 30-second shutdown window becomes a concern. A deploy sends SIGTERM to running workers, and a job processing 10,000 invoices can’t finish in 30 seconds.</p>

<p>The solution is a cursor-based iteration pattern that checkpoints progress:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/jobs/billing/monthly_statement_job.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">MonthlyStatementJob</span> <span class="o">&lt;</span> <span class="no">ApplicationJob</span>
    <span class="n">queue_as</span> <span class="ss">:billing</span>

    <span class="k">def</span> <span class="nf">perform</span><span class="p">(</span><span class="n">month</span><span class="p">:,</span> <span class="ss">last_processed_id: </span><span class="mi">0</span><span class="p">)</span>
      <span class="n">invoices</span> <span class="o">=</span> <span class="no">Invoice</span><span class="p">.</span><span class="nf">where</span><span class="p">(</span><span class="ss">created_at: </span><span class="n">month</span><span class="p">.</span><span class="nf">all_month</span><span class="p">)</span>
                        <span class="p">.</span><span class="nf">where</span><span class="p">(</span><span class="s2">"id &gt; ?"</span><span class="p">,</span> <span class="n">last_processed_id</span><span class="p">)</span>
                        <span class="p">.</span><span class="nf">order</span><span class="p">(</span><span class="ss">:id</span><span class="p">)</span>
                        <span class="p">.</span><span class="nf">limit</span><span class="p">(</span><span class="mi">500</span><span class="p">)</span>

      <span class="n">invoices</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">invoice</span><span class="o">|</span>
        <span class="n">generate_statement</span><span class="p">(</span><span class="n">invoice</span><span class="p">)</span>
      <span class="k">end</span>

      <span class="k">if</span> <span class="n">invoices</span><span class="p">.</span><span class="nf">size</span> <span class="o">==</span> <span class="mi">500</span>
        <span class="c1"># More records to process — re-enqueue with cursor</span>
        <span class="nb">self</span><span class="p">.</span><span class="nf">class</span><span class="p">.</span><span class="nf">perform_later</span><span class="p">(</span><span class="ss">month: </span><span class="n">month</span><span class="p">,</span> <span class="ss">last_processed_id: </span><span class="n">invoices</span><span class="p">.</span><span class="nf">last</span><span class="p">.</span><span class="nf">id</span><span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>

    <span class="kp">private</span>

    <span class="k">def</span> <span class="nf">generate_statement</span><span class="p">(</span><span class="n">invoice</span><span class="p">)</span>
      <span class="c1"># Engine-specific business logic</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The job processes records in batches of 500, then re-enqueues itself with the cursor pointing to the last processed record. If SIGTERM arrives mid-batch, at most 500 records need reprocessing when the new worker picks up the re-enqueued job.</p>

<p>This is especially important for engines because each engine’s jobs have different runtime characteristics. A billing reconciliation job might process millions of rows. A notifications digest job might finish in seconds. With per-engine queues and cursor-based batching, you get safe deploys without treating every engine’s workload the same way.</p>

<hr />

<h2 id="anti-patterns-to-avoid">Anti-Patterns to Avoid</h2>

<h3 id="direct-cross-engine-model-references">Direct cross-engine model references</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># BAD: billing engine reaches into notifications</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="n">after_create</span> <span class="k">do</span>
      <span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span><span class="ss">subject: </span><span class="s2">"Invoice created"</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The billing engine now depends on the notification engine’s internal model. If <code>Notifications::Notification</code> changes its required attributes, billing breaks. Use events instead.</p>

<h3 id="god-configuration-objects">God configuration objects</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># BAD: one config object that knows everything</span>
<span class="k">module</span> <span class="nn">MyApp</span>
  <span class="n">mattr_accessor</span> <span class="ss">:user_class</span><span class="p">,</span> <span class="ss">:billing_class</span><span class="p">,</span> <span class="ss">:notification_class</span><span class="p">,</span>
                 <span class="ss">:team_class</span><span class="p">,</span> <span class="ss">:mailer_class</span><span class="p">,</span> <span class="ss">:admin_class</span><span class="p">,</span> <span class="ss">:report_class</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Each engine should have its own configuration module. Don’t centralise configuration for all engines in one place.</p>

<h3 id="circular-dependencies">Circular dependencies</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># BAD: billing depends on notifications, notifications depends on billing</span>
<span class="c1"># engines/billing/billing.gemspec</span>
<span class="n">spec</span><span class="p">.</span><span class="nf">add_dependency</span> <span class="s2">"notifications"</span>

<span class="c1"># engines/notifications/notifications.gemspec</span>
<span class="n">spec</span><span class="p">.</span><span class="nf">add_dependency</span> <span class="s2">"billing"</span>
</code></pre></div></div>

<p>Break the cycle. Use events for one direction. Extract shared logic into a core engine. Invert the dependency.</p>

<h3 id="reaching-through-the-engine-to-the-database">Reaching through the engine to the database</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># BAD: host app queries the engine's tables directly</span>
<span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span><span class="p">.</span><span class="nf">connection</span><span class="p">.</span><span class="nf">execute</span><span class="p">(</span>
  <span class="s2">"SELECT * FROM billing_invoices WHERE amount &gt; 1000"</span>
<span class="p">)</span>
</code></pre></div></div>

<p>Always go through the engine’s models. If the engine doesn’t expose a method for what you need, add one. Direct SQL queries bypass the engine’s business logic, validations, and scopes.</p>

<hr />

<h2 id="choosing-the-right-pattern">Choosing the Right Pattern</h2>

<table>
  <thead>
    <tr>
      <th>Scenario</th>
      <th>Pattern</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Engine adds behaviour to host app models</td>
      <td>Concern-based integration</td>
    </tr>
    <tr>
      <td>Engine needs host app class or value</td>
      <td>Configuration with <code>mattr_accessor</code></td>
    </tr>
    <tr>
      <td>Engine controllers need host app auth</td>
      <td>Configurable base controller</td>
    </tr>
    <tr>
      <td>Engine needs to wire into Rails boot</td>
      <td>Engine initializers</td>
    </tr>
    <tr>
      <td>Engine A triggers behaviour in Engine B</td>
      <td>Events (ActiveSupport::Notifications)</td>
    </tr>
    <tr>
      <td>Multiple engines share common concerns</td>
      <td>Shared kernel (core engine)</td>
    </tr>
    <tr>
      <td>Engine needs identity and permission checks</td>
      <td>Authentication &amp; authorisation</td>
    </tr>
    <tr>
      <td>Event triggers slow work in another engine</td>
      <td>Background jobs across boundaries</td>
    </tr>
  </tbody>
</table>

<p>Most real engines use a combination. A billing engine might use:</p>
<ul>
  <li>A <code>Billable</code> concern (Pattern 1) for host app model integration</li>
  <li>Configuration (Pattern 2) for currency and tax settings</li>
  <li>A configurable base controller (Pattern 3) for authenticated billing views</li>
  <li>Events (Pattern 5) for notifying other engines about invoice creation</li>
  <li>The core engine (Pattern 6) for shared audit logging</li>
  <li>Engine-scoped policies (Pattern 7) for invoice access control</li>
  <li>Background jobs (Pattern 8) for async notification delivery</li>
</ul>

<p>The patterns compose naturally. Each one addresses a specific integration need without compromising the boundary.</p>

<hr />

<p><em>With Part II complete, you now understand the mechanism: how engines work internally (Chapter 5), how <code>isolate_namespace</code> creates boundaries (Chapter 6), how to build an engine from scratch (Chapter 7), and how to integrate engines cleanly (this chapter). In Part III, we turn to practice: extracting engines from existing code, managing dependencies, handling data ownership, and building team workflows.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-07-building-your-first-engine/">&larr; Building Your First Engine</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-09-identifying-boundaries/">Identifying Boundaries in an Existing Application &rarr;</a>
</nav>
{% endraw %}
