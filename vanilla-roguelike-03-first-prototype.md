---
layout: page
title: "Your First Playable Prototype"
permalink: /vanilla-roguelike/03-first-prototype/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/02-development-mindset/">&larr; The Development Mindset</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/04-grids-and-cells/">Understanding Grids and Cells &rarr;</a>
</nav>

<h1 id="chapter-3-your-first-playable-prototype">Chapter 3: Your First Playable Prototype</h1>

<h2 id="minimal-viable-roguelike">Minimal Viable Roguelike</h2>

<p>Before we dive into procedural generation and complex architecture, let’s build the simplest possible roguelike. This prototype will have:</p>

<ul>
  <li>A grid that displays on screen</li>
  <li>A player character (represented by <code>@</code>)</li>
  <li>Basic movement (arrow keys or vim keys)</li>
  <li>Walls and floors</li>
</ul>

<p>That’s it. No monsters, no items, no levels. Just a character moving around a static grid.</p>

<p>This minimal version serves several purposes:</p>
<ul>
  <li>It’s immediately playable, giving you a sense of accomplishment</li>
  <li>It establishes the foundation for everything else</li>
  <li>It’s simple enough to understand completely</li>
  <li>It demonstrates the core game loop</li>
</ul>

<h2 id="the-game-loop">The Game Loop</h2>

<p>Every game, from Pong to modern AAA titles, follows the same fundamental pattern:</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/59af0b62c16bab3a11d8d638ee7ff8a6a22b0358106c7814294f127c4f1f19de.svg" alt="D2 diagram: Each game tick (repeat until game over)"></figure>

<pre><code>1. Process Input
2. Update Game State
3. Render to Screen
4. Repeat
</code></pre>

<p>This is the <strong>game loop</strong>. It runs continuously, typically 60 times per second in real-time games, or once per turn in turn-based games like roguelikes.</p>

<h3 id="understanding-the-loop">Understanding the Loop</h3>

<p>Let’s break down what happens in each step:</p>

<p><strong>Process Input:</strong></p>
<ul>
  <li>Read keyboard input</li>
  <li>Convert keys to game actions (move north, move south, etc.)</li>
  <li>Queue actions for processing</li>
</ul>

<p><strong>Update Game State:</strong></p>
<ul>
  <li>Execute queued actions</li>
  <li>Update entity positions</li>
  <li>Check for collisions</li>
  <li>Process AI</li>
  <li>Update any game logic</li>
</ul>

<p><strong>Render to Screen:</strong></p>
<ul>
  <li>Clear the screen</li>
  <li>Draw the game world (grid, walls, floors)</li>
  <li>Draw entities (player, monsters, items)</li>
  <li>Display any UI elements</li>
  <li>Present the frame to the player</li>
</ul>

<p><strong>Repeat:</strong></p>
<ul>
  <li>Go back to step 1</li>
  <li>Continue until the game ends</li>
</ul>

<h3 id="the-roguelike-game-loop">The Roguelike Game Loop</h3>

<p>In a roguelike, the loop is slightly different because it’s turn-based:</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/6f2ff8f0e50e2b66920e78b506b32db0d93d24e5527cfc69938b1d114879b2b1.svg" alt="D2 diagram: 1. Player presses a key"></figure>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">game_loop</span>
  <span class="k">until</span> <span class="n">game_over?</span>
    <span class="c1"># Wait for player input (blocking)</span>
    <span class="n">input</span> <span class="o">=</span> <span class="n">get_input</span>

    <span class="c1"># Process the input</span>
    <span class="n">process_input</span><span class="p">(</span><span class="n">input</span><span class="p">)</span>

    <span class="c1"># Update game state (one turn)</span>
    <span class="n">update_game_state</span>

    <span class="c1"># Render the current state</span>
    <span class="n">render</span>

    <span class="c1"># Turn complete, wait for next input</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The key difference: the game waits for player input before proceeding. Each keypress represents one turn. The player moves, then monsters move, then the game waits for the next input.</p>

<h2 id="terminal-rendering-basics">Terminal Rendering Basics</h2>

<p>Roguelikes traditionally use terminal/console rendering. You’re drawing ASCII characters to a text terminal, not pixels to a screen. This might seem primitive, but it has advantages:</p>

<ul>
  <li><strong>Simplicity</strong>: No need for graphics libraries or complex rendering</li>
  <li><strong>Portability</strong>: Works on any system with a terminal</li>
  <li><strong>Performance</strong>: Text rendering is extremely fast</li>
  <li><strong>Classic feel</strong>: Maintains the traditional roguelike aesthetic</li>
</ul>

<h3 id="representing-the-world">Representing the World</h3>

<p>In a terminal-based roguelike, you represent the world with characters:</p>

<ul>
  <li><code>#</code> = Wall</li>
  <li><code>.</code> = Floor (empty space)</li>
  <li><code>@</code> = Player</li>
  <li><code>%</code> = Stairs</li>
  <li><code>M</code> = Monster</li>
  <li><code>!</code> = Item</li>
</ul>

<p>The terminal becomes a grid of characters. Each position (row, column) can display one character.</p>

<h3 id="basic-rendering-flow">Basic Rendering Flow</h3>

<p>Here’s how rendering works conceptually:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">render</span>
  <span class="c1"># Clear the screen</span>
  <span class="n">clear_screen</span>

  <span class="c1"># Draw the grid</span>
  <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
    <span class="k">if</span> <span class="n">cell</span><span class="p">.</span><span class="nf">is_wall?</span>
      <span class="n">draw_character</span><span class="p">(</span><span class="n">cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">cell</span><span class="p">.</span><span class="nf">column</span><span class="p">,</span> <span class="s1">'#'</span><span class="p">)</span>
    <span class="k">else</span>
      <span class="n">draw_character</span><span class="p">(</span><span class="n">cell</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">cell</span><span class="p">.</span><span class="nf">column</span><span class="p">,</span> <span class="s1">'.'</span><span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="c1"># Draw entities on top</span>
  <span class="n">entities</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">entity</span><span class="o">|</span>
    <span class="n">position</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">position</span>
    <span class="n">character</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">character</span>
    <span class="n">draw_character</span><span class="p">(</span><span class="n">position</span><span class="p">.</span><span class="nf">row</span><span class="p">,</span> <span class="n">position</span><span class="p">.</span><span class="nf">column</span><span class="p">,</span> <span class="n">character</span><span class="p">)</span>
  <span class="k">end</span>

  <span class="c1"># Update the display</span>
  <span class="n">refresh_screen</span>
<span class="k">end</span>
</code></pre></div></div>

<p>In Vanilla, this is handled by the <code>RenderSystem</code>, but for now, think of it as a simple function that draws characters to the terminal.</p>

<h3 id="using-rubys-built-in-terminal-features">Using Ruby’s Built-in Terminal Features</h3>

<p>Ruby’s standard library provides everything you need for terminal-based games—no external libraries required. Here’s what you’ll use:</p>

<p><strong>Keyboard Input</strong>: Ruby’s <code>io/console</code> library lets you read single keypresses without waiting for Enter:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">require</span> <span class="s1">'io/console'</span>

<span class="k">def</span> <span class="nf">get_keypress</span>
  <span class="vg">$stdin</span><span class="p">.</span><span class="nf">raw</span> <span class="p">{</span> <span class="vg">$stdin</span><span class="p">.</span><span class="nf">getc</span><span class="p">.</span><span class="nf">chr</span> <span class="p">}</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>raw</code> mode reads characters immediately, which is perfect for real-time input in games.</p>

<p><strong>Screen Clearing</strong>: Use the system’s clear command:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">clear_screen</span>
  <span class="nb">system</span><span class="p">(</span><span class="s2">"clear"</span><span class="p">)</span>  <span class="c1"># On Unix/macOS</span>
  <span class="c1"># or system("cls")  # On Windows</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>Rendering</strong>: Simple <code>print</code> and <code>puts</code> statements are sufficient. You’ll build a string representing the entire screen, then print it all at once.</p>

<p><strong>No External Dependencies</strong>: This approach uses only Ruby’s standard library. No gems, no complex setup—just pure Ruby. This keeps the code simple and portable.</p>

<h2 id="building-the-prototype">Building the Prototype</h2>

<p><strong>Note on Code Structure</strong>: For this prototype, you can put everything in a single file. The code snippets below show individual pieces, but they all combine into one complete program. Later chapters will show more organized structures, but for now, simplicity is key.</p>

<p>Let’s outline what you need for the minimal prototype:</p>

<h3 id="1-grid-representation">1. Grid Representation</h3>

<p>You need a way to represent a 2D grid. Each cell can be a wall or floor.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">Grid</span>
  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">rows</span><span class="p">,</span> <span class="n">columns</span><span class="p">)</span>
    <span class="vi">@rows</span> <span class="o">=</span> <span class="n">rows</span>
    <span class="vi">@columns</span> <span class="o">=</span> <span class="n">columns</span>
    <span class="vi">@cells</span> <span class="o">=</span> <span class="no">Array</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">rows</span><span class="p">)</span> <span class="p">{</span> <span class="no">Array</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">columns</span><span class="p">,</span> <span class="ss">:floor</span><span class="p">)</span> <span class="p">}</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">[]</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">col</span><span class="p">)</span>
    <span class="vi">@cells</span><span class="p">[</span><span class="n">row</span><span class="p">][</span><span class="n">col</span><span class="p">]</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">[]=</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">col</span><span class="p">,</span> <span class="n">value</span><span class="p">)</span>
    <span class="vi">@cells</span><span class="p">[</span><span class="n">row</span><span class="p">][</span><span class="n">col</span><span class="p">]</span> <span class="o">=</span> <span class="n">value</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>For the prototype, you can manually create a simple grid with walls around the edges and floors in the middle.</p>

<h3 id="2-player-representation">2. Player Representation</h3>

<p>You need to track the player’s position:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">Player</span>
  <span class="nb">attr_accessor</span> <span class="ss">:row</span><span class="p">,</span> <span class="ss">:column</span>

  <span class="k">def</span> <span class="nf">initialize</span><span class="p">(</span><span class="n">row</span><span class="p">,</span> <span class="n">column</span><span class="p">)</span>
    <span class="vi">@row</span> <span class="o">=</span> <span class="n">row</span>
    <span class="vi">@column</span> <span class="o">=</span> <span class="n">column</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="3-input-handling">3. Input Handling</h3>

<p>Convert keyboard input to movement directions:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">handle_input</span><span class="p">(</span><span class="n">key</span><span class="p">)</span>
  <span class="k">case</span> <span class="n">key</span>
  <span class="k">when</span> <span class="s1">'k'</span><span class="p">,</span> <span class="ss">:up</span> <span class="k">then</span> <span class="ss">:north</span>
  <span class="k">when</span> <span class="s1">'j'</span><span class="p">,</span> <span class="ss">:down</span> <span class="k">then</span> <span class="ss">:south</span>
  <span class="k">when</span> <span class="s1">'h'</span><span class="p">,</span> <span class="ss">:left</span> <span class="k">then</span> <span class="ss">:west</span>
  <span class="k">when</span> <span class="s1">'l'</span><span class="p">,</span> <span class="ss">:right</span> <span class="k">then</span> <span class="ss">:east</span>
  <span class="k">when</span> <span class="s1">'q'</span> <span class="k">then</span> <span class="ss">:quit</span>
  <span class="k">else</span> <span class="kp">nil</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="4-movement-logic">4. Movement Logic</h3>

<p>Check if movement is valid (not into a wall, not out of bounds), then update position:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">move_player</span><span class="p">(</span><span class="n">player</span><span class="p">,</span> <span class="n">direction</span><span class="p">,</span> <span class="n">grid</span><span class="p">)</span>
  <span class="n">new_row</span> <span class="o">=</span> <span class="n">player</span><span class="p">.</span><span class="nf">row</span>
  <span class="n">new_col</span> <span class="o">=</span> <span class="n">player</span><span class="p">.</span><span class="nf">column</span>

  <span class="k">case</span> <span class="n">direction</span>
  <span class="k">when</span> <span class="ss">:north</span> <span class="k">then</span> <span class="n">new_row</span> <span class="o">-=</span> <span class="mi">1</span>
  <span class="k">when</span> <span class="ss">:south</span> <span class="k">then</span> <span class="n">new_row</span> <span class="o">+=</span> <span class="mi">1</span>
  <span class="k">when</span> <span class="ss">:west</span> <span class="k">then</span> <span class="n">new_col</span> <span class="o">-=</span> <span class="mi">1</span>
  <span class="k">when</span> <span class="ss">:east</span> <span class="k">then</span> <span class="n">new_col</span> <span class="o">+=</span> <span class="mi">1</span>
  <span class="k">end</span>

  <span class="c1"># Check bounds</span>
  <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="n">new_row</span> <span class="o">&lt;</span> <span class="mi">0</span> <span class="o">||</span> <span class="n">new_row</span> <span class="o">&gt;=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">rows</span>
  <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="n">new_col</span> <span class="o">&lt;</span> <span class="mi">0</span> <span class="o">||</span> <span class="n">new_col</span> <span class="o">&gt;=</span> <span class="n">grid</span><span class="p">.</span><span class="nf">columns</span>

  <span class="c1"># Check if it's a wall</span>
  <span class="k">return</span> <span class="kp">false</span> <span class="k">if</span> <span class="n">grid</span><span class="p">[</span><span class="n">new_row</span><span class="p">,</span> <span class="n">new_col</span><span class="p">]</span> <span class="o">==</span> <span class="ss">:wall</span>

  <span class="c1"># Move is valid</span>
  <span class="n">player</span><span class="p">.</span><span class="nf">row</span> <span class="o">=</span> <span class="n">new_row</span>
  <span class="n">player</span><span class="p">.</span><span class="nf">column</span> <span class="o">=</span> <span class="n">new_col</span>
  <span class="kp">true</span>
<span class="k">end</span>
</code></pre></div></div>

<h3 id="5-putting-it-together">5. Putting It Together</h3>

<p>The main game loop ties everything together:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">main</span>
  <span class="c1"># Initialize</span>
  <span class="n">grid</span> <span class="o">=</span> <span class="n">create_simple_grid</span><span class="p">(</span><span class="mi">10</span><span class="p">,</span> <span class="mi">10</span><span class="p">)</span>
  <span class="n">player</span> <span class="o">=</span> <span class="no">Player</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="mi">5</span><span class="p">,</span> <span class="mi">5</span><span class="p">)</span>

  <span class="c1"># Game loop</span>
  <span class="kp">loop</span> <span class="k">do</span>
    <span class="c1"># Render</span>
    <span class="n">render</span><span class="p">(</span><span class="n">grid</span><span class="p">,</span> <span class="n">player</span><span class="p">)</span>

    <span class="c1"># Get input</span>
    <span class="n">key</span> <span class="o">=</span> <span class="n">get_keypress</span>
    <span class="n">direction</span> <span class="o">=</span> <span class="n">handle_input</span><span class="p">(</span><span class="n">key</span><span class="p">)</span>

    <span class="k">break</span> <span class="k">if</span> <span class="n">direction</span> <span class="o">==</span> <span class="ss">:quit</span>

    <span class="c1"># Move if valid</span>
    <span class="n">move_player</span><span class="p">(</span><span class="n">player</span><span class="p">,</span> <span class="n">direction</span><span class="p">,</span> <span class="n">grid</span><span class="p">)</span> <span class="k">if</span> <span class="n">direction</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<h2 id="what-this-teaches-you">What This Teaches You</h2>

<p>This simple prototype demonstrates:</p>

<ol>
  <li><strong>The game loop</strong>: Input → Update → Render</li>
  <li><strong>State management</strong>: Tracking player position and grid state</li>
  <li><strong>Input handling</strong>: Converting keys to game actions</li>
  <li><strong>Collision detection</strong>: Checking walls before movement</li>
  <li><strong>Rendering</strong>: Drawing the world to the terminal</li>
</ol>

<p>These fundamentals apply to every game you’ll ever build, not just roguelikes.</p>

<h2 id="from-prototype-to-game">From Prototype to Game</h2>

<p>Once you have this working, you have a foundation. The next steps are:</p>

<ol>
  <li><strong>Procedural generation</strong>: Replace the static grid with algorithmically generated mazes</li>
  <li><strong>Multiple levels</strong>: Add stairs and level transitions</li>
  <li><strong>Entities</strong>: Add monsters, items, and other interactive elements</li>
  <li><strong>Systems</strong>: Implement combat, inventory, and AI</li>
</ol>

<p>But for now, celebrate having a playable prototype. You can move a character around a grid. That’s the foundation of everything else.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>The simplest playable version teaches you the fundamentals: the game loop, state management, input handling, and rendering. These concepts apply to all games. Start here, then build complexity gradually.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Build the prototype</strong>: Implement the minimal roguelike described above. Use any language you’re comfortable with. Focus on getting the game loop working.</p>
  </li>
  <li>
    <p><strong>Extend it</strong>: Once it works, add one feature: maybe display the player’s coordinates, or add a simple message when the player tries to move into a wall.</p>
  </li>
  <li>
    <p><strong>Analyze the loop</strong>: Play your prototype and think about each step of the game loop. Can you identify when input is processed? When the state updates? When rendering happens?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/02-development-mindset/">&larr; The Development Mindset</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/04-grids-and-cells/">Understanding Grids and Cells &rarr;</a>
</nav>
