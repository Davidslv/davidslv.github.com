---
layout: page
title: "Maze Generation Algorithms"
permalink: /vanilla-roguelike/05-maze-algorithms-beginning/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/04-grids-and-cells/">&larr; Understanding Grids and Cells</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/06-algorithm-diversity/">Exploring Algorithm Diversity &rarr;</a>
</nav>

<h1 id="chapter-5-maze-generation-algorithms">Chapter 5: Maze Generation Algorithms</h1>

<h2 id="binary-tree-algorithm-the-simplest-starting-point">Binary Tree Algorithm: The Simplest Starting Point</h2>

<p>The Binary Tree algorithm is where Vanilla Roguelike began. It’s the simplest maze generation algorithm, perfect for understanding the fundamentals before moving to more complex approaches.</p>

<h3 id="the-concept">The Concept</h3>

<p>For each cell in the grid, randomly choose to link it either north or east (if both are available). That’s it. The entire algorithm fits in a few lines of code.</p>

<p>Here’s how it works in Vanilla:</p>

<pre class="highlight"><code class="language-ruby"><span class="k">class</span> <span class="nc">BinaryTree</span> <span class="o">&lt;</span> <span class="no">AbstractAlgorithm</span>
  <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">on</span><span class="p">(</span><span class="n">grid</span><span class="p">)</span>
    <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
      <span class="n">has_north</span> <span class="o">=</span> <span class="o">!</span><span class="n">cell</span><span class="p">.</span><span class="nf">north</span><span class="p">.</span><span class="nf">nil?</span>
      <span class="n">has_east</span>  <span class="o">=</span> <span class="o">!</span><span class="n">cell</span><span class="p">.</span><span class="nf">east</span><span class="p">.</span><span class="nf">nil?</span>

      <span class="k">if</span> <span class="n">has_north</span> <span class="o">&amp;&amp;</span> <span class="n">has_east</span>
        <span class="n">cell</span><span class="p">.</span><span class="nf">link</span><span class="p">(</span><span class="ss">cell: </span><span class="nb">rand</span><span class="p">(</span><span class="mi">2</span><span class="p">).</span><span class="nf">zero?</span> <span class="p">?</span> <span class="n">cell</span><span class="p">.</span><span class="nf">north</span> <span class="p">:</span> <span class="n">cell</span><span class="p">.</span><span class="nf">east</span><span class="p">,</span> <span class="ss">bidirectional: </span><span class="kp">true</span><span class="p">)</span>
      <span class="k">elsif</span> <span class="n">has_north</span>
        <span class="n">cell</span><span class="p">.</span><span class="nf">link</span><span class="p">(</span><span class="ss">cell: </span><span class="n">cell</span><span class="p">.</span><span class="nf">north</span><span class="p">,</span> <span class="ss">bidirectional: </span><span class="kp">true</span><span class="p">)</span>
      <span class="k">elsif</span> <span class="n">has_east</span>
        <span class="n">cell</span><span class="p">.</span><span class="nf">link</span><span class="p">(</span><span class="ss">cell: </span><span class="n">cell</span><span class="p">.</span><span class="nf">east</span><span class="p">,</span> <span class="ss">bidirectional: </span><span class="kp">true</span><span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>

    <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
      <span class="n">cell</span><span class="p">.</span><span class="nf">tile</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">Support</span><span class="o">::</span><span class="no">TileType</span><span class="o">::</span><span class="no">WALL</span> <span class="k">if</span> <span class="n">cell</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span>
    <span class="k">end</span>

    <span class="n">grid</span>
  <span class="k">end</span>
<span class="k">end</span></code></pre>

<h3 id="step-by-step-walkthrough">Step-by-Step Walkthrough</h3>

<p>Let’s trace through what happens:</p>

<ol>
  <li><strong>Iterate over every cell</strong>: The algorithm visits each cell exactly once</li>
  <li><strong>Check available neighbours</strong>: For each cell, see if it has a north and/or east neighbour</li>
  <li><strong>Randomly choose</strong>: If both exist, randomly pick one. If only one exists, use that one</li>
  <li><strong>Create the link</strong>: Link the cell to the chosen neighbour</li>
  <li><strong>Set walls</strong>: After linking, any cell with no links becomes a wall</li>
</ol>

<h3 id="visual-example">Visual Example</h3>

<p>Imagine a 3x3 grid. Here’s what might happen:</p>

<pre><code>Initial state (all cells isolated):
[?][?][?]
[?][?][?]
[?][?][?]

After processing (example):
[→][→][↑]
[→][→][↑]
[→][→][↑]
</code></pre>

<p>Arrows show which direction each cell linked. Notice:</p>
<ul>
  <li>Top row: All link east (can’t link north, no neighbour)</li>
  <li>Right column: All link north (can’t link east, no neighbour)</li>
  <li>Other cells: Randomly choose north or east</li>
</ul>

<h3 id="characteristics-of-binary-tree-mazes">Characteristics of Binary Tree Mazes</h3>

<p>Binary Tree creates mazes with distinct properties:</p>

<p><strong>Bias toward northeast:</strong></p>
<ul>
  <li>Cells always link north or east, never south or west</li>
  <li>This creates a diagonal bias, paths tend to flow northeast</li>
  <li>The northeast corner is always reachable from anywhere</li>
</ul>

<aside id="binary-bias"><p>The diagonal bias is a fingerprint. Show a maze experienced reader a Binary Tree output and they will name the algorithm at a glance, just from the north-east drift of the corridors. Every algorithm leaves traces like this; learning to recognise them is half of understanding them.</p>
</aside>

<p><strong>Many dead ends:</strong></p>
<ul>
  <li>Because cells only link in two directions, many paths end abruptly</li>
  <li>This creates challenging navigation, you’ll hit many dead ends</li>
</ul>

<p><strong>Fast generation:</strong></p>
<ul>
  <li>Visits each cell once</li>
  <li>Simple logic, no backtracking or complex state</li>
  <li>Very efficient for large grids</li>
</ul>

<h3 id="performance-characteristics">Performance Characteristics</h3>

<p><strong>Time Complexity</strong>: O(n) where n = number of cells. Visits each cell exactly once, with constant work per cell. Fast and predictable.</p>

<p><strong>Space Complexity</strong>: O(1) additional space. No extra data structures, works in-place on the grid.</p>

<h3 id="why-start-here">Why Start Here?</h3>

<p>Binary Tree is perfect for learning because:</p>

<ol>
  <li><strong>Simplicity</strong>: The algorithm is easy to understand completely</li>
  <li><strong>Immediate results</strong>: You see a working maze right away</li>
  <li><strong>Foundation</strong>: Concepts learned here apply to all maze algorithms</li>
  <li><strong>Debugging</strong>: When something goes wrong, it’s easy to trace</li>
</ol>

<h3 id="the-algorithm-flow">The Algorithm Flow</h3>

<figure class="diagram"><img src="/img/vanilla-roguelike/5c7a0bb7f39398a21e1323f009e611bead1280028680fa6234bb4c9d0b506d51.svg" alt="D2 diagram: Start: Create Grid"></figure>

<h3 id="understanding-the-randomness">Understanding the Randomness</h3>

<p>The <code>rand(2).zero?</code> check randomly chooses between north and east. This randomness is what makes each maze unique. But notice: the randomness is constrained. You can only link north or east, never south or west. This constraint is what creates the algorithm’s characteristic bias.</p>

<h3 id="from-algorithm-to-playable-maze">From Algorithm to Playable Maze</h3>

<p>Once the algorithm runs, you have a grid with linked cells. But that’s not enough for a game, you need to render it. The algorithm sweeps the grid one more time to convert the link structure into tiles:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
  <span class="k">if</span> <span class="n">cell</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span>
    <span class="n">cell</span><span class="p">.</span><span class="nf">tile</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">Support</span><span class="o">::</span><span class="no">TileType</span><span class="o">::</span><span class="no">WALL</span>  <span class="c1"># '#'</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Cells with links keep their default floor tile. Cells without links become walls (<code>#</code>).</p>

<h3 id="the-journey-begins">The Journey Begins</h3>

<p>This simple algorithm was Vanilla’s starting point in April 2020. It wasn’t perfect, the bias was obvious, dead ends were frustrating, but it worked. It created playable mazes. And that was enough to begin the journey.</p>

<p>From here, you can:</p>
<ul>
  <li>Experiment with different random choices</li>
  <li>Try linking in different directions</li>
  <li>Understand why the bias exists</li>
  <li>Move on to more sophisticated algorithms</li>
</ul>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>The Binary Tree algorithm demonstrates the core concept of maze generation: visit cells, create links, render the result. It’s simple, biased, and imperfect, but it works. Understanding this algorithm gives you the foundation to appreciate more sophisticated approaches.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Trace the algorithm</strong>: On paper, draw a 4x4 grid. Manually run the Binary Tree algorithm, making random choices. What does the resulting maze look like?</p>
  </li>
  <li>
    <p><strong>Modify the bias</strong>: What if you changed the algorithm to link south or west instead? How would the maze feel different?</p>
  </li>
  <li>
    <p><strong>Count dead ends</strong>: Generate a Binary Tree maze and count how many dead ends it has. Compare this to mazes from other algorithms (once you learn them).</p>
  </li>
  <li>
    <p><strong>Implement it</strong>: Try implementing Binary Tree in your own code. Start with a simple grid structure, then add the linking logic.</p>
  </li>
</ol>


<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/04-grids-and-cells/">&larr; Understanding Grids and Cells</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/06-algorithm-diversity/">Exploring Algorithm Diversity &rarr;</a>
</nav>
