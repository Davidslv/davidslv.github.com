---
layout: page
title: "What is a Roguelike?"
permalink: /books/vanilla-roguelike/01-what-is-a-roguelike/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <span></span>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/02-development-mindset/">The Development Mindset &rarr;</a>
</nav>

<h1 id="chapter-1-what-is-a-roguelike">Chapter 1: What is a Roguelike?</h1>

<h2 id="historical-context-rogue-1980-and-the-genres-evolution">Historical Context: Rogue (1980) and the Genre’s Evolution</h2>

<p>In 1980, a game called <em>Rogue</em> was created by Michael Toy, Glenn Wichman, and Ken Arnold. Running on Unix systems, it featured ASCII graphics, turn-based gameplay, and a dungeon that was different every time you played. This game would spawn an entire genre that continues to thrive today.</p>

<p><em>Rogue</em> wasn’t just a game—it was a technical achievement. At a time when computer memory was precious and graphics were primitive, the developers created something that felt infinite. Every playthrough was unique because the dungeon was generated procedurally. Every death was permanent, making each decision matter. The game was challenging, unforgiving, and endlessly replayable.</p>

<p>Over the decades, the roguelike genre has evolved. Modern games like <em>The Binding of Isaac</em>, <em>Spelunky</em>, and <em>Hades</em> have brought roguelike elements to broader audiences. But the core principles remain: procedural generation, permadeath, and the thrill of the unknown.</p>

<h2 id="core-characteristics">Core Characteristics</h2>

<p>What makes a roguelike a roguelike? While there’s some debate in the community, most agree on these fundamental characteristics:</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/dfe6926e42f09e5c1508d749d2d022914f340a8bbfdaaa1278239465d05fd619.svg" alt="D2 diagram: Procedural Generation"></figure>

<h3 id="procedural-generation">Procedural Generation</h3>

<p>The world is created algorithmically, not by hand. Every level, every room, every item placement is determined by algorithms. This means:</p>

<ul>
  <li><strong>Infinite variety</strong>: No two playthroughs are identical</li>
  <li><strong>Replayability</strong>: The game stays fresh even after hundreds of hours</li>
  <li><strong>Efficiency</strong>: Developers don’t need to manually design every level</li>
</ul>

<p>In Vanilla Roguelike, we use maze generation algorithms to create dungeons. The same algorithm, given different random seeds, produces completely different layouts.</p>

<h3 id="permadeath">Permadeath</h3>

<p>When your character dies, you start over. There’s no loading a save file, no second chances. This creates:</p>

<ul>
  <li><strong>Tension</strong>: Every decision matters</li>
  <li><strong>Risk vs. reward</strong>: Do you explore that dangerous area for better loot?</li>
  <li><strong>Mastery</strong>: You learn from each death, getting better over time</li>
</ul>

<h3 id="turn-based-gameplay">Turn-Based Gameplay</h3>

<p>Unlike action games, roguelikes are turn-based. When you move, the world responds. Monsters move, traps trigger, time passes. This allows:</p>

<ul>
  <li><strong>Strategic thinking</strong>: You can plan your moves carefully</li>
  <li><strong>Accessibility</strong>: No need for quick reflexes</li>
  <li><strong>Clarity</strong>: You can see exactly what’s happening</li>
</ul>

<h3 id="grid-based-movement">Grid-Based Movement</h3>

<p>Everything exists on a grid. You move from cell to cell, not smoothly across space. This provides:</p>

<ul>
  <li><strong>Precision</strong>: Exact positioning matters</li>
  <li><strong>Simplicity</strong>: Easy to reason about movement and collisions</li>
  <li><strong>Classic feel</strong>: Maintains the traditional roguelike aesthetic</li>
</ul>

<h2 id="why-build-one">Why Build One?</h2>

<p>Building a roguelike from scratch teaches you more than just game development. It’s a masterclass in:</p>

<figure class="diagram"><img src="/img/books/vanilla-roguelike/787262d0f0d348b74a5938ed293a3a9a6364761d64e602cf4222518858156e03.svg" alt="D2 diagram: Roguelike Learning"></figure>

<h3 id="algorithms">Algorithms</h3>

<p>Procedural generation requires understanding graph theory, pathfinding, and randomization. You’ll implement maze generation algorithms, learn about spanning trees, and explore different approaches to creating content.</p>

<h3 id="architecture">Architecture</h3>

<p>As your game grows, you’ll face architectural challenges. How do you organize code that handles movement, combat, inventory, and AI? You’ll learn patterns like Entity-Component-System (ECS) that are used in professional game engines.</p>

<h3 id="game-design">Game Design</h3>

<p>You’ll make decisions about difficulty curves, item balance, and player progression. You’ll learn what makes gameplay fun and what makes it frustrating.</p>

<h3 id="problem-solving">Problem Solving</h3>

<p>Roguelikes are complex systems. You’ll debug interactions between systems, optimize performance, and solve problems you never anticipated.</p>

<h2 id="the-learning-journey">The Learning Journey</h2>

<p>This book follows the development of Vanilla Roguelike, a game built in Ruby over five years. We’ll explore:</p>

<ul>
  <li>How to implement maze generation algorithms</li>
  <li>Why architecture matters and when to refactor</li>
  <li>How to build systems that work together</li>
  <li>The mistakes made along the way and what we learned</li>
</ul>

<p>You don’t need to be an expert programmer. You need curiosity, persistence, and a willingness to learn. By the end of this book, you’ll understand not just how to build a roguelike, but how to think about software architecture, algorithms, and game design.</p>

<p><strong>Exploring the Source Code</strong>: The complete source code for Vanilla Roguelike is available on GitHub at <a href="https://github.com/Davidslv/vanilla-roguelike">github.com/Davidslv/vanilla-roguelike</a>. You can explore the implementation, see how concepts from this book are applied in practice, and discover additional features and topics not covered in these pages. The codebase serves as a reference implementation and a learning resource.</p>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>Roguelikes are more than games—they’re technical and creative challenges. Understanding what makes them unique helps you appreciate both the genre and the skills you’ll develop building one. The journey ahead will teach you algorithms, architecture, and design patterns that apply far beyond game development.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Play a roguelike</strong>: If you haven’t already, play a classic roguelike like <em>NetHack</em> or <em>Brogue</em>. Pay attention to how the world feels different each time.</p>
  </li>
  <li>
    <p><strong>Analyze characteristics</strong>: Think about your favorite games. Which ones have roguelike elements? What makes them feel different from traditional games?</p>
  </li>
  <li>
    <p><strong>Research the genre</strong>: Look up the “Berlin Interpretation” of roguelikes. How does it compare to modern roguelike-inspired games?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <span></span>
  <a href="/books/vanilla-roguelike/">Contents</a>
  <a href="/books/vanilla-roguelike/02-development-mindset/">The Development Mindset &rarr;</a>
</nav>
