---
layout: book
book: modular_rails
title: "Building Your First Engine"
permalink: /books/modular-rails/chapter-07-building-your-first-engine/
description: "Build a real notifications engine from the terminal up: generating, mounting, wiring and testing your first mountable Rails engine, no theory."
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-06-namespace-isolation/">&larr; Namespace Isolation</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-08-engine-integration-patterns/">Engine Integration Patterns &rarr;</a>
</nav>

<h1 id="chapter-7-building-your-first-engine">Chapter 7: Building Your First Engine</h1>

<p>Let’s build something real.</p>

<p>No theory in this chapter. No diagrams. No quotes from architecture books. Just you, a terminal, and a Rails Engine that does something useful. We’ll build a notifications engine – the kind of feature every application eventually needs, and the kind that benefits most from being isolated behind a boundary.</p>

<p>By the end of this chapter, you’ll have a working engine with models, controllers, routes, and tests, mounted inside a host application. You’ll understand every file that Rails generates, why it’s there, and what it does.</p>

<hr />

<h2 id="generating-the-engine">Generating the Engine</h2>

<p>Open your terminal in your Rails application’s root directory and run:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>rails plugin new engines/notifications <span class="nt">--mountable</span> <span class="nt">--database</span><span class="o">=</span>postgresql
</code></pre></div></div>

<p>Let’s break down those flags:</p>

<ul>
  <li><code>engines/notifications</code> – creates the engine inside an <code>engines/</code> subdirectory. This is a convention, not a requirement. You could put it anywhere. But keeping engines in a dedicated directory makes the structure obvious to anyone opening the project.</li>
  <li><code>--mountable</code> – generates a <strong>mountable</strong> engine with <code>isolate_namespace</code>. This is almost always what you want. The alternative, <code>--full</code>, generates an engine without namespace isolation – useful for gems that need to extend the host app’s classes directly (like Devise), but not for domain isolation.</li>
  <li><code>--database=postgresql</code> – configures the engine’s dummy test app to use PostgreSQL, matching our host application.</li>
</ul>

<p>Rails generates the following structure:</p>

<pre><code>engines/notifications/
├── app/
│   ├── assets/
│   │   ├── images/notifications/.keep
│   │   └── stylesheets/notifications/application.css
│   ├── controllers/
│   │   ├── concerns/.keep
│   │   └── notifications/application_controller.rb
│   ├── helpers/
│   │   └── notifications/application_helper.rb
│   ├── jobs/
│   │   └── notifications/application_job.rb
│   ├── mailers/
│   │   └── notifications/application_mailer.rb
│   ├── models/
│   │   ├── concerns/.keep
│   │   └── notifications/application_record.rb
│   └── views/
│       └── layouts/notifications/application.html.erb
├── config/
│   └── routes.rb
├── lib/
│   ├── notifications.rb
│   ├── notifications/engine.rb
│   └── notifications/version.rb
├── test/
│   └── dummy/                  # A minimal Rails app for testing
├── Gemfile
├── notifications.gemspec
├── Rakefile
└── README.md
</code></pre>

<p>This looks like a miniature Rails application – because it is one. Every directory you’re used to seeing in a Rails app exists here, scoped under the <code>Notifications</code> namespace.</p>

<p>Rails also appends a line to your host application’s <code>Gemfile</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">gem</span> <span class="s2">"notifications"</span><span class="p">,</span> <span class="ss">path: </span><span class="s2">"engines/notifications"</span>
</code></pre></div></div>

<p>That single line is all it takes to wire the engine into the host app. Bundler treats it like any other gem dependency, but resolves it from the local filesystem instead of RubyGems.</p>

<hr />

<h2 id="understanding-the-generated-files">Understanding the Generated Files</h2>

<p>Let’s look at the files that matter most.</p>

<h3 id="the-engine-class">The Engine Class</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/lib/notifications/engine.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Notifications</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Five lines. This is the heart of your engine. Two things happen here:</p>

<ol>
  <li>
    <p><strong><code>&lt; ::Rails::Engine</code></strong> – Your engine class inherits from <code>Rails::Engine</code>, which gives it the same lifecycle hooks, initializers, and configuration mechanisms as the host application. Rails will discover this class automatically via Bundler and boot it alongside the host app.</p>
  </li>
  <li>
    <p><strong><code>isolate_namespace Notifications</code></strong> – This is the line that creates the boundary. It tells Rails to:</p>
    <ul>
      <li>Namespace all models under <code>Notifications::</code> (so <code>Article</code> becomes <code>Notifications::Article</code>)</li>
      <li>Prefix database tables with <code>notifications_</code> (so the <code>articles</code> table becomes <code>notifications_articles</code>)</li>
      <li>Isolate routes so the engine’s routes don’t leak into the host app’s routes</li>
      <li>Scope view lookups to <code>app/views/notifications/</code></li>
      <li>Prevent helpers from bleeding across the boundary</li>
    </ul>
  </li>
</ol>

<p>Without <code>isolate_namespace</code>, your engine’s code would mix directly into the host application’s namespace. That’s useful for gems like Devise that intentionally extend the host app, but it defeats the purpose of domain isolation.</p>

<h3 id="the-application-record">The Application Record</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/models/notifications/application_record.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">ApplicationRecord</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span>
    <span class="nb">self</span><span class="p">.</span><span class="nf">abstract_class</span> <span class="o">=</span> <span class="kp">true</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Every model in the engine inherits from <code>Notifications::ApplicationRecord</code>, not from the host app’s <code>ApplicationRecord</code>. This means your engine’s models are independent – they don’t inherit any scopes, concerns, or callbacks defined in the host app’s base model.</p>

<h3 id="the-application-controller">The Application Controller</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/controllers/notifications/application_controller.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">ActionController</span><span class="o">::</span><span class="no">Base</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Same principle. The engine’s controllers inherit from <code>ActionController::Base</code> directly, not from the host app’s <code>ApplicationController</code>. This is intentional – the engine shouldn’t assume anything about the host app’s authentication, before_actions, or layout.</p>

<p>Later, when we discuss integration patterns in Chapter 8, we’ll see how to configure the engine to use the host app’s authentication without creating a hard dependency.</p>

<h3 id="the-routes">The Routes</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/config/routes.rb</span>

<span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Notice: <code>Notifications::Engine.routes.draw</code>, not <code>Rails.application.routes.draw</code>. The engine has its own router. Routes defined here are isolated from the host app’s routes. You can have a <code>notifications_path</code> in the engine and a completely different <code>notifications_path</code> in the host app without conflict.</p>

<h3 id="the-gemspec">The Gemspec</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/notifications.gemspec</span>

<span class="nb">require_relative</span> <span class="s2">"lib/notifications/version"</span>

<span class="no">Gem</span><span class="o">::</span><span class="no">Specification</span><span class="p">.</span><span class="nf">new</span> <span class="k">do</span> <span class="o">|</span><span class="n">spec</span><span class="o">|</span>
  <span class="n">spec</span><span class="p">.</span><span class="nf">name</span>        <span class="o">=</span> <span class="s2">"notifications"</span>
  <span class="n">spec</span><span class="p">.</span><span class="nf">version</span>     <span class="o">=</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">VERSION</span>
  <span class="n">spec</span><span class="p">.</span><span class="nf">authors</span>     <span class="o">=</span> <span class="p">[</span><span class="s2">"David Silva"</span><span class="p">]</span>
  <span class="c1"># ...</span>
  <span class="n">spec</span><span class="p">.</span><span class="nf">files</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">chdir</span><span class="p">(</span><span class="no">File</span><span class="p">.</span><span class="nf">expand_path</span><span class="p">(</span><span class="n">__dir__</span><span class="p">))</span> <span class="k">do</span>
    <span class="no">Dir</span><span class="p">[</span><span class="s2">"{app,config,db,lib}/**/*"</span><span class="p">,</span> <span class="s2">"MIT-LICENSE"</span><span class="p">,</span> <span class="s2">"Rakefile"</span><span class="p">,</span> <span class="s2">"README.md"</span><span class="p">]</span>
  <span class="k">end</span>

  <span class="n">spec</span><span class="p">.</span><span class="nf">add_dependency</span> <span class="s2">"rails"</span><span class="p">,</span> <span class="s2">"&gt;= 8.1.2"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Your engine is a gem. This gemspec defines its name, version, files, and dependencies. Right now it depends only on Rails itself. As the engine grows, you’ll add other dependencies here – but only the ones the engine genuinely needs, not the host app’s full dependency tree.</p>

<h3 id="the-dummy-application">The Dummy Application</h3>

<p>Inside <code>test/dummy/</code>, Rails generates a minimal Rails application. This is where the engine’s tests run. The dummy app boots, mounts your engine, and provides just enough infrastructure (a database connection, a routing stack) to test the engine in isolation.</p>

<p>This is one of the most powerful aspects of engines: <strong>your tests don’t need the host application</strong>. They run against a lightweight dummy app that loads in a fraction of the time.</p>

<blockquote>
  <p><strong>Checkpoint</strong> — You’ve generated the engine and understand every file Rails created: the engine class, isolated namespace, application record, application controller, routes, gemspec, and the dummy test app. Good place to pause before we start writing code. If you’re following along, make sure <code>bundle install</code> runs cleanly before continuing.</p>
</blockquote>

<hr />

<h2 id="adding-a-model">Adding a Model</h2>

<p>Let’s give our notifications engine something to do. We need a <code>Notification</code> model that stores notifications for users.</p>

<p>From the engine’s directory:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd </span>engines/notifications
bin/rails generate model notification <span class="se">\</span>
  recipient_type:string <span class="se">\</span>
  recipient_id:integer <span class="se">\</span>
  notification_type:string <span class="se">\</span>
  subject:string <span class="se">\</span>
  body:text <span class="se">\</span>
  read_at:datetime
</code></pre></div></div>

<p>This generates:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/models/notifications/notification.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Notification</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>And a migration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/db/migrate/XXXXXX_create_notifications_notifications.rb</span>

<span class="k">class</span> <span class="nc">CreateNotificationsNotifications</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">create_table</span> <span class="ss">:notifications_notifications</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">string</span> <span class="ss">:recipient_type</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">integer</span> <span class="ss">:recipient_id</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">string</span> <span class="ss">:notification_type</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">string</span> <span class="ss">:subject</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">text</span> <span class="ss">:body</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">datetime</span> <span class="ss">:read_at</span>

      <span class="n">t</span><span class="p">.</span><span class="nf">timestamps</span>
    <span class="k">end</span>

    <span class="n">add_index</span> <span class="ss">:notifications_notifications</span><span class="p">,</span> <span class="p">[</span><span class="ss">:recipient_type</span><span class="p">,</span> <span class="ss">:recipient_id</span><span class="p">],</span>
              <span class="ss">name: </span><span class="s2">"index_notifications_on_recipient"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Notice the table name: <code>notifications_notifications</code>. The first <code>notifications_</code> is the engine’s namespace prefix (from <code>isolate_namespace</code>). The second <code>notifications</code> is the model’s plural name. It looks redundant, but it’s intentional – it prevents any collision with a <code>notifications</code> table in the host app or another engine.</p>

<p>If the double-prefix bothers you, you can customise the table name:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Notification</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="nb">self</span><span class="p">.</span><span class="nf">table_name</span> <span class="o">=</span> <span class="s2">"notifications"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>But I’d recommend keeping the prefix. It makes the database self-documenting – any table starting with <code>notifications_</code> belongs to the notifications engine. When you’re looking at a production database with 150 tables, that prefix is a lifesaver.</p>

<p>Let’s flesh out the model:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/models/notifications/notification.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Notification</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="n">belongs_to</span> <span class="ss">:recipient</span><span class="p">,</span> <span class="ss">polymorphic: </span><span class="kp">true</span>

    <span class="n">scope</span> <span class="ss">:unread</span><span class="p">,</span> <span class="o">-&gt;</span> <span class="p">{</span> <span class="n">where</span><span class="p">(</span><span class="ss">read_at: </span><span class="kp">nil</span><span class="p">)</span> <span class="p">}</span>
    <span class="n">scope</span> <span class="ss">:read</span><span class="p">,</span> <span class="o">-&gt;</span> <span class="p">{</span> <span class="n">where</span><span class="p">.</span><span class="nf">not</span><span class="p">(</span><span class="ss">read_at: </span><span class="kp">nil</span><span class="p">)</span> <span class="p">}</span>
    <span class="n">scope</span> <span class="ss">:recent</span><span class="p">,</span> <span class="o">-&gt;</span> <span class="p">{</span> <span class="n">order</span><span class="p">(</span><span class="ss">created_at: :desc</span><span class="p">).</span><span class="nf">limit</span><span class="p">(</span><span class="mi">10</span><span class="p">)</span> <span class="p">}</span>

    <span class="n">validates</span> <span class="ss">:subject</span><span class="p">,</span> <span class="ss">presence: </span><span class="kp">true</span>
    <span class="n">validates</span> <span class="ss">:body</span><span class="p">,</span> <span class="ss">presence: </span><span class="kp">true</span>

    <span class="k">def</span> <span class="nf">read?</span>
      <span class="n">read_at</span><span class="p">.</span><span class="nf">present?</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">mark_as_read!</span>
      <span class="n">update!</span><span class="p">(</span><span class="ss">read_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span> <span class="k">unless</span> <span class="n">read?</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">mark_as_unread!</span>
      <span class="n">update!</span><span class="p">(</span><span class="ss">read_at: </span><span class="kp">nil</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>recipient</code> is polymorphic. The engine doesn’t know or care whether the recipient is a <code>User</code>, an <code>AdminUser</code>, or a <code>Team</code>. It just knows there’s a recipient. This is dependency inversion at the model level – the engine defines the interface (anything with an <code>id</code> and a <code>type</code>), and the host app decides what implements it.</p>

<h3 id="engine-seed-data">Engine Seed Data</h3>

<p>Engines can provide their own seed data via the <code>load_seed</code> method. Create a <code>db/seeds.rb</code> inside the engine:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/db/seeds.rb</span>

<span class="c1"># Create sample notifications for development</span>
<span class="k">if</span> <span class="no">Rails</span><span class="p">.</span><span class="nf">env</span><span class="p">.</span><span class="nf">development?</span>
  <span class="nb">puts</span> <span class="s2">"Seeding Notifications engine..."</span>
  <span class="c1"># Engine seeds can reference host app models via configuration</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The host app loads engine seeds explicitly:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># db/seeds.rb (host app)</span>

<span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">load_seed</span>
<span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">load_seed</span>
</code></pre></div></div>

<p>Order matters here. If your billing seeds create invoices that trigger notification events, load billing before notifications. The host app controls the sequence – another example of the host-as-orchestrator pattern.</p>

<hr />

<h2 id="adding-a-concern-for-the-host-app">Adding a Concern for the Host App</h2>

<p>The engine needs a way to tell the host app: “any model that wants to receive notifications should include this concern.” This is the primary integration pattern we use.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/models/concerns/notifications/notifiable.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">module</span> <span class="nn">Notifiable</span>
    <span class="kp">extend</span> <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Concern</span>

    <span class="n">included</span> <span class="k">do</span>
      <span class="n">has_many</span> <span class="ss">:notifications</span><span class="p">,</span>
               <span class="ss">class_name: </span><span class="s2">"Notifications::Notification"</span><span class="p">,</span>
               <span class="ss">as: :recipient</span><span class="p">,</span>
               <span class="ss">dependent: :destroy</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">unread_notifications</span>
      <span class="n">notifications</span><span class="p">.</span><span class="nf">unread</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">unread_notifications_count</span>
      <span class="n">notifications</span><span class="p">.</span><span class="nf">unread</span><span class="p">.</span><span class="nf">count</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">mark_all_notifications_as_read!</span>
      <span class="n">notifications</span><span class="p">.</span><span class="nf">unread</span><span class="p">.</span><span class="nf">update_all</span><span class="p">(</span><span class="ss">read_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The host app can then include this in any model:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In the host application</span>
<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Notifiable</span>
<span class="k">end</span>
</code></pre></div></div>

<p>One line. The engine provides the behaviour. The host app decides who gets it. The engine never references <code>User</code> directly.</p>

<hr />

<h2 id="adding-a-controller">Adding a Controller</h2>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/app/controllers/notifications/notifications_controller.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">NotificationsController</span> <span class="o">&lt;</span> <span class="no">ApplicationController</span>
    <span class="k">def</span> <span class="nf">index</span>
      <span class="vi">@notifications</span> <span class="o">=</span> <span class="n">current_recipient</span><span class="p">.</span><span class="nf">notifications</span><span class="p">.</span><span class="nf">recent</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">show</span>
      <span class="vi">@notification</span> <span class="o">=</span> <span class="n">current_recipient</span><span class="p">.</span><span class="nf">notifications</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:id</span><span class="p">])</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">read</span>
      <span class="vi">@notification</span> <span class="o">=</span> <span class="n">current_recipient</span><span class="p">.</span><span class="nf">notifications</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:id</span><span class="p">])</span>
      <span class="vi">@notification</span><span class="p">.</span><span class="nf">mark_as_read!</span>
      <span class="n">redirect_to</span> <span class="vi">@notification</span><span class="p">,</span> <span class="ss">notice: </span><span class="s2">"Notification marked as read."</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">read_all</span>
      <span class="n">current_recipient</span><span class="p">.</span><span class="nf">notifications</span><span class="p">.</span><span class="nf">unread</span><span class="p">.</span><span class="nf">update_all</span><span class="p">(</span><span class="ss">read_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span>
      <span class="n">redirect_to</span> <span class="n">notifications_path</span><span class="p">,</span> <span class="ss">notice: </span><span class="s2">"All notifications marked as read."</span>
    <span class="k">end</span>

    <span class="kp">private</span>

    <span class="c1"># Placeholder — we'll make this configurable next</span>
    <span class="k">def</span> <span class="nf">current_recipient</span>
      <span class="k">raise</span> <span class="no">NotImplementedError</span><span class="p">,</span>
        <span class="s2">"</span><span class="si">#{</span><span class="nb">self</span><span class="p">.</span><span class="nf">class</span><span class="si">}</span><span class="s2"> must implement #current_recipient. "</span> <span class="p">\</span>
        <span class="s2">"Configure Notifications.current_recipient_method or override this method."</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This is a starting point. We’ll replace this hard-coded check with a configurable approach in a moment.</p>

<p>Notice <code>current_recipient</code>. The engine doesn’t know how the host app handles authentication. It doesn’t call <code>current_user</code> – because what if the host app calls it <code>current_admin</code> or <code>current_account</code>? Instead, it defines a method that must be provided, and raises a clear error if it’s not.</p>

<p>We’ll wire this up through configuration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/lib/notifications.rb</span>

<span class="nb">require</span> <span class="s2">"notifications/version"</span>
<span class="nb">require</span> <span class="s2">"notifications/engine"</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="n">mattr_accessor</span> <span class="ss">:current_recipient_method</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">current_recipient_method</span> <span class="o">=</span> <span class="ss">:current_user</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/lib/notifications/engine.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Notifications</span>

    <span class="n">initializer</span> <span class="s2">"notifications.configure_controllers"</span> <span class="k">do</span>
      <span class="no">ActiveSupport</span><span class="p">.</span><span class="nf">on_load</span><span class="p">(</span><span class="ss">:action_controller_base</span><span class="p">)</span> <span class="k">do</span>
        <span class="c1"># Make the configuration available but don't force anything</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Then update the controller to use the configuration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In NotificationsController</span>

<span class="k">def</span> <span class="nf">current_recipient</span>
  <span class="n">method_name</span> <span class="o">=</span> <span class="no">Notifications</span><span class="p">.</span><span class="nf">current_recipient_method</span>
  <span class="k">if</span> <span class="nb">respond_to?</span><span class="p">(</span><span class="n">method_name</span><span class="p">,</span> <span class="kp">true</span><span class="p">)</span>
    <span class="nb">send</span><span class="p">(</span><span class="n">method_name</span><span class="p">)</span>
  <span class="k">else</span>
    <span class="k">raise</span> <span class="no">NotImplementedError</span><span class="p">,</span>
      <span class="s2">"</span><span class="si">#{</span><span class="nb">self</span><span class="p">.</span><span class="nf">class</span><span class="si">}</span><span class="s2"> does not respond to '</span><span class="si">#{</span><span class="n">method_name</span><span class="si">}</span><span class="s2">'. "</span> <span class="p">\</span>
      <span class="s2">"Set Notifications.current_recipient_method to your authentication method, "</span> <span class="p">\</span>
      <span class="s2">"e.g. Notifications.current_recipient_method = :current_user"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The host app configures it in an initializer:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/initializers/notifications.rb</span>

<span class="no">Notifications</span><span class="p">.</span><span class="nf">current_recipient_method</span> <span class="o">=</span> <span class="ss">:current_user</span>
</code></pre></div></div>

<p>One line of configuration. No monkey-patching. No hard-coded dependencies.</p>

<blockquote>
  <p><strong>Checkpoint</strong> — The core code files are done: model with validations and scopes, an integration concern for the host app, and a controller with configurable authentication. What follows is mechanical wiring – routes and views. Take a break or commit your progress if you’re coding along.</p>
</blockquote>

<hr />

<h2 id="adding-routes">Adding Routes</h2>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/config/routes.rb</span>

<span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">resources</span> <span class="ss">:notifications</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:index</span><span class="p">,</span> <span class="ss">:show</span><span class="p">]</span> <span class="k">do</span>
    <span class="n">member</span> <span class="k">do</span>
      <span class="n">patch</span> <span class="ss">:read</span>
    <span class="k">end</span>
    <span class="n">collection</span> <span class="k">do</span>
      <span class="n">patch</span> <span class="ss">:read_all</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Then mount the engine in the host app:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/routes.rb (host application)</span>

<span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">mount</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/notifications"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The engine’s routes are now available at <code>/notifications/notifications</code>, <code>/notifications/notifications/:id</code>, etc. The engine controls its own internal routing; the host app controls where the engine is mounted.</p>

<p>If you want cleaner URLs, you can mount at root and let the engine’s internal routes define the full path:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">mount</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/"</span>
</code></pre></div></div>

<p>Now the routes are <code>/notifications</code>, <code>/notifications/:id</code>, etc.</p>

<h3 id="route-ordering-gotcha">Route Ordering Gotcha</h3>

<p>When multiple engines are mounted, the order in <code>config/routes.rb</code> matters. Rails evaluates routes top-to-bottom, and the first match wins:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/routes.rb</span>

<span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">mount</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/"</span>
  <span class="n">mount</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/"</span>  <span class="c1"># ← May never match!</span>
<span class="k">end</span>
</code></pre></div></div>

<p>If both engines define a <code>/dashboard</code> route, only the billing engine’s version will ever be reached. Mount catch-all engines (those mounted at <code>/</code>) last, or use distinct mount points:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">mount</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/billing"</span>
<span class="n">mount</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/notifications"</span>
</code></pre></div></div>

<p>Distinct mount points are almost always the right choice. They make the URL structure predictable and eliminate routing ambiguity entirely.</p>

<h3 id="polymorphic_url-with-engine-routes"><code>polymorphic_url</code> with Engine Routes</h3>

<p>Inside an isolated engine’s own views and controllers, <code>form_with(model: @invoice)</code> routes correctly without any prefix – the engine’s route helpers are the default in that context, and <code>use_relative_model_naming?</code> returns <code>true</code>.</p>

<p>The engine’s route proxy is needed when referencing engine routes <strong>from the host app</strong>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># From the HOST APP's views (not from inside the engine):</span>
<span class="n">form_with</span><span class="p">(</span><span class="ss">model: </span><span class="p">[</span><span class="ss">:billing</span><span class="p">,</span> <span class="vi">@invoice</span><span class="p">])</span> <span class="k">do</span> <span class="o">|</span><span class="n">f</span><span class="o">|</span>
  <span class="c1"># Generates: /billing/invoices/42</span>
<span class="k">end</span>

<span class="c1"># Or explicitly from the host app:</span>
<span class="n">billing</span><span class="p">.</span><span class="nf">invoice_path</span><span class="p">(</span><span class="vi">@invoice</span><span class="p">)</span>
</code></pre></div></div>

<p>Without the engine prefix in the host app, <code>polymorphic_url(@invoice)</code> generates a path using the host app’s routes, which don’t know about <code>Billing::Invoice</code>. The <code>[:billing, @invoice]</code> array syntax tells Rails to use the billing engine’s route proxy.</p>

<hr />

<h2 id="adding-views">Adding Views</h2>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">&lt;%# engines/notifications/app/views/notifications/notifications/index.html.erb %&gt;</span>

<span class="nt">&lt;h1&gt;</span>Notifications<span class="nt">&lt;/h1&gt;</span>

<span class="cp">&lt;%</span> <span class="k">if</span> <span class="vi">@notifications</span><span class="p">.</span><span class="nf">any?</span> <span class="cp">%&gt;</span>
  <span class="nt">&lt;div</span> <span class="na">id=</span><span class="s">"notifications"</span><span class="nt">&gt;</span>
    <span class="cp">&lt;%</span> <span class="vi">@notifications</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">notification</span><span class="o">|</span> <span class="cp">%&gt;</span>
      <span class="nt">&lt;div</span> <span class="na">class=</span><span class="s">"notification </span><span class="cp">&lt;%=</span> <span class="s1">'unread'</span> <span class="k">unless</span> <span class="n">notification</span><span class="p">.</span><span class="nf">read?</span> <span class="cp">%&gt;</span><span class="s">"</span><span class="nt">&gt;</span>
        <span class="nt">&lt;h3&gt;</span><span class="cp">&lt;%=</span> <span class="n">link_to</span> <span class="n">notification</span><span class="p">.</span><span class="nf">subject</span><span class="p">,</span> <span class="n">notification_path</span><span class="p">(</span><span class="n">notification</span><span class="p">)</span> <span class="cp">%&gt;</span><span class="nt">&lt;/h3&gt;</span>
        <span class="nt">&lt;p&gt;</span><span class="cp">&lt;%=</span> <span class="n">truncate</span><span class="p">(</span><span class="n">notification</span><span class="p">.</span><span class="nf">body</span><span class="p">,</span> <span class="ss">length: </span><span class="mi">120</span><span class="p">)</span> <span class="cp">%&gt;</span><span class="nt">&lt;/p&gt;</span>
        <span class="nt">&lt;time</span> <span class="na">datetime=</span><span class="s">"</span><span class="cp">&lt;%=</span> <span class="n">notification</span><span class="p">.</span><span class="nf">created_at</span><span class="p">.</span><span class="nf">iso8601</span> <span class="cp">%&gt;</span><span class="s">"</span><span class="nt">&gt;</span>
          <span class="cp">&lt;%=</span> <span class="n">time_ago_in_words</span><span class="p">(</span><span class="n">notification</span><span class="p">.</span><span class="nf">created_at</span><span class="p">)</span> <span class="cp">%&gt;</span> ago
        <span class="nt">&lt;/time&gt;</span>
      <span class="nt">&lt;/div&gt;</span>
    <span class="cp">&lt;%</span> <span class="k">end</span> <span class="cp">%&gt;</span>
  <span class="nt">&lt;/div&gt;</span>
<span class="cp">&lt;%</span> <span class="k">else</span> <span class="cp">%&gt;</span>
  <span class="nt">&lt;p&gt;</span>No notifications yet.<span class="nt">&lt;/p&gt;</span>
<span class="cp">&lt;%</span> <span class="k">end</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<p>Notice: <code>notification_path</code>, not <code>notifications.notification_path</code>. Inside the engine’s views, route helpers resolve to the engine’s routes automatically. You don’t need to prefix them.</p>

<p>From the <strong>host application’s</strong> views, you’d use:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="cp">&lt;%=</span> <span class="n">link_to</span> <span class="s2">"View notifications"</span><span class="p">,</span> <span class="n">notifications</span><span class="p">.</span><span class="nf">notifications_path</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<p>The <code>notifications.</code> prefix (the engine’s mount name) tells Rails to use the engine’s route helpers instead of the host app’s.</p>

<p>The host app can override any engine view by creating a file at the same path:</p>

<pre><code>app/views/notifications/notifications/index.html.erb
</code></pre>

<p>Rails checks the host app’s views first, then falls back to the engine’s views. This means the engine provides sensible defaults, and the host app can customise the presentation without touching engine code.</p>

<hr />

<h2 id="frontend-assets-stimulus-turbo-and-propshaft">Frontend Assets: Stimulus, Turbo, and Propshaft</h2>

<p>You’ve got models, controllers, and views. But a modern Rails app isn’t just server-rendered HTML anymore. You need CSS that ships with the engine, Stimulus controllers for interactivity, and Turbo Streams for real-time updates. The good news: Propshaft makes this straightforward. The bad news: there are a couple of gotchas nobody tells you about.</p>

<h3 id="how-propshaft-handles-engine-assets">How Propshaft Handles Engine Assets</h3>

<p>When your engine inherits from <code>Rails::Engine</code>, Rails automatically registers the engine’s <code>app/assets</code> directory as an asset path. Propshaft picks this up and serves those files alongside the host app’s assets, using the engine’s namespace as a prefix. No compilation step, no webpack config, no build pipeline. Propshaft serves files as-is, adding a fingerprint for cache-busting.</p>

<p>This means any file at <code>engines/notifications/app/assets/stylesheets/notifications/notifications.css</code> is available in the browser as <code>notifications/notifications.css</code> (plus a digest hash). The engine’s namespace keeps everything tidy and collision-free.</p>

<div class="diagram"><img src="/img/books/modular-rails/023ca2917560fcd57796fbc04af3774a3bbc86d654e03f1cf21295e1796ea146.svg" alt="Mermaid diagram: Host App Assets&lt;br/&gt;app/assets/"></div>

<h3 id="adding-css-to-the-engine">Adding CSS to the Engine</h3>

<p>Let’s add some styles to our notifications. Create a stylesheet scoped to the engine:</p>

<div class="language-css highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">/* engines/notifications/app/assets/stylesheets/notifications/notifications.css */</span>

<span class="nc">.notification</span> <span class="p">{</span> <span class="nl">padding</span><span class="p">:</span> <span class="m">1rem</span><span class="p">;</span> <span class="nl">border-bottom</span><span class="p">:</span> <span class="m">1px</span> <span class="nb">solid</span> <span class="nx">#eee</span><span class="p">;</span> <span class="p">}</span>
<span class="nc">.notification.unread</span> <span class="p">{</span> <span class="nl">background</span><span class="p">:</span> <span class="nx">#f8f9ff</span><span class="p">;</span> <span class="nl">border-left</span><span class="p">:</span> <span class="m">3px</span> <span class="nb">solid</span> <span class="nx">#4a6fa5</span><span class="p">;</span> <span class="p">}</span>
<span class="nc">.notification</span> <span class="nc">.timestamp</span> <span class="p">{</span> <span class="nl">color</span><span class="p">:</span> <span class="nx">#888</span><span class="p">;</span> <span class="nl">font-size</span><span class="p">:</span> <span class="m">0.85em</span><span class="p">;</span> <span class="p">}</span>
</code></pre></div></div>

<p>To include it, add a stylesheet link tag in the engine’s layout or the host app’s layout:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="cp">&lt;%=</span> <span class="n">stylesheet_link_tag</span> <span class="s2">"notifications/notifications"</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<p>That’s it. No import statements, no manifest files, no build config. Propshaft resolves the path through the engine’s registered asset directory.</p>

<p>If the host app wants to override these styles, it drops a file at the same path – <code>app/assets/stylesheets/notifications/notifications.css</code> – and Propshaft serves the host app’s version instead. Same override pattern as views.</p>

<h3 id="stimulus-controllers-in-engines">Stimulus Controllers in Engines</h3>

<p>Here’s where it gets slightly tricky. Stimulus controller autoloading – whether through importmap or esbuild – is configured in the host app. The engine can provide controller files, but it can’t register them automatically.</p>

<p>Let’s add a dismiss controller that lets users dismiss notifications without a page reload:</p>

<div class="language-javascript highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1">// engines/notifications/app/javascript/controllers/notifications/dismiss_controller.js</span>

<span class="k">import</span> <span class="p">{</span> <span class="nx">Controller</span> <span class="p">}</span> <span class="k">from</span> <span class="dl">"</span><span class="s2">@hotwired/stimulus</span><span class="dl">"</span>

<span class="k">export</span> <span class="k">default</span> <span class="kd">class</span> <span class="nc">extends</span> <span class="nx">Controller</span> <span class="p">{</span>
  <span class="kd">static</span> <span class="nx">targets</span> <span class="o">=</span> <span class="p">[</span><span class="dl">"</span><span class="s2">notification</span><span class="dl">"</span><span class="p">]</span>
  <span class="kd">static</span> <span class="nx">values</span> <span class="o">=</span> <span class="p">{</span> <span class="na">url</span><span class="p">:</span> <span class="nb">String</span> <span class="p">}</span>

  <span class="nf">dismiss</span><span class="p">()</span> <span class="p">{</span>
    <span class="nf">fetch</span><span class="p">(</span><span class="k">this</span><span class="p">.</span><span class="nx">urlValue</span><span class="p">,</span> <span class="p">{</span>
      <span class="na">method</span><span class="p">:</span> <span class="dl">"</span><span class="s2">PATCH</span><span class="dl">"</span><span class="p">,</span>
      <span class="na">headers</span><span class="p">:</span> <span class="p">{</span>
        <span class="dl">"</span><span class="s2">X-CSRF-Token</span><span class="dl">"</span><span class="p">:</span> <span class="nb">document</span><span class="p">.</span><span class="nf">querySelector</span><span class="p">(</span><span class="dl">"</span><span class="s2">[name='csrf-token']</span><span class="dl">"</span><span class="p">).</span><span class="nx">content</span><span class="p">,</span>
        <span class="dl">"</span><span class="s2">Accept</span><span class="dl">"</span><span class="p">:</span> <span class="dl">"</span><span class="s2">text/vnd.turbo-stream.html</span><span class="dl">"</span>
      <span class="p">}</span>
    <span class="p">})</span>
    <span class="k">this</span><span class="p">.</span><span class="nx">notificationTarget</span><span class="p">.</span><span class="nf">remove</span><span class="p">()</span>
  <span class="p">}</span>
<span class="p">}</span>
</code></pre></div></div>

<p>The view markup that uses it:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nt">&lt;div</span> <span class="na">data-controller=</span><span class="s">"notifications--dismiss"</span>
     <span class="na">data-notifications--dismiss-url-value=</span><span class="s">"</span><span class="cp">&lt;%=</span> <span class="n">notification_path</span><span class="p">(</span><span class="n">notification</span><span class="p">)</span> <span class="cp">%&gt;</span><span class="s">"</span>
     <span class="na">data-notifications--dismiss-target=</span><span class="s">"notification"</span>
     <span class="na">class=</span><span class="s">"notification </span><span class="cp">&lt;%=</span> <span class="s1">'unread'</span> <span class="k">unless</span> <span class="n">notification</span><span class="p">.</span><span class="nf">read?</span> <span class="cp">%&gt;</span><span class="s">"</span><span class="nt">&gt;</span>
  <span class="nt">&lt;h3&gt;</span><span class="cp">&lt;%=</span> <span class="n">notification</span><span class="p">.</span><span class="nf">subject</span> <span class="cp">%&gt;</span><span class="nt">&lt;/h3&gt;</span>
  <span class="nt">&lt;p&gt;</span><span class="cp">&lt;%=</span> <span class="n">truncate</span><span class="p">(</span><span class="n">notification</span><span class="p">.</span><span class="nf">body</span><span class="p">,</span> <span class="ss">length: </span><span class="mi">120</span><span class="p">)</span> <span class="cp">%&gt;</span><span class="nt">&lt;/p&gt;</span>
  <span class="nt">&lt;button</span> <span class="na">data-action=</span><span class="s">"notifications--dismiss#dismiss"</span><span class="nt">&gt;</span>Dismiss<span class="nt">&lt;/button&gt;</span>
<span class="nt">&lt;/div&gt;</span>
</code></pre></div></div>

<p>Notice the <code>notifications--dismiss</code> naming convention. Stimulus uses <code>--</code> as a namespace separator, mirroring the engine’s directory structure.</p>

<p>Now the registration. If you’re using importmap (the Rails 8 default), add this to the host app:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/importmap.rb (host app)</span>

<span class="n">pin_all_from</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"app/javascript/controllers/notifications"</span><span class="p">),</span>
  <span class="ss">under: </span><span class="s2">"controllers/notifications"</span>
</code></pre></div></div>

<p>This tells importmap to scan the engine’s JavaScript directory and make those controllers available under the <code>controllers/notifications</code> namespace. The Stimulus autoloader picks them up from there.</p>

<p>I won’t pretend this is seamless. The host app has to know about the engine’s JavaScript. That’s a coupling point, and it’s the price you pay for using Stimulus’s autoloading conventions. For engines with only one or two controllers, you might prefer an inline <code>&lt;script type="module"&gt;</code> tag in the engine’s layout instead. Pragmatism over purity.</p>

<h3 id="mailer-previews-in-engines">Mailer Previews in Engines</h3>

<p>If your engine includes mailers, you can include previews that are automatically registered by Rails. Place them at the standard preview path inside the engine:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/test/mailers/previews/notifications/digest_mailer_preview.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="k">class</span> <span class="nc">DigestMailerPreview</span> <span class="o">&lt;</span> <span class="no">ActionMailer</span><span class="o">::</span><span class="no">Preview</span>
    <span class="k">def</span> <span class="nf">daily_digest</span>
      <span class="n">recipient</span> <span class="o">=</span> <span class="no">User</span><span class="p">.</span><span class="nf">first</span>
      <span class="n">notifications</span> <span class="o">=</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">unread</span><span class="p">.</span><span class="nf">limit</span><span class="p">(</span><span class="mi">5</span><span class="p">)</span>
      <span class="no">Notifications</span><span class="o">::</span><span class="no">DigestMailer</span><span class="p">.</span><span class="nf">daily_digest</span><span class="p">(</span><span class="n">recipient</span><span class="p">,</span> <span class="n">notifications</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Rails automatically adds engine preview paths to the mailer preview lookup. You can browse them at <code>/rails/mailers/notifications/digest_mailer</code> in development – no configuration needed.</p>

<h3 id="turbo-streams-for-real-time-updates">Turbo Streams for Real-Time Updates</h3>

<p>This is where engines and Hotwire really shine. Turbo Streams let the engine update the page without the host app knowing or caring about the mechanics.</p>

<p>Let’s add a <code>read</code> action that marks a notification as read and updates the UI in-place:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In NotificationsController</span>

<span class="k">def</span> <span class="nf">read</span>
  <span class="vi">@notification</span> <span class="o">=</span> <span class="n">current_recipient</span><span class="p">.</span><span class="nf">notifications</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:id</span><span class="p">])</span>
  <span class="vi">@notification</span><span class="p">.</span><span class="nf">mark_as_read!</span>

  <span class="n">respond_to</span> <span class="k">do</span> <span class="o">|</span><span class="nb">format</span><span class="o">|</span>
    <span class="nb">format</span><span class="p">.</span><span class="nf">turbo_stream</span>
    <span class="nb">format</span><span class="p">.</span><span class="nf">html</span> <span class="p">{</span> <span class="n">redirect_to</span> <span class="vi">@notification</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The Turbo Stream response template:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">&lt;%# engines/notifications/app/views/notifications/notifications/read.turbo_stream.erb %&gt;</span>

<span class="cp">&lt;%=</span> <span class="n">turbo_stream</span><span class="p">.</span><span class="nf">replace</span> <span class="n">dom_id</span><span class="p">(</span><span class="vi">@notification</span><span class="p">)</span> <span class="k">do</span> <span class="cp">%&gt;</span>
  <span class="cp">&lt;%=</span> <span class="n">render</span> <span class="ss">partial: </span><span class="s2">"notifications/notifications/notification"</span><span class="p">,</span>
             <span class="ss">locals: </span><span class="p">{</span> <span class="ss">notification: </span><span class="vi">@notification</span> <span class="p">}</span> <span class="cp">%&gt;</span>
<span class="cp">&lt;%</span> <span class="k">end</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<p>When the browser sends a Turbo request, Rails responds with a Turbo Stream that replaces just the notification element in the DOM. The <code>unread</code> CSS class disappears, the styling updates, and the user never leaves the page. No custom JavaScript needed.</p>

<p>Add the route:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/config/routes.rb</span>

<span class="n">resources</span> <span class="ss">:notifications</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:index</span><span class="p">,</span> <span class="ss">:show</span><span class="p">]</span> <span class="k">do</span>
  <span class="n">member</span> <span class="k">do</span>
    <span class="n">patch</span> <span class="ss">:read</span>
  <span class="k">end</span>
  <span class="n">collection</span> <span class="k">do</span>
    <span class="n">patch</span> <span class="ss">:read_all</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="the-takeaway">The Takeaway</h3>

<p>Keep frontend assets inside the engine. CSS, Stimulus controllers, Turbo Stream templates – they all live in the engine’s directory structure, scoped under its namespace. The engine provides defaults; the host app can override anything by placing a file at the same path.</p>

<p>The one coupling point is JavaScript registration. The host app’s importmap (or build config) needs to know about the engine’s controllers. This is a conscious trade-off: you get Stimulus’s autoloading conventions in exchange for one line of configuration per engine. For most teams, that’s a deal worth taking.</p>

<hr />

<h2 id="testing-the-engine">Testing the Engine</h2>

<p>Here’s where the dummy app earns its keep. The engine ships with a minimal Rails application in <code>test/dummy/</code> that boots just enough infrastructure to run the engine’s tests.</p>

<p>Let’s set up RSpec for the engine. Add testing dependencies to the engine’s <code>Gemfile</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/Gemfile</span>

<span class="n">source</span> <span class="s2">"https://rubygems.org"</span>

<span class="n">gemspec</span>

<span class="n">group</span> <span class="ss">:development</span><span class="p">,</span> <span class="ss">:test</span> <span class="k">do</span>
  <span class="n">gem</span> <span class="s2">"rspec-rails"</span>
  <span class="n">gem</span> <span class="s2">"factory_bot_rails"</span>
<span class="k">end</span>
</code></pre></div></div>

<blockquote>
  <p><strong>Note:</strong> You might see older examples that use <code>spec.add_development_dependency</code> in the gemspec. Since Bundler 2.5+ (which ships with Rails 8.1), <code>add_development_dependency</code> in gemspecs is deprecated. Development dependencies should go in the engine’s <code>Gemfile</code> instead. Runtime dependencies still belong in the gemspec via <code>spec.add_dependency</code>.</p>
</blockquote>

<p>Create the RSpec configuration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/spec/rails_helper.rb</span>

<span class="nb">require</span> <span class="s2">"spec_helper"</span>

<span class="no">ENV</span><span class="p">[</span><span class="s2">"RAILS_ENV"</span><span class="p">]</span> <span class="o">||=</span> <span class="s2">"test"</span>
<span class="nb">require</span> <span class="no">File</span><span class="p">.</span><span class="nf">expand_path</span><span class="p">(</span><span class="s2">"../test/dummy/config/environment"</span><span class="p">,</span> <span class="n">__dir__</span><span class="p">)</span>

<span class="nb">abort</span><span class="p">(</span><span class="s2">"The Rails environment is running in production mode!"</span><span class="p">)</span> <span class="k">if</span> <span class="no">Rails</span><span class="p">.</span><span class="nf">env</span><span class="p">.</span><span class="nf">production?</span>

<span class="nb">require</span> <span class="s2">"rspec/rails"</span>
<span class="nb">require</span> <span class="s2">"factory_bot_rails"</span>

<span class="c1"># Load engine migrations in the dummy app</span>
<span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">.</span><span class="nf">maintain_test_schema!</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">configure</span> <span class="k">do</span> <span class="o">|</span><span class="n">config</span><span class="o">|</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">fixture_paths</span> <span class="o">=</span> <span class="p">[</span><span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"spec/fixtures"</span><span class="p">)]</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">use_transactional_fixtures</span> <span class="o">=</span> <span class="kp">true</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">infer_spec_type_from_file_location!</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">filter_rails_from_backtrace!</span>

  <span class="n">config</span><span class="p">.</span><span class="nf">include</span> <span class="no">FactoryBot</span><span class="o">::</span><span class="no">Syntax</span><span class="o">::</span><span class="no">Methods</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Now write a model spec:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/spec/models/notifications/notification_spec.rb</span>

<span class="nb">require</span> <span class="s2">"rails_helper"</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">,</span> <span class="ss">type: :model</span> <span class="k">do</span>
  <span class="n">describe</span> <span class="s2">"validations"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"requires a subject"</span> <span class="k">do</span>
      <span class="n">notification</span> <span class="o">=</span> <span class="n">described_class</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">subject: </span><span class="kp">nil</span><span class="p">)</span>
      <span class="n">expect</span><span class="p">(</span><span class="n">notification</span><span class="p">).</span><span class="nf">not_to</span> <span class="n">be_valid</span>
      <span class="n">expect</span><span class="p">(</span><span class="n">notification</span><span class="p">.</span><span class="nf">errors</span><span class="p">[</span><span class="ss">:subject</span><span class="p">]).</span><span class="nf">to</span> <span class="kp">include</span><span class="p">(</span><span class="s2">"can't be blank"</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"#mark_as_read!"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"sets read_at to the current time"</span> <span class="k">do</span>
      <span class="n">notification</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:notification</span><span class="p">)</span>

      <span class="n">expect</span> <span class="p">{</span> <span class="n">notification</span><span class="p">.</span><span class="nf">mark_as_read!</span> <span class="p">}</span>
        <span class="p">.</span><span class="nf">to</span> <span class="n">change</span> <span class="p">{</span> <span class="n">notification</span><span class="p">.</span><span class="nf">read_at</span> <span class="p">}.</span><span class="nf">from</span><span class="p">(</span><span class="kp">nil</span><span class="p">)</span>
    <span class="k">end</span>

    <span class="n">it</span> <span class="s2">"does nothing if already read"</span> <span class="k">do</span>
      <span class="n">notification</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:notification</span><span class="p">,</span> <span class="ss">read_at: </span><span class="mi">1</span><span class="p">.</span><span class="nf">hour</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>

      <span class="n">expect</span> <span class="p">{</span> <span class="n">notification</span><span class="p">.</span><span class="nf">mark_as_read!</span> <span class="p">}</span>
        <span class="p">.</span><span class="nf">not_to</span> <span class="n">change</span> <span class="p">{</span> <span class="n">notification</span><span class="p">.</span><span class="nf">reload</span><span class="p">.</span><span class="nf">read_at</span> <span class="p">}</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"#mark_as_unread!"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"clears read_at"</span> <span class="k">do</span>
      <span class="n">notification</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:notification</span><span class="p">,</span> <span class="ss">read_at: </span><span class="mi">1</span><span class="p">.</span><span class="nf">hour</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>

      <span class="n">expect</span> <span class="p">{</span> <span class="n">notification</span><span class="p">.</span><span class="nf">mark_as_unread!</span> <span class="p">}</span>
        <span class="p">.</span><span class="nf">to</span> <span class="n">change</span> <span class="p">{</span> <span class="n">notification</span><span class="p">.</span><span class="nf">read_at</span> <span class="p">}.</span><span class="nf">to</span><span class="p">(</span><span class="kp">nil</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"scopes"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">".unread returns notifications without read_at"</span> <span class="k">do</span>
      <span class="n">unread</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:notification</span><span class="p">,</span> <span class="ss">read_at: </span><span class="kp">nil</span><span class="p">)</span>
      <span class="n">_read</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:notification</span><span class="p">,</span> <span class="ss">read_at: </span><span class="mi">1</span><span class="p">.</span><span class="nf">hour</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>

      <span class="n">expect</span><span class="p">(</span><span class="n">described_class</span><span class="p">.</span><span class="nf">unread</span><span class="p">).</span><span class="nf">to</span> <span class="n">contain_exactly</span><span class="p">(</span><span class="n">unread</span><span class="p">)</span>
    <span class="k">end</span>

    <span class="n">it</span> <span class="s2">".recent orders by created_at descending"</span> <span class="k">do</span>
      <span class="n">old</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:notification</span><span class="p">,</span> <span class="ss">created_at: </span><span class="mi">2</span><span class="p">.</span><span class="nf">days</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>
      <span class="n">recent</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:notification</span><span class="p">,</span> <span class="ss">created_at: </span><span class="mi">1</span><span class="p">.</span><span class="nf">hour</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>

      <span class="n">expect</span><span class="p">(</span><span class="n">described_class</span><span class="p">.</span><span class="nf">recent</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">([</span><span class="n">recent</span><span class="p">,</span> <span class="n">old</span><span class="p">])</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>And a factory:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/spec/factories/notifications.rb</span>

<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">define</span> <span class="k">do</span>
  <span class="n">factory</span> <span class="ss">:user</span> <span class="k">do</span>
    <span class="n">sequence</span><span class="p">(</span><span class="ss">:email</span><span class="p">)</span> <span class="p">{</span> <span class="o">|</span><span class="n">n</span><span class="o">|</span> <span class="s2">"user</span><span class="si">#{</span><span class="n">n</span><span class="si">}</span><span class="s2">@example.com"</span> <span class="p">}</span>
  <span class="k">end</span>

  <span class="n">factory</span> <span class="ss">:notification</span><span class="p">,</span> <span class="ss">class: </span><span class="s2">"Notifications::Notification"</span> <span class="k">do</span>
    <span class="n">subject</span> <span class="p">{</span> <span class="s2">"You have a new message"</span> <span class="p">}</span>
    <span class="n">body</span> <span class="p">{</span> <span class="s2">"Someone sent you a message."</span> <span class="p">}</span>
    <span class="n">association</span> <span class="ss">:recipient</span><span class="p">,</span> <span class="ss">factory: :user</span>
    <span class="n">read_at</span> <span class="p">{</span> <span class="kp">nil</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<blockquote>
  <p><strong>Note:</strong> The <code>:user</code> factory above is a minimal stand-in for the engine’s test suite. Since the engine doesn’t own the <code>User</code> model, this factory lives in the engine’s dummy app context and only needs enough fields to satisfy the polymorphic <code>recipient</code> association. In a real project, you’d match the fields your <code>users</code> table requires.</p>
</blockquote>

<p>The key point: these tests run against the engine’s dummy app, not the host application. When you run <code>cd engines/notifications &amp;&amp; bundle exec rspec</code>, only the engine’s code is loaded. The test suite is fast because it’s small and focused.</p>

<p>This is Kent Beck’s first rule of simple design in action: <strong>passes the tests</strong>. And the tests are fast because the component is bounded.</p>

<blockquote>
  <p><strong>Checkpoint</strong> — You have a fully tested, self-contained engine with models, controllers, views, routes, and specs that run against the dummy app. The remaining sections cover packaging, versioning, and mounting in the host app – just wiring to make it all live. Well worth a break here; the hard part is done.</p>
</blockquote>

<h2 id="the-install-generator">The Install Generator</h2>

<p>As your engine matures, you can provide an install generator that automates the setup steps a host app developer would otherwise do manually. This is the conventional way Rails engines distribute their setup:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/generators/billing/install/install_generator.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">Generators</span>
    <span class="k">class</span> <span class="nc">InstallGenerator</span> <span class="o">&lt;</span> <span class="no">Rails</span><span class="o">::</span><span class="no">Generators</span><span class="o">::</span><span class="no">Base</span>
      <span class="n">source_root</span> <span class="no">File</span><span class="p">.</span><span class="nf">expand_path</span><span class="p">(</span><span class="s2">"templates"</span><span class="p">,</span> <span class="n">__dir__</span><span class="p">)</span>

      <span class="k">def</span> <span class="nf">copy_initializer</span>
        <span class="n">template</span> <span class="s2">"billing.rb"</span><span class="p">,</span> <span class="s2">"config/initializers/billing.rb"</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">mount_engine</span>
        <span class="n">route</span> <span class="s1">'mount Billing::Engine, at: "/billing"'</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">copy_migrations</span>
        <span class="n">rake</span> <span class="s2">"billing:install:migrations"</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">show_readme</span>
        <span class="n">readme</span> <span class="s2">"README"</span> <span class="k">if</span> <span class="n">behavior</span> <span class="o">==</span> <span class="ss">:invoke</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The host app developer runs:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/rails generate billing:install
</code></pre></div></div>

<p>And gets the initializer, route mount, and migrations copied in one step. The generator template for the initializer:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/generators/billing/install/templates/billing.rb</span>

<span class="no">Billing</span><span class="p">.</span><span class="nf">customer_class</span> <span class="o">=</span> <span class="s2">"User"</span>
<span class="no">Billing</span><span class="p">.</span><span class="nf">currency</span> <span class="o">=</span> <span class="s2">"GBP"</span>
<span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"::ApplicationController"</span>
</code></pre></div></div>

<p>This is a convenience, not a requirement. For the companion application where both engines live inside the same repo, manual setup is fine. But if you ever extract an engine to a separate gem, the install generator is what makes the difference between “add this gem and run one command” and “add this gem, then create three files, add two lines to routes, and run a rake task.”</p>

<hr />

<h2 id="packaging-and-versioning">Packaging and Versioning</h2>

<p>The engine already has a version file:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/lib/notifications/version.rb</span>

<span class="k">module</span> <span class="nn">Notifications</span>
  <span class="no">VERSION</span> <span class="o">=</span> <span class="s2">"0.1.0"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>For a local engine (living in <code>engines/</code> within your app), this version is informational. But if you later move the engine to its own repository, this version becomes critical. Follow semantic versioning:</p>

<ul>
  <li><strong>Patch</strong> (0.1.1): bug fixes, no interface changes</li>
  <li><strong>Minor</strong> (0.2.0): new features, backwards-compatible</li>
  <li><strong>Major</strong> (1.0.0): breaking changes to the engine’s public interface</li>
</ul>

<p>When the engine lives in its own repository, the host app references it with a git tag:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Gemfile</span>
<span class="n">gem</span> <span class="s2">"notifications"</span><span class="p">,</span> <span class="ss">git: </span><span class="s2">"git@github.com:your-org/notifications-engine.git"</span><span class="p">,</span> <span class="ss">tag: </span><span class="s2">"v0.2.0"</span>
</code></pre></div></div>

<p>Bumping the version tag is a deliberate decision. The host app’s <code>Gemfile.lock</code> records exactly which version is in use. No surprises.</p>

<hr />

<h2 id="mounting-in-the-host-application">Mounting in the Host Application</h2>

<p>Let’s wire everything together. In the host app:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/routes.rb</span>

<span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">mount</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/notifications"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Copy the engine’s migrations to the host app:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/rails notifications:install:migrations
bin/rails db:migrate
</code></pre></div></div>

<p>Create the initializer:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/initializers/notifications.rb</span>

<span class="no">Notifications</span><span class="p">.</span><span class="nf">current_recipient_method</span> <span class="o">=</span> <span class="ss">:current_user</span>
</code></pre></div></div>

<p>Include the concern in your User model:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/models/user.rb</span>

<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Notifiable</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="diagram"><img src="/img/books/modular-rails/b5d399638969b07b7f742b6e0cfdc281b5abb0c8c757fdd99ef18cd8936b5c72.svg" alt="Mermaid diagram: sequenceDiagram"></div>

<p>That’s it. Four steps: mount the routes, run the migrations, configure the recipient method, include the concern. The engine is live.</p>

<hr />

<h2 id="variant-api-only-engines">Variant: API-Only Engines</h2>

<p>Not every engine needs views. If you’re building an internal API for a frontend app, a mobile backend, a webhook receiver, or an engine that serves data to other systems, you want a leaner setup. No views, no layouts, no helpers, no asset pipeline. Just controllers that return JSON.</p>

<h3 id="generating-a-leaner-engine">Generating a Leaner Engine</h3>

<p>There’s no <code>--api</code> flag for the engine generator. You get the full scaffold regardless. But you can strip it down to API-only in a few moves:</p>

<ul>
  <li>Inherit from <code>ActionController::API</code> instead of <code>ActionController::Base</code></li>
  <li>Delete the <code>app/views/</code>, <code>app/assets/</code>, and <code>app/helpers/</code> directories (or just ignore them)</li>
  <li>Use <code>respond_to :json</code> as the default</li>
</ul>

<p><code>ActionController::API</code> is a thinner slice of the controller stack. It skips middleware you don’t need – cookies, session management, flash messages, CSRF protection, template rendering. Your engine boots faster and does less work per request.</p>

<h3 id="a-practical-example-billing-api">A Practical Example: Billing API</h3>

<p>Say your billing engine needs to expose invoice data as JSON – for a React frontend, a mobile app, or another internal service. Here’s how that looks.</p>

<p>The base controller sets up API-only behaviour and delegates authentication back to the host app:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/api/application_controller.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">Api</span>
    <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">ActionController</span><span class="o">::</span><span class="no">API</span>
      <span class="n">before_action</span> <span class="ss">:authenticate_api_request!</span>

      <span class="kp">private</span>

      <span class="k">def</span> <span class="nf">authenticate_api_request!</span>
        <span class="c1"># Delegate to host app's authentication</span>
        <span class="n">method_name</span> <span class="o">=</span> <span class="no">Billing</span><span class="p">.</span><span class="nf">api_auth_method</span>
        <span class="k">if</span> <span class="nb">respond_to?</span><span class="p">(</span><span class="n">method_name</span><span class="p">,</span> <span class="kp">true</span><span class="p">)</span>
          <span class="nb">send</span><span class="p">(</span><span class="n">method_name</span><span class="p">)</span>
        <span class="k">else</span>
          <span class="n">head</span> <span class="ss">:unauthorized</span>
        <span class="k">end</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Same pattern as the notifications engine – configurable authentication, no hard dependency on the host app.</p>

<p>The invoices controller is straightforward:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/api/invoices_controller.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">Api</span>
    <span class="k">class</span> <span class="nc">InvoicesController</span> <span class="o">&lt;</span> <span class="no">ApplicationController</span>
      <span class="k">def</span> <span class="nf">index</span>
        <span class="n">invoices</span> <span class="o">=</span> <span class="no">Invoice</span><span class="p">.</span><span class="nf">where</span><span class="p">(</span><span class="ss">user_id: </span><span class="n">current_user</span><span class="p">.</span><span class="nf">id</span><span class="p">).</span><span class="nf">recent</span>
        <span class="n">render</span> <span class="ss">json: </span><span class="n">invoices</span><span class="p">.</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">i</span><span class="o">|</span> <span class="n">serialize</span><span class="p">(</span><span class="n">i</span><span class="p">)</span> <span class="p">}</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">show</span>
        <span class="n">invoice</span> <span class="o">=</span> <span class="no">Invoice</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:id</span><span class="p">])</span>
        <span class="n">render</span> <span class="ss">json: </span><span class="n">serialize</span><span class="p">(</span><span class="n">invoice</span><span class="p">)</span>
      <span class="k">end</span>

      <span class="kp">private</span>

      <span class="k">def</span> <span class="nf">serialize</span><span class="p">(</span><span class="n">invoice</span><span class="p">)</span>
        <span class="p">{</span>
          <span class="ss">id: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
          <span class="ss">amount_cents: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">amount_cents</span><span class="p">,</span>
          <span class="ss">currency: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">currency</span><span class="p">,</span>
          <span class="ss">status: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">status</span><span class="p">,</span>
          <span class="ss">due_date: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">due_date</span><span class="p">,</span>
          <span class="ss">paid_at: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">paid_at</span>
        <span class="p">}</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="routes-for-the-api">Routes for the API</h3>

<p>You’ll likely want both regular engine routes and versioned API routes. The API namespace sits alongside whatever else the engine already serves:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/config/routes.rb</span>
<span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">resources</span> <span class="ss">:invoices</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:index</span><span class="p">,</span> <span class="ss">:show</span><span class="p">]</span>
  <span class="n">resources</span> <span class="ss">:subscriptions</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:index</span><span class="p">,</span> <span class="ss">:show</span><span class="p">]</span>

  <span class="n">namespace</span> <span class="ss">:api</span> <span class="k">do</span>
    <span class="n">namespace</span> <span class="ss">:v1</span> <span class="k">do</span>
      <span class="n">resources</span> <span class="ss">:invoices</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:index</span><span class="p">,</span> <span class="ss">:show</span><span class="p">]</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The versioned namespace gives you room to evolve the API without breaking existing consumers. When <code>v2</code> arrives, <code>v1</code> keeps working.</p>

<h3 id="what-you-skip">What You Skip</h3>

<p>Compared to a full-stack engine, an API-only engine doesn’t need:</p>

<ul>
  <li><strong>Views and layouts</strong> – no ERB, no partials, no view helpers</li>
  <li><strong>Asset pipeline integration</strong> – no CSS, no JavaScript, no images</li>
  <li><strong>Helpers</strong> – view helpers are irrelevant without views</li>
  <li><strong>CSRF protection</strong> – API requests use token-based auth, not cookies</li>
</ul>

<p>This isn’t just about tidiness. Fewer moving parts means faster boot times, simpler tests, and less surface area for bugs.</p>

<h3 id="a-note-on-serialisation">A Note on Serialisation</h3>

<p>The <code>serialize</code> method above is deliberately simple. For a small API with a handful of endpoints, explicit hash construction is the right call – it’s obvious, it has no dependencies, and it keeps the engine self-contained.</p>

<p>When your API grows more complex – nested associations, conditional fields, pagination metadata – you might reach for a serialisation library like Alba or Blueprinter. But think twice before adding that dependency to the engine. Every gem you add to the engine’s gemspec is a gem the host app inherits. For a clean engine boundary, I’d keep serialisation explicit for as long as it’s practical, and only introduce a library when the pain of maintaining manual serialisation outweighs the cost of the dependency.</p>

<hr />

<h2 id="what-we-built">What We Built</h2>

<p>Let’s step back and look at what we have:</p>

<ul>
  <li><strong>A self-contained notification system</strong> with its own models, controllers, views, and routes</li>
  <li><strong>Namespace isolation</strong> via <code>isolate_namespace</code> – the engine’s code doesn’t leak into the host app</li>
  <li><strong>A clean integration interface</strong> – one concern (<code>Notifiable</code>), one configuration option (<code>current_recipient_method</code>), one route mount</li>
  <li><strong>Independent tests</strong> that run against a lightweight dummy app, not the full host application</li>
  <li><strong>No hard dependencies</strong> on the host app’s models, controllers, or authentication system</li>
</ul>

<p>The engine doesn’t know if the host app uses Devise or a custom auth system. It doesn’t know if recipients are <code>User</code> objects or <code>Account</code> objects. It doesn’t care. It provides notification functionality, and the host app decides how to integrate it.</p>

<p>This is the Common Reuse Principle in action: the engine exposes exactly what the host app needs, and nothing more.</p>

<hr />

<p><em>In the next chapter, we’ll explore the integration patterns in depth – how engines communicate with the host app and with each other, without compromising the boundaries we’ve just built.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-06-namespace-isolation/">&larr; Namespace Isolation</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-08-engine-integration-patterns/">Engine Integration Patterns &rarr;</a>
</nav>
{% endraw %}
