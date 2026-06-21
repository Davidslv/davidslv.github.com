---
layout: book
book: modular_rails
title: "Appendix B: Rails Engine Quick Reference"
permalink: /books/modular-rails/appendix-b-quick-reference/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/appendix-a-companion-application/">&larr; Appendix A: The Companion Application</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/appendix-c-further-reading/">Appendix C: Further Reading &rarr;</a>
</nav>

<h1 id="appendix-b-rails-engine-quick-reference">Appendix B: Rails Engine Quick Reference</h1>

<p>A tear-out reference card. No explanations – just the commands, configurations, and patterns you need when you’re building engines and can’t remember the exact syntax.</p>

<p>For the <em>why</em> behind each item, see the corresponding chapter.</p>

<hr />

<h2 id="generator-commands">Generator Commands</h2>

<h3 id="create-a-mountable-engine-namespace-isolated">Create a mountable engine (namespace-isolated)</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>rails plugin new engines/billing <span class="nt">--mountable</span>
</code></pre></div></div>

<h3 id="create-a-mountable-engine-with-common-options">Create a mountable engine with common options</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>rails plugin new engines/billing <span class="se">\</span>
  <span class="nt">--mountable</span> <span class="se">\</span>
  <span class="nt">--database</span><span class="o">=</span>postgresql <span class="se">\</span>
  <span class="nt">--skip-test</span> <span class="se">\</span>
  <span class="nt">--dummy-path</span><span class="o">=</span>spec/dummy
</code></pre></div></div>

<h3 id="all-relevant-flags">All relevant flags</h3>

<table>
  <thead>
    <tr>
      <th>Flag</th>
      <th>Effect</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>--mountable</code></td>
      <td>Generates <code>isolate_namespace</code>, namespaced routes, isolated controllers and views. Use this for domain engines.</td>
    </tr>
    <tr>
      <td><code>--full</code></td>
      <td>Generates a full engine <em>without</em> namespace isolation. Models, helpers, and routes merge into the host app. Use for framework extensions (Devise-style).</td>
    </tr>
    <tr>
      <td><code>--database=postgresql</code></td>
      <td>Configures the dummy app’s database adapter. Also accepts <code>mysql</code>, <code>sqlite3</code>, <code>trilogy</code>.</td>
    </tr>
    <tr>
      <td><code>--skip-test</code></td>
      <td>Omits <code>test/</code> directory. Use when you’ll set up RSpec instead.</td>
    </tr>
    <tr>
      <td><code>--dummy-path=spec/dummy</code></td>
      <td>Places the dummy app at <code>spec/dummy</code> instead of <code>test/dummy</code>. Pair with <code>--skip-test</code>.</td>
    </tr>
    <tr>
      <td><code>--skip-action-mailer</code></td>
      <td>Omits Action Mailer boilerplate.</td>
    </tr>
    <tr>
      <td><code>--skip-action-mailbox</code></td>
      <td>Omits Action Mailbox.</td>
    </tr>
    <tr>
      <td><code>--skip-action-text</code></td>
      <td>Omits Action Text.</td>
    </tr>
    <tr>
      <td><code>--skip-active-job</code></td>
      <td>Omits Active Job.</td>
    </tr>
    <tr>
      <td><code>--skip-active-storage</code></td>
      <td>Omits Active Storage.</td>
    </tr>
    <tr>
      <td><code>--skip-javascript</code></td>
      <td>Omits JavaScript files.</td>
    </tr>
    <tr>
      <td><code>--skip-asset-pipeline</code></td>
      <td>Omits asset pipeline entirely. Good for API-only engines.</td>
    </tr>
  </tbody>
</table>

<blockquote>
  <p><strong>Note:</strong> There is no <code>--api</code> flag for <code>rails plugin new</code>. Unlike <code>rails new --api</code> for applications, engine generation does not support an API-only mode out of the box. To configure an engine for API-only behaviour, see Chapter 7.</p>
</blockquote>

<h3 id="--mountable-vs---full"><code>--mountable</code> vs <code>--full</code></h3>

<table>
  <thead>
    <tr>
      <th> </th>
      <th><code>--mountable</code></th>
      <th><code>--full</code></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>isolate_namespace</code></td>
      <td>Yes</td>
      <td>No</td>
    </tr>
    <tr>
      <td>Table prefix</td>
      <td><code>engine_name_</code></td>
      <td>None</td>
    </tr>
    <tr>
      <td>Routes</td>
      <td>Isolated (<code>Engine.routes.draw</code>)</td>
      <td>Merged into host</td>
    </tr>
    <tr>
      <td>Controllers</td>
      <td><code>EngineName::ApplicationController &lt; ActionController::Base</code></td>
      <td><code>ApplicationController &lt; ActionController::Base</code></td>
    </tr>
    <tr>
      <td>Use case</td>
      <td>Domain isolation</td>
      <td>Framework extension</td>
    </tr>
  </tbody>
</table>

<h3 id="running-generators-inside-an-engine">Running generators inside an engine</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd </span>engines/billing
bin/rails generate model Invoice amount_cents:integer currency:string
bin/rails generate controller Invoices index show
bin/rails generate migration AddStatusToInvoices status:integer
</code></pre></div></div>

<hr />

<h2 id="configuration-options">Configuration Options</h2>

<h3 id="isolate_namespace"><code>isolate_namespace</code></h3>

<p>The single most important line. Creates the boundary.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing/engine.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Billing</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Effects: namespaces models (<code>Billing::Invoice</code>), prefixes tables (<code>billing_invoices</code>), isolates routes, scopes view lookups, prevents helper bleed.</p>

<h3 id="configgenerators"><code>config.generators</code></h3>

<p>Configure the engine’s generators (test framework, ORM, stylesheets, etc.).</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Billing</span>

    <span class="n">config</span><span class="p">.</span><span class="nf">generators</span> <span class="k">do</span> <span class="o">|</span><span class="n">g</span><span class="o">|</span>
      <span class="n">g</span><span class="p">.</span><span class="nf">test_framework</span> <span class="ss">:rspec</span>
      <span class="n">g</span><span class="p">.</span><span class="nf">fixture_replacement</span> <span class="ss">:factory_bot</span>
      <span class="n">g</span><span class="p">.</span><span class="nf">factory_bot</span> <span class="ss">dir: </span><span class="s2">"spec/factories"</span>
      <span class="n">g</span><span class="p">.</span><span class="nf">orm</span> <span class="ss">:active_record</span>
      <span class="n">g</span><span class="p">.</span><span class="nf">stylesheets</span> <span class="kp">false</span>
      <span class="n">g</span><span class="p">.</span><span class="nf">javascripts</span> <span class="kp">false</span>
      <span class="n">g</span><span class="p">.</span><span class="nf">helper</span> <span class="kp">false</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="initializer-blocks"><code>initializer</code> blocks</h3>

<p>Hook into the Rails boot process. Execute code at a specific point in the startup sequence.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Billing</span>

    <span class="c1"># Runs when Active Record is loaded</span>
    <span class="n">initializer</span> <span class="s2">"billing.active_record"</span> <span class="k">do</span>
      <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:active_record</span><span class="p">)</span> <span class="k">do</span>
        <span class="c1"># AR-level config here</span>
      <span class="k">end</span>
    <span class="k">end</span>

    <span class="c1"># Runs after full app initialisation</span>
    <span class="n">initializer</span> <span class="s2">"billing.setup"</span><span class="p">,</span> <span class="ss">after: :finisher_hook</span> <span class="k">do</span>
      <span class="no">Billing</span><span class="p">.</span><span class="nf">validate_configuration!</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="lazy-load-hooks">Lazy load hooks</h3>

<p>Use these inside <code>initializer</code> blocks. They fire only when the given framework component loads.</p>

<table>
  <thead>
    <tr>
      <th>Hook</th>
      <th>Fires when…</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>ActiveSupport.on_load(:active_record)</code></td>
      <td>Active Record is loaded</td>
    </tr>
    <tr>
      <td><code>ActiveSupport.on_load(:action_controller_base)</code></td>
      <td><code>ActionController::Base</code> is loaded</td>
    </tr>
    <tr>
      <td><code>ActiveSupport.on_load(:action_controller_api)</code></td>
      <td><code>ActionController::API</code> is loaded</td>
    </tr>
    <tr>
      <td><code>ActiveSupport.on_load(:action_view)</code></td>
      <td>Action View is loaded</td>
    </tr>
    <tr>
      <td><code>ActiveSupport.on_load(:action_mailer)</code></td>
      <td>Action Mailer is loaded</td>
    </tr>
    <tr>
      <td><code>ActiveSupport.on_load(:active_job)</code></td>
      <td>Active Job is loaded</td>
    </tr>
  </tbody>
</table>

<h3 id="configautoload_paths-and-configeager_load_paths"><code>config.autoload_paths</code> and <code>config.eager_load_paths</code></h3>

<p>Subdirectories under an engine’s <code>app/</code> directory (like <code>app/services/</code>, <code>app/queries/</code>) are automatically included in the engine’s eager load paths. You only need manual path registration for directories <strong>outside</strong> the standard <code>app/</code> tree.</p>

<p>Note: autoload and eager load paths are frozen early in the boot process (before normal initializers run), so path configuration must happen in the engine class body, not inside an <code>initializer</code> block:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Billing</span>

    <span class="c1"># For directories outside app/ (e.g., lib/billing/core)</span>
    <span class="n">config</span><span class="p">.</span><span class="nf">autoload_paths</span> <span class="o">&lt;&lt;</span> <span class="n">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"lib"</span><span class="p">,</span> <span class="s2">"billing"</span><span class="p">,</span> <span class="s2">"core"</span><span class="p">)</span>
    <span class="n">config</span><span class="p">.</span><span class="nf">eager_load_paths</span> <span class="o">&lt;&lt;</span> <span class="n">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"lib"</span><span class="p">,</span> <span class="s2">"billing"</span><span class="p">,</span> <span class="s2">"core"</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="configto_prepare"><code>config.to_prepare</code></h3>

<p>Runs on every request in development, once in production. Use for code that depends on the full app environment.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">initializer</span> <span class="s2">"billing.to_prepare"</span> <span class="k">do</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">to_prepare</span> <span class="k">do</span>
    <span class="no">Billing</span><span class="o">::</span><span class="no">WebhookProcessor</span><span class="p">.</span><span class="nf">configure!</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="mattr_accessor-for-engine-configuration"><code>mattr_accessor</code> for engine configuration</h3>

<p>Define configurable options on the engine’s top-level module.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="n">mattr_accessor</span> <span class="ss">:customer_class</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">customer_class</span> <span class="o">=</span> <span class="s2">"User"</span>

  <span class="n">mattr_accessor</span> <span class="ss">:currency</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">currency</span> <span class="o">=</span> <span class="s2">"GBP"</span>

  <span class="n">mattr_accessor</span> <span class="ss">:tax_rate</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">tax_rate</span> <span class="o">=</span> <span class="mf">0.20</span>

  <span class="n">mattr_accessor</span> <span class="ss">:parent_controller</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"::ApplicationController"</span>

  <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">customer_model</span>
    <span class="n">customer_class</span><span class="p">.</span><span class="nf">constantize</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="adding-engine-locale-files">Adding engine locale files</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">initializer</span> <span class="s2">"billing.i18n"</span> <span class="k">do</span>
  <span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"config/locales/**/*.{rb,yml}"</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">path</span><span class="o">|</span>
    <span class="no">I18n</span><span class="p">.</span><span class="nf">load_path</span> <span class="o">&lt;&lt;</span> <span class="n">path</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="appending-engine-migrations-to-host">Appending engine migrations to host</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">initializer</span> <span class="s2">"billing.append_migrations"</span> <span class="k">do</span> <span class="o">|</span><span class="n">app</span><span class="o">|</span>
  <span class="k">unless</span> <span class="n">app</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">to_s</span><span class="p">.</span><span class="nf">match?</span><span class="p">(</span><span class="n">root</span><span class="p">.</span><span class="nf">to_s</span><span class="p">)</span>
    <span class="n">config</span><span class="p">.</span><span class="nf">paths</span><span class="p">[</span><span class="s2">"db/migrate"</span><span class="p">].</span><span class="nf">expanded</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">path</span><span class="o">|</span>
      <span class="n">app</span><span class="p">.</span><span class="nf">config</span><span class="p">.</span><span class="nf">paths</span><span class="p">[</span><span class="s2">"db/migrate"</span><span class="p">]</span> <span class="o">&lt;&lt;</span> <span class="n">path</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This auto-appends migrations so the host app does not need to run <code>install:migrations</code>. Use one approach or the other, not both.</p>

<hr />

<h2 id="common-patterns-and-recipes">Common Patterns and Recipes</h2>

<h3 id="mount-an-engine-in-the-host-apps-routes">Mount an engine in the host app’s routes</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/routes.rb (host app)</span>
<span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">mount</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/billing"</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="mount-with-a-named-route-helper">Mount with a named route helper</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">mount</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/billing"</span><span class="p">,</span> <span class="ss">as: </span><span class="s2">"billing"</span>
<span class="c1"># Host views: billing.invoices_path</span>
</code></pre></div></div>

<h3 id="expose-a-concern-from-an-engine">Expose a concern from an engine</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/concerns/billing/billable.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">Billable</span>
    <span class="kp">extend</span> <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Concern</span>

    <span class="n">included</span> <span class="k">do</span>
      <span class="n">has_many</span> <span class="ss">:invoices</span><span class="p">,</span>
               <span class="ss">class_name: </span><span class="s2">"Billing::Invoice"</span><span class="p">,</span>
               <span class="ss">foreign_key: :user_id</span><span class="p">,</span>
               <span class="ss">dependent: :restrict_with_error</span>

      <span class="n">has_many</span> <span class="ss">:subscriptions</span><span class="p">,</span>
               <span class="ss">class_name: </span><span class="s2">"Billing::Subscription"</span><span class="p">,</span>
               <span class="ss">foreign_key: :user_id</span><span class="p">,</span>
               <span class="ss">dependent: :restrict_with_error</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># Host app: app/models/user.rb</span>
<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="configure-a-base-controller-dependency-inversion">Configure a base controller (dependency inversion)</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing.rb</span>
<span class="n">mattr_accessor</span> <span class="ss">:parent_controller</span>
<span class="nb">self</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ActionController::Base"</span>

<span class="c1"># engines/billing/app/controllers/billing/application_controller.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span><span class="p">.</span><span class="nf">constantize</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># Host app: config/initializers/billing.rb</span>
<span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ApplicationController"</span>
</code></pre></div></div>

<h3 id="publish-an-event-with-activesupportnotifications">Publish an event with <code>ActiveSupport::Notifications</code></h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"invoice.paid.billing"</span><span class="p">,</span> <span class="p">{</span>
  <span class="ss">invoice_id: </span><span class="nb">id</span><span class="p">,</span>
  <span class="ss">amount_cents: </span><span class="n">amount_cents</span><span class="p">,</span>
  <span class="ss">customer_id: </span><span class="n">customer_id</span>
<span class="p">})</span>
</code></pre></div></div>

<h3 id="subscribe-to-an-event-from-another-engine">Subscribe to an event from another engine</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/config/initializers/billing_events.rb</span>
<span class="k">if</span> <span class="k">defined?</span><span class="p">(</span><span class="no">Billing</span><span class="p">)</span>
  <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="s2">"invoice.paid.billing"</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">event</span><span class="o">|</span>
    <span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span>
      <span class="ss">recipient_id: </span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:customer_id</span><span class="p">],</span>
      <span class="ss">subject: </span><span class="s2">"Payment received"</span>
    <span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="copy-engine-migrations-to-host-app">Copy engine migrations to host app</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/rails billing:install:migrations
bin/rails db:migrate
</code></pre></div></div>

<h3 id="auto-append-engine-migrations-no-copy-step">Auto-append engine migrations (no copy step)</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing/engine.rb</span>
<span class="n">initializer</span> <span class="s2">"billing.migrations"</span> <span class="k">do</span> <span class="o">|</span><span class="n">app</span><span class="o">|</span>
  <span class="k">unless</span> <span class="n">app</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">to_s</span><span class="p">.</span><span class="nf">match?</span><span class="p">(</span><span class="n">root</span><span class="p">.</span><span class="nf">to_s</span><span class="p">)</span>
    <span class="n">config</span><span class="p">.</span><span class="nf">paths</span><span class="p">[</span><span class="s2">"db/migrate"</span><span class="p">].</span><span class="nf">expanded</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">path</span><span class="o">|</span>
      <span class="n">app</span><span class="p">.</span><span class="nf">config</span><span class="p">.</span><span class="nf">paths</span><span class="p">[</span><span class="s2">"db/migrate"</span><span class="p">]</span> <span class="o">&lt;&lt;</span> <span class="n">path</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="use-bundle-config-local-for-local-engine-development-no-gemfilelock-churn">Use <code>bundle config local</code> for local engine development (no Gemfile.lock churn)</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Gemfile uses branch: instead of tag:</span>
<span class="c"># gem "billing", git: "git@github.com:org/billing.git", branch: "main"</span>

bundle config <span class="nb">set</span> <span class="nt">--local</span> local.billing ../billing-engine
bundle config <span class="nb">unset</span> <span class="nt">--local</span> local.billing  <span class="c"># to remove</span>
</code></pre></div></div>

<p>See Chapter 14 for the full local-development workflow.</p>

<h3 id="semantic-versioning-with-git-tags">Semantic versioning with git tags</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Inside the engine repo</span>
<span class="nb">cd </span>engines/billing
<span class="c"># Bump version in lib/billing/version.rb, then:</span>
git tag <span class="nt">-a</span> v1.2.0 <span class="nt">-m</span> <span class="s2">"Release v1.2.0: add refund support"</span>
git push origin v1.2.0
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Host app Gemfile</span>
<span class="n">gem</span> <span class="s2">"billing"</span><span class="p">,</span> <span class="ss">git: </span><span class="s2">"git@github.com:org/billing.git"</span><span class="p">,</span> <span class="ss">tag: </span><span class="s2">"v1.2.0"</span>
</code></pre></div></div>

<h3 id="run-engine-tests-in-isolation">Run engine tests in isolation</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd </span>engines/billing
bundle <span class="nb">install
</span>bin/rails db:create db:migrate <span class="nv">RAILS_ENV</span><span class="o">=</span><span class="nb">test
</span>bundle <span class="nb">exec </span>rspec
</code></pre></div></div>

<p>Or from the host app root with a script:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">#!/usr/bin/env bash</span>
<span class="c"># bin/test-engine</span>
<span class="nv">ENGINE</span><span class="o">=</span><span class="nv">$1</span>
<span class="nb">cd</span> <span class="s2">"engines/</span><span class="k">${</span><span class="nv">ENGINE</span><span class="k">}</span><span class="s2">"</span> <span class="o">&amp;&amp;</span> bundle <span class="nb">exec </span>rspec
</code></pre></div></div>

<h3 id="add-a-foreign-key-across-engine-boundaries">Add a foreign key across engine boundaries</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/db/migrate/XXXXXX_create_billing_invoices.rb</span>
<span class="k">class</span> <span class="nc">CreateBillingInvoices</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">create_table</span> <span class="ss">:billing_invoices</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">bigint</span> <span class="ss">:user_id</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">integer</span> <span class="ss">:amount_cents</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">timestamps</span>
    <span class="k">end</span>

    <span class="n">add_foreign_key</span> <span class="ss">:billing_invoices</span><span class="p">,</span> <span class="ss">:users</span><span class="p">,</span> <span class="ss">column: :user_id</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This couples the engine’s schema to the host app’s <code>users</code> table. The trade-off: you get referential integrity but lose portability. For maximum isolation, use a polymorphic association instead (no FK constraint).</p>

<h3 id="polymorphic-alternative-no-foreign-key">Polymorphic alternative (no foreign key)</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">create_table</span> <span class="ss">:billing_invoices</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
  <span class="n">t</span><span class="p">.</span><span class="nf">references</span> <span class="ss">:customer</span><span class="p">,</span> <span class="ss">polymorphic: </span><span class="kp">true</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
  <span class="n">t</span><span class="p">.</span><span class="nf">integer</span> <span class="ss">:amount_cents</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
  <span class="n">t</span><span class="p">.</span><span class="nf">timestamps</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="override-engine-views-from-the-host-app">Override engine views from the host app</h3>

<p>Place a file at the same path in the host app. Rails checks the host first.</p>

<pre><code># Engine view:
engines/billing/app/views/billing/invoices/index.html.erb

# Host override (takes precedence):
app/views/billing/invoices/index.html.erb
</code></pre>

<h3 id="access-host-app-routes-from-inside-an-engine">Access host app routes from inside an engine</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In engine controller or view</span>
<span class="n">main_app</span><span class="p">.</span><span class="nf">root_path</span>
<span class="n">main_app</span><span class="p">.</span><span class="nf">user_path</span><span class="p">(</span><span class="n">user</span><span class="p">)</span>
</code></pre></div></div>

<h3 id="access-engine-routes-from-host-app-views">Access engine routes from host app views</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># 'billing' is the mount name from routes.rb</span>
<span class="n">billing</span><span class="p">.</span><span class="nf">invoices_path</span>
<span class="n">billing</span><span class="p">.</span><span class="nf">invoice_path</span><span class="p">(</span><span class="n">invoice</span><span class="p">)</span>
</code></pre></div></div>

<h3 id="inject-a-helper-into-host-app-views">Inject a helper into host app views</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing/engine.rb</span>
<span class="n">initializer</span> <span class="s2">"billing.view_helpers"</span> <span class="k">do</span>
  <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:action_view</span><span class="p">)</span> <span class="k">do</span>
    <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">InvoiceHelper</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="add-an-engine-dependency-on-another-engine">Add an engine dependency on another engine</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/billing.gemspec</span>
<span class="n">spec</span><span class="p">.</span><span class="nf">add_dependency</span> <span class="s2">"core"</span>

<span class="c1"># engines/billing/lib/billing/engine.rb</span>
<span class="nb">require</span> <span class="s2">"core"</span>
</code></pre></div></div>

<h3 id="guard-against-optional-engine-dependencies">Guard against optional engine dependencies</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">if</span> <span class="k">defined?</span><span class="p">(</span><span class="no">Billing</span><span class="p">)</span>
  <span class="c1"># Safe to reference Billing classes</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="rake-task-to-test-all-engines">Rake task to test all engines</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Rakefile (host app root)</span>
<span class="n">namespace</span> <span class="ss">:engines</span> <span class="k">do</span>
  <span class="n">desc</span> <span class="s2">"Run specs for all engines"</span>
  <span class="n">task</span> <span class="ss">:spec</span> <span class="k">do</span>
    <span class="no">Dir</span><span class="p">[</span><span class="s2">"engines/*"</span><span class="p">].</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">engine_path</span><span class="o">|</span>
      <span class="n">engine</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">basename</span><span class="p">(</span><span class="n">engine_path</span><span class="p">)</span>
      <span class="nb">puts</span> <span class="s2">"</span><span class="se">\n</span><span class="s2">=== Testing </span><span class="si">#{</span><span class="n">engine</span><span class="si">}</span><span class="s2"> ==="</span>
      <span class="nb">system</span><span class="p">(</span><span class="s2">"cd </span><span class="si">#{</span><span class="n">engine_path</span><span class="si">}</span><span class="s2"> &amp;&amp; bundle exec rspec"</span><span class="p">)</span> <span class="o">||</span> <span class="nb">exit</span><span class="p">(</span><span class="mi">1</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="engine-rspec-setup-with-dummy-app">Engine RSpec setup with dummy app</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/rails_helper.rb</span>
<span class="nb">require</span> <span class="s2">"spec_helper"</span>
<span class="no">ENV</span><span class="p">[</span><span class="s2">"RAILS_ENV"</span><span class="p">]</span> <span class="o">||=</span> <span class="s2">"test"</span>
<span class="nb">require</span> <span class="no">File</span><span class="p">.</span><span class="nf">expand_path</span><span class="p">(</span><span class="s2">"../spec/dummy/config/environment"</span><span class="p">,</span> <span class="n">__dir__</span><span class="p">)</span>

<span class="nb">require</span> <span class="s2">"rspec/rails"</span>
<span class="nb">require</span> <span class="s2">"factory_bot_rails"</span>

<span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">.</span><span class="nf">maintain_test_schema!</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">configure</span> <span class="k">do</span> <span class="o">|</span><span class="n">config</span><span class="o">|</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">fixture_paths</span> <span class="o">=</span> <span class="p">[</span><span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"spec/fixtures"</span><span class="p">)]</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">use_transactional_fixtures</span> <span class="o">=</span> <span class="kp">true</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">infer_spec_type_from_file_location!</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">include</span> <span class="no">FactoryBot</span><span class="o">::</span><span class="no">Syntax</span><span class="o">::</span><span class="no">Methods</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="dependency-injection-with-drycontainer">Dependency Injection with Dry::Container</h3>

<p>Use when you have 4+ engines with complex service dependencies and <code>mattr_accessor</code> configuration (Chapter 8) is no longer enough.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Gemfile</span>
<span class="n">gem</span> <span class="s2">"dry-container"</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/dependencies/billing_container.rb</span>
<span class="nb">require</span> <span class="s2">"dry/container"</span>

<span class="k">class</span> <span class="nc">BillingContainer</span>
  <span class="kp">extend</span> <span class="no">Dry</span><span class="o">::</span><span class="no">Container</span><span class="o">::</span><span class="no">Mixin</span>

  <span class="n">register</span> <span class="s2">"invoice_generator"</span> <span class="k">do</span>
    <span class="no">Billing</span><span class="o">::</span><span class="no">InvoiceGenerator</span><span class="p">.</span><span class="nf">new</span>
  <span class="k">end</span>

  <span class="n">register</span> <span class="s2">"payment_processor"</span> <span class="k">do</span>
    <span class="no">Billing</span><span class="o">::</span><span class="no">PaymentProcessor</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
      <span class="ss">api_key: </span><span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">credentials</span><span class="p">.</span><span class="nf">stripe_api_key</span>
    <span class="p">)</span>
  <span class="k">end</span>

  <span class="n">register</span> <span class="s2">"subscription_renewal"</span> <span class="k">do</span>
    <span class="no">Billing</span><span class="o">::</span><span class="no">SubscriptionRenewal</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
      <span class="ss">invoice_generator: </span><span class="n">resolve</span><span class="p">(</span><span class="s2">"invoice_generator"</span><span class="p">)</span>
    <span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Usage</span>
<span class="no">BillingContainer</span><span class="p">.</span><span class="nf">resolve</span><span class="p">(</span><span class="s2">"invoice_generator"</span><span class="p">).</span><span class="nf">call</span><span class="p">(</span><span class="ss">subscription: </span><span class="n">subscription</span><span class="p">)</span>
</code></pre></div></div>

<p><strong>When you need it:</strong></p>
<ul>
  <li>Engine services depend on other engine services (the container resolves the chain)</li>
  <li>You want to swap implementations in tests without monkey-patching</li>
  <li>Multiple developers need to understand the wiring at a glance</li>
</ul>

<p><strong>When you don’t:</strong> For fewer than four engines, a simple initializer is fine:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/initializers/billing.rb</span>
<span class="no">Billing</span><span class="p">.</span><span class="nf">payment_gateway</span> <span class="o">=</span> <span class="no">Billing</span><span class="o">::</span><span class="no">StripeGateway</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
  <span class="ss">api_key: </span><span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">credentials</span><span class="p">.</span><span class="nf">stripe_api_key</span>
<span class="p">)</span>
</code></pre></div></div>

<hr />

<h2 id="cheat-sheet-engine-file-layout">Cheat Sheet: Engine File Layout</h2>

<pre><code>engines/billing/
├── app/
│   ├── controllers/billing/
│   ├── models/billing/
│   ├── models/concerns/billing/
│   ├── views/billing/
│   ├── jobs/billing/
│   ├── mailers/billing/
│   └── helpers/billing/
├── config/
│   ├── routes.rb
│   └── locales/
├── db/
│   └── migrate/
├── lib/
│   ├── billing.rb              ← mattr_accessor config
│   ├── billing/engine.rb       ← isolate_namespace, initializers
│   └── billing/version.rb
├── spec/
│   ├── dummy/                  ← lightweight Rails app for testing
│   ├── models/
│   ├── controllers/
│   ├── factories/
│   └── rails_helper.rb
├── billing.gemspec
├── Gemfile
└── Rakefile
</code></pre>

<hr />

<h2 id="quick-diagnostic">Quick Diagnostic</h2>

<table>
  <thead>
    <tr>
      <th>Symptom</th>
      <th>Likely cause</th>
      <th>Fix</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>uninitialized constant Billing::Invoice</code></td>
      <td>Engine not loaded, or autoload path missing</td>
      <td>Check <code>Gemfile</code> path, check <code>require "billing"</code></td>
    </tr>
    <tr>
      <td><code>Table 'billing_invoices' doesn't exist</code></td>
      <td>Migrations not copied/run</td>
      <td><code>bin/rails billing:install:migrations &amp;&amp; bin/rails db:migrate</code></td>
    </tr>
    <tr>
      <td>Route helper returns wrong path</td>
      <td>Using engine helper in host (or vice versa)</td>
      <td>Use <code>billing.invoices_path</code> from host, <code>main_app.root_path</code> from engine</td>
    </tr>
    <tr>
      <td>Host app <code>current_user</code> unavailable in engine controller</td>
      <td>Engine inherits <code>ActionController::Base</code></td>
      <td>Set <code>Billing.parent_controller = "ApplicationController"</code></td>
    </tr>
    <tr>
      <td>Engine views not rendering host layout</td>
      <td>Engine has its own layout</td>
      <td>Delete <code>app/views/layouts/billing/application.html.erb</code> or set <code>layout "application"</code> in engine’s <code>ApplicationController</code></td>
    </tr>
    <tr>
      <td><code>NoMethodError</code> for concern method on host model</td>
      <td>Concern not included</td>
      <td>Add <code>include Billing::Billable</code> to the model</td>
    </tr>
    <tr>
      <td>Double table prefix (<code>billing_billing_invoices</code>)</td>
      <td>Ran generator from host app root instead of engine root</td>
      <td>Run generators from <code>engines/billing/</code></td>
    </tr>
    <tr>
      <td>Circular dependency error</td>
      <td>Engine A depends on Engine B and vice versa</td>
      <td>Break with events or extract shared logic to a core engine</td>
    </tr>
  </tbody>
</table>

<hr />

<h2 id="i18n-across-engine-boundaries">i18n Across Engine Boundaries</h2>

<h3 id="engine-locale-files">Engine locale files</h3>

<p>Place locale files under the engine’s <code>config/locales/</code> directory. Nest all keys under the engine name.</p>

<pre><code>engines/billing/config/locales/en.yml
</code></pre>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="na">en</span><span class="pi">:</span>
  <span class="na">billing</span><span class="pi">:</span>
    <span class="na">invoices</span><span class="pi">:</span>
      <span class="na">index</span><span class="pi">:</span>
        <span class="na">title</span><span class="pi">:</span> <span class="s2">"</span><span class="s">Invoices"</span>
      <span class="na">show</span><span class="pi">:</span>
        <span class="na">status</span><span class="pi">:</span>
          <span class="na">pending</span><span class="pi">:</span> <span class="s2">"</span><span class="s">Pending"</span>
          <span class="na">paid</span><span class="pi">:</span> <span class="s2">"</span><span class="s">Paid"</span>
          <span class="na">overdue</span><span class="pi">:</span> <span class="s2">"</span><span class="s">Overdue"</span>
    <span class="na">plans</span><span class="pi">:</span>
      <span class="na">starter</span><span class="pi">:</span> <span class="s2">"</span><span class="s">Starter</span><span class="nv"> </span><span class="s">Plan"</span>
      <span class="na">pro</span><span class="pi">:</span> <span class="s2">"</span><span class="s">Professional</span><span class="nv"> </span><span class="s">Plan"</span>
</code></pre></div></div>

<h3 id="registering-engine-locales">Registering engine locales</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing/engine.rb</span>
<span class="n">initializer</span> <span class="s2">"billing.i18n"</span> <span class="k">do</span>
  <span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"config/locales/**/*.{rb,yml}"</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">path</span><span class="o">|</span>
    <span class="no">I18n</span><span class="p">.</span><span class="nf">load_path</span> <span class="o">&lt;&lt;</span> <span class="n">path</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="using-translations-in-engine-views">Using translations in engine views</h3>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nt">&lt;h1&gt;</span><span class="cp">&lt;%=</span> <span class="n">t</span><span class="p">(</span><span class="s2">".title"</span><span class="p">)</span> <span class="cp">%&gt;</span><span class="nt">&lt;/h1&gt;</span>
<span class="c">&lt;%# Resolves to billing.invoices.index.title because the view is at
    engines/billing/app/views/billing/invoices/index.html.erb %&gt;</span>
</code></pre></div></div>

<p>Rails prefixes view-relative lookups (<code>t(".key")</code>) with the controller namespace. Engine views resolve naturally.</p>

<h3 id="using-engine-translations-from-the-host-app">Using engine translations from the host app</h3>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="cp">&lt;%=</span> <span class="n">t</span><span class="p">(</span><span class="s2">"billing.plans.pro"</span><span class="p">)</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<p>Full key path. Works anywhere in the host.</p>

<h3 id="avoiding-key-collisions">Avoiding key collisions</h3>

<p>Always nest under the engine name. View-relative lookups handle this automatically. For model validations and flash messages, use explicit keys:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>
<span class="n">validates</span> <span class="ss">:amount_cents</span><span class="p">,</span> <span class="ss">numericality: </span><span class="p">{</span>
  <span class="ss">greater_than: </span><span class="mi">0</span><span class="p">,</span>
  <span class="ss">message: </span><span class="no">I18n</span><span class="p">.</span><span class="nf">t</span><span class="p">(</span><span class="s2">"billing.errors.invalid_amount"</span><span class="p">)</span>
<span class="p">}</span>
</code></pre></div></div>

<h3 id="testing-translations">Testing translations</h3>

<p>Verify engine locale files load and keys resolve:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/i18n_spec.rb</span>
<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="s2">"i18n"</span> <span class="k">do</span>
  <span class="n">it</span> <span class="s2">"has no missing translations"</span> <span class="k">do</span>
    <span class="n">missing</span> <span class="o">=</span> <span class="no">I18n</span><span class="p">.</span><span class="nf">backend</span><span class="p">.</span><span class="nf">translations</span><span class="p">[</span><span class="ss">:en</span><span class="p">].</span><span class="nf">deep_stringify_keys</span>
    <span class="c1"># Simply verify that key files load without error</span>
    <span class="n">expect</span><span class="p">(</span><span class="no">I18n</span><span class="p">.</span><span class="nf">t</span><span class="p">(</span><span class="s2">"billing.invoices.index.title"</span><span class="p">)).</span><span class="nf">not_to</span> <span class="kp">include</span><span class="p">(</span><span class="s2">"translation missing"</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/appendix-a-companion-application/">&larr; Appendix A: The Companion Application</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/appendix-c-further-reading/">Appendix C: Further Reading &rarr;</a>
</nav>
{% endraw %}
