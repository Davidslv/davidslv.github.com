---
layout: page
title: "Building ECS — Entities and Components"
permalink: /vanilla-roguelike/10-ecs-entities-components/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/09-intro-ecs/">&larr; Introduction to Entity-Component-System (ECS)</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/11-ecs-systems/">Building ECS — Systems &rarr;</a>
</nav>

<h1 id="chapter-10-building-ecs---entities-and-components">Chapter 10: Building ECS - Entities and Components</h1>

<h2 id="entities-just-ids-and-component-containers">Entities: Just IDs and Component Containers</h2>

<p>Entities are the simplest part of ECS. They’re just containers with unique IDs. They don’t contain logic. They don’t have game-specific methods. They’re just a way to group components together.</p>

<h3 id="entity-structure">Entity Structure</h3>

<p>In Vanilla, an entity is remarkably simple:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Entities</span>
    <span class="k">class</span> <span class="nc">Entity</span>
      <span class="nb">attr_reader</span> <span class="ss">:id</span><span class="p">,</span> <span class="ss">:components</span>
      <span class="nb">attr_accessor</span> <span class="ss">:name</span>

      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="ss">id: </span><span class="kp">nil</span><span class="p">)</span>
        <span class="vi">@id</span> <span class="o">=</span> <span class="nb">id</span> <span class="o">||</span> <span class="no">SecureRandom</span><span class="p">.</span><span class="nf">uuid</span>
        <span class="vi">@components</span> <span class="o">=</span> <span class="p">[]</span>
        <span class="vi">@component_map</span> <span class="o">=</span> <span class="p">{}</span>
        <span class="vi">@tags</span> <span class="o">=</span> <span class="no">Set</span><span class="p">.</span><span class="nf">new</span>
        <span class="vi">@name</span> <span class="o">=</span> <span class="s2">"Entity_</span><span class="si">#{</span><span class="vi">@id</span><span class="p">[</span><span class="mi">0</span><span class="o">..</span><span class="mi">7</span><span class="p">]</span><span class="si">}</span><span class="s2">"</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">add_component</span><span class="p">(</span><span class="n">component</span><span class="p">)</span>
        <span class="n">type</span> <span class="o">=</span> <span class="n">component</span><span class="p">.</span><span class="nf">type</span>
        <span class="k">raise</span> <span class="no">ArgumentError</span><span class="p">,</span>
              <span class="s2">"Entity already has component of type </span><span class="si">#{</span><span class="n">type</span><span class="si">}</span><span class="s2">"</span> <span class="k">if</span>
                    <span class="vi">@component_map</span><span class="p">.</span><span class="nf">key?</span><span class="p">(</span><span class="n">type</span><span class="p">)</span>

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

      <span class="k">def</span> <span class="nf">remove_component</span><span class="p">(</span><span class="n">type</span><span class="p">)</span>
        <span class="n">component</span> <span class="o">=</span> <span class="vi">@component_map</span><span class="p">[</span><span class="n">type</span><span class="p">]</span>
        <span class="k">return</span> <span class="kp">nil</span> <span class="k">unless</span> <span class="n">component</span>

        <span class="vi">@components</span><span class="p">.</span><span class="nf">delete</span><span class="p">(</span><span class="n">component</span><span class="p">)</span>
        <span class="vi">@component_map</span><span class="p">.</span><span class="nf">delete</span><span class="p">(</span><span class="n">type</span><span class="p">)</span>
        <span class="n">component</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>That’s the entire entity class. It:</p>
<ul>
  <li>Stores a unique ID</li>
  <li>Maintains a list of components</li>
  <li>Provides methods to add, get, and check for components</li>
  <li>Optionally supports tags for quick lookups</li>
</ul>

<h3 id="no-logic-just-data-storage">No Logic, Just Data Storage</h3>

<p>Notice what’s <strong>not</strong> in the entity:</p>
<ul>
  <li>No <code>move()</code> method</li>
  <li>No <code>attack()</code> method</li>
  <li>No <code>render()</code> method</li>
  <li>No game-specific logic</li>
</ul>

<p>The entity is just a container. All behavior lives in systems.</p>

<h3 id="component-composition-mix-and-match-capabilities">Component Composition: Mix and Match Capabilities</h3>

<p>The power of ECS comes from composing entities with different components. Want a player? Add player components. Want a monster? Add monster components. Want something that’s both? Add both sets of components.</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/e72487dbc4ea5531daf41ce14081c584f46be5234bdb3601fb591b5e66b777b3.svg" alt="D2 diagram: Player Entity"></figure>

<p><strong>Example: Creating a player</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">player</span> <span class="o">=</span> <span class="no">Entity</span><span class="p">.</span><span class="nf">new</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">PositionComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">row: </span><span class="mi">0</span><span class="p">,</span> <span class="ss">column: </span><span class="mi">0</span><span class="p">))</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">RenderComponent</span><span class="p">.</span>
      <span class="nf">new</span><span class="p">(</span><span class="ss">character: </span><span class="s1">'@'</span><span class="p">,</span> <span class="ss">color: :white</span><span class="p">))</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">HealthComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">max_health: </span><span class="mi">100</span><span class="p">))</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">MovementComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">active: </span><span class="kp">true</span><span class="p">))</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">InputComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">)</span>
<span class="n">player</span><span class="p">.</span><span class="nf">add_tag</span><span class="p">(</span><span class="ss">:player</span><span class="p">)</span>
</code></pre></div></div>

<p><strong>Example: Creating a monster</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">monster</span> <span class="o">=</span> <span class="no">Entity</span><span class="p">.</span><span class="nf">new</span>
<span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">PositionComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">row: </span><span class="mi">5</span><span class="p">,</span> <span class="ss">column: </span><span class="mi">5</span><span class="p">))</span>
<span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">RenderComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">character: </span><span class="s1">'M'</span><span class="p">))</span>
<span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">HealthComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">max_health: </span><span class="mi">50</span><span class="p">))</span>
<span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">MovementComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">active: </span><span class="kp">true</span><span class="p">))</span>
<span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">CombatComponent</span><span class="p">.</span>
      <span class="nf">new</span><span class="p">(</span><span class="ss">attack_power: </span><span class="mi">10</span><span class="p">,</span> <span class="ss">defense: </span><span class="mi">5</span><span class="p">))</span>
</code></pre></div></div>

<p>Notice: Both have <code>PositionComponent</code>, <code>RenderComponent</code>, <code>HealthComponent</code>, and <code>MovementComponent</code>. The systems that process these components work on both player and monsters. That’s the power of composition.</p>

<h2 id="components-pure-data-structures">Components: Pure Data Structures</h2>

<p>Components are pure data. They define <em>what</em> an entity is, not <em>how</em> it behaves. They’re simple data containers with no logic.</p>

<h3 id="the-component-base-class">The Component Base Class</h3>

<p>All components in Vanilla inherit from a base <code>Component</code> class. This base class provides the foundation for the component system:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Components</span>
    <span class="c1"># Base class for all components</span>
    <span class="k">class</span> <span class="nc">Component</span>
      <span class="c1"># Registry of component types to their implementation classes</span>
      <span class="vi">@component_classes</span> <span class="o">=</span> <span class="p">{}</span>

      <span class="k">class</span> <span class="o">&lt;&lt;</span> <span class="nb">self</span>
        <span class="c1"># Register a component subclass</span>
        <span class="k">def</span> <span class="nf">register</span><span class="p">(</span><span class="n">klass</span><span class="p">)</span>
          <span class="n">instance</span> <span class="o">=</span> <span class="n">klass</span><span class="p">.</span><span class="nf">new</span> <span class="k">rescue</span> <span class="k">return</span>
          <span class="n">type</span> <span class="o">=</span> <span class="n">instance</span><span class="p">.</span><span class="nf">type</span> <span class="k">rescue</span> <span class="k">return</span>
          <span class="vi">@component_classes</span><span class="p">[</span><span class="n">type</span><span class="p">]</span> <span class="o">=</span> <span class="n">klass</span>
        <span class="k">end</span>

        <span class="c1"># Get a component class by type</span>
        <span class="k">def</span> <span class="nf">get_class</span><span class="p">(</span><span class="n">type</span><span class="p">)</span>
          <span class="vi">@component_classes</span><span class="p">[</span><span class="n">type</span><span class="p">]</span>
        <span class="k">end</span>
      <span class="k">end</span>

      <span class="c1"># Initialize the component and check that type is implemented</span>
      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="o">*</span><span class="p">)</span>
        <span class="n">type</span>
      <span class="k">end</span>

      <span class="c1"># Required method that returns the component type</span>
      <span class="c1"># @return [Symbol] the component type</span>
      <span class="k">def</span> <span class="nf">type</span>
        <span class="k">raise</span> <span class="no">NotImplementedError</span><span class="p">,</span> <span class="s2">"Component subclasses must implement #type"</span>
      <span class="k">end</span>

      <span class="c1"># Convert component to a hash representation</span>
      <span class="k">def</span> <span class="nf">to_hash</span>
        <span class="p">{</span> <span class="ss">type: </span><span class="n">type</span> <span class="p">}</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>Key points:</strong></p>
<ul>
  <li><strong><code>type</code> method</strong>: Every component must implement this method, returning a symbol (e.g., <code>:position</code>, <code>:health</code>)</li>
  <li><strong>Registration</strong>: The base class maintains a registry of component types (used for serialization and lookup)</li>
  <li><strong>Initialization check</strong>: The base class ensures <code>type</code> is implemented when a component is created</li>
  <li><strong>Serialization</strong>: The <code>to_hash</code> method provides a basic serialization format</li>
</ul>

<p>For most components, you only need to:</p>
<ol>
  <li>Inherit from <code>Component</code></li>
  <li>Implement the <code>type</code> method</li>
  <li>Store your data in instance variables</li>
</ol>

<p>The base class handles the rest. This is why you see <code>super()</code> in component initializers—it calls the base class initialization which verifies <code>type</code> is implemented.</p>

<h3 id="positioncomponent-where-something-is">PositionComponent: Where Something Is</h3>

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

      <span class="k">def</span> <span class="nf">set_position</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">)</span>
        <span class="vi">@row</span> <span class="o">=</span> <span class="n">row</span>
        <span class="vi">@column</span> <span class="o">=</span> <span class="n">column</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">to_hash</span>
        <span class="p">{</span> <span class="ss">type: </span><span class="n">type</span><span class="p">,</span> <span class="ss">row: </span><span class="vi">@row</span><span class="p">,</span> <span class="ss">column: </span><span class="vi">@column</span> <span class="p">}</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This component stores a position. That’s it. No movement logic. No collision detection. Just data.</p>

<h3 id="rendercomponent-how-it-looks">RenderComponent: How It Looks</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Components</span>
    <span class="k">class</span> <span class="nc">RenderComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
      <span class="nb">attr_reader</span> <span class="ss">:character</span><span class="p">,</span> <span class="ss">:color</span><span class="p">,</span> <span class="ss">:layer</span>

      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">character</span><span class="p">:,</span> <span class="ss">color: </span><span class="kp">nil</span><span class="p">,</span> <span class="ss">layer: </span><span class="mi">0</span><span class="p">)</span>
        <span class="vi">@character</span> <span class="o">=</span> <span class="n">character</span>
        <span class="vi">@color</span> <span class="o">=</span> <span class="n">color</span>
        <span class="vi">@layer</span> <span class="o">=</span> <span class="n">layer</span>
        <span class="k">super</span><span class="p">()</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">type</span>
        <span class="ss">:render</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This component stores visual information. The <code>RenderSystem</code> uses it to draw the entity, but the component itself doesn’t know how to render.</p>

<h3 id="healthcomponent-how-much-damage-it-can-take">HealthComponent: How Much Damage It Can Take</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Components</span>
    <span class="k">class</span> <span class="nc">HealthComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
      <span class="nb">attr_reader</span> <span class="ss">:max_health</span><span class="p">,</span> <span class="ss">:current_health</span>

      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">max_health</span><span class="p">:,</span> <span class="ss">current_health: </span><span class="kp">nil</span><span class="p">)</span>
        <span class="vi">@max_health</span> <span class="o">=</span> <span class="n">max_health</span>
        <span class="vi">@current_health</span> <span class="o">=</span> <span class="n">current_health</span> <span class="o">||</span> <span class="n">max_health</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">type</span>
        <span class="ss">:health</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">current_health</span><span class="o">=</span><span class="p">(</span><span class="n">value</span><span class="p">)</span>
        <span class="vi">@current_health</span> <span class="o">=</span> <span class="p">[</span><span class="n">value</span><span class="p">,</span> <span class="vi">@max_health</span><span class="p">].</span><span class="nf">min</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This component stores health values. The <code>CombatSystem</code> reads and modifies it, but the component doesn’t know about combat.</p>

<h3 id="movementcomponent-can-it-move">MovementComponent: Can It Move?</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Components</span>
    <span class="k">class</span> <span class="nc">MovementComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
      <span class="nb">attr_reader</span> <span class="ss">:speed</span><span class="p">,</span> <span class="ss">:active</span>

      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="ss">active: </span><span class="kp">true</span><span class="p">,</span> <span class="ss">speed: </span><span class="mi">1</span><span class="p">)</span>
        <span class="k">super</span><span class="p">()</span>
        <span class="vi">@active</span> <span class="o">=</span> <span class="n">active</span>
        <span class="vi">@speed</span> <span class="o">=</span> <span class="n">speed</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">type</span>
        <span class="ss">:movement</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">active?</span>
        <span class="o">!!</span><span class="vi">@active</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This component indicates whether an entity can move. The <code>MovementSystem</code> checks <code>active?</code> before processing movement.</p>

<h3 id="design-principles-components-define-capabilities">Design Principles: Components Define Capabilities</h3>

<p>Key principles for designing components:</p>

<ol>
  <li><strong>Pure data</strong>: No logic, just storage</li>
  <li><strong>Single responsibility</strong>: Each component represents one aspect</li>
  <li><strong>Composable</strong>: Components can be combined in any way</li>
  <li><strong>System-agnostic</strong>: Components don’t know which systems use them</li>
</ol>

<p><strong>Good component:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">PositionComponent</span>
  <span class="nb">attr_reader</span> <span class="ss">:row</span><span class="p">,</span> <span class="ss">:column</span>
  <span class="c1"># Just stores position data</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>Bad component:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">PositionComponent</span>
  <span class="nb">attr_reader</span> <span class="ss">:row</span><span class="p">,</span> <span class="ss">:column</span>

  <span class="k">def</span> <span class="nf">move</span><span class="p">(</span><span class="n">direction</span><span class="p">)</span>
    <span class="c1"># Don't put logic in components!</span>
    <span class="k">case</span> <span class="n">direction</span>
    <span class="k">when</span> <span class="ss">:north</span> <span class="k">then</span> <span class="vi">@row</span> <span class="o">-=</span> <span class="mi">1</span>
    <span class="c1"># ...</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The logic belongs in <code>MovementSystem</code>, not in the component.</p>

<h2 id="component-examples-from-vanilla">Component Examples from Vanilla</h2>

<h3 id="combatcomponent">CombatComponent</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">CombatComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="nb">attr_reader</span> <span class="ss">:attack_power</span><span class="p">,</span> <span class="ss">:defense</span><span class="p">,</span> <span class="ss">:accuracy</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">attack_power</span><span class="p">:,</span> <span class="n">defense</span><span class="p">:,</span> <span class="ss">accuracy: </span><span class="mf">0.8</span><span class="p">)</span>
    <span class="vi">@attack_power</span> <span class="o">=</span> <span class="n">attack_power</span>
    <span class="vi">@defense</span> <span class="o">=</span> <span class="n">defense</span>
    <span class="vi">@accuracy</span> <span class="o">=</span> <span class="n">accuracy</span>
    <span class="k">super</span><span class="p">()</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">type</span>
    <span class="ss">:combat</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Stores combat stats. The <code>CombatSystem</code> uses these values, but the component doesn’t know about combat logic.</p>

<h3 id="inventorycomponent">InventoryComponent</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">InventoryComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="ss">capacity: </span><span class="mi">10</span><span class="p">)</span>
    <span class="vi">@items</span> <span class="o">=</span> <span class="p">[]</span>
    <span class="vi">@capacity</span> <span class="o">=</span> <span class="n">capacity</span>
    <span class="k">super</span><span class="p">()</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">type</span>
    <span class="ss">:inventory</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">add_item</span><span class="p">(</span><span class="n">item</span><span class="p">)</span>
    <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="vi">@items</span><span class="p">.</span><span class="nf">size</span> <span class="o">&gt;=</span> <span class="vi">@capacity</span>
    <span class="vi">@items</span> <span class="o">&lt;&lt;</span> <span class="n">item</span>
    <span class="kp">true</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">items</span>
    <span class="vi">@items</span><span class="p">.</span><span class="nf">dup</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Stores a list of items. The <code>InventorySystem</code> manages adding and removing items, but the component just stores the list.</p>

<h2 id="creating-entities-with-components">Creating Entities with Components</h2>

<p>Vanilla uses a factory pattern to create common entities:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">class</span> <span class="nc">EntityFactory</span>
    <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">create_player</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">)</span>
      <span class="n">player</span> <span class="o">=</span> <span class="no">Entity</span><span class="p">.</span><span class="nf">new</span>
      <span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">PositionComponent</span><span class="p">.</span>
            <span class="nf">new</span><span class="p">(</span><span class="ss">row: </span><span class="n">row</span><span class="p">,</span> <span class="ss">column: </span><span class="n">column</span><span class="p">))</span>
      <span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">RenderComponent</span><span class="p">.</span>
            <span class="nf">new</span><span class="p">(</span><span class="ss">character: </span><span class="s1">'@'</span><span class="p">,</span> <span class="ss">color: :white</span><span class="p">))</span>
      <span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">HealthComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">max_health: </span><span class="mi">100</span><span class="p">))</span>
      <span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">MovementComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">active: </span><span class="kp">true</span><span class="p">))</span>
      <span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">InputComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">)</span>
      <span class="n">player</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">InventoryComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">capacity: </span><span class="mi">20</span><span class="p">))</span>
      <span class="n">player</span><span class="p">.</span><span class="nf">add_tag</span><span class="p">(</span><span class="ss">:player</span><span class="p">)</span>
      <span class="n">player</span><span class="p">.</span><span class="nf">name</span> <span class="o">=</span> <span class="s2">"Player"</span>
      <span class="n">player</span>
    <span class="k">end</span>

    <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">create_monster</span><span class="p">(</span><span class="n">type</span><span class="p">,</span> <span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">,</span> <span class="n">health</span><span class="p">,</span> <span class="n">attack</span><span class="p">)</span>
      <span class="n">monster</span> <span class="o">=</span> <span class="no">Entity</span><span class="p">.</span><span class="nf">new</span>
      <span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">PositionComponent</span><span class="p">.</span>
            <span class="nf">new</span><span class="p">(</span><span class="ss">row: </span><span class="n">row</span><span class="p">,</span> <span class="ss">column: </span><span class="n">column</span><span class="p">))</span>
      <span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">RenderComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">character: </span><span class="s1">'M'</span><span class="p">))</span>
      <span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">HealthComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">max_health: </span><span class="n">health</span><span class="p">))</span>
      <span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">MovementComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">active: </span><span class="kp">true</span><span class="p">))</span>
      <span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">CombatComponent</span><span class="p">.</span>
            <span class="nf">new</span><span class="p">(</span><span class="ss">attack_power: </span><span class="n">attack</span><span class="p">,</span> <span class="ss">defense: </span><span class="mi">5</span><span class="p">))</span>
      <span class="n">monster</span><span class="p">.</span><span class="nf">add_tag</span><span class="p">(</span><span class="ss">:monster</span><span class="p">)</span>
      <span class="n">monster</span><span class="p">.</span><span class="nf">name</span> <span class="o">=</span> <span class="s2">"Monster"</span>
      <span class="n">monster</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The factory composes entities from components. This makes it easy to create variations: a fast monster (higher speed in <code>MovementComponent</code>), a strong monster (higher attack in <code>CombatComponent</code>), or a flying monster (add a <code>FlyingComponent</code>).</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Entities are simple containers. Components are pure data. This separation allows flexible composition—you can create any combination of capabilities by mixing and matching components. The data lives in components, and systems provide the behavior. This is the foundation of ECS.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Design components</strong>: Think of a new game feature (like flying). What component would you create? What data would it store?</p>
  </li>
  <li>
    <p><strong>Compose entities</strong>: Design an entity that’s both a monster and an item. What components would it have?</p>
  </li>
  <li>
    <p><strong>Component principles</strong>: Look at Vanilla’s components. Do they follow the “pure data” principle? Can you find any logic that shouldn’t be there?</p>
  </li>
  <li>
    <p><strong>Create a factory</strong>: Design an <code>EntityFactory</code> method for a new entity type. What components does it need?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/09-intro-ecs/">&larr; Introduction to Entity-Component-System (ECS)</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/11-ecs-systems/">Building ECS — Systems &rarr;</a>
</nav>
