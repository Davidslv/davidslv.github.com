---
layout: page
title: "Collision and Interaction"
permalink: /books/vanilla-roguelike/14-collision-interaction/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/13-input-movement/">&larr; Input and Movement</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/15-combat-system/">Combat System &rarr;</a>
</nav>

<h1 id="chapter-14-collision-and-interaction">Chapter 14: Collision and Interaction</h1>

<h2 id="collision-detection-entity-at-same-position">Collision Detection: Entity at Same Position</h2>

<p>In a grid-based roguelike, collision detection is simple: two entities collide if they’re at the same position. No complex physics calculations needed.</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/0b593bb6566e7d7df7aa03982826035317de7d72019fe656acb4dd1ae498b8e3.svg" alt="D2 diagram: 1. MovementSystem moves Entity1 to a new position"></figure>

<h3 id="collisionsystem-detecting-collisions">CollisionSystem: Detecting Collisions</h3>

<p>The <code>CollisionSystem</code> detects when entities occupy the same cell:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">CollisionSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">world</span><span class="p">)</span>
        <span class="k">super</span><span class="p">(</span><span class="n">world</span><span class="p">)</span>
        <span class="vi">@world</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="ss">:entity_moved</span><span class="p">,</span> <span class="nb">self</span><span class="p">)</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">handle_event</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="n">data</span><span class="p">)</span>
        <span class="k">return</span> <span class="k">unless</span> <span class="n">event_type</span> <span class="o">==</span> <span class="ss">:entity_moved</span>

        <span class="n">entity</span> <span class="o">=</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">get_entity</span><span class="p">(</span><span class="n">data</span><span class="p">[</span><span class="ss">:entity_id</span><span class="p">])</span>
        <span class="k">return</span> <span class="k">unless</span> <span class="n">entity</span>

        <span class="n">position</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>
        <span class="n">entities_at_position</span> <span class="o">=</span> <span class="n">find_entities_at_position</span><span class="p">(</span><span class="n">position</span><span class="p">.</span>
              <span class="nf">row</span><span class="p">,</span> <span class="n">position</span><span class="p">.</span><span class="nf">column</span><span class="p">)</span>

        <span class="n">entities_at_position</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">other_entity</span><span class="o">|</span>
          <span class="k">next</span> <span class="k">if</span> <span class="n">other_entity</span><span class="p">.</span><span class="nf">id</span> <span class="o">==</span> <span class="n">entity</span><span class="p">.</span><span class="nf">id</span>

          <span class="n">emit_event</span><span class="p">(</span><span class="ss">:entities_collided</span><span class="p">,</span> <span class="p">{</span>
            <span class="ss">entity_id: </span><span class="n">entity</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
            <span class="ss">other_entity_id: </span><span class="n">other_entity</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
            <span class="ss">position: </span><span class="p">{</span> <span class="ss">row: </span><span class="n">position</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="ss">column: </span><span class="n">position</span><span class="p">.</span><span class="nf">column</span> <span class="p">}</span>
          <span class="p">})</span>

          <span class="n">handle_specific_collisions</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">other_entity</span><span class="p">)</span>
        <span class="k">end</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">find_entities_at_position</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">)</span>
        <span class="vi">@world</span><span class="p">.</span><span class="nf">query_entities</span><span class="p">([</span><span class="ss">:position</span><span class="p">]).</span><span class="nf">select</span> <span class="k">do</span> <span class="o">|</span><span class="n">entity</span><span class="o">|</span>
          <span class="n">pos</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>
          <span class="n">pos</span><span class="p">.</span><span class="nf">row</span> <span class="o">==</span> <span class="n">row</span> <span class="o">&amp;&amp;</span> <span class="n">pos</span><span class="p">.</span><span class="nf">column</span> <span class="o">==</span> <span class="n">column</span>
        <span class="k">end</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system:</p>
<ul>
  <li>Subscribes to movement events</li>
  <li>When an entity moves, checks for other entities at that position</li>
  <li>Emits collision events</li>
  <li>Handles specific collision types</li>
</ul>

<h2 id="interaction-systems-what-happens-when-entities-meet">Interaction Systems: What Happens When Entities Meet</h2>

<p>Different entity types interact differently. Player + Monster = combat. Player + Item = pickup. Player + Stairs = level transition.</p>

<h3 id="handling-specific-collisions">Handling Specific Collisions</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">handle_specific_collisions</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">other_entity</span><span class="p">)</span>
  <span class="c1"># Player collides with monster</span>
  <span class="k">if</span> <span class="n">entity</span><span class="p">.</span><span class="nf">has_tag?</span><span class="p">(</span><span class="ss">:player</span><span class="p">)</span> <span class="o">&amp;&amp;</span> <span class="n">other_entity</span><span class="p">.</span><span class="nf">has_tag?</span><span class="p">(</span><span class="ss">:monster</span><span class="p">)</span>
    <span class="n">handle_player_monster_collision</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">other_entity</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="c1"># Player collides with item</span>
  <span class="k">if</span> <span class="n">entity</span><span class="p">.</span><span class="nf">has_tag?</span><span class="p">(</span><span class="ss">:player</span><span class="p">)</span> <span class="o">&amp;&amp;</span> <span class="n">other_entity</span><span class="p">.</span><span class="nf">has_component?</span><span class="p">(</span><span class="ss">:item</span><span class="p">)</span>
    <span class="n">handle_player_item_collision</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">other_entity</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="c1"># Player collides with stairs</span>
  <span class="k">if</span> <span class="n">entity</span><span class="p">.</span><span class="nf">has_tag?</span><span class="p">(</span><span class="ss">:player</span><span class="p">)</span> <span class="o">&amp;&amp;</span> <span class="n">other_entity</span><span class="p">.</span><span class="nf">has_component?</span><span class="p">(</span><span class="ss">:stairs</span><span class="p">)</span>
    <span class="n">handle_player_stairs_collision</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">other_entity</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Each collision type triggers different behavior, but they all follow the same pattern: detect collision, determine type, handle appropriately.</p>

<h2 id="stairs-and-level-transitions-changing-the-game-state">Stairs and Level Transitions: Changing the Game State</h2>

<p>Level transitions are a special type of interaction. When the player steps on stairs, the game generates a new level.</p>

<h3 id="changelevelcommand">ChangeLevelCommand</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Commands</span>
    <span class="k">class</span> <span class="nc">ChangeLevelCommand</span> <span class="o">&lt;</span> <span class="no">Command</span>
      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">new_difficulty</span><span class="p">,</span> <span class="n">player</span><span class="p">)</span>
        <span class="vi">@new_difficulty</span> <span class="o">=</span> <span class="n">new_difficulty</span>
        <span class="vi">@player</span> <span class="o">=</span> <span class="n">player</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">execute</span><span class="p">(</span><span class="n">world</span><span class="p">)</span>
        <span class="n">world</span><span class="p">.</span><span class="nf">emit_event</span><span class="p">(</span><span class="ss">:level_transition_requested</span><span class="p">,</span> <span class="p">{</span>
          <span class="ss">player_id: </span><span class="vi">@player</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
          <span class="ss">new_difficulty: </span><span class="vi">@new_difficulty</span>
        <span class="p">})</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The command emits an event that triggers level generation.</p>

<h3 id="mazesystem-handles-transition">MazeSystem Handles Transition</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">handle_event</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="n">data</span><span class="p">)</span>
  <span class="k">return</span> <span class="k">unless</span> <span class="n">event_type</span> <span class="o">==</span> <span class="ss">:level_transition_requested</span>

  <span class="vi">@world</span><span class="p">.</span><span class="nf">level_changed</span> <span class="o">=</span> <span class="kp">true</span>  <span class="c1"># Trigger regeneration</span>
  <span class="n">player</span> <span class="o">=</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">get_entity</span><span class="p">(</span><span class="n">data</span><span class="p">[</span><span class="ss">:player_id</span><span class="p">])</span>
  <span class="n">player</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">).</span><span class="nf">set_position</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="mi">0</span><span class="p">)</span>  <span class="c1"># Reset position</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>MazeSystem</code> subscribes to level transition events and regenerates the maze on the next update.</p>

<h2 id="systems-communicate-through-events-and-queries">Systems Communicate Through Events and Queries</h2>

<p>Collision and interaction demonstrate how systems communicate:</p>

<p><strong>Events:</strong></p>
<ul>
  <li><code>MovementSystem</code> emits <code>:entity_moved</code></li>
  <li><code>CollisionSystem</code> subscribes and reacts</li>
  <li><code>CollisionSystem</code> emits <code>:entities_collided</code></li>
  <li>Other systems can subscribe to collision events</li>
</ul>

<p><strong>Queries:</strong></p>
<ul>
  <li>Systems query for entities at positions</li>
  <li>Systems query for entities with specific components</li>
  <li>No direct dependencies between systems</li>
</ul>

<p>This decoupling allows systems to work together without knowing about each other.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Collision detection in grid-based games is simple: same position = collision. Interaction systems handle what happens when entities meet. Events and queries allow systems to communicate without tight coupling, maintaining clean architecture.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Design interactions</strong>: What other entity interactions might you need? How would you implement them?</p>
  </li>
  <li>
    <p><strong>Event flow</strong>: Trace a collision from detection to resolution. What events are emitted? Who subscribes?</p>
  </li>
  <li>
    <p><strong>Level transitions</strong>: How would you implement a “return to previous level” feature? What would need to change?</p>
  </li>
  <li>
    <p><strong>Collision optimization</strong>: For a large number of entities, how could you optimize collision detection?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/13-input-movement/">&larr; Input and Movement</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/15-combat-system/">Combat System &rarr;</a>
</nav>
