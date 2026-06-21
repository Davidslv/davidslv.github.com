---
layout: book
book: modular_rails
title: "Namespace Isolation"
permalink: /books/modular-rails/chapter-06-namespace-isolation/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-05-rails-engines-from-the-inside-out/">&larr; Rails Engines from the Inside Out</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-07-building-your-first-engine/">Building Your First Engine &rarr;</a>
</nav>

<h1 id="chapter-6-namespace-isolation">Chapter 6: Namespace Isolation</h1>

<p>Imagine two engines that both define an <code>Article</code> model. Without isolation, you get a conflict: two classes fighting over the same constant name, the same database table, the same route helpers. With isolation, each lives in its own world: <code>Blog::Article</code> with table <code>blog_articles</code>, and <code>Help::Article</code> with table <code>help_articles</code>. No conflict. No ambiguity.</p>

<p>That isolation comes from a single method call: <code>isolate_namespace</code>. This chapter traces exactly what it does, line by line, using the actual Rails 8.1 source code. Understanding the mechanism removes all the mystery from engine boundaries.</p>

<hr />

<h2 id="what-isolate_namespace-actually-does">What <code>isolate_namespace</code> Actually Does</h2>

<p>Here’s the source, directly from <code>railties/lib/rails/engine.rb</code> in Rails 8.1.2:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">isolate_namespace</span><span class="p">(</span><span class="n">mod</span><span class="p">)</span>
  <span class="n">engine_name</span><span class="p">(</span><span class="n">generate_railtie_name</span><span class="p">(</span><span class="n">mod</span><span class="p">.</span><span class="nf">name</span><span class="p">))</span>

  <span class="n">config</span><span class="p">.</span><span class="nf">default_scope</span> <span class="o">=</span> <span class="p">{</span> <span class="ss">module: </span><span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Inflector</span><span class="p">.</span><span class="nf">underscore</span><span class="p">(</span><span class="n">mod</span><span class="p">.</span><span class="nf">name</span><span class="p">)</span> <span class="p">}</span>

  <span class="nb">self</span><span class="p">.</span><span class="nf">isolated</span> <span class="o">=</span> <span class="kp">true</span>

  <span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:railtie_namespace</span><span class="p">)</span>
    <span class="nb">name</span><span class="p">,</span> <span class="n">railtie</span> <span class="o">=</span> <span class="n">engine_name</span><span class="p">,</span> <span class="nb">self</span>

    <span class="n">mod</span><span class="p">.</span><span class="nf">singleton_class</span><span class="p">.</span><span class="nf">instance_eval</span> <span class="k">do</span>
      <span class="n">define_method</span><span class="p">(</span><span class="ss">:railtie_namespace</span><span class="p">)</span> <span class="p">{</span> <span class="n">railtie</span> <span class="p">}</span>

      <span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:table_name_prefix</span><span class="p">)</span>
        <span class="n">define_method</span><span class="p">(</span><span class="ss">:table_name_prefix</span><span class="p">)</span> <span class="p">{</span> <span class="s2">"</span><span class="si">#{</span><span class="nb">name</span><span class="si">}</span><span class="s2">_"</span> <span class="p">}</span>

        <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:active_record</span><span class="p">)</span> <span class="k">do</span>
          <span class="n">mod</span><span class="p">.</span><span class="nf">singleton_class</span><span class="p">.</span><span class="nf">redefine_method</span><span class="p">(</span><span class="ss">:table_name_prefix</span><span class="p">)</span> <span class="k">do</span>
            <span class="s2">"</span><span class="si">#{</span><span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span><span class="p">.</span><span class="nf">table_name_prefix</span><span class="si">}#{</span><span class="nb">name</span><span class="si">}</span><span class="s2">_"</span>
          <span class="k">end</span>
        <span class="k">end</span>
      <span class="k">end</span>

      <span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:use_relative_model_naming?</span><span class="p">)</span>
        <span class="nb">class_eval</span> <span class="s2">"def use_relative_model_naming?; true; end"</span><span class="p">,</span> <span class="kp">__FILE__</span><span class="p">,</span> <span class="kp">__LINE__</span>
      <span class="k">end</span>

      <span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:railtie_helpers_paths</span><span class="p">)</span>
        <span class="n">define_method</span><span class="p">(</span><span class="ss">:railtie_helpers_paths</span><span class="p">)</span> <span class="p">{</span> <span class="n">railtie</span><span class="p">.</span><span class="nf">helpers_paths</span> <span class="p">}</span>
      <span class="k">end</span>

      <span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:railtie_routes_url_helpers</span><span class="p">)</span>
        <span class="n">define_method</span><span class="p">(</span><span class="ss">:railtie_routes_url_helpers</span><span class="p">)</span> <span class="p">{</span> <span class="o">|</span><span class="n">include_path_helpers</span> <span class="o">=</span> <span class="kp">true</span><span class="o">|</span>
          <span class="n">railtie</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">url_helpers</span><span class="p">(</span><span class="n">include_path_helpers</span><span class="p">)</span>
        <span class="p">}</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>It’s about 30 lines. Let’s break down each transformation.</p>

<div class="diagram"><img src="/img/books/modular-rails/1de0eff8f987ea130e50ceb788b6b6a0a4144b493b55ce490859b7fa0265e157.svg" alt="Mermaid diagram: isolate_namespace(mod)"></div>

<hr />

<h2 id="transformation-1-engine-naming">Transformation 1: Engine Naming</h2>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">engine_name</span><span class="p">(</span><span class="n">generate_railtie_name</span><span class="p">(</span><span class="n">mod</span><span class="p">.</span><span class="nf">name</span><span class="p">))</span>
</code></pre></div></div>

<p>This sets the engine’s name based on the module you pass in. For <code>isolate_namespace Notifications</code>, the engine name becomes <code>"notifications"</code>. This name is used everywhere:</p>

<ul>
  <li>As the mount name in routes (<code>mount Notifications::Engine, at: "/notifications"</code>)</li>
  <li>As the prefix for rake tasks (<code>notifications:install:migrations</code>)</li>
  <li>As the database table prefix (<code>notifications_</code>)</li>
</ul>

<hr />

<h2 id="transformation-2-route-scoping">Transformation 2: Route Scoping</h2>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">config</span><span class="p">.</span><span class="nf">default_scope</span> <span class="o">=</span> <span class="p">{</span> <span class="ss">module: </span><span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Inflector</span><span class="p">.</span><span class="nf">underscore</span><span class="p">(</span><span class="n">mod</span><span class="p">.</span><span class="nf">name</span><span class="p">)</span> <span class="p">}</span>
</code></pre></div></div>

<p>This tells the router to automatically scope all routes to the engine’s namespace. When you define:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">resources</span> <span class="ss">:notifications</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Rails automatically maps these routes to <code>Notifications::NotificationsController</code>, not <code>NotificationsController</code>. You don’t need to wrap your routes in a <code>namespace</code> block – the scoping is implicit.</p>

<hr />

<h2 id="transformation-3-the-isolation-flag">Transformation 3: The Isolation Flag</h2>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">self</span><span class="p">.</span><span class="nf">isolated</span> <span class="o">=</span> <span class="kp">true</span>
</code></pre></div></div>

<p>This boolean changes behaviour throughout the engine’s lifecycle. For example, the <code>prepend_helpers_path</code> initializer checks it:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">initializer</span> <span class="ss">:prepend_helpers_path</span> <span class="k">do</span> <span class="o">|</span><span class="n">app</span><span class="o">|</span>
  <span class="k">if</span> <span class="o">!</span><span class="n">isolated?</span> <span class="o">||</span> <span class="p">(</span><span class="n">app</span> <span class="o">==</span> <span class="nb">self</span><span class="p">)</span>
    <span class="n">app</span><span class="p">.</span><span class="nf">config</span><span class="p">.</span><span class="nf">helpers_paths</span><span class="p">.</span><span class="nf">unshift</span><span class="p">(</span><span class="o">*</span><span class="n">paths</span><span class="p">[</span><span class="s2">"app/helpers"</span><span class="p">].</span><span class="nf">existent</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>When an engine is isolated, its helpers are <strong>not</strong> added to the host application’s helper paths. The engine’s helpers stay inside the engine. This prevents helper methods from leaking across boundaries – your engine’s <code>format_notification</code> helper won’t clash with the host app’s <code>format_notification</code> helper.</p>

<hr />

<h2 id="transformation-4-table-name-prefixing">Transformation 4: Table Name Prefixing</h2>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:table_name_prefix</span><span class="p">)</span>
  <span class="n">define_method</span><span class="p">(</span><span class="ss">:table_name_prefix</span><span class="p">)</span> <span class="p">{</span> <span class="s2">"</span><span class="si">#{</span><span class="nb">name</span><span class="si">}</span><span class="s2">_"</span> <span class="p">}</span>

  <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:active_record</span><span class="p">)</span> <span class="k">do</span>
    <span class="n">mod</span><span class="p">.</span><span class="nf">singleton_class</span><span class="p">.</span><span class="nf">redefine_method</span><span class="p">(</span><span class="ss">:table_name_prefix</span><span class="p">)</span> <span class="k">do</span>
      <span class="s2">"</span><span class="si">#{</span><span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span><span class="p">.</span><span class="nf">table_name_prefix</span><span class="si">}#{</span><span class="nb">name</span><span class="si">}</span><span class="s2">_"</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This is the transformation that gives you <code>notifications_notifications</code> instead of <code>notifications</code> as a table name. It defines a <code>table_name_prefix</code> method on the engine’s module (<code>Notifications</code>), which Active Record uses when computing table names for models inside that module.</p>

<p>The <code>ActiveSupport.on_load(:active_record)</code> block refines this after Active Record loads, prepending the application’s own table name prefix if one exists. This means if your host application uses a table prefix (say <code>myapp_</code>), your engine’s tables become <code>myapp_notifications_notifications</code>.</p>

<p>Notice the <code>unless mod.respond_to?(:table_name_prefix)</code> guard. If you’ve already defined a custom <code>table_name_prefix</code> on your module, Rails won’t override it. You always have the option to customise.</p>

<hr />

<h2 id="transformation-5-relative-model-naming">Transformation 5: Relative Model Naming</h2>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:use_relative_model_naming?</span><span class="p">)</span>
  <span class="nb">class_eval</span> <span class="s2">"def use_relative_model_naming?; true; end"</span><span class="p">,</span> <span class="kp">__FILE__</span><span class="p">,</span> <span class="kp">__LINE__</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This tells <code>ActiveModel::Naming</code> to treat the engine’s module as a namespace boundary. Without this, a <code>Notifications::Notification</code> model would generate form field names like <code>notifications_notification[subject]</code> and URL helpers like <code>notifications_notification_path</code>. With relative model naming, it generates <code>notification[subject]</code> and <code>notification_path</code> – dropping the namespace prefix.</p>

<p>This means inside your engine’s views, you use the same short names you’d use in any Rails app:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="cp">&lt;%=</span> <span class="n">form_with</span><span class="p">(</span><span class="ss">model: </span><span class="vi">@notification</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">f</span><span class="o">|</span> <span class="cp">%&gt;</span>
  <span class="cp">&lt;%=</span> <span class="n">f</span><span class="p">.</span><span class="nf">text_field</span> <span class="ss">:subject</span> <span class="cp">%&gt;</span>
<span class="cp">&lt;%</span> <span class="k">end</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<p>The form posts to <code>notification[subject]</code>, not <code>notifications_notification[subject]</code>. Clean, simple, no namespace noise.</p>

<hr />

<h2 id="transformation-6-helper-and-route-url-isolation">Transformation 6: Helper and Route URL Isolation</h2>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:railtie_helpers_paths</span><span class="p">)</span>
  <span class="n">define_method</span><span class="p">(</span><span class="ss">:railtie_helpers_paths</span><span class="p">)</span> <span class="p">{</span> <span class="n">railtie</span><span class="p">.</span><span class="nf">helpers_paths</span> <span class="p">}</span>
<span class="k">end</span>

<span class="k">unless</span> <span class="n">mod</span><span class="p">.</span><span class="nf">respond_to?</span><span class="p">(</span><span class="ss">:railtie_routes_url_helpers</span><span class="p">)</span>
  <span class="n">define_method</span><span class="p">(</span><span class="ss">:railtie_routes_url_helpers</span><span class="p">)</span> <span class="p">{</span> <span class="o">|</span><span class="n">include_path_helpers</span> <span class="o">=</span> <span class="kp">true</span><span class="o">|</span>
    <span class="n">railtie</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">url_helpers</span><span class="p">(</span><span class="n">include_path_helpers</span><span class="p">)</span>
  <span class="p">}</span>
<span class="k">end</span>
</code></pre></div></div>

<p>These methods scope the engine’s helpers and URL helpers to the engine itself. Inside the engine’s controllers and views, route helpers (<code>notifications_path</code>, <code>notification_url</code>) resolve to the engine’s routes, not the host application’s routes.</p>

<p>From the host application, you access the engine’s routes through a proxy:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In the host app</span>
<span class="n">notifications</span><span class="p">.</span><span class="nf">notifications_path</span>  <span class="c1"># =&gt; "/notifications/notifications"</span>
</code></pre></div></div>

<p>And from the engine, you access the host app’s routes through <code>main_app</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In the engine</span>
<span class="n">main_app</span><span class="p">.</span><span class="nf">root_path</span>  <span class="c1"># =&gt; "/"</span>
</code></pre></div></div>

<p>This two-way proxy system ensures neither side accidentally calls the wrong routes.</p>

<hr />

<h2 id="view-resolution-the-prepend-order">View Resolution: The Prepend Order</h2>

<p>When a request hits an engine’s controller, Rails resolves views in a specific order:</p>

<ol>
  <li><strong>Host application views first</strong> – <code>app/views/notifications/notifications/index.html.erb</code></li>
  <li><strong>Engine views second</strong> – <code>engines/notifications/app/views/notifications/notifications/index.html.erb</code></li>
</ol>

<p>This order comes from the <code>add_view_paths</code> initializer:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">initializer</span> <span class="ss">:add_view_paths</span> <span class="k">do</span>
  <span class="n">views</span> <span class="o">=</span> <span class="n">paths</span><span class="p">[</span><span class="s2">"app/views"</span><span class="p">].</span><span class="nf">existent</span>
  <span class="k">unless</span> <span class="n">views</span><span class="p">.</span><span class="nf">empty?</span>
    <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:action_controller</span><span class="p">)</span> <span class="p">{</span> <span class="n">prepend_view_path</span><span class="p">(</span><span class="n">views</span><span class="p">)</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Each engine <em>prepends</em> its views. Since the host application loads after all engines, the host app’s views end up at the front of the resolution chain. This means:</p>

<ul>
  <li>The engine provides default views</li>
  <li>The host application can override any view by placing a file at the matching path</li>
  <li>No engine code needs to change for the override to take effect</li>
</ul>

<p>This is a clean override mechanism. The engine provides sensible defaults. The host app customises what it needs. Nobody has to monkey-patch anything.</p>

<p>When you have multiple engines that might provide views for the same path, you can control the priority with <code>config.railties_order</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/application.rb</span>

<span class="n">config</span><span class="p">.</span><span class="nf">railties_order</span> <span class="o">=</span> <span class="p">[</span><span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">:main_app</span><span class="p">,</span> <span class="ss">:all</span><span class="p">]</span>
</code></pre></div></div>

<p>This forces billing engine views to take priority over notifications engine views. The <code>:main_app</code> entry represents the host application, and <code>:all</code> catches any remaining railties. <strong>Note:</strong> <code>railties_order</code> affects all railtie ordering, not just view resolution – it also changes the order in which initializers, migrations, and other lifecycle hooks run. Use it with awareness of these side effects. In practice, you rarely need this – distinct mount points and namespaced views prevent conflicts. But when two engines need to provide views at the same path (a shared admin layout, for example), <code>railties_order</code> is the mechanism.</p>

<hr />

<h2 id="what-isolation-prevents">What Isolation Prevents</h2>

<p>Let’s be concrete about what these transformations prevent:</p>

<h3 id="without-isolate_namespace">Without <code>isolate_namespace</code></h3>

<pre><code>Engine defines Article model     →  Article class (global)
Engine defines articles routes   →  Mixed into host routes
Engine defines ArticleHelper     →  Available everywhere
Engine table: articles           →  Collides with host's articles table
</code></pre>

<h3 id="with-isolate_namespace">With <code>isolate_namespace</code></h3>

<pre><code>Engine defines Article model     →  Blog::Article class (namespaced)
Engine defines articles routes   →  Isolated, mounted at /blog
Engine defines ArticleHelper     →  Only available inside engine
Engine table: blog_articles      →  No collision possible
</code></pre>

<table>
  <thead>
    <tr>
      <th> </th>
      <th>Without <code>isolate_namespace</code></th>
      <th>With <code>isolate_namespace</code></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Model</strong></td>
      <td><code>Article</code></td>
      <td><code>Blog::Article</code></td>
    </tr>
    <tr>
      <td><strong>Table</strong></td>
      <td><code>articles</code></td>
      <td><code>blog_articles</code></td>
    </tr>
    <tr>
      <td><strong>Routes</strong></td>
      <td>Merged into host</td>
      <td>Mounted at <code>/blog</code></td>
    </tr>
    <tr>
      <td><strong>Helpers</strong></td>
      <td>Available globally</td>
      <td>Scoped to engine</td>
    </tr>
    <tr>
      <td><strong>Forms</strong></td>
      <td><code>article[title]</code></td>
      <td><code>article[title]</code> (relative naming)</td>
    </tr>
  </tbody>
</table>

<p>Every layer – model, controller, route, helper, view, table – gets isolation. The boundary isn’t partial. It’s comprehensive.</p>

<hr />

<h2 id="when-to-customise-the-defaults">When to Customise the Defaults</h2>

<p>The defaults are good for most cases, but you can override them when needed.</p>

<h3 id="custom-table-name-prefix">Custom table name prefix</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># If you don't want the double-name (notifications_notifications):</span>
<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">table_name_prefix</span>
    <span class="s2">"notif_"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Now all tables are prefixed with <code>notif_</code> instead of <code>notifications_</code>.</p>

<h3 id="custom-engine-name">Custom engine name</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Notifications</span>
    <span class="n">engine_name</span> <span class="s2">"notif"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This changes the rake task prefix, route helper proxy name, and default mount name.</p>

<h3 id="inheriting-from-the-hosts-applicationcontroller">Inheriting from the host’s ApplicationController</h3>

<p>By default, the engine’s controllers inherit from <code>ActionController::Base</code>. If you want to inherit authentication or other behaviour from the host app, configure it:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In the engine</span>
<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="n">mattr_accessor</span> <span class="ss">:parent_controller</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ActionController::Base"</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Engine's application controller</span>
<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">Notifications</span><span class="p">.</span><span class="nf">parent_controller</span><span class="p">.</span><span class="nf">constantize</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Host app initializer</span>
<span class="no">Notifications</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ApplicationController"</span>
</code></pre></div></div>

<p>Now the engine’s controllers inherit from the host app’s <code>ApplicationController</code>, gaining authentication, before_actions, and layouts – without the engine hardcoding that dependency.</p>

<hr />

<h2 id="the-boundary-in-practice">The Boundary in Practice</h2>

<p>After <code>isolate_namespace</code> runs, your engine has:</p>

<ul>
  <li><strong>Its own module namespace</strong> – <code>Notifications::Notification</code>, not <code>Notification</code></li>
  <li><strong>Its own database prefix</strong> – <code>notifications_notifications</code>, not <code>notifications</code></li>
  <li><strong>Its own route set</strong> – mounted independently, accessed via proxy helpers</li>
  <li><strong>Its own helper scope</strong> – no helper bleeding across boundaries</li>
  <li><strong>Its own view resolution</strong> – with host app override capability</li>
  <li><strong>Its own model naming</strong> – clean form fields and URL helpers</li>
</ul>

<p>These aren’t suggestions. They’re structural facts enforced by the framework at every layer. You can’t accidentally cross these boundaries in normal use. The engine <em>is</em> isolated, not just labelled as such.</p>

<p>This is the difference between a linting rule and a structural boundary. A linting rule says “please don’t cross this line.” <code>isolate_namespace</code> says “there is no line to cross – you’re in a different namespace.”</p>

<hr />

<h2 id="gotchas-that-will-save-you-time">Gotchas That Will Save You Time</h2>

<p>Even after understanding every transformation <code>isolate_namespace</code> performs, a handful of surprises catch developers out. These are the ones I’ve seen trip people up repeatedly.</p>

<h3 id="double-barrelled-table-names">Double-barrelled table names</h3>

<p>When you call <code>isolate_namespace Notifications</code>, the engine prefix becomes <code>notifications_</code>. A <code>Notification</code> model inside that engine gets the table name <code>notifications_notifications</code>. It looks wrong, but it’s correct – the engine prefix plus the pluralised model name. If it bothers you, define a custom prefix on the module:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">table_name_prefix</span>
    <span class="s2">"notif_"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="the-main_app-helper">The <code>main_app</code> helper</h3>

<p>Inside engine views and controllers, host application route helpers don’t exist. Calling <code>root_path</code> will raise a <code>NoMethodError</code> or route to the engine’s own root (if one exists). You need <code>main_app.root_path</code> to reach the host app’s routes. This is the single most common “why isn’t this working?” moment with engines.</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">&lt;%# Wrong — tries to resolve within the engine's routes %&gt;</span>
<span class="cp">&lt;%=</span> <span class="n">link_to</span> <span class="s2">"Home"</span><span class="p">,</span> <span class="n">root_path</span> <span class="cp">%&gt;</span>

<span class="c">&lt;%# Correct — explicitly reaches the host app %&gt;</span>
<span class="cp">&lt;%=</span> <span class="n">link_to</span> <span class="s2">"Home"</span><span class="p">,</span> <span class="n">main_app</span><span class="p">.</span><span class="nf">root_path</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<h3 id="helper-isolation">Helper isolation</h3>

<p>Engine helpers are scoped to the engine. If your engine’s views need a helper method defined in the host app (say <code>current_user_name</code>), it won’t be available automatically. You must explicitly include the host app’s helper in the engine:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/helpers/billing/application_helper.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">ApplicationHelper</span>
    <span class="kp">include</span> <span class="o">::</span><span class="no">ApplicationHelper</span>  <span class="c1"># Pull in host app helpers</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Be deliberate about this. Including the entire host <code>ApplicationHelper</code> creates a coupling. Prefer including only the specific helper modules you need.</p>

<h3 id="form-url-generation">Form URL generation</h3>

<p>Forms in engine views generate engine-scoped URLs by default. If you need a form to post to a host app route, the URL won’t resolve unless you use the <code>main_app</code> proxy:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">&lt;%# Posts to the engine's routes — likely not what you want %&gt;</span>
<span class="cp">&lt;%=</span> <span class="n">form_with</span><span class="p">(</span><span class="ss">url: </span><span class="n">some_path</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">f</span><span class="o">|</span> <span class="cp">%&gt;</span>

<span class="c">&lt;%# Posts to the host app's route %&gt;</span>
<span class="cp">&lt;%=</span> <span class="n">form_with</span><span class="p">(</span><span class="ss">url: </span><span class="n">main_app</span><span class="p">.</span><span class="nf">some_path</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">f</span><span class="o">|</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<p>This catches people when they build an engine view that needs to interact with the host app’s authentication or settings endpoints.</p>

<h3 id="zeitwerk-and-engine-namespacing">Zeitwerk and engine namespacing</h3>

<p>Zeitwerk expects your file paths to match your constant names exactly. Inside an engine with <code>isolate_namespace Billing</code>, the model <code>Billing::Invoice</code> must live at:</p>

<pre><code>engines/billing/app/models/billing/invoice.rb
</code></pre>

<p>Not <code>engines/billing/app/models/invoice.rb</code>. If you skip the <code>billing/</code> subdirectory, Zeitwerk expects the constant <code>Invoice</code> (without the namespace), and you’ll get a <code>NameError</code> at boot. Every model, controller, job, and mailer inside the engine needs that extra directory nesting matching the module name.</p>

<hr />

<p><em>In the next chapter, we’ll put all of this to work. We’ll build a complete engine from scratch, step by step, with models, controllers, views, routes, and a full test suite.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-05-rails-engines-from-the-inside-out/">&larr; Rails Engines from the Inside Out</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-07-building-your-first-engine/">Building Your First Engine &rarr;</a>
</nav>
{% endraw %}
