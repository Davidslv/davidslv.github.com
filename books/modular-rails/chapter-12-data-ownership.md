---
layout: book
book: modular_rails
title: "Data Ownership and the Database Question"
permalink: /books/modular-rails/chapter-12-data-ownership/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-11-managing-inter-engine-dependencies/">&larr; Managing Inter-Engine Dependencies</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-13-testing-strategy/">Testing Strategy for a Modular Monolith &rarr;</a>
</nav>

<h1 id="chapter-12-data-ownership-and-the-database-question">Chapter 12: Data Ownership and the Database Question</h1>

<p>This is the chapter I wish someone had written before I spent three weeks on a migration strategy that didn’t work. Everything else about engine architecture – namespace isolation, concern-based integration, event-driven communication – is straightforward compared to the question of who owns the data.</p>

<hr />

<h2 id="the-problem">The Problem</h2>

<p>When billing logic lived in <code>app/models/invoice.rb</code>, the <code>invoices</code> table was just another table in your database. Nobody asked who “owned” it. But now billing is an engine. The <code>invoices</code> table still exists in the same database, shared by the same connection pool. Other parts of the application might read from it. Reporting might join against it. Admin panels might write to it.</p>

<p>Who owns the table? The engine? The host app? Both?</p>

<p>This question matters because ownership determines who can change the schema. If the billing engine owns the <code>invoices</code> table, the billing team should be able to add columns, change indexes, and run migrations without coordinating with every other team that touches that table. If ownership is shared, every migration requires coordination.</p>

<hr />

<h2 id="one-database-many-engines">One Database, Many Engines</h2>

<p>This is where most Rails engine architectures live, and for most teams it’s the right place to stay.</p>

<p>All engines share a single PostgreSQL database. Tables are prefixed by engine name (from <code>isolate_namespace</code>): <code>billing_invoices</code>, <code>billing_subscriptions</code>, <code>notifications_notifications</code>. They share a connection pool, a schema, and transaction boundaries.</p>

<h3 id="why-this-works">Why this works</h3>

<p><strong>Joins.</strong> A reporting query that joins <code>billing_invoices</code> with <code>users</code> works with a single SQL query. No API calls, no data denormalisation, no eventual consistency.</p>

<p><strong>Transactions.</strong> Creating an invoice and sending a notification can happen in the same database transaction. Either both succeed or neither does. ACID for free.</p>

<p><strong>Migrations.</strong> All migrations run in the same <code>db/migrate/</code> directory (after being copied from engines). One <code>rails db:migrate</code> brings everything up to date.</p>

<p><strong>Simplicity.</strong> One database to back up, monitor, and scale. One connection string. One ORM configuration.</p>

<h3 id="table-ownership-convention">Table ownership convention</h3>

<p>Even with a shared database, establish ownership:</p>

<pre><code>billing_invoices         → owned by billing engine
billing_subscriptions    → owned by billing engine
billing_plans            → owned by billing engine
documents_documents      → owned by documents engine
documents_templates      → owned by documents engine
documents_signatures     → owned by documents engine
notifications_notifications → owned by notifications engine
users                    → owned by host app
</code></pre>

<p><strong>Only the owning engine should write to its tables.</strong> Other engines can read from them (through the owning engine’s models), but they should never bypass the engine to INSERT, UPDATE, or DELETE directly.</p>

<div class="diagram"><img src="/img/books/modular-rails/6296b4a9dc7f0a06560e6941647ad44ebf042138f4c6be8e5975fa08b1a98d56.svg" alt="Mermaid diagram: Host App"></div>

<p>Each engine owns its tables (shown inside its subgraph) and has read/write access to them. The dashed arrows show the only cross-boundary access: engines read from the host app’s <code>users</code> table via concerns, never writing to it directly.</p>

<p>Solid arrows indicate full read/write ownership. Dashed arrows indicate read-only access through the owning engine’s concerns.</p>

<p>This is a convention, not a technical enforcement. PostgreSQL doesn’t know about engine ownership. But it’s a convention that matters. When the billing engine’s tests are the only tests that write to <code>billing_invoices</code>, you know that changing the <code>billing_invoices</code> schema only affects the billing engine’s code.</p>

<hr />

<h2 id="foreign-keys-across-engine-boundaries">Foreign Keys Across Engine Boundaries</h2>

<p>The tricky part of a shared database is foreign keys. A <code>billing_invoices</code> table has a <code>user_id</code> column that references the <code>users</code> table. The <code>users</code> table is owned by the host app. The billing engine depends on it.</p>

<h3 id="option-1-polymorphic-associations-no-foreign-key-constraint">Option 1: Polymorphic associations (no foreign key constraint)</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="n">belongs_to</span> <span class="ss">:customer</span><span class="p">,</span> <span class="ss">polymorphic: </span><span class="kp">true</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>billing_invoices</code> table has <code>customer_type</code> and <code>customer_id</code> columns. No foreign key constraint. The engine doesn’t know or care what <code>customer_type</code> resolves to.</p>

<p><strong>Advantage:</strong> Maximum flexibility. The engine truly doesn’t depend on the host app’s schema.<br />
<strong>Disadvantage:</strong> No referential integrity. A deleted user leaves orphaned invoices. You need application-level cleanup (callbacks, background jobs) instead of database-level guarantees.</p>

<h3 id="option-2-foreign-key-with-convention">Option 2: Foreign key with convention</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/db/migrate/XXXXXX_create_billing_invoices.rb</span>
<span class="k">class</span> <span class="nc">CreateBillingInvoices</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">create_table</span> <span class="ss">:billing_invoices</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">bigint</span> <span class="ss">:user_id</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">timestamps</span>
    <span class="k">end</span>

    <span class="n">add_index</span> <span class="ss">:billing_invoices</span><span class="p">,</span> <span class="ss">:user_id</span>
    <span class="c1"># Note: we add the foreign key in the HOST APP's migration, not here</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># db/migrate/XXXXXX_add_billing_foreign_keys.rb (host app)</span>
<span class="k">class</span> <span class="nc">AddBillingForeignKeys</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">add_foreign_key</span> <span class="ss">:billing_invoices</span><span class="p">,</span> <span class="ss">:users</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The foreign key constraint lives in the host app’s migration, not the engine’s. The engine creates the column and index. The host app creates the constraint, because only the host app knows that <code>user_id</code> references the <code>users</code> table.</p>

<p><strong>Advantage:</strong> Referential integrity at the database level.<br />
<strong>Disadvantage:</strong> The host app needs to know about the engine’s tables to create the constraint. This is a coupling point – but a deliberate, documented one.</p>

<h3 id="a-second-engine-the-same-problem">A second engine: the same problem</h3>

<p>Imagine we’ve also extracted a documents engine following the same process from Chapter 10. (Chapter 9 identified Document, Template, and Signature as a tight cluster that changes together in 85%+ of commits.)</p>

<p>The documents engine has two kinds of foreign key:</p>

<pre><code>documents_documents    → user_id       (crosses into host app)
documents_signatures   → document_id   (stays within the engine)
</code></pre>

<p>Foreign keys within an engine (signatures → documents) are straightforward – the engine owns both tables and can create the constraint itself:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/documents/db/migrate/XXXXXX_create_documents_signatures.rb</span>
<span class="k">class</span> <span class="nc">CreateDocumentsSignatures</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">create_table</span> <span class="ss">:documents_signatures</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">references</span> <span class="ss">:document</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span><span class="p">,</span>
                   <span class="ss">foreign_key: </span><span class="p">{</span> <span class="ss">to_table: :documents_documents</span> <span class="p">}</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">string</span> <span class="ss">:signer_email</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">datetime</span> <span class="ss">:signed_at</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">timestamps</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Foreign keys crossing engine boundaries (documents → users) need the same treatment as billing – the engine creates the column, the host app creates the constraint:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/documents/db/migrate/XXXXXX_create_documents_documents.rb</span>
<span class="k">class</span> <span class="nc">CreateDocumentsDocuments</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">create_table</span> <span class="ss">:documents_documents</span> <span class="k">do</span> <span class="o">|</span><span class="n">t</span><span class="o">|</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">bigint</span> <span class="ss">:user_id</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">string</span> <span class="ss">:title</span><span class="p">,</span> <span class="ss">null: </span><span class="kp">false</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">references</span> <span class="ss">:template</span><span class="p">,</span> <span class="ss">foreign_key: </span><span class="p">{</span> <span class="ss">to_table: :documents_templates</span> <span class="p">}</span>
      <span class="n">t</span><span class="p">.</span><span class="nf">timestamps</span>
    <span class="k">end</span>

    <span class="n">add_index</span> <span class="ss">:documents_documents</span><span class="p">,</span> <span class="ss">:user_id</span>
    <span class="c1"># FK to users added by the host app, same as billing</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># db/migrate/XXXXXX_add_documents_foreign_keys.rb (host app)</span>
<span class="k">class</span> <span class="nc">AddDocumentsForeignKeys</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">add_foreign_key</span> <span class="ss">:documents_documents</span><span class="p">,</span> <span class="ss">:users</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The pattern is identical to billing’s. Once you’ve done it for one engine, each subsequent engine follows the same recipe: engine owns the column, host app owns the cross-boundary constraint.</p>

<h3 id="which-to-choose">Which to choose</h3>

<p>Use polymorphic associations when the engine needs maximum portability (it might be used with different host apps that have different models). Use foreign keys when data integrity matters more than portability (most business applications).</p>

<hr />

<h2 id="migration-ownership-and-coordination">Migration Ownership and Coordination</h2>

<h3 id="engine-migrations">Engine migrations</h3>

<p>Each engine has its own <code>db/migrate/</code> directory. Migrations in this directory are authored by the engine’s developers and define the engine’s schema.</p>

<p>To run engine migrations in the host app:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Copy engine migrations to the host app</span>
bin/rails billing:install:migrations

<span class="c"># Run them</span>
bin/rails db:migrate
</code></pre></div></div>

<p>Rails copies the migration files into the host app’s <code>db/migrate/</code> directory, prefixing them with a timestamp to ensure ordering. Subsequent runs of <code>install:migrations</code> skip files that have already been copied (Rails checks by migration name, not timestamp).</p>

<h3 id="migration-coordination-between-engines">Migration coordination between engines</h3>

<p>When two engines need schema changes that interact, coordinate the order. Here’s a concrete example: invoices can now link to PDF documents generated by the documents engine. The documents engine adds a <code>documents_documents</code> table first, then billing adds a <code>document_id</code> column referencing it.</p>

<ol>
  <li>Documents engine releases v0.3.0 with the <code>create_documents_documents</code> migration</li>
  <li>Host app runs <code>documents:install:migrations</code> and <code>db:migrate</code></li>
  <li>Billing engine releases v0.6.0 with a migration that adds <code>document_id</code> to <code>billing_invoices</code> and an index on it</li>
  <li>Host app runs <code>billing:install:migrations</code> and <code>db:migrate</code></li>
</ol>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/db/migrate/XXXXXX_add_document_id_to_billing_invoices.rb</span>
<span class="k">class</span> <span class="nc">AddDocumentIdToBillingInvoices</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">add_column</span> <span class="ss">:billing_invoices</span><span class="p">,</span> <span class="ss">:document_id</span><span class="p">,</span> <span class="ss">:bigint</span>
    <span class="n">add_index</span> <span class="ss">:billing_invoices</span><span class="p">,</span> <span class="ss">:document_id</span>
    <span class="c1"># FK constraint added by host app since it crosses engine boundaries</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># db/migrate/XXXXXX_add_billing_invoices_document_fk.rb (host app)</span>
<span class="k">class</span> <span class="nc">AddBillingInvoicesDocumentFk</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">change</span>
    <span class="n">add_foreign_key</span> <span class="ss">:billing_invoices</span><span class="p">,</span> <span class="ss">:documents_documents</span><span class="p">,</span>
                    <span class="ss">column: :document_id</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The releases happen in order. Each engine’s migration assumes only its own previous migrations and the host app’s current schema. No engine migration should assume another engine’s migration has run.</p>

<h3 id="the-migration-rule">The migration rule</h3>

<p><strong>An engine’s migration should only create, modify, or drop tables that the engine owns.</strong> If the billing engine needs to add a column to the <code>users</code> table, that column should be added by the host app, not the engine. The engine should document the requirement in its README or raise an error if the column is missing.</p>

<hr />

<h2 id="the-data-sovereignty-spectrum">The Data Sovereignty Spectrum</h2>

<p>Ford and Richards define a spectrum in <em>Software Architecture: The Hard Parts</em>:</p>

<div class="diagram"><img src="/img/books/modular-rails/602cc043f1eedcb463d64105c4368739b3adc681bc22abbe112904ed4f398cbe.svg" alt="Mermaid diagram: Shared DB&lt;br/&gt;&lt;i&gt;one schema&lt;/i&gt;&lt;br/&gt;&lt;b&gt;Most coupled&lt;/b&gt;"></div>

<div class="diagram"><img src="/img/books/modular-rails/d764f8c411aac360ccdf68d2c3948a730f6fea8ffdad8eafb5949259864ba99e.svg" alt="Mermaid diagram: Shared DB&lt;br/&gt;(one schema)"></div>

<p>Most Rails engine architectures live at the left end of this spectrum – and for good reason. Move rightward only when you have a concrete driver (regulation, scaling, service extraction).</p>

<p>For Rails engines, the first two positions are realistic:</p>

<h3 id="shared-database-one-schema-default">Shared database, one schema (default)</h3>

<p>All engines use the same database and schema. Tables are differentiated by naming convention (prefixes). This is the default when you use <code>isolate_namespace</code>.</p>

<p>Use this when:</p>
<ul>
  <li>All engines deploy together</li>
  <li>Cross-engine queries are common</li>
  <li>Transaction atomicity matters</li>
  <li>Your team is small to medium</li>
</ul>

<h3 id="separate-schemas-same-database">Separate schemas, same database</h3>

<p>Each engine gets its own PostgreSQL schema. Configure Active Record to use different schemas:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/application_record.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">ApplicationRecord</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span>
    <span class="nb">self</span><span class="p">.</span><span class="nf">abstract_class</span> <span class="o">=</span> <span class="kp">true</span>

    <span class="n">connects_to</span> <span class="ss">database: </span><span class="p">{</span>
      <span class="ss">writing: :billing</span><span class="p">,</span>
      <span class="ss">reading: :billing_replica</span>
    <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/database.yml</span>
<span class="na">production</span><span class="pi">:</span>
  <span class="na">primary</span><span class="pi">:</span>
    <span class="na">database</span><span class="pi">:</span> <span class="s">myapp_production</span>
    <span class="na">schema_search_path</span><span class="pi">:</span> <span class="s">public</span>
  <span class="na">billing</span><span class="pi">:</span>
    <span class="na">database</span><span class="pi">:</span> <span class="s">myapp_production</span>
    <span class="na">schema_search_path</span><span class="pi">:</span> <span class="s">billing</span>
  <span class="na">billing_replica</span><span class="pi">:</span>
    <span class="na">database</span><span class="pi">:</span> <span class="s">myapp_production</span>
    <span class="na">schema_search_path</span><span class="pi">:</span> <span class="s">billing</span>
    <span class="na">replica</span><span class="pi">:</span> <span class="kc">true</span>
</code></pre></div></div>

<blockquote>
  <p><strong>Caveat:</strong> Each <code>connects_to</code> entry creates a separate connection pool, even when pointing at the same database. With multiple engines, this multiplies your connection count. For PostgreSQL schemas on the same database, consider setting <code>schema_search_path</code> on the primary connection instead of using <code>connects_to</code>.</p>
</blockquote>

<p>Use this when:</p>
<ul>
  <li>You want clearer schema ownership</li>
  <li>Different engines need different connection pool sizes</li>
  <li>You’re preparing for eventual database separation</li>
</ul>

<h3 id="separate-databases">Separate databases</h3>

<p>Each engine connects to its own database. This is the prerequisite for extracting an engine into a standalone service.</p>

<p>Use this only when:</p>
<ul>
  <li>The engine has fundamentally different scaling requirements</li>
  <li>Regulatory requirements demand data isolation</li>
  <li>You’re actively extracting the engine into a service</li>
</ul>

<p>For most Rails applications with engines, the shared database approach is correct. It gives you all the benefits of engine isolation (code boundaries, independent tests, clear ownership) without the complexity of distributed data.</p>

<hr />

<h2 id="read-models-and-cross-engine-queries">Read Models and Cross-Engine Queries</h2>

<p>Sometimes one engine needs to display data from another engine. The reporting engine needs to show invoice totals. The admin panel needs to list notifications alongside user details.</p>

<h3 id="option-1-read-through-the-engines-models">Option 1: Read through the engine’s models</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In the reporting engine or host app</span>
<span class="n">user</span> <span class="o">=</span> <span class="no">User</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:id</span><span class="p">])</span>
<span class="n">invoices</span> <span class="o">=</span> <span class="n">user</span><span class="p">.</span><span class="nf">invoices</span>  <span class="c1"># Through the Billable concern</span>
<span class="n">total</span> <span class="o">=</span> <span class="n">invoices</span><span class="p">.</span><span class="nf">sum</span><span class="p">(</span><span class="ss">:amount_cents</span><span class="p">)</span>
</code></pre></div></div>

<p>This goes through the billing engine’s models, respecting scopes, validations, and any business logic. It’s the simplest approach and works well for read-heavy use cases.</p>

<h3 id="option-2-database-views">Option 2: Database views</h3>

<p>For complex reporting queries that span multiple engines, create a database view:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># db/migrate/XXXXXX_create_revenue_summary_view.rb (host app)</span>

<span class="k">class</span> <span class="nc">CreateRevenueSummaryView</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">8.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">up</span>
    <span class="n">execute</span> <span class="o">&lt;&lt;~</span><span class="no">SQL</span><span class="sh">
      CREATE VIEW revenue_summaries AS
      SELECT
        billing_invoices.user_id,
        DATE_TRUNC('month', billing_invoices.issued_at) AS month,
        SUM(billing_invoices.amount_cents) AS total_cents,
        COUNT(*) AS invoice_count
      FROM billing_invoices
      WHERE billing_invoices.paid_at IS NOT NULL
      GROUP BY billing_invoices.user_id, DATE_TRUNC('month', billing_invoices.issued_at)
</span><span class="no">    SQL</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">down</span>
    <span class="n">execute</span> <span class="s2">"DROP VIEW revenue_summaries"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/models/revenue_summary.rb (host app, read-only)</span>

<span class="k">class</span> <span class="nc">RevenueSummary</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="nb">self</span><span class="p">.</span><span class="nf">primary_key</span> <span class="o">=</span> <span class="s2">"user_id"</span>

  <span class="n">belongs_to</span> <span class="ss">:user</span>

  <span class="k">def</span> <span class="nf">readonly?</span>
    <span class="kp">true</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The view lives in the host app (it spans engine boundaries). The model is read-only. The reporting engine or admin panel queries it without needing to understand the billing engine’s schema.</p>

<h2 id="active-record-encryption-across-engines">Active Record Encryption Across Engines</h2>

<p>Rails 7+ ships Active Record Encryption for encrypting columns at rest. When engines handle sensitive data – payment details in billing, personal information in a user profile engine – encryption is the right tool. But it has implications for engine architecture.</p>

<h3 id="where-encryption-keys-live">Where encryption keys live</h3>

<p>Encryption keys are configured in the host application’s credentials:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/credentials.yml.enc</span>
<span class="na">active_record_encryption</span><span class="pi">:</span>
  <span class="na">primary_key</span><span class="pi">:</span> <span class="s">&lt;key&gt;</span>
  <span class="na">deterministic_key</span><span class="pi">:</span> <span class="s">&lt;key&gt;</span>
  <span class="na">key_derivation_salt</span><span class="pi">:</span> <span class="s">&lt;salt&gt;</span>
</code></pre></div></div>

<p>Engines don’t configure their own keys. They declare which columns are encrypted, and the host app’s key configuration applies at runtime:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/payment_method.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">PaymentMethod</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="n">encrypts</span> <span class="ss">:card_number</span><span class="p">,</span> <span class="ss">deterministic: </span><span class="kp">true</span>
    <span class="n">encrypts</span> <span class="ss">:card_holder_name</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This is the right separation. The engine owns the schema (which fields are sensitive), and the host app owns the operational concern (which keys to use, rotation schedules). An engine shouldn’t need its own key management.</p>

<h3 id="the-join-and-search-limitation">The join and search limitation</h3>

<p>Encrypted columns can’t be joined or used in cross-engine queries. This is by design – the database sees ciphertext, not cleartext – but it catches people off guard:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># This will NOT work:</span>
<span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">joins</span><span class="p">(</span><span class="ss">:payment_method</span><span class="p">)</span>
  <span class="p">.</span><span class="nf">where</span><span class="p">(</span><span class="ss">billing_payment_methods: </span><span class="p">{</span> <span class="ss">card_number: </span><span class="s2">"4242..."</span> <span class="p">})</span>

<span class="c1"># Instead, look up in two steps:</span>
<span class="n">payment_method</span> <span class="o">=</span> <span class="no">Billing</span><span class="o">::</span><span class="no">PaymentMethod</span><span class="p">.</span><span class="nf">find_by</span><span class="p">(</span><span class="ss">card_number: </span><span class="s2">"4242..."</span><span class="p">)</span>
<span class="n">invoices</span> <span class="o">=</span> <span class="n">payment_method</span><span class="p">.</span><span class="nf">invoices</span>
</code></pre></div></div>

<p>Deterministic encryption allows <code>find_by</code> on a single table (the same plaintext always produces the same ciphertext), but you can’t join on encrypted columns across tables. This is a hard constraint, not a workaround-able limitation.</p>

<h3 id="recommendation-for-pii-handling-engines">Recommendation for PII-handling engines</h3>

<p>If an engine handles PII or payment data:</p>

<ol>
  <li><strong>Encrypt at the model level</strong> using <code>encrypts</code> – the engine declares intent, the host provides keys</li>
  <li><strong>Don’t expose encrypted fields in cross-engine events</strong> – pass IDs, not sensitive data</li>
  <li><strong>Document which columns are encrypted</strong> in the engine’s README – other developers need to know that certain fields can’t be used in database-level queries</li>
</ol>

<p>The encryption boundary reinforces the data ownership boundary. If the billing engine encrypts payment details, no other engine can query those details directly – they must go through the billing engine’s interface. This is the architectural constraint doing exactly what it should.</p>

<hr />

<h2 id="multi-tenancy-and-engine-boundaries">Multi-Tenancy and Engine Boundaries</h2>

<p>Multi-tenancy – serving multiple customers from a single application – adds a dimension that catches people off guard when they adopt engines. You’ve carefully drawn data ownership lines between engines, but now every engine’s data must also be scoped to the current tenant. These two concerns intersect, and getting the intersection wrong means data leaks between customers.</p>

<h3 id="row-level-tenancy-with-engines">Row-level tenancy with engines</h3>

<p>This is the most common approach in Rails, and the one I’d recommend starting with. Every engine’s models scope queries by a tenant identifier – typically an <code>organisation_id</code> or <code>account_id</code>.</p>

<p>Each engine defines its own concern for this:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/concerns/billing/tenant_scoped.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">TenantScoped</span>
    <span class="kp">extend</span> <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Concern</span>

    <span class="n">included</span> <span class="k">do</span>
      <span class="n">belongs_to</span> <span class="ss">:organisation</span>

      <span class="c1"># WARNING: default_scope is convenient but dangerous for tenancy. If</span>
      <span class="c1"># Current.organisation_id is nil (console sessions, background jobs</span>
      <span class="c1"># before context is restored, tests without setup), this scope silently</span>
      <span class="c1"># returns ALL records across ALL tenants -- a data leak. Consider using</span>
      <span class="c1"># an explicit scope method or a strict "raise if nil" guard instead.</span>
      <span class="n">default_scope</span> <span class="p">{</span> <span class="n">where</span><span class="p">(</span><span class="ss">organisation_id: </span><span class="no">Current</span><span class="p">.</span><span class="nf">organisation_id</span><span class="p">)</span> <span class="k">if</span> <span class="no">Current</span><span class="p">.</span><span class="nf">organisation_id</span> <span class="p">}</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The host app is responsible for setting <code>Current.organisation_id</code>. This typically happens in middleware or a <code>before_action</code> in the base controller – resolve the tenant from the subdomain, the session, or a header, and set it on <code>Current</code>. Each engine applies its own <code>TenantScoped</code> concern independently. No engine needs to know how tenant resolution works.</p>

<h3 id="schema-per-tenant-with-engines">Schema-per-tenant with engines</h3>

<p>The alternative is PostgreSQL schemas – one schema per tenant, with each engine’s tables replicated in every tenant schema. Gems like <code>acts_as_tenant</code> (row-level scoping) or the <code>ros-apartment</code> fork (schema switching) handle this. (The original <code>apartment</code> gem is effectively unmaintained and has compatibility issues with Rails 7+; avoid it for new projects.) The key thing is that engines don’t change at all:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Each engine's ApplicationRecord uses the same connection</span>
<span class="c1"># The host app switches the schema based on the current tenant</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">ApplicationRecord</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span>
    <span class="nb">self</span><span class="p">.</span><span class="nf">abstract_class</span> <span class="o">=</span> <span class="kp">true</span>
    <span class="c1"># Schema switching is handled at the connection level by the host app</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The host app switches the search path before the request reaches any engine code. From the engine’s perspective, it’s just querying its tables – it doesn’t know those tables live in a tenant-specific schema.</p>

<h3 id="the-key-insight">The key insight</h3>

<p>Engines don’t need to know about multi-tenancy. The host app handles tenant resolution and scope switching. Engines receive a pre-scoped context and operate within it.</p>

<p>This is dependency inversion applied to tenancy. The engine defines what data it needs, and the host app ensures that data is properly scoped to the current tenant. If you later switch from row-level to schema-level tenancy, the engine code doesn’t change – only the host app’s resolution strategy does.</p>

<div class="diagram"><img src="/img/books/modular-rails/8c9fe8e2636cbd28cf3122cc0ab686eb7a0b7ea89be92af70817a352abb0285a.svg" alt="Mermaid diagram: Tenant A Request"></div>

<h3 id="where-it-gets-complicated">Where it gets complicated</h3>

<p>Three scenarios break the clean abstraction:</p>

<p><strong>Cross-tenant reporting.</strong> An admin dashboard that shows revenue across all tenants needs to escape the default scope. This is deliberate – you <code>unscoped</code> the query and accept the responsibility. Keep these queries in the host app or a dedicated reporting context, never inside an engine’s normal business logic.</p>

<p><strong>Events must carry tenant context.</strong> When an engine publishes an event, the subscriber might run in a different context (a background job, a different request). The tenant ID must travel with the payload:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">,</span> <span class="p">{</span>
  <span class="ss">invoice_id: </span><span class="nb">id</span><span class="p">,</span>
  <span class="ss">user_id: </span><span class="n">user_id</span><span class="p">,</span>
  <span class="ss">organisation_id: </span><span class="n">organisation_id</span><span class="p">,</span>  <span class="c1"># Always include tenant context</span>
  <span class="ss">amount_cents: </span><span class="n">amount_cents</span>
<span class="p">})</span>
</code></pre></div></div>

<p>If you omit <code>organisation_id</code> from the event payload, any subscriber that processes this event asynchronously will have no way to restore the correct tenant scope.</p>

<p><strong>Background jobs must restore tenant context.</strong> The job runs outside the request cycle, so <code>Current.organisation_id</code> is nil. Every job that touches tenant-scoped data must restore context before doing anything else:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">Notifications::SendNotificationJob</span> <span class="o">&lt;</span> <span class="no">ApplicationJob</span>
  <span class="k">def</span> <span class="nf">perform</span><span class="p">(</span><span class="n">organisation_id</span><span class="p">:,</span> <span class="n">recipient_id</span><span class="p">:,</span> <span class="n">subject</span><span class="p">:,</span> <span class="n">body</span><span class="p">:)</span>
    <span class="no">Current</span><span class="p">.</span><span class="nf">organisation_id</span> <span class="o">=</span> <span class="n">organisation_id</span>  <span class="c1"># Restore tenant context</span>
    <span class="c1"># ... rest of job</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This is easy to forget and hard to catch in tests (where you often set up tenant context globally). I’d recommend a linter or a base job class that raises if <code>organisation_id</code> isn’t provided.</p>

<hr />

<h2 id="when-to-split-the-database">When to Split the Database</h2>

<p>You should split the database when – and only when – one of these is true:</p>

<ol>
  <li><strong>Regulatory requirement.</strong> PCI compliance says payment card data must be in a separate database with different access controls.</li>
  <li><strong>Scaling requirement.</strong> The billing engine’s write volume is overwhelming the shared database, and the other engines don’t need that write capacity.</li>
  <li><strong>Service extraction.</strong> You’re promoting the engine to a standalone service with its own deployment.</li>
  <li><strong>Availability requirement.</strong> The billing database needs 99.99% uptime while the notification database can tolerate 99.9%.</li>
</ol>

<p>If none of these apply, keep the shared database. The complexity of distributed data (eventual consistency, saga patterns, data synchronisation) is far greater than the complexity of a shared database with prefixed tables.</p>

<p>Martin’s advice applies perfectly: defer the decision. A shared database with clear ownership conventions is a decision you can change later. Split databases are much harder to merge back together.</p>

<hr />

<p><em>Data ownership is the hardest part of modular architecture. Start with a shared database, establish ownership conventions, and split only when you have a concrete reason. In the next chapter, we’ll cover the testing strategy that gives you confidence in all of this.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-11-managing-inter-engine-dependencies/">&larr; Managing Inter-Engine Dependencies</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-13-testing-strategy/">Testing Strategy for a Modular Monolith &rarr;</a>
</nav>
{% endraw %}
