---
layout: book
book: modular_rails
title: "Rails Engines from the Inside Out"
permalink: /books/modular-rails/chapter-05-rails-engines-from-the-inside-out/
description: "How Rails engines really work, read from the Rails 8.1 source: the boot process, the inheritance chain, and why your app is itself an engine."
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-04-extreme-programming-and-emergent-design/">&larr; Extreme Programming and Emergent Design</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-06-namespace-isolation/">Namespace Isolation &rarr;</a>
</nav>

<h1 id="chapter-5-rails-engines-from-the-inside-out">Chapter 5: Rails Engines from the Inside Out</h1>

<p><em>Want the overview first? <a href="/modular-monolith-rails/">The Modular Monolith in Rails</a> is a free, single-page guide to engines, Packwerk and namespace isolation before you go source-diving here.</em></p>

<p>You’ve been using engines every day without knowing it. Your Rails application <em>is</em> an engine. Understanding that fact – really understanding it, down to the source code – changes how you think about modularising your application.</p>

<p>This chapter takes you inside the Rails source. We’ll read the actual code that powers engines in Rails 8.1, and by the end you’ll understand exactly what happens when Rails boots an engine, how <code>isolate_namespace</code> works, and why the inheritance chain matters.</p>

<hr />

<h2 id="what-is-a-rails-engine">What Is a Rails Engine?</h2>

<p>The Rails Guides give us the official definition: <em>“an engine is a miniature application that provides functionality to its host application.”</em> That’s accurate, but it undersells the relationship.</p>

<p>Here’s what the Rails source actually says:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># railties/lib/rails/engine.rb (Rails 8.1.2)</span>

<span class="c1"># +Rails::Engine+ allows you to wrap a specific Rails application or subset of</span>
<span class="c1"># functionality and share it with other applications or within a larger packaged</span>
<span class="c1"># application. Every Rails::Application is just an engine, which allows for simple</span>
<span class="c1"># feature and application sharing.</span>
</code></pre></div></div>

<p>Read that last sentence carefully: <strong>“Every Rails::Application is just an engine.”</strong> Your application isn’t something separate from engines. It <em>is</em> one. An engine with extra powers.</p>

<p>This means every feature of an engine – isolated routes, autoloaded models, view resolution, initializers, middleware – is the same machinery that powers your application. When you create a new engine, you’re not learning a different framework. You’re using the same framework you already know, at a smaller scale.</p>

<hr />

<h2 id="the-inheritance-chain">The Inheritance Chain</h2>

<p>Let’s trace the inheritance. When you create an engine, your class looks like this:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Notifications</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>And when Rails creates your application (in <code>config/application.rb</code>), it looks like this:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">ModularRails</span>
  <span class="k">class</span> <span class="nc">Application</span> <span class="o">&lt;</span> <span class="no">Rails</span><span class="o">::</span><span class="no">Application</span>
    <span class="c1"># ...</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The inheritance chain is:</p>

<pre><code>Your Engine  &lt; Rails::Engine  &lt; Rails::Railtie  &lt; Object
Your App     &lt; Rails::Application &lt; Rails::Engine &lt; Rails::Railtie &lt; Object
</code></pre>

<div class="diagram"><img src="/img/books/modular-rails/0feb2849334d64672756339477ad0ec5215899daec5adb4e7d667030445c05d9.svg" alt="Mermaid diagram: classDiagram"></div>

<p>Your application inherits from <code>Rails::Application</code>, which inherits from <code>Rails::Engine</code>. This is the key architectural insight: <strong>an application is an engine with additional responsibilities</strong>. The <code>Application</code> class adds boot coordination, secret management, environment configuration, and the final middleware stack. But the core behaviour – loading models, controllers, views, routes, migrations, tasks – all comes from <code>Engine</code>.</p>

<p>Let’s look at the top of <code>Rails::Application</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># railties/lib/rails/application.rb (Rails 8.1.2)</span>

<span class="nb">require</span> <span class="s2">"rails/engine"</span>

<span class="k">module</span> <span class="nn">Rails</span>
  <span class="c1"># An Engine with the responsibility of coordinating the whole boot process.</span>
  <span class="k">class</span> <span class="nc">Application</span> <span class="o">&lt;</span> <span class="no">Engine</span>
    <span class="c1"># ...</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>It <code>require</code>s <code>rails/engine</code> and inherits from it. That’s the entire relationship. Everything your application can do, an engine can do – minus the application-level coordination.</p>

<hr />

<h2 id="what-railsrailtie-provides">What Rails::Railtie Provides</h2>

<p>At the bottom of the chain sits <code>Rails::Railtie</code>. This is the foundation that gives engines (and your application) their lifecycle hooks:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># railties/lib/rails/railtie.rb (Rails 8.1.2)</span>

<span class="k">module</span> <span class="nn">Rails</span>
  <span class="c1"># +Rails::Railtie+ is the core of the Rails framework and provides</span>
  <span class="c1"># several hooks to extend Rails and/or modify the initialization process.</span>
  <span class="c1">#</span>
  <span class="c1"># Every major component of Rails (Action Mailer, Action Controller, Active</span>
  <span class="c1"># Record, etc.) implements a railtie. Each of them is responsible for their</span>
  <span class="c1"># own initialization.</span>
</code></pre></div></div>

<p>Every major Rails component – Active Record, Action Controller, Action Mailer – is a Railtie. Your engine is a Railtie. Your application is a Railtie. They all participate in the same boot process through the same hooks: <code>initializer</code>, <code>rake_tasks</code>, <code>generators</code>, <code>console</code>, <code>runner</code>, <code>server</code>.</p>

<p>This means your engine’s initializers run alongside Active Record’s initializers, Action Controller’s initializers, and your application’s initializers. They’re all first-class participants in the boot process, not afterthoughts bolted on.</p>

<hr />

<h2 id="how-rails-boots-an-engine">How Rails Boots an Engine</h2>

<p>When Bundler loads your engine’s gem, Ruby requires the engine’s <code>lib/notifications/engine.rb</code> file. The moment Ruby evaluates <code>class Engine &lt; ::Rails::Engine</code>, Rails registers the engine via the <code>inherited</code> callback:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># railties/lib/rails/engine.rb (line numbers are approximate and may shift between releases)</span>

<span class="k">def</span> <span class="nf">inherited</span><span class="p">(</span><span class="n">base</span><span class="p">)</span>
  <span class="k">unless</span> <span class="n">base</span><span class="p">.</span><span class="nf">abstract_railtie?</span>
    <span class="no">Rails</span><span class="o">::</span><span class="no">Railtie</span><span class="o">::</span><span class="no">Configuration</span><span class="p">.</span><span class="nf">eager_load_namespaces</span> <span class="o">&lt;&lt;</span> <span class="n">base</span>

    <span class="n">base</span><span class="p">.</span><span class="nf">called_from</span> <span class="o">=</span> <span class="k">begin</span>
      <span class="n">call_stack</span> <span class="o">=</span> <span class="n">caller_locations</span><span class="p">.</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">l</span><span class="o">|</span> <span class="n">l</span><span class="p">.</span><span class="nf">absolute_path</span> <span class="o">||</span> <span class="n">l</span><span class="p">.</span><span class="nf">path</span> <span class="p">}</span>
      <span class="no">File</span><span class="p">.</span><span class="nf">dirname</span><span class="p">(</span><span class="n">call_stack</span><span class="p">.</span><span class="nf">detect</span> <span class="p">{</span> <span class="o">|</span><span class="nb">p</span><span class="o">|</span>
        <span class="o">!</span><span class="nb">p</span><span class="p">.</span><span class="nf">match?</span><span class="p">(</span><span class="sr">%r[railties[</span><span class="se">\w</span><span class="sr">.-]*/lib/rails|rack[</span><span class="se">\w</span><span class="sr">.-]*/lib/rack]</span><span class="p">)</span>
      <span class="p">})</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="k">super</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Two things happen:</p>

<ol>
  <li><strong>The engine is registered for eager loading.</strong> Rails adds it to the list of namespaces that will be eager-loaded in production.</li>
  <li><strong>Rails figures out where the engine lives.</strong> It walks the call stack to find the file that defined the engine class, then derives the engine’s root directory from that path. This is how Rails knows where to find <code>app/models</code>, <code>config/routes.rb</code>, and everything else – it works backwards from the location of <code>engine.rb</code>.</li>
</ol>

<p>This is why the directory structure matters. Rails doesn’t scan for files randomly. It knows where your engine lives and it knows what directories to look for because the <code>Engine</code> class defines them:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># The available paths in an engine:</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"app"</span><span class="p">]</span>                 <span class="c1"># =&gt; ["app"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"app/controllers"</span><span class="p">]</span>     <span class="c1"># =&gt; ["app/controllers"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"app/helpers"</span><span class="p">]</span>         <span class="c1"># =&gt; ["app/helpers"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"app/models"</span><span class="p">]</span>          <span class="c1"># =&gt; ["app/models"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"app/views"</span><span class="p">]</span>           <span class="c1"># =&gt; ["app/views"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"lib"</span><span class="p">]</span>                 <span class="c1"># =&gt; ["lib"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"lib/tasks"</span><span class="p">]</span>           <span class="c1"># =&gt; ["lib/tasks"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"config"</span><span class="p">]</span>              <span class="c1"># =&gt; ["config"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"config/initializers"</span><span class="p">]</span> <span class="c1"># =&gt; ["config/initializers"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"config/locales"</span><span class="p">]</span>      <span class="c1"># =&gt; ["config/locales"]</span>
<span class="n">paths</span><span class="p">[</span><span class="s2">"config/routes.rb"</span><span class="p">]</span>    <span class="c1"># =&gt; ["config/routes.rb"]</span>
</code></pre></div></div>

<p>This is the same set of paths your application uses. The engine’s <code>app/</code> directory isn’t a convention – it’s a configured path that Rails actively loads from.</p>

<hr />

<h2 id="the-initializer-chain">The Initializer Chain</h2>

<p>Engines register their initializers during the boot process. Let’s look at the ones defined in <code>Rails::Engine</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">initializer</span> <span class="ss">:set_load_path</span><span class="p">,</span> <span class="ss">before: :bootstrap_hook</span> <span class="k">do</span> <span class="o">|</span><span class="n">app</span><span class="o">|</span>
  <span class="n">_all_load_paths</span><span class="p">(</span><span class="n">app</span><span class="p">.</span><span class="nf">config</span><span class="p">.</span><span class="nf">add_autoload_paths_to_load_path</span><span class="p">).</span><span class="nf">reverse_each</span> <span class="k">do</span> <span class="o">|</span><span class="n">path</span><span class="o">|</span>
    <span class="vg">$LOAD_PATH</span><span class="p">.</span><span class="nf">unshift</span><span class="p">(</span><span class="n">path</span><span class="p">)</span> <span class="k">if</span> <span class="no">File</span><span class="p">.</span><span class="nf">directory?</span><span class="p">(</span><span class="n">path</span><span class="p">)</span>
  <span class="k">end</span>
  <span class="vg">$LOAD_PATH</span><span class="p">.</span><span class="nf">uniq!</span>
<span class="k">end</span>

<span class="n">initializer</span> <span class="ss">:set_autoload_paths</span><span class="p">,</span> <span class="ss">before: :bootstrap_hook</span> <span class="k">do</span>
  <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Dependencies</span><span class="p">.</span><span class="nf">autoload_paths</span><span class="p">.</span><span class="nf">unshift</span><span class="p">(</span><span class="o">*</span><span class="n">_all_autoload_paths</span><span class="p">)</span>
  <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Dependencies</span><span class="p">.</span><span class="nf">autoload_once_paths</span><span class="p">.</span><span class="nf">unshift</span><span class="p">(</span><span class="o">*</span><span class="n">_all_autoload_once_paths</span><span class="p">)</span>
<span class="k">end</span>

<span class="c1"># Note: In Rails 8.1, autoloading is handled entirely by Zeitwerk. The</span>
<span class="c1"># `ActiveSupport::Dependencies.autoload_paths` API still exists as a thin</span>
<span class="c1"># wrapper that delegates to the Zeitwerk loader's `push_dir`. The classic</span>
<span class="c1"># autoloader was removed in Rails 7.0, so this initializer's role is now</span>
<span class="c1"># to register the engine's app/ directories with Zeitwerk so it knows</span>
<span class="c1"># where to find constants.</span>

<span class="n">initializer</span> <span class="ss">:add_routing_paths</span> <span class="k">do</span> <span class="o">|</span><span class="n">app</span><span class="o">|</span>
  <span class="n">routing_paths</span> <span class="o">=</span> <span class="n">paths</span><span class="p">[</span><span class="s2">"config/routes.rb"</span><span class="p">].</span><span class="nf">existent</span>
  <span class="c1"># ...</span>
  <span class="k">if</span> <span class="n">routes?</span> <span class="o">||</span> <span class="n">routing_paths</span><span class="p">.</span><span class="nf">any?</span>
    <span class="n">app</span><span class="p">.</span><span class="nf">routes_reloader</span><span class="p">.</span><span class="nf">paths</span><span class="p">.</span><span class="nf">unshift</span><span class="p">(</span><span class="o">*</span><span class="n">routing_paths</span><span class="p">)</span>
    <span class="n">app</span><span class="p">.</span><span class="nf">routes_reloader</span><span class="p">.</span><span class="nf">route_sets</span> <span class="o">&lt;&lt;</span> <span class="n">routes</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="n">initializer</span> <span class="ss">:add_view_paths</span> <span class="k">do</span>
  <span class="n">views</span> <span class="o">=</span> <span class="n">paths</span><span class="p">[</span><span class="s2">"app/views"</span><span class="p">].</span><span class="nf">existent</span>
  <span class="k">unless</span> <span class="n">views</span><span class="p">.</span><span class="nf">empty?</span>
    <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:action_controller</span><span class="p">)</span> <span class="p">{</span> <span class="n">prepend_view_path</span><span class="p">(</span><span class="n">views</span><span class="p">)</span> <span class="p">}</span>
    <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:action_mailer</span><span class="p">)</span> <span class="p">{</span> <span class="n">prepend_view_path</span><span class="p">(</span><span class="n">views</span><span class="p">)</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="n">initializer</span> <span class="ss">:load_config_initializers</span> <span class="k">do</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">paths</span><span class="p">[</span><span class="s2">"config/initializers"</span><span class="p">].</span><span class="nf">existent</span><span class="p">.</span><span class="nf">sort</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">initializer</span><span class="o">|</span>
    <span class="n">load_config_initializer</span><span class="p">(</span><span class="n">initializer</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="diagram"><img src="/img/books/modular-rails/3cdd7310a85769bb71b7583c4dec4b1e0bbde62789a5f445283a373fd304c38e.svg" alt="Mermaid diagram: sequenceDiagram"></div>

<p>Each initializer does exactly what its name says:</p>

<ul>
  <li><strong><code>set_load_path</code></strong> adds the engine’s directories to Ruby’s <code>$LOAD_PATH</code></li>
  <li><strong><code>set_autoload_paths</code></strong> registers the engine’s <code>app/</code> subdirectories with Zeitwerk for autoloading</li>
  <li><strong><code>add_routing_paths</code></strong> loads the engine’s <code>config/routes.rb</code> into the application’s route reloader</li>
  <li><strong><code>add_view_paths</code></strong> prepends the engine’s views to the view resolution chain (this is why host app views override engine views – the host app’s views are prepended <em>after</em> the engine’s)</li>
  <li><strong><code>load_config_initializers</code></strong> runs any initializer files in the engine’s <code>config/initializers/</code> directory</li>
</ul>

<p>The ordering matters. Notice <code>before: :bootstrap_hook</code> on the load path initializers. Rails ensures the engine’s paths are set up before any application code tries to use them. By the time your application boots, all engine paths are in place, all routes are loaded, and all initializers have run.</p>

<hr />

<h2 id="full-engines-vs-mountable-engines">Full Engines vs Mountable Engines</h2>

<p>When you generate an engine, you choose between two flags:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>rails plugin new engines/my_engine <span class="nt">--full</span>
rails plugin new engines/my_engine <span class="nt">--mountable</span>
</code></pre></div></div>

<p>The difference comes down to <strong>namespace isolation</strong>.</p>

<p>A <strong>full engine</strong> (<code>--full</code>) generates an engine without <code>isolate_namespace</code>. The engine’s models, controllers, and helpers exist in the global namespace alongside the host application’s code. This is how gems like Devise work – <code>Devise::SessionsController</code> exists in the Devise namespace by convention, but Devise’s helpers and routes integrate directly into the host app’s namespace.</p>

<p>A <strong>mountable engine</strong> (<code>--mountable</code>) generates an engine with <code>isolate_namespace</code>. Everything is walled off. The engine gets its own:</p>
<ul>
  <li>Module namespace (all classes live under <code>MyEngine::</code>)</li>
  <li>Table name prefix (<code>my_engine_</code> on all database tables)</li>
  <li>Route set (mounted at a specific path)</li>
  <li>View resolution scope</li>
  <li>Helper isolation</li>
</ul>

<p>For domain isolation – the architectural use case this book focuses on – you almost always want <code>--mountable</code>. The full engine is better suited for gems that need to extend the host application’s behaviour rather than encapsulate a separate domain.</p>

<p>Here’s the practical difference:</p>

<table>
  <thead>
    <tr>
      <th>Aspect</th>
      <th>Full Engine</th>
      <th>Mountable Engine</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Models</td>
      <td><code>Article</code> (global)</td>
      <td><code>MyEngine::Article</code> (namespaced)</td>
    </tr>
    <tr>
      <td>Tables</td>
      <td><code>articles</code></td>
      <td><code>my_engine_articles</code></td>
    </tr>
    <tr>
      <td>Routes</td>
      <td>Merged into host routes</td>
      <td>Isolated, mounted at a path</td>
    </tr>
    <tr>
      <td>Helpers</td>
      <td>Available globally</td>
      <td>Scoped to engine</td>
    </tr>
    <tr>
      <td>Use case</td>
      <td>Extending the host app (like Devise)</td>
      <td>Encapsulating a domain</td>
    </tr>
  </tbody>
</table>

<hr />

<h2 id="how-zeitwerk-autoloading-works-with-engines">How Zeitwerk Autoloading Works with Engines</h2>

<p>Rails 8 uses Zeitwerk exclusively for autoloading. When an engine boots, its <code>app/</code> subdirectories are registered as autoload roots with Zeitwerk. This means:</p>

<ul>
  <li><code>app/models/notifications/notification.rb</code> defines <code>Notifications::Notification</code></li>
  <li><code>app/controllers/notifications/notifications_controller.rb</code> defines <code>Notifications::NotificationsController</code></li>
  <li><code>app/models/concerns/notifications/notifiable.rb</code> defines <code>Notifications::Notifiable</code></li>
</ul>

<p>The file path determines the constant name. Zeitwerk enforces this strictly – if the file path doesn’t match the constant name, you get a <code>Zeitwerk::NameError</code>.</p>

<p>For a mountable engine with <code>isolate_namespace Notifications</code>, Zeitwerk treats the <code>notifications/</code> subdirectory inside each <code>app/</code> component as the namespace root. So you <strong>don’t</strong> need a double-nested directory like <code>app/models/notifications/notifications/notification.rb</code>. The structure is:</p>

<pre><code>app/
  models/
    notifications/           # ← This maps to the Notifications:: namespace
      notification.rb        # ← Defines Notifications::Notification
      application_record.rb  # ← Defines Notifications::ApplicationRecord
</code></pre>

<p>This is the same convention you already use in your host application. If your host app has a <code>Billing::Invoice</code> model, it lives at <code>app/models/billing/invoice.rb</code>. Engines work identically.</p>

<h3 id="the-autoload_lib-trap">The <code>autoload_lib</code> Trap</h3>

<p>Rails 7.1 introduced <code>config.autoload_lib</code> in the host application, which makes everything under <code>lib/</code> autoloadable with a single line:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/application.rb (host app)</span>
<span class="n">config</span><span class="p">.</span><span class="nf">autoload_lib</span><span class="p">(</span><span class="ss">ignore: </span><span class="sx">%w[assets tasks]</span><span class="p">)</span>
</code></pre></div></div>

<p>You might try to do the same in your engine. Don’t. <code>config.autoload_lib</code> is <strong>only available for the host application</strong>, not for engines. Calling it inside an engine’s <code>engine.rb</code> will raise <code>NoMethodError</code>.</p>

<p>The workaround is manual path registration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing/engine.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Billing</span>

    <span class="n">initializer</span> <span class="s2">"billing.autoload"</span> <span class="k">do</span> <span class="o">|</span><span class="n">app</span><span class="o">|</span>
      <span class="n">app</span><span class="p">.</span><span class="nf">config</span><span class="p">.</span><span class="nf">autoload_paths</span> <span class="o">+=</span> <span class="p">[</span><span class="n">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"lib"</span><span class="p">)]</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This is less elegant, but it’s explicit. You control exactly what gets autoloaded, and you can exclude specific subdirectories by being selective about the paths you add.</p>

<h3 id="sti-and-zeitwerk-the-eager-loading-conflict">STI and Zeitwerk: The Eager Loading Conflict</h3>

<p>If your engine uses Single Table Inheritance, you’ll hit a subtle Zeitwerk issue. STI requires all subclasses to be loaded before queries on the base class, but Zeitwerk lazy-loads by default. In development, this means <code>Billing::Payment.all</code> might return only the base class records until you’ve loaded the subclasses:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Force-load STI subclasses in development</span>
<span class="c1"># engines/billing/lib/billing/engine.rb</span>

<span class="n">initializer</span> <span class="s2">"billing.eager_load_sti"</span> <span class="k">do</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">to_prepare</span> <span class="k">do</span>
    <span class="n">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"app/models/billing/payments"</span><span class="p">).</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"**/*.rb"</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">file</span><span class="o">|</span>
      <span class="n">require_dependency</span> <span class="n">file</span><span class="p">.</span><span class="nf">to_s</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>to_prepare</code> block runs on every request in development and once at boot in production. It’s the correct place for this – you need the classes loaded before any query runs, and you need them reloaded when files change.</p>

<h3 id="validating-autoloading-with-zeitwerkcheck">Validating Autoloading with <code>zeitwerk:check</code></h3>

<p>After setting up autoloading in a new engine, run:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/rails zeitwerk:check
</code></pre></div></div>

<p>This task walks every autoload path and verifies that the file structure matches the expected constant names. It catches problems like a file at <code>app/models/billing/vat_calculator.rb</code> that defines <code>Billing::VATCalculator</code> instead of <code>Billing::VatCalculator</code> (Zeitwerk expects <code>VatCalculator</code> from the file name).</p>

<p>Run this in CI. It takes milliseconds and catches errors that would otherwise surface as mysterious <code>NameError</code>s in production.</p>

<hr />

<h2 id="the-engine-as-a-rack-application">The Engine as a Rack Application</h2>

<p>One detail worth knowing: every engine is a Rack application. It has a <code>call</code> method:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># railties/lib/rails/engine.rb (line numbers are approximate and may shift between releases)</span>

<span class="k">def</span> <span class="nf">call</span><span class="p">(</span><span class="n">env</span><span class="p">)</span>
  <span class="n">req</span> <span class="o">=</span> <span class="n">build_request</span> <span class="n">env</span>
  <span class="n">app</span><span class="p">.</span><span class="nf">call</span> <span class="n">req</span><span class="p">.</span><span class="nf">env</span>
<span class="k">end</span>
</code></pre></div></div>

<p>When you mount an engine in your routes (<code>mount Notifications::Engine, at: "/notifications"</code>), Rails treats the engine as a Rack endpoint. Requests that match the mount path are forwarded to the engine’s own middleware stack and router.</p>

<div class="diagram"><img src="/img/books/modular-rails/a8c79d7339ca8ca32e44157a90262849fb6897500f36e95fe58c04c26d5d3713.svg" alt="Mermaid diagram: HTTP Request"></div>

<p>This is why engines can have their own middleware:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Notifications</span>
    <span class="n">middleware</span><span class="p">.</span><span class="nf">use</span> <span class="no">SomeMiddleware</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The engine’s middleware runs only for requests routed to the engine, not for every request in the host application. This is another dimension of isolation – even the middleware stack is scoped.</p>

<hr />

<h2 id="the-solid-trifecta-queue-cache-and-cable-as-engine-citizens">The Solid Trifecta: Queue, Cache, and Cable as Engine Citizens</h2>

<p>Rails 8 shipped three infrastructure components that replace Redis for jobs, caching, and WebSockets: <strong>Solid Queue</strong>, <strong>Solid Cache</strong>, and <strong>Solid Cable</strong>. All three are database-backed – PostgreSQL, SQLite, MySQL – and they’re the defaults in new Rails 8 apps.</p>

<p>What matters for our purposes isn’t how they work (the docs cover that), but how they interact with engines. The short answer: transparently. Because engines are first-class Rails citizens – as we’ve spent this chapter establishing – all three Solid components work inside engines without special wiring.</p>

<p>But there are conventions worth following.</p>

<h3 id="solid-queue-per-engine-job-queues">Solid Queue: Per-Engine Job Queues</h3>

<p>Each engine can define its own <code>ApplicationJob</code> base class and assign a queue name that reflects the engine’s domain:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/jobs/billing/application_job.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">ApplicationJob</span> <span class="o">&lt;</span> <span class="no">ActiveJob</span><span class="o">::</span><span class="no">Base</span>
    <span class="n">queue_as</span> <span class="ss">:billing</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Every job inside the billing engine inherits from <code>Billing::ApplicationJob</code>, which means every billing job lands on the <code>:billing</code> queue by default. The notifications engine does the same with <code>:notifications</code>. No conflicts, no surprises.</p>

<p>The real payoff comes in the host app’s Solid Queue configuration:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/queue.yml (host app)</span>
<span class="na">production</span><span class="pi">:</span>
  <span class="na">workers</span><span class="pi">:</span>
    <span class="pi">-</span> <span class="na">queues</span><span class="pi">:</span> <span class="pi">[</span><span class="nv">billing</span><span class="pi">]</span>
      <span class="na">threads</span><span class="pi">:</span> <span class="m">3</span>
      <span class="na">processes</span><span class="pi">:</span> <span class="m">1</span>
    <span class="pi">-</span> <span class="na">queues</span><span class="pi">:</span> <span class="pi">[</span><span class="nv">notifications</span><span class="pi">]</span>
      <span class="na">threads</span><span class="pi">:</span> <span class="m">2</span>
      <span class="na">processes</span><span class="pi">:</span> <span class="m">1</span>
    <span class="pi">-</span> <span class="na">queues</span><span class="pi">:</span> <span class="pi">[</span><span class="nv">default</span><span class="pi">]</span>
      <span class="na">threads</span><span class="pi">:</span> <span class="m">5</span>
      <span class="na">processes</span><span class="pi">:</span> <span class="m">2</span>
</code></pre></div></div>

<p>Now you can scale each engine’s background processing independently. Billing jobs are slow and touch external payment APIs? Give them their own process with fewer threads. Notification jobs are fast and high-volume? More threads, fewer processes. The host app controls the resource allocation; the engines just declare what queue they belong to.</p>

<p>This is exactly the kind of operational flexibility that makes the engine architecture pay off at scale. You don’t need separate services to get per-domain worker scaling – you just need queue naming conventions.</p>

<h3 id="recurring-tasks">Recurring Tasks</h3>

<p>Solid Queue supports recurring tasks via <code>config/recurring.yml</code>. This replaces the need for a separate cron-like scheduler for periodic engine work:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/recurring.yml (host app)</span>
<span class="na">production</span><span class="pi">:</span>
  <span class="na">billing_overdue_check</span><span class="pi">:</span>
    <span class="na">class</span><span class="pi">:</span> <span class="s">Billing::OverdueInvoiceCheckJob</span>
    <span class="na">schedule</span><span class="pi">:</span> <span class="s">every day at 6am</span>
    <span class="na">queue</span><span class="pi">:</span> <span class="s">billing</span>

  <span class="na">billing_subscription_renewal</span><span class="pi">:</span>
    <span class="na">class</span><span class="pi">:</span> <span class="s">Billing::SubscriptionRenewalJob</span>
    <span class="na">schedule</span><span class="pi">:</span> <span class="s">every day at midnight</span>
    <span class="na">queue</span><span class="pi">:</span> <span class="s">billing</span>

  <span class="na">notifications_digest</span><span class="pi">:</span>
    <span class="na">class</span><span class="pi">:</span> <span class="s">Notifications::DigestJob</span>
    <span class="na">schedule</span><span class="pi">:</span> <span class="s">every day at 8am</span>
    <span class="na">queue</span><span class="pi">:</span> <span class="s">notifications</span>
</code></pre></div></div>

<p>There’s a tension here worth naming. The engines own the jobs, but the host app owns the schedule. <code>config/recurring.yml</code> is a single file in the host application – engines can’t each bring their own recurring configuration.</p>

<p>This is the right design. The host app is the deployment unit; it controls operational concerns like “when does this run?” and “on which queue?”. The engine’s responsibility is the job itself – what it does, not when it runs. This mirrors how the host app already controls queue worker allocation.</p>

<p>The naming convention matters: prefix each task with the engine name. When a recurring task fails at 3am, <code>billing_overdue_check</code> tells you exactly which engine owns the problem. <code>overdue_check</code> by itself could be anything.</p>

<h3 id="solid-cache-namespace-your-keys">Solid Cache: Namespace Your Keys</h3>

<p><code>Rails.cache</code> works inside engines with zero configuration. Solid Cache stores entries in the database, and the cache store is shared across the entire application – engines included. There’s nothing to set up.</p>

<p>The one discipline you need: <strong>namespace your cache keys</strong>. Engines share the cache store, so collisions are possible if you’re sloppy:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/plan.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Plan</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">active_plans</span>
      <span class="no">Rails</span><span class="p">.</span><span class="nf">cache</span><span class="p">.</span><span class="nf">fetch</span><span class="p">(</span><span class="s2">"billing/plans/active"</span><span class="p">,</span> <span class="ss">expires_in: </span><span class="mi">1</span><span class="p">.</span><span class="nf">hour</span><span class="p">)</span> <span class="k">do</span>
        <span class="n">active</span><span class="p">.</span><span class="nf">to_a</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Prefixing with the engine name (<code>billing/</code>) is enough. You could also use <code>Rails.cache.fetch(["billing", "plans", "active"])</code> to let Rails generate a normalised key. Either way, the point is the same: treat the cache as shared infrastructure and be a good neighbour.</p>

<h3 id="solid-cable-real-time-features-inside-engines">Solid Cable: Real-Time Features Inside Engines</h3>

<p>Engines can define their own Action Cable channels for real-time features. Solid Cable replaces the Redis pub/sub backend with database polling, but the channel API is unchanged:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/channels/notifications/notification_channel.rb</span>
<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">NotificationChannel</span> <span class="o">&lt;</span> <span class="no">ActionCable</span><span class="o">::</span><span class="no">Channel</span><span class="o">::</span><span class="no">Base</span>
    <span class="k">def</span> <span class="nf">subscribed</span>
      <span class="n">stream_for</span> <span class="n">current_user</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Broadcasting from inside the engine works as you’d expect:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/models/notifications/notification.rb</span>
<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Notification</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="n">after_create_commit</span> <span class="ss">:broadcast_to_recipient</span>

    <span class="kp">private</span>

    <span class="k">def</span> <span class="nf">broadcast_to_recipient</span>
      <span class="no">Notifications</span><span class="o">::</span><span class="no">NotificationChannel</span><span class="p">.</span><span class="nf">broadcast_to</span><span class="p">(</span>
        <span class="n">recipient</span><span class="p">,</span>
        <span class="p">{</span> <span class="ss">id: </span><span class="nb">id</span><span class="p">,</span> <span class="ss">subject: </span><span class="n">subject</span><span class="p">,</span> <span class="ss">unread_count: </span><span class="n">recipient</span><span class="p">.</span><span class="nf">unread_notifications_count</span> <span class="p">}</span>
      <span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The channel is namespaced, the broadcast call is explicit, and the host app doesn’t need to know the details. The front-end subscribes to <code>Notifications::NotificationChannel</code> and receives updates. Solid Cable handles the pub/sub over the database instead of Redis, but from the engine’s perspective nothing changes.</p>

<h3 id="why-this-matters">Why This Matters</h3>

<p>All three Solid components share the same database as the rest of your application. This aligns naturally with the shared-database-many-engines architecture. There’s no separate Redis to manage, no connection pooling headaches across service boundaries, no serialisation format mismatches. Everything goes through the database your engines already talk to.</p>

<div class="diagram"><img src="/img/books/modular-rails/0de45502ccc783ca673ea51ab738032eff22ded5b69d669e0a5fdda43c9e9b5b.svg" alt="Mermaid diagram: Engines &amp; Host App"></div>

<p>The key insight: because <code>Rails::Engine</code> inherits the full Rails runtime – Active Job, Action Cable, <code>Rails.cache</code> – the Solid components don’t need to “support” engines. They already do, by virtue of being part of Rails. No adapters, no configuration glue, no special cases. An engine’s job class is just an Active Job class. An engine’s channel is just an Action Cable channel. An engine’s cache call is just a <code>Rails.cache.fetch</code>.</p>

<p>This is the inheritance chain paying dividends again. The same mechanism that gives engines autoloading, routing, and initializers also gives them transparent access to every infrastructure component Rails provides.</p>

<hr />

<h2 id="what-this-means-for-architecture">What This Means for Architecture</h2>

<p>Understanding the internals reveals why engines are such a natural fit for modular architecture:</p>

<ol>
  <li>
    <p><strong>Engines aren’t a hack.</strong> They use the same machinery as your application. The same autoloading, the same initializer chain, the same view resolution, the same routing. When you create an engine, you’re using Rails as it was designed to be used.</p>
  </li>
  <li>
    <p><strong>The boundaries are real.</strong> <code>isolate_namespace</code> doesn’t just add a module prefix. It changes table names, route sets, helper scopes, and view resolution. The boundary is structural, enforced by the framework at every layer.</p>
  </li>
  <li>
    <p><strong>Engines participate in the boot process as equals.</strong> Your engine’s initializers run alongside Active Record’s and Action Controller’s. Your engine’s routes are loaded by the same route reloader. Your engine is a first-class citizen of the Rails runtime, not a second-class plugin.</p>
  </li>
  <li>
    <p><strong>The inheritance chain is power.</strong> Because <code>Rails::Application &lt; Rails::Engine &lt; Rails::Railtie</code>, every capability of the framework is available to your engines. If the Application class can do it, the Engine class can do it (or a close equivalent).</p>
  </li>
</ol>

<p>Rails didn’t bolt on engine support as an afterthought. The framework was built on engines from the ground up. Your application is proof.</p>

<hr />

<p><em>In the next chapter, we’ll go deeper into <code>isolate_namespace</code> – the single method call that transforms a plain engine into an isolated domain boundary. We’ll trace exactly what it does, line by line, and understand each transformation it applies.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-04-extreme-programming-and-emergent-design/">&larr; Extreme Programming and Emergent Design</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-06-namespace-isolation/">Namespace Isolation &rarr;</a>
</nav>
{% endraw %}
