---
layout: book
book: vanilla_roguelike
title: "Extending Your Game"
permalink: /books/vanilla-roguelike/21-extending/
---
{% raw %}

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/20-performance/">&larr; Performance Considerations</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/22-journey/">Your Roguelike Journey &rarr;</a>
</nav>

<h1 id="chapter-21-extending-your-game">Chapter 21: Extending Your Game</h1>

<h2 id="adding-new-features-the-ecs-advantage">Adding New Features: The ECS Advantage</h2>

<p>ECS makes adding features easy. You add components and systems, not new classes with inheritance hierarchies.</p>

<h3 id="adding-a-new-feature-flying">Adding a New Feature: Flying</h3>

<p>Want flying monsters? Just add a component and modify a system:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># New component</span>
<span class="k">class</span> <span class="nc">FlyingComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="k">def</span> <span class="nf">type</span>
    <span class="ss">:flying</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># Modify MovementSystem</span>
<span class="k">def</span> <span class="nf">can_move_to?</span><span class="p">(</span><span class="n">cell</span><span class="p">,</span> <span class="n">entity</span><span class="p">)</span>
  <span class="k">return</span> <span class="kp">true</span> <span class="k">if</span> <span class="n">entity</span><span class="p">.</span>
        <span class="nf">has_component?</span><span class="p">(</span><span class="ss">:flying</span><span class="p">)</span>  <span class="c1"># Flying entities ignore walls</span>
  <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="n">cell</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span>
  <span class="kp">true</span>
<span class="k">end</span>

<span class="c1"># Create flying monster</span>
<span class="n">monster</span> <span class="o">=</span> <span class="no">Entity</span><span class="p">.</span><span class="nf">new</span>
<span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">PositionComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">row: </span><span class="mi">5</span><span class="p">,</span> <span class="ss">column: </span><span class="mi">5</span><span class="p">))</span>
<span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">MovementComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">)</span>
<span class="n">monster</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">FlyingComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">)</span>  <span class="c1"># Just add the component</span>
</code></pre></div></div>

<p>No new classes. No inheritance. Just composition.</p>

<h2 id="new-components-defining-new-capabilities">New Components: Defining New Capabilities</h2>

<p>Adding new capabilities is as simple as creating components:</p>

<p><strong>Example: Magic System</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">ManaComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="nb">attr_reader</span> <span class="ss">:max_mana</span><span class="p">,</span> <span class="ss">:current_mana</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">max_mana</span><span class="p">:)</span>
    <span class="vi">@max_mana</span> <span class="o">=</span> <span class="n">max_mana</span>
    <span class="vi">@current_mana</span> <span class="o">=</span> <span class="n">max_mana</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="k">class</span> <span class="nc">SpellComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="nb">attr_reader</span> <span class="ss">:spell_name</span><span class="p">,</span> <span class="ss">:mana_cost</span><span class="p">,</span> <span class="ss">:effect</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">spell_name</span><span class="p">:,</span> <span class="n">mana_cost</span><span class="p">:,</span> <span class="n">effect</span><span class="p">:)</span>
    <span class="vi">@spell_name</span> <span class="o">=</span> <span class="n">spell_name</span>
    <span class="vi">@mana_cost</span> <span class="o">=</span> <span class="n">mana_cost</span>
    <span class="vi">@effect</span> <span class="o">=</span> <span class="n">effect</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Entities with these components can cast spells. No changes to existing code needed.</p>

<h2 id="new-systems-implementing-new-behaviors">New Systems: Implementing New Behaviors</h2>

<p>New behaviors are new systems:</p>

<p><strong>Example: SpellSystem</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">SpellSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
  <span class="k">def</span> <span class="nf">cast_spell</span><span class="p">(</span><span class="n">caster</span><span class="p">,</span> <span class="n">spell_name</span><span class="p">)</span>
    <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">caster</span><span class="p">.</span><span class="nf">has_component?</span><span class="p">(</span><span class="ss">:mana</span><span class="p">)</span>
    <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">caster</span><span class="p">.</span><span class="nf">has_component?</span><span class="p">(</span><span class="ss">:spell</span><span class="p">)</span>

    <span class="n">spell</span> <span class="o">=</span> <span class="n">caster</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:spell</span><span class="p">)</span>
    <span class="n">mana</span> <span class="o">=</span> <span class="n">caster</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:mana</span><span class="p">)</span>

    <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="n">mana</span><span class="p">.</span><span class="nf">current_mana</span> <span class="o">&lt;</span> <span class="n">spell</span><span class="p">.</span><span class="nf">mana_cost</span>

    <span class="n">mana</span><span class="p">.</span><span class="nf">current_mana</span> <span class="o">-=</span> <span class="n">spell</span><span class="p">.</span><span class="nf">mana_cost</span>
    <span class="n">apply_effect</span><span class="p">(</span><span class="n">spell</span><span class="p">.</span><span class="nf">effect</span><span class="p">)</span>
    <span class="kp">true</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Add the system to the world, and it works. No modifications to existing systems.</p>

<h2 id="extension-patterns">Extension Patterns</h2>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/35fbeeaf5dd6b3aa27173d4b0b1deab477b21363aa1c8409500c6def526ccd35.svg" alt="D2 diagram: Pattern 1: Component + System"></figure>

<h3 id="pattern-1-component--system">Pattern 1: Component + System</h3>

<p>Most features follow this pattern:</p>
<ol>
  <li>Create component(s) for data</li>
  <li>Create system for behavior</li>
  <li>Add system to world</li>
  <li>Attach components to entities</li>
</ol>

<h3 id="pattern-2-event-driven-extension">Pattern 2: Event-Driven Extension</h3>

<p>Extend through events:</p>
<ol>
  <li>Subscribe to relevant events</li>
  <li>React in your system</li>
  <li>Emit new events if needed</li>
</ol>

<h3 id="pattern-3-composition">Pattern 3: Composition</h3>

<p>Combine existing components:</p>
<ul>
  <li>Flying + Combat = Flying warrior</li>
  <li>Item + Consumable = Usable item</li>
  <li>Position + Render = Visible entity</li>
</ul>

<h2 id="real-example-adding-loot">Real Example: Adding Loot</h2>

<p>Vanilla’s loot system demonstrates extension:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Component (if needed)</span>
<span class="k">class</span> <span class="nc">LootComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="nb">attr_reader</span> <span class="ss">:gold</span><span class="p">,</span> <span class="ss">:items</span>
<span class="k">end</span>

<span class="c1"># System</span>
<span class="k">class</span> <span class="nc">LootSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
  <span class="k">def</span> <span class="nf">generate_loot</span>
    <span class="p">{</span> <span class="ss">gold: </span><span class="nb">rand</span><span class="p">(</span><span class="mi">10</span><span class="o">..</span><span class="mi">50</span><span class="p">),</span> <span class="ss">items: </span><span class="p">[]</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># Integration: CombatSystem emits death event</span>
<span class="c1"># LootSystem subscribes and generates loot</span>
</code></pre></div></div>

<p>The loot system:</p>
<ul>
  <li>Doesn’t modify combat code</li>
  <li>Subscribes to death events</li>
  <li>Generates loot when monsters die</li>
  <li>Works with existing systems</li>
</ul>

<h2 id="good-architecture-enables-rapid-feature-development">Good Architecture Enables Rapid Feature Development</h2>

<p>With good architecture:</p>
<ul>
  <li><strong>Features are independent</strong>: Add without breaking existing code</li>
  <li><strong>Systems are reusable</strong>: Use in different contexts</li>
  <li><strong>Components are composable</strong>: Mix and match capabilities</li>
  <li><strong>Events enable integration</strong>: Systems work together automatically</li>
</ul>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>ECS makes extending your game easy. Add components for data, systems for behavior. Compose entities from components. Use events for integration. Good architecture enables rapid feature development without breaking existing code.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Design a feature</strong>: Pick a new feature (like magic or crafting). What components and systems would you create?</p>
  </li>
  <li>
    <p><strong>Extend combat</strong>: How would you add status effects (poison, burning)? What would you add?</p>
  </li>
  <li>
    <p><strong>Composition challenge</strong>: Design an entity that’s a monster, an item, and can cast spells. What components would it have?</p>
  </li>
  <li>
    <p><strong>Event integration</strong>: How would you add a “statistics” feature that tracks everything? What events would it subscribe to?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/20-performance/">&larr; Performance Considerations</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/22-journey/">Your Roguelike Journey &rarr;</a>
</nav>
{% endraw %}
