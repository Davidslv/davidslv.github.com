---
layout: book
book: modular_rails
title: "Testing Strategy for a Modular Monolith"
permalink: /books/modular-rails/chapter-13-testing-strategy/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-12-data-ownership/">&larr; Data Ownership and the Database Question</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-14-team-workflow/">Team Workflow and Developer Experience &rarr;</a>
</nav>

<h1 id="chapter-13-testing-strategy-for-a-modular-monolith">Chapter 13: Testing Strategy for a Modular Monolith</h1>

<p>Your test suite takes 40 minutes. Mine takes 4. Here’s why.</p>

<p>The difference isn’t parallelisation, spring preloaders, or a faster CI provider. It’s boundaries. When your application is a single undifferentiated mass, every test loads everything. When it’s divided into engines with clear boundaries, each test loads only what it needs. The test suite doesn’t get faster because of a trick – it gets faster because it’s doing less unnecessary work.</p>

<p>This chapter covers the complete testing strategy for a modular Rails application: engine-level unit tests, host-level integration tests, contract tests between engines, selective test execution, and CI pipeline design.</p>

<hr />

<h2 id="the-testing-pyramid-for-engines">The Testing Pyramid for Engines</h2>

<p>A modular Rails application has three testing layers:</p>

<div class="diagram"><img src="/img/books/modular-rails/62f588ce12dbeb68cbeecb4a230b1962f7388a3d7e7fa72f4b43f056d4b49b88.svg" alt="Mermaid diagram: &lt;b&gt;Integration tests&lt;/b&gt; (host app)&lt;br/&gt;Few, slow, high confidence"></div>

<p><strong>Engine unit tests</strong> are the foundation. They run against the engine’s dummy app, not the full host application. They’re fast because the dummy app is minimal – it loads only the engine’s code and whatever the dummy app provides (a simple <code>User</code> model, basic database tables).</p>

<p><strong>Contract tests</strong> verify that engines honour their integration contracts. When the billing engine exposes a <code>Billable</code> concern, a contract test verifies that the concern works when included in a model with the expected interface.</p>

<p><strong>Integration tests</strong> run at the host application level with all engines mounted. They verify that the engines work together correctly: routes resolve, views render, cross-engine workflows complete.</p>

<p>Most of your tests should be engine unit tests. They’re fast, focused, and catch most bugs. Contract and integration tests are fewer in number but higher in confidence.</p>

<div class="diagram"><img src="/img/books/modular-rails/39b028a505acdce9d9c2a1cec853cee3625f4e7a5d90e5f13d87bd1d62b624f2.svg" alt="Mermaid diagram:  "></div>

<p>The bulk of your tests sit at the bottom: fast engine unit tests that run against a minimal dummy app. Contract tests verify interface agreements. Integration tests at the top confirm everything works together.</p>

<hr />

<h2 id="engine-unit-tests-the-dummy-app">Engine Unit Tests: The Dummy App</h2>

<p>Every mountable engine ships with a dummy Rails application in <code>test/dummy/</code>. This is a fully functional Rails app – it has a database, routes, controllers, and models. It exists solely to provide the environment the engine needs to run its tests.</p>

<h3 id="setting-up-rspec-in-an-engine">Setting up RSpec in an engine</h3>

<p>Add the development dependencies to the gemspec:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/billing.gemspec</span>

<span class="n">spec</span><span class="p">.</span><span class="nf">add_development_dependency</span> <span class="s2">"rspec-rails"</span>
<span class="n">spec</span><span class="p">.</span><span class="nf">add_development_dependency</span> <span class="s2">"factory_bot_rails"</span>
<span class="n">spec</span><span class="p">.</span><span class="nf">add_development_dependency</span> <span class="s2">"shoulda-matchers"</span>
</code></pre></div></div>

<p>Create the RSpec configuration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/rails_helper.rb</span>

<span class="nb">require</span> <span class="s2">"spec_helper"</span>

<span class="no">ENV</span><span class="p">[</span><span class="s2">"RAILS_ENV"</span><span class="p">]</span> <span class="o">||=</span> <span class="s2">"test"</span>
<span class="nb">require</span> <span class="no">File</span><span class="p">.</span><span class="nf">expand_path</span><span class="p">(</span><span class="s2">"../test/dummy/config/environment"</span><span class="p">,</span> <span class="n">__dir__</span><span class="p">)</span>

<span class="nb">abort</span><span class="p">(</span><span class="s2">"The Rails environment is running in production mode!"</span><span class="p">)</span> <span class="k">if</span> <span class="no">Rails</span><span class="p">.</span><span class="nf">env</span><span class="p">.</span><span class="nf">production?</span>

<span class="nb">require</span> <span class="s2">"rspec/rails"</span>
<span class="nb">require</span> <span class="s2">"factory_bot_rails"</span>
<span class="nb">require</span> <span class="s2">"shoulda/matchers"</span>

<span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">.</span><span class="nf">maintain_test_schema!</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">configure</span> <span class="k">do</span> <span class="o">|</span><span class="n">config</span><span class="o">|</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">fixture_paths</span> <span class="o">=</span> <span class="p">[</span><span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"spec/fixtures"</span><span class="p">)]</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">use_transactional_fixtures</span> <span class="o">=</span> <span class="kp">true</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">infer_spec_type_from_file_location!</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">filter_rails_from_backtrace!</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">include</span> <span class="no">FactoryBot</span><span class="o">::</span><span class="no">Syntax</span><span class="o">::</span><span class="no">Methods</span>
<span class="k">end</span>

<span class="no">Shoulda</span><span class="o">::</span><span class="no">Matchers</span><span class="p">.</span><span class="nf">configure</span> <span class="k">do</span> <span class="o">|</span><span class="n">config</span><span class="o">|</span>
  <span class="n">config</span><span class="p">.</span><span class="nf">integrate</span> <span class="k">do</span> <span class="o">|</span><span class="n">with</span><span class="o">|</span>
    <span class="n">with</span><span class="p">.</span><span class="nf">test_framework</span> <span class="ss">:rspec</span>
    <span class="n">with</span><span class="p">.</span><span class="nf">library</span> <span class="ss">:rails</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The key line: <code>require File.expand_path("../test/dummy/config/environment", __dir__)</code>. This boots the dummy app, not the host application. The dummy app loads the engine and nothing else.</p>

<h3 id="the-minimal-dummy-app">The minimal dummy app</h3>

<p>The dummy app should contain only what the engine needs to test its integration points. For a billing engine with a <code>Billable</code> concern, the dummy app needs:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/test/dummy/app/models/user.rb</span>

<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/test/dummy/db/migrate/20260101000000_create_users.rb</span>

<span class="k">class</span> <span class="nc">CreateUsers</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">create_table</span> <span class="ss">:users</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">string</span> <span class="ss">:email</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">timestamps</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>That’s it. No authentication. No notification preferences. No team memberships. The dummy <code>User</code> has an email and the <code>Billable</code> concern. Everything the engine needs to test, nothing it doesn’t.</p>

<h3 id="running-engine-tests">Running engine tests</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd </span>engines/billing
bundle <span class="nb">exec </span>rails db:prepare
bundle <span class="nb">exec </span>rspec
</code></pre></div></div>

<p>This runs in seconds, not minutes. The dummy app boots in under a second. The test suite runs only billing tests against billing code. There’s no notification system to load, no admin panel to configure, no reporting module to initialise.</p>

<hr />

<h2 id="writing-effective-engine-specs">Writing Effective Engine Specs</h2>

<h3 id="model-specs">Model specs</h3>

<p>Test the engine’s models thoroughly. These are your foundation:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/models/billing/invoice_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span> <span class="k">do</span>
  <span class="n">describe</span> <span class="s2">"validations"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="p">{</span> <span class="n">is_expected</span><span class="p">.</span><span class="nf">to</span> <span class="n">validate_presence_of</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">)</span> <span class="p">}</span>
    <span class="n">it</span> <span class="p">{</span> <span class="n">is_expected</span><span class="p">.</span><span class="nf">to</span> <span class="n">validate_numericality_of</span><span class="p">(</span><span class="ss">:amount_cents</span><span class="p">).</span><span class="nf">is_greater_than</span><span class="p">(</span><span class="mi">0</span><span class="p">)</span> <span class="p">}</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"associations"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="p">{</span> <span class="n">is_expected</span><span class="p">.</span><span class="nf">to</span> <span class="n">belong_to</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">).</span><span class="nf">class_name</span><span class="p">(</span><span class="s2">"Billing::Subscription"</span><span class="p">)</span> <span class="p">}</span>
    <span class="n">it</span> <span class="p">{</span> <span class="n">is_expected</span><span class="p">.</span><span class="nf">to</span> <span class="n">have_many</span><span class="p">(</span><span class="ss">:line_items</span><span class="p">).</span><span class="nf">class_name</span><span class="p">(</span><span class="s2">"Billing::LineItem"</span><span class="p">)</span> <span class="p">}</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"#total"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"sums line item amounts"</span> <span class="k">do</span>
      <span class="n">invoice</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:invoice</span><span class="p">)</span>
      <span class="n">create</span><span class="p">(</span><span class="ss">:line_item</span><span class="p">,</span> <span class="ss">invoice: </span><span class="n">invoice</span><span class="p">,</span> <span class="ss">amount_cents: </span><span class="mi">1000</span><span class="p">)</span>
      <span class="n">create</span><span class="p">(</span><span class="ss">:line_item</span><span class="p">,</span> <span class="ss">invoice: </span><span class="n">invoice</span><span class="p">,</span> <span class="ss">amount_cents: </span><span class="mi">2500</span><span class="p">)</span>

      <span class="n">expect</span><span class="p">(</span><span class="n">invoice</span><span class="p">.</span><span class="nf">total</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="no">Money</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="mi">3500</span><span class="p">,</span> <span class="s2">"GBP"</span><span class="p">))</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"#overdue?"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"returns true when past due date and unpaid"</span> <span class="k">do</span>
      <span class="n">invoice</span> <span class="o">=</span> <span class="n">build</span><span class="p">(</span><span class="ss">:invoice</span><span class="p">,</span> <span class="ss">due_date: </span><span class="mi">1</span><span class="p">.</span><span class="nf">day</span><span class="p">.</span><span class="nf">ago</span><span class="p">,</span> <span class="ss">paid_at: </span><span class="kp">nil</span><span class="p">)</span>
      <span class="n">expect</span><span class="p">(</span><span class="n">invoice</span><span class="p">).</span><span class="nf">to</span> <span class="n">be_overdue</span>
    <span class="k">end</span>

    <span class="n">it</span> <span class="s2">"returns false when paid"</span> <span class="k">do</span>
      <span class="n">invoice</span> <span class="o">=</span> <span class="n">build</span><span class="p">(</span><span class="ss">:invoice</span><span class="p">,</span> <span class="ss">due_date: </span><span class="mi">1</span><span class="p">.</span><span class="nf">day</span><span class="p">.</span><span class="nf">ago</span><span class="p">,</span> <span class="ss">paid_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span>
      <span class="n">expect</span><span class="p">(</span><span class="n">invoice</span><span class="p">).</span><span class="nf">not_to</span> <span class="n">be_overdue</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="concern-specs">Concern specs</h3>

<p>Test concerns against the dummy model:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/models/concerns/billing/billable_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span> <span class="k">do</span>
  <span class="c1"># User in the dummy app includes Billing::Billable</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">describe</span> <span class="s2">"#current_subscription"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"returns the most recent active subscription"</span> <span class="k">do</span>
      <span class="n">_old</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">,</span> <span class="ss">status: :active</span><span class="p">,</span> <span class="ss">created_at: </span><span class="mi">1</span><span class="p">.</span><span class="nf">month</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>
      <span class="n">current</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">,</span> <span class="ss">status: :active</span><span class="p">,</span> <span class="ss">created_at: </span><span class="mi">1</span><span class="p">.</span><span class="nf">day</span><span class="p">.</span><span class="nf">ago</span><span class="p">)</span>

      <span class="n">expect</span><span class="p">(</span><span class="n">user</span><span class="p">.</span><span class="nf">current_subscription</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="n">current</span><span class="p">)</span>
    <span class="k">end</span>

    <span class="n">it</span> <span class="s2">"ignores cancelled subscriptions"</span> <span class="k">do</span>
      <span class="n">create</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">,</span> <span class="ss">status: :cancelled</span><span class="p">)</span>

      <span class="n">expect</span><span class="p">(</span><span class="n">user</span><span class="p">.</span><span class="nf">current_subscription</span><span class="p">).</span><span class="nf">to</span> <span class="n">be_nil</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="controller-specs-request-specs">Controller specs (request specs)</h3>

<p>For engines that mount routes, test them as request specs:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/requests/billing/invoices_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="s2">"Billing::Invoices"</span><span class="p">,</span> <span class="ss">type: :request</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">before</span> <span class="k">do</span>
    <span class="c1"># If the engine requires authentication, set it up in the dummy app</span>
    <span class="n">sign_in</span><span class="p">(</span><span class="n">user</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"GET /billing/invoices"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"returns the user's invoices"</span> <span class="k">do</span>
      <span class="n">create</span><span class="p">(</span><span class="ss">:invoice</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">)</span>

      <span class="n">get</span> <span class="n">billing</span><span class="p">.</span><span class="nf">invoices_path</span>

      <span class="n">expect</span><span class="p">(</span><span class="n">response</span><span class="p">).</span><span class="nf">to</span> <span class="n">have_http_status</span><span class="p">(</span><span class="ss">:ok</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="factories">Factories</h3>

<p>Engine factories should be self-contained:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/factories/billing/invoices.rb</span>

<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">define</span> <span class="k">do</span>
  <span class="n">factory</span> <span class="ss">:invoice</span><span class="p">,</span> <span class="ss">class: </span><span class="s2">"Billing::Invoice"</span> <span class="k">do</span>
    <span class="n">association</span> <span class="ss">:subscription</span><span class="p">,</span> <span class="ss">factory: :subscription</span>
    <span class="n">amount_cents</span> <span class="p">{</span> <span class="mi">2999</span> <span class="p">}</span>
    <span class="n">currency</span> <span class="p">{</span> <span class="s2">"GBP"</span> <span class="p">}</span>
    <span class="n">due_date</span> <span class="p">{</span> <span class="mi">30</span><span class="p">.</span><span class="nf">days</span><span class="p">.</span><span class="nf">from_now</span> <span class="p">}</span>
    <span class="n">issued_at</span> <span class="p">{</span> <span class="no">Time</span><span class="p">.</span><span class="nf">current</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/factories/billing/subscriptions.rb</span>

<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">define</span> <span class="k">do</span>
  <span class="n">factory</span> <span class="ss">:subscription</span><span class="p">,</span> <span class="ss">class: </span><span class="s2">"Billing::Subscription"</span> <span class="k">do</span>
    <span class="n">association</span> <span class="ss">:user</span>  <span class="c1"># Uses the dummy app's User factory</span>
    <span class="n">status</span> <span class="p">{</span> <span class="ss">:active</span> <span class="p">}</span>
    <span class="n">started_at</span> <span class="p">{</span> <span class="no">Time</span><span class="p">.</span><span class="nf">current</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/factories/users.rb</span>

<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">define</span> <span class="k">do</span>
  <span class="n">factory</span> <span class="ss">:user</span> <span class="k">do</span>
    <span class="n">sequence</span><span class="p">(</span><span class="ss">:email</span><span class="p">)</span> <span class="p">{</span> <span class="o">|</span><span class="n">n</span><span class="o">|</span> <span class="s2">"user</span><span class="si">#{</span><span class="n">n</span><span class="si">}</span><span class="s2">@example.com"</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Note the user factory lives in the engine’s spec directory, not the host app’s. It creates a dummy app <code>User</code>, not the host app’s full <code>User</code> with all its concerns.</p>

<h4 id="sharing-factories-across-engines">Sharing factories across engines</h4>

<p>When the host app runs integration tests, it needs factories from multiple engines. Configure Factory Bot to load them:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># spec/rails_helper.rb (host app)</span>

<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">definition_file_paths</span> <span class="o">=</span> <span class="p">[</span>
  <span class="no">Rails</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"spec/factories"</span><span class="p">),</span>
  <span class="no">Rails</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"engines/billing/spec/factories"</span><span class="p">),</span>
  <span class="no">Rails</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"engines/notifications/spec/factories"</span><span class="p">),</span>
  <span class="no">Rails</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"engines/core/spec/factories"</span><span class="p">)</span>
<span class="p">]</span>
<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">find_definitions</span>
</code></pre></div></div>

<p>The naming convention matters: prefix each factory name with the engine to avoid collisions. When both engines define a <code>:user</code> factory, only one wins. Either use distinct names (<code>:billing_user</code>, <code>:notifications_user</code>) or put the shared user factory in the core engine:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/core/spec/factories/users.rb</span>

<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">define</span> <span class="k">do</span>
  <span class="n">factory</span> <span class="ss">:user</span> <span class="k">do</span>
    <span class="n">sequence</span><span class="p">(</span><span class="ss">:email</span><span class="p">)</span> <span class="p">{</span> <span class="o">|</span><span class="n">n</span><span class="o">|</span> <span class="s2">"user</span><span class="si">#{</span><span class="n">n</span><span class="si">}</span><span class="s2">@example.com"</span> <span class="p">}</span>
    <span class="nb">name</span> <span class="p">{</span> <span class="s2">"Test User"</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The core engine becomes the single source of truth for shared factories, just as it is for shared concerns. Each domain engine’s factories reference <code>:user</code> and get the same consistent definition.</p>

<h4 id="simplecov-across-engines">SimpleCov across engines</h4>

<p>When each engine has its own test suite, you need merged code coverage reporting. SimpleCov supports this via <code>command_name</code> and <code>collate</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/spec_helper.rb</span>

<span class="nb">require</span> <span class="s2">"simplecov"</span>
<span class="no">SimpleCov</span><span class="p">.</span><span class="nf">command_name</span> <span class="s2">"billing"</span>
<span class="no">SimpleCov</span><span class="p">.</span><span class="nf">start</span> <span class="s2">"rails"</span> <span class="k">do</span>
  <span class="n">add_filter</span> <span class="s2">"/spec/"</span>
  <span class="n">add_filter</span> <span class="s2">"/test/"</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/notifications/spec/spec_helper.rb</span>

<span class="nb">require</span> <span class="s2">"simplecov"</span>
<span class="no">SimpleCov</span><span class="p">.</span><span class="nf">command_name</span> <span class="s2">"notifications"</span>
<span class="no">SimpleCov</span><span class="p">.</span><span class="nf">start</span> <span class="s2">"rails"</span> <span class="k">do</span>
  <span class="n">add_filter</span> <span class="s2">"/spec/"</span>
  <span class="n">add_filter</span> <span class="s2">"/test/"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>In CI, after all test suites finish, collate the results:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># script/collate_coverage.rb</span>

<span class="nb">require</span> <span class="s2">"simplecov"</span>

<span class="no">SimpleCov</span><span class="p">.</span><span class="nf">collate</span> <span class="no">Dir</span><span class="p">[</span><span class="s2">"engines/*/coverage/.resultset.json"</span><span class="p">],</span> <span class="s2">"rails"</span> <span class="k">do</span>
  <span class="n">add_group</span> <span class="s2">"Billing"</span><span class="p">,</span> <span class="s2">"engines/billing"</span>
  <span class="n">add_group</span> <span class="s2">"Notifications"</span><span class="p">,</span> <span class="s2">"engines/notifications"</span>
  <span class="n">add_group</span> <span class="s2">"Host App"</span><span class="p">,</span> <span class="s2">"app"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This gives you a single coverage report across all engines, with per-engine grouping. Without collation, each engine reports its own coverage in isolation, and the host app’s integration tests appear to have zero engine coverage.</p>

<h4 id="system-tests-with-capybara">System tests with Capybara</h4>

<p>System tests (Capybara) exercise the full stack – browser, routes, controllers, views. For engine-based applications, you have two options:</p>

<p><strong>Option A: System tests in the host app (recommended)</strong></p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># spec/system/billing/invoice_workflow_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="s2">"Invoice workflow"</span><span class="p">,</span> <span class="ss">type: :system</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">before</span> <span class="p">{</span> <span class="n">sign_in</span><span class="p">(</span><span class="n">user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">it</span> <span class="s2">"displays the invoice list"</span> <span class="k">do</span>
    <span class="n">create</span><span class="p">(</span><span class="ss">:invoice</span><span class="p">,</span> <span class="ss">user_id: </span><span class="n">user</span><span class="p">.</span><span class="nf">id</span><span class="p">)</span>
    <span class="n">visit</span> <span class="n">billing</span><span class="p">.</span><span class="nf">invoices_path</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">page</span><span class="p">).</span><span class="nf">to</span> <span class="n">have_content</span><span class="p">(</span><span class="s2">"Invoices"</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Host-level system tests see all engines mounted, use real routes, and test the full user flow. This is where cross-engine workflows belong.</p>

<p><strong>Option B: System tests in the engine’s dummy app</strong></p>

<p>For engines with complex UI (dashboards, multi-step forms), it can be worth adding system tests inside the engine’s test suite. The dummy app acts as a minimal host, and Capybara exercises the engine’s views in isolation. This is slower to set up but keeps the engine’s test suite self-contained.</p>

<p>Most teams find that host-level system tests are sufficient. Add engine-level system tests only when the engine’s UI is complex enough to justify the setup cost.</p>

<h4 id="a-note-on-databasecleaner">A note on DatabaseCleaner</h4>

<p>Since Rails 5.1, the test framework shares database connections across threads, which means transactional tests work correctly with Capybara system tests out of the box. You do <strong>not</strong> need DatabaseCleaner for this purpose in modern Rails.</p>

<p>If you’re on an older Rails version or using a non-standard threading setup, DatabaseCleaner with truncation may still be necessary. But for Rails 7+ applications (which this book targets), the default <code>use_transactional_tests = true</code> is sufficient for system tests, including those exercising engine views.</p>

<hr />

<h2 id="contract-tests-between-engines">Contract Tests Between Engines</h2>

<p>Contract tests verify that the integration points between engines work correctly. They’re not testing business logic – they’re testing that the interfaces engines expose are honoured.</p>

<h3 id="what-to-test">What to test</h3>

<p>When the billing engine exposes a <code>Billable</code> concern, the contract is:</p>

<ul>
  <li>The including model must have an <code>id</code> column</li>
  <li>The including model must respond to an <code>email</code> method (if the engine sends emails)</li>
  <li>The concern adds <code>#current_subscription</code> and <code>#active_plan</code> methods</li>
</ul>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/contracts/billable_contract_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="s2">"Billable contract"</span> <span class="k">do</span>
  <span class="n">subject</span><span class="p">(</span><span class="ss">:billable</span><span class="p">)</span> <span class="p">{</span> <span class="no">User</span><span class="p">.</span><span class="nf">new</span> <span class="p">}</span>

  <span class="n">it</span> <span class="s2">"responds to current_subscription"</span> <span class="k">do</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">billable</span><span class="p">).</span><span class="nf">to</span> <span class="n">respond_to</span><span class="p">(</span><span class="ss">:current_subscription</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="n">it</span> <span class="s2">"responds to active_plan"</span> <span class="k">do</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">billable</span><span class="p">).</span><span class="nf">to</span> <span class="n">respond_to</span><span class="p">(</span><span class="ss">:active_plan</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="n">it</span> <span class="s2">"has an invoices association"</span> <span class="k">do</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">billable</span><span class="p">).</span><span class="nf">to</span> <span class="n">respond_to</span><span class="p">(</span><span class="ss">:invoices</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="n">it</span> <span class="s2">"has a subscriptions association"</span> <span class="k">do</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">billable</span><span class="p">).</span><span class="nf">to</span> <span class="n">respond_to</span><span class="p">(</span><span class="ss">:subscriptions</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>These tests are cheap and fast. They verify the shape of the interface, not the behaviour (that’s what the model and concern specs do).</p>

<p>Every engine concern gets a contract test. Here’s the same pattern applied to the documents engine from Chapter 9:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># spec/contracts/documentable_contract_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="s2">"Documentable contract"</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">it</span> <span class="s2">"adds document associations"</span> <span class="k">do</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">user</span><span class="p">).</span><span class="nf">to</span> <span class="n">respond_to</span><span class="p">(</span><span class="ss">:documents</span><span class="p">)</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">user</span><span class="p">).</span><span class="nf">to</span> <span class="n">respond_to</span><span class="p">(</span><span class="ss">:pending_signatures</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="n">it</span> <span class="s2">"provides document_quota method"</span> <span class="k">do</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">user</span><span class="p">.</span><span class="nf">document_quota</span><span class="p">).</span><span class="nf">to</span> <span class="n">be_a</span><span class="p">(</span><span class="no">Integer</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Every engine concern gets a contract test. When the documents engine changes its interface, these tests catch it before production does.</p>

<h3 id="when-contract-tests-catch-real-bugs">When contract tests catch real bugs</h3>

<p>Contract tests shine during upgrades. Let’s trace through a real scenario.</p>

<p>You’re running billing engine v0.3.0. The <code>Billable</code> concern exposes <code>#active_plan</code>, and your host app uses it in the dashboard:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">&lt;%# app/views/dashboard/show.html.erb (host app) %&gt;</span>
<span class="nt">&lt;h2&gt;</span>Your plan: <span class="cp">&lt;%=</span> <span class="n">current_user</span><span class="p">.</span><span class="nf">active_plan</span><span class="p">.</span><span class="nf">name</span> <span class="cp">%&gt;</span><span class="nt">&lt;/h2&gt;</span>
</code></pre></div></div>

<p>In v0.4.0, the billing engine team renames <code>active_plan</code> to <code>current_plan</code> – a better name, but a breaking change. You upgrade the gem, run <code>bundle update</code>, and your contract test fails immediately:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/contracts/billable_contract_spec.rb</span>

<span class="n">it</span> <span class="s2">"responds to active_plan"</span> <span class="k">do</span>
  <span class="n">expect</span><span class="p">(</span><span class="n">billable</span><span class="p">).</span><span class="nf">to</span> <span class="n">respond_to</span><span class="p">(</span><span class="ss">:active_plan</span><span class="p">)</span>  <span class="c1"># FAILS — method was renamed</span>
<span class="k">end</span>
</code></pre></div></div>

<pre><code>Failures:

  1) Billable contract responds to active_plan
     Failure/Error: expect(billable).to respond_to(:active_plan)
       expected #&lt;User id: nil&gt; to respond to :active_plan
</code></pre>

<p>Without this contract test, the failure wouldn’t surface until a user loads the dashboard and hits a <code>NoMethodError</code>. With it, you catch the break before merging.</p>

<p>The fix is straightforward. Update the contract test to match the new interface:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/contracts/billable_contract_spec.rb</span>

<span class="n">it</span> <span class="s2">"responds to current_plan"</span> <span class="k">do</span>
  <span class="n">expect</span><span class="p">(</span><span class="n">billable</span><span class="p">).</span><span class="nf">to</span> <span class="n">respond_to</span><span class="p">(</span><span class="ss">:current_plan</span><span class="p">)</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Then update the host app code that depended on the old name:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">&lt;%# app/views/dashboard/show.html.erb (host app) %&gt;</span>
<span class="nt">&lt;h2&gt;</span>Your plan: <span class="cp">&lt;%=</span> <span class="n">current_user</span><span class="p">.</span><span class="nf">current_plan</span><span class="p">.</span><span class="nf">name</span> <span class="cp">%&gt;</span><span class="nt">&lt;/h2&gt;</span>
</code></pre></div></div>

<p>This is a trivial example, but the pattern scales. When an engine renames a method, changes a return type, removes a callback, or restructures an association, the contract test fails at the boundary – telling you exactly which interface changed and which host app code needs updating. The alternative is discovering it in production when a user triggers the affected code path.</p>

<p>The contract test isn’t testing behaviour. It’s testing that the interface you depend on still exists with the shape you expect. The engine’s own specs verify that <code>current_plan</code> returns the right data. The contract test verifies that the method exists on the model that includes the concern. Two different questions, both essential.</p>

<hr />

<h2 id="integration-tests-at-the-host-level">Integration Tests at the Host Level</h2>

<p>Integration tests run at the host application level with all engines mounted. They test the complete request cycle: routing, authentication, engine controller, cross-engine data, view rendering.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># spec/integration/billing_flow_spec.rb (host app)</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="s2">"Billing flow"</span><span class="p">,</span> <span class="ss">type: :request</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:user</span><span class="p">,</span> <span class="ss">:with_subscription</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">before</span> <span class="p">{</span> <span class="n">sign_in</span><span class="p">(</span><span class="n">user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">it</span> <span class="s2">"displays the user's invoices"</span> <span class="k">do</span>
    <span class="n">invoice</span> <span class="o">=</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span>
      <span class="ss">subscription: </span><span class="n">user</span><span class="p">.</span><span class="nf">current_subscription</span><span class="p">,</span>
      <span class="ss">amount_cents: </span><span class="mi">2999</span><span class="p">,</span>
      <span class="ss">currency: </span><span class="s2">"GBP"</span><span class="p">,</span>
      <span class="ss">due_date: </span><span class="mi">30</span><span class="p">.</span><span class="nf">days</span><span class="p">.</span><span class="nf">from_now</span><span class="p">,</span>
      <span class="ss">issued_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span>
    <span class="p">)</span>

    <span class="n">get</span> <span class="n">billing</span><span class="p">.</span><span class="nf">invoices_path</span>

    <span class="n">expect</span><span class="p">(</span><span class="n">response</span><span class="p">).</span><span class="nf">to</span> <span class="n">have_http_status</span><span class="p">(</span><span class="ss">:ok</span><span class="p">)</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">response</span><span class="p">.</span><span class="nf">body</span><span class="p">).</span><span class="nf">to</span> <span class="kp">include</span><span class="p">(</span><span class="s2">"29.99"</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="n">it</span> <span class="s2">"sends a notification when an invoice is created"</span> <span class="k">do</span>
    <span class="n">expect</span> <span class="p">{</span>
      <span class="no">Billing</span><span class="o">::</span><span class="no">InvoiceGenerator</span><span class="p">.</span><span class="nf">call</span><span class="p">(</span><span class="ss">subscription: </span><span class="n">user</span><span class="p">.</span><span class="nf">current_subscription</span><span class="p">)</span>
    <span class="p">}.</span><span class="nf">to</span> <span class="n">change</span> <span class="p">{</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">count</span> <span class="p">}.</span><span class="nf">by</span><span class="p">(</span><span class="mi">1</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The second test is particularly important. It verifies cross-engine communication: creating an invoice in the billing engine triggers a notification in the notification engine. This can’t be tested in either engine’s isolated tests – it requires both engines running together.</p>

<p>The same pattern applies to any cross-engine workflow. Here’s a document signature request triggering a notification – the documents engine from Chapter 9 talking to the notifications engine:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># spec/integration/document_signature_flow_spec.rb (host app)</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="s2">"Document signature flow"</span><span class="p">,</span> <span class="ss">type: :request</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">before</span> <span class="p">{</span> <span class="n">sign_in</span><span class="p">(</span><span class="n">user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">it</span> <span class="s2">"notifies signers when a document requires signature"</span> <span class="k">do</span>
    <span class="n">document</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:document</span><span class="p">,</span> <span class="ss">owner: </span><span class="n">user</span><span class="p">)</span>

    <span class="n">post</span> <span class="n">documents</span><span class="p">.</span><span class="nf">request_signature_path</span><span class="p">(</span><span class="n">document</span><span class="p">),</span>
         <span class="ss">params: </span><span class="p">{</span> <span class="ss">signer_email: </span><span class="s2">"signer@example.com"</span> <span class="p">}</span>

    <span class="n">expect</span><span class="p">(</span><span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">last</span><span class="p">.</span><span class="nf">body</span><span class="p">).</span><span class="nf">to</span> <span class="kp">include</span><span class="p">(</span><span class="s2">"signature requested"</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This shows the cross-engine pattern generalises beyond billing. Any engine that triggers side effects in another engine needs an integration test at the host level to verify the two engines are wired together correctly.</p>

<p>Keep integration tests focused on <strong>cross-engine workflows</strong> and <strong>end-to-end scenarios</strong>. Don’t duplicate the engine’s unit tests at the integration level. If the billing engine tests <code>Invoice#total</code>, don’t test it again in integration. Test the things that only work when the engines are assembled.</p>

<hr />

<h2 id="selective-test-execution">Selective Test Execution</h2>

<p>As your engine count grows, running every engine’s tests on every commit becomes wasteful. If you changed code in the billing engine, you don’t need to re-run the notification engine’s tests.</p>

<h3 id="using-the-dependency-graph">Using the dependency graph</h3>

<p>Your engines have declared dependencies (in their gemspecs). Use this graph to determine which tests to run:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">#!/bin/bash</span>
<span class="c"># scripts/run_affected_tests.sh</span>

<span class="c"># Find which engines have changed files</span>
<span class="nv">CHANGED_ENGINES</span><span class="o">=</span><span class="si">$(</span>git diff <span class="nt">--name-only</span> origin/main...HEAD | <span class="se">\</span>
  <span class="nb">grep</span> <span class="s2">"^engines/"</span> | <span class="se">\</span>
  <span class="nb">cut</span> <span class="nt">-d</span><span class="s1">'/'</span> <span class="nt">-f2</span> | <span class="se">\</span>
  <span class="nb">sort</span> <span class="nt">-u</span><span class="si">)</span>

<span class="k">if</span> <span class="o">[</span> <span class="nt">-z</span> <span class="s2">"</span><span class="nv">$CHANGED_ENGINES</span><span class="s2">"</span> <span class="o">]</span><span class="p">;</span> <span class="k">then
  </span><span class="nb">echo</span> <span class="s2">"No engine changes detected. Running host app tests only."</span>
  bundle <span class="nb">exec </span>rspec spec/
  <span class="nb">exit</span> <span class="nv">$?</span>
<span class="k">fi

</span><span class="nb">echo</span> <span class="s2">"Changed engines: </span><span class="nv">$CHANGED_ENGINES</span><span class="s2">"</span>

<span class="c"># Run tests for changed engines</span>
<span class="k">for </span>engine <span class="k">in</span> <span class="nv">$CHANGED_ENGINES</span><span class="p">;</span> <span class="k">do
  </span><span class="nb">echo</span> <span class="s2">"Running tests for </span><span class="nv">$engine</span><span class="s2"> engine..."</span>
  <span class="o">(</span><span class="nb">cd</span> <span class="s2">"engines/</span><span class="nv">$engine</span><span class="s2">"</span> <span class="o">&amp;&amp;</span> bundle <span class="nb">exec </span>rspec<span class="o">)</span>
<span class="k">done</span>

<span class="c"># Always run host app integration tests when any engine changes</span>
<span class="nb">echo</span> <span class="s2">"Running integration tests..."</span>
bundle <span class="nb">exec </span>rspec spec/integration/
</code></pre></div></div>

<h3 id="ci-with-matrix-builds">CI with matrix builds</h3>

<p>GitHub Actions can run engine tests in parallel using a matrix strategy:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># .github/workflows/ci.yml</span>

<span class="na">name</span><span class="pi">:</span> <span class="s">CI</span>

<span class="na">on</span><span class="pi">:</span>
  <span class="na">push</span><span class="pi">:</span>
    <span class="na">branches</span><span class="pi">:</span> <span class="pi">[</span><span class="nv">main</span><span class="pi">]</span>
  <span class="na">pull_request</span><span class="pi">:</span>

<span class="na">jobs</span><span class="pi">:</span>
  <span class="na">detect-changes</span><span class="pi">:</span>
    <span class="na">runs-on</span><span class="pi">:</span> <span class="s">ubuntu-latest</span>
    <span class="na">outputs</span><span class="pi">:</span>
      <span class="na">engines</span><span class="pi">:</span> <span class="s">${{ steps.changes.outputs.engines }}</span>
    <span class="na">steps</span><span class="pi">:</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">actions/checkout@v4</span>
        <span class="na">with</span><span class="pi">:</span>
          <span class="na">fetch-depth</span><span class="pi">:</span> <span class="m">0</span>
      <span class="pi">-</span> <span class="na">id</span><span class="pi">:</span> <span class="s">changes</span>
        <span class="na">run</span><span class="pi">:</span> <span class="pi">|</span>
          <span class="s">ENGINES=$(git diff --name-only origin/main...HEAD | \</span>
            <span class="s">grep "^engines/" | cut -d'/' -f2 | sort -u | \</span>
            <span class="s">jq -R -s -c 'split("\n") | map(select(length &gt; 0))')</span>
          <span class="s">echo "engines=$ENGINES" &gt;&gt; $GITHUB_OUTPUT</span>

  <span class="na">engine-tests</span><span class="pi">:</span>
    <span class="na">needs</span><span class="pi">:</span> <span class="s">detect-changes</span>
    <span class="na">if</span><span class="pi">:</span> <span class="s">needs.detect-changes.outputs.engines != '[]'</span>
    <span class="na">strategy</span><span class="pi">:</span>
      <span class="na">matrix</span><span class="pi">:</span>
        <span class="na">engine</span><span class="pi">:</span> <span class="s">${{ fromJson(needs.detect-changes.outputs.engines) }}</span>
    <span class="na">runs-on</span><span class="pi">:</span> <span class="s">ubuntu-latest</span>
    <span class="na">services</span><span class="pi">:</span>
      <span class="na">postgres</span><span class="pi">:</span>
        <span class="na">image</span><span class="pi">:</span> <span class="s">postgres:16</span>
        <span class="na">env</span><span class="pi">:</span>
          <span class="na">POSTGRES_PASSWORD</span><span class="pi">:</span> <span class="s">password</span>
        <span class="na">ports</span><span class="pi">:</span> <span class="pi">[</span><span class="s2">"</span><span class="s">5432:5432"</span><span class="pi">]</span>
    <span class="na">steps</span><span class="pi">:</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">actions/checkout@v4</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">ruby/setup-ruby@v1</span>
        <span class="na">with</span><span class="pi">:</span>
          <span class="na">bundler-cache</span><span class="pi">:</span> <span class="kc">true</span>
          <span class="na">working-directory</span><span class="pi">:</span> <span class="s">engines/${{ matrix.engine }}</span>
      <span class="pi">-</span> <span class="na">name</span><span class="pi">:</span> <span class="s">Prepare database</span>
        <span class="na">working-directory</span><span class="pi">:</span> <span class="s">engines/${{ matrix.engine }}</span>
        <span class="na">run</span><span class="pi">:</span> <span class="s">bundle exec rails db:prepare</span>
        <span class="na">env</span><span class="pi">:</span>
          <span class="na">DATABASE_URL</span><span class="pi">:</span> <span class="s">postgres://postgres:password@localhost:5432/test</span>
      <span class="pi">-</span> <span class="na">name</span><span class="pi">:</span> <span class="s">Run tests</span>
        <span class="na">working-directory</span><span class="pi">:</span> <span class="s">engines/${{ matrix.engine }}</span>
        <span class="na">run</span><span class="pi">:</span> <span class="s">bundle exec rspec</span>
        <span class="na">env</span><span class="pi">:</span>
          <span class="na">DATABASE_URL</span><span class="pi">:</span> <span class="s">postgres://postgres:password@localhost:5432/test</span>

  <span class="na">integration-tests</span><span class="pi">:</span>
    <span class="na">runs-on</span><span class="pi">:</span> <span class="s">ubuntu-latest</span>
    <span class="na">services</span><span class="pi">:</span>
      <span class="na">postgres</span><span class="pi">:</span>
        <span class="na">image</span><span class="pi">:</span> <span class="s">postgres:16</span>
        <span class="na">env</span><span class="pi">:</span>
          <span class="na">POSTGRES_PASSWORD</span><span class="pi">:</span> <span class="s">password</span>
        <span class="na">ports</span><span class="pi">:</span> <span class="pi">[</span><span class="s2">"</span><span class="s">5432:5432"</span><span class="pi">]</span>
    <span class="na">steps</span><span class="pi">:</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">actions/checkout@v4</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">ruby/setup-ruby@v1</span>
        <span class="na">with</span><span class="pi">:</span>
          <span class="na">bundler-cache</span><span class="pi">:</span> <span class="kc">true</span>
      <span class="pi">-</span> <span class="na">name</span><span class="pi">:</span> <span class="s">Prepare database</span>
        <span class="na">run</span><span class="pi">:</span> <span class="s">bundle exec rails db:prepare</span>
        <span class="na">env</span><span class="pi">:</span>
          <span class="na">DATABASE_URL</span><span class="pi">:</span> <span class="s">postgres://postgres:password@localhost:5432/test</span>
      <span class="pi">-</span> <span class="na">name</span><span class="pi">:</span> <span class="s">Run integration tests</span>
        <span class="na">run</span><span class="pi">:</span> <span class="s">bundle exec rspec spec/integration/</span>
        <span class="na">env</span><span class="pi">:</span>
          <span class="na">DATABASE_URL</span><span class="pi">:</span> <span class="s">postgres://postgres:password@localhost:5432/test</span>
</code></pre></div></div>

<p>Changed engines run their tests in parallel. Integration tests always run. Unchanged engines are skipped entirely.</p>

<div class="diagram"><img src="/img/books/modular-rails/f1ed51a4a0a36e1e2f7b38a2c0da1d8560248d5518586d9a62de0b3d8fdc3b9a.svg" alt="Mermaid diagram: Detect&lt;br/&gt;changed engines"></div>

<p>The detect step identifies which engines changed. Engine test jobs run in parallel (matrix strategy). Integration tests run last, gating the final merge.</p>

<h3 id="change-impact-analysis">Change-Impact Analysis</h3>

<p>Running only the changed engine’s tests is a good start, but it has a blind spot: tests in <em>other</em> engines or the host app that exercise the changed code through a concern or event interface. Change <code>engines/billing/app/models/billing/invoice.rb</code> and you’ll re-run the billing engine’s specs – but what about <code>spec/integration/checkout_flow_spec.rb</code> in the host app that creates invoices through the <code>Billable</code> concern?</p>

<p>Change-impact analysis closes the gap. Tools like <a href="https://github.com/toptal/crystalball">Crystalball</a> build an execution map – a record of which source files are touched by which test files. When a file changes, the tool consults the map and returns only the tests that actually need to run.</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># .crystalball.yml</span>
<span class="na">execution_map_path</span><span class="pi">:</span> <span class="s">tmp/crystalball_data.yml</span>
<span class="na">map_expiration_period</span><span class="pi">:</span> <span class="m">7</span>
<span class="na">strategies</span><span class="pi">:</span>
  <span class="pi">-</span> <span class="na">class</span><span class="pi">:</span> <span class="s">Crystalball::MapGenerator::CoverageStrategy</span>
  <span class="pi">-</span> <span class="na">class</span><span class="pi">:</span> <span class="s">Crystalball::MapGenerator::ActionViewStrategy</span>
</code></pre></div></div>

<p>Generate the execution map during a full test run (typically on the main branch nightly, or as a periodic CI job). Then use the map to predict the minimal test set for a given diff:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In CI: generate the prediction for the current branch</span>
<span class="n">prediction</span> <span class="o">=</span> <span class="no">Crystalball</span><span class="o">::</span><span class="no">RSpec</span><span class="o">::</span><span class="no">PredictionBuilder</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
  <span class="ss">map: </span><span class="no">Crystalball</span><span class="o">::</span><span class="no">MapStorage</span><span class="o">::</span><span class="no">YAMLStorage</span><span class="p">.</span><span class="nf">load</span><span class="p">(</span><span class="s2">"tmp/crystalball_data.yml"</span><span class="p">),</span>
  <span class="ss">from: </span><span class="no">ENV</span><span class="p">[</span><span class="s2">"CI_MERGE_REQUEST_DIFF_BASE_SHA"</span><span class="p">],</span>
  <span class="ss">to: </span><span class="s2">"HEAD"</span>
<span class="p">).</span><span class="nf">prediction</span>
</code></pre></div></div>

<p>Changed <code>engines/billing/app/models/billing/invoice.rb</code>? Crystalball knows that <code>spec/integration/checkout_flow_spec.rb</code> in the host app exercises that model through the <code>Billable</code> concern, and includes it in the run. You get the safety of a full suite with the speed of selective execution.</p>

<p>This works alongside the engine-based selective execution above – they’re complementary approaches. The dependency-graph script gives you fast, coarse-grained selection (run this engine’s tests). Crystalball gives you precise, fine-grained selection (run these specific test files across any engine or the host app). Use both: the script for local development, Crystalball for CI.</p>

<hr />

<h2 id="why-your-test-suite-gets-faster">Why Your Test Suite Gets Faster</h2>

<p>The speed improvement isn’t magic. It’s arithmetic.</p>

<p><strong>Before engines:</strong> One application, one test suite. Every test loads the entire app. Boot time: 15 seconds. Test execution: 180 seconds. Total: 195 seconds, and it grows with every model you add.</p>

<p><strong>After engines (5 engines):</strong> Each engine’s test suite loads only that engine’s code. Boot time per engine: 2 seconds. Test execution per engine: 20-40 seconds. Integration tests: 60 seconds.</p>

<p>Running all engine tests sequentially: 5 × 30 seconds + 60 seconds = 210 seconds. Not faster.</p>

<p>Running engine tests in parallel (CI matrix or <code>parallel_tests</code>): max(30, 30, 30, 30, 30) + 60 = 90 seconds. Much faster.</p>

<p>Running only the changed engine’s tests: 30 + 60 = 90 seconds on a change to one engine. Faster still.</p>

<p>The real win isn’t even the CI time. It’s the <strong>local development feedback loop</strong>. When you’re working in the billing engine, you run <code>cd engines/billing &amp;&amp; bundle exec rspec</code>. Two seconds to boot, twenty seconds to run. You get feedback in under thirty seconds instead of three minutes. That’s the difference between TDD feeling natural and TDD feeling like a chore.</p>

<hr />

<h2 id="local-ci-with-binci">Local CI with <code>bin/ci</code></h2>

<p>Rails 8.1 introduced a local CI runner. Configure it to test your modular architecture:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/ci.rb</span>

<span class="no">CI</span><span class="p">.</span><span class="nf">run</span> <span class="k">do</span>
  <span class="n">step</span> <span class="s2">"Lint"</span><span class="p">,</span> <span class="s2">"bundle exec rubocop"</span>

  <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"engines/*/"</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">engine_path</span><span class="o">|</span>
    <span class="n">engine_name</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">basename</span><span class="p">(</span><span class="n">engine_path</span><span class="p">)</span>
    <span class="n">step</span> <span class="s2">"</span><span class="si">#{</span><span class="n">engine_name</span><span class="si">}</span><span class="s2"> engine tests"</span><span class="p">,</span>
         <span class="s2">"cd </span><span class="si">#{</span><span class="n">engine_path</span><span class="si">}</span><span class="s2"> &amp;&amp; bundle exec rails db:prepare &amp;&amp; bundle exec rspec"</span>
  <span class="k">end</span>

  <span class="n">step</span> <span class="s2">"Integration tests"</span><span class="p">,</span> <span class="s2">"bundle exec rspec spec/integration/"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Run with <code>bin/ci</code>. This gives you the same confidence as the CI pipeline without pushing and waiting.</p>

<hr />

<h2 id="enforcing-boundaries-with-custom-cops">Enforcing Boundaries with Custom Cops</h2>

<p>CI tests catch boundary violations at merge time. Custom RuboCop cops catch them at write time – in your editor, before you even save the file.</p>

<p>A fitness function (Chapter 3) runs in CI and tells you the boundary is eroding. A cop runs in your editor and prevents the erosion from happening. Both are useful. Together, they’re a force multiplier.</p>

<h3 id="cross-engine-model-access">Cross-engine model access</h3>

<p>The most common boundary violation is reaching into another engine’s namespace to use its models directly. This cop flags it:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># lib/cops/no_cross_engine_model_access.rb</span>
<span class="k">module</span> <span class="nn">RuboCop</span>
  <span class="k">module</span> <span class="nn">Cop</span>
    <span class="k">module</span> <span class="nn">Architecture</span>
      <span class="k">class</span> <span class="nc">NoCrossEngineModelAccess</span> <span class="o">&lt;</span> <span class="no">Base</span>
        <span class="no">MSG</span> <span class="o">=</span> <span class="s2">"Direct access to %&lt;engine&gt;s models from outside the engine. "</span> <span class="p">\</span>
              <span class="s2">"Use the engine's public concern or event interface instead."</span>

        <span class="n">def_node_matcher</span> <span class="ss">:constant_reference</span><span class="p">,</span> <span class="o">&lt;&lt;~</span><span class="no">PATTERN</span><span class="sh">
          (const (const nil? {:Billing :Notifications :Documents}) _)
</span><span class="no">        PATTERN</span>

        <span class="k">def</span> <span class="nf">on_const</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>
          <span class="k">return</span> <span class="k">unless</span> <span class="n">constant_reference</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>
          <span class="k">return</span> <span class="k">if</span> <span class="n">inside_own_engine?</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>

          <span class="n">engine_name</span> <span class="o">=</span> <span class="n">node</span><span class="p">.</span><span class="nf">children</span><span class="p">.</span><span class="nf">first</span><span class="p">.</span><span class="nf">children</span><span class="p">.</span><span class="nf">last</span>
          <span class="n">add_offense</span><span class="p">(</span><span class="n">node</span><span class="p">,</span> <span class="ss">message: </span><span class="nb">format</span><span class="p">(</span><span class="no">MSG</span><span class="p">,</span> <span class="ss">engine: </span><span class="n">engine_name</span><span class="p">))</span>
        <span class="k">end</span>

        <span class="kp">private</span>

        <span class="k">def</span> <span class="nf">inside_own_engine?</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>
          <span class="n">file_path</span> <span class="o">=</span> <span class="n">processed_source</span><span class="p">.</span><span class="nf">file_path</span>
          <span class="n">engine_name</span> <span class="o">=</span> <span class="n">node</span><span class="p">.</span><span class="nf">children</span><span class="p">.</span><span class="nf">first</span><span class="p">.</span><span class="nf">children</span><span class="p">.</span><span class="nf">last</span><span class="p">.</span><span class="nf">to_s</span><span class="p">.</span><span class="nf">downcase</span>
          <span class="n">file_path</span><span class="p">.</span><span class="nf">include?</span><span class="p">(</span><span class="s2">"engines/</span><span class="si">#{</span><span class="n">engine_name</span><span class="si">}</span><span class="s2">/"</span><span class="p">)</span>
        <span class="k">end</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This cop flags <code>Billing::Invoice</code> references from outside the billing engine. It runs in your editor, not just in CI – catching boundary violations as you type. A developer writing <code>Billing::Invoice.where(user: current_user)</code> in a notifications controller gets an immediate warning: use the <code>Billable</code> concern or publish an event instead.</p>

<h3 id="other-architectural-cops-worth-writing">Other architectural cops worth writing</h3>

<ul>
  <li><strong>Known queue names</strong> – validates that <code>queue_as</code> declarations use queue names from an approved list. Prevents typos that silently route jobs to a queue nobody is processing.</li>
  <li><strong>Database migration comments</strong> – requires a comment on every <code>create_table</code> and <code>add_column</code> call. Builds schema documentation as a side effect of development, not as an afterthought.</li>
  <li><strong>Engine dependency direction</strong> – prevents lower-level engines (like <code>notifications</code>) from referencing higher-level ones (like <code>billing</code>). If your dependency graph says notifications shouldn’t know about billing, the cop enforces it on every keystroke.</li>
</ul>

<p>Custom cops are force multipliers. A fitness function runs in CI and tells you the boundary is eroding. A cop runs in your editor and prevents the erosion from happening.</p>

<h3 id="integrating-architectural-cops-into-ci">Integrating architectural cops into CI</h3>

<p>Add the custom cops to your <code>.rubocop.yml</code>:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># .rubocop.yml</span>

<span class="na">require</span><span class="pi">:</span>
  <span class="pi">-</span> <span class="s">./lib/cops/no_cross_engine_model_access</span>

<span class="na">Architecture/NoCrossEngineModelAccess</span><span class="pi">:</span>
  <span class="na">Enabled</span><span class="pi">:</span> <span class="kc">true</span>
  <span class="na">Exclude</span><span class="pi">:</span>
    <span class="pi">-</span> <span class="s2">"</span><span class="s">spec/**/*"</span>
    <span class="pi">-</span> <span class="s2">"</span><span class="s">test/**/*"</span>
</code></pre></div></div>

<p>In CI, run RuboCop as a separate step before the test suite. Architectural violations are cheaper to catch at lint time than at test time.</p>

<h3 id="packaging-cops-as-a-shared-gem">Packaging cops as a shared gem</h3>

<p>When you have several engines across multiple repositories, duplicating cop code becomes maintenance burden. Extract your architectural cops into a shared gem:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># rubocop-architecture/lib/rubocop/cop/architecture/no_cross_engine_model_access.rb</span>
<span class="c1"># (same cop code, packaged as a gem)</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Gemfile (each engine and the host app)</span>
<span class="n">gem</span> <span class="s2">"rubocop-architecture"</span><span class="p">,</span> <span class="ss">path: </span><span class="s2">"engines/rubocop-architecture"</span>
<span class="c1"># or from a private gem server:</span>
<span class="n">gem</span> <span class="s2">"rubocop-architecture"</span><span class="p">,</span> <span class="s2">"~&gt; 1.0"</span><span class="p">,</span> <span class="ss">source: </span><span class="s2">"https://gems.example.com"</span>
</code></pre></div></div>

<p>The cop definitions become a shared contract: here are the architectural rules everyone follows. Updating the gem updates the rules across all engines in one step.</p>

<hr />

<p><em>Testing is the feedback mechanism that keeps your architecture honest. When an engine’s tests are fast and focused, developers write more of them. When the CI pipeline catches boundary violations early, the boundaries stay clean. In the next chapter, we’ll look at how teams work within a modular monolith – the workflows, conventions, and developer experience that make this architecture sustainable day to day.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-12-data-ownership/">&larr; Data Ownership and the Database Question</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-14-team-workflow/">Team Workflow and Developer Experience &rarr;</a>
</nav>
{% endraw %}
