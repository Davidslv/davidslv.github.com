---
layout: book
book: modular_rails
title: "Appendix A: The Companion Application"
permalink: /books/modular-rails/appendix-a-companion-application/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-18-evolving-your-architecture/">&larr; Evolving Your Architecture Over Time</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/appendix-b-quick-reference/">Appendix B: Rails Engine Quick Reference &rarr;</a>
</nav>

<h1 id="appendix-a-the-companion-application">Appendix A: The Companion Application</h1>

<p>This book ships with a working Rails application that demonstrates everything discussed in the chapters. You can read the book without it, but running the code yourself will make the patterns stick.</p>

<p>The companion app is called <strong>Orbit</strong> – a simplified SaaS platform for subscriptions, invoicing, and notifications. It lives in its own repository at <a href="https://github.com/Davidslv/orbit">github.com/Davidslv/orbit</a>.</p>

<h2 id="repository-structure-and-setup-instructions">Repository Structure and Setup Instructions</h2>

<h3 id="tech-stack">Tech Stack</h3>

<ul>
  <li><strong>Ruby</strong> 3.4+</li>
  <li><strong>Rails</strong> 8.1+</li>
  <li><strong>PostgreSQL</strong> (any recent version)</li>
  <li><strong>RSpec</strong> for host app tests</li>
  <li><strong>Minitest</strong> for engine tests (Rails engine generator default)</li>
</ul>

<h3 id="directory-layout">Directory Layout</h3>

<pre><code>orbit/
├── app/                          # Host application code
│   ├── controllers/
│   ├── models/
│   └── views/
├── bin/
│   ├── ci                        # Rails 8.1 CI runner
│   ├── dev                       # Development server
│   ├── rails
│   ├── rake
│   └── setup                     # One-command setup script
├── config/
│   ├── application.rb            # ModularRails::Application
│   ├── ci.rb                     # CI step definitions
│   ├── database.yml              # PostgreSQL configuration
│   └── routes.rb
├── db/
│   └── seeds.rb
├── engines/                      # All engines live here
│   ├── core/                     # Shared kernel (Chapter 8, Pattern 6)
│   │   ├── app/
│   │   │   └── models/concerns/core/
│   │   │       └── auditable.rb  # Cross-cutting audit concern
│   │   ├── lib/
│   │   │   └── core/
│   │   │       ├── engine.rb
│   │   │       └── version.rb
│   │   ├── core.gemspec
│   │   └── README.md
│   ├── notifications/            # Built in Chapter 7
│   │   ├── app/
│   │   │   ├── controllers/notifications/
│   │   │   ├── models/notifications/
│   │   │   ├── mailers/notifications/
│   │   │   ├── jobs/notifications/
│   │   │   └── views/layouts/notifications/
│   │   ├── config/
│   │   │   └── routes.rb
│   │   ├── lib/
│   │   │   └── notifications/
│   │   │       ├── engine.rb     # isolate_namespace Notifications
│   │   │       └── version.rb
│   │   ├── test/
│   │   │   ├── dummy/            # Standalone Rails app for isolated testing
│   │   │   ├── controllers/
│   │   │   ├── integration/
│   │   │   ├── models/
│   │   │   └── test_helper.rb
│   │   ├── Gemfile
│   │   ├── Rakefile
│   │   └── notifications.gemspec
│   └── billing/                  # Built in Chapters 10-12 (follow along)
├── spec/                         # Host app specs (RSpec)
│   ├── rails_helper.rb
│   └── spec_helper.rb
├── Gemfile
├── Gemfile.lock
└── Rakefile
</code></pre>

<p>The <code>engines/</code> directory is the important part. Each engine is a self-contained gem with its own <code>app/</code>, <code>lib/</code>, <code>test/</code>, and gemspec. The host app references them as path dependencies in its <code>Gemfile</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">gem</span> <span class="s2">"core"</span><span class="p">,</span> <span class="ss">path: </span><span class="s2">"engines/core"</span>
<span class="n">gem</span> <span class="s2">"notifications"</span><span class="p">,</span> <span class="ss">path: </span><span class="s2">"engines/notifications"</span>
<span class="n">gem</span> <span class="s2">"billing"</span><span class="p">,</span> <span class="ss">path: </span><span class="s2">"engines/billing"</span>
</code></pre></div></div>

<p>The notifications engine uses <code>isolate_namespace</code>, which means its models, controllers, and routes are fully namespaced under <code>Notifications::</code>. This is not optional – it is the pattern this book recommends.</p>

<h3 id="prerequisites">Prerequisites</h3>

<p>You need PostgreSQL running locally. On macOS with Homebrew:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>brew <span class="nb">install </span>postgresql@17
brew services start postgresql@17
</code></pre></div></div>

<h3 id="setup">Setup</h3>

<p>Clone the Orbit repository:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>git clone https://github.com/Davidslv/orbit.git
<span class="nb">cd </span>orbit
</code></pre></div></div>

<p>Run the setup script. It installs dependencies and prepares the database:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/setup
</code></pre></div></div>

<p>That single command runs <code>bundle install</code>, <code>rails db:prepare</code>, and clears old logs and temp files. If you want to reset the database from scratch:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/setup <span class="nt">--reset</span>
</code></pre></div></div>

<h3 id="manual-setup-if-you-prefer">Manual Setup (If You Prefer)</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bundle <span class="nb">install
</span>bin/rails db:create
bin/rails db:migrate
</code></pre></div></div>

<p>If the notifications engine (or any engine) has migrations, copy them to the host app first:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/rails notifications:install:migrations
bin/rails db:migrate
</code></pre></div></div>

<p>As you add more engines throughout the book, repeat this pattern:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/rails billing:install:migrations
bin/rails db:migrate
</code></pre></div></div>

<h2 id="running-the-examples">Running the Examples</h2>

<h3 id="host-app-tests">Host App Tests</h3>

<p>From the project root:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bundle <span class="nb">exec </span>rspec
</code></pre></div></div>

<p>This runs the host app’s RSpec suite. It boots the full application, including all mounted engines.</p>

<h3 id="engine-tests-in-isolation">Engine Tests in Isolation</h3>

<p>Each engine has its own test suite and a dummy Rails app inside <code>test/dummy/</code> that provides just enough Rails to run the engine’s tests without the host app.</p>

<p>To run the notifications engine tests:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd </span>engines/notifications
bundle <span class="nb">install
</span>bin/rails db:create db:migrate <span class="nv">RAILS_ENV</span><span class="o">=</span><span class="nb">test
</span>bin/rails <span class="nb">test</span>
</code></pre></div></div>

<p>The engine’s <code>Rakefile</code> loads <code>rails/tasks/engine.rake</code>, which delegates to the dummy app. The dummy app has its own <code>config/database.yml</code> pointing to a separate <code>notifications_dummy_test</code> database, so it does not interfere with the host app’s database.</p>

<p>This isolation is the whole point. If the notifications engine tests pass in isolation, you know it does not depend on anything it should not.</p>

<h3 id="running-the-full-suite">Running the Full Suite</h3>

<p>To run everything – host app tests and all engine tests – from the project root:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Host app</span>
bundle <span class="nb">exec </span>rspec

<span class="c"># Each engine</span>
<span class="nb">cd </span>engines/notifications <span class="o">&amp;&amp;</span> bundle <span class="nb">exec </span>rails <span class="nb">test</span> <span class="o">&amp;&amp;</span> <span class="nb">cd</span> ../..
</code></pre></div></div>

<p>You can wrap this in a script as your engine count grows. Chapter 13 discusses CI pipelines that test engines independently and together.</p>

<h3 id="using-binci">Using <code>bin/ci</code></h3>

<p>Rails 8.1 introduced <code>bin/ci</code>, a built-in CI runner configured via <code>config/ci.rb</code>. The companion app includes it:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/ci.rb</span>
<span class="no">CI</span><span class="p">.</span><span class="nf">run</span> <span class="k">do</span>
  <span class="n">step</span> <span class="s2">"Setup"</span><span class="p">,</span> <span class="s2">"bin/setup --skip-server"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Run it with:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bin/ci
</code></pre></div></div>

<p>This runs the setup step (without starting the dev server) and any test steps you add. As you work through the book, you will add steps for linting, running host specs, and running engine test suites. The CI runner gives you a single command that mirrors what your CI pipeline does.</p>

<h2 id="engine-dependency-map">Engine Dependency Map</h2>

<p>This diagram shows the dependency relationships between the host app and its engines. Arrows point from the dependent to the dependency.</p>

<div class="diagram"><img src="/img/books/modular-rails/b231c8d6b038cb30a6502eb2303e6e14a13cb11101068826f1ad1eed05240414.svg" alt="Mermaid diagram: ModularRails&lt;br/&gt;&lt;i&gt;Host Application&lt;/i&gt;"></div>

<p><strong>Solid arrows</strong> represent direct gem dependencies (declared in the host app’s <code>Gemfile</code> or an engine’s gemspec). <strong>Dashed arrows</strong> represent indirect communication – typically event-based or through a shared interface – which avoids hard coupling between engines.</p>

<p>Key points:</p>

<ul>
  <li>The <strong>host app</strong> depends on all three engines. It declares them as path gems and mounts their routes.</li>
  <li><strong>Core</strong> is the shared kernel (Chapter 8, Pattern 6). It provides cross-cutting concerns like <code>Core::Auditable</code>. It has no dependencies on other engines.</li>
  <li><strong>Billing</strong> depends on <code>core</code> (declared in its gemspec) and communicates with notifications through events, not a direct gem dependency. This keeps the dependency graph acyclic.</li>
  <li><strong>Notifications</strong> is a standalone engine with no dependencies on other engines.</li>
  <li>Engines never depend on the host app. Dependencies point inward, following the Dependency Rule from Chapter 2.</li>
</ul>

<p>As your application grows, this diagram becomes your architectural compass. If you see an arrow pointing the wrong way, you have a coupling problem. Chapter 11 covers how to break dependency cycles when they appear.</p>

<h2 id="chapter-cross-reference">Chapter Cross-Reference</h2>

<p>This table maps each chapter to the relevant files and directories in the <a href="https://github.com/Davidslv/orbit">Orbit repository</a>. Use it to find the code that corresponds to what you are reading.</p>

<table>
  <thead>
    <tr>
      <th>Chapter</th>
      <th>Relevant Files / Directories</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Ch 5: Rails Engines from the Inside Out</strong></td>
      <td><code>engines/notifications/lib/notifications/engine.rb</code> – <code>isolate_namespace</code> and engine class. <code>engines/notifications/notifications.gemspec</code> – engine packaged as a gem.</td>
    </tr>
    <tr>
      <td><strong>Ch 6: Namespace Isolation</strong></td>
      <td><code>engines/notifications/app/models/notifications/</code> – namespaced models. <code>engines/notifications/app/controllers/notifications/</code> – namespaced controllers. <code>engines/notifications/config/routes.rb</code> – engine routes.</td>
    </tr>
    <tr>
      <td><strong>Ch 7: Building Your First Engine</strong></td>
      <td><code>engines/notifications/</code> – the entire engine directory. <code>engines/notifications/test/dummy/</code> – the dummy app for isolated testing. <code>Gemfile</code> – host app’s path dependency on the engine.</td>
    </tr>
    <tr>
      <td><strong>Ch 8: Engine Integration Patterns</strong></td>
      <td><code>config/routes.rb</code> – where engines are mounted. <code>config/application.rb</code> – framework selection and engine loading via Bundler.</td>
    </tr>
    <tr>
      <td><strong>Ch 9: Identifying Boundaries</strong></td>
      <td><code>app/</code> – the host app before extraction. Use <code>git log</code> to trace the extraction history.</td>
    </tr>
    <tr>
      <td><strong>Ch 10: Extracting Your First Engine</strong></td>
      <td><code>engines/billing/</code> – the billing engine you extract step by step. <code>Gemfile</code> – adding the path dependency.</td>
    </tr>
    <tr>
      <td><strong>Ch 11: Managing Inter-Engine Dependencies</strong></td>
      <td><code>engines/billing/</code> and <code>engines/notifications/</code> – event-based communication between engines without direct coupling.</td>
    </tr>
    <tr>
      <td><strong>Ch 12: Data Ownership</strong></td>
      <td><code>engines/notifications/db/migrate/</code> and <code>engines/billing/db/migrate/</code> – each engine owns its migrations. <code>db/migrate/</code> – host app migrations after <code>install:migrations</code>.</td>
    </tr>
    <tr>
      <td><strong>Ch 13: Testing Strategy</strong></td>
      <td><code>spec/</code> – host app RSpec suite. <code>engines/notifications/test/</code> – engine tests with dummy app. <code>bin/ci</code> and <code>config/ci.rb</code> – CI runner configuration.</td>
    </tr>
    <tr>
      <td><strong>Ch 14: Team Workflow</strong></td>
      <td><code>Gemfile</code> – path vs versioned gem references. <code>engines/notifications/.github/workflows/ci.yml</code> – engine-level CI pipeline.</td>
    </tr>
  </tbody>
</table>

<p>Chapters 1-4 (Part I: Principles) and Chapters 15-18 (Part IV: Trade-offs) are conceptual. They reference the companion app for examples but do not map to specific files.</p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-18-evolving-your-architecture/">&larr; Evolving Your Architecture Over Time</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/appendix-b-quick-reference/">Appendix B: Rails Engine Quick Reference &rarr;</a>
</nav>
{% endraw %}
