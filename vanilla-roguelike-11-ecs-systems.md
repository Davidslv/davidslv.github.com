---
layout: page
title: "Building ECS — Systems"
permalink: /vanilla-roguelike/11-ecs-systems/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/10-ecs-entities-components/">&larr; Building ECS — Entities and Components</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/12-world-coordinator/">The World Coordinator &rarr;</a>
</nav>

<h1 id="chapter-11-building-ecs---systems">Chapter 11: Building ECS - Systems</h1>

<h2 id="systems-logic-that-processes-entities">Systems: Logic That Processes Entities</h2>

<p>Systems are where the behavior lives in ECS. They contain the logic that operates on entities with specific component combinations. A system doesn’t care what type of entity it’s processing—it only cares about the components.</p>

<h3 id="system-base-class">System Base Class</h3>

<p>In Vanilla, all systems inherit from a base <code>System</code> class:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">System</span>
      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">world</span><span class="p">)</span>
        <span class="vi">@world</span> <span class="o">=</span> <span class="n">world</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">update</span><span class="p">(</span><span class="n">_delta_time</span><span class="p">)</span>
        <span class="c1"># Override in subclasses</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">entities_with</span><span class="p">(</span><span class="o">*</span><span class="n">component_types</span><span class="p">)</span>
        <span class="vi">@world</span><span class="p">.</span><span class="nf">query_entities</span><span class="p">(</span><span class="n">component_types</span><span class="p">)</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">emit_event</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="n">data</span> <span class="o">=</span> <span class="p">{})</span>
        <span class="vi">@world</span><span class="p">.</span><span class="nf">emit_event</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="n">data</span><span class="p">)</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">queue_command</span><span class="p">(</span><span class="n">command</span><span class="p">)</span>
        <span class="vi">@world</span><span class="p">.</span><span class="nf">queue_command</span><span class="p">(</span><span class="n">command</span><span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The base system provides:</p>
<ul>
  <li>Access to the world (for querying entities)</li>
  <li>Helper methods to find entities with specific components</li>
  <li>Methods to emit events and queue commands</li>
</ul>

<h3 id="movementsystem-processing-movement">MovementSystem: Processing Movement</h3>

<p>The <code>MovementSystem</code> processes entities that can move:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">MovementSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
      <span class="k">def</span> <span class="nf">update</span><span class="p">(</span><span class="n">_delta_time</span><span class="p">)</span>
        <span class="n">movable_entities</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:position</span><span class="p">,</span> <span class="ss">:movement</span><span class="p">,</span> <span class="ss">:input</span><span class="p">,</span>
              <span class="ss">:render</span><span class="p">)</span>
        <span class="n">movable_entities</span><span class="p">.</span>
              <span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">entity</span><span class="o">|</span> <span class="n">process_entity_movement</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span> <span class="p">}</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">process_entity_movement</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span>
        <span class="n">input</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:input</span><span class="p">)</span>
        <span class="n">direction</span> <span class="o">=</span> <span class="n">input</span><span class="p">.</span><span class="nf">move_direction</span>
        <span class="k">return</span> <span class="k">unless</span> <span class="n">direction</span>

        <span class="n">success</span> <span class="o">=</span> <span class="n">move</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">direction</span><span class="p">)</span>
        <span class="n">input</span><span class="p">.</span><span class="nf">move_direction</span> <span class="o">=</span> <span class="kp">nil</span> <span class="k">if</span> <span class="n">success</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">move</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">direction</span><span class="p">)</span>
        <span class="n">position</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>
        <span class="n">movement</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:movement</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">movement</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">active?</span>

        <span class="n">grid</span> <span class="o">=</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">current_level</span><span class="p">.</span><span class="nf">grid</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">grid</span>

        <span class="n">current_cell</span> <span class="o">=</span> <span class="n">grid</span><span class="p">[</span><span class="n">position</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">position</span><span class="p">.</span><span class="nf">column</span><span class="p">]</span>
        <span class="n">new_cell</span> <span class="o">=</span> <span class="n">get_cell_in_direction</span><span class="p">(</span><span class="n">current_cell</span><span class="p">,</span> <span class="n">direction</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">new_cell</span> <span class="o">&amp;&amp;</span> <span class="n">can_move_to?</span><span class="p">(</span><span class="n">new_cell</span><span class="p">)</span>

        <span class="n">position</span><span class="p">.</span><span class="nf">set_position</span><span class="p">(</span><span class="n">new_cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">new_cell</span><span class="p">.</span><span class="nf">column</span><span class="p">)</span>
        <span class="n">emit_event</span><span class="p">(</span><span class="ss">:movement_succeeded</span><span class="p">,</span> <span class="p">{</span>
          <span class="ss">entity_id: </span><span class="n">entity</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
          <span class="ss">new_position: </span><span class="p">{</span> <span class="ss">row: </span><span class="n">new_cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="ss">column: </span><span class="n">new_cell</span><span class="p">.</span><span class="nf">column</span> <span class="p">}</span>
        <span class="p">})</span>
        <span class="kp">true</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Notice:</p>
<ul>
  <li>The system queries for entities with specific components (<code>:position, :movement, :input, :render</code>)</li>
  <li>It doesn’t care if it’s a player, monster, or anything else</li>
  <li>It processes each entity based on its components</li>
  <li>It emits events to notify other systems</li>
</ul>

<h3 id="rendersystem-drawing-entities">RenderSystem: Drawing Entities</h3>

<p>The <code>RenderSystem</code> draws entities that can be seen:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">RenderSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
      <span class="k">def</span> <span class="nf">update</span><span class="p">(</span><span class="n">_delta_time</span><span class="p">)</span>
        <span class="n">grid</span> <span class="o">=</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">current_level</span><span class="p">.</span><span class="nf">grid</span>
        <span class="k">return</span> <span class="k">unless</span> <span class="n">grid</span>

        <span class="c1"># Draw grid</span>
        <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
          <span class="n">draw_cell</span><span class="p">(</span><span class="n">cell</span><span class="p">)</span>
        <span class="k">end</span>

        <span class="c1"># Draw entities</span>
        <span class="n">renderable_entities</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:position</span><span class="p">,</span> <span class="ss">:render</span><span class="p">)</span>
        <span class="n">renderable_entities</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">entity</span><span class="o">|</span>
          <span class="n">position</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>
          <span class="n">render</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:render</span><span class="p">)</span>
          <span class="n">draw_entity</span><span class="p">(</span><span class="n">position</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">position</span><span class="p">.</span><span class="nf">column</span><span class="p">,</span> <span class="n">render</span><span class="p">.</span><span class="nf">character</span><span class="p">)</span>
        <span class="k">end</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system:</p>
<ul>
  <li>Queries for entities with <code>:position</code> and <code>:render</code> components</li>
  <li>Draws each entity at its position</li>
  <li>Doesn’t know or care what type of entity it’s drawing</li>
</ul>

<h3 id="combatsystem-handling-combat">CombatSystem: Handling Combat</h3>

<p>The <code>CombatSystem</code> processes combat between entities:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">CombatSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
      <span class="k">def</span> <span class="nf">process_attack</span><span class="p">(</span><span class="n">attacker</span><span class="p">,</span> <span class="n">target</span><span class="p">)</span>
        <span class="n">attacker_combat</span> <span class="o">=</span> <span class="n">attacker</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:combat</span><span class="p">)</span>
        <span class="n">target_combat</span> <span class="o">=</span> <span class="n">target</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:combat</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">attacker_combat</span> <span class="o">&amp;&amp;</span> <span class="n">target_combat</span>

        <span class="c1"># Check if attack hits</span>
        <span class="n">hit</span> <span class="o">=</span> <span class="nb">rand</span> <span class="o">&lt;</span> <span class="n">attacker_combat</span><span class="p">.</span><span class="nf">accuracy</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">hit</span>

        <span class="c1"># Calculate damage</span>
        <span class="n">damage</span> <span class="o">=</span> <span class="n">calculate_damage</span><span class="p">(</span><span class="n">attacker_combat</span><span class="p">,</span> <span class="n">target_combat</span><span class="p">)</span>

        <span class="c1"># Apply damage</span>
        <span class="n">apply_damage</span><span class="p">(</span><span class="n">target</span><span class="p">,</span> <span class="n">damage</span><span class="p">,</span> <span class="n">attacker</span><span class="p">)</span>

        <span class="c1"># Check for death</span>
        <span class="n">check_death</span><span class="p">(</span><span class="n">target</span><span class="p">,</span> <span class="n">attacker</span><span class="p">)</span>

        <span class="kp">true</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">calculate_damage</span><span class="p">(</span><span class="n">attacker_combat</span><span class="p">,</span> <span class="n">defender_combat</span><span class="p">)</span>
        <span class="n">damage</span> <span class="o">=</span> <span class="n">attacker_combat</span><span class="p">.</span><span class="nf">attack_power</span> <span class="o">-</span> <span class="n">defender_combat</span><span class="p">.</span>
              <span class="nf">defense</span>
        <span class="p">[</span><span class="n">damage</span><span class="p">,</span> <span class="mi">1</span><span class="p">].</span><span class="nf">max</span>  <span class="c1"># Minimum 1 damage</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">apply_damage</span><span class="p">(</span><span class="n">target</span><span class="p">,</span> <span class="n">damage</span><span class="p">,</span> <span class="n">source</span> <span class="o">=</span> <span class="kp">nil</span><span class="p">)</span>
        <span class="n">health</span> <span class="o">=</span> <span class="n">target</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:health</span><span class="p">)</span>
        <span class="k">return</span> <span class="k">unless</span> <span class="n">health</span>

        <span class="n">health</span><span class="p">.</span><span class="nf">current_health</span> <span class="o">=</span> <span class="p">[</span><span class="n">health</span><span class="p">.</span>
              <span class="nf">current_health</span> <span class="o">-</span> <span class="n">damage</span><span class="p">,</span> <span class="mi">0</span><span class="p">].</span><span class="nf">max</span>

        <span class="n">emit_event</span><span class="p">(</span><span class="ss">:combat_damage</span><span class="p">,</span> <span class="p">{</span>
          <span class="ss">target_id: </span><span class="n">target</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
          <span class="ss">damage: </span><span class="n">damage</span><span class="p">,</span>
          <span class="ss">source_id: </span><span class="n">source</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">id</span>
        <span class="p">})</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">check_death</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">killer</span> <span class="o">=</span> <span class="kp">nil</span><span class="p">)</span>
        <span class="n">health</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:health</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">health</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">health</span><span class="p">.</span><span class="nf">current_health</span> <span class="o">&lt;=</span> <span class="mi">0</span>

        <span class="n">emit_event</span><span class="p">(</span><span class="ss">:combat_death</span><span class="p">,</span> <span class="p">{</span>
          <span class="ss">entity_id: </span><span class="n">entity</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
          <span class="ss">killer_id: </span><span class="n">killer</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">id</span>
        <span class="p">})</span>

        <span class="vi">@world</span><span class="p">.</span><span class="nf">remove_entity</span><span class="p">(</span><span class="n">entity</span><span class="p">.</span><span class="nf">id</span><span class="p">)</span>
        <span class="kp">true</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system:</p>
<ul>
  <li>Operates on entities with <code>:combat</code> and <code>:health</code> components</li>
  <li>Calculates damage based on component data</li>
  <li>Modifies health components</li>
  <li>Emits events for other systems to react to</li>
</ul>

<h2 id="system-priority-order-matters">System Priority: Order Matters</h2>

<p>Systems run in a specific order. This is crucial because some systems depend on others completing first.</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/07bbb23586300c17becfa1096b581148368ce30728314cf245c8f92a545c0ccf.svg" alt="D2 diagram: MazeSystem\nPriority: 0"></figure>

<h3 id="vanillas-system-order">Vanilla’s System Order</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Systems are added with priorities</span>
<span class="vi">@world</span><span class="p">.</span><span class="nf">add_system</span><span class="p">(</span><span class="no">MazeSystem</span><span class="p">.</span>
      <span class="nf">new</span><span class="p">(</span><span class="vi">@world</span><span class="p">),</span> <span class="mi">0</span><span class="p">)</span>        <span class="c1"># Generate maze first</span>
<span class="vi">@world</span><span class="p">.</span><span class="nf">add_system</span><span class="p">(</span><span class="no">InputSystem</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="vi">@world</span><span class="p">),</span> <span class="mi">1</span><span class="p">)</span>        <span class="c1"># Process input</span>
<span class="vi">@world</span><span class="p">.</span><span class="nf">add_system</span><span class="p">(</span><span class="no">MovementSystem</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="vi">@world</span><span class="p">),</span> <span class="mi">2</span><span class="p">)</span>     <span class="c1"># Move entities</span>
<span class="vi">@world</span><span class="p">.</span><span class="nf">add_system</span><span class="p">(</span><span class="no">CombatSystem</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="vi">@world</span><span class="p">),</span> <span class="mi">3</span><span class="p">)</span>       <span class="c1"># Handle combat</span>
<span class="vi">@world</span><span class="p">.</span><span class="nf">add_system</span><span class="p">(</span><span class="no">CollisionSystem</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="vi">@world</span><span class="p">),</span> <span class="mi">3</span><span class="p">)</span>   <span class="c1"># Check collisions</span>
<span class="vi">@world</span><span class="p">.</span><span class="nf">add_system</span><span class="p">(</span><span class="no">MonsterSystem</span><span class="p">.</span>
      <span class="nf">new</span><span class="p">(</span><span class="vi">@world</span><span class="p">),</span> <span class="mi">4</span><span class="p">)</span>     <span class="c1"># Update monster AI</span>
<span class="vi">@world</span><span class="p">.</span><span class="nf">add_system</span><span class="p">(</span><span class="no">RenderSystem</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="vi">@world</span><span class="p">),</span> <span class="mi">10</span><span class="p">)</span>     <span class="c1"># Render last</span>
</code></pre></div></div>

<p>The order ensures:</p>
<ol>
  <li><strong>Maze generation</strong> happens first (if needed)</li>
  <li><strong>Input</strong> is processed before movement</li>
  <li><strong>Movement</strong> happens before collision detection</li>
  <li><strong>Combat</strong> and <strong>collisions</strong> are checked after movement</li>
  <li><strong>Monster AI</strong> runs after player actions</li>
  <li><strong>Rendering</strong> happens last, showing the final state</li>
</ol>

<h3 id="why-order-matters">Why Order Matters</h3>

<p>If systems ran in the wrong order, you’d see:</p>
<ul>
  <li>Entities rendering before they move (flickering)</li>
  <li>Collisions detected before movement (false positives)</li>
  <li>Input processed after rendering (delayed response)</li>
</ul>

<p>The priority system ensures correct execution order.</p>

<h2 id="query-pattern-finding-entities-by-components">Query Pattern: Finding Entities by Components</h2>

<p>Systems find entities using the query pattern:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">entities_with</span><span class="p">(</span><span class="o">*</span><span class="n">component_types</span><span class="p">)</span>
  <span class="vi">@world</span><span class="p">.</span><span class="nf">query_entities</span><span class="p">(</span><span class="n">component_types</span><span class="p">)</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This returns all entities that have <strong>all</strong> of the specified components.</p>

<p><strong>Example:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Find all entities that can move and be rendered</span>
<span class="n">movable</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:position</span><span class="p">,</span> <span class="ss">:movement</span><span class="p">,</span> <span class="ss">:render</span><span class="p">)</span>

<span class="c1"># Find all entities that can fight</span>
<span class="n">combatants</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:combat</span><span class="p">,</span> <span class="ss">:health</span><span class="p">)</span>

<span class="c1"># Find all entities that are items</span>
<span class="n">items</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:item</span><span class="p">,</span> <span class="ss">:position</span><span class="p">)</span>
</code></pre></div></div>

<p>The query is efficient because:</p>
<ul>
  <li>It only checks entities that exist</li>
  <li>It uses component maps for fast lookups</li>
  <li>It returns only entities that match all requirements</li>
</ul>

<h2 id="system-update-pattern">System Update Pattern</h2>

<p>Every system follows the same pattern:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">update</span><span class="p">(</span><span class="n">_delta_time</span><span class="p">)</span>
  <span class="c1"># 1. Query for entities with required components</span>
  <span class="n">relevant_entities</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span><span class="ss">:component1</span><span class="p">,</span> <span class="ss">:component2</span><span class="p">)</span>

  <span class="c1"># 2. Process each entity</span>
  <span class="n">relevant_entities</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">entity</span><span class="o">|</span>
    <span class="n">process_entity</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="c1"># 3. Emit events if needed</span>
  <span class="n">emit_event</span><span class="p">(</span><span class="ss">:system_completed</span><span class="p">,</span> <span class="p">{</span> <span class="ss">count: </span><span class="n">relevant_entities</span><span class="p">.</span><span class="nf">size</span> <span class="p">})</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This pattern ensures:</p>
<ul>
  <li>Systems only process relevant entities</li>
  <li>Logic is consistent across systems</li>
  <li>Events are emitted for other systems to react</li>
</ul>

<h2 id="system-independence">System Independence</h2>

<p>Systems are independent. They don’t know about each other. They communicate through:</p>
<ul>
  <li><strong>Events</strong>: Systems emit events that other systems can subscribe to</li>
  <li><strong>Components</strong>: Systems read and modify components</li>
  <li><strong>World queries</strong>: Systems query for entities through the world</li>
</ul>

<p>This independence makes systems:</p>
<ul>
  <li><strong>Testable</strong>: Test a system in isolation</li>
  <li><strong>Reusable</strong>: Use the same system in different games</li>
  <li><strong>Maintainable</strong>: Change one system without affecting others</li>
</ul>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Systems contain the behavior in ECS. They query for entities with specific components, process them, and emit events. Systems are independent, reusable, and testable. Understanding how systems work is key to building with ECS.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Design a system</strong>: Think of a new game feature (like hunger or magic). What system would you create? What components would it query for?</p>
  </li>
  <li>
    <p><strong>System order</strong>: Why does <code>RenderSystem</code> run last? What would happen if it ran first?</p>
  </li>
  <li>
    <p><strong>Query practice</strong>: What query would you use to find all entities that can be picked up? What components would those entities need?</p>
  </li>
  <li>
    <p><strong>System independence</strong>: How would you test <code>MovementSystem</code> in isolation? What would you need to mock?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/10-ecs-entities-components/">&larr; Building ECS — Entities and Components</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/12-world-coordinator/">The World Coordinator &rarr;</a>
</nav>
