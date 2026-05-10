---
layout: page
title: "Performance Considerations"
permalink: /vanilla-roguelike/20-performance/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/19-testing/">&larr; Testing Your Roguelike</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/21-extending/">Extending Your Game &rarr;</a>
</nav>

<h1 id="chapter-20-performance-considerations">Chapter 20: Performance Considerations</h1>

<h2 id="when-to-optimize-measure-first-optimize-second">When to Optimize: Measure First, Optimize Second</h2>

<p>Premature optimization is the root of all evil. Optimize when you have a problem, not before.</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/44df90e29d75273472f40d299d6668d215114dc344bd4a206212a28f86a09473.svg" alt="D2 diagram: Build it · Make it work"></figure>

<h3 id="the-optimization-process">The Optimization Process</h3>

<ol>
  <li><strong>Build it</strong>: Make it work first</li>
  <li><strong>Measure it</strong>: Find the actual bottlenecks</li>
  <li><strong>Optimize it</strong>: Fix the real problems</li>
</ol>

<p>Don’t optimize based on assumptions. Measure first.</p>

<h3 id="profiling">Profiling</h3>

<p>Use profiling tools to find bottlenecks:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">require</span> <span class="s1">'benchmark'</span>

<span class="c1"># Profile system update</span>
<span class="n">time</span> <span class="o">=</span> <span class="no">Benchmark</span><span class="p">.</span><span class="nf">measure</span> <span class="k">do</span>
  <span class="n">world</span><span class="p">.</span><span class="nf">update</span><span class="p">(</span><span class="kp">nil</span><span class="p">)</span>
<span class="k">end</span>

<span class="nb">puts</span> <span class="s2">"Update took: </span><span class="si">#{</span><span class="n">time</span><span class="p">.</span><span class="nf">real</span><span class="si">}</span><span class="s2"> seconds"</span>
</code></pre></div></div>

<p>Profile to find:</p>
<ul>
  <li>Which systems are slow</li>
  <li>Which queries are expensive</li>
  <li>Where time is actually spent</li>
</ul>

<h2 id="spatial-partitioning-optimizing-entity-queries">Spatial Partitioning: Optimizing Entity Queries</h2>

<p>As entity count grows, querying all entities becomes expensive. Spatial partitioning divides the world into regions.</p>

<h3 id="the-problem">The Problem</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Slow: checks all entities</span>
<span class="k">def</span> <span class="nf">find_entities_at_position</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">)</span>
  <span class="vi">@world</span><span class="p">.</span><span class="nf">query_entities</span><span class="p">([</span><span class="ss">:position</span><span class="p">]).</span><span class="nf">select</span> <span class="k">do</span> <span class="o">|</span><span class="n">entity</span><span class="o">|</span>
    <span class="n">pos</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>
    <span class="n">pos</span><span class="p">.</span><span class="nf">row</span> <span class="o">==</span> <span class="n">row</span> <span class="o">&amp;&amp;</span> <span class="n">pos</span><span class="p">.</span><span class="nf">column</span> <span class="o">==</span> <span class="n">column</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This checks every entity every time. With 1000 entities, that’s 1000 checks per query.</p>

<h3 id="the-solution-spatial-grid">The Solution: Spatial Grid</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">SpatialGrid</span>
  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">rows</span><span class="p">,</span> <span class="n">columns</span><span class="p">)</span>
    <span class="vi">@grid</span> <span class="o">=</span> <span class="no">Array</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">rows</span><span class="p">)</span> <span class="p">{</span> <span class="no">Array</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">columns</span><span class="p">)</span> <span class="p">{</span> <span class="p">[]</span> <span class="p">}</span> <span class="p">}</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">add_entity</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">)</span>
    <span class="vi">@grid</span><span class="p">[</span><span class="n">row</span><span class="p">][</span><span class="n">column</span><span class="p">]</span> <span class="o">&lt;&lt;</span> <span class="n">entity</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">entities_at</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">)</span>
    <span class="vi">@grid</span><span class="p">[</span><span class="n">row</span><span class="p">][</span><span class="n">column</span><span class="p">]</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Now queries are O(1) instead of O(n). Only check entities in the target cell.</p>

<h2 id="algorithm-efficiency-choosing-the-right-maze-algorithm">Algorithm Efficiency: Choosing the Right Maze Algorithm</h2>

<p>Different algorithms have different performance characteristics:</p>

<ul>
  <li><strong>Binary Tree</strong>: O(n) - visits each cell once</li>
  <li><strong>Aldous-Broder</strong>: O(n²) worst case - random walk can be slow</li>
  <li><strong>Recursive Backtracker</strong>: O(n) - efficient depth-first search</li>
  <li><strong>Recursive Division</strong>: O(n log n) - recursive division</li>
</ul>

<p>For large grids, choose efficient algorithms. But remember: measure first. A slow algorithm might be fine if generation happens once per level.</p>

<h2 id="performance-tips">Performance Tips</h2>

<h3 id="cache-queries">Cache Queries</h3>

<p>If you query the same thing multiple times, cache the result:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Bad: queries every frame</span>
<span class="k">def</span> <span class="nf">update</span>
  <span class="n">entities</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:position</span><span class="p">,</span> <span class="ss">:render</span><span class="p">)</span>
  <span class="n">entities</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">e</span><span class="o">|</span> <span class="n">render</span><span class="p">(</span><span class="n">e</span><span class="p">)</span> <span class="p">}</span>
<span class="k">end</span>

<span class="c1"># Good: cache if possible</span>
<span class="k">def</span> <span class="nf">update</span>
  <span class="vi">@renderable_entities</span> <span class="o">||=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:position</span><span class="p">,</span> <span class="ss">:render</span><span class="p">)</span>
  <span class="vi">@renderable_entities</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">e</span><span class="o">|</span> <span class="n">render</span><span class="p">(</span><span class="n">e</span><span class="p">)</span> <span class="p">}</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="batch-operations">Batch Operations</h3>

<p>Process entities in batches when possible:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Process all movement at once</span>
<span class="n">movable</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:position</span><span class="p">,</span> <span class="ss">:movement</span><span class="p">)</span>
<span class="n">movable</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">e</span><span class="o">|</span> <span class="n">process_movement</span><span class="p">(</span><span class="n">e</span><span class="p">)</span> <span class="p">}</span>
</code></pre></div></div>

<h3 id="avoid-unnecessary-allocations">Avoid Unnecessary Allocations</h3>

<p>Reuse objects in hot paths:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Bad: creates new array every time</span>
<span class="k">def</span> <span class="nf">update</span>
  <span class="n">entities</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:position</span><span class="p">,</span> <span class="ss">:render</span><span class="p">)</span>
<span class="k">end</span>

<span class="c1"># Good: reuse if possible</span>
<span class="vi">@entity_cache</span> <span class="o">||=</span> <span class="p">[]</span>
<span class="vi">@entity_cache</span><span class="p">.</span><span class="nf">clear</span>
<span class="c1"># ... populate cache ...</span>
</code></pre></div></div>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Optimize when you have a problem, not before. Measure to find real bottlenecks. Use spatial partitioning for entity queries. Choose efficient algorithms, but don’t optimize prematurely. Good architecture often performs well without optimization.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Profile your game</strong>: Add timing to system updates. Which systems are slowest?</p>
  </li>
  <li>
    <p><strong>Spatial partitioning</strong>: How would you implement spatial partitioning for your roguelike? What data structure would you use?</p>
  </li>
  <li>
    <p><strong>Algorithm choice</strong>: For a 100x100 grid, which algorithm would you choose? Why?</p>
  </li>
  <li>
    <p><strong>Optimization strategy</strong>: What’s your optimization strategy? When would you optimize?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/19-testing/">&larr; Testing Your Roguelike</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/21-extending/">Extending Your Game &rarr;</a>
</nav>
