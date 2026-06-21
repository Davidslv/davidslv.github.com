---
layout: book
book: vanilla_roguelike
title: "Understanding Grids and Cells"
permalink: /books/vanilla-roguelike/04-grids-and-cells/
---
{% raw %}

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/03-first-prototype/">&larr; Your First Playable Prototype</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/05-maze-algorithms-beginning/">Maze Generation Algorithms &rarr;</a>
</nav>

<h1 id="chapter-4-understanding-grids-and-cells">Chapter 4: Understanding Grids and Cells</h1>

<h2 id="grid-data-structures-representing-2d-space">Grid Data Structures: Representing 2D Space</h2>

<p>At the heart of every roguelike is a grid, a two-dimensional structure that represents the game world. Each position in the grid is a cell, and each cell can contain walls, floors, entities, or other game elements.</p>

<p>Think of it like a chessboard, but instead of squares for pieces, you have cells for game content. The grid is the foundation upon which everything else is built.</p>

<aside id="terminal-roots"><p>Early roguelikes ran inside ASCII terminals where every character cell was already a fixed-size square. The grid was not a design choice so much as the medium itself, and the genre’s aesthetic grew up around it.</p>
</aside>

<h3 id="why-grids">Why Grids?</h3>

<p>Grids provide several advantages for roguelikes:</p>

<ul>
  <li><strong>Precision</strong>: Exact positioning, no floating-point coordinates or pixel-perfect placement</li>
  <li><strong>Simplicity</strong>: Easy to reason about movement, collisions, and spatial relationships</li>
  <li><strong>Efficiency</strong>: Fast lookups and neighbour queries</li>
  <li><strong>Classic feel</strong>: Maintains the traditional roguelike aesthetic</li>
</ul>

<h3 id="representing-a-grid">Representing a Grid</h3>

<p>In Vanilla, a grid is represented as a collection of cells:</p>

<pre class="highlight"><code class="language-ruby"><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">MapUtils</span>
    <span class="k">class</span> <span class="nc">Grid</span>
      <span class="nb">attr_reader</span> <span class="ss">:rows</span><span class="p">,</span> <span class="ss">:columns</span>

      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">rows</span><span class="p">,</span> <span class="n">columns</span><span class="p">)</span>
        <span class="vi">@rows</span> <span class="o">=</span> <span class="n">rows</span>
        <span class="vi">@columns</span> <span class="o">=</span> <span class="n">columns</span>
        <span class="vi">@grid</span> <span class="o">=</span> <span class="no">Array</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">rows</span> <span class="o">*</span> <span class="n">columns</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">i</span><span class="o">|</span>
          <span class="no">Cell</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">row: </span><span class="n">i</span> <span class="o">/</span> <span class="n">columns</span><span class="p">,</span> <span class="ss">column: </span><span class="n">i</span> <span class="o">%</span> <span class="n">columns</span><span class="p">)</span>
        <span class="k">end</span>
        <span class="n">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
          <span class="n">row</span><span class="p">,</span> <span class="n">col</span> <span class="o">=</span> <span class="n">cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">cell</span><span class="p">.</span><span class="nf">column</span>
          <span class="n">cell</span><span class="p">.</span><span class="nf">north</span> <span class="o">=</span> <span class="nb">self</span><span class="p">[</span><span class="n">row</span> <span class="o">-</span> <span class="mi">1</span><span class="p">,</span> <span class="n">col</span><span class="p">]</span> <span class="k">if</span> <span class="n">row</span> <span class="o">&gt;</span> <span class="mi">0</span>
          <span class="n">cell</span><span class="p">.</span><span class="nf">south</span> <span class="o">=</span> <span class="nb">self</span><span class="p">[</span><span class="n">row</span> <span class="o">+</span> <span class="mi">1</span><span class="p">,</span> <span class="n">col</span><span class="p">]</span> <span class="k">if</span> <span class="n">row</span> <span class="o">&lt;</span> <span class="vi">@rows</span> <span class="o">-</span> <span class="mi">1</span>
          <span class="n">cell</span><span class="p">.</span><span class="nf">east</span>  <span class="o">=</span> <span class="nb">self</span><span class="p">[</span><span class="n">row</span><span class="p">,</span> <span class="n">col</span> <span class="o">+</span> <span class="mi">1</span><span class="p">]</span> <span class="k">if</span> <span class="n">col</span> <span class="o">&lt;</span> <span class="vi">@columns</span> <span class="o">-</span> <span class="mi">1</span>
          <span class="n">cell</span><span class="p">.</span><span class="nf">west</span>  <span class="o">=</span> <span class="nb">self</span><span class="p">[</span><span class="n">row</span><span class="p">,</span> <span class="n">col</span> <span class="o">-</span> <span class="mi">1</span><span class="p">]</span> <span class="k">if</span> <span class="n">col</span> <span class="o">&gt;</span> <span class="mi">0</span>
        <span class="k">end</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">[]</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">col</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">nil</span> <span class="k">unless</span> <span class="n">row</span><span class="p">.</span><span class="nf">between?</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="vi">@rows</span> <span class="o">-</span> <span class="mi">1</span><span class="p">)</span> <span class="o">&amp;&amp;</span> <span class="n">col</span><span class="p">.</span><span class="nf">between?</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="vi">@columns</span> <span class="o">-</span> <span class="mi">1</span><span class="p">)</span>
        <span class="vi">@grid</span><span class="p">[</span><span class="n">row</span> <span class="o">*</span> <span class="vi">@columns</span> <span class="o">+</span> <span class="n">col</span><span class="p">]</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span></code></pre>

<p>Notice how the grid:</p>
<ul>
  <li>Stores cells in a flat array (efficient memory layout)</li>
  <li>Provides array-like access with <code>[row, col]</code></li>
  <li>Automatically sets up neighbour relationships when created</li>
  <li>Validates bounds to prevent out-of-range access</li>
</ul>

<h2 id="cell-concepts-walls-floors-connections">Cell Concepts: Walls, Floors, Connections</h2>

<p>Each cell in the grid represents a position in the game world. But cells are more than just positions, they have properties and relationships.</p>

<h3 id="cell-properties">Cell Properties</h3>

<p>A cell can be:</p>
<ul>
  <li><strong>A wall</strong> (<code>#</code>): Impassable, blocks movement and line of sight</li>
  <li><strong>A floor</strong> (<code>.</code>): Passable, entities can move through it</li>
  <li><strong>Empty</strong>: No connections to neighbours (becomes a wall when rendered)</li>
</ul>

<h3 id="cell-connections">Cell Connections</h3>

<p>The key insight for maze generation is that cells can be <strong>linked</strong> to their neighbours. A link represents a passage between two cells. If two cells are linked, you can move between them.</p>

<pre class="highlight"><code class="language-ruby"><span class="k">class</span> <span class="nc">Cell</span>
  <span class="nb">attr_reader</span> <span class="ss">:row</span><span class="p">,</span> <span class="ss">:column</span>
  <span class="nb">attr_accessor</span> <span class="ss">:north</span><span class="p">,</span> <span class="ss">:south</span><span class="p">,</span> <span class="ss">:east</span><span class="p">,</span> <span class="ss">:west</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">row</span><span class="p">:,</span> <span class="n">column</span><span class="p">:)</span>
    <span class="vi">@row</span><span class="p">,</span> <span class="vi">@column</span> <span class="o">=</span> <span class="n">row</span><span class="p">,</span> <span class="n">column</span>
    <span class="vi">@links</span> <span class="o">=</span> <span class="p">{}</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">link</span><span class="p">(</span><span class="n">cell</span><span class="p">:,</span> <span class="ss">bidirectional: </span><span class="kp">true</span><span class="p">)</span>
    <span class="vi">@links</span><span class="p">[</span><span class="n">cell</span><span class="p">]</span> <span class="o">=</span> <span class="kp">true</span>
    <span class="n">cell</span><span class="p">.</span><span class="nf">link</span><span class="p">(</span><span class="ss">cell: </span><span class="nb">self</span><span class="p">,</span> <span class="ss">bidirectional: </span><span class="kp">false</span><span class="p">)</span> <span class="k">if</span> <span class="n">bidirectional</span>
    <span class="nb">self</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">links</span>
    <span class="vi">@links</span><span class="p">.</span><span class="nf">keys</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">linked?</span><span class="p">(</span><span class="n">cell</span><span class="p">)</span>
    <span class="vi">@links</span><span class="p">.</span><span class="nf">key?</span><span class="p">(</span><span class="n">cell</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span></code></pre>

<p>When two cells are linked, there’s a passage between them. When they’re not linked, there’s a wall. This simple concept is the foundation of all maze generation algorithms.</p>

<h3 id="visualising-links">Visualising Links</h3>

<p>Think of a cell and its four neighbours (north, south, east, west):</p>

<pre><code>    [N]
     |
[W]-[C]-[E]
     |
    [S]
</code></pre>

<p>If cell <code>C</code> is linked to <code>N</code> and <code>E</code>, you can move north or east from <code>C</code>. If <code>C</code> is not linked to <code>W</code> or <code>S</code>, those directions are blocked by walls.</p>

<h2 id="graph-theory-basics-cells-as-nodes-connections-as-edges">Graph Theory Basics: Cells as Nodes, Connections as Edges</h2>

<p>Maze generation algorithms are fundamentally about graph theory. Understanding this connection helps you see why algorithms work the way they do.</p>

<h3 id="the-graph-model">The Graph Model</h3>

<p>Think of the grid as a graph:</p>
<ul>
  <li><strong>Nodes</strong>: Each cell is a node</li>
  <li><strong>Edges</strong>: Links between cells are edges</li>
  <li><strong>Graph type</strong>: It’s an undirected graph (if A links to B, B links to A)</li>
</ul>

<h3 id="spanning-trees">Spanning Trees</h3>

<p>Most maze generation algorithms create a <strong>spanning tree</strong>, a graph where:</p>
<ul>
  <li>Every cell is reachable from every other cell (connected)</li>
  <li>There’s exactly one path between any two cells (no cycles)</li>
  <li>It’s a tree, not a general graph</li>
</ul>

<p>Why a spanning tree? Because it guarantees:</p>
<ul>
  <li><strong>Solvability</strong>: You can always reach any cell from any starting point</li>
  <li><strong>No cycles</strong>: There’s only one way to get anywhere (makes mazes more interesting)</li>
  <li><strong>Efficiency</strong>: Minimal number of connections needed</li>
</ul>

<aside id="named-algorithms"><p>Many of the maze-generation algorithms you will meet later, including Binary Tree, Sidewinder, Aldous-Broder, Wilson’s, and Recursive Backtracker, are different ways of producing exactly this same structure. They differ in how the tree feels, not in what it is.</p>
</aside>

<h3 id="pathfinding-implications">Pathfinding Implications</h3>

<p>Because mazes are spanning trees, pathfinding is straightforward:</p>
<ul>
  <li>There’s always exactly one path between any two points</li>
  <li>You can use simple algorithms like depth-first search</li>
  <li>No need for complex pathfinding like A* (though you can still use it)</li>
</ul>

<h2 id="the-grid-in-action">The Grid in Action</h2>

<p>When you create a grid in Vanilla:</p>

<ol>
  <li><strong>Grid Creation</strong>: Allocate cells in a 2D array</li>
  <li><strong>Neighbour Setup</strong>: Each cell gets references to its four neighbours</li>
  <li><strong>Algorithm Application</strong>: Maze generation algorithm links cells</li>
  <li><strong>Wall Assignment</strong>: Cells with no links become walls</li>
  <li><strong>Rendering</strong>: Grid is displayed with walls (<code>#</code>) and floors (<code>.</code>)</li>
</ol>

<h3 id="accessing-cells">Accessing Cells</h3>

<p>You access cells using row and column indices:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">grid</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">MapUtils</span><span class="o">::</span><span class="no">Grid</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="mi">10</span><span class="p">,</span> <span class="mi">10</span><span class="p">)</span>
<span class="n">cell</span> <span class="o">=</span> <span class="n">grid</span><span class="p">[</span><span class="mi">5</span><span class="p">,</span> <span class="mi">3</span><span class="p">]</span>  <span class="c1"># Get cell at row 5, column 3</span>
<span class="n">cell</span><span class="p">.</span><span class="nf">north</span>         <span class="c1"># Get northern neighbour</span>
<span class="n">cell</span><span class="p">.</span><span class="nf">neighbors</span>     <span class="c1"># Get all neighbours (north, south, east, west)</span>
</code></pre></div></div>

<h3 id="iterating-over-cells">Iterating Over Cells</h3>

<p>Most algorithms need to process every cell:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
  <span class="c1"># Process each cell</span>
  <span class="c1"># Maybe link it to a neighbour</span>
  <span class="c1"># Maybe check its properties</span>
<span class="k">end</span>
</code></pre></div></div>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Grids and cells are the foundation of roguelike worlds. Cells represent positions, links represent passages, and the grid organises everything. Understanding this structure is essential before diving into maze generation algorithms. The grid is your canvas, and algorithms are your brushes.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Visualise a grid</strong>: Draw a 5x5 grid on paper. Label each cell with its row and column. Draw arrows showing which cells are neighbours.</p>
  </li>
  <li>
    <p><strong>Think about links</strong>: In your 5x5 grid, pick two cells. How many different paths could exist between them? What if the grid was a spanning tree, how many paths then?</p>
  </li>
  <li>
    <p><strong>Explore the code</strong>: Look at Vanilla’s <code>Grid</code> and <code>Cell</code> classes. Can you trace how neighbours are set up? How are links stored?</p>
  </li>
</ol>


<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/03-first-prototype/">&larr; Your First Playable Prototype</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/05-maze-algorithms-beginning/">Maze Generation Algorithms &rarr;</a>
</nav>
{% endraw %}
