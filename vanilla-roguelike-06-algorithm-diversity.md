---
layout: page
title: "Exploring Algorithm Diversity"
permalink: /vanilla-roguelike/06-algorithm-diversity/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/05-maze-algorithms-beginning/">&larr; Maze Generation Algorithms</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/07-beyond-mazes/">Beyond Mazes — Procedural Content &rarr;</a>
</nav>

<h1 id="chapter-6-exploring-algorithm-diversity">Chapter 6: Exploring Algorithm Diversity</h1>

<p>Once you understand Binary Tree, you’re ready to explore other maze generation algorithms. Each algorithm has different characteristics, creating mazes that feel different to play. Understanding these differences helps you choose the right algorithm for your game.</p>

<h2 id="aldous-broder-completely-unbiased">Aldous-Broder: Completely Unbiased</h2>

<p>The Aldous-Broder algorithm creates mazes with no bias whatsoever. It’s a random walk algorithm that visits every cell exactly once.</p>

<h3 id="the-concept">The Concept</h3>

<p>Start at a random cell. Then, repeatedly:</p>
<ol>
  <li>Pick a random neighbor</li>
  <li>Move to that neighbor</li>
  <li>If you haven’t visited it before, link it to the previous cell</li>
  <li>Repeat until every cell has been visited</li>
</ol>

<p>Here’s the Vanilla implementation:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Algorithms</span>
    <span class="k">class</span> <span class="nc">AldousBroder</span> <span class="o">&lt;</span> <span class="no">AbstractAlgorithm</span>
      <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">on</span><span class="p">(</span><span class="n">grid</span><span class="p">)</span>
        <span class="n">cell</span> <span class="o">=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">random_cell</span>
        <span class="n">unvisited</span> <span class="o">=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">size</span> <span class="o">-</span> <span class="mi">1</span>
        <span class="k">while</span> <span class="n">unvisited</span> <span class="o">&gt;</span> <span class="mi">0</span>
          <span class="n">neighbor</span> <span class="o">=</span> <span class="n">cell</span><span class="p">.</span><span class="nf">neighbors</span><span class="p">.</span><span class="nf">sample</span>
          <span class="k">if</span> <span class="n">neighbor</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span>
            <span class="n">cell</span><span class="p">.</span><span class="nf">link</span><span class="p">(</span><span class="ss">cell: </span><span class="n">neighbor</span><span class="p">)</span>
            <span class="n">unvisited</span> <span class="o">-=</span> <span class="mi">1</span>
          <span class="k">end</span>
          <span class="n">cell</span> <span class="o">=</span> <span class="n">neighbor</span>
        <span class="k">end</span>

        <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
          <span class="k">if</span> <span class="n">cell</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span>
            <span class="n">cell</span><span class="p">.</span><span class="nf">tile</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">Support</span><span class="o">::</span><span class="no">TileType</span><span class="o">::</span><span class="no">WALL</span>
          <span class="k">end</span>
        <span class="k">end</span>

        <span class="n">grid</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="how-it-works">How It Works</h3>

<p>The algorithm performs a random walk through the grid:</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/113b6f91e247115dab21662c7db402d20cdccc8784bc074163e89d655660c170.svg" alt="D2 diagram: Start: Random Cell"></figure>

<h3 id="characteristics">Characteristics</h3>

<p><strong>Completely unbiased:</strong></p>
<ul>
  <li>No directional preference</li>
  <li>Every valid maze configuration is equally likely</li>
  <li>No northeast bias like Binary Tree</li>
</ul>

<p><strong>Slower generation:</strong></p>
<ul>
  <li>Random walk can take a long time</li>
  <li>Might visit the same cell many times before finding unvisited ones</li>
  <li>Worst-case time complexity is high</li>
</ul>

<p><strong>Uniform distribution:</strong></p>
<ul>
  <li>All mazes are equally likely</li>
  <li>No “typical” maze structure</li>
  <li>More unpredictable than other algorithms</li>
</ul>

<h3 id="performance-characteristics">Performance Characteristics</h3>

<p><strong>Time Complexity</strong>: O(n²) worst case, O(n log n) average case</p>
<ul>
  <li>The random walk can revisit cells many times before finding unvisited ones</li>
  <li>Worst case: might visit the same cell O(n) times before discovering an unvisited neighbor</li>
  <li>Average case is better but still unpredictable—you can’t guarantee completion time</li>
</ul>

<p><strong>Space Complexity</strong>: O(1) additional space</p>
<ul>
  <li>No extra data structures needed beyond the grid</li>
  <li>Works in-place, using only a constant amount of memory</li>
</ul>

<p><strong>Performance for different grid sizes</strong>:</p>
<ul>
  <li>Small grids (10x10 = 100 cells): Fast (&lt; 10ms), acceptable</li>
  <li>Medium grids (50x50 = 2,500 cells): Slow (100-500ms), noticeable delay</li>
  <li>Large grids (100x100 = 10,000 cells): Very slow (1-5 seconds), problematic</li>
  <li>Very large grids (500x500 = 250,000 cells): Impractical (minutes), avoid</li>
</ul>

<p><strong>When to use</strong>: Small grids only, when you want completely unbiased mazes and generation time isn’t critical. Avoid for larger grids or real-time generation.</p>

<h3 id="when-to-use-aldous-broder">When to Use Aldous-Broder</h3>

<p>Use Aldous-Broder when:</p>
<ul>
  <li>You want completely unbiased mazes</li>
  <li>Generation time isn’t critical</li>
  <li>You want maximum variety</li>
</ul>

<p>Avoid it when:</p>
<ul>
  <li>You need fast generation</li>
  <li>You want predictable maze characteristics</li>
  <li>Performance matters</li>
</ul>

<h2 id="recursive-backtracker-long-corridors-fewer-dead-ends">Recursive Backtracker: Long Corridors, Fewer Dead Ends</h2>

<p>The Recursive Backtracker creates mazes with long corridors and relatively few dead ends. It uses a depth-first search approach with backtracking.</p>

<h3 id="the-concept-1">The Concept</h3>

<ol>
  <li>Start at a random cell</li>
  <li>While there are unvisited neighbors:
    <ul>
      <li>Pick a random unvisited neighbor</li>
      <li>Link to it and move there</li>
      <li>Recursively continue</li>
    </ul>
  </li>
  <li>When stuck, backtrack to the previous cell</li>
  <li>Continue until all cells are visited</li>
</ol>

<p>Here’s the Vanilla implementation:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Algorithms</span>
    <span class="k">class</span> <span class="nc">RecursiveBacktracker</span> <span class="o">&lt;</span> <span class="no">AbstractAlgorithm</span>
      <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">on</span><span class="p">(</span><span class="n">grid</span><span class="p">)</span>
        <span class="n">stack</span> <span class="o">=</span> <span class="p">[]</span>
        <span class="n">stack</span><span class="p">.</span><span class="nf">push</span><span class="p">(</span><span class="n">grid</span><span class="p">.</span><span class="nf">random_cell</span><span class="p">)</span>

        <span class="k">while</span> <span class="n">stack</span><span class="p">.</span><span class="nf">any?</span>
          <span class="n">current</span> <span class="o">=</span> <span class="n">stack</span><span class="p">.</span><span class="nf">last</span>
          <span class="n">neighbors</span> <span class="o">=</span> <span class="n">current</span><span class="p">.</span><span class="nf">neighbors</span><span class="p">.</span><span class="nf">select</span> <span class="p">{</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span> <span class="n">cell</span><span class="p">.</span>
                <span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span> <span class="p">}</span>

          <span class="k">if</span> <span class="n">neighbors</span><span class="p">.</span><span class="nf">empty?</span>
            <span class="n">stack</span><span class="p">.</span><span class="nf">pop</span>
          <span class="k">else</span>
            <span class="n">neighbor</span> <span class="o">=</span> <span class="n">neighbors</span><span class="p">.</span><span class="nf">sample</span>
            <span class="n">current</span><span class="p">.</span><span class="nf">link</span><span class="p">(</span><span class="ss">cell: </span><span class="n">neighbor</span><span class="p">)</span>
            <span class="n">stack</span><span class="p">.</span><span class="nf">push</span><span class="p">(</span><span class="n">neighbor</span><span class="p">)</span>
          <span class="k">end</span>
        <span class="k">end</span>

        <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
          <span class="n">cell</span><span class="p">.</span><span class="nf">tile</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">Support</span><span class="o">::</span><span class="no">TileType</span><span class="o">::</span><span class="no">WALL</span> <span class="k">if</span> <span class="n">cell</span><span class="p">.</span>
                <span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span>
        <span class="k">end</span>

        <span class="n">grid</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="how-it-works-1">How It Works</h3>

<p>The algorithm uses a stack to track the current path:</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/153d6775e0dcee36f00ff521c8454bc51275495c951e51744fffd9445c693c24.svg" alt="D2 diagram: Start: Random Cell on Stack"></figure>

<h3 id="characteristics-1">Characteristics</h3>

<p><strong>Long corridors:</strong></p>
<ul>
  <li>Depth-first search creates winding paths</li>
  <li>Fewer abrupt dead ends</li>
  <li>More “dungeon-like” feel</li>
</ul>

<p><strong>Efficient generation:</strong></p>
<ul>
  <li>Visits each cell exactly once</li>
  <li>Predictable time complexity</li>
  <li>Fast even for large grids</li>
</ul>

<p><strong>Fewer dead ends:</strong></p>
<ul>
  <li>Compared to Binary Tree, fewer cells with only one link</li>
  <li>More interesting navigation</li>
  <li>Better for gameplay</li>
</ul>

<h3 id="performance-characteristics-1">Performance Characteristics</h3>

<p><strong>Time Complexity</strong>: O(n) where n = number of cells</p>
<ul>
  <li>Visits each cell exactly once</li>
  <li>Stack operations (push/pop) are O(1)</li>
  <li>Linear time complexity—predictable and fast</li>
</ul>

<p><strong>Space Complexity</strong>: O(n) worst case, O(log n) to O(√n) typical</p>
<ul>
  <li>Uses a stack to track the current path</li>
  <li>Worst case: stack depth equals longest path (could be O(n) for a snake-like maze)</li>
  <li>Typical case: stack depth is much less than n, usually logarithmic or square root</li>
  <li>For most mazes, space usage is reasonable</li>
</ul>

<p><strong>Performance for different grid sizes</strong>:</p>
<ul>
  <li>Small grids (10x10 = 100 cells): Instant (&lt; 1ms)</li>
  <li>Medium grids (50x50 = 2,500 cells): Very fast (&lt; 10ms)</li>
  <li>Large grids (100x100 = 10,000 cells): Fast (&lt; 50ms)</li>
  <li>Very large grids (500x500 = 250,000 cells): Acceptable (&lt; 500ms)</li>
</ul>

<p><strong>When to use</strong>: Default choice for most games. Fast, predictable, and produces high-quality mazes. Best balance of performance and quality.</p>

<h3 id="when-to-use-recursive-backtracker">When to Use Recursive Backtracker</h3>

<p>Use Recursive Backtracker when:</p>
<ul>
  <li>You want mazes that feel like dungeons</li>
  <li>You need fast, reliable generation</li>
  <li>You want fewer dead ends</li>
</ul>

<p>This is Vanilla’s default algorithm because it balances speed, quality, and gameplay feel.</p>

<h2 id="recursive-division-boxy-rectangular-mazes">Recursive Division: Boxy, Rectangular Mazes</h2>

<p>Recursive Division creates mazes with a more structured, boxy feel. It divides the space recursively, creating walls with passages.</p>

<h3 id="the-concept-2">The Concept</h3>

<ol>
  <li>Start with all cells linked to neighbors (open grid)</li>
  <li>Recursively divide the space:
    <ul>
      <li>Choose a random wall position</li>
      <li>Create a wall, leaving one passage</li>
      <li>Recursively divide each side</li>
    </ul>
  </li>
  <li>Stop when regions are too small</li>
</ol>

<p>Here’s a simplified version of the Vanilla implementation:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Algorithms</span>
    <span class="k">class</span> <span class="nc">RecursiveDivision</span> <span class="o">&lt;</span> <span class="no">AbstractAlgorithm</span>
      <span class="no">MINIMUM_SIZE</span> <span class="o">=</span> <span class="mi">5</span>
      <span class="no">TOO_SMALL</span> <span class="o">=</span> <span class="mi">1</span>

      <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">on</span><span class="p">(</span><span class="n">grid</span><span class="p">)</span>
        <span class="n">new</span><span class="p">(</span><span class="n">grid</span><span class="p">).</span><span class="nf">process</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">process</span>
        <span class="c1"># Start with all cells linked</span>
        <span class="vi">@grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
          <span class="n">cell</span><span class="p">.</span><span class="nf">neighbors</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">n</span><span class="o">|</span> <span class="n">cell</span><span class="p">.</span>
                <span class="nf">link</span><span class="p">(</span><span class="ss">cell: </span><span class="n">n</span><span class="p">,</span> <span class="ss">bidirectional: </span><span class="kp">false</span><span class="p">)</span> <span class="p">}</span>
        <span class="k">end</span>
        <span class="n">divide</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="mi">0</span><span class="p">,</span> <span class="vi">@grid</span><span class="p">.</span><span class="nf">rows</span><span class="p">,</span> <span class="vi">@grid</span><span class="p">.</span><span class="nf">columns</span><span class="p">)</span>
        <span class="vi">@grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="p">{</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span> <span class="n">cell</span><span class="p">.</span><span class="nf">tile</span> <span class="o">=</span> <span class="ss">:WALL</span> <span class="k">if</span> <span class="n">cell</span><span class="p">.</span>
              <span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span> <span class="p">}</span>
        <span class="vi">@grid</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">divide</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">,</span> <span class="n">height</span><span class="p">,</span> <span class="n">width</span><span class="p">)</span>
        <span class="k">return</span> <span class="k">if</span> <span class="n">height</span> <span class="o">&lt;=</span> <span class="no">TOO_SMALL</span> <span class="o">||</span> <span class="n">width</span> <span class="o">&lt;=</span> <span class="no">TOO_SMALL</span>

        <span class="k">if</span> <span class="n">height</span> <span class="o">&gt;</span> <span class="n">width</span>
          <span class="n">divide_horizontally</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">,</span> <span class="n">height</span><span class="p">,</span> <span class="n">width</span><span class="p">)</span>
        <span class="k">else</span>
          <span class="n">divide_vertically</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">,</span> <span class="n">height</span><span class="p">,</span> <span class="n">width</span><span class="p">)</span>
        <span class="k">end</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">divide_horizontally</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">,</span> <span class="n">height</span><span class="p">,</span> <span class="n">width</span><span class="p">)</span>
        <span class="n">divide_south_of</span> <span class="o">=</span> <span class="nb">rand</span><span class="p">(</span><span class="n">height</span> <span class="o">-</span> <span class="mi">1</span><span class="p">)</span>
        <span class="n">passage_at</span> <span class="o">=</span> <span class="nb">rand</span><span class="p">(</span><span class="n">width</span><span class="p">)</span>
        <span class="n">width</span><span class="p">.</span><span class="nf">times</span> <span class="k">do</span> <span class="o">|</span><span class="n">x</span><span class="o">|</span>
          <span class="k">next</span> <span class="k">if</span> <span class="n">passage_at</span> <span class="o">==</span> <span class="n">x</span>
          <span class="n">cell</span> <span class="o">=</span> <span class="vi">@grid</span><span class="p">[</span><span class="n">row</span> <span class="o">+</span> <span class="n">divide_south_of</span><span class="p">,</span> <span class="n">column</span> <span class="o">+</span> <span class="n">x</span><span class="p">]</span>
          <span class="n">cell</span><span class="p">.</span><span class="nf">unlink</span><span class="p">(</span><span class="ss">cell: </span><span class="n">cell</span><span class="p">.</span><span class="nf">south</span><span class="p">)</span>
        <span class="k">end</span>
        <span class="n">divide</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">,</span> <span class="n">divide_south_of</span> <span class="o">+</span> <span class="mi">1</span><span class="p">,</span> <span class="n">width</span><span class="p">)</span>
        <span class="n">divide</span><span class="p">(</span>
          <span class="n">row</span> <span class="o">+</span> <span class="n">divide_south_of</span> <span class="o">+</span> <span class="mi">1</span><span class="p">,</span>
          <span class="n">column</span><span class="p">,</span>
          <span class="n">height</span> <span class="o">-</span> <span class="n">divide_south_of</span> <span class="o">-</span> <span class="mi">1</span><span class="p">,</span>
          <span class="n">width</span>
        <span class="p">)</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">divide_vertically</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">,</span> <span class="n">height</span><span class="p">,</span> <span class="n">width</span><span class="p">)</span>
        <span class="n">divide_east_of</span> <span class="o">=</span> <span class="nb">rand</span><span class="p">(</span><span class="n">width</span> <span class="o">-</span> <span class="mi">1</span><span class="p">)</span>
        <span class="n">passage_at</span> <span class="o">=</span> <span class="nb">rand</span><span class="p">(</span><span class="n">height</span><span class="p">)</span>
        <span class="n">height</span><span class="p">.</span><span class="nf">times</span> <span class="k">do</span> <span class="o">|</span><span class="n">y</span><span class="o">|</span>
          <span class="k">next</span> <span class="k">if</span> <span class="n">passage_at</span> <span class="o">==</span> <span class="n">y</span>
          <span class="n">cell</span> <span class="o">=</span> <span class="vi">@grid</span><span class="p">[</span><span class="n">row</span> <span class="o">+</span> <span class="n">y</span><span class="p">,</span> <span class="n">column</span> <span class="o">+</span> <span class="n">divide_east_of</span><span class="p">]</span>
          <span class="n">cell</span><span class="p">.</span><span class="nf">unlink</span><span class="p">(</span><span class="ss">cell: </span><span class="n">cell</span><span class="p">.</span><span class="nf">east</span><span class="p">)</span>
        <span class="k">end</span>
        <span class="n">divide</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">,</span> <span class="n">height</span><span class="p">,</span> <span class="n">divide_east_of</span> <span class="o">+</span> <span class="mi">1</span><span class="p">)</span>
        <span class="n">divide</span><span class="p">(</span>
          <span class="n">row</span><span class="p">,</span>
          <span class="n">column</span> <span class="o">+</span> <span class="n">divide_east_of</span> <span class="o">+</span> <span class="mi">1</span><span class="p">,</span>
          <span class="n">height</span><span class="p">,</span>
          <span class="n">width</span> <span class="o">-</span> <span class="n">divide_east_of</span> <span class="o">-</span> <span class="mi">1</span>
          <span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="characteristics-2">Characteristics</h3>

<p><strong>Boxy, rectangular:</strong></p>
<ul>
  <li>Creates more structured layouts</li>
  <li>Less organic than other algorithms</li>
  <li>Clear room-like regions</li>
</ul>

<p><strong>Recursive structure:</strong></p>
<ul>
  <li>Divides space hierarchically</li>
  <li>Creates nested regions</li>
  <li>Predictable structure</li>
</ul>

<p><strong>Different feel:</strong></p>
<ul>
  <li>Less like a traditional maze</li>
  <li>More like a building with rooms</li>
  <li>Good for certain game styles</li>
</ul>

<h3 id="performance-characteristics-2">Performance Characteristics</h3>

<p><strong>Time Complexity</strong>: O(n log n) average case</p>
<ul>
  <li>Recursive division creates log(n) levels of recursion</li>
  <li>Each level processes O(n) cells (dividing and creating walls)</li>
  <li>More complex than linear algorithms but still efficient</li>
  <li>Performance is predictable and consistent</li>
</ul>

<p><strong>Space Complexity</strong>: O(log n) for recursion stack</p>
<ul>
  <li>Recursion depth is logarithmic (divides space in half each time)</li>
  <li>Each recursive call uses constant space</li>
  <li>Memory usage grows slowly with grid size</li>
</ul>

<p><strong>Performance for different grid sizes</strong>:</p>
<ul>
  <li>Small grids (10x10 = 100 cells): Fast (&lt; 5ms)</li>
  <li>Medium grids (50x50 = 2,500 cells): Good (&lt; 50ms)</li>
  <li>Large grids (100x100 = 10,000 cells): Acceptable (&lt; 200ms)</li>
  <li>Very large grids (500x500 = 250,000 cells): Slow (1-3 seconds), consider alternatives</li>
</ul>

<p><strong>When to use</strong>: When you want structured, room-like layouts. Good for medium-sized grids. For very large grids, consider faster algorithms if generation speed matters.</p>

<h3 id="when-to-use-recursive-division">When to Use Recursive Division</h3>

<p>Use Recursive Division when:</p>
<ul>
  <li>You want structured, room-like layouts</li>
  <li>You need a different aesthetic</li>
  <li>You want predictable maze structure</li>
</ul>

<h2 id="comparing-algorithms">Comparing Algorithms</h2>

<p>Here’s a quick comparison:</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/76ae951c892df79ed0dd5cec9ce3b2f9821517aeee0227ba171c1bd72f747a4b.svg" alt="D2 diagram: Algorithm Comparison"></figure>

<table>
  <thead>
    <tr>
      <th>Algorithm</th>
      <th>Bias</th>
      <th>Time Complexity</th>
      <th>Space Complexity</th>
      <th>Dead Ends</th>
      <th>Feel</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Binary Tree</td>
      <td>Northeast</td>
      <td>O(n)</td>
      <td>O(1)</td>
      <td>Many</td>
      <td>Simple, biased</td>
    </tr>
    <tr>
      <td>Aldous-Broder</td>
      <td>None</td>
      <td>O(n²) worst,<br /> O(n log n) avg</td>
      <td>O(1)</td>
      <td>Medium</td>
      <td>Completely random</td>
    </tr>
    <tr>
      <td>Recursive Backtracker</td>
      <td>None</td>
      <td>O(n)</td>
      <td>O(n) worst,<br /> O(log n) typical</td>
      <td>Few</td>
      <td>Dungeon-like</td>
    </tr>
    <tr>
      <td>Recursive Division</td>
      <td>None</td>
      <td>O(n log n)</td>
      <td>O(log n)</td>
      <td>Medium</td>
      <td>Boxy, structured</td>
    </tr>
  </tbody>
</table>

<p><strong>Understanding the complexities:</strong></p>
<ul>
  <li><strong>O(n)</strong>: Linear time—visits each cell once. Fast and predictable for all grid sizes.</li>
  <li><strong>O(n log n)</strong>: Slightly slower than linear, but still efficient. Performance degrades gradually as grids get larger.</li>
  <li><strong>O(n²)</strong>: Quadratic time—can be slow for large grids. Avoid for real-time generation of large mazes.</li>
  <li><strong>O(1) space</strong>: Constant memory—no extra data structures needed.</li>
  <li><strong>O(log n) space</strong>: Logarithmic memory—grows slowly with grid size, usually negligible.</li>
  <li><strong>O(n) space</strong>: Linear memory—grows with grid size, but typically much less than n in practice.</li>
</ul>

<h3 id="choosing-the-right-algorithm">Choosing the Right Algorithm</h3>

<p>Consider:</p>
<ul>
  <li><strong>Gameplay feel</strong>: What kind of navigation do you want?</li>
  <li><strong>Generation speed</strong>: How fast does it need to be?</li>
  <li><strong>Variety</strong>: How much randomness do you want?</li>
  <li><strong>Aesthetic</strong>: What should the mazes look like?</li>
</ul>

<p>In Vanilla, Recursive Backtracker is the default because it balances all these factors well.</p>

<h3 id="performance-considerations">Performance Considerations</h3>

<p>When choosing an algorithm, consider your grid size and performance requirements:</p>

<p><strong>For small grids (&lt; 50x50 = 2,500 cells):</strong></p>
<ul>
  <li>All algorithms are fast enough (&lt; 50ms)</li>
  <li>Choose based on gameplay feel and aesthetic preferences</li>
  <li>Complexity differences are negligible</li>
</ul>

<p><strong>For medium grids (50x50 to 100x100 = 2,500-10,000 cells):</strong></p>
<ul>
  <li>Binary Tree and Recursive Backtracker are fastest (both O(n))</li>
  <li>Recursive Division is acceptable (O(n log n))</li>
  <li>Avoid Aldous-Broder if generation speed matters</li>
</ul>

<p><strong>For large grids (100x100 to 500x500 = 10,000-250,000 cells):</strong></p>
<ul>
  <li>Binary Tree is fastest (O(n), O(1) space)</li>
  <li>Recursive Backtracker is fast (O(n), but uses more memory)</li>
  <li>Recursive Division becomes slower (O(n log n))</li>
  <li>Avoid Aldous-Broder—unpredictable and potentially very slow</li>
</ul>

<p><strong>For very large grids (&gt; 500x500 = 250,000+ cells):</strong></p>
<ul>
  <li>Binary Tree is the clear winner (fastest, least memory)</li>
  <li>Recursive Backtracker is acceptable but uses more memory</li>
  <li>Recursive Division and Aldous-Broder are too slow</li>
</ul>

<p><strong>Practical guidance:</strong></p>
<ul>
  <li><strong>Generating at game start</strong>: Any algorithm is fine—players won’t notice a 100ms difference</li>
  <li><strong>Generating during gameplay</strong>: Prefer O(n) algorithms (Binary Tree, Recursive Backtracker)</li>
  <li><strong>Memory constrained</strong>: Prefer O(1) space algorithms (Binary Tree, Aldous-Broder)</li>
  <li><strong>Need predictable timing</strong>: Avoid Aldous-Broder—its worst case is unpredictable</li>
  <li><strong>Default choice</strong>: Recursive Backtracker—best balance of speed, quality, and predictability</li>
</ul>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Different algorithms create different gameplay experiences. Understanding their characteristics helps you choose the right one for your game. Each algorithm teaches you something about graph theory, randomness, and procedural generation.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Compare mazes</strong>: Generate mazes with each algorithm. Can you see the differences? Which feels best for gameplay?</p>
  </li>
  <li>
    <p><strong>Modify algorithms</strong>: Try changing Recursive Backtracker to prefer certain directions. How does it affect the maze?</p>
  </li>
  <li>
    <p><strong>Research more</strong>: Look up other maze algorithms like Kruskal’s or Prim’s. How do they compare to these?</p>
  </li>
  <li>
    <p><strong>Implement one</strong>: Pick an algorithm and implement it yourself. Start with the pseudocode, then translate to code.</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/05-maze-algorithms-beginning/">&larr; Maze Generation Algorithms</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/07-beyond-mazes/">Beyond Mazes — Procedural Content &rarr;</a>
</nav>
