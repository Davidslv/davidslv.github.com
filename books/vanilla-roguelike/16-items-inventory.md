---
layout: page
title: "Items and Inventory"
permalink: /books/vanilla-roguelike/16-items-inventory/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/15-combat-system/">&larr; Combat System</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/17-ai-monsters/">AI and Monsters &rarr;</a>
</nav>

<h1 id="chapter-16-items-and-inventory">Chapter 16: Items and Inventory</h1>

<h2 id="item-entities-components-that-define-item-properties">Item Entities: Components That Define Item Properties</h2>

<p>Items are entities with item-specific components. They can be picked up, carried, and used.</p>

<h3 id="item-components">Item Components</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">ItemComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="nb">attr_reader</span> <span class="ss">:name</span><span class="p">,</span> <span class="ss">:description</span><span class="p">,</span> <span class="ss">:value</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="nb">name</span><span class="p">:,</span> <span class="ss">description: </span><span class="s2">""</span><span class="p">,</span> <span class="ss">value: </span><span class="mi">0</span><span class="p">)</span>
    <span class="vi">@name</span> <span class="o">=</span> <span class="nb">name</span>
    <span class="vi">@description</span> <span class="o">=</span> <span class="n">description</span>
    <span class="vi">@value</span> <span class="o">=</span> <span class="n">value</span>
    <span class="k">super</span><span class="p">()</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="k">class</span> <span class="nc">ConsumableComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="nb">attr_reader</span> <span class="ss">:effect_type</span><span class="p">,</span> <span class="ss">:effect_value</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">effect_type</span><span class="p">:,</span> <span class="n">effect_value</span><span class="p">:)</span>
    <span class="vi">@effect_type</span> <span class="o">=</span> <span class="n">effect_type</span>  <span class="c1"># :heal, :damage, etc.</span>
    <span class="vi">@effect_value</span> <span class="o">=</span> <span class="n">effect_value</span>
    <span class="k">super</span><span class="p">()</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Items are just entities with these components. A healing potion has <code>ItemComponent</code> and <code>ConsumableComponent</code> with <code>effect_type: :heal</code>.</p>

<h2 id="inventory-system-managing-collections-of-items">Inventory System: Managing Collections of Items</h2>

<p>The <code>InventorySystem</code> manages adding, removing, and using items.</p>

<h3 id="inventorycomponent">InventoryComponent</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">InventoryComponent</span> <span class="o">&lt;</span> <span class="no">Component</span>
  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="ss">capacity: </span><span class="mi">10</span><span class="p">)</span>
    <span class="vi">@items</span> <span class="o">=</span> <span class="p">[]</span>
    <span class="vi">@capacity</span> <span class="o">=</span> <span class="n">capacity</span>
    <span class="k">super</span><span class="p">()</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">add_item</span><span class="p">(</span><span class="n">item</span><span class="p">)</span>
    <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="vi">@items</span><span class="p">.</span><span class="nf">size</span> <span class="o">&gt;=</span> <span class="vi">@capacity</span>
    <span class="vi">@items</span> <span class="o">&lt;&lt;</span> <span class="n">item</span>
    <span class="kp">true</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">remove_item</span><span class="p">(</span><span class="n">item</span><span class="p">)</span>
    <span class="vi">@items</span><span class="p">.</span><span class="nf">delete</span><span class="p">(</span><span class="n">item</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">items</span>
    <span class="vi">@items</span><span class="p">.</span><span class="nf">dup</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The component stores a list of item entities. The <code>InventorySystem</code> manages it.</p>

<h3 id="inventorysystem-operations">InventorySystem Operations</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">InventorySystem</span>
      <span class="k">def</span> <span class="nf">add_item</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">item</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">entity</span><span class="p">.</span><span class="nf">has_component?</span><span class="p">(</span><span class="ss">:inventory</span><span class="p">)</span>

        <span class="n">inventory</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:inventory</span><span class="p">)</span>
        <span class="n">result</span> <span class="o">=</span> <span class="n">inventory</span><span class="p">.</span><span class="nf">add_item</span><span class="p">(</span><span class="n">item</span><span class="p">)</span>

        <span class="k">if</span> <span class="n">result</span>
          <span class="n">emit_event</span><span class="p">(</span><span class="ss">:item_picked_up</span><span class="p">,</span> <span class="p">{</span>
            <span class="ss">entity_id: </span><span class="n">entity</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
            <span class="ss">item_id: </span><span class="n">item</span><span class="p">.</span><span class="nf">id</span>
          <span class="p">})</span>
        <span class="k">end</span>

        <span class="n">result</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">use_item</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">item</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">entity</span><span class="p">.</span><span class="nf">has_component?</span><span class="p">(</span><span class="ss">:inventory</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:inventory</span><span class="p">).</span><span class="nf">items</span><span class="p">.</span>
              <span class="nf">include?</span><span class="p">(</span><span class="n">item</span><span class="p">)</span>

        <span class="n">consumable</span> <span class="o">=</span> <span class="n">item</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:consumable</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">consumable</span>

        <span class="n">apply_effect</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">consumable</span><span class="p">)</span>
        <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:inventory</span><span class="p">).</span><span class="nf">remove_item</span><span class="p">(</span><span class="n">item</span><span class="p">)</span>
        <span class="vi">@world</span><span class="p">.</span><span class="nf">remove_entity</span><span class="p">(</span><span class="n">item</span><span class="p">.</span><span class="nf">id</span><span class="p">)</span>

        <span class="kp">true</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system handles pickup, use, and removal, emitting events for other systems to react.</p>

<h2 id="item-interactions-pickup-drop-use">Item Interactions: Pickup, Drop, Use</h2>

<p>Items interact with entities through systems:</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/0ac9ad1e28dfb5d9cfbfe1d0bf6ef0e6f1f4bd32d124127cd723aab82dda7476.svg" alt="D2 diagram: Item Spawned"></figure>

<p><strong>Pickup:</strong></p>
<ul>
  <li><code>ItemPickupSystem</code> detects player on item</li>
  <li>Adds item to inventory</li>
  <li>Removes item from world</li>
  <li>Emits pickup event</li>
</ul>

<p><strong>Use:</strong></p>
<ul>
  <li><code>ItemUseSystem</code> processes use commands</li>
  <li>Applies item effects</li>
  <li>Removes item from inventory</li>
  <li>Emits use event</li>
</ul>

<p><strong>Drop:</strong></p>
<ul>
  <li><code>InventorySystem</code> removes item from inventory</li>
  <li>Places item entity at player position</li>
  <li>Adds item back to world</li>
  <li>Emits drop event</li>
</ul>

<h2 id="loot-generation-procedural-item-creation">Loot Generation: Procedural Item Creation</h2>

<p>Items can be generated procedurally:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">LootSystem</span>
      <span class="k">def</span> <span class="nf">generate_loot</span>
        <span class="n">gold</span> <span class="o">=</span> <span class="nb">rand</span><span class="p">(</span><span class="mi">10</span><span class="o">..</span><span class="mi">50</span><span class="p">)</span>
        <span class="n">items</span> <span class="o">=</span> <span class="p">[]</span>

        <span class="k">if</span> <span class="nb">rand</span> <span class="o">&lt;</span> <span class="mf">0.3</span>  <span class="c1"># 30% chance for item</span>
          <span class="n">items</span> <span class="o">&lt;&lt;</span> <span class="n">create_random_item</span>
        <span class="k">end</span>

        <span class="p">{</span> <span class="ss">gold: </span><span class="n">gold</span><span class="p">,</span> <span class="ss">items: </span><span class="n">items</span> <span class="p">}</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">create_random_item</span>
        <span class="n">item</span> <span class="o">=</span> <span class="no">Entity</span><span class="p">.</span><span class="nf">new</span>
        <span class="n">item</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">ItemComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
          <span class="ss">name: </span><span class="n">random_item_name</span><span class="p">,</span>
          <span class="ss">value: </span><span class="nb">rand</span><span class="p">(</span><span class="mi">5</span><span class="o">..</span><span class="mi">20</span><span class="p">)</span>
        <span class="p">))</span>
        <span class="n">item</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">ConsumableComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
          <span class="ss">effect_type: :heal</span><span class="p">,</span>
          <span class="ss">effect_value: </span><span class="nb">rand</span><span class="p">(</span><span class="mi">10</span><span class="o">..</span><span class="mi">30</span><span class="p">)</span>
        <span class="p">))</span>
        <span class="n">item</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">RenderComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">character: </span><span class="s1">'!'</span><span class="p">))</span>
        <span class="n">item</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Loot is generated when monsters die, creating variety and replayability.</p>

<h2 id="ecs-makes-complex-features-manageable">ECS Makes Complex Features Manageable</h2>

<p>Items and inventory demonstrate ECS power:</p>

<ul>
  <li><strong>Items are entities</strong>: Same as monsters and players</li>
  <li><strong>Components define properties</strong>: ItemComponent, ConsumableComponent</li>
  <li><strong>Systems handle interactions</strong>: Pickup, use, drop</li>
  <li><strong>Events notify changes</strong>: Other systems react to item events</li>
</ul>

<p>This architecture makes adding new item types easy: just add new components and systems handle them automatically.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Items are entities with item-specific components. The inventory system manages collections of items. ECS makes complex features like inventory manageable by separating data (components) from behavior (systems).</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Design items</strong>: What components would a “sword” entity need? What about a “scroll of fireball”?</p>
  </li>
  <li>
    <p><strong>Item effects</strong>: How would you implement items that modify stats? What components would you add?</p>
  </li>
  <li>
    <p><strong>Inventory UI</strong>: How would you display inventory to the player? What system would handle that?</p>
  </li>
  <li>
    <p><strong>Item generation</strong>: How would you create more interesting procedural items? What properties would vary?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/15-combat-system/">&larr; Combat System</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/17-ai-monsters/">AI and Monsters &rarr;</a>
</nav>
