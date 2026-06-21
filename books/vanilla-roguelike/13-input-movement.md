---
layout: book
book: vanilla_roguelike
title: "Input and Movement"
permalink: /books/vanilla-roguelike/13-input-movement/
---
{% raw %}

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/12-world-coordinator/">&larr; The World Coordinator</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/14-collision-interaction/">Collision and Interaction &rarr;</a>
</nav>

<h1 id="chapter-13-input-and-movement">Chapter 13: Input and Movement</h1>

<h2 id="input-handling-keyboard--commands--systems">Input Handling: Keyboard → Commands → Systems</h2>

<p>Input in a roguelike flows through multiple layers before affecting the game state. This separation allows for flexibility, testing, and proper architecture.</p>

<h3 id="the-input-flow">The Input Flow</h3>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/665c3b09682dcef2dcb5ee952a58a866cbfe7aa1732a95b5e3096cd5a4a2ae53.svg" alt="D2 diagram: 1. Keyboard registers a key press"></figure>

<h3 id="inputhandler-converting-keys-to-commands">InputHandler: Converting Keys to Commands</h3>

<p>The <code>InputHandler</code> converts raw keyboard input into command objects:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">class</span> <span class="nc">InputHandler</span>
    <span class="k">def</span> <span class="nf">handle_input</span><span class="p">(</span><span class="n">key</span><span class="p">,</span> <span class="n">entity</span><span class="p">)</span>
      <span class="k">case</span> <span class="n">key</span>
      <span class="k">when</span> <span class="s1">'k'</span><span class="p">,</span> <span class="ss">:up</span> <span class="k">then</span> <span class="no">MoveCommand</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="ss">:north</span><span class="p">)</span>
      <span class="k">when</span> <span class="s1">'j'</span><span class="p">,</span> <span class="ss">:down</span> <span class="k">then</span> <span class="no">MoveCommand</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="ss">:south</span><span class="p">)</span>
      <span class="k">when</span> <span class="s1">'h'</span><span class="p">,</span> <span class="ss">:left</span> <span class="k">then</span> <span class="no">MoveCommand</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="ss">:west</span><span class="p">)</span>
      <span class="k">when</span> <span class="s1">'l'</span><span class="p">,</span> <span class="ss">:right</span> <span class="k">then</span> <span class="no">MoveCommand</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="ss">:east</span><span class="p">)</span>
      <span class="k">when</span> <span class="s1">'q'</span> <span class="k">then</span> <span class="no">ExitCommand</span><span class="p">.</span><span class="nf">new</span>
      <span class="k">else</span> <span class="no">NullCommand</span><span class="p">.</span><span class="nf">new</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This handler:</p>
<ul>
  <li>Supports both vim keys (h, j, k, l) and arrow keys</li>
  <li>Creates command objects instead of directly modifying state</li>
  <li>Returns <code>NullCommand</code> for unrecognized keys (no-op)</li>
</ul>

<h3 id="terminal-input-displayhandler-and-keyboardhandler">Terminal Input: DisplayHandler and KeyboardHandler</h3>

<p>Before input reaches the <code>InputHandler</code>, it flows through terminal input handlers. These are simple wrappers around Ruby’s standard library:</p>

<p><strong>DisplayHandler</strong>: A simple wrapper that provides access to input and rendering:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">class</span> <span class="nc">DisplayHandler</span>
    <span class="nb">attr_reader</span> <span class="ss">:keyboard_handler</span>

    <span class="k">def</span> <span class="nf">initialize</span>
      <span class="vi">@keyboard_handler</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">KeyboardHandler</span><span class="p">.</span><span class="nf">new</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>KeyboardHandler</strong>: Does the actual work of reading keyboard input:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">class</span> <span class="nc">KeyboardHandler</span>
    <span class="k">def</span> <span class="nf">wait_for_input</span>
      <span class="vg">$stdin</span><span class="p">.</span><span class="nf">raw</span> <span class="p">{</span> <span class="vg">$stdin</span><span class="p">.</span><span class="nf">getc</span> <span class="p">}</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>KeyboardHandler</code> uses Ruby’s <code>io/console</code> library (via <code>require 'io/console'</code>) to read single keypresses without waiting for Enter. The <code>raw</code> mode reads characters immediately, which is essential for responsive game input.</p>

<p><strong>The flow</strong>: <code>KeyboardHandler.wait_for_input</code> → <code>DisplayHandler.keyboard_handler</code> → <code>InputSystem</code> → <code>InputHandler</code></p>

<p>This separation keeps input handling modular and testable. The <code>DisplayHandler</code> is just a container, while <code>KeyboardHandler</code> does the actual terminal I/O work.</p>

<h3 id="inputsystem-processing-commands">InputSystem: Processing Commands</h3>

<p>The <code>InputSystem</code> processes input and queues commands:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">InputSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
      <span class="k">def</span> <span class="nf">update</span><span class="p">(</span><span class="n">_delta_time</span><span class="p">)</span>
        <span class="k">return</span> <span class="k">unless</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">display</span><span class="p">.</span><span class="nf">keyboard_handler</span>

        <span class="n">key</span> <span class="o">=</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">display</span><span class="p">.</span><span class="nf">keyboard_handler</span><span class="p">.</span><span class="nf">wait_for_input</span>
        <span class="k">return</span> <span class="k">unless</span> <span class="n">key</span>

        <span class="n">player</span> <span class="o">=</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">find_entity_by_tag</span><span class="p">(</span><span class="ss">:player</span><span class="p">)</span>
        <span class="k">return</span> <span class="k">unless</span> <span class="n">player</span>

        <span class="n">command</span> <span class="o">=</span> <span class="no">InputHandler</span><span class="p">.</span><span class="nf">new</span><span class="p">.</span><span class="nf">handle_input</span><span class="p">(</span><span class="n">key</span><span class="p">,</span> <span class="n">player</span><span class="p">)</span>
        <span class="vi">@world</span><span class="p">.</span><span class="nf">queue_command</span><span class="p">(</span><span class="n">command</span><span class="p">)</span>

        <span class="n">emit_event</span><span class="p">(</span><span class="ss">:key_pressed</span><span class="p">,</span> <span class="p">{</span> <span class="ss">key: </span><span class="n">key</span><span class="p">,</span> <span class="ss">entity_id: </span><span class="n">player</span><span class="p">.</span><span class="nf">id</span> <span class="p">})</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system:</p>
<ul>
  <li>Reads input from the display</li>
  <li>Finds the player entity</li>
  <li>Creates a command from the input</li>
  <li>Queues the command for later execution</li>
  <li>Emits an event for logging</li>
</ul>

<h2 id="movement-validation-checking-walls-boundaries-collisions">Movement Validation: Checking Walls, Boundaries, Collisions</h2>

<p>Movement isn’t just about changing coordinates. You need to validate that movement is allowed.</p>

<h3 id="movementsystem-the-complete-flow">MovementSystem: The Complete Flow</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">module</span> <span class="nn">Vanilla</span>
  <span class="k">module</span> <span class="nn">Systems</span>
    <span class="k">class</span> <span class="nc">MovementSystem</span> <span class="o">&lt;</span> <span class="no">System</span>
      <span class="k">def</span> <span class="nf">move</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="n">direction</span><span class="p">)</span>
        <span class="n">position</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>
        <span class="n">movement</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:movement</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">movement</span><span class="o">&amp;</span><span class="p">.</span><span class="nf">active?</span>

        <span class="n">grid</span> <span class="o">=</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">current_level</span><span class="p">.</span><span class="nf">grid</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">grid</span>

        <span class="c1"># Get current cell</span>
        <span class="n">current_cell</span> <span class="o">=</span> <span class="n">grid</span><span class="p">[</span><span class="n">position</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">position</span><span class="p">.</span><span class="nf">column</span><span class="p">]</span>

        <span class="c1"># Get target cell</span>
        <span class="n">new_cell</span> <span class="o">=</span> <span class="n">get_cell_in_direction</span><span class="p">(</span><span class="n">current_cell</span><span class="p">,</span> <span class="n">direction</span><span class="p">)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">new_cell</span>

        <span class="c1"># Validate movement</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">unless</span> <span class="n">can_move_to?</span><span class="p">(</span><span class="n">new_cell</span><span class="p">)</span>

        <span class="c1"># Move is valid - update position</span>
        <span class="n">position</span><span class="p">.</span><span class="nf">set_position</span><span class="p">(</span><span class="n">new_cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">new_cell</span><span class="p">.</span><span class="nf">column</span><span class="p">)</span>

        <span class="n">emit_event</span><span class="p">(</span><span class="ss">:movement_succeeded</span><span class="p">,</span> <span class="p">{</span>
          <span class="ss">entity_id: </span><span class="n">entity</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span>
          <span class="ss">old_position: </span><span class="p">{</span> <span class="ss">row: </span><span class="n">current_cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="ss">column: </span><span class="n">current_cell</span><span class="p">.</span>
                <span class="nf">column</span> <span class="p">},</span>
          <span class="ss">new_position: </span><span class="p">{</span> <span class="ss">row: </span><span class="n">new_cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="ss">column: </span><span class="n">new_cell</span><span class="p">.</span>
                <span class="nf">column</span> <span class="p">},</span>
          <span class="ss">direction: </span><span class="n">direction</span>
        <span class="p">})</span>

        <span class="kp">true</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">can_move_to?</span><span class="p">(</span><span class="n">cell</span><span class="p">)</span>
        <span class="c1"># Check if cell is linked (passable)</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="n">cell</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span>

        <span class="c1"># Check if cell is a wall</span>
        <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="n">cell</span><span class="p">.</span><span class="nf">tile</span> <span class="o">==</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">Support</span><span class="o">::</span><span class="no">TileType</span><span class="o">::</span><span class="no">WALL</span>

        <span class="kp">true</span>
      <span class="k">end</span>

      <span class="k">def</span> <span class="nf">get_cell_in_direction</span><span class="p">(</span><span class="n">cell</span><span class="p">,</span> <span class="n">direction</span><span class="p">)</span>
        <span class="k">case</span> <span class="n">direction</span>
        <span class="k">when</span> <span class="ss">:north</span> <span class="k">then</span> <span class="n">cell</span><span class="p">.</span><span class="nf">north</span>
        <span class="k">when</span> <span class="ss">:south</span> <span class="k">then</span> <span class="n">cell</span><span class="p">.</span><span class="nf">south</span>
        <span class="k">when</span> <span class="ss">:east</span> <span class="k">then</span> <span class="n">cell</span><span class="p">.</span><span class="nf">east</span>
        <span class="k">when</span> <span class="ss">:west</span> <span class="k">then</span> <span class="n">cell</span><span class="p">.</span><span class="nf">west</span>
        <span class="k">else</span> <span class="kp">nil</span>
        <span class="k">end</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The system:</p>
<ul>
  <li>Checks if the entity can move (has <code>MovementComponent</code> and it’s active)</li>
  <li>Gets the target cell in the movement direction</li>
  <li>Validates the target cell is passable</li>
  <li>Updates the position component if valid</li>
  <li>Emits an event for other systems to react</li>
</ul>

<h3 id="boundary-checking">Boundary Checking</h3>

<p>The grid’s <code>[]</code> method handles boundary checking:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">[]</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">col</span><span class="p">)</span>
  <span class="k">return</span> <span class="kp">nil</span> <span class="k">unless</span> <span class="n">row</span><span class="p">.</span><span class="nf">between?</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="vi">@rows</span> <span class="o">-</span> <span class="mi">1</span><span class="p">)</span> <span class="o">&amp;&amp;</span> <span class="n">col</span><span class="p">.</span>
        <span class="nf">between?</span><span class="p">(</span><span class="mi">0</span><span class="p">,</span> <span class="vi">@columns</span> <span class="o">-</span> <span class="mi">1</span><span class="p">)</span>
  <span class="vi">@grid</span><span class="p">[</span><span class="n">row</span> <span class="o">*</span> <span class="vi">@columns</span> <span class="o">+</span> <span class="n">col</span><span class="p">]</span>
<span class="k">end</span>
</code></pre></div></div>

<p>If you try to access a cell outside the grid, it returns <code>nil</code>. The movement system checks for <code>nil</code> and rejects the movement.</p>

<h3 id="wall-checking">Wall Checking</h3>

<p>Cells with no links are walls. The movement system checks:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="n">cell</span><span class="p">.</span><span class="nf">links</span><span class="p">.</span><span class="nf">empty?</span>
</code></pre></div></div>

<p>This ensures entities can’t move through walls.</p>

<h2 id="turn-based-vs-real-time-why-roguelikes-are-turn-based">Turn-Based vs. Real-Time: Why Roguelikes Are Turn-Based</h2>

<p>Roguelikes are turn-based by design. Each action (move, attack, use item) takes one turn. After the player acts, monsters act, then the game waits for the next player input.</p>

<h3 id="the-turn-based-game-loop">The Turn-Based Game Loop</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">game_loop</span>
  <span class="k">until</span> <span class="vi">@world</span><span class="p">.</span><span class="nf">quit?</span>
    <span class="c1"># Wait for player input (blocking)</span>
    <span class="vi">@world</span><span class="p">.</span><span class="nf">update</span><span class="p">(</span><span class="kp">nil</span><span class="p">)</span>  <span class="c1"># Process systems, including input</span>

    <span class="c1"># Player has acted, now monsters act</span>
    <span class="c1"># (MonsterSystem processes during world.update)</span>

    <span class="c1"># Render the new state</span>
    <span class="n">render</span>

    <span class="c1"># Turn complete, wait for next input</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="why-turn-based">Why Turn-Based?</h3>

<p><strong>Strategic gameplay:</strong></p>
<ul>
  <li>Players can think about each move</li>
  <li>No need for quick reflexes</li>
  <li>Every decision matters</li>
</ul>

<p><strong>Simplicity:</strong></p>
<ul>
  <li>Easier to implement</li>
  <li>No need for delta-time calculations</li>
  <li>Predictable timing</li>
</ul>

<p><strong>Classic feel:</strong></p>
<ul>
  <li>Maintains traditional roguelike experience</li>
  <li>Allows for complex decision-making</li>
  <li>Perfect for terminal-based games</li>
</ul>

<h3 id="real-time-alternative">Real-Time Alternative</h3>

<p>You could make a real-time roguelike, but you’d need:</p>
<ul>
  <li>Delta-time calculations</li>
  <li>Frame-rate independence</li>
  <li>More complex input handling</li>
  <li>Different game feel</li>
</ul>

<p>For most roguelikes, turn-based is the right choice.</p>

<h2 id="input-flows-through-architecture-cleanly">Input Flows Through Architecture Cleanly</h2>

<p>The input → command → system flow provides:</p>

<p><strong>Separation of concerns:</strong></p>
<ul>
  <li>Input handling doesn’t know about movement logic</li>
  <li>Commands encapsulate actions</li>
  <li>Systems process based on components</li>
</ul>

<p><strong>Testability:</strong></p>
<ul>
  <li>Test input handling without game state</li>
  <li>Test commands in isolation</li>
  <li>Test systems with mock entities</li>
</ul>

<p><strong>Flexibility:</strong></p>
<ul>
  <li>Easy to add new commands</li>
  <li>Easy to modify input mappings</li>
  <li>Easy to add new movement types</li>
</ul>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Input flows through the architecture: keyboard → handler → command → system → component update. This clean separation makes the code modular, testable, and maintainable. Movement validation ensures entities can only move to valid locations, maintaining game rules.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Trace input flow</strong>: Follow a keypress from keyboard to entity movement. What happens at each step?</p>
  </li>
  <li>
    <p><strong>Add a command</strong>: Design a new command (like “wait” or “examine”). How would you implement it?</p>
  </li>
  <li>
    <p><strong>Modify movement</strong>: What if you wanted diagonal movement? How would you modify the movement system?</p>
  </li>
  <li>
    <p><strong>Test movement</strong>: How would you test that movement validation works correctly? What edge cases would you test?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/12-world-coordinator/">&larr; The World Coordinator</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/14-collision-interaction/">Collision and Interaction &rarr;</a>
</nav>
{% endraw %}
