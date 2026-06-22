---
layout: book
book: modular_rails
title: "The Hard Parts — Reasoning About Trade-offs"
permalink: /books/modular-rails/chapter-03-the-hard-parts/
description: "Architecture is trade-off analysis, not best practices — a framework for reasoning about Rails engine decisions, from Ford & Richards' The Hard Parts."
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-02-clean-architecture-for-rubyists/">&larr; Clean Architecture for Rubyists</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-04-extreme-programming-and-emergent-design/">Extreme Programming and Emergent Design &rarr;</a>
</nav>

<h1 id="chapter-3-the-hard-parts--reasoning-about-trade-offs">Chapter 3: The Hard Parts – Reasoning About Trade-offs</h1>

<blockquote>
  <p><em>“There are no best practices in architecture, only trade-offs.”</em><br />
– Neal Ford &amp; Mark Richards, <em>Software Architecture: The Hard Parts</em></p>
</blockquote>

<p>Clean Architecture gives us principles. XP gives us practices. But when you’re standing in front of your team’s whiteboard, marker in hand, deciding whether to extract the billing domain into its own engine or keep it in the host app – principles and practices aren’t enough. You need a method for reasoning about trade-offs.</p>

<p>Neal Ford and Mark Richards, in <em>Software Architecture: The Hard Parts</em>, provide that method. Their core argument: every architectural decision is a trade-off, and the architect’s job is not to find the “right” answer but to find the “least worst” answer for a given context, document why, and revisit when the context changes.</p>

<p>This chapter introduces their analytical tools and shows how to apply them when decomposing a Rails application.</p>

<hr />

<h2 id="architecture-as-trade-off-analysis">Architecture as Trade-off Analysis</h2>

<p>The moment you decide to extract a domain into an engine, you’re making a trade-off:</p>

<p><strong>You gain:</strong></p>
<ul>
  <li>Namespace isolation (no accidental coupling)</li>
  <li>Independent test suites (faster feedback)</li>
  <li>Clear ownership boundaries (easier team scaling)</li>
  <li>Explicit interfaces (the concern/configuration pattern)</li>
</ul>

<p><strong>You pay:</strong></p>
<ul>
  <li>Maintenance overhead (another repository, another gemspec, another CI pipeline)</li>
  <li>Integration complexity (version management, migration coordination)</li>
  <li>Indirection (debugging across engine boundaries takes more effort)</li>
  <li>Extraction cost (moving code, updating references, running both test suites)</li>
</ul>

<p>Neither list is universally longer than the other. The trade-off depends on context: the size of your team, the rate of change in the domain, the coupling between domains, the cost of accidental changes.</p>

<p>A team of three working on a 30-model application has different trade-offs than a team of forty working on a 200-model application. The first team’s biggest cost is coordination overhead from unnecessary engines. The second team’s biggest cost is accidental coupling from missing boundaries.</p>

<p>Good architecture doesn’t eliminate trade-offs. It makes them explicit and revisitable.</p>

<hr />

<h2 id="fitness-functions-for-modularity">Fitness Functions for Modularity</h2>

<p>A fitness function is an objective, measurable check on whether your architecture meets a specific goal. Ford and Richards borrow the term from evolutionary computing: just as a fitness function guides evolution toward better organisms, an architectural fitness function guides your system toward better structure.</p>

<p>For a modular Rails application, useful fitness functions include:</p>

<h3 id="1-component-coupling">1. Component coupling</h3>

<p>How many cross-engine constant references exist? If your billing engine references 15 classes from the notification engine, your boundary is leaking.</p>

<p>You can measure this with a simple script:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># scripts/measure_coupling.rb</span>

<span class="n">engines</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"engines/*/"</span><span class="p">).</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">d</span><span class="o">|</span> <span class="no">File</span><span class="p">.</span><span class="nf">basename</span><span class="p">(</span><span class="n">d</span><span class="p">)</span> <span class="p">}</span>

<span class="n">engines</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">engine</span><span class="o">|</span>
  <span class="n">source_files</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"engines/</span><span class="si">#{</span><span class="n">engine</span><span class="si">}</span><span class="s2">/app/**/*.rb"</span><span class="p">)</span>
  <span class="n">other_engines</span> <span class="o">=</span> <span class="n">engines</span> <span class="o">-</span> <span class="p">[</span><span class="n">engine</span><span class="p">]</span>

  <span class="n">violations</span> <span class="o">=</span> <span class="p">[]</span>

  <span class="n">source_files</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">file</span><span class="o">|</span>
    <span class="n">content</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">read</span><span class="p">(</span><span class="n">file</span><span class="p">)</span>
    <span class="n">other_engines</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">other</span><span class="o">|</span>
      <span class="n">namespace</span> <span class="o">=</span> <span class="n">other</span><span class="p">.</span><span class="nf">camelize</span>
      <span class="k">if</span> <span class="n">content</span><span class="p">.</span><span class="nf">match?</span><span class="p">(</span><span class="sr">/\b</span><span class="si">#{</span><span class="n">namespace</span><span class="si">}</span><span class="sr">::/</span><span class="p">)</span>
        <span class="n">violations</span> <span class="o">&lt;&lt;</span> <span class="p">{</span> <span class="ss">file: </span><span class="n">file</span><span class="p">,</span> <span class="ss">references: </span><span class="n">other</span> <span class="p">}</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="k">if</span> <span class="n">violations</span><span class="p">.</span><span class="nf">any?</span>
    <span class="nb">puts</span> <span class="s2">"</span><span class="se">\n</span><span class="si">#{</span><span class="n">engine</span><span class="si">}</span><span class="s2"> engine references:"</span>
    <span class="n">violations</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">v</span><span class="o">|</span> <span class="nb">puts</span> <span class="s2">"  </span><span class="si">#{</span><span class="n">v</span><span class="p">[</span><span class="ss">:file</span><span class="p">]</span><span class="si">}</span><span class="s2"> -&gt; </span><span class="si">#{</span><span class="n">v</span><span class="p">[</span><span class="ss">:references</span><span class="p">]</span><span class="si">}</span><span class="s2">"</span> <span class="p">}</span>
  <span class="k">else</span>
    <span class="nb">puts</span> <span class="s2">"</span><span class="se">\n</span><span class="si">#{</span><span class="n">engine</span><span class="si">}</span><span class="s2"> engine: no cross-engine references ✓"</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Run this as a CI step. If the count increases, someone has introduced coupling that should go through an event or interface instead.</p>

<h3 id="2-cycle-detection">2. Cycle detection</h3>

<p>The Acyclic Dependencies Principle says your engine dependency graph must be a Directed Acyclic Graph. If billing depends on notifications and notifications depends on billing, you have a cycle. Cycles mean you can’t change either engine without potentially breaking the other.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># scripts/detect_cycles.rb</span>

<span class="nb">require</span> <span class="s2">"set"</span>

<span class="c1"># Parse engine gemspecs for dependencies</span>
<span class="n">dependencies</span> <span class="o">=</span> <span class="p">{}</span>
<span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"engines/*/"</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">dir</span><span class="o">|</span>
  <span class="n">engine</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">basename</span><span class="p">(</span><span class="n">dir</span><span class="p">)</span>
  <span class="n">gemspec</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"</span><span class="si">#{</span><span class="n">dir</span><span class="si">}</span><span class="s2">/*.gemspec"</span><span class="p">).</span><span class="nf">first</span>
  <span class="k">next</span> <span class="k">unless</span> <span class="n">gemspec</span>

  <span class="n">deps</span> <span class="o">=</span> <span class="no">File</span><span class="p">.</span><span class="nf">read</span><span class="p">(</span><span class="n">gemspec</span><span class="p">).</span><span class="nf">scan</span><span class="p">(</span><span class="sr">/add_dependency\s+["'](\w+)["']/</span><span class="p">).</span><span class="nf">flatten</span>
  <span class="n">dependencies</span><span class="p">[</span><span class="n">engine</span><span class="p">]</span> <span class="o">=</span> <span class="n">deps</span> <span class="o">&amp;</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="s2">"engines/*/"</span><span class="p">).</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">d</span><span class="o">|</span> <span class="no">File</span><span class="p">.</span><span class="nf">basename</span><span class="p">(</span><span class="n">d</span><span class="p">)</span> <span class="p">}</span>
<span class="k">end</span>

<span class="c1"># DFS for cycle detection</span>
<span class="k">def</span> <span class="nf">detect_cycle</span><span class="p">(</span><span class="n">graph</span><span class="p">,</span> <span class="n">node</span><span class="p">,</span> <span class="n">visited</span> <span class="o">=</span> <span class="no">Set</span><span class="p">.</span><span class="nf">new</span><span class="p">,</span> <span class="n">path</span> <span class="o">=</span> <span class="p">[])</span>
  <span class="k">return</span> <span class="n">path</span> <span class="o">+</span> <span class="p">[</span><span class="n">node</span><span class="p">]</span> <span class="k">if</span> <span class="n">path</span><span class="p">.</span><span class="nf">include?</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>
  <span class="k">return</span> <span class="kp">nil</span> <span class="k">if</span> <span class="n">visited</span><span class="p">.</span><span class="nf">include?</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>

  <span class="n">visited</span><span class="p">.</span><span class="nf">add</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>
  <span class="n">path</span><span class="p">.</span><span class="nf">push</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>

  <span class="p">(</span><span class="n">graph</span><span class="p">[</span><span class="n">node</span><span class="p">]</span> <span class="o">||</span> <span class="p">[]).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">dep</span><span class="o">|</span>
    <span class="n">cycle</span> <span class="o">=</span> <span class="n">detect_cycle</span><span class="p">(</span><span class="n">graph</span><span class="p">,</span> <span class="n">dep</span><span class="p">,</span> <span class="n">visited</span><span class="p">,</span> <span class="n">path</span><span class="p">)</span>
    <span class="k">return</span> <span class="n">cycle</span> <span class="k">if</span> <span class="n">cycle</span>
  <span class="k">end</span>

  <span class="n">path</span><span class="p">.</span><span class="nf">pop</span>
  <span class="kp">nil</span>
<span class="k">end</span>

<span class="n">dependencies</span><span class="p">.</span><span class="nf">keys</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">engine</span><span class="o">|</span>
  <span class="n">cycle</span> <span class="o">=</span> <span class="n">detect_cycle</span><span class="p">(</span><span class="n">dependencies</span><span class="p">,</span> <span class="n">engine</span><span class="p">)</span>
  <span class="k">if</span> <span class="n">cycle</span>
    <span class="nb">puts</span> <span class="s2">"CYCLE DETECTED: </span><span class="si">#{</span><span class="n">cycle</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s1">' -&gt; '</span><span class="p">)</span><span class="si">}</span><span class="s2">"</span>
    <span class="nb">exit</span> <span class="mi">1</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="nb">puts</span> <span class="s2">"No dependency cycles found ✓"</span>
</code></pre></div></div>

<h3 id="3-cohesion-score">3. Cohesion score</h3>

<p>How often do files within an engine change together relative to files across engine boundaries? High intra-engine co-change and low inter-engine co-change indicates good boundaries. Chapter 9 walks through a complete co-change analysis tool you can run against your git history to measure this.</p>

<hr />

<h2 id="component-coupling-and-connascence">Component Coupling and Connascence</h2>

<p>Ford and Richards revive the concept of connascence, originally introduced by Meilir Page-Jones in 1992 and popularised for a modern audience in Ford and Richards’ <em>Fundamentals of Software Architecture</em> (2020). Connascence provides a more nuanced vocabulary for coupling than simply “high” or “low.”</p>

<p>Two components have connascence when a change in one requires a change in the other. Page-Jones’ full taxonomy includes nine types; we’ll focus on the six most relevant to engine design, ordered from weakest (most acceptable) to strongest (most dangerous):</p>

<div class="diagram"><img src="/img/books/modular-rails/8cbb844f7f00cce25d1ba9290fc68a208783998b6495d6a220631faeee8b327b.svg" alt="Mermaid diagram: Static (source code)"></div>

<p><em>Weaker connascence (top) is easier to detect and cheaper to fix. Stronger connascence (bottom) is harder to see and more dangerous across engine boundaries.</em></p>

<h3 id="static-connascence-visible-in-source-code">Static connascence (visible in source code)</h3>

<p><strong>Connascence of Name:</strong> Two engines share a constant or method name.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Billing engine calls:</span>
<span class="n">user</span><span class="p">.</span><span class="nf">billing_email</span>

<span class="c1"># If User renames this method, billing breaks.</span>
</code></pre></div></div>

<p>This is the weakest form. It’s visible in the code, easy to find with grep, and easy to fix.</p>

<p><strong>Connascence of Type:</strong> Two engines must agree on a data type.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Billing engine expects recipient_id to be an Integer.</span>
<span class="c1"># If the host app changes User IDs to UUIDs, billing breaks.</span>
</code></pre></div></div>

<p><strong>Connascence of Meaning:</strong> Two engines must agree on the interpretation of a value.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Billing engine uses status: 0 for "pending", 1 for "paid", 2 for "failed"</span>
<span class="c1"># If anyone changes what 1 means, billing breaks silently.</span>
</code></pre></div></div>

<p>This is worse than the previous types because the coupling is invisible. The code looks fine – it’s the meaning that’s fragile. Use enums or constants to make it explicit.</p>

<p><strong>Connascence of Algorithm:</strong> Two engines must use the same algorithm.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Billing engine hashes invoice numbers with SHA-256.</span>
<span class="c1"># Reporting engine verifies them with SHA-256.</span>
<span class="c1"># If one changes to SHA-512, verification breaks.</span>
</code></pre></div></div>

<h3 id="dynamic-connascence-visible-only-at-runtime">Dynamic connascence (visible only at runtime)</h3>

<p><strong>Connascence of Execution Order:</strong> Two engines must execute operations in a specific order.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># The subscription engine must create the subscription</span>
<span class="c1"># BEFORE the billing engine generates the first invoice.</span>
</code></pre></div></div>

<p><strong>Connascence of Timing:</strong> Two engines must agree on when something happens.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># The billing engine generates invoices at midnight.</span>
<span class="c1"># The notification engine sends summaries at 6am.</span>
<span class="c1"># If billing runs late, the summary contains stale data.</span>
</code></pre></div></div>

<p>Dynamic connascence is harder to detect, harder to test, and harder to fix. When it appears between engines, it’s a strong signal that the boundary is in the wrong place – perhaps those two engines should be one.</p>

<h3 id="using-connascence-to-evaluate-boundaries">Using connascence to evaluate boundaries</h3>

<p>When you’re deciding whether to extract a domain into an engine, catalogue the connascence between that domain and the rest of the application:</p>

<ul>
  <li><strong>Mostly Name/Type connascence?</strong> The boundary is clean. Extract with confidence.</li>
  <li><strong>Significant Meaning/Algorithm connascence?</strong> Extract the shared meaning into the core engine first, then extract the domain.</li>
  <li><strong>Dynamic connascence (Execution/Timing)?</strong> Think hard. These domains may be too tightly coupled to separate. An engine boundary won’t eliminate the coupling – it’ll just make it harder to see.</li>
</ul>

<hr />

<h2 id="data-ownership-and-data-sovereignty">Data Ownership and Data Sovereignty</h2>

<p>Ford and Richards identify data decomposition as the hardest problem in architectural modularity. It’s easy to split code into engines. It’s hard to split the data those engines operate on. They define a spectrum of data sovereignty – from a shared database with a single schema, through separate schemas in the same database, to fully separate databases – each trading coupling for operational complexity. For most Rails engine architectures, a shared database with table name prefixes is the right starting point; move along the spectrum only when you have a concrete driver. Chapter 12 covers data ownership in detail, including migration strategies and cross-engine queries.</p>

<hr />

<h2 id="the-architecture-decision-record">The Architecture Decision Record</h2>

<p>When you make a trade-off, write it down. An Architecture Decision Record (ADR) captures:</p>

<ol>
  <li><strong>Context:</strong> What situation are you facing?</li>
  <li><strong>Decision:</strong> What did you decide?</li>
  <li><strong>Consequences:</strong> What are the expected outcomes, both positive and negative?</li>
</ol>

<p>Here’s a real example:</p>

<div class="language-markdown highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="gh"># ADR-003: Extract billing domain into a Rails Engine</span>

<span class="gu">## Context</span>

The billing domain (invoices, subscriptions, payments, plans) consists of
12 models, 3 controllers, 8 services, and 2 mailers. Git history shows these
files change together in 78% of commits that touch any of them. They change
independently from the notification and reporting domains in 92% of commits.

The billing test suite (247 tests) takes 45 seconds when run in isolation
but requires the full application boot, which adds 30 seconds of load time
for models it doesn't use.

The finance team requests changes to billing logic approximately twice per
sprint. These changes have caused 3 unrelated test failures in the past
quarter due to accidental coupling.

<span class="gu">## Decision</span>

Extract the billing domain into a mountable Rails Engine with
<span class="sb">`isolate_namespace`</span>. Keep it in the same repository as a path gem initially.
Migrate to a separate repository when team size exceeds 6 developers.

<span class="gu">## Consequences</span>

<span class="gu">### Positive</span>
<span class="p">-</span> Billing tests run in ~15 seconds against the engine's dummy app
<span class="p">-</span> Billing changes cannot accidentally break notification or reporting tests
<span class="p">-</span> The billing domain's interface is explicit (one concern, two config options)
<span class="p">-</span> New developers can understand billing in isolation

<span class="gu">### Negative</span>
<span class="p">-</span> Migration coordination: billing migrations must be copied to the host app
<span class="p">-</span> Two test suites to maintain (engine + integration)
<span class="p">-</span> Slight increase in complexity for cross-domain queries
<span class="p">-</span> Development workflow requires <span class="sb">`LOCAL_ENGINES=1`</span> for local engine changes
</code></pre></div></div>

<p>ADRs accumulate over time into a decision log. When someone asks “why is billing an engine but reporting isn’t?”, the answer is in the ADR. When the context changes (the team grows, the coupling metrics shift), you can revisit the decision with the original reasoning in front of you.</p>

<p>Keep ADRs in the repository. A <code>docs/decisions/</code> directory works well. Number them sequentially. Never delete an ADR – supersede it with a new one that references the old.</p>

<hr />

<h2 id="when-it-depends-is-the-honest-answer">When “It Depends” Is the Honest Answer</h2>

<p>Architects hate the phrase “it depends.” It feels like a non-answer. But Ford and Richards argue that “it depends” is often the only honest answer – the question is what it depends <em>on</em>.</p>

<p>Should you extract this domain into an engine? It depends on:</p>

<ul>
  <li><strong>How often does this domain change?</strong> High-change domains benefit more from isolation.</li>
  <li><strong>How many teams touch this domain?</strong> Multi-team domains need clearer boundaries.</li>
  <li><strong>How coupled is this domain to the rest of the application?</strong> High coupling means high extraction cost and potentially leaky boundaries.</li>
  <li><strong>What’s the cost of accidental breakage?</strong> If a billing bug can affect authentication, the cost of missing boundaries is high.</li>
  <li><strong>How big is your team?</strong> Small teams pay more for coordination overhead and get less from isolation.</li>
</ul>

<p>The answers to these questions aren’t binary. They’re spectrums. And they change over time. An honest architecture acknowledges this. It makes decisions based on current context, documents the reasoning, and builds in the ability to revisit.</p>

<p>That’s what the ADR is for. That’s what fitness functions are for. That’s what the incremental extraction strategy from Chapter 4 is for. Architecture isn’t a destination. It’s a process of making and revisiting trade-offs as the context evolves.</p>

<hr />

<p><em>We’ve now covered the three theoretical foundations: Clean Architecture’s principles (Chapter 2), the Hard Parts trade-off framework (this chapter), and XP’s emergent design practices (Chapter 4). In Part II, we turn to the mechanism – Rails Engines – and see how these principles become working code.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-02-clean-architecture-for-rubyists/">&larr; Clean Architecture for Rubyists</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-04-extreme-programming-and-emergent-design/">Extreme Programming and Emergent Design &rarr;</a>
</nav>
{% endraw %}
