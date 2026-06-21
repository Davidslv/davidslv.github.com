---
layout: book
book: modular_rails
title: "Managing Inter-Engine Dependencies"
permalink: /books/modular-rails/chapter-11-managing-inter-engine-dependencies/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-10-extracting-your-first-engine/">&larr; Extracting Your First Engine</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-12-data-ownership/">Data Ownership and the Database Question &rarr;</a>
</nav>

<h1 id="chapter-11-managing-inter-engine-dependencies">Chapter 11: Managing Inter-Engine Dependencies</h1>

<blockquote>
  <p><em>“Allow no cycles in the component dependency graph.”</em><br />
– Robert C. Martin, <em>Clean Architecture</em> (Acyclic Dependencies Principle)</p>
</blockquote>

<p>Your first engine was easy. It depended on the host app and nothing else. Your second engine was fine too. But now you have five engines, and the billing engine needs to know about the subscription rules in the core engine, and the notification engine needs to react to billing events, and someone just proposed that the reporting engine should depend on both billing and notifications.</p>

<p>This is where engine architectures succeed or fail. Dependency management isn’t glamorous, but it’s the difference between an architecture that scales and one that collapses into a distributed monolith.</p>

<hr />

<h2 id="declaring-dependencies-explicitly">Declaring Dependencies Explicitly</h2>

<p>When one engine depends on another, declare it in the gemspec:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/billing.gemspec</span>

<span class="n">spec</span><span class="p">.</span><span class="nf">add_dependency</span> <span class="s2">"core"</span>
</code></pre></div></div>

<p>This means the billing engine requires the core engine to be loaded. Bundler enforces this at install time. If someone tries to use billing without core, it fails loudly.</p>

<p>What you should <strong>not</strong> do:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># BAD: implicit dependency through constant reference</span>
<span class="c1"># The billing engine references Core::Auditable but doesn't declare the dependency</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Invoice</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
    <span class="kp">include</span> <span class="no">Core</span><span class="o">::</span><span class="no">Auditable</span>  <span class="c1"># Works at runtime but undeclared in gemspec</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This works until someone loads the billing engine without the core engine. Then it fails with a <code>NameError</code> at runtime, in production, on a Friday evening.</p>

<p><strong>Rule: if you reference a constant from another engine, declare the dependency in your gemspec.</strong></p>

<hr />

<h2 id="the-acyclic-dependencies-principle">The Acyclic Dependencies Principle</h2>

<p>Martin’s Acyclic Dependencies Principle states that the dependency graph between components must be a Directed Acyclic Graph (DAG). No cycles.</p>

<div class="diagram"><img src="/img/books/modular-rails/82b4b606a2319907d2453790bb7ccd6acd99b21fa9e926a6a02a2594eab408d2.svg" alt="Mermaid diagram: GOOD — acyclic"></div>

<p>When billing depends on notifications and notifications depends on billing, you can’t change either engine without potentially breaking the other. You can’t test either engine without loading both. You’ve created a distributed monolith – all the overhead of engines with none of the isolation benefits.</p>

<div class="diagram"><img src="/img/books/modular-rails/8cb9404ce85e9e1d4093a4a28005245d50e651f7ea367569df169e8bae1b66d0.svg" alt="Mermaid diagram: Before: Cycle"></div>

<p>The fix: replace the direct dependency in one direction with event-based communication. Billing publishes; Notifications subscribes. No cycle.</p>

<h3 id="detecting-cycles">Detecting cycles</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1">#!/usr/bin/env ruby</span>
<span class="c1"># scripts/detect_cycles.rb</span>

<span class="nb">require</span> <span class="s2">"set"</span>

<span class="c1"># Parse dependencies from gemspecs</span>
<span class="n">engines_dir</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">expand_path</span><span class="p">(</span><span class="s2">"../engines"</span><span class="p">,</span> <span class="n">__dir__</span><span class="p">)</span>
<span class="n">engine_names</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"</span><span class="si">#{</span><span class="n">engines_dir</span><span class="si">}</span><span class="s2">/*/"</span><span class="p">).</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">d</span><span class="o">|</span> <span class="no">File</span><span class="p">.</span><span class="nf">basename</span><span class="p">(</span><span class="n">d</span><span class="p">)</span> <span class="p">}</span>

<span class="n">dependencies</span> <span class="o">=</span> <span class="p">{}</span>
<span class="n">engine_names</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="nb">name</span><span class="o">|</span>
  <span class="n">gemspec</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"</span><span class="si">#{</span><span class="n">engines_dir</span><span class="si">}</span><span class="s2">/</span><span class="si">#{</span><span class="nb">name</span><span class="si">}</span><span class="s2">/*.gemspec"</span><span class="p">).</span><span class="nf">first</span>
  <span class="k">next</span> <span class="k">unless</span> <span class="n">gemspec</span>

  <span class="n">content</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">read</span><span class="p">(</span><span class="n">gemspec</span><span class="p">)</span>
  <span class="n">deps</span> <span class="o">=</span> <span class="n">content</span><span class="p">.</span><span class="nf">scan</span><span class="p">(</span><span class="sr">/add_dependency\s+["'](\w+)["']/</span><span class="p">).</span><span class="nf">flatten</span>
  <span class="n">dependencies</span><span class="p">[</span><span class="nb">name</span><span class="p">]</span> <span class="o">=</span> <span class="n">deps</span> <span class="o">&amp;</span> <span class="n">engine_names</span>
<span class="k">end</span>

<span class="c1"># DFS cycle detection</span>
<span class="k">def</span> <span class="nf">find_cycle</span><span class="p">(</span><span class="n">graph</span><span class="p">,</span> <span class="n">node</span><span class="p">,</span> <span class="n">visited</span> <span class="o">=</span> <span class="no">Set</span><span class="p">.</span><span class="nf">new</span><span class="p">,</span> <span class="n">path</span> <span class="o">=</span> <span class="p">[])</span>
  <span class="k">return</span> <span class="n">path</span> <span class="o">+</span> <span class="p">[</span><span class="n">node</span><span class="p">]</span> <span class="k">if</span> <span class="n">path</span><span class="p">.</span><span class="nf">include?</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>
  <span class="k">return</span> <span class="kp">nil</span> <span class="k">if</span> <span class="n">visited</span><span class="p">.</span><span class="nf">include?</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>

  <span class="n">visited</span><span class="p">.</span><span class="nf">add</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>
  <span class="p">(</span><span class="n">graph</span><span class="p">[</span><span class="n">node</span><span class="p">]</span> <span class="o">||</span> <span class="p">[]).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">dep</span><span class="o">|</span>
    <span class="n">cycle</span> <span class="o">=</span> <span class="n">find_cycle</span><span class="p">(</span><span class="n">graph</span><span class="p">,</span> <span class="n">dep</span><span class="p">,</span> <span class="n">visited</span><span class="p">,</span> <span class="n">path</span> <span class="o">+</span> <span class="p">[</span><span class="n">node</span><span class="p">])</span>
    <span class="k">return</span> <span class="n">cycle</span> <span class="k">if</span> <span class="n">cycle</span>
  <span class="k">end</span>
  <span class="kp">nil</span>
<span class="k">end</span>

<span class="n">found_cycle</span> <span class="o">=</span> <span class="kp">false</span>
<span class="n">engine_names</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="nb">name</span><span class="o">|</span>
  <span class="n">cycle</span> <span class="o">=</span> <span class="n">find_cycle</span><span class="p">(</span><span class="n">dependencies</span><span class="p">,</span> <span class="nb">name</span><span class="p">)</span>
  <span class="k">if</span> <span class="n">cycle</span>
    <span class="nb">puts</span> <span class="s2">"CYCLE: </span><span class="si">#{</span><span class="n">cycle</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s1">' → '</span><span class="p">)</span><span class="si">}</span><span class="s2">"</span>
    <span class="n">found_cycle</span> <span class="o">=</span> <span class="kp">true</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="k">if</span> <span class="n">found_cycle</span>
  <span class="nb">exit</span> <span class="mi">1</span>
<span class="k">else</span>
  <span class="nb">puts</span> <span class="s2">"No dependency cycles detected ✓"</span>
  <span class="nb">puts</span>
  <span class="nb">puts</span> <span class="s2">"Dependency graph:"</span>
  <span class="n">dependencies</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">engine</span><span class="p">,</span> <span class="n">deps</span><span class="o">|</span>
    <span class="k">if</span> <span class="n">deps</span><span class="p">.</span><span class="nf">empty?</span>
      <span class="nb">puts</span> <span class="s2">"  </span><span class="si">#{</span><span class="n">engine</span><span class="si">}</span><span class="s2"> (no engine dependencies)"</span>
    <span class="k">else</span>
      <span class="nb">puts</span> <span class="s2">"  </span><span class="si">#{</span><span class="n">engine</span><span class="si">}</span><span class="s2"> → </span><span class="si">#{</span><span class="n">deps</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s1">', '</span><span class="p">)</span><span class="si">}</span><span class="s2">"</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Run this as a CI step. If a cycle is introduced, the build fails.</p>

<p>A healthy dependency graph after breaking cycles looks like this – a strict DAG (directed acyclic graph) where dependencies flow downward:</p>

<div class="diagram"><img src="/img/books/modular-rails/ae951f90fa7f9e4377decc4bcc0db3a602933a782bf861e6bb40bf7ca9cfaa28.svg" alt="Mermaid diagram: Core Engine&lt;br/&gt;(auditing, shared concerns)"></div>

<p>Every arrow points downward toward the more stable layer. No arrow points sideways between feature engines. This is the acyclic dependency principle in practice.</p>

<hr />

<h2 id="breaking-cycles-with-dependency-inversion">Breaking Cycles with Dependency Inversion</h2>

<p>When you discover a cycle, you have three strategies:</p>

<h3 id="strategy-1-events">Strategy 1: Events</h3>

<p>The most common fix. Replace the direct dependency in one direction with event-based communication (see Chapter 8, Pattern 5).</p>

<p><strong>Before (cycle):</strong></p>
<pre><code>billing → notifications (billing sends notifications directly)
notifications → billing (notifications queries invoice status)
</code></pre>

<p><strong>After (no cycle):</strong></p>
<pre><code>billing → (publishes events)
notifications → (subscribes to billing events, no dependency on billing)
</code></pre>

<p>Billing publishes <code>"invoice.created.billing"</code>. Notifications subscribes. The dependency is removed. Billing doesn’t know notifications exists.</p>

<p>For the reverse direction (notifications querying invoice status), pass the data through the event payload instead of querying the billing engine directly.</p>

<h3 id="strategy-2-extract-a-shared-interface">Strategy 2: Extract a shared interface</h3>

<p>When two engines share a concept, extract it into a third engine that both depend on.</p>

<p><strong>Before:</strong></p>
<pre><code>billing → notifications (both use MoneyFormatter)
notifications → billing
</code></pre>

<p><strong>After:</strong></p>
<pre><code>core (defines MoneyFormatter)
  ↑
billing    notifications (both depend on core, not each other)
</code></pre>

<h3 id="strategy-3-invert-the-dependency-direction">Strategy 3: Invert the dependency direction</h3>

<p>Sometimes the cycle exists because the dependency is pointing the wrong way. The less stable engine should depend on the more stable one, never the reverse.</p>

<p>If billing is more stable than notifications (it changes less often, more things depend on it), then notifications should depend on billing – but billing should never depend on notifications.</p>

<hr />

<h2 id="shared-kernel-the-core-engine-pattern">Shared Kernel: The Core Engine Pattern</h2>

<p>Most modular Rails applications end up with a “core” or “shared” engine. This engine contains:</p>

<ul>
  <li>Common concerns (auditing, soft deletion, archiving)</li>
  <li>Shared value objects (money, date ranges)</li>
  <li>Base classes and modules that multiple engines extend</li>
  <li>Cross-cutting utilities (SFTP clients, API helpers)</li>
</ul>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/core/app/models/concerns/core/auditable.rb</span>
<span class="c1"># engines/core/app/models/concerns/core/archivable.rb</span>
<span class="c1"># engines/core/app/models/concerns/core/ransackable.rb</span>
<span class="c1"># engines/core/lib/core/money.rb</span>
</code></pre></div></div>

<h3 id="keep-the-core-engine-small">Keep the core engine small</h3>

<p>The shared kernel should be:</p>
<ul>
  <li><strong>Small</strong> – only genuinely shared code</li>
  <li><strong>Stable</strong> – rarely changed, since all other engines depend on it</li>
  <li><strong>Abstract</strong> – interfaces and concerns, not business logic</li>
</ul>

<p>If your core engine keeps growing, ask: “Does this really need to be shared, or can it live in the domain engine that uses it most?” Push domain logic into domain engines. The core should contain only cross-cutting concerns that genuinely apply everywhere.</p>

<div class="diagram"><img src="/img/books/modular-rails/54b2b736d5ba7aed11897fee2e842b9595960599549da035f47e63c6279fcaf7.svg" alt="Mermaid diagram: Core Engine&lt;br/&gt;Auditable, Archivable,&lt;br/&gt;Money, DateRange"></div>

<p>The core engine is the shared kernel: small, stable, and abstract. Feature engines depend on it, never the reverse.</p>

<h3 id="the-dependency-direction-rule">The dependency direction rule</h3>

<pre><code>core (most stable, depended upon by everything)
  ↑
billing, notifications, reporting (less stable, depend on core)
</code></pre>

<p>Core depends on nothing (except Rails itself). Everything else may depend on core. Feature engines should not depend on each other without careful consideration.</p>

<hr />

<h2 id="event-driven-communication-between-engines">Event-Driven Communication Between Engines</h2>

<p>Using the event pattern from Chapter 8 (Pattern 5), engines communicate through <code>ActiveSupport::Notifications</code> without introducing direct dependencies. Chapter 8 covers the mechanics in full: naming conventions (<code>entity.action.engine_name</code>), self-contained payload design, synchronous vs asynchronous subscribers with Active Job, and the <code>if defined?</code> guard pattern.</p>

<p>Here the focus is on when events solve dependency problems – specifically, breaking cycles and keeping the dependency graph acyclic.</p>

<hr />

<h2 id="dependency-graph-visualisation">Dependency Graph Visualisation</h2>

<p>As your engine count grows, keep the dependency graph visible. A simple Rake task:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># lib/tasks/engines.rake</span>

<span class="n">namespace</span> <span class="ss">:engines</span> <span class="k">do</span>
  <span class="n">desc</span> <span class="s2">"Print engine dependency graph"</span>
  <span class="n">task</span> <span class="ss">:deps</span> <span class="k">do</span>
    <span class="n">engines_dir</span> <span class="o">=</span> <span class="no">Rails</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"engines"</span><span class="p">)</span>

    <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"</span><span class="si">#{</span><span class="n">engines_dir</span><span class="si">}</span><span class="s2">/*/"</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">dir</span><span class="o">|</span>
      <span class="nb">name</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">basename</span><span class="p">(</span><span class="n">dir</span><span class="p">)</span>
      <span class="n">gemspec</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"</span><span class="si">#{</span><span class="n">dir</span><span class="si">}</span><span class="s2">/*.gemspec"</span><span class="p">).</span><span class="nf">first</span>
      <span class="k">next</span> <span class="k">unless</span> <span class="n">gemspec</span>

      <span class="n">content</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">read</span><span class="p">(</span><span class="n">gemspec</span><span class="p">)</span>
      <span class="n">deps</span> <span class="o">=</span> <span class="n">content</span><span class="p">.</span><span class="nf">scan</span><span class="p">(</span><span class="sr">/add_dependency\s+["'](\w+)["']/</span><span class="p">).</span><span class="nf">flatten</span>
      <span class="n">engine_deps</span> <span class="o">=</span> <span class="n">deps</span> <span class="o">&amp;</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"</span><span class="si">#{</span><span class="n">engines_dir</span><span class="si">}</span><span class="s2">/*/"</span><span class="p">).</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">d</span><span class="o">|</span> <span class="no">File</span><span class="p">.</span><span class="nf">basename</span><span class="p">(</span><span class="n">d</span><span class="p">)</span> <span class="p">}</span>

      <span class="k">if</span> <span class="n">engine_deps</span><span class="p">.</span><span class="nf">any?</span>
        <span class="nb">puts</span> <span class="s2">"</span><span class="si">#{</span><span class="nb">name</span><span class="si">}</span><span class="s2"> → </span><span class="si">#{</span><span class="n">engine_deps</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s1">', '</span><span class="p">)</span><span class="si">}</span><span class="s2">"</span>
      <span class="k">else</span>
        <span class="nb">puts</span> <span class="s2">"</span><span class="si">#{</span><span class="nb">name</span><span class="si">}</span><span class="s2"> (no engine dependencies)"</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Run <code>rails engines:deps</code> and keep the output in the README or a wiki page. When someone proposes a new dependency, the graph makes the impact visible.</p>

<hr />

<p><em>Dependencies between engines are the load-bearing walls of your architecture. Declare them explicitly, prevent cycles, use events for cross-engine communication, and keep the shared kernel small. In the next chapter, we tackle the hardest problem: who owns the data?</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-10-extracting-your-first-engine/">&larr; Extracting Your First Engine</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-12-data-ownership/">Data Ownership and the Database Question &rarr;</a>
</nav>
{% endraw %}
