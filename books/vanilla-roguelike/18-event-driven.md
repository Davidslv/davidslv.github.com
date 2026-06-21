---
layout: book
book: vanilla_roguelike
title: "Event-Driven Architecture"
permalink: /books/vanilla-roguelike/18-event-driven/
---
{% raw %}

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/17-ai-monsters/">&larr; AI and Monsters</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/19-testing/">Testing Your Roguelike &rarr;</a>
</nav>

<h1 id="chapter-18-event-driven-architecture">Chapter 18: Event-Driven Architecture</h1>

<h2 id="why-events-matter-decoupling-debugging-logging">Why Events Matter: Decoupling, Debugging, Logging</h2>

<p>Events are a powerful tool in game architecture. They allow systems to communicate without direct dependencies, enable comprehensive logging, and make debugging easier.</p>

<h3 id="decoupling-systems">Decoupling Systems</h3>

<p>Without events, systems would need direct references to each other:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Tightly coupled</span>
<span class="k">class</span> <span class="nc">MovementSystem</span>
  <span class="k">def</span> <span class="nf">move</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span>
    <span class="c1"># ... movement logic ...</span>
    <span class="vi">@combat_system</span><span class="p">.</span><span class="nf">check_collision</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span>  <span class="c1"># Direct dependency</span>
    <span class="vi">@render_system</span><span class="p">.</span><span class="nf">update_display</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span>   <span class="c1"># Direct dependency</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>With events, systems are independent:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Decoupled</span>
<span class="k">class</span> <span class="nc">MovementSystem</span>
  <span class="k">def</span> <span class="nf">move</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span>
    <span class="c1"># ... movement logic ...</span>
    <span class="n">emit_event</span><span class="p">(</span><span class="ss">:entity_moved</span><span class="p">,</span> <span class="p">{</span> <span class="ss">entity_id: </span><span class="n">entity</span><span class="p">.</span>
          <span class="nf">id</span> <span class="p">})</span>  <span class="c1"># No dependencies</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Other systems subscribe to events they care about, but <code>MovementSystem</code> doesn’t know who’s listening.</p>

<h3 id="debugging-and-logging">Debugging and Logging</h3>

<p>Events provide a complete record of game state changes:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Every event is logged</span>
<span class="n">emit_event</span><span class="p">(</span><span class="ss">:combat_attack</span><span class="p">,</span> <span class="p">{</span>
  <span class="ss">attacker_id: </span><span class="n">attacker</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
  <span class="ss">target_id: </span><span class="n">target</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
  <span class="ss">damage: </span><span class="mi">15</span>
<span class="p">})</span>
</code></pre></div></div>

<p>You can:</p>
<ul>
  <li>Replay events to debug issues</li>
  <li>Analyze event sequences to understand behavior</li>
  <li>Visualize game flow through event timelines</li>
  <li>Track down bugs by examining event logs</li>
</ul>

<h2 id="event-types-game-events-system-events-debug-events">Event Types: Game Events, System Events, Debug Events</h2>

<p>Events fall into categories:</p>

<h3 id="game-events">Game Events</h3>

<p>Events that represent game actions:</p>
<ul>
  <li><code>:entity_moved</code> - Entity changed position</li>
  <li><code>:combat_attack</code> - Attack initiated</li>
  <li><code>:item_picked_up</code> - Item collected</li>
  <li><code>:level_transitioned</code> - Level changed</li>
</ul>

<h3 id="system-events">System Events</h3>

<p>Events for system communication:</p>
<ul>
  <li><code>:level_transition_requested</code> - Request new level</li>
  <li><code>:entities_collided</code> - Collision detected</li>
  <li><code>:combat_damage</code> - Damage dealt</li>
</ul>

<h3 id="debug-events">Debug Events</h3>

<p>Events for development:</p>
<ul>
  <li><code>:debug_state_dump</code> - Request state information</li>
  <li><code>:debug_command</code> - Debug command executed</li>
</ul>

<h2 id="event-storage-recording-game-history">Event Storage: Recording Game History</h2>

<p>Vanilla stores events in JSONL files:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Events</span>
    <span class="k">module</span> <span class="nn">Storage</span>
      <span class="k">class</span> <span class="nc">FileEventStore</span>
        <span class="k">def</span> <span class="nf">store</span><span class="p">(</span><span class="n">event</span><span class="p">)</span>
          <span class="no">File</span><span class="p">.</span><span class="nf">open</span><span class="p">(</span><span class="vi">@file_path</span><span class="p">,</span> <span class="s1">'a'</span><span class="p">)</span> <span class="k">do</span> <span class="o">|</span><span class="n">file</span><span class="o">|</span>
            <span class="n">file</span><span class="p">.</span><span class="nf">puts</span><span class="p">(</span><span class="n">event</span><span class="p">.</span><span class="nf">to_json</span><span class="p">)</span>
          <span class="k">end</span>
        <span class="k">end</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This allows:</p>
<ul>
  <li><strong>Replay</strong>: Replay a game session from events</li>
  <li><strong>Analysis</strong>: Analyze player behavior</li>
  <li><strong>Debugging</strong>: Trace what happened before a bug</li>
  <li><strong>Visualization</strong>: Create event timelines</li>
</ul>

<h2 id="event-flow">Event Flow</h2>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/ae5afc9c8c39b9a30963eda12533baae57ad8288d692412664496458ae097f85.svg" alt="D2 diagram: System Emits Event"></figure>

<p>Events flow through the system:</p>
<ol>
  <li>System emits event</li>
  <li>World queues it</li>
  <li>EventManager stores and delivers</li>
  <li>Subscribers react</li>
</ol>

<h2 id="events-enable-powerful-debugging-and-extensibility">Events Enable Powerful Debugging and Extensibility</h2>

<p>Events make the system:</p>
<ul>
  <li><strong>Extensible</strong>: Add new systems that react to events</li>
  <li><strong>Debuggable</strong>: Complete event log of game state</li>
  <li><strong>Testable</strong>: Mock events for testing</li>
  <li><strong>Observable</strong>: Monitor game behavior through events</li>
</ul>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Events decouple systems, enable debugging, and provide extensibility. They’re a powerful tool for building maintainable game architecture. Understanding events helps you build systems that work together without tight coupling.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Design events</strong>: What events would you emit for a “save game” feature? Who would subscribe?</p>
  </li>
  <li>
    <p><strong>Event analysis</strong>: How would you use event logs to balance combat? What events would you track?</p>
  </li>
  <li>
    <p><strong>Extend with events</strong>: How would you add a “statistics” system that tracks player actions? What events would it subscribe to?</p>
  </li>
  <li>
    <p><strong>Debug with events</strong>: How would you use events to debug a movement bug? What events would you examine?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/17-ai-monsters/">&larr; AI and Monsters</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/19-testing/">Testing Your Roguelike &rarr;</a>
</nav>
{% endraw %}
