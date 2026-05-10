---
layout: page
title: "Introduction to Entity-Component-System (ECS)"
permalink: /books/vanilla-roguelike/09-intro-ecs/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/08-architecture-problem/">&larr; The Architecture Problem</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/10-ecs-entities-components/">Building ECS — Entities and Components &rarr;</a>
</nav>

<h1 id="chapter-9-introduction-to-entity-component-system-ecs">Chapter 9: Introduction to Entity-Component-System (ECS)</h1>

<h2 id="the-problem-ecs-solves-flexibility-and-composition">The Problem ECS Solves: Flexibility and Composition</h2>

<p>Traditional object-oriented game development uses inheritance. You have a <code>Player</code> class, a <code>Monster</code> class, an <code>Item</code> class. Each class contains both data and behavior. This works, but it has limitations.</p>

<p><strong>The problem:</strong> What if you want a monster that can fly? You create a <code>FlyingMonster</code> class. What if you want a monster that’s also an item? You’re stuck—you can’t inherit from both <code>Monster</code> and <code>Item</code>.</p>

<p><strong>The ECS solution:</strong> Instead of classes with inheritance, you compose entities from components. Want a flying monster? Add a <code>FlyingComponent</code>. Want a monster that’s also an item? Add both <code>MonsterComponent</code> and <code>ItemComponent</code>.</p>

<p>ECS separates:</p>
<ul>
  <li><strong>What exists</strong> (Entities)</li>
  <li><strong>What something is</strong> (Components)</li>
  <li><strong>How things work</strong> (Systems)</li>
</ul>

<p>This separation provides the flexibility that traditional inheritance lacks.</p>

<h2 id="core-concepts">Core Concepts</h2>

<h3 id="entities-what-exists">Entities: What Exists</h3>

<p>Entities are the simplest part of ECS. They’re just containers with a unique ID. They don’t contain logic. They don’t have methods (beyond basic component management). They’re just IDs.</p>

<p>In Vanilla:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Entities</span>
    <span class="k">class</span> <span class="nc">Entity</span>
      <span class="nb">attr_reader</span> <span class="ss">:id</span>

      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="ss">id: </span><span class="kp">nil</span><span class="p">)</span>
        <span class="vi">@id</span> <span class="o">=</span> <span class="nb">id</span> <span class="o">||</span> <span class="no">SecureRandom</span><span class="p">.</span><span class="nf">uuid</span>
        <span class="vi">@components</span> <span class="o">=</span> <span class="p">[]</span>
        <span class="vi">@component_map</span> <span class="o">=</span> <span class="p">{}</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">add_component</span><span class="p">(</span><span class="n">component</span><span class="p">)</span>
        <span class="n">type</span> <span class="o">=</span> <span class="n">component</span><span class="p">.</span><span class="nf">type</span>
        <span class="vi">@components</span> <span class="o">&lt;&lt;</span> <span class="n">component</span>
        <span class="vi">@component_map</span><span class="p">[</span><span class="n">type</span><span class="p">]</span> <span class="o">=</span> <span class="n">component</span>
        <span class="nb">self</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">get_component</span><span class="p">(</span><span class="n">type</span><span class="p">)</span>
        <span class="vi">@component_map</span><span class="p">[</span><span class="n">type</span><span class="p">]</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">has_component?</span><span class="p">(</span><span class="n">type</span><span class="p">)</span>
        <span class="vi">@component_map</span><span class="p">.</span><span class="nf">key?</span><span class="p">(</span><span class="n">type</span><span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>That’s it. An entity is just an ID and a way to store components. No game logic. No behavior. Just a container.</p>

<h3 id="components-what-something-is">Components: What Something Is</h3>

<p>Components are pure data. They define <em>what</em> an entity is, not <em>how</em> it behaves. A <code>PositionComponent</code> says “this entity has a position.” A <code>HealthComponent</code> says “this entity has health.” That’s all.</p>

<p>In Vanilla:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Components</span>
    <span class="k">class</span> <span class="nc">PositionComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
      <span class="nb">attr_reader</span> <span class="ss">:row</span><span class="p">,</span> <span class="ss">:column</span>

      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">row</span><span class="p">:,</span> <span class="n">column</span><span class="p">:)</span>
        <span class="k">super</span><span class="p">()</span>
        <span class="vi">@row</span> <span class="o">=</span> <span class="n">row</span>
        <span class="vi">@column</span> <span class="o">=</span> <span class="n">column</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">type</span>
        <span class="ss">:position</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>No logic. Just data. The component stores the row and column. That’s it.</p>

<h3 id="systems-how-things-work">Systems: How Things Work</h3>

<p>Systems contain the logic. They operate on entities that have specific component combinations. A <code>MovementSystem</code> processes entities that have both <code>PositionComponent</code> and <code>MovementComponent</code>. A <code>RenderSystem</code> draws entities that have <code>PositionComponent</code> and <code>RenderComponent</code>.</p>

<p>In Vanilla:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">MovementSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
      <span class="k">def</span> <span class="nf">update</span><span class="p">(</span><span class="n">_delta_time</span><span class="p">)</span>
        <span class="n">movable_entities</span> <span class="o">=</span> <span class="n">entities_with</span><span class="p">(</span>
          <span class="ss">:position</span><span class="p">,</span>
          <span class="ss">:movement</span><span class="p">,</span>
          <span class="ss">:input</span><span class="p">,</span>
          <span class="ss">:render</span>
        <span class="p">)</span>
        <span class="n">movable_entities</span><span class="p">.</span>
              <span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">entity</span><span class="o">|</span> <span class="n">process_entity_movement</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span> <span class="p">}</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system queries for entities with specific components, then processes them. The logic is in the system, not in the entity or component.</p>

<h2 id="mental-model-nouns-adjectives-verbs">Mental Model: Nouns, Adjectives, Verbs</h2>

<p>A helpful way to think about ECS:</p>

<ul>
  <li><strong>Entities</strong> are <strong>nouns</strong>: Player, Monster, Sword</li>
  <li><strong>Components</strong> are <strong>adjectives</strong>: HasPosition, HasHealth, CanMove</li>
  <li><strong>Systems</strong> are <strong>verbs</strong>: Move, Render, Attack</li>
</ul>

<p>You compose entities by adding components (adjectives). Systems (verbs) act on entities that have the right components.</p>

<p><strong>Example:</strong></p>
<ul>
  <li>Entity: “Monster”</li>
  <li>Components: PositionComponent (has position), HealthComponent (has health), RenderComponent (can be seen)</li>
  <li>Systems: MovementSystem (can move it), RenderSystem (can draw it), CombatSystem (can fight with it)</li>
</ul>

<p>Want a flying monster? Add a <code>FlyingComponent</code>. The <code>MovementSystem</code> checks for <code>FlyingComponent</code> and allows movement through walls. No new class needed. Just add a component.</p>

<h2 id="why-ecs-exists">Why ECS Exists</h2>

<p>ECS solves several problems:</p>

<h3 id="flexibility">Flexibility</h3>

<p>You can compose entities in any way. Want a monster that’s also an item? Add both <code>MonsterComponent</code> and <code>ItemComponent</code>. Want a player that can’t move? Remove the <code>MovementComponent</code>. The architecture supports any combination.</p>

<h3 id="separation-of-concerns">Separation of Concerns</h3>

<p>Data (components) is separate from behavior (systems). This makes code easier to understand, test, and modify.</p>

<h3 id="reusability">Reusability</h3>

<p>Systems are reusable. The <code>MovementSystem</code> works on any entity with <code>PositionComponent</code> and <code>MovementComponent</code>. It doesn’t care if it’s a player, monster, or item.</p>

<h3 id="testability">Testability</h3>

<p>You can test systems in isolation. Create test entities with the right components, pass them to the system, verify the behavior. No need to set up the entire game.</p>

<h3 id="scalability">Scalability</h3>

<p>As your game grows, you add new components and systems. You don’t need to modify existing code. The architecture scales naturally.</p>

<h2 id="the-ecs-flow">The ECS Flow</h2>

<p>Here’s how ECS works in practice:</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/d308674b511c37f9c81f8917ab905080aa5819393330b14f129e4b6d25afbd9e.svg" alt="D2 diagram: Create Entity"></figure>

<ol>
  <li><strong>Create Entity</strong>: Make a new entity (just an ID)</li>
  <li><strong>Add Components</strong>: Attach components that define what it is</li>
  <li><strong>World Registration</strong>: Add entity to the world</li>
  <li><strong>System Queries</strong>: Systems find entities with the components they need</li>
  <li><strong>System Processing</strong>: Systems update entities based on their components</li>
  <li><strong>Component Updates</strong>: Components store the new state</li>
  <li><strong>Repeat</strong>: Next frame, systems query and process again</li>
</ol>

<h3 id="how-ecs-pieces-fit-together">How ECS Pieces Fit Together</h3>

<p>Understanding how Entities, Components, Systems, and World relate to each other is crucial:</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/592c54fd5f7fc015122768c24466d6e959bb03b956e032061992858a8a62b09e.svg" alt="D2 diagram: World (coordinator)"></figure>

<p><strong>The relationship:</strong></p>
<ul>
  <li><strong>World</strong> is the coordinator that holds everything together. It stores entities, manages systems, and coordinates updates.</li>
  <li><strong>Entities</strong> are stored in the World. They’re just containers with IDs.</li>
  <li><strong>Components</strong> are attached to Entities. They store data.</li>
  <li><strong>Systems</strong> query the World to find entities with specific components, then process them.</li>
</ul>

<p><strong>The flow:</strong></p>
<ol>
  <li>World stores entities (with their components)</li>
  <li>Systems ask World: “Give me entities with PositionComponent and MovementComponent”</li>
  <li>World returns matching entities</li>
  <li>Systems process those entities, updating their components</li>
  <li>World coordinates the update cycle</li>
</ol>

<p><strong>Important</strong>: The World doesn’t contain game logic—it’s a coordinator. Systems contain the logic. Entities are just data containers. This separation is what makes ECS flexible.</p>

<p>We’ll see how the World coordinates everything in detail in Chapter 12. For now, understand that World is the central hub that connects everything together.</p>

<h2 id="ecs-vs-traditional-oop">ECS vs. Traditional OOP</h2>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/2338161ea5694b2b2643c0bf0b5bddc8cc368f8fd0015f822d39bdbff4b53b9d.svg" alt="D2 diagram: Traditional OOP — each class bundles state + methods"></figure>

<p><strong>Traditional OOP:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">Player</span>
  <span class="k">def</span> <span class="nf">initialize</span>
    <span class="vi">@x</span> <span class="o">=</span> <span class="mi">0</span>
    <span class="vi">@y</span> <span class="o">=</span> <span class="mi">0</span>
    <span class="vi">@health</span> <span class="o">=</span> <span class="mi">100</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">move</span><span class="p">(</span><span class="n">direction</span><span class="p">)</span>
    <span class="c1"># Movement logic here</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">render</span>
    <span class="c1"># Rendering logic here</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>ECS:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Entity</span>
<span class="n">player</span> <span class="o">=</span> <span class="no">Entity</span><span class="p">.</span><span class="nf">new</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">PositionComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">row: </span><span class="mi">0</span><span class="p">,</span> <span class="ss">column: </span><span class="mi">0</span><span class="p">))</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">HealthComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">max_health: </span><span class="mi">100</span><span class="p">))</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">RenderComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">character: </span><span class="s1">'@'</span><span class="p">))</span>

<span class="c1"># Systems handle the logic</span>
<span class="no">MovementSystem</span><span class="p">.</span>
      <span class="nf">process</span><span class="p">(</span><span class="n">player</span><span class="p">)</span>  <span class="c1"># System moves entities with PositionComponent</span>
<span class="no">RenderSystem</span><span class="p">.</span>
      <span class="nf">process</span><span class="p">(</span><span class="n">player</span><span class="p">)</span>   <span class="c1"># System renders entities with RenderComponent</span>
</code></pre></div></div>

<p>The difference: In OOP, the <code>Player</code> class contains both data and behavior. In ECS, components contain data, and systems contain behavior.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>ECS separates data from behavior, providing flexibility and scalability that traditional inheritance lacks. Entities are containers, components are data, and systems are logic. This separation makes code more modular, testable, and extensible. Understanding this philosophy is the foundation for building with ECS.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Think in ECS</strong>: Pick a game object (like a sword). What components would it have? What systems would process it?</p>
  </li>
  <li>
    <p><strong>Compare approaches</strong>: Think about how you’d implement a “flying monster” in traditional OOP vs. ECS. Which is more flexible?</p>
  </li>
  <li>
    <p><strong>Component composition</strong>: What components would a “healing potion” entity have? What about a “cursed sword that drains health”?</p>
  </li>
  <li>
    <p><strong>System queries</strong>: If you have a <code>CombatSystem</code>, what components should it look for? What components would an entity need to participate in combat?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/08-architecture-problem/">&larr; The Architecture Problem</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/10-ecs-entities-components/">Building ECS — Entities and Components &rarr;</a>
</nav>
