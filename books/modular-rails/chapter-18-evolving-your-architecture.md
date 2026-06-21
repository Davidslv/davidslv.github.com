---
layout: book
book: modular_rails
title: "Evolving Your Architecture Over Time"
permalink: /books/modular-rails/chapter-18-evolving-your-architecture/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-17-the-microservices-question/">&larr; The Microservices Question</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/appendix-a-companion-application/">Appendix A: The Companion Application &rarr;</a>
</nav>

<h1 id="chapter-18-evolving-your-architecture-over-time">Chapter 18: Evolving Your Architecture Over Time</h1>

<p>Architecture is not a destination. It’s a series of decisions made over time, each shaped by the context of the moment. The architecture that was right for your team of four in 2024 might not be right for your team of twenty in 2026. The boundaries you drew when the product had three features might need redrawing when it has thirty.</p>

<p>This final chapter is about that evolution – how to recognise when your architecture needs to change, and how to change it without burning everything down.</p>

<hr />

<h2 id="architecture-is-a-journey-not-a-destination">Architecture Is a Journey, Not a Destination</h2>

<p>Consider the timeline of a fictional (but realistic) Rails application:</p>

<div class="diagram"><img src="/img/books/modular-rails/5131869e0886915303545a5ba4488aedc213c1e895a653a46d6835b8f2b1708c.svg" alt="Mermaid diagram: 2023 — Launch\n3 devs, 15 models\nPlain Rails monolith"></div>

<p><strong>2023 – Launch.</strong> Three developers. 15 models. Everything in one app. Fast, simple, and correct.</p>

<p><strong>2024 – Growth.</strong> Eight developers. 50 models. The test suite takes 8 minutes. Changes to billing sometimes break notifications. Two clear domains emerge: billing and everything else.</p>

<p><strong>Decision: Extract billing into an engine.</strong> The boundary is obvious from the git history. The extraction takes a week. Test suite for the billing engine: 30 seconds. Host app test suite drops to 5 minutes.</p>

<p><strong>2025 – Scale.</strong> Fifteen developers. 90 models. Three teams: billing, platform, and growth. The platform team wants to move faster without waiting on billing deploys.</p>

<p><strong>Decision: Move the billing engine to its own repository.</strong> Add versioned tags. The billing team releases on their own schedule. Host app bumps the tag when ready.</p>

<p><strong>2026 – Maturity.</strong> Twenty-five developers. 130 models. The billing system processes 10,000 transactions per hour and needs different scaling characteristics than the rest of the app.</p>

<p><strong>Decision: Promote the billing engine to a standalone service.</strong> The boundary was already drawn by the engine. The interface was already defined by the concern and configuration patterns. The promotion is well-defined: replace concern includes with API calls, replace events with webhooks.</p>

<p>Each decision was the right one for its moment. None was permanent. The architecture evolved as the context changed. That’s the goal.</p>

<hr />

<h2 id="fitness-functions-and-continuous-evaluation">Fitness Functions and Continuous Evaluation</h2>

<p>Don’t wait for pain to tell you the architecture needs to change. Measure continuously.</p>

<div class="diagram"><img src="/img/books/modular-rails/73ae471da27762eb2b23f8d302cfda82e7ab6d900f30d260a0616de0300d181d.svg" alt="Mermaid diagram: Measure"></div>

<p><strong>Measure:</strong> coupling score, cycle count, test time, co-change frequency. <strong>Evaluate:</strong> quarterly review — are boundaries still right? <strong>Decide:</strong> extract, merge, promote, or demote? <strong>Implement:</strong> change boundaries, update ADRs.</p>

<h3 id="automated-fitness-functions">Automated fitness functions</h3>

<p>Build these into your CI pipeline and review them quarterly:</p>

<p><strong>Coupling score.</strong> How many cross-engine constant references exist? Track the trend. If it’s increasing, boundaries are eroding.</p>

<p><strong>Cycle count.</strong> Are there dependency cycles between engines? A single cycle is a warning. Multiple cycles mean the decomposition is wrong.</p>

<p><strong>Test execution time.</strong> Track each engine’s test suite time separately. If an engine’s tests are getting slower, it might be taking on too much responsibility.</p>

<p><strong>Co-change frequency.</strong> Are files in different engines changing together? If billing and notifications files appear in the same commits regularly, the boundary might be in the wrong place.</p>

<p><strong>Deploy frequency per engine.</strong> How often does each engine’s version change? If one engine is changing ten times more often than another, it might need different treatment (separate repo, more autonomy).</p>

<p>Each of these fitness functions was introduced individually in earlier chapters – coupling analysis in Chapter 9, cycle detection in Chapter 11, test time measurement in Chapter 13. Here’s how to aggregate them into a single health dashboard.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># scripts/architecture_health.rb</span>
<span class="c1">#</span>
<span class="c1"># Aggregated architecture fitness-function runner.</span>
<span class="c1"># Exit 0 = healthy, exit 2 = one or more checks failed.</span>
<span class="c1">#</span>
<span class="c1"># Usage:</span>
<span class="c1">#   ruby scripts/architecture_health.rb</span>
<span class="c1">#</span>
<span class="c1"># Configure thresholds via environment variables or edit the defaults below.</span>

<span class="nb">require</span> <span class="s2">"active_support/core_ext/string/inflections"</span>
<span class="nb">require</span> <span class="s2">"benchmark"</span>
<span class="nb">require</span> <span class="s2">"pathname"</span>
<span class="nb">require</span> <span class="s2">"set"</span>

<span class="no">ENGINES_DIR</span>       <span class="o">=</span> <span class="no">Pathname</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="s2">"engines"</span><span class="p">)</span>
<span class="no">MAX_COUPLING</span>      <span class="o">=</span> <span class="no">Integer</span><span class="p">(</span><span class="no">ENV</span><span class="p">.</span><span class="nf">fetch</span><span class="p">(</span><span class="s2">"MAX_COUPLING"</span><span class="p">,</span> <span class="mi">10</span><span class="p">))</span>
<span class="no">MAX_CYCLES</span>        <span class="o">=</span> <span class="no">Integer</span><span class="p">(</span><span class="no">ENV</span><span class="p">.</span><span class="nf">fetch</span><span class="p">(</span><span class="s2">"MAX_CYCLES"</span><span class="p">,</span> <span class="mi">0</span><span class="p">))</span>
<span class="no">MAX_TEST_SECONDS</span>  <span class="o">=</span> <span class="no">Float</span><span class="p">(</span><span class="no">ENV</span><span class="p">.</span><span class="nf">fetch</span><span class="p">(</span><span class="s2">"MAX_TEST_SECONDS"</span><span class="p">,</span> <span class="mi">120</span><span class="p">))</span>

<span class="nb">abort</span> <span class="s2">"No engines/ directory found."</span> <span class="k">unless</span> <span class="no">ENGINES_DIR</span><span class="p">.</span><span class="nf">directory?</span>

<span class="n">engines</span> <span class="o">=</span> <span class="no">ENGINES_DIR</span><span class="p">.</span><span class="nf">children</span><span class="p">.</span><span class="nf">select</span><span class="p">(</span><span class="o">&amp;</span><span class="ss">:directory?</span><span class="p">).</span><span class="nf">map</span><span class="p">(</span><span class="o">&amp;</span><span class="ss">:basename</span><span class="p">).</span><span class="nf">map</span><span class="p">(</span><span class="o">&amp;</span><span class="ss">:to_s</span><span class="p">).</span><span class="nf">sort</span>
<span class="nb">puts</span> <span class="s2">"Engines found: </span><span class="si">#{</span><span class="n">engines</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">", "</span><span class="p">)</span><span class="si">}</span><span class="se">\n\n</span><span class="s2">"</span>

<span class="n">failures</span> <span class="o">=</span> <span class="p">[]</span>

<span class="c1"># --- 1. Coupling score (cross-engine constant references) ----------------</span>

<span class="nb">puts</span> <span class="s2">"== Coupling Score =="</span>
<span class="n">engines</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">engine</span><span class="o">|</span>
  <span class="n">engine_root</span> <span class="o">=</span> <span class="no">ENGINES_DIR</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="n">engine</span><span class="p">)</span>
  <span class="n">source_files</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="n">engine_root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"**"</span><span class="p">,</span> <span class="s2">"*.rb"</span><span class="p">))</span>

  <span class="n">other_engines</span> <span class="o">=</span> <span class="n">engines</span> <span class="o">-</span> <span class="p">[</span><span class="n">engine</span><span class="p">]</span>
  <span class="n">pattern</span> <span class="o">=</span> <span class="no">Regexp</span><span class="p">.</span><span class="nf">union</span><span class="p">(</span><span class="n">other_engines</span><span class="p">.</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">e</span><span class="o">|</span> <span class="sr">/\b</span><span class="si">#{</span><span class="no">Regexp</span><span class="p">.</span><span class="nf">escape</span><span class="p">(</span><span class="n">e</span><span class="p">.</span><span class="nf">camelize</span><span class="p">)</span><span class="si">}</span><span class="sr">::/</span> <span class="p">})</span>

  <span class="n">refs</span> <span class="o">=</span> <span class="mi">0</span>
  <span class="n">source_files</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">file</span><span class="o">|</span>
    <span class="no">File</span><span class="p">.</span><span class="nf">readlines</span><span class="p">(</span><span class="n">file</span><span class="p">).</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">line</span><span class="o">|</span> <span class="n">refs</span> <span class="o">+=</span> <span class="mi">1</span> <span class="k">if</span> <span class="n">line</span><span class="p">.</span><span class="nf">match?</span><span class="p">(</span><span class="n">pattern</span><span class="p">)</span> <span class="p">}</span>
  <span class="k">end</span>

  <span class="n">status</span> <span class="o">=</span> <span class="n">refs</span> <span class="o">&lt;=</span> <span class="no">MAX_COUPLING</span> <span class="p">?</span> <span class="s2">"PASS"</span> <span class="p">:</span> <span class="s2">"FAIL"</span>
  <span class="n">failures</span> <span class="o">&lt;&lt;</span> <span class="s2">"</span><span class="si">#{</span><span class="n">engine</span><span class="si">}</span><span class="s2"> coupling (</span><span class="si">#{</span><span class="n">refs</span><span class="si">}</span><span class="s2">)"</span> <span class="k">if</span> <span class="n">status</span> <span class="o">==</span> <span class="s2">"FAIL"</span>
  <span class="nb">puts</span> <span class="s2">"  %-20s cross-engine refs: %3d  [%s]"</span> <span class="o">%</span> <span class="p">[</span><span class="n">engine</span><span class="p">,</span> <span class="n">refs</span><span class="p">,</span> <span class="n">status</span><span class="p">]</span>
<span class="k">end</span>

<span class="c1"># --- 2. Dependency cycles (DFS on gemspec deps) --------------------------</span>

<span class="nb">puts</span> <span class="s2">"</span><span class="se">\n</span><span class="s2">== Dependency Cycles =="</span>

<span class="k">def</span> <span class="nf">parse_gemspec_deps</span><span class="p">(</span><span class="n">engine</span><span class="p">,</span> <span class="n">engines_dir</span><span class="p">,</span> <span class="n">known</span><span class="p">)</span>
  <span class="n">gemspec</span> <span class="o">=</span> <span class="no">Dir</span><span class="p">.</span><span class="nf">glob</span><span class="p">(</span><span class="n">engines_dir</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="n">engine</span><span class="p">,</span> <span class="s2">"*.gemspec"</span><span class="p">)).</span><span class="nf">first</span>
  <span class="k">return</span> <span class="p">[]</span> <span class="k">unless</span> <span class="n">gemspec</span>

  <span class="no">File</span><span class="p">.</span><span class="nf">readlines</span><span class="p">(</span><span class="n">gemspec</span><span class="p">).</span><span class="nf">filter_map</span> <span class="k">do</span> <span class="o">|</span><span class="n">line</span><span class="o">|</span>
    <span class="k">if</span> <span class="n">line</span> <span class="o">=~</span> <span class="sr">/add_dependency\s+['"]([^'"]+)['"]/</span>
      <span class="n">dep</span> <span class="o">=</span> <span class="vg">$1</span>
      <span class="n">known</span><span class="p">.</span><span class="nf">include?</span><span class="p">(</span><span class="n">dep</span><span class="p">)</span> <span class="p">?</span> <span class="n">dep</span> <span class="p">:</span> <span class="kp">nil</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="n">adjacency</span> <span class="o">=</span> <span class="n">engines</span><span class="p">.</span><span class="nf">each_with_object</span><span class="p">({})</span> <span class="k">do</span> <span class="o">|</span><span class="n">engine</span><span class="p">,</span> <span class="n">graph</span><span class="o">|</span>
  <span class="n">graph</span><span class="p">[</span><span class="n">engine</span><span class="p">]</span> <span class="o">=</span> <span class="n">parse_gemspec_deps</span><span class="p">(</span><span class="n">engine</span><span class="p">,</span> <span class="no">ENGINES_DIR</span><span class="p">,</span> <span class="n">engines</span><span class="p">.</span><span class="nf">to_set</span><span class="p">)</span>
<span class="k">end</span>

<span class="n">cycles</span> <span class="o">=</span> <span class="p">[]</span>
<span class="n">visited</span> <span class="o">=</span> <span class="p">{}</span>
<span class="n">on_stack</span> <span class="o">=</span> <span class="p">{}</span>

<span class="n">dfs</span> <span class="o">=</span> <span class="nb">lambda</span> <span class="k">do</span> <span class="o">|</span><span class="n">node</span><span class="p">,</span> <span class="n">path</span><span class="o">|</span>
  <span class="n">visited</span><span class="p">[</span><span class="n">node</span><span class="p">]</span> <span class="o">=</span> <span class="kp">true</span>
  <span class="n">on_stack</span><span class="p">[</span><span class="n">node</span><span class="p">]</span> <span class="o">=</span> <span class="kp">true</span>
  <span class="n">path</span><span class="p">.</span><span class="nf">push</span><span class="p">(</span><span class="n">node</span><span class="p">)</span>

  <span class="n">adjacency</span><span class="p">.</span><span class="nf">fetch</span><span class="p">(</span><span class="n">node</span><span class="p">,</span> <span class="p">[]).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">dep</span><span class="o">|</span>
    <span class="k">if</span> <span class="n">on_stack</span><span class="p">[</span><span class="n">dep</span><span class="p">]</span>
      <span class="n">cycle_start</span> <span class="o">=</span> <span class="n">path</span><span class="p">.</span><span class="nf">index</span><span class="p">(</span><span class="n">dep</span><span class="p">)</span>
      <span class="n">cycles</span> <span class="o">&lt;&lt;</span> <span class="n">path</span><span class="p">[</span><span class="n">cycle_start</span><span class="o">..</span><span class="p">].</span><span class="nf">dup</span>
    <span class="k">elsif</span> <span class="o">!</span><span class="n">visited</span><span class="p">[</span><span class="n">dep</span><span class="p">]</span>
      <span class="n">dfs</span><span class="p">.</span><span class="nf">call</span><span class="p">(</span><span class="n">dep</span><span class="p">,</span> <span class="n">path</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="n">path</span><span class="p">.</span><span class="nf">pop</span>
  <span class="n">on_stack</span><span class="p">[</span><span class="n">node</span><span class="p">]</span> <span class="o">=</span> <span class="kp">false</span>
<span class="k">end</span>

<span class="n">engines</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">e</span><span class="o">|</span> <span class="n">dfs</span><span class="p">.</span><span class="nf">call</span><span class="p">(</span><span class="n">e</span><span class="p">,</span> <span class="p">[])</span> <span class="k">unless</span> <span class="n">visited</span><span class="p">[</span><span class="n">e</span><span class="p">]</span> <span class="p">}</span>

<span class="k">if</span> <span class="n">cycles</span><span class="p">.</span><span class="nf">empty?</span>
  <span class="nb">puts</span> <span class="s2">"  No cycles detected.  [PASS]"</span>
<span class="k">else</span>
  <span class="n">cycles</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">c</span><span class="o">|</span> <span class="nb">puts</span> <span class="s2">"  Cycle: </span><span class="si">#{</span><span class="n">c</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">" -&gt; "</span><span class="p">)</span><span class="si">}</span><span class="s2"> -&gt; </span><span class="si">#{</span><span class="n">c</span><span class="p">.</span><span class="nf">first</span><span class="si">}</span><span class="s2">  [FAIL]"</span> <span class="p">}</span>
  <span class="n">failures</span> <span class="o">&lt;&lt;</span> <span class="s2">"</span><span class="si">#{</span><span class="n">cycles</span><span class="p">.</span><span class="nf">size</span><span class="si">}</span><span class="s2"> dependency cycle(s)"</span>
<span class="k">end</span>

<span class="c1"># --- 3. Test execution time ----------------------------------------------</span>

<span class="nb">puts</span> <span class="s2">"</span><span class="se">\n</span><span class="s2">== Test Execution Time =="</span>
<span class="n">engines</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">engine</span><span class="o">|</span>
  <span class="n">engine_root</span> <span class="o">=</span> <span class="no">ENGINES_DIR</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="n">engine</span><span class="p">)</span>
  <span class="k">next</span> <span class="k">unless</span> <span class="n">engine_root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"test"</span><span class="p">).</span><span class="nf">directory?</span> <span class="o">||</span> <span class="n">engine_root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"spec"</span><span class="p">).</span><span class="nf">directory?</span>

  <span class="n">elapsed</span> <span class="o">=</span> <span class="no">Benchmark</span><span class="p">.</span><span class="nf">realtime</span> <span class="k">do</span>
    <span class="nb">system</span><span class="p">(</span><span class="s2">"cd </span><span class="si">#{</span><span class="n">engine_root</span><span class="si">}</span><span class="s2"> &amp;&amp; bundle exec rake test 2&gt;/dev/null"</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="n">status</span> <span class="o">=</span> <span class="n">elapsed</span> <span class="o">&lt;=</span> <span class="no">MAX_TEST_SECONDS</span> <span class="p">?</span> <span class="s2">"PASS"</span> <span class="p">:</span> <span class="s2">"FAIL"</span>
  <span class="n">failures</span> <span class="o">&lt;&lt;</span> <span class="s2">"</span><span class="si">#{</span><span class="n">engine</span><span class="si">}</span><span class="s2"> test time (</span><span class="si">#{</span><span class="s2">"%.1f"</span> <span class="o">%</span> <span class="n">elapsed</span><span class="si">}</span><span class="s2">s)"</span> <span class="k">if</span> <span class="n">status</span> <span class="o">==</span> <span class="s2">"FAIL"</span>
  <span class="nb">puts</span> <span class="s2">"  %-20s %6.1fs  [%s]"</span> <span class="o">%</span> <span class="p">[</span><span class="n">engine</span><span class="p">,</span> <span class="n">elapsed</span><span class="p">,</span> <span class="n">status</span><span class="p">]</span>
<span class="k">end</span>

<span class="c1"># --- Summary -------------------------------------------------------------</span>

<span class="nb">puts</span> <span class="s2">"</span><span class="se">\n</span><span class="si">#{</span><span class="s2">"="</span> <span class="o">*</span> <span class="mi">50</span><span class="si">}</span><span class="s2">"</span>
<span class="k">if</span> <span class="n">failures</span><span class="p">.</span><span class="nf">empty?</span>
  <span class="nb">puts</span> <span class="s2">"All checks passed."</span>
  <span class="nb">exit</span> <span class="mi">0</span>
<span class="k">else</span>
  <span class="nb">puts</span> <span class="s2">"FAILURES:"</span>
  <span class="n">failures</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">f</span><span class="o">|</span> <span class="nb">puts</span> <span class="s2">"  - </span><span class="si">#{</span><span class="n">f</span><span class="si">}</span><span class="s2">"</span> <span class="p">}</span>
  <span class="nb">exit</span> <span class="mi">2</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Add <code>ruby scripts/architecture_health.rb</code> as a CI step. Run it quarterly and compare trends. Rising coupling scores or test times are early warnings that boundaries need attention.</p>

<h3 id="quarterly-architecture-review">Quarterly architecture review</h3>

<p>Every quarter, look at the fitness function trends and ask:</p>

<ul>
  <li>Are the boundaries still in the right places?</li>
  <li>Has a domain grown enough to justify extraction?</li>
  <li>Has an engine become so small or stable that it should be folded back into the host app?</li>
  <li>Are any engines generating more overhead than value?</li>
</ul>

<p>This isn’t a committee meeting. It’s a 30-minute conversation with the tech leads, looking at data. Make a decision or don’t. Move on.</p>

<hr />

<h2 id="promoting-an-engine-to-a-service">Promoting an Engine to a Service</h2>

<p>When an engine needs to become a service (see Chapter 17 for when this is justified), the process is:</p>

<div class="diagram"><img src="/img/books/modular-rails/c9b6d2ec16d2d0ded2b9ff0b06fdad724446eb3ca26fe4eba5fc132c8e4b4337.svg" alt="Mermaid diagram: Engine&lt;br/&gt;(in host app)"></div>

<h3 id="1-verify-the-boundary-is-clean">1. Verify the boundary is clean</h3>

<p>Run the coupling analysis. Every cross-engine reference should go through a concern, configuration, or event. If there are direct constant references, fix them first. Promoting a leaky engine to a service turns code coupling into distributed coupling, which is worse.</p>

<h3 id="2-create-the-service-application">2. Create the service application</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>rails new billing-service <span class="nt">--api</span> <span class="nt">--database</span><span class="o">=</span>postgresql
</code></pre></div></div>

<p>Copy the engine’s models, services, and business logic into the new application. The engine’s code is already namespaced and self-contained, so the move is largely mechanical.</p>

<h3 id="3-replace-concerns-with-api-endpoints">3. Replace concerns with API endpoints</h3>

<p>The concern-based integration becomes an API:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Before (engine concern)</span>
<span class="n">user</span><span class="p">.</span><span class="nf">current_subscription</span>  <span class="c1"># Direct method call</span>

<span class="c1"># After (API call)</span>
<span class="no">BillingClient</span><span class="p">.</span><span class="nf">current_subscription</span><span class="p">(</span><span class="ss">user_id: </span><span class="n">user</span><span class="p">.</span><span class="nf">id</span><span class="p">)</span>
</code></pre></div></div>

<p>Create a client library (another gem) that the host app uses to communicate with the billing service.</p>

<h3 id="4-replace-events-with-asynchronous-messaging">4. Replace events with asynchronous messaging</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Before (in-process event)</span>
<span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"invoice.created.billing"</span><span class="p">,</span> <span class="n">payload</span><span class="p">)</span>

<span class="c1"># After (message queue)</span>
<span class="no">BillingEvents</span><span class="p">.</span><span class="nf">publish</span><span class="p">(</span><span class="s2">"invoice.created"</span><span class="p">,</span> <span class="n">payload</span><span class="p">)</span>
</code></pre></div></div>

<p>Use Kafka, RabbitMQ, or a database-backed queue (Solid Queue can work for this).</p>

<h3 id="5-set-up-infrastructure">5. Set up infrastructure</h3>

<p>The service needs its own database, CI pipeline, deployment, monitoring, and alerting. This is the operational cost. Make sure it’s justified before proceeding.</p>

<h3 id="6-migrate-data">6. Migrate data</h3>

<p>If the engine was sharing the host app’s database, migrate the billing tables to the service’s database. This is the hardest step. Plan for a transition period where both databases exist.</p>

<hr />

<h2 id="demoting-a-service-back-to-an-engine">Demoting a Service Back to an Engine</h2>

<p>The reverse journey. Sometimes a service isn’t worth the overhead.</p>

<h3 id="signs-a-service-should-become-an-engine-again">Signs a service should become an engine again</h3>

<ul>
  <li>The team maintaining it is too small to justify independent infrastructure</li>
  <li>It doesn’t need independent scaling</li>
  <li>Cross-service communication is causing more problems than it solves</li>
  <li>The service has few callers and could be a simple library</li>
</ul>

<h3 id="the-process">The process</h3>

<div class="diagram"><img src="/img/books/modular-rails/7b6598e5823ce4cbba598820e7950fa5237cfe4ac60c00d30c33c8811f94ebfc.svg" alt="Mermaid diagram: Standalone Service"></div>

<ol>
  <li>Create an engine in the host application</li>
  <li>Move the service’s code into the engine</li>
  <li>Replace API calls with direct method calls through concerns</li>
  <li>Replace message queue events with <code>ActiveSupport::Notifications</code></li>
  <li>Migrate data back to the shared database</li>
  <li>Decommission the service’s infrastructure</li>
</ol>

<p>This is easier than the promotion path. You’re simplifying, not complicating. The engine gives you the same code boundaries with less operational overhead.</p>

<hr />

<h2 id="case-study-an-engine-extraction-in-the-wild">Case Study: An Engine Extraction in the Wild</h2>

<p>Theory is useful. War stories are better. Let me walk you through a real engine extraction – anonymised and renamed, but the pain was real.</p>

<h3 id="the-setup">The setup</h3>

<p>Meridian is a fintech company. Their Rails monolith had been running for four years. Two hundred models. Twelve developers across three teams. The compliance team – responsible for KYC (Know Your Customer) checks, document verification, and audit logging – was drowning.</p>

<p>Every regulatory change required touching code that lived alongside billing logic, onboarding flows, and notification templates. A two-line change to a KYC threshold would trigger a 12-minute test suite. Merge conflicts with the onboarding team were a weekly ritual.</p>

<p>The compliance domain was scattered across 15 models and 8 controllers. <code>User</code> had KYC methods mixed in with billing methods. <code>Document</code> was referenced from onboarding, compliance, and support. Something had to change.</p>

<h3 id="week-1-2-mapping-the-boundary">Week 1-2: Mapping the boundary</h3>

<p>Before writing a single line of extraction code, the team spent two weeks understanding what they were cutting. They used <code>git log</code> co-change analysis – the same technique from Chapter 9:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>git log <span class="nt">--name-only</span> <span class="nt">--pretty</span><span class="o">=</span>format: <span class="nt">--since</span><span class="o">=</span><span class="s2">"1 year ago"</span> <span class="nt">--</span> <span class="se">\</span>
  app/models/kyc_check.rb <span class="se">\</span>
  app/models/compliance_document.rb <span class="se">\</span>
  app/models/audit_log.rb | <span class="se">\</span>
  <span class="nb">sort</span> | <span class="nb">uniq</span> <span class="nt">-c</span> | <span class="nb">sort</span> <span class="nt">-rn</span> | <span class="nb">head</span> <span class="nt">-30</span>
</code></pre></div></div>

<p>Twelve of the 15 candidate models changed together in over 70% of commits – KYC checks, compliance documents, audit logs, verification results, regulatory rules, and their supporting models. The other three (<code>User</code>, <code>Address</code>, <code>Country</code>) appeared in compliance commits but also in billing, onboarding, and support. Shared concerns, not compliance-specific. Tagged for a future <code>core</code> engine.</p>

<p>Eight controllers referenced compliance models, but only five were truly compliance controllers. The other three were consumers, not owners.</p>

<p>Cut line: twelve models, five controllers, their services, jobs, and mailers. Everything else needed an interface.</p>

<h3 id="week-3-moving-the-models">Week 3: Moving the models</h3>

<p>They moved models one at a time. Each model was a separate PR – small PRs are reviewable, revertable, and debuggable. A 15-model PR is none of those things.</p>

<p>Table renames used the rename-plus-view trick for zero downtime:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">RenameAuditLogsToComplianceAuditLogs</span> <span class="o">&lt;</span> <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Migration</span><span class="p">[</span><span class="mf">7.1</span><span class="p">]</span>
  <span class="k">def</span> <span class="nf">up</span>
    <span class="n">rename_table</span> <span class="ss">:audit_logs</span><span class="p">,</span> <span class="ss">:compliance_audit_logs</span>
    <span class="n">execute</span> <span class="o">&lt;&lt;-</span><span class="no">SQL</span><span class="sh">
      CREATE VIEW audit_logs AS SELECT * FROM compliance_audit_logs;
</span><span class="no">    SQL</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">down</span>
    <span class="n">execute</span> <span class="s2">"DROP VIEW IF EXISTS audit_logs;"</span>
    <span class="n">rename_table</span> <span class="ss">:compliance_audit_logs</span><span class="p">,</span> <span class="ss">:audit_logs</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The view ensured old references kept working during the transition. They dropped the views a month later. By end of week 3, all twelve models lived inside <code>engines/compliance/</code>.</p>

<h3 id="week-4-controllers-and-the-verifiable-concern">Week 4: Controllers and the Verifiable concern</h3>

<p>Moving controllers revealed the coupling they’d been living with. <code>KycChecksController#create</code> had <code>User.find</code> calls everywhere. They couldn’t reference <code>User</code> from inside the engine – that would defeat the purpose. Instead, they created a concern:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/compliance/app/models/concerns/compliance/verifiable.rb</span>
<span class="k">module</span> <span class="nn">Compliance</span>
  <span class="k">module</span> <span class="nn">Verifiable</span>
    <span class="kp">extend</span> <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Concern</span>

    <span class="n">included</span> <span class="k">do</span>
      <span class="n">has_many</span> <span class="ss">:kyc_checks</span><span class="p">,</span> <span class="ss">class_name: </span><span class="s2">"Compliance::KycCheck"</span><span class="p">,</span>
               <span class="ss">as: :verifiable</span><span class="p">,</span> <span class="ss">dependent: :restrict_with_error</span>
      <span class="n">has_many</span> <span class="ss">:compliance_documents</span><span class="p">,</span> <span class="ss">class_name: </span><span class="s2">"Compliance::Document"</span><span class="p">,</span>
               <span class="ss">as: :verifiable</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nf">compliance_status</span>
      <span class="n">kyc_checks</span><span class="p">.</span><span class="nf">order</span><span class="p">(</span><span class="ss">created_at: :desc</span><span class="p">).</span><span class="nf">first</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">status</span> <span class="o">||</span> <span class="s2">"pending"</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The host app included <code>Compliance::Verifiable</code> on <code>User</code>. Now the engine didn’t know about <code>User</code> – it knew about “a thing that is verifiable.” Clean inversion of control.</p>

<h3 id="week-5-events--the-hard-part">Week 5: Events – the hard part</h3>

<p>The onboarding flow had been calling compliance directly:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Before: onboarding directly creates compliance records</span>
<span class="k">class</span> <span class="nc">OnboardingService</span>
  <span class="k">def</span> <span class="nf">complete</span><span class="p">(</span><span class="n">user</span><span class="p">)</span>
    <span class="n">user</span><span class="p">.</span><span class="nf">update!</span><span class="p">(</span><span class="ss">onboarded_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span>
    <span class="no">Compliance</span><span class="o">::</span><span class="no">KycCheck</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span><span class="ss">user: </span><span class="n">user</span><span class="p">,</span> <span class="ss">check_type: :initial</span><span class="p">)</span>
    <span class="no">ComplianceMailer</span><span class="p">.</span><span class="nf">welcome_check</span><span class="p">(</span><span class="n">user</span><span class="p">).</span><span class="nf">deliver_later</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Onboarding shouldn’t know compliance exists. It should announce that onboarding is complete:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># After: onboarding fires an event, compliance subscribes</span>
<span class="k">class</span> <span class="nc">OnboardingService</span>
  <span class="k">def</span> <span class="nf">complete</span><span class="p">(</span><span class="n">user</span><span class="p">)</span>
    <span class="n">user</span><span class="p">.</span><span class="nf">update!</span><span class="p">(</span><span class="ss">onboarded_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span>
    <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"onboarding.completed"</span><span class="p">,</span>
      <span class="ss">user_id: </span><span class="n">user</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span> <span class="ss">completed_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># engines/compliance/config/initializers/subscriptions.rb</span>
<span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="s2">"onboarding.completed"</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">event</span><span class="o">|</span>
  <span class="no">Compliance</span><span class="o">::</span><span class="no">InitialCheckJob</span><span class="p">.</span><span class="nf">perform_later</span><span class="p">(</span><span class="ss">user_id: </span><span class="n">event</span><span class="p">.</span><span class="nf">payload</span><span class="p">[</span><span class="ss">:user_id</span><span class="p">])</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Seven places called compliance code directly. Each became an event. This took the entire week – not because the code was hard, but because finding all the call sites required careful grep work and testing.</p>

<p>The temptation to skip this step was enormous. “We’ll add events later” is the most dangerous sentence in engine extraction. Later never comes, and you end up with an engine that’s namespaced but still coupled.</p>

<h3 id="week-6-ci-contract-tests-and-documentation">Week 6: CI, contract tests, and documentation</h3>

<p>The compliance engine got its own CI job running in parallel with the host app. They wrote contract tests for the concern interface using a stub model. They wrote a README documenting what events it subscribes to and what concerns it exposes.</p>

<h3 id="what-went-wrong">What went wrong</h3>

<p><strong>Database views broke a reporting dashboard.</strong> The data team had Metabase dashboards with raw SQL against the old <code>audit_logs</code> table. <code>SELECT</code> queries worked through the view, but one dashboard used <code>INSERT</code> statements for materialised reporting tables. Views don’t support <code>INSERT</code> in all cases. Two days of unplanned work to create a proper migration for the reporting layer.</p>

<p><strong>An autoload race condition.</strong> An initializer referenced <code>Compliance::RegulatoryRule</code> before Zeitwerk had loaded it. Fix: replace <code>config.after_initialize</code> with <code>config.to_prepare</code>. This is a subtle gotcha – <code>after_initialize</code> runs before Zeitwerk is fully ready in some configurations. <code>to_prepare</code> runs after, and re-runs on reload in development.</p>

<p><strong>Tests were slower before they were faster.</strong> The engine’s dummy app needed its own test database, adding 20 seconds to CI. Fixed by parallelising engine and host app test jobs – the wall-clock time actually decreased.</p>

<h3 id="the-result">The result</h3>

<p>Six weeks of extraction. Here’s what changed:</p>

<ul>
  <li><strong>Compliance engine test suite: 45 seconds.</strong> Down from 12 minutes in the full suite. The compliance team ran tests dozens of times a day, catching issues before they hit CI.</li>
  <li><strong>Three regulatory updates shipped in the next quarter</strong> without a single cross-team merge conflict. Previously, each regulatory change was a week-long coordination exercise.</li>
  <li><strong>Two new engineers onboarded in under a week.</strong> They read the engine README, picked up a ticket, and completed it within the engine – never needing to understand the full 200-model monolith.</li>
</ul>

<h3 id="lessons-learned">Lessons learned</h3>

<ul>
  <li><strong>Map the boundary with data before you start cutting.</strong> Co-change analysis isn’t optional. Gut feelings about where the boundary should be are wrong often enough to be dangerous.</li>
  <li><strong>Move one model at a time, one PR at a time.</strong> The urge to do it all in one big PR is strong. Resist it. Small PRs let you catch mistakes early and revert cleanly.</li>
  <li><strong>Events are the hardest part – resist the urge to skip them.</strong> Direct cross-engine calls are the path of least resistance and the source of most regret. Do the event work during extraction, not “later.”</li>
  <li><strong>Database views are your friend during transitions.</strong> They buy you backward compatibility while you update consumers. Just make sure those consumers are only reading through them.</li>
  <li><strong>Your first engine extraction takes 2x longer than you expect; the second takes half.</strong> Meridian’s second extraction (onboarding, three months later) took two and a half weeks. The patterns were established, the team knew the gotchas, and the playbook existed.</li>
</ul>

<hr />

<h2 id="living-with-imperfect-boundaries">Living with Imperfect Boundaries</h2>

<p>No boundary is perfect. There will always be:</p>

<ul>
  <li>A reporting query that joins across three engines’ tables</li>
  <li>A background job that touches models from two different domains</li>
  <li>A user-facing feature that spans engine boundaries</li>
</ul>

<p>This is normal. The goal isn’t zero cross-boundary interactions. The goal is that cross-boundary interactions are explicit, deliberate, and managed – not accidental and invisible.</p>

<p>An imperfect boundary that’s visible (a concern include, a configuration option, an event subscription) is better than no boundary where coupling is invisible (direct references scattered across 50 files).</p>

<p>Pragmatism over purity. An architecture that’s 80% clean and shipping features is better than one that’s 100% clean and still being designed.</p>

<hr />

<h2 id="the-role-of-technical-leadership">The Role of Technical Leadership</h2>

<p>Architecture doesn’t maintain itself. Someone needs to:</p>

<ul>
  <li><strong>Watch the fitness functions.</strong> Review coupling scores, cycle counts, and test times. Raise the alarm when trends go wrong.</li>
  <li><strong>Make boundary decisions.</strong> Decide when to extract, when to merge, when to promote. These decisions require context that automated tools can’t provide.</li>
  <li><strong>Onboard new engineers.</strong> Explain the architecture, the patterns, and the reasoning. The README helps, but someone who can answer “why did we do it this way?” is irreplaceable.</li>
  <li><strong>Say no to shortcuts.</strong> When someone proposes a direct cross-engine reference “just for now,” the technical lead is the one who says “use an event” or “add a concern.” Shortcuts accumulate.</li>
  <li><strong>Revisit decisions.</strong> The ADR from six months ago might not reflect today’s reality. Review it, update it, or supersede it.</li>
</ul>

<p>This isn’t a full-time role. It’s a responsibility held by a senior engineer or tech lead who understands the architecture and cares about its health. Without this person, boundaries erode. With them, the architecture evolves gracefully.</p>

<hr />

<h2 id="closing-thoughts">Closing Thoughts</h2>

<p>We started this book with a question: why does architecture matter? The answer, fifteen chapters later, is this: <strong>architecture is the thing that keeps the cost of change proportional to the scope of the change.</strong></p>

<p>Without architecture, every change – no matter how small – pays a tax proportional to the size of the entire system. With architecture, a change to billing costs as much as billing is complex, no more.</p>

<p>Rails Engines are not the only tool for achieving this. But they are the tool that Rails gives you out of the box, the tool that the framework was built on, and the tool that the Ruby community has been underusing for over a decade.</p>

<p>The principles in this book – Clean Architecture’s component design, the Hard Parts’ trade-off analysis, XP’s emergent design – aren’t new. They’ve been articulated in Java, C#, and language-agnostic terms for decades. What this book provides is the bridge to Ruby: the specific, concrete, Rails-native way to apply those principles using a mechanism that’s been shipping with the framework since 2011.</p>

<p>Use engines when the context calls for them. Use something simpler when it doesn’t. Measure. Evaluate. Evolve.</p>

<p>The framework didn’t fail us. We just forgot to use what it gave us.</p>

<hr />

<p><em>Thank you for reading. Orbit, the companion application at <a href="https://github.com/Davidslv/orbit">github.com/Davidslv/orbit</a>, contains working code for every pattern discussed in this book. The repository is open – contributions, feedback, and corrections are welcome.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-17-the-microservices-question/">&larr; The Microservices Question</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/appendix-a-companion-application/">Appendix A: The Companion Application &rarr;</a>
</nav>
{% endraw %}
