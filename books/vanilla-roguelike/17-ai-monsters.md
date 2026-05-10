---
layout: page
title: "AI and Monsters"
permalink: /books/vanilla-roguelike/17-ai-monsters/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/16-items-inventory/">&larr; Items and Inventory</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/18-event-driven/">Event-Driven Architecture &rarr;</a>
</nav>

<h1 id="chapter-17-ai-and-monsters">Chapter 17: AI and Monsters</h1>

<h2 id="simple-ai-patterns-random-movement-player-detection">Simple AI Patterns: Random Movement, Player Detection</h2>

<p>Monster AI in Vanilla is simple but effective. Monsters either move randomly or toward the player.</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/643313fc9d077aa24b7585d1b8df3af1d20fc7b269bffc9e7bcad14ff3b2261c.svg" alt="D2 diagram: MonsterSystem update:\nGet Monster and Player positions,\ncalculate direction to player"></figure>

<h3 id="monstersystem-managing-monsters">MonsterSystem: Managing Monsters</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">MonsterSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
      <span class="k">def</span> <span class="nf">update</span><span class="p">(</span><span class="n">_delta_time</span><span class="p">)</span>
        <span class="c1"># Remove dead monsters</span>
        <span class="vi">@monsters</span><span class="p">.</span><span class="nf">reject!</span> <span class="k">do</span> <span class="o">|</span><span class="n">monster</span><span class="o">|</span>
          <span class="n">health</span> <span class="o">=</span> <span class="n">monster</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:health</span><span class="p">)</span>
          <span class="k">if</span> <span class="n">health</span><span class="p">.</span><span class="nf">current_health</span> <span class="o">&lt;=</span> <span class="mi">0</span>
            <span class="vi">@world</span><span class="p">.</span><span class="nf">remove_entity</span><span class="p">(</span><span class="n">monster</span><span class="p">.</span><span class="nf">id</span><span class="p">)</span>
            <span class="kp">true</span>
          <span class="k">else</span>
            <span class="kp">false</span>
          <span class="k">end</span>
        <span class="k">end</span>

        <span class="c1"># Move living monsters</span>
        <span class="vi">@monsters</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">monster</span><span class="o">|</span> <span class="n">move_monster</span><span class="p">(</span><span class="n">monster</span><span class="p">)</span> <span class="p">}</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">move_monster</span><span class="p">(</span><span class="n">monster</span><span class="p">)</span>
        <span class="n">player_pos</span> <span class="o">=</span> <span class="vi">@player</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>
        <span class="n">monster_pos</span> <span class="o">=</span> <span class="n">monster</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>

        <span class="c1"># Simple AI: move toward player</span>
        <span class="n">direction</span> <span class="o">=</span> <span class="n">choose_direction</span><span class="p">(</span><span class="n">monster_pos</span><span class="p">,</span> <span class="n">player_pos</span><span class="p">)</span>
        <span class="n">movement_system</span> <span class="o">=</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">systems</span><span class="p">.</span><span class="nf">find</span> <span class="p">{</span> <span class="o">|</span><span class="n">s</span><span class="p">,</span> <span class="n">_</span><span class="o">|</span> <span class="n">s</span><span class="p">.</span>
              <span class="nf">is_a?</span><span class="p">(</span><span class="no">MovementSystem</span><span class="p">)</span> <span class="p">}</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">first</span>
        <span class="n">movement_system</span><span class="p">.</span><span class="nf">move</span><span class="p">(</span><span class="n">monster</span><span class="p">,</span> <span class="n">direction</span><span class="p">)</span> <span class="k">if</span> <span class="n">direction</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">choose_direction</span><span class="p">(</span><span class="n">monster_pos</span><span class="p">,</span> <span class="n">player_pos</span><span class="p">)</span>
        <span class="n">row_diff</span> <span class="o">=</span> <span class="n">player_pos</span><span class="p">.</span><span class="nf">row</span> <span class="o">-</span> <span class="n">monster_pos</span><span class="p">.</span><span class="nf">row</span>
        <span class="n">col_diff</span> <span class="o">=</span> <span class="n">player_pos</span><span class="p">.</span><span class="nf">column</span> <span class="o">-</span> <span class="n">monster_pos</span><span class="p">.</span><span class="nf">column</span>

        <span class="c1"># Prefer moving toward player</span>
        <span class="k">if</span> <span class="n">row_diff</span><span class="p">.</span><span class="nf">abs</span> <span class="o">&gt;</span> <span class="n">col_diff</span><span class="p">.</span><span class="nf">abs</span>
          <span class="n">row_diff</span> <span class="o">&gt;</span> <span class="mi">0</span> <span class="p">?</span> <span class="ss">:south</span> <span class="p">:</span> <span class="ss">:north</span>
        <span class="k">else</span>
          <span class="n">col_diff</span> <span class="o">&gt;</span> <span class="mi">0</span> <span class="p">?</span> <span class="ss">:east</span> <span class="p">:</span> <span class="ss">:west</span>
        <span class="k">end</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system:</p>
<ul>
  <li>Manages monster lifecycle (spawning, removal)</li>
  <li>Implements simple AI (move toward player)</li>
  <li>Uses the same <code>MovementSystem</code> as the player</li>
</ul>

<h2 id="monster-spawning-procedural-placement">Monster Spawning: Procedural Placement</h2>

<p>Monsters are spawned during level generation:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">spawn_monsters</span><span class="p">(</span><span class="n">level</span><span class="p">,</span> <span class="n">grid</span><span class="p">)</span>
  <span class="n">count</span> <span class="o">=</span> <span class="n">determine_monster_count</span><span class="p">(</span><span class="n">level</span><span class="p">)</span>
  <span class="n">count</span><span class="p">.</span><span class="nf">times</span> <span class="p">{</span> <span class="n">spawn_monster</span><span class="p">(</span><span class="n">level</span><span class="p">,</span> <span class="n">grid</span><span class="p">)</span> <span class="p">}</span>
<span class="k">end</span>

<span class="k">def</span> <span class="nf">spawn_monster</span><span class="p">(</span><span class="n">level</span><span class="p">,</span> <span class="n">grid</span><span class="p">)</span>
  <span class="c1"># Find a random floor cell</span>
  <span class="n">floor_cells</span> <span class="o">=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span><span class="p">.</span><span class="nf">select</span> <span class="p">{</span> <span class="o">|</span><span class="n">c</span><span class="o">|</span> <span class="o">!</span><span class="n">c</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span> <span class="p">}</span>
  <span class="n">cell</span> <span class="o">=</span> <span class="n">floor_cells</span><span class="p">.</span><span class="nf">sample</span>

  <span class="c1"># Create monster entity</span>
  <span class="n">monster</span> <span class="o">=</span> <span class="no">EntityFactory</span><span class="p">.</span><span class="nf">create_monster</span><span class="p">(</span><span class="ss">:goblin</span><span class="p">,</span> <span class="n">cell</span><span class="p">.</span>
        <span class="nf">row</span><span class="p">,</span> <span class="n">cell</span><span class="p">.</span><span class="nf">column</span><span class="p">,</span> <span class="mi">30</span><span class="p">,</span> <span class="mi">5</span><span class="p">)</span>
  <span class="vi">@world</span><span class="p">.</span><span class="nf">add_entity</span><span class="p">(</span><span class="n">monster</span><span class="p">)</span>
  <span class="vi">@monsters</span> <span class="o">&lt;&lt;</span> <span class="n">monster</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Monsters are placed on floor cells, ensuring they’re reachable.</p>

<h2 id="monster-behavior-systems-that-control-non-player-entities">Monster Behavior: Systems That Control Non-Player Entities</h2>

<p>Monster behavior is just another system processing entities:</p>

<ul>
  <li><strong>MonsterSystem</strong>: Manages monster AI and lifecycle</li>
  <li><strong>MovementSystem</strong>: Handles monster movement (same as player)</li>
  <li><strong>CombatSystem</strong>: Processes monster attacks</li>
  <li><strong>RenderSystem</strong>: Draws monsters (same as other entities)</li>
</ul>

<p>Monsters are entities with components, processed by systems. No special handling needed.</p>

<h2 id="ai-is-just-another-system-processing-entities">AI Is Just Another System Processing Entities</h2>

<p>This is the power of ECS: AI is just a system that processes entities. You could:</p>

<ul>
  <li>Add different AI behaviors (flee, patrol, guard)</li>
  <li>Create different monster types (fast, strong, smart)</li>
  <li>Implement complex AI (pathfinding, group behavior)</li>
</ul>

<p>All by adding components and systems. The architecture supports any behavior.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>AI in ECS is just another system processing entities. Monsters are entities with components, and systems control their behavior. This makes AI extensible: add new components for new behaviors, add new systems for new AI patterns.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Design AI</strong>: How would you implement a “fleeing” monster? What components and systems would you need?</p>
  </li>
  <li>
    <p><strong>Monster types</strong>: How would you create different monster types with different behaviors? What would vary?</p>
  </li>
  <li>
    <p><strong>Pathfinding</strong>: How would you implement A* pathfinding for monsters? What system would handle it?</p>
  </li>
  <li>
    <p><strong>Group behavior</strong>: How would you make monsters work together? What new systems would you create?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/16-items-inventory/">&larr; Items and Inventory</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/18-event-driven/">Event-Driven Architecture &rarr;</a>
</nav>
