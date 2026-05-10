---
layout: page
title: "Beyond Mazes — Procedural Content"
permalink: /books/vanilla-roguelike/07-beyond-mazes/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/06-algorithm-diversity/">&larr; Exploring Algorithm Diversity</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/08-architecture-problem/">The Architecture Problem &rarr;</a>
</nav>

<h1 id="chapter-7-beyond-mazes---procedural-content">Chapter 7: Beyond Mazes - Procedural Content</h1>

<p>Maze generation is just the beginning. A roguelike needs more than walls and floors—it needs entities placed throughout the world. The player needs to spawn somewhere. Stairs need to lead to the next level. Monsters need to populate the dungeon. Items need to be scattered for the player to find.</p>

<p>This chapter explores how to place content procedurally in your generated mazes.</p>

<h2 id="placing-entities-player-spawn-stairs-items-monsters">Placing Entities: Player Spawn, Stairs, Items, Monsters</h2>

<p>Once you have a generated maze, you need to populate it. This is where procedural generation extends beyond just creating the layout.</p>

<h3 id="the-challenge">The Challenge</h3>

<p>Placing entities isn’t just about picking random positions. You need to consider:</p>

<ul>
  <li><strong>Accessibility</strong>: Can the player reach this entity?</li>
  <li><strong>Balance</strong>: Are entities distributed fairly?</li>
  <li><strong>Gameplay</strong>: Do placements make the game fun?</li>
  <li><strong>Constraints</strong>: Some entities have specific requirements</li>
</ul>

<h3 id="player-spawn">Player Spawn</h3>

<p>The player needs to start somewhere. In Vanilla, the player always spawns at position (0, 0):</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">populate_entities</span><span class="p">(</span><span class="n">grid</span><span class="p">)</span>
  <span class="n">player</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">EntityFactory</span><span class="p">.</span><span class="nf">create_player</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="mi">0</span><span class="p">)</span>
  <span class="vi">@world</span><span class="p">.</span><span class="nf">add_entity</span><span class="p">(</span><span class="n">player</span><span class="p">)</span>
  <span class="n">player_cell</span> <span class="o">=</span> <span class="n">grid</span><span class="p">[</span><span class="mi">0</span><span class="p">,</span> <span class="mi">0</span><span class="p">]</span>
  <span class="n">player_cell</span><span class="p">.</span><span class="nf">tile</span> <span class="o">=</span> <span class="n">player</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:render</span><span class="p">).</span><span class="nf">character</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This is simple, but you could make it more interesting:</p>
<ul>
  <li>Spawn at a random floor cell</li>
  <li>Spawn at the cell with the most open space around it</li>
  <li>Spawn at a “safe” location (far from monsters)</li>
</ul>

<h3 id="stairs-placement">Stairs Placement</h3>

<p>Stairs need to be reachable and ideally challenging to reach. Vanilla places stairs at the cell farthest from the player:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">find_stairs_position</span><span class="p">(</span><span class="n">grid</span><span class="p">,</span> <span class="n">player_cell</span><span class="p">)</span>
  <span class="n">distances</span> <span class="o">=</span> <span class="n">player_cell</span><span class="p">.</span><span class="nf">distances</span>
  <span class="n">farthest_cell</span> <span class="o">=</span> <span class="n">distances</span><span class="p">.</span><span class="nf">max</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">first</span> <span class="o">||</span> <span class="n">grid</span><span class="p">.</span><span class="nf">random_cell</span>

  <span class="c1"># Avoid placing stairs at player's position</span>
  <span class="k">if</span> <span class="n">farthest_cell</span> <span class="o">==</span> <span class="n">player_cell</span>
    <span class="n">stairs_cell</span> <span class="o">=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">random_cell</span>
    <span class="k">while</span> <span class="n">stairs_cell</span> <span class="o">==</span> <span class="n">player_cell</span>
      <span class="n">stairs_cell</span> <span class="o">=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">random_cell</span>
    <span class="k">end</span>
    <span class="k">return</span> <span class="p">{</span> <span class="ss">row: </span><span class="n">stairs_cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="ss">column: </span><span class="n">stairs_cell</span><span class="p">.</span><span class="nf">column</span> <span class="p">}</span>
  <span class="k">end</span>

  <span class="p">{</span> <span class="ss">row: </span><span class="n">farthest_cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="ss">column: </span><span class="n">farthest_cell</span><span class="p">.</span><span class="nf">column</span> <span class="p">}</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This ensures:</p>
<ul>
  <li>The stairs are at the maximum distance (encourages exploration)</li>
  <li>There’s always a path (because mazes are spanning trees)</li>
  <li>The player must traverse the entire maze to reach them</li>
</ul>

<h3 id="ensuring-connectivity">Ensuring Connectivity</h3>

<p>Sometimes algorithms or entity placement can create disconnected regions. Vanilla ensures there’s always a path from player to stairs:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">ensure_path</span><span class="p">(</span><span class="n">grid</span><span class="p">,</span> <span class="n">start_cell</span><span class="p">,</span> <span class="n">goal_cell</span><span class="p">)</span>
  <span class="n">current</span> <span class="o">=</span> <span class="n">start_cell</span>
  <span class="k">until</span> <span class="n">current</span> <span class="o">==</span> <span class="n">goal_cell</span>
    <span class="n">next_cell</span> <span class="o">=</span> <span class="p">[</span><span class="n">current</span><span class="p">.</span><span class="nf">north</span><span class="p">,</span> <span class="n">current</span><span class="p">.</span><span class="nf">south</span><span class="p">,</span> <span class="n">current</span><span class="p">.</span>
          <span class="nf">east</span><span class="p">,</span> <span class="n">current</span><span class="p">.</span><span class="nf">west</span><span class="p">]</span>
      <span class="p">.</span><span class="nf">compact</span>
      <span class="p">.</span><span class="nf">min_by</span> <span class="p">{</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span> <span class="n">manhattan_distance</span><span class="p">(</span><span class="n">cell</span><span class="p">,</span> <span class="n">goal_cell</span><span class="p">)</span> <span class="p">}</span>

    <span class="k">if</span> <span class="n">next_cell</span>
      <span class="n">current</span><span class="p">.</span><span class="nf">link</span><span class="p">(</span><span class="ss">cell: </span><span class="n">next_cell</span><span class="p">,</span> <span class="ss">bidirectional: </span><span class="kp">true</span><span class="p">)</span>
      <span class="n">current</span> <span class="o">=</span> <span class="n">next_cell</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This creates a guaranteed path using a simple greedy approach: always move toward the goal.</p>

<h2 id="seeding-for-reproducibility">Seeding for Reproducibility</h2>

<p>One of the most powerful features of procedural generation is <strong>seeding</strong>—the ability to generate the same world by using the same random seed.</p>

<h3 id="why-seeding-matters">Why Seeding Matters</h3>

<p>Seeds enable:</p>
<ul>
  <li><strong>Debugging</strong>: Reproduce bugs by using the same seed</li>
  <li><strong>Testing</strong>: Test specific scenarios consistently</li>
  <li><strong>Sharing</strong>: Players can share interesting seeds</li>
  <li><strong>Replayability</strong>: Revisit favorite levels</li>
</ul>

<h3 id="how-seeding-works">How Seeding Works</h3>

<p>In Vanilla, the seed is set when the game starts:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">world</span><span class="p">,</span> <span class="n">difficulty</span><span class="p">:,</span> <span class="ss">seed: </span><span class="no">Random</span><span class="p">.</span><span class="nf">new_seed</span><span class="p">)</span>
  <span class="vi">@seed</span> <span class="o">=</span> <span class="n">seed</span>
  <span class="nb">srand</span><span class="p">(</span><span class="vi">@seed</span><span class="p">)</span>  <span class="c1"># Set the random number generator seed</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Then all random operations use this seed:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In maze generation</span>
<span class="n">neighbor</span> <span class="o">=</span> <span class="n">neighbors</span><span class="p">.</span><span class="nf">sample</span>  <span class="c1"># Uses the seed</span>

<span class="c1"># In entity placement</span>
<span class="n">random_cell</span> <span class="o">=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">random_cell</span>  <span class="c1"># Uses the seed</span>
</code></pre></div></div>

<h3 id="seed-based-generation-flow">Seed-Based Generation Flow</h3>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/c678991aca4e8872baa1869581dc332d4dd322316ce616565f04b4ca5c79e2e7.svg" alt="D2 diagram: Game Starts"></figure>

<p>Same seed + same algorithm = same level. This predictability is crucial for debugging and testing.</p>

<h2 id="difficulty-scaling">Difficulty Scaling</h2>

<p>As players progress, levels should become more challenging. Vanilla uses a simple difficulty system:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">world</span><span class="p">,</span> <span class="n">difficulty</span><span class="p">:,</span> <span class="ss">seed: </span><span class="no">Random</span><span class="p">.</span><span class="nf">new_seed</span><span class="p">)</span>
  <span class="vi">@difficulty</span> <span class="o">=</span> <span class="n">difficulty</span>
  <span class="vi">@seed</span> <span class="o">=</span> <span class="n">seed</span>
  <span class="c1"># Difficulty affects monster spawning, not maze generation</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="scaling-strategies">Scaling Strategies</h3>

<p><strong>Monster density:</strong></p>
<ul>
  <li>More monsters on deeper levels</li>
  <li>Stronger monsters as difficulty increases</li>
  <li>Different monster types at different depths</li>
</ul>

<p><strong>Item rarity:</strong></p>
<ul>
  <li>Better items on deeper levels</li>
  <li>More items to compensate for difficulty</li>
  <li>Rare items only at high difficulty</li>
</ul>

<p><strong>Maze complexity:</strong></p>
<ul>
  <li>Larger mazes at higher difficulty</li>
  <li>More complex algorithms for deeper levels</li>
  <li>More dead ends (harder navigation)</li>
</ul>

<p><strong>Resource scarcity:</strong></p>
<ul>
  <li>Fewer healing items</li>
  <li>More traps or hazards</li>
  <li>Limited resources force careful play</li>
</ul>

<h3 id="vanillas-approach">Vanilla’s Approach</h3>

<p>Currently, Vanilla’s difficulty primarily affects monster spawning:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">monster_system</span><span class="p">.</span><span class="nf">spawn_monsters</span><span class="p">(</span><span class="vi">@difficulty</span><span class="p">,</span> <span class="n">grid</span><span class="p">)</span>
</code></pre></div></div>

<p>The maze generation algorithm stays the same, but more (or stronger) monsters appear as difficulty increases. This is a simple approach that works, but you could make it more sophisticated.</p>

<h2 id="procedural-item-placement">Procedural Item Placement</h2>

<p>Items need to be placed thoughtfully. Random placement can create unfair situations or boring gameplay.</p>

<h3 id="placement-strategies">Placement Strategies</h3>

<p><strong>Random floor cells:</strong></p>
<ul>
  <li>Simple but can create clusters</li>
  <li>Might place items in unreachable areas</li>
  <li>Fast but unpredictable</li>
</ul>

<p><strong>Distance-based:</strong></p>
<ul>
  <li>Place items at certain distances from player</li>
  <li>Ensures items are reachable</li>
  <li>Can create interesting exploration patterns</li>
</ul>

<p><strong>Room-based:</strong></p>
<ul>
  <li>If you have rooms, place items in rooms</li>
  <li>More structured, less random</li>
  <li>Feels more intentional</li>
</ul>

<p><strong>Guaranteed minimums:</strong></p>
<ul>
  <li>Ensure at least N items per level</li>
  <li>Prevent “empty” levels</li>
  <li>Balance gameplay</li>
</ul>

<h3 id="vanillas-loot-system">Vanilla’s Loot System</h3>

<p>Vanilla uses a loot system that places items when monsters die (see Chapter 16). But you could also place items during level generation:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">place_items</span><span class="p">(</span><span class="n">grid</span><span class="p">,</span> <span class="n">difficulty</span><span class="p">)</span>
  <span class="n">item_count</span> <span class="o">=</span> <span class="n">calculate_item_count</span><span class="p">(</span><span class="n">difficulty</span><span class="p">)</span>
  <span class="n">floor_cells</span> <span class="o">=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span><span class="p">.</span><span class="nf">select</span> <span class="p">{</span> <span class="o">|</span><span class="n">c</span><span class="o">|</span> <span class="o">!</span><span class="n">c</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span> <span class="p">}</span>

  <span class="n">item_count</span><span class="p">.</span><span class="nf">times</span> <span class="k">do</span>
    <span class="n">cell</span> <span class="o">=</span> <span class="n">floor_cells</span><span class="p">.</span><span class="nf">sample</span>
    <span class="n">item</span> <span class="o">=</span> <span class="n">create_random_item</span>
    <span class="n">place_item_at</span><span class="p">(</span><span class="n">cell</span><span class="p">,</span> <span class="n">item</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h2 id="putting-it-all-together">Putting It All Together</h2>

<p>Level generation in Vanilla follows this flow:</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/34f955ef904a4aa855a2ec2767ece753e4e8651046e7501fa62e98aa8872e4bd.svg" alt="D2 diagram: 1. Game requests Generate Level (difficulty, seed)"></figure>

<p>Each step uses the seed for reproducibility, and difficulty affects entity placement.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Procedural generation extends far beyond maze creation. Entity placement, seeding, and difficulty scaling all contribute to creating interesting, playable levels. The same principles of algorithms and randomness apply, but now you’re generating content, not just structure.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Experiment with placement</strong>: Modify Vanilla’s entity placement. What happens if you place stairs randomly instead of at the farthest point?</p>
  </li>
  <li>
    <p><strong>Test seeds</strong>: Run Vanilla with the same seed multiple times. Does it generate the same level? What if you change the algorithm but keep the seed?</p>
  </li>
  <li>
    <p><strong>Design difficulty scaling</strong>: How would you scale difficulty in your roguelike? What would change between level 1 and level 10?</p>
  </li>
  <li>
    <p><strong>Place items</strong>: Implement a simple item placement system. How do you ensure items are reachable? How do you prevent clustering?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/06-algorithm-diversity/">&larr; Exploring Algorithm Diversity</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/08-architecture-problem/">The Architecture Problem &rarr;</a>
</nav>
