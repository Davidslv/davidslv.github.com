---
layout: book
book: vanilla_roguelike
title: "The Architecture Problem"
permalink: /books/vanilla-roguelike/08-architecture-problem/
---
{% raw %}

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/07-beyond-mazes/">&larr; Beyond Mazes — Procedural Content</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/09-intro-ecs/">Introduction to Entity-Component-System (ECS) &rarr;</a>
</nav>

<h1 id="chapter-8-the-architecture-problem">Chapter 8: The Architecture Problem</h1>

<h2 id="the-naive-approach-everything-in-one-class">The Naive Approach: Everything in One Class</h2>

<p>When you first start building a roguelike, the simplest approach seems obvious: put everything in one place. A <code>Game</code> class that handles input, movement, rendering, combat, and everything else. It works, and for a small game, it might even be fine.</p>

<p>But as your game grows, problems emerge.</p>

<h3 id="what-the-naive-approach-looks-like">What the Naive Approach Looks Like</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">Game</span>
  <span class="k">def</span> <span class="nf">initialize</span>
    <span class="vi">@player</span> <span class="o">=</span> <span class="p">{</span> <span class="ss">x: </span><span class="mi">0</span><span class="p">,</span> <span class="ss">y: </span><span class="mi">0</span><span class="p">,</span> <span class="ss">health: </span><span class="mi">100</span> <span class="p">}</span>
    <span class="vi">@monsters</span> <span class="o">=</span> <span class="p">[]</span>
    <span class="vi">@grid</span> <span class="o">=</span> <span class="n">create_grid</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">update</span>
    <span class="n">handle_input</span>
    <span class="n">move_player</span>
    <span class="n">move_monsters</span>
    <span class="n">check_collisions</span>
    <span class="n">check_combat</span>
    <span class="n">render</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">handle_input</span>
    <span class="c1"># Input handling code</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">move_player</span>
    <span class="c1"># Movement code</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">move_monsters</span>
    <span class="c1"># Monster AI code</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">check_collisions</span>
    <span class="c1"># Collision detection code</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">check_combat</span>
    <span class="c1"># Combat code</span>
  <span class="k">end</span>

  <span class="k">def</span> <span class="nf">render</span>
    <span class="c1"># Rendering code</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This works. The game runs. But as you add features, this class grows. It becomes a thousand-line monster that’s hard to understand, hard to test, and hard to modify.</p>

<h2 id="signs-of-trouble">Signs of Trouble</h2>

<p>How do you know when your architecture is breaking down? Here are the warning signs:</p>

<h3 id="tight-coupling">Tight Coupling</h3>

<p>Classes know too much about each other. The <code>Game</code> class knows exactly how <code>Monster</code> works. The <code>Monster</code> class knows how <code>Combat</code> works. Changing one thing breaks three others.</p>

<p><strong>Example:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">def</span> <span class="nf">check_combat</span>
  <span class="vi">@monsters</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">monster</span><span class="o">|</span>
    <span class="k">if</span> <span class="n">monster</span><span class="p">.</span><span class="nf">x</span> <span class="o">==</span> <span class="vi">@player</span><span class="p">.</span><span class="nf">x</span> <span class="o">&amp;&amp;</span> <span class="n">monster</span><span class="p">.</span><span class="nf">y</span> <span class="o">==</span> <span class="vi">@player</span><span class="p">.</span><span class="nf">y</span>
      <span class="n">damage</span> <span class="o">=</span> <span class="vi">@player</span><span class="p">.</span><span class="nf">attack_power</span> <span class="o">-</span> <span class="n">monster</span><span class="p">.</span><span class="nf">defense</span>
      <span class="n">monster</span><span class="p">.</span><span class="nf">health</span> <span class="o">-=</span> <span class="n">damage</span>
      <span class="k">if</span> <span class="n">monster</span><span class="p">.</span><span class="nf">health</span> <span class="o">&lt;=</span> <span class="mi">0</span>
        <span class="vi">@monsters</span><span class="p">.</span><span class="nf">delete</span><span class="p">(</span><span class="n">monster</span><span class="p">)</span>
        <span class="vi">@player</span><span class="p">.</span><span class="nf">gold</span> <span class="o">+=</span> <span class="n">monster</span><span class="p">.</span><span class="nf">gold_drop</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>This code is tightly coupled. It knows:</p>
<ul>
  <li>How monsters are stored</li>
  <li>How player position works</li>
  <li>How combat damage is calculated</li>
  <li>How monsters die</li>
  <li>How gold is awarded</li>
</ul>

<p>Change any of these, and this method might break.</p>

<h3 id="unpredictable-behavior">Unpredictable Behavior</h3>

<p>You make a small change in one place, and something completely unrelated breaks. You fix a bug in movement, and suddenly combat stops working. The codebase feels like a house of cards.</p>

<p><strong>The problem:</strong> Everything is connected to everything else. There’s no clear separation of concerns.</p>

<h3 id="hard-to-test">Hard to Test</h3>

<p>You want to test combat, but you can’t because combat is mixed with movement, rendering, and input handling. You can’t test one thing in isolation.</p>

<p><strong>Example:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># How do you test this?</span>
<span class="k">def</span> <span class="nf">update</span>
  <span class="n">handle_input</span>
  <span class="n">move_player</span>
  <span class="n">move_monsters</span>
  <span class="n">check_collisions</span>
  <span class="n">check_combat</span>
  <span class="n">render</span>
<span class="k">end</span>
</code></pre></div></div>

<p>You’d have to mock the entire game state, set up input, create monsters, and render—just to test if combat damage calculation works.</p>

<h3 id="logic-in-the-wrong-places">Logic in the Wrong Places</h3>

<p>The <code>LevelGenerator</code> class starts handling entity management. The <code>Game</code> class becomes a catch-all for game state, rendering, and input handling. Components become tightly coupled.</p>

<p><strong>Example from Vanilla’s history:</strong></p>
<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">LevelGenerator</span>
  <span class="k">def</span> <span class="nf">generate</span>
    <span class="c1"># Generate maze</span>
    <span class="c1"># ... maze code ...</span>

    <span class="c1"># Wait, I need to place the player</span>
    <span class="vi">@game</span><span class="p">.</span><span class="nf">player</span><span class="p">.</span><span class="nf">position</span> <span class="o">=</span> <span class="p">[</span><span class="mi">0</span><span class="p">,</span> <span class="mi">0</span><span class="p">]</span>

    <span class="c1"># And monsters</span>
    <span class="vi">@game</span><span class="p">.</span><span class="nf">monsters</span> <span class="o">=</span> <span class="n">spawn_monsters</span>

    <span class="c1"># And items</span>
    <span class="vi">@game</span><span class="p">.</span><span class="nf">items</span> <span class="o">=</span> <span class="n">spawn_items</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The <code>LevelGenerator</code> shouldn’t know about the game’s entity management. But without a clear architecture, code drifts into the wrong places.</p>

<h2 id="the-breaking-point-story">The “Breaking Point” Story</h2>

<p>In March 2025, Vanilla Roguelike hit its breaking point. The game had grown organically over five years. Features were added as needed, but without a clear architectural pattern.</p>

<h3 id="the-crisis">The Crisis</h3>

<p>The breaking point came when trying to remove legacy code broke everything. The game rendered but wouldn’t accept input. Movement stopped working. Level transitions failed. Monsters didn’t spawn. The game was completely non-functional.</p>

<p>Here’s what the commit message said:</p>

<pre><code>BREAKINGPOINT: Game renders but stays in a loop, prevents input

The game now is in a constant loop (the screen is flickering,
hence my assumption). We can't move forward until we fix this issue.
</code></pre>

<h3 id="the-symptoms">The Symptoms</h3>

<ul>
  <li><strong>Game rendered</strong>: The screen showed the maze</li>
  <li><strong>Input blocked</strong>: Keyboard input was ignored</li>
  <li><strong>Movement disabled</strong>: Player couldn’t move</li>
  <li><strong>Level transitions broken</strong>: Stairs didn’t work</li>
  <li><strong>Monster spawning failed</strong>: No monsters appeared</li>
</ul>

<p>Everything was broken, and it wasn’t clear why. The architecture had become so tangled that removing one piece broke everything else.</p>

<h3 id="the-root-cause">The Root Cause</h3>

<p>The architecture had drifted. Code that should have been separate was intertwined. Systems depended on each other in unpredictable ways. There was no clear pattern for how things should work together.</p>

<h3 id="the-decision">The Decision</h3>

<p>Two choices:</p>
<ol>
  <li><strong>Give up</strong>: The game was broken, maybe it wasn’t worth fixing</li>
  <li><strong>Refactor</strong>: Commit to fixing the architecture properly</li>
</ol>

<p>The choice was to refactor. It was painful—nine hours of debugging, 20+ commits, and many moments of frustration. But it saved the project.</p>

<h2 id="recognizing-when-architecture-needs-to-change">Recognizing When Architecture Needs to Change</h2>

<p>You don’t have to wait for a breaking point. Here are signs that it’s time to refactor:</p>

<h3 id="every-feature-requires-changes-in-multiple-places">Every Feature Requires Changes in Multiple Places</h3>

<p>You want to add a new monster type. You have to modify:</p>
<ul>
  <li>The <code>Monster</code> class</li>
  <li>The <code>Combat</code> system</li>
  <li>The <code>Render</code> system</li>
  <li>The <code>AI</code> system</li>
  <li>The <code>LevelGenerator</code></li>
</ul>

<p>This is a sign that responsibilities aren’t clearly separated.</p>

<h3 id="youre-afraid-to-change-code">You’re Afraid to Change Code</h3>

<p>You see a bug, but you’re hesitant to fix it because you don’t know what else might break. This is a sign of tight coupling and unclear dependencies.</p>

<h3 id="testing-is-difficult">Testing Is Difficult</h3>

<p>You can’t test individual features because they’re all mixed together. This is a sign that code isn’t modular.</p>

<h3 id="the-codebase-feels-fragile">The Codebase Feels Fragile</h3>

<p>Small changes cause unexpected breakage. The codebase feels like it could collapse at any moment. This is a sign that architecture has drifted too far.</p>

<h2 id="the-solution-proper-architecture">The Solution: Proper Architecture</h2>

<p>The solution isn’t to avoid architecture—it’s to choose the right one. For roguelikes, Entity-Component-System (ECS) provides a pattern that:</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/e248f4f79981f34a8e0564433abc89ae13d7d3480b5d93fc4befde2fdc2cebe6.svg" alt="D2 diagram: Naive Approach"></figure>

<ul>
  <li>Separates data from behavior</li>
  <li>Makes systems independent and testable</li>
  <li>Allows flexible composition of game objects</li>
  <li>Scales as your game grows</li>
</ul>

<p>But before we dive into ECS, it’s important to understand why architecture matters. The breaking point in Vanilla wasn’t a failure—it was a forced learning moment that led to a better architecture.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Architecture problems don’t appear overnight. They accumulate gradually as you add features. Recognizing the signs early—tight coupling, unpredictable behavior, hard-to-test code—helps you refactor before hitting a breaking point. But even breaking points can be valuable if they force you to learn proper patterns.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Identify coupling</strong>: Look at a project you’ve worked on. Can you find examples of tight coupling? Where does one class know too much about another?</p>
  </li>
  <li>
    <p><strong>Trace dependencies</strong>: Pick a feature in your codebase. How many other parts of the code does it depend on? Could it be more independent?</p>
  </li>
  <li>
    <p><strong>Test isolation</strong>: Try to write a test for one feature. How much setup do you need? Can you test it in isolation, or do you need the entire game running?</p>
  </li>
  <li>
    <p><strong>Refactor practice</strong>: Pick a small, tightly coupled piece of code. How would you refactor it to reduce coupling? What patterns would help?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/07-beyond-mazes/">&larr; Beyond Mazes — Procedural Content</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/09-intro-ecs/">Introduction to Entity-Component-System (ECS) &rarr;</a>
</nav>
{% endraw %}
