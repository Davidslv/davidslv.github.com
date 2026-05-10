---
layout: page
title: "The World Coordinator"
permalink: /vanilla-roguelike/12-world-coordinator/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/11-ecs-systems/">&larr; Building ECS — Systems</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/13-input-movement/">Input and Movement &rarr;</a>
</nav>

<h1 id="chapter-12-the-world-coordinator">Chapter 12: The World Coordinator</h1>

<h2 id="world-class-managing-entities-systems-commands-events">World Class: Managing Entities, Systems, Commands, Events</h2>

<p>The <code>World</code> class is the coordinator of the ECS architecture. It doesn’t contain game logic itself—instead, it manages entities, systems, commands, and events. Think of it as a stage manager: it doesn’t perform, but it ensures everything runs smoothly.</p>

<h3 id="world-structure">World Structure</h3>

<p>In Vanilla, the <code>World</code> class manages:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">class</span> <span class="nc">World</span>
    <span class="nb">attr_reader</span> <span class="ss">:entities</span><span class="p">,</span> <span class="ss">:systems</span><span class="p">,</span> <span class="ss">:display</span><span class="p">,</span> <span class="ss">:current_level</span>
    <span class="nb">attr_accessor</span> <span class="ss">:quit</span><span class="p">,</span> <span class="ss">:level_changed</span>

    <span class="k">def</span> <span class="nf">initialize</span>
      <span class="vi">@entities</span> <span class="o">=</span> <span class="p">{}</span>                    <span class="c1"># Hash of entity_id =&gt; Entity</span>
      <span class="vi">@systems</span> <span class="o">=</span> <span class="p">[]</span>                     <span class="c1"># Array of [System,</span>
            <span class="no">Priority</span><span class="p">]</span> <span class="n">pairs</span>
      <span class="vi">@quit</span> <span class="o">=</span> <span class="kp">false</span>                     <span class="c1"># Game exit flag</span>
      <span class="vi">@display</span> <span class="o">=</span> <span class="no">DisplayHandler</span><span class="p">.</span><span class="nf">new</span>     <span class="c1"># Rendering handler</span>
      <span class="vi">@current_level</span> <span class="o">=</span> <span class="kp">nil</span>              <span class="c1"># Current level data</span>
      <span class="vi">@level_changed</span> <span class="o">=</span> <span class="kp">false</span>            <span class="c1"># Level transition flag</span>
      <span class="vi">@event_subscribers</span> <span class="o">=</span> <span class="no">Hash</span><span class="p">.</span>
            <span class="nf">new</span> <span class="p">{</span> <span class="o">|</span><span class="n">h</span><span class="p">,</span> <span class="n">k</span><span class="o">|</span> <span class="n">h</span><span class="p">[</span><span class="n">k</span><span class="p">]</span> <span class="o">=</span> <span class="p">[]</span> <span class="p">}</span>  <span class="c1"># Event subscriptions</span>
      <span class="vi">@event_queue</span> <span class="o">=</span> <span class="no">Queue</span><span class="p">.</span><span class="nf">new</span>          <span class="c1"># Pending events</span>
      <span class="vi">@command_queue</span> <span class="o">=</span> <span class="no">Queue</span><span class="p">.</span><span class="nf">new</span>       <span class="c1"># Pending commands</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The world stores:</p>
<ul>
  <li><strong>Entities</strong>: All game objects</li>
  <li><strong>Systems</strong>: All game systems with their priorities</li>
  <li><strong>Commands</strong>: Queued actions to execute</li>
  <li><strong>Events</strong>: Queued events to process</li>
  <li><strong>Subscribers</strong>: Systems that listen to specific events</li>
</ul>

<h2 id="game-loop-integration-how-systems-update-in-sequence">Game Loop Integration: How Systems Update in Sequence</h2>

<p>The world’s <code>update</code> method is called each frame (or turn, in a turn-based game):</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">update</span><span class="p">(</span><span class="n">_unused</span><span class="p">)</span>
  <span class="c1"># Update all systems in priority order</span>
  <span class="vi">@systems</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="nb">system</span><span class="p">,</span> <span class="n">_</span><span class="o">|</span>
    <span class="nb">system</span><span class="p">.</span><span class="nf">update</span><span class="p">(</span><span class="kp">nil</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="c1"># Process commands before events</span>
  <span class="n">process_commands</span>
  <span class="n">process_events</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The update flow:</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/ae96e47f7b506b0370bf3cedceb1a88762adae766aa52d8b3cb7c438fb3e67a9.svg" alt="D2 diagram: 1. Game calls world.update()"></figure>

<h3 id="system-execution-order">System Execution Order</h3>

<p>Systems are stored with priorities and sorted:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">add_system</span><span class="p">(</span><span class="nb">system</span><span class="p">,</span> <span class="n">priority</span> <span class="o">=</span> <span class="mi">0</span><span class="p">)</span>
  <span class="vi">@systems</span> <span class="o">&lt;&lt;</span> <span class="p">[</span><span class="nb">system</span><span class="p">,</span> <span class="n">priority</span><span class="p">]</span>
  <span class="vi">@systems</span><span class="p">.</span><span class="nf">sort_by!</span> <span class="p">{</span> <span class="o">|</span><span class="n">_system</span><span class="p">,</span> <span class="n">system_priority</span><span class="o">|</span> <span class="n">system_priority</span> <span class="p">}</span>
  <span class="nb">system</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Lower priority numbers run first. This ensures:</p>
<ul>
  <li>Maze generation (priority 0) runs before everything</li>
  <li>Input (priority 1) is processed early</li>
  <li>Movement (priority 2) happens before rendering</li>
  <li>Rendering (priority 10) happens last</li>
</ul>

<h2 id="command-pattern-encapsulating-user-actions">Command Pattern: Encapsulating User Actions</h2>

<p>Commands encapsulate user actions as objects. This provides:</p>
<ul>
  <li><strong>Undo/redo capability</strong> (future feature)</li>
  <li><strong>Command queuing</strong> (execute later)</li>
  <li><strong>Easy logging</strong> (record all actions)</li>
  <li><strong>Decoupling</strong> (input doesn’t directly modify game state)</li>
</ul>

<h3 id="command-structure">Command Structure</h3>

<p>In Vanilla, commands inherit from a base <code>Command</code> class:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Commands</span>
    <span class="k">class</span> <span class="nc">Command</span>
      <span class="k">def</span> <span class="nf">execute</span><span class="p">(</span><span class="n">world</span><span class="p">)</span>
        <span class="k">raise</span> <span class="no">NotImplementedError</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="movecommand-example">MoveCommand Example</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Commands</span>
    <span class="k">class</span> <span class="nc">MoveCommand</span> <span class="o">&lt;</span> <span class="no">Command</span>
      <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">direction</span><span class="p">)</span>
        <span class="vi">@entity</span> <span class="o">=</span> <span class="n">entity</span>
        <span class="vi">@direction</span> <span class="o">=</span> <span class="n">direction</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">execute</span><span class="p">(</span><span class="n">world</span><span class="p">)</span>
        <span class="n">movement_system</span> <span class="o">=</span> <span class="n">world</span><span class="p">.</span><span class="nf">systems</span><span class="p">.</span><span class="nf">find</span> <span class="p">{</span> <span class="o">|</span><span class="n">s</span><span class="p">,</span> <span class="n">_</span><span class="o">|</span> <span class="n">s</span><span class="p">.</span>
              <span class="nf">is_a?</span><span class="p">(</span><span class="no">MovementSystem</span><span class="p">)</span> <span class="p">}</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">first</span>
        <span class="n">movement_system</span><span class="p">.</span><span class="nf">move</span><span class="p">(</span><span class="vi">@entity</span><span class="p">,</span> <span class="vi">@direction</span><span class="p">)</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The command:</p>
<ul>
  <li>Encapsulates the action (move entity in direction)</li>
  <li>Executes when processed</li>
  <li>Doesn’t modify state directly—delegates to systems</li>
</ul>

<h3 id="command-queue-processing">Command Queue Processing</h3>

<p>Commands are queued and processed after systems update:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">queue_command</span><span class="p">(</span><span class="n">command</span><span class="p">)</span>
  <span class="vi">@command_queue</span> <span class="o">&lt;&lt;</span> <span class="n">command</span>
<span class="k">end</span>

<span class="k">def</span> <span class="nf">process_commands</span>
  <span class="k">until</span> <span class="vi">@command_queue</span><span class="p">.</span><span class="nf">empty?</span>
    <span class="n">command</span> <span class="o">=</span> <span class="vi">@command_queue</span><span class="p">.</span><span class="nf">shift</span>
    <span class="n">command</span><span class="p">.</span><span class="nf">execute</span><span class="p">(</span><span class="nb">self</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This ensures:</p>
<ul>
  <li>Commands execute in order</li>
  <li>Systems update before commands process</li>
  <li>Commands can queue more commands (for chaining)</li>
</ul>

<h2 id="event-system-decoupled-communication">Event System: Decoupled Communication</h2>

<p>Events allow systems to communicate without direct dependencies. A system emits an event, and other systems can subscribe to react.</p>

<h3 id="event-emission">Event Emission</h3>

<p>Systems emit events through the world:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">emit_event</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="n">data</span> <span class="o">=</span> <span class="p">{})</span>
  <span class="vi">@event_queue</span> <span class="o">&lt;&lt;</span> <span class="p">[</span><span class="n">event_type</span><span class="p">,</span> <span class="n">data</span><span class="p">]</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Events are queued and processed after commands:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">process_events</span>
  <span class="n">event_manager</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">ServiceRegistry</span><span class="p">.</span><span class="nf">get</span><span class="p">(</span><span class="ss">:event_manager</span><span class="p">)</span>

  <span class="k">until</span> <span class="vi">@event_queue</span><span class="p">.</span><span class="nf">empty?</span>
    <span class="n">event_type</span><span class="p">,</span> <span class="n">data</span> <span class="o">=</span> <span class="vi">@event_queue</span><span class="p">.</span><span class="nf">shift</span>

    <span class="c1"># Store event</span>
    <span class="n">event_manager</span><span class="p">.</span>
          <span class="nf">publish_event</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="nb">self</span><span class="p">,</span> <span class="n">data</span><span class="p">)</span> <span class="k">if</span> <span class="n">event_manager</span>

    <span class="c1"># Notify subscribers</span>
    <span class="vi">@event_subscribers</span><span class="p">[</span><span class="n">event_type</span><span class="p">].</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">subscriber</span><span class="o">|</span>
      <span class="n">subscriber</span><span class="p">.</span><span class="nf">handle_event</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="n">data</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="event-subscription">Event Subscription</h3>

<p>Systems subscribe to events they care about:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">subscribe</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="n">subscriber</span><span class="p">)</span>
  <span class="vi">@event_subscribers</span><span class="p">[</span><span class="n">event_type</span><span class="p">]</span> <span class="o">&lt;&lt;</span> <span class="n">subscriber</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>Example:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># MazeSystem subscribes to level transition events</span>
<span class="vi">@world</span><span class="p">.</span><span class="nf">subscribe</span><span class="p">(</span><span class="ss">:level_transition_requested</span><span class="p">,</span> <span class="nb">self</span><span class="p">)</span>

<span class="k">def</span> <span class="nf">handle_event</span><span class="p">(</span><span class="n">event_type</span><span class="p">,</span> <span class="n">data</span><span class="p">)</span>
  <span class="k">return</span> <span class="k">unless</span> <span class="n">event_type</span> <span class="o">==</span> <span class="ss">:level_transition_requested</span>
  <span class="vi">@world</span><span class="p">.</span><span class="nf">level_changed</span> <span class="o">=</span> <span class="kp">true</span>  <span class="c1"># Trigger regeneration</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="event-flow">Event Flow</h3>

<figure class="diagram"><img src="/img/vanilla-roguelike/4afa5139f3fcd5320a7d1e75cc4ef57a054a31207a93e852d830991825245ffd.svg" alt="D2 diagram: System Emits Event"></figure>

<h2 id="entity-management">Entity Management</h2>

<p>The world provides methods to manage entities:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">add_entity</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span>
  <span class="vi">@entities</span><span class="p">[</span><span class="n">entity</span><span class="p">.</span><span class="nf">id</span><span class="p">]</span> <span class="o">=</span> <span class="n">entity</span>
  <span class="n">entity</span>
<span class="k">end</span>

<span class="k">def</span> <span class="nf">remove_entity</span><span class="p">(</span><span class="n">entity_id</span><span class="p">)</span>
  <span class="vi">@entities</span><span class="p">.</span><span class="nf">delete</span><span class="p">(</span><span class="n">entity_id</span><span class="p">)</span>
<span class="k">end</span>

<span class="k">def</span> <span class="nf">get_entity</span><span class="p">(</span><span class="n">entity_id</span><span class="p">)</span>
  <span class="vi">@entities</span><span class="p">[</span><span class="n">entity_id</span><span class="p">]</span>
<span class="k">end</span>

<span class="k">def</span> <span class="nf">query_entities</span><span class="p">(</span><span class="n">component_types</span><span class="p">)</span>
  <span class="k">return</span> <span class="vi">@entities</span><span class="p">.</span><span class="nf">values</span> <span class="k">if</span> <span class="n">component_types</span><span class="p">.</span><span class="nf">empty?</span>

  <span class="vi">@entities</span><span class="p">.</span><span class="nf">values</span><span class="p">.</span><span class="nf">select</span> <span class="k">do</span> <span class="o">|</span><span class="n">entity</span><span class="o">|</span>
    <span class="n">component_types</span><span class="p">.</span><span class="nf">all?</span> <span class="p">{</span> <span class="o">|</span><span class="n">type</span><span class="o">|</span> <span class="n">entity</span><span class="p">.</span><span class="nf">has_component?</span><span class="p">(</span><span class="n">type</span><span class="p">)</span> <span class="p">}</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>These methods allow:</p>
<ul>
  <li>Adding/removing entities</li>
  <li>Looking up entities by ID</li>
  <li>Querying entities by component types (used by systems)</li>
</ul>

<h2 id="level-management">Level Management</h2>

<p>The world manages the current level:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">set_level</span><span class="p">(</span><span class="n">level</span><span class="p">)</span>
  <span class="vi">@current_level</span> <span class="o">=</span> <span class="n">level</span>
<span class="k">end</span>

<span class="k">def</span> <span class="nf">grid</span>
  <span class="vi">@current_level</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">grid</span>
<span class="k">end</span>

<span class="k">def</span> <span class="nf">level_changed?</span>
  <span class="n">changed</span> <span class="o">=</span> <span class="vi">@level_changed</span>
  <span class="vi">@level_changed</span> <span class="o">=</span> <span class="kp">false</span>  <span class="c1"># Reset after querying</span>
  <span class="n">changed</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Levels contain the grid and entities. The world provides access to the current level for systems that need it.</p>

<h2 id="putting-it-all-together">Putting It All Together</h2>

<p>Here’s how the world coordinates everything:</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/8bf278f101c7c27849fc4a0803b88600350d4a42cd39a25cf859158fbd08032e.svg" alt="D2 diagram: World state (what the World owns)"></figure>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>The <code>World</code> class is the coordinator of ECS. It manages entities, systems, commands, and events without containing game logic itself. It ensures systems run in the right order, commands execute properly, and events are delivered to subscribers. Understanding the world’s role is essential for building with ECS.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Trace the flow</strong>: Follow a player movement from input to rendering. How does it flow through the world?</p>
  </li>
  <li>
    <p><strong>Design commands</strong>: What other commands might you need? How would you implement an <code>AttackCommand</code>?</p>
  </li>
  <li>
    <p><strong>Event design</strong>: What events would you emit when a player picks up an item? Who would subscribe to them?</p>
  </li>
  <li>
    <p><strong>World queries</strong>: How does <code>query_entities</code> work? Why is it important for systems?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/11-ecs-systems/">&larr; Building ECS — Systems</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/13-input-movement/">Input and Movement &rarr;</a>
</nav>
