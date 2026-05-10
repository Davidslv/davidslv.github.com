---
layout: page
title: "Testing Your Roguelike"
permalink: /books/vanilla-roguelike/19-testing/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/18-event-driven/">&larr; Event-Driven Architecture</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/20-performance/">Performance Considerations &rarr;</a>
</nav>

<h1 id="chapter-19-testing-your-roguelike">Chapter 19: Testing Your Roguelike</h1>

<h2 id="testing-ecs-testing-systems-in-isolation">Testing ECS: Testing Systems in Isolation</h2>

<p>ECS architecture makes testing easier because systems are independent. You can test a system without setting up the entire game.</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/331919ccd0fe79bc7133297a139b61e3f3d65131b4cb3ce9087647e88719b760.svg" alt="D2 diagram: Unit Tests"></figure>

<h3 id="testing-a-system">Testing a System</h3>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">describe</span> <span class="no">MovementSystem</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:world</span><span class="p">)</span> <span class="p">{</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">World</span><span class="p">.</span><span class="nf">new</span> <span class="p">}</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:system</span><span class="p">)</span> <span class="p">{</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">Systems</span><span class="o">::</span><span class="no">MovementSystem</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="n">world</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">it</span> <span class="s2">"moves entity to new position"</span> <span class="k">do</span>
    <span class="c1"># Create test entity</span>
    <span class="n">entity</span> <span class="o">=</span> <span class="no">Vanilla</span><span class="o">::</span><span class="no">Entity</span><span class="p">.</span><span class="nf">new</span>
    <span class="n">entity</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">PositionComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">row: </span><span class="mi">5</span><span class="p">,</span> <span class="ss">column: </span><span class="mi">5</span><span class="p">))</span>
    <span class="n">entity</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">MovementComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">active: </span><span class="kp">true</span><span class="p">))</span>
    <span class="n">entity</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">InputComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">move_direction: :north</span><span class="p">))</span>
    <span class="n">entity</span><span class="p">.</span><span class="nf">add_component</span><span class="p">(</span><span class="no">RenderComponent</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">character: </span><span class="s1">'@'</span><span class="p">))</span>

    <span class="n">world</span><span class="p">.</span><span class="nf">add_entity</span><span class="p">(</span><span class="n">entity</span><span class="p">)</span>

    <span class="c1"># Create test grid</span>
    <span class="n">grid</span> <span class="o">=</span> <span class="n">create_test_grid</span><span class="p">(</span><span class="mi">10</span><span class="p">,</span> <span class="mi">10</span><span class="p">)</span>
    <span class="n">world</span><span class="p">.</span><span class="nf">set_level</span><span class="p">(</span><span class="no">Vanilla</span><span class="o">::</span><span class="no">Level</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="ss">grid: </span><span class="n">grid</span><span class="p">,</span> <span class="ss">difficulty: </span><span class="mi">1</span><span class="p">))</span>

    <span class="c1"># Execute movement</span>
    <span class="nb">system</span><span class="p">.</span><span class="nf">move</span><span class="p">(</span><span class="n">entity</span><span class="p">,</span> <span class="ss">:north</span><span class="p">)</span>

    <span class="c1"># Verify</span>
    <span class="n">position</span> <span class="o">=</span> <span class="n">entity</span><span class="p">.</span><span class="nf">get_component</span><span class="p">(</span><span class="ss">:position</span><span class="p">)</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">position</span><span class="p">.</span><span class="nf">row</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="mi">4</span><span class="p">)</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">position</span><span class="p">.</span><span class="nf">column</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="mi">5</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>You test the system with:</p>
<ul>
  <li>Mock entities (just the components needed)</li>
  <li>Test grid (simple, known state)</li>
  <li>No game loop needed</li>
  <li>Fast, isolated tests</li>
</ul>

<h2 id="testing-algorithms-verifying-maze-generation">Testing Algorithms: Verifying Maze Generation</h2>

<p>Maze generation algorithms can be tested by verifying properties:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">describe</span> <span class="no">BinaryTree</span> <span class="k">do</span>
  <span class="n">it</span> <span class="s2">"creates a spanning tree"</span> <span class="k">do</span>
    <span class="n">grid</span> <span class="o">=</span> <span class="no">Grid</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="mi">10</span><span class="p">,</span> <span class="mi">10</span><span class="p">)</span>
    <span class="no">BinaryTree</span><span class="p">.</span><span class="nf">on</span><span class="p">(</span><span class="n">grid</span><span class="p">)</span>

    <span class="c1"># Verify all cells are reachable</span>
    <span class="n">start</span> <span class="o">=</span> <span class="n">grid</span><span class="p">[</span><span class="mi">0</span><span class="p">,</span> <span class="mi">0</span><span class="p">]</span>
    <span class="n">distances</span> <span class="o">=</span> <span class="n">start</span><span class="p">.</span><span class="nf">distances</span>

    <span class="n">grid</span><span class="p">.</span><span class="nf">each_cell</span> <span class="k">do</span> <span class="o">|</span><span class="n">cell</span><span class="o">|</span>
      <span class="n">expect</span><span class="p">(</span><span class="n">distances</span><span class="p">[</span><span class="n">cell</span><span class="p">]).</span><span class="nf">not_to</span> <span class="n">be_nil</span>
    <span class="k">end</span>
  <span class="k">end</span>

  <span class="n">it</span> <span class="s2">"has bias toward northeast"</span> <span class="k">do</span>
    <span class="c1"># Test algorithm characteristics</span>
    <span class="c1"># (implementation depends on how you measure bias)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Algorithm tests verify:</p>
<ul>
  <li>Correctness (creates valid mazes)</li>
  <li>Properties (spanning tree, connectivity)</li>
  <li>Characteristics (bias, dead ends)</li>
</ul>

<h2 id="integration-testing-testing-system-interactions">Integration Testing: Testing System Interactions</h2>

<p>Integration tests verify systems work together:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">describe</span> <span class="s2">"Combat Integration"</span> <span class="k">do</span>
  <span class="n">it</span> <span class="s2">"kills monster when health reaches zero"</span> <span class="k">do</span>
    <span class="c1"># Setup</span>
    <span class="n">world</span> <span class="o">=</span> <span class="n">create_test_world</span>
    <span class="n">player</span> <span class="o">=</span> <span class="n">create_player</span><span class="p">(</span><span class="n">world</span><span class="p">)</span>
    <span class="n">monster</span> <span class="o">=</span> <span class="n">create_monster</span><span class="p">(</span><span class="n">world</span><span class="p">,</span> <span class="ss">health: </span><span class="mi">10</span><span class="p">)</span>

    <span class="c1"># Execute</span>
    <span class="n">combat_system</span> <span class="o">=</span> <span class="n">world</span><span class="p">.</span><span class="nf">systems</span><span class="p">.</span><span class="nf">find</span> <span class="p">{</span> <span class="o">|</span><span class="n">s</span><span class="p">,</span> <span class="n">_</span><span class="o">|</span> <span class="n">s</span><span class="p">.</span>
          <span class="nf">is_a?</span><span class="p">(</span><span class="no">CombatSystem</span><span class="p">)</span> <span class="p">}[</span><span class="mi">0</span><span class="p">]</span>
    <span class="n">combat_system</span><span class="p">.</span><span class="nf">process_attack</span><span class="p">(</span><span class="n">player</span><span class="p">,</span> <span class="n">monster</span><span class="p">)</span>

    <span class="c1"># Verify</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">world</span><span class="p">.</span><span class="nf">get_entity</span><span class="p">(</span><span class="n">monster</span><span class="p">.</span><span class="nf">id</span><span class="p">)).</span><span class="nf">to</span> <span class="n">be_nil</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">world</span><span class="p">.</span><span class="nf">entities</span><span class="p">.</span><span class="nf">size</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="mi">1</span><span class="p">)</span>  <span class="c1"># Only player remains</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Integration tests:</p>
<ul>
  <li>Use real systems (not mocks)</li>
  <li>Test interactions between systems</li>
  <li>Verify end-to-end behavior</li>
  <li>Catch integration bugs</li>
</ul>

<h2 id="good-architecture-makes-testing-easier">Good Architecture Makes Testing Easier</h2>

<p>ECS makes testing easier because:</p>
<ul>
  <li><strong>Systems are independent</strong>: Test in isolation</li>
  <li><strong>Components are data</strong>: Easy to create test entities</li>
  <li><strong>Events are observable</strong>: Verify through events</li>
  <li><strong>No hidden state</strong>: Everything is explicit</li>
</ul>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Testing ECS is straightforward: test systems in isolation, test algorithms for correctness, test integrations for system interactions. Good architecture makes testing easier by keeping systems independent and state explicit.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Write a test</strong>: Write a test for <code>CombatSystem.calculate_damage</code>. What edge cases would you test?</p>
  </li>
  <li>
    <p><strong>Test an algorithm</strong>: How would you test that Recursive Backtracker creates fewer dead ends than Binary Tree?</p>
  </li>
  <li>
    <p><strong>Integration test</strong>: Design an integration test for the full combat flow (attack → damage → death → loot).</p>
  </li>
  <li>
    <p><strong>Test strategy</strong>: What’s your testing strategy? Unit tests, integration tests, or both?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/books/vanilla-roguelike/18-event-driven/">&larr; Event-Driven Architecture</a>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/20-performance/">Performance Considerations &rarr;</a>
</nav>
