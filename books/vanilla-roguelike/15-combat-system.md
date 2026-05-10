---
layout: page
title: "Combat System"
permalink: /books/vanilla-roguelike/15-combat-system/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/14-collision-interaction/">&larr; Collision and Interaction</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/16-items-inventory/">Items and Inventory &rarr;</a>
</nav>

<h1 id="chapter-15-combat-system">Chapter 15: Combat System</h1>

<h2 id="turn-based-combat-attacker-defender-damage-calculation">Turn-Based Combat: Attacker, Defender, Damage Calculation</h2>

<p>Combat in Vanilla is turn-based and simple: attacker rolls against defender, damage is calculated, health is reduced.</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/c1b120c7a6e6e89eb0a0f70909adbd58f53d8566a35a13905c4fc25f8ff178c9.svg" alt="D2 diagram: Combat Initiated"></figure>

<h3 id="combatsystem-processing-attacks">CombatSystem: Processing Attacks</h3>

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

        <span class="c1"># Calculate and apply damage</span>
        <span class="n">damage</span> <span class="o">=</span> <span class="n">calculate_damage</span><span class="p">(</span><span class="n">attacker_combat</span><span class="p">,</span> <span class="n">target_combat</span><span class="p">)</span>
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
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system:</p>
<ul>
  <li>Checks both entities have combat components</li>
  <li>Rolls for accuracy</li>
  <li>Calculates damage (attack - defense, minimum 1)</li>
  <li>Applies damage to health component</li>
  <li>Checks if target died</li>
</ul>

<h2 id="health-and-death-managing-entity-lifecycle">Health and Death: Managing Entity Lifecycle</h2>

<p>Health is stored in a component, and death is handled by removing the entity.</p>

<h3 id="healthcomponent">HealthComponent</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">HealthComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="nb">attr_reader</span> <span class="ss">:max_health</span><span class="p">,</span> <span class="ss">:current_health</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">max_health</span><span class="p">:,</span> <span class="ss">current_health: </span><span class="kp">nil</span><span class="p">)</span>
    <span class="vi">@max_health</span> <span class="o">=</span> <span class="n">max_health</span>
    <span class="vi">@current_health</span> <span class="o">=</span> <span class="n">current_health</span> <span class="o">||</span> <span class="n">max_health</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">current_health</span><span class="o">=</span><span class="p">(</span><span class="n">value</span><span class="p">)</span>
    <span class="vi">@current_health</span> <span class="o">=</span> <span class="p">[</span><span class="n">value</span><span class="p">,</span> <span class="vi">@max_health</span><span class="p">].</span><span class="nf">min</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The component stores health values. Systems read and modify it, but the component doesn’t know about combat.</p>

<h3 id="death-handling">Death Handling</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">check_death</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">killer</span> <span class="o">=</span> <span class="kp">nil</span><span class="p">)</span>
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
</code></pre></div></div>

<p>When health reaches 0:</p>
<ul>
  <li>Emit death event</li>
  <li>Remove entity from world</li>
  <li>Other systems can react to the event (loot generation, etc.)</li>
</ul>

<h3 id="events-system-communication">Events: System Communication</h3>

<p>You may have noticed <code>emit_event</code> calls in the combat system. Events are messages that systems can send to notify other systems about what happened, without systems needing to know about each other directly.</p>

<p><strong>What events do:</strong></p>
<ul>
  <li>Allow systems to communicate without direct dependencies</li>
  <li>Enable loose coupling between systems</li>
  <li>Support logging, debugging, and reactive behaviors</li>
</ul>

<p><strong>Example from combat:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">emit_event</span><span class="p">(</span><span class="ss">:combat_death</span><span class="p">,</span> <span class="p">{</span>
  <span class="ss">entity_id: </span><span class="n">entity</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
  <span class="ss">killer_id: </span><span class="n">killer</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">id</span>
<span class="p">})</span>
</code></pre></div></div>

<p>This event notifies any system that’s listening: “An entity died in combat.” Other systems can react:</p>
<ul>
  <li>A loot system might generate items at the death location</li>
  <li>A statistics system might record the kill</li>
  <li>A message system might display “Monster killed!”</li>
</ul>

<p><strong>The event system:</strong></p>
<ul>
  <li>Systems can emit events (send messages)</li>
  <li>Systems can subscribe to events (listen for messages)</li>
  <li>The World coordinates event delivery</li>
</ul>

<p>Events are explained in detail in Chapter 18, including how to subscribe to events and build reactive systems. For now, understand that <code>emit_event</code> sends a message that other systems can react to, keeping systems decoupled.</p>

<h2 id="combat-components-attack-power-defense-accuracy">Combat Components: Attack Power, Defense, Accuracy</h2>

<p>Combat stats are stored in components:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">CombatComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="nb">attr_reader</span> <span class="ss">:attack_power</span><span class="p">,</span> <span class="ss">:defense</span><span class="p">,</span> <span class="ss">:accuracy</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">attack_power</span><span class="p">:,</span> <span class="n">defense</span><span class="p">:,</span> <span class="ss">accuracy: </span><span class="mf">0.8</span><span class="p">)</span>
    <span class="vi">@attack_power</span> <span class="o">=</span> <span class="n">attack_power</span>
    <span class="vi">@defense</span> <span class="o">=</span> <span class="n">defense</span>
    <span class="vi">@accuracy</span> <span class="o">=</span> <span class="n">accuracy</span>
    <span class="k">super</span><span class="p">()</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>These values are pure data. The <code>CombatSystem</code> uses them for calculations, but the component doesn’t contain combat logic.</p>

<h2 id="complex-systems-built-from-simple-components">Complex Systems Built from Simple Components</h2>

<p>Combat demonstrates how ECS builds complex features from simple pieces:</p>

<ul>
  <li><strong>Components</strong> store data (health, combat stats)</li>
  <li><strong>Systems</strong> contain logic (damage calculation, death checking)</li>
  <li><strong>Events</strong> notify other systems (death, damage dealt)</li>
  <li><strong>Queries</strong> find relevant entities (entities with combat components)</li>
</ul>

<p>Each piece is simple, but together they create a complete combat system.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Combat in ECS is built from components (data) and systems (logic). Health and combat stats are components. Damage calculation and death handling are systems. This separation makes combat testable, extensible, and maintainable.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Design combat</strong>: How would you add critical hits? What components and systems would change?</p>
  </li>
  <li>
    <p><strong>Status effects</strong>: How would you implement poison or burning? What new components would you need?</p>
  </li>
  <li>
    <p><strong>Combat types</strong>: How would you implement ranged combat? What would be different?</p>
  </li>
  <li>
    <p><strong>Balance testing</strong>: How would you test that combat is balanced? What metrics would you track?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/14-collision-interaction/">&larr; Collision and Interaction</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/16-items-inventory/">Items and Inventory &rarr;</a>
</nav>
