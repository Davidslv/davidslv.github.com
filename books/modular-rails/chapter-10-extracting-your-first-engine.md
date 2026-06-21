---
layout: book
book: modular_rails
title: "Extracting Your First Engine"
permalink: /books/modular-rails/chapter-10-extracting-your-first-engine/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-09-identifying-boundaries/">&larr; Identifying Boundaries in an Existing Application</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-11-managing-inter-engine-dependencies/">Managing Inter-Engine Dependencies &rarr;</a>
</nav>

<h1 id="chapter-10-extracting-your-first-engine">Chapter 10: Extracting Your First Engine</h1>

<p>You have a 200-model monolith and your CTO just said “modularise it.” Here’s where to start.</p>

<p>This chapter walks through a complete extraction of a billing domain from a Rails monolith into a mountable engine. We’ll cover every step: choosing the candidate, generating the engine, moving models with their migrations, rewiring controllers and routes, updating the host application, and verifying nothing broke. By the end, you’ll have a repeatable process you can apply to any domain.</p>

<hr />

<h2 id="choosing-the-right-candidate-for-extraction">Choosing the Right Candidate for Extraction</h2>

<p>Not every domain is equally suited for extraction. Your first engine should be:</p>

<p><strong>Cohesive.</strong> The files that make up the domain should change together frequently. If <code>Invoice</code>, <code>Subscription</code>, and <code>Plan</code> appear in the same commits 80% of the time, they belong in the same engine.</p>

<p><strong>Loosely coupled to the rest.</strong> The domain should have relatively few touchpoints with the host application. A domain that’s referenced by 50 other models is harder to extract than one referenced by 3.</p>

<p><strong>Non-trivial but not critical path.</strong> Don’t start with authentication or user management – too many things depend on them. Don’t start with a 2-model domain – too little benefit. Pick a domain with 5-15 models, a clear business purpose, and a manageable number of external references.</p>

<p><strong>Owned by a recognisable business function.</strong> Billing, notifications, reporting, document management – these map to real business capabilities and real stakeholder groups. If you can’t name who “owns” the domain, the boundary might not be in the right place.</p>

<h3 id="evaluating-a-candidate">Evaluating a candidate</h3>

<p>Before you touch any code, run two analyses:</p>

<p><strong>1. Co-change frequency.</strong> Which files change together?</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Find files that change together with invoice.rb</span>
git log <span class="nt">--all</span> <span class="nt">--pretty</span><span class="o">=</span>format: <span class="nt">--name-only</span> <span class="nt">--diff-filter</span><span class="o">=</span>ACRM <span class="nt">--</span> app/models/invoice.rb | <span class="se">\</span>
  <span class="nb">sort</span> | <span class="nb">uniq</span> <span class="nt">-c</span> | <span class="nb">sort</span> <span class="nt">-rn</span> | <span class="nb">head</span> <span class="nt">-20</span>
</code></pre></div></div>

<p>If <code>invoice.rb</code> almost always changes alongside <code>subscription.rb</code>, <code>plan.rb</code>, and <code>payment.rb</code>, those are your engine candidates.</p>

<p><strong>2. Incoming references.</strong> How many files outside the domain reference it?</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Count files that reference Invoice outside the billing domain</span>
<span class="nb">grep</span> <span class="nt">-rl</span> <span class="s2">"Invoice"</span> app/ <span class="nt">--include</span><span class="o">=</span><span class="s2">"*.rb"</span> | <span class="se">\</span>
  <span class="nb">grep</span> <span class="nt">-v</span> <span class="s2">"invoice</span><span class="se">\|</span><span class="s2">subscription</span><span class="se">\|</span><span class="s2">plan</span><span class="se">\|</span><span class="s2">payment</span><span class="se">\|</span><span class="s2">billing"</span> | <span class="nb">wc</span> <span class="nt">-l</span>
</code></pre></div></div>

<p>If the number is low (under 10), extraction will be straightforward. If it’s high (over 30), you’ll need to introduce integration concerns first to reduce the coupling before extracting.</p>

<hr />

<h2 id="the-strangler-fig-pattern-applied-to-rails">The Strangler Fig Pattern Applied to Rails</h2>

<p>Martin Fowler’s strangler fig pattern describes a migration strategy: rather than replacing a system in one big move, you grow a new system around the old one, gradually routing traffic to the new system until the old one can be removed.</p>

<p>Applied to engine extraction, this means:</p>

<ol>
  <li><strong>Namespace first.</strong> Move the classes into a module within the host app. This is safe, cheap, and reversible.</li>
  <li><strong>Generate the engine.</strong> Create the engine structure alongside the namespaced code.</li>
  <li><strong>Move code.</strong> Transfer files from the host app namespace into the engine.</li>
  <li><strong>Wire integration.</strong> Replace direct references with concern includes and configuration.</li>
  <li><strong>Remove the old code.</strong> Delete the now-empty namespace from the host app.</li>
</ol>

<p>Each step is a deployable unit. At every point, the application works. If a step causes problems, you revert that step, not three weeks of work.</p>

<div class="diagram"><img src="/img/books/modular-rails/c0c264ce07d6d819da452de5a34c59560c1e6bcbb78f09c27e8ace89e206db44.svg" alt="Mermaid diagram: Namespace&lt;br/&gt;within host app"></div>

<p>Each box is a deployable PR. If any step causes problems, revert that step alone.</p>

<hr />

<h2 id="step-1-namespace-within-the-host-app">Step 1: Namespace Within the Host App</h2>

<p>Before generating an engine, test the boundary by namespacing within the host app. This catches coupling issues early, when they’re cheap to fix.</p>

<p>Start with the models. Suppose your billing domain consists of:</p>

<pre><code>app/models/invoice.rb
app/models/subscription.rb
app/models/plan.rb
app/models/line_item.rb
app/models/payment.rb
</code></pre>

<p>Create the namespace:</p>

<pre><code>app/models/billing/invoice.rb
app/models/billing/subscription.rb
app/models/billing/plan.rb
app/models/billing/line_item.rb
app/models/billing/payment.rb
</code></pre>

<p>Update each model:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/models/billing/invoice.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="nb">self</span><span class="p">.</span><span class="nf">table_name</span> <span class="o">=</span> <span class="s2">"invoices"</span>  <span class="c1"># Keep the existing table name for now</span>

    <span class="n">belongs_to</span> <span class="ss">:subscription</span><span class="p">,</span> <span class="ss">class_name: </span><span class="s2">"Billing::Subscription"</span>
    <span class="n">has_many</span> <span class="ss">:line_items</span><span class="p">,</span> <span class="ss">class_name: </span><span class="s2">"Billing::LineItem"</span>
    <span class="n">has_many</span> <span class="ss">:payments</span><span class="p">,</span> <span class="ss">class_name: </span><span class="s2">"Billing::Payment"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Note <code>self.table_name = "invoices"</code>. We’re not renaming database tables yet. That comes later, when the engine takes ownership. Right now we’re only testing the code boundary.</p>

<p>Run the tests. Things will break. Every file that referenced <code>Invoice</code> directly now needs to reference <code>Billing::Invoice</code>. This is the point – you’re making the coupling visible.</p>

<p>Some breakages will be trivial (update the reference). Others will reveal real coupling: a reporting query that joins across billing and user tables, a controller that mixes billing and notification logic, a callback that reaches into a domain it shouldn’t touch. These are the coupling points you need to resolve before extraction.</p>

<p>Fix them now, while everything is still in one application. It’s much easier to refactor coupling in a monolith than across engine boundaries.</p>

<hr />

<h2 id="step-2-generate-the-engine">Step 2: Generate the Engine</h2>

<p>Once the namespace is stable and the tests pass, generate the engine:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>rails plugin new engines/billing <span class="nt">--mountable</span> <span class="nt">--database</span><span class="o">=</span>postgresql
</code></pre></div></div>

<p>This creates the engine scaffold. Now set it up:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing/engine.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Billing</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Add it to your Gemfile:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Gemfile</span>
<span class="n">gem</span> <span class="s2">"billing"</span><span class="p">,</span> <span class="ss">path: </span><span class="s2">"engines/billing"</span>
</code></pre></div></div>

<p>Run <code>bundle install</code>. The engine is loaded, but it’s empty. The host app’s <code>Billing::</code> namespace still contains all the code. That’s fine – we’ll move it piece by piece.</p>

<hr />

<h2 id="step-3-moving-models">Step 3: Moving Models</h2>

<p>This is the core of the extraction. Move each model from the host app into the engine.</p>

<h3 id="the-file-move">The file move</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Move from host app to engine</span>
<span class="nb">mv </span>app/models/billing/invoice.rb engines/billing/app/models/billing/invoice.rb
<span class="nb">mv </span>app/models/billing/subscription.rb engines/billing/app/models/billing/subscription.rb
<span class="nb">mv </span>app/models/billing/plan.rb engines/billing/app/models/billing/plan.rb
<span class="nb">mv </span>app/models/billing/line_item.rb engines/billing/app/models/billing/line_item.rb
<span class="nb">mv </span>app/models/billing/payment.rb engines/billing/app/models/billing/payment.rb
</code></pre></div></div>

<h3 id="update-the-base-class">Update the base class</h3>

<p>The engine has its own <code>ApplicationRecord</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/application_record.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">ApplicationRecord</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span>
    <span class="nb">self</span><span class="p">.</span><span class="nf">abstract_class</span> <span class="o">=</span> <span class="kp">true</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Update each model to inherit from it:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="c1"># ...</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="migration-strategy">Migration strategy</h3>

<p>You have two options for handling existing tables:</p>

<p><strong>Option A: Keep existing table names.</strong> The simplest approach. Override <code>table_name_prefix</code> in the engine module to avoid the automatic prefix:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="c1"># Don't prefix existing tables -- they already exist as "invoices", etc.</span>
  <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">table_name_prefix</span>
    <span class="s2">""</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This means <code>Billing::Invoice</code> maps to the <code>invoices</code> table, not <code>billing_invoices</code>. The advantage: zero migration needed. The disadvantage: the table name doesn’t indicate ownership.</p>

<p><strong>Option B: Rename tables to use the engine prefix.</strong> This is the cleaner long-term approach but requires a migration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/db/migrate/XXXXXX_rename_billing_tables.rb</span>

<span class="k">class</span> <span class="nc">RenameBillingTables</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">rename_table</span> <span class="ss">:invoices</span><span class="p">,</span> <span class="ss">:billing_invoices</span>
    <span class="n">rename_table</span> <span class="ss">:subscriptions</span><span class="p">,</span> <span class="ss">:billing_subscriptions</span>
    <span class="n">rename_table</span> <span class="ss">:plans</span><span class="p">,</span> <span class="ss">:billing_plans</span>
    <span class="n">rename_table</span> <span class="ss">:line_items</span><span class="p">,</span> <span class="ss">:billing_line_items</span>
    <span class="n">rename_table</span> <span class="ss">:payments</span><span class="p">,</span> <span class="ss">:billing_payments</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>After this migration, <code>isolate_namespace</code> handles the table name prefix automatically. <code>Billing::Invoice</code> maps to <code>billing_invoices</code> without any manual <code>self.table_name</code> override.</p>

<p><strong>My recommendation:</strong> Start with Option A. Get the extraction working with zero database changes. Then, in a follow-up PR, rename the tables. This separates the code change (risky, many files) from the database change (risky, DDL), reducing the blast radius of each deploy.</p>

<h3 id="moving-existing-migrations">Moving existing migrations</h3>

<p>Existing migrations for billing tables should stay in the host app – they represent historical database state. New migrations go in the engine’s <code>db/migrate/</code> directory. When you run <code>bin/rails billing:install:migrations</code>, Rails copies the engine’s new migrations into the host app for execution.</p>

<p>Don’t try to retroactively move historical migrations into the engine. It adds complexity with no benefit. The database doesn’t care which directory the migration file lived in – it cares about the schema.</p>

<h3 id="rolling-back-engine-migrations-safely">Rolling back engine migrations safely</h3>

<p>Here’s a gotcha that bites teams during their first extraction: engine migrations and host app migrations share a single <code>schema_migrations</code> table. If you need to roll back, <code>bin/rails db:rollback</code> rolls back the most recent migration regardless of whether it belongs to the host app or an engine.</p>

<p>For targeted rollbacks:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Roll back a specific migration by version number</span>
bin/rails db:migrate:down <span class="nv">VERSION</span><span class="o">=</span>20240301120000
</code></pre></div></div>

<p>Note: engine migrations, once installed in the host app, are just regular migrations. There’s no engine-specific rollback task – use the standard <code>db:migrate:down</code> with the <code>VERSION</code> number. If your application uses multiple databases (Rails 6.1+), the task becomes <code>db:migrate:down:primary VERSION=...</code> where <code>primary</code> is the database name from <code>database.yml</code>.</p>

<p>The risk: if you roll back an engine migration but the engine’s code still expects the new schema, you get runtime errors. Always roll back code and migrations together, in the same deploy.</p>

<h3 id="draining-background-jobs-during-extraction">Draining background jobs during extraction</h3>

<p>If you’re renaming job classes during extraction (e.g., <code>InvoiceGenerationJob</code> becomes <code>Billing::InvoiceGenerationJob</code>), you need to drain the queue of old-named jobs before deploying the new code. The safest sequence:</p>

<ol>
  <li>Stop enqueuing new jobs (disable the code path or feature-flag it)</li>
  <li>Wait for existing jobs to drain (monitor your Solid Queue dashboard)</li>
  <li>Deploy the renamed job classes</li>
  <li>Re-enable job enqueuing</li>
</ol>

<p>For jobs that can’t be drained (retries, scheduled far in the future), add a class alias during the transition:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/initializers/job_aliases.rb (temporary, remove after transition)</span>
<span class="no">InvoiceGenerationJob</span> <span class="o">=</span> <span class="no">Billing</span><span class="o">::</span><span class="no">InvoiceGenerationJob</span>
</code></pre></div></div>

<p>This keeps old-named jobs deserializable while you wait for them to clear naturally.</p>

<blockquote>
  <p><strong>Checkpoint</strong> — The hardest step is done. Your models are in the engine, inheriting from the engine’s own ApplicationRecord, with a clear migration strategy. This is a great commit point. Run your tests now to catch any issues before moving controllers and views in the next steps.</p>
</blockquote>

<hr />

<h2 id="step-4-moving-controllers-and-routes">Step 4: Moving Controllers and Routes</h2>

<h3 id="controllers">Controllers</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">mv </span>app/controllers/billing/ engines/billing/app/controllers/billing/
</code></pre></div></div>

<p>Update the base class:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/application_controller.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">ActionController</span><span class="o">::</span><span class="no">Base</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>If your billing controllers need authentication (they almost certainly do), use the configurable base controller pattern from Chapter 8:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="n">mattr_accessor</span> <span class="ss">:parent_controller</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ActionController::Base"</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/application_controller.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">ApplicationController</span> <span class="o">&lt;</span> <span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span><span class="p">.</span><span class="nf">constantize</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/initializers/billing.rb (host app)</span>

<span class="no">Billing</span><span class="p">.</span><span class="nf">parent_controller</span> <span class="o">=</span> <span class="s2">"ApplicationController"</span>
</code></pre></div></div>

<h3 id="routes">Routes</h3>

<p>Move billing routes from the host app’s <code>config/routes.rb</code> into the engine’s:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/config/routes.rb</span>

<span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">resources</span> <span class="ss">:invoices</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:index</span><span class="p">,</span> <span class="ss">:show</span><span class="p">]</span>
  <span class="n">resources</span> <span class="ss">:subscriptions</span>
  <span class="n">resource</span> <span class="ss">:plan</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:show</span><span class="p">,</span> <span class="ss">:edit</span><span class="p">,</span> <span class="ss">:update</span><span class="p">]</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Mount the engine in the host app:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/routes.rb (host app)</span>

<span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">mount</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/billing"</span>
  <span class="c1"># ... other routes</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Remove the old billing routes from the host app’s routes file. Any route helpers in views or controllers need updating: <code>invoices_path</code> in the host app becomes <code>billing.invoices_path</code>.</p>

<hr />

<h2 id="step-5-moving-views-and-assets">Step 5: Moving Views and Assets</h2>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">mv </span>app/views/billing/ engines/billing/app/views/billing/
</code></pre></div></div>

<p>Views inside the engine work exactly as they did in the host app. The only change: route helpers inside engine views resolve to the engine’s routes automatically. If an engine view needs a host app route, use <code>main_app</code>:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">&lt;%# Inside an engine view, linking to the host app's root %&gt;</span>
<span class="cp">&lt;%=</span> <span class="n">link_to</span> <span class="s2">"Home"</span><span class="p">,</span> <span class="n">main_app</span><span class="p">.</span><span class="nf">root_path</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<p>If a host app view needs an engine route:</p>

<div class="language-erb highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">&lt;%# Inside a host app view, linking to the engine %&gt;</span>
<span class="cp">&lt;%=</span> <span class="n">link_to</span> <span class="s2">"Invoices"</span><span class="p">,</span> <span class="n">billing</span><span class="p">.</span><span class="nf">invoices_path</span> <span class="cp">%&gt;</span>
</code></pre></div></div>

<hr />

<h2 id="step-6-adding-integration-concerns">Step 6: Adding Integration Concerns</h2>

<p>The host app’s <code>User</code> model probably had billing associations:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Before extraction</span>
<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="n">has_many</span> <span class="ss">:invoices</span>
  <span class="n">has_many</span> <span class="ss">:subscriptions</span>
<span class="k">end</span>
</code></pre></div></div>

<p>These associations now need to go through a concern:</p>

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
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/models/user.rb (host app)</span>

<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The associations and methods that used to live directly on <code>User</code> now come from the engine’s concern. The engine doesn’t know about <code>User</code>. The host app decides to include the concern. The boundary is clean.</p>

<blockquote>
  <p><strong>Checkpoint</strong> — The engine is structurally complete: models, controllers, routes, views, and integration concerns are all in place. What remains is cleanup – updating references throughout the host app and verifying tests. Commit what you have. The remaining steps are mechanical but important; tackling them with a clean working tree makes it safe to revert if needed.</p>
</blockquote>

<p>Compare the architecture before and after extraction:</p>

<div class="diagram"><img src="/img/books/modular-rails/b3f5642e7a8eb98a90d888209aeef481cc5cda1d2b02d81e987f1ce940224f27.svg" alt="Mermaid diagram: Before: Monolith"></div>

<hr />

<h2 id="step-7-updating-references-throughout-the-host-app">Step 7: Updating References Throughout the Host App</h2>

<p>This is the tedious part. Every place in the host app that referenced <code>Invoice</code> directly now needs to reference <code>Billing::Invoice</code> or go through the concern.</p>

<p>A systematic approach:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Find all references to billing models in the host app</span>
<span class="nb">grep</span> <span class="nt">-rn</span> <span class="s2">"Invoice</span><span class="se">\|</span><span class="s2">Subscription</span><span class="se">\|</span><span class="s2">Plan</span><span class="se">\|</span><span class="s2">LineItem</span><span class="se">\|</span><span class="s2">Payment"</span> app/ <span class="se">\</span>
  <span class="nt">--include</span><span class="o">=</span><span class="s2">"*.rb"</span> <span class="nt">--include</span><span class="o">=</span><span class="s2">"*.erb"</span> | <span class="se">\</span>
  <span class="nb">grep</span> <span class="nt">-v</span> <span class="s2">"Billing::"</span> | <span class="se">\</span>
  <span class="nb">grep</span> <span class="nt">-v</span> <span class="s2">"engines/"</span>
</code></pre></div></div>

<p>This shows you every file that still uses the unnamespaced class name. Update each one.</p>

<p>Common patterns you’ll encounter:</p>

<p><strong>Factory definitions:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Before</span>
<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">define</span> <span class="k">do</span>
  <span class="n">factory</span> <span class="ss">:invoice</span> <span class="k">do</span>
    <span class="c1"># ...</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># After</span>
<span class="no">FactoryBot</span><span class="p">.</span><span class="nf">define</span> <span class="k">do</span>
  <span class="n">factory</span> <span class="ss">:invoice</span><span class="p">,</span> <span class="ss">class: </span><span class="s2">"Billing::Invoice"</span> <span class="k">do</span>
    <span class="c1"># ...</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>Admin panels (ActiveAdmin):</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Before</span>
<span class="no">ActiveAdmin</span><span class="p">.</span><span class="nf">register</span> <span class="no">Invoice</span> <span class="k">do</span>
  <span class="c1"># ...</span>
<span class="k">end</span>

<span class="c1"># After</span>
<span class="no">ActiveAdmin</span><span class="p">.</span><span class="nf">register</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">,</span> <span class="ss">as: </span><span class="s2">"Invoice"</span> <span class="k">do</span>
  <span class="c1"># ...</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>Serializers/decorators:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Before</span>
<span class="k">class</span> <span class="nc">InvoiceSerializer</span>
  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">invoice</span><span class="p">)</span>
    <span class="vi">@invoice</span> <span class="o">=</span> <span class="n">invoice</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># After -- this stays in the host app or moves to the engine,</span>
<span class="c1"># depending on whether it's an API concern or a domain concern</span>
</code></pre></div></div>

<p><strong>Mailers:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># If the mailer is billing-specific, move it to the engine</span>
<span class="c1"># engines/billing/app/mailers/billing/invoice_mailer.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">InvoiceMailer</span> <span class="o">&lt;</span> <span class="no">ApplicationMailer</span>
    <span class="k">def</span> <span class="nf">invoice_created</span><span class="p">(</span><span class="n">invoice</span><span class="p">)</span>
      <span class="vi">@invoice</span> <span class="o">=</span> <span class="n">invoice</span>
      <span class="n">mail</span><span class="p">(</span><span class="ss">to: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">billing_email</span><span class="p">,</span> <span class="ss">subject: </span><span class="s2">"New invoice"</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<hr />

<h2 id="step-8-setting-up-engine-tests">Step 8: Setting Up Engine Tests</h2>

<p>Create specs in the engine for every model, controller, and concern you moved:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/models/billing/invoice_spec.rb</span>

<span class="nb">require</span> <span class="s2">"rails_helper"</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span> <span class="k">do</span>
  <span class="n">describe</span> <span class="s2">"associations"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="p">{</span> <span class="n">is_expected</span><span class="p">.</span><span class="nf">to</span> <span class="n">belong_to</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">)</span> <span class="p">}</span>
    <span class="n">it</span> <span class="p">{</span> <span class="n">is_expected</span><span class="p">.</span><span class="nf">to</span> <span class="n">have_many</span><span class="p">(</span><span class="ss">:line_items</span><span class="p">)</span> <span class="p">}</span>
    <span class="n">it</span> <span class="p">{</span> <span class="n">is_expected</span><span class="p">.</span><span class="nf">to</span> <span class="n">have_many</span><span class="p">(</span><span class="ss">:payments</span><span class="p">)</span> <span class="p">}</span>
  <span class="k">end</span>

  <span class="n">describe</span> <span class="s2">"#total_amount"</span> <span class="k">do</span>
    <span class="n">it</span> <span class="s2">"sums line item amounts"</span> <span class="k">do</span>
      <span class="n">invoice</span> <span class="o">=</span> <span class="n">create</span><span class="p">(</span><span class="ss">:invoice</span><span class="p">)</span>
      <span class="n">create</span><span class="p">(</span><span class="ss">:line_item</span><span class="p">,</span> <span class="ss">invoice: </span><span class="n">invoice</span><span class="p">,</span> <span class="ss">amount_cents: </span><span class="mi">1000</span><span class="p">)</span>
      <span class="n">create</span><span class="p">(</span><span class="ss">:line_item</span><span class="p">,</span> <span class="ss">invoice: </span><span class="n">invoice</span><span class="p">,</span> <span class="ss">amount_cents: </span><span class="mi">2500</span><span class="p">)</span>

      <span class="n">expect</span><span class="p">(</span><span class="n">invoice</span><span class="p">.</span><span class="nf">total_amount</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="mi">3500</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The engine’s dummy app needs a <code>User</code> model (or whatever the billable entity is) to test the concern:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/test/dummy/app/models/user.rb</span>

<span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/test/dummy/db/migrate/XXXXXX_create_users.rb</span>

<span class="k">class</span> <span class="nc">CreateUsers</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">create_table</span> <span class="ss">:users</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">string</span> <span class="ss">:email</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">timestamps</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This dummy <code>User</code> is intentionally minimal. It has an <code>email</code> and nothing else. It exists only to test the <code>Billable</code> concern. It doesn’t need authentication, notification preferences, or team memberships.</p>

<p>Run the engine tests in isolation:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd </span>engines/billing
bundle <span class="nb">install
</span>bundle <span class="nb">exec </span>rails db:prepare
bundle <span class="nb">exec </span>rspec
</code></pre></div></div>

<p>These should pass without the host application being loaded.</p>

<hr />

<h2 id="step-9-verifying-nothing-broke">Step 9: Verifying Nothing Broke</h2>

<p>Run the full host application test suite:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd</span> /path/to/host-app
bundle <span class="nb">exec </span>rspec
</code></pre></div></div>

<p>If tests fail, they’ll typically be in one of three categories:</p>

<p><strong>1. Missing constant references.</strong> Something still references <code>Invoice</code> instead of <code>Billing::Invoice</code>. Fix the reference.</p>

<p><strong>2. Missing associations.</strong> A model that used to <code>has_many :invoices</code> now needs <code>include Billing::Billable</code>. Add the concern include.</p>

<p><strong>3. Route helper changes.</strong> <code>invoices_path</code> became <code>billing.invoices_path</code>. Update the view or controller.</p>

<p>Fix each failure. Most are mechanical – find and replace. The important thing is that the engine’s isolated tests pass AND the host app’s integration tests pass. Both green means the extraction is clean.</p>

<hr />

<h2 id="the-complete-checklist">The Complete Checklist</h2>

<p>Here’s the extraction process as a checklist you can copy into a pull request description:</p>

<div class="language-markdown highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="gu">## Engine Extraction: Billing</span>

<span class="gu">### Preparation</span>
<span class="p">-</span> [ ] Analysed co-change frequency (target: &gt;70% of commits touch only billing files)
<span class="p">-</span> [ ] Counted incoming references (target: &lt;15 files outside billing reference it)
<span class="p">-</span> [ ] Identified all integration points with host app

<span class="gu">### Namespace (PR 1)</span>
<span class="p">-</span> [ ] Moved models to <span class="sb">`app/models/billing/`</span>
<span class="p">-</span> [ ] Updated all references from <span class="sb">`Invoice`</span> to <span class="sb">`Billing::Invoice`</span>
<span class="p">-</span> [ ] Added <span class="sb">`self.table_name`</span> to keep existing table names
<span class="p">-</span> [ ] All tests pass

<span class="gu">### Engine Creation (PR 2)</span>
<span class="p">-</span> [ ] Generated engine with <span class="sb">`rails plugin new engines/billing --mountable`</span>
<span class="p">-</span> [ ] Moved models into engine
<span class="p">-</span> [ ] Moved controllers and routes into engine
<span class="p">-</span> [ ] Moved views into engine
<span class="p">-</span> [ ] Created integration concerns (Billable, etc.)
<span class="p">-</span> [ ] Updated host app's User model to include concerns
<span class="p">-</span> [ ] Configured parent controller for authentication
<span class="p">-</span> [ ] Created engine initializer in host app
<span class="p">-</span> [ ] Updated factories to use namespaced classes
<span class="p">-</span> [ ] Updated admin panel registrations
<span class="p">-</span> [ ] Engine tests pass in isolation
<span class="p">-</span> [ ] Host app tests pass with engine mounted

<span class="gu">### Table Rename (PR 3, optional)</span>
<span class="p">-</span> [ ] Created migration to rename tables with <span class="sb">`billing_`</span> prefix
<span class="p">-</span> [ ] Removed <span class="sb">`self.table_name`</span> overrides
<span class="p">-</span> [ ] Removed custom <span class="sb">`table_name_prefix`</span> override
<span class="p">-</span> [ ] All tests pass after migration

<span class="gu">### Cleanup</span>
<span class="p">-</span> [ ] Removed empty billing directories from host app
<span class="p">-</span> [ ] Updated documentation / README
<span class="p">-</span> [ ] Reviewed engine's gemspec dependencies
</code></pre></div></div>

<p>Three PRs. Each is deployable independently. Each is reviewable in isolation. If PR 2 causes issues in production, revert it without touching PR 1 or PR 3.</p>

<hr />

<h2 id="common-pitfalls">Common Pitfalls</h2>

<h3 id="extracting-too-much-at-once">Extracting too much at once</h3>

<p>Don’t extract billing, notifications, and reporting in the same sprint. Extract one domain, stabilise it, learn from the process, then extract the next. Each extraction teaches you something that makes the next one smoother.</p>

<h3 id="forgetting-polymorphic-associations">Forgetting polymorphic associations</h3>

<p>If a billing model uses polymorphic associations (<code>belongs_to :billable, polymorphic: true</code>), the <code>billable_type</code> column stores the class name. After namespacing, <code>"Invoice"</code> becomes <code>"Billing::Invoice"</code>. You need a data migration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">UpdateBillingPolymorphicTypes</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">up</span>
    <span class="n">execute</span> <span class="s2">"UPDATE payments SET payable_type = 'Billing::Invoice' WHERE payable_type = 'Invoice'"</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">down</span>
    <span class="n">execute</span> <span class="s2">"UPDATE payments SET payable_type = 'Invoice' WHERE payable_type = 'Billing::Invoice'"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="single-table-inheritance-sti">Single Table Inheritance (STI)</h3>

<p>If any billing model uses STI, the <code>type</code> column stores the class name. Same problem as polymorphic associations – you need a data migration to update the stored class names.</p>

<h3 id="forgetting-active-job-class-names">Forgetting Active Job class names</h3>

<p>If you have background jobs that reference billing models (e.g., <code>InvoiceGenerationJob.perform_later(invoice_id)</code>), the job’s class name is serialized in the queue. Jobs enqueued before the extraction will fail after it if you renamed the job class. Either keep backward-compatible class names or drain the queue before deploying.</p>

<h3 id="activestorage-attachments-break-on-namespace-change">ActiveStorage attachments break on namespace change</h3>

<p>ActiveStorage stores the attached model’s class name in <code>active_storage_attachments.record_type</code>. If your <code>Invoice</code> model had attachments, every row says <code>record_type = "Invoice"</code>. After extraction, the model is <code>Billing::Invoice</code>, but the database still says <code>"Invoice"</code>. You need a data migration:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">UpdateActiveStorageRecordTypes</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">up</span>
    <span class="n">execute</span> <span class="o">&lt;&lt;~</span><span class="no">SQL</span><span class="sh">
      UPDATE active_storage_attachments
      SET record_type = 'Billing::Invoice'
      WHERE record_type = 'Invoice'
</span><span class="no">    SQL</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>ActionText has the same problem with <code>action_text_rich_texts.record_type</code>. If any extracted model uses either feature, add the data migration to your extraction checklist.</p>

<h3 id="globalid-and-signedglobalid-serialisation">GlobalID and SignedGlobalID serialisation</h3>

<p>GlobalID is used more widely than most people realise. ActiveJob serialises model arguments as GlobalIDs (<code>gid://app/Invoice/42</code>). Turbo Streams uses them for broadcasting. ActionText uses them for attachments. All of these break when <code>Invoice</code> becomes <code>Billing::Invoice</code>.</p>

<p>The safest approach during extraction is to register a custom GlobalID locator for your application that handles the old class names:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/initializers/globalid_compat.rb</span>

<span class="c1"># The first argument must match your app's GlobalID app name</span>
<span class="c1"># (usually Rails.application.railtie_name, e.g. "my_app")</span>
<span class="no">GlobalID</span><span class="o">::</span><span class="no">Locator</span><span class="p">.</span><span class="nf">use</span> <span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">railtie_name</span> <span class="k">do</span> <span class="o">|</span><span class="n">gid</span><span class="o">|</span>
  <span class="k">case</span> <span class="n">gid</span><span class="p">.</span><span class="nf">model_name</span>
  <span class="k">when</span> <span class="s2">"Invoice"</span>
    <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">gid</span><span class="p">.</span><span class="nf">model_id</span><span class="p">)</span>
  <span class="k">else</span>
    <span class="n">gid</span><span class="p">.</span><span class="nf">model_name</span><span class="p">.</span><span class="nf">constantize</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">gid</span><span class="p">.</span><span class="nf">model_id</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This buys you time to drain queues and let in-flight Turbo broadcasts settle. Remove the locator once you’re confident all old-format GlobalIDs have been processed.</p>

<h3 id="feature-flags-during-extraction">Feature flags during extraction</h3>

<p>For large extractions, wrapping the cutover in a feature flag reduces risk:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Using Flipper (or Rails' built-in Feature)</span>
<span class="k">if</span> <span class="no">Flipper</span><span class="p">.</span><span class="nf">enabled?</span><span class="p">(</span><span class="ss">:billing_engine</span><span class="p">)</span>
  <span class="c1"># Route to engine controllers</span>
  <span class="n">mount</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/billing"</span>
<span class="k">else</span>
  <span class="c1"># Keep using host app controllers</span>
  <span class="n">resources</span> <span class="ss">:invoices</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>Important caveat:</strong> Rails evaluates <code>routes.rb</code> at boot time (and on reload in development), not per-request. This means the feature flag state is locked in when routes are loaded. Toggling the flag takes effect on the next application restart, not instantly. For true per-request routing, use a constraints-based approach instead:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Per-request feature flag via route constraint</span>
<span class="n">billing_enabled</span> <span class="o">=</span> <span class="o">-&gt;</span><span class="p">(</span><span class="n">request</span><span class="p">)</span> <span class="p">{</span> <span class="no">Flipper</span><span class="p">.</span><span class="nf">enabled?</span><span class="p">(</span><span class="ss">:billing_engine</span><span class="p">,</span> <span class="n">request</span><span class="p">.</span><span class="nf">env</span><span class="p">[</span><span class="s2">"warden"</span><span class="p">]</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">user</span><span class="p">)</span> <span class="p">}</span>

<span class="n">constraints</span><span class="p">(</span><span class="n">billing_enabled</span><span class="p">)</span> <span class="k">do</span>
  <span class="n">mount</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">,</span> <span class="ss">at: </span><span class="s2">"/billing"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>For most extraction scenarios, the boot-time flag is sufficient – you toggle it and deploy. But be aware of the distinction if you need instant rollback without a restart.</p>

<h2 id="zero-downtime-extraction">Zero-Downtime Extraction</h2>

<p>The extraction steps above work for a single-deploy cutover. For applications that can’t afford downtime – or where the extraction is large enough that a single deploy is risky – you need the expand-contract pattern.</p>

<h3 id="the-expand-contract-pattern">The expand-contract pattern</h3>

<p>Instead of moving code in one big step, you expand (add the new structure alongside the old), migrate data, then contract (remove the old structure):</p>

<ol>
  <li><strong>Expand:</strong> Deploy the new engine alongside the existing code. Both paths work simultaneously.</li>
  <li><strong>Dual-write:</strong> Write to both old and new locations during the transition.</li>
  <li><strong>Migrate:</strong> Backfill any data that needs to move.</li>
  <li><strong>Swap reads:</strong> Point reads at the new location. The old code is still there but unused.</li>
  <li><strong>Contract:</strong> Remove the old code path once you’re confident the new one is stable.</li>
</ol>

<p>Each step is a separate deploy. Each deploy is independently reversible.</p>

<h3 id="safe-migrations-with-strong_migrations">Safe migrations with <code>strong_migrations</code></h3>

<p>The <code>strong_migrations</code> gem catches dangerous DDL operations before they run. This is essential during extraction because you’re often renaming tables or adding columns:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Gemfile</span>
<span class="n">gem</span> <span class="s2">"strong_migrations"</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># This will be blocked:</span>
<span class="k">class</span> <span class="nc">RenameInvoicesToBillingInvoices</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">rename_table</span> <span class="ss">:invoices</span><span class="p">,</span> <span class="ss">:billing_invoices</span>  <span class="c1"># ← Acquires ACCESS EXCLUSIVE lock!</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p><code>rename_table</code> takes an <code>ACCESS EXCLUSIVE</code> lock in PostgreSQL, blocking all reads and writes for the duration. On a large table, this can mean seconds or minutes of downtime. The safe alternative:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">CreateBillingInvoicesTable</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">create_table</span> <span class="ss">:billing_invoices</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
      <span class="c1"># ... same columns as invoices</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># Separate migration: backfill data</span>
<span class="k">class</span> <span class="nc">BackfillBillingInvoices</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="n">disable_ddl_transaction!</span>

  <span class="c1"># Temporary model pointing at the old table</span>
  <span class="k">class</span> <span class="nc">OldInvoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="nb">self</span><span class="p">.</span><span class="nf">table_name</span> <span class="o">=</span> <span class="s2">"invoices"</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">up</span>
    <span class="no">OldInvoice</span><span class="p">.</span><span class="nf">find_in_batches</span><span class="p">(</span><span class="ss">batch_size: </span><span class="mi">1000</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">batch</span><span class="o">|</span>
      <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">insert_all</span><span class="p">(</span>
        <span class="n">batch</span><span class="p">.</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">i</span><span class="o">|</span> <span class="n">i</span><span class="p">.</span><span class="nf">attributes</span><span class="p">.</span><span class="nf">except</span><span class="p">(</span><span class="s2">"id"</span><span class="p">)</span> <span class="p">}</span>
      <span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="concurrent-index-creation">Concurrent index creation</h3>

<p>When adding indexes to the new tables, always use <code>algorithm: :concurrently</code>:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">AddIndexesToBillingInvoices</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="n">disable_ddl_transaction!</span>

  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">add_index</span> <span class="ss">:billing_invoices</span><span class="p">,</span> <span class="ss">:user_id</span><span class="p">,</span> <span class="ss">algorithm: :concurrently</span>
    <span class="n">add_index</span> <span class="ss">:billing_invoices</span><span class="p">,</span> <span class="ss">:status</span><span class="p">,</span> <span class="ss">algorithm: :concurrently</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p><code>disable_ddl_transaction!</code> is required for concurrent indexes – PostgreSQL can’t create them inside a transaction. This is another reason to keep migrations small and focused: each migration is either transactional (safe to roll back) or non-transactional (concurrent indexes, data backfills) but never both.</p>

<hr />

<p><em>You’ve now extracted your first engine. The process is repeatable: namespace, generate, move, wire, verify. Each subsequent extraction is faster because you’ve built the muscle memory and the patterns are established. In the next chapter, we’ll look at how to manage the dependencies between engines as your modular architecture grows.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-09-identifying-boundaries/">&larr; Identifying Boundaries in an Existing Application</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-11-managing-inter-engine-dependencies/">Managing Inter-Engine Dependencies &rarr;</a>
</nav>
{% endraw %}
