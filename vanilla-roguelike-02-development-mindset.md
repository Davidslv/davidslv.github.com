---
layout: page
title: "The Development Mindset"
permalink: /vanilla-roguelike/02-development-mindset/
---

<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/01-what-is-a-roguelike/">&larr; What is a Roguelike?</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/03-first-prototype/">Your First Playable Prototype &rarr;</a>
</nav>

<h1 id="chapter-2-the-development-mindset">Chapter 2: The Development Mindset</h1>

<h2 id="building-from-scratch-vs-using-engines">Building from Scratch vs. Using Engines</h2>

<p>When you decide to build a roguelike, you face a fundamental choice: use a game engine like Unity or Godot, or build from scratch with just a programming language and terminal.</p>

<p>Both approaches have value, but they teach different things.</p>

<h3 id="using-a-game-engine">Using a Game Engine</h3>

<p><strong>Pros:</strong></p>
<ul>
  <li>Faster initial development</li>
  <li>Built-in rendering, physics, and tools</li>
  <li>Large community and resources</li>
  <li>Professional-grade features</li>
</ul>

<p><strong>Cons:</strong></p>
<ul>
  <li>You learn the engine, not the underlying concepts</li>
  <li>Less control over how things work</li>
  <li>Engine-specific knowledge may not transfer</li>
  <li>Can hide important architectural decisions</li>
</ul>

<h3 id="building-from-scratch">Building from Scratch</h3>

<p><strong>Pros:</strong></p>
<ul>
  <li>Deep understanding of how everything works</li>
  <li>Complete control over architecture</li>
  <li>Knowledge transfers to any language or platform</li>
  <li>Learn fundamental algorithms and patterns</li>
</ul>

<p><strong>Cons:</strong></p>
<ul>
  <li>Slower initial progress</li>
  <li>You build everything yourself</li>
  <li>More debugging and problem-solving</li>
  <li>Steeper learning curve</li>
</ul>

<p>This book focuses on building from scratch because that’s where the deepest learning happens. When you implement maze generation yourself, you understand graph theory. When you build an ECS architecture, you understand how modern game engines work internally.</p>

<h2 id="the-iterative-approach-start-simple-add-complexity-gradually">The Iterative Approach: Start Simple, Add Complexity Gradually</h2>

<p>The biggest mistake beginners make is trying to build everything at once. A roguelike has many systems: movement, combat, inventory, AI, procedural generation, rendering. Building all of them simultaneously leads to confusion, bugs, and frustration.</p>

<h3 id="the-right-way-iterative-development">The Right Way: Iterative Development</h3>

<p>Start with the simplest possible version that works, then add one feature at a time.</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/2c50a6cc06a5264c5a4fdba3c9f8bb5985729884848d8a43fd4e5f3d2822b347.svg" alt="D2 diagram: Phase 1: Foundation"></figure>

<p><strong>Phase 1: Foundation</strong></p>
<ul>
  <li>A grid that displays on screen</li>
  <li>A player character that can move</li>
  <li>Basic input handling</li>
</ul>

<p><strong>Phase 2: World Generation</strong></p>
<ul>
  <li>Implement one maze generation algorithm</li>
  <li>Generate a playable level</li>
  <li>Place the player and stairs</li>
</ul>

<p><strong>Phase 3: Gameplay</strong></p>
<ul>
  <li>Add monsters</li>
  <li>Implement combat</li>
  <li>Add items and inventory</li>
</ul>

<p><strong>Phase 4: Polish</strong></p>
<ul>
  <li>Improve AI</li>
  <li>Add more content</li>
  <li>Balance difficulty</li>
</ul>

<p>Each phase builds on the previous one. You always have a working game, even if it’s simple. This approach has several benefits:</p>

<ul>
  <li><strong>You can test as you go</strong>: Each feature is tested in isolation</li>
  <li><strong>Less overwhelming</strong>: Focus on one thing at a time</li>
  <li><strong>Easier debugging</strong>: Problems are contained to new features</li>
  <li><strong>Visible progress</strong>: You see your game improving incrementally</li>
</ul>

<h3 id="the-vanilla-journey">The Vanilla Journey</h3>

<p>Vanilla Roguelike started in April 2020 as an exploration of maze generation algorithms. It wasn’t a game yet—just algorithms that created mazes. Over time, movement was added. Then rendering. Then monsters. Each addition was small and focused.</p>

<p>This iterative approach meant that when problems arose, they were manageable. When architecture needed to change (as we’ll see in later chapters), the codebase wasn’t so large that refactoring was impossible.</p>

<h2 id="common-pitfalls">Common Pitfalls</h2>

<h3 id="architecture-drift">Architecture Drift</h3>

<p>As you add features, code starts appearing in the wrong places. The <code>LevelGenerator</code> class begins handling entity management. The <code>Game</code> class becomes a catch-all for game state, rendering, and input handling. Components become tightly coupled.</p>

<p><strong>Signs of architecture drift:</strong></p>
<ul>
  <li>Classes doing multiple unrelated things</li>
  <li>Direct dependencies between components that shouldn’t know about each other</li>
  <li>Changes in one place break things in unexpected places</li>
  <li>Hard to test individual pieces</li>
</ul>

<p><strong>Solution:</strong> Recognize the problem early and refactor. Don’t wait until the codebase is a mess.</p>

<h3 id="premature-optimization">Premature Optimization</h3>

<p>You worry about performance before you have a working game. You optimize maze generation algorithms before you’ve implemented combat. You add caching before you know what the bottlenecks are.</p>

<p><strong>The problem:</strong> You spend time optimizing code that might not even be the problem. Worse, premature optimization often makes code more complex and harder to maintain.</p>

<p><strong>Solution:</strong> Build it first, measure it second, optimize it third. Make it work, make it right, make it fast—in that order.</p>

<h3 id="feature-creep">Feature Creep</h3>

<p>You start building a simple roguelike, but then you want to add crafting, then multiplayer, then a story mode, then…</p>

<p><strong>The problem:</strong> You never finish anything. The game becomes a collection of half-implemented features.</p>

<p><strong>Solution:</strong> Finish one feature completely before starting the next. Define what “done” means for each feature and stick to it.</p>

<h2 id="the-breaking-point-concept">The “Breaking Point” Concept</h2>

<p>There comes a moment in every project’s development when you realize the architecture isn’t working. Code that used to be simple is now complex. Adding new features requires touching multiple files. Bugs appear in unexpected places. The codebase feels fragile.</p>

<p>This is the “breaking point”—the moment when you must choose: continue with a broken architecture, or refactor.</p>

<figure class="diagram"><img src="/img/vanilla-roguelike/056f8936b16bab35f620ff42d96cf3b5e66d872b89e274d54ba419f9da51dc6f.svg" alt="D2 diagram: Start: Simple Code"></figure>

<h3 id="recognizing-the-breaking-point">Recognizing the Breaking Point</h3>

<p><strong>Signs you’ve hit the breaking point:</strong></p>
<ul>
  <li>Every new feature requires changes in multiple places</li>
  <li>Fixing one bug creates two new bugs</li>
  <li>You’re afraid to change code because you don’t know what will break</li>
  <li>The codebase feels like a house of cards</li>
</ul>

<h3 id="the-vanilla-breaking-point">The Vanilla Breaking Point</h3>

<p>In March 2025, Vanilla Roguelike hit its breaking point. The game had grown organically over five years. Features were added as needed, but without a clear architectural pattern. The code worked, but it was fragile.</p>

<p>The breaking point came when trying to remove legacy code broke everything. The game rendered but wouldn’t accept input. Movement stopped working. Level transitions failed. The game was completely non-functional.</p>

<p>This crisis forced a decision: give up, or commit to fixing the architecture properly.</p>

<p>The choice was to refactor to Entity-Component-System (ECS) architecture. It was painful—nine hours of debugging, 20+ commits, and many moments of frustration. But it saved the project.</p>

<h3 id="why-breaking-points-are-valuable">Why Breaking Points Are Valuable</h3>

<p>Breaking points force you to learn. When everything breaks, you’re forced to understand how the pieces fit together. You can’t just add another hack—you must fix the underlying problem.</p>

<p>The breaking point in Vanilla led to:</p>
<ul>
  <li>Understanding of proper game architecture</li>
  <li>Knowledge of ECS pattern</li>
  <li>A codebase that could grow sustainably</li>
  <li>Confidence in refactoring large systems</li>
</ul>

<p>Breaking points aren’t failures—they’re learning opportunities. The key is recognizing them early and having the courage to fix the architecture rather than continuing with broken code.</p>

<h2 id="the-development-mindset">The Development Mindset</h2>

<p>Building a roguelike is a marathon, not a sprint. You’ll make mistakes. You’ll write code you’ll later throw away. You’ll hit breaking points. This is all part of the process.</p>

<p><strong>Embrace the journey:</strong></p>
<ul>
  <li>Every mistake teaches you something</li>
  <li>Every refactor makes you a better programmer</li>
  <li>Every breaking point forces you to learn</li>
</ul>

<p><strong>Stay focused:</strong></p>
<ul>
  <li>Build one feature at a time</li>
  <li>Keep the game playable</li>
  <li>Refactor when needed, not when convenient</li>
</ul>

<p><strong>Learn continuously:</strong></p>
<ul>
  <li>Read about algorithms and patterns</li>
  <li>Study other roguelikes</li>
  <li>Understand why things work, not just that they work</li>
</ul>

<h2 id="key-takeaway">Key Takeaway</h2>

<p>The right mindset is more important than the right tools. Start simple, iterate gradually, recognize problems early, and have the courage to refactor when needed. The journey of building a roguelike teaches you as much about software development as it does about game design.</p>

<h2 id="exercises">Exercises</h2>

<ol>
  <li>
    <p><strong>Plan your iterations</strong>: Break down building a roguelike into phases. What’s the simplest version that would be playable? What would you add next?</p>
  </li>
  <li>
    <p><strong>Identify breaking points</strong>: Look at a project you’ve worked on (or an open-source project). Can you identify moments where architecture should have been refactored? What were the signs?</p>
  </li>
  <li>
    <p><strong>Research refactoring</strong>: Read about the “Strangler Fig Pattern” and “Boy Scout Rule”. How do these apply to game development?</p>
  </li>
</ol>



<nav class="chapter-nav" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #ddd;border-bottom:1px solid #ddd;font-size:0.9rem;margin:1.5rem 0;">
  <a href="/vanilla-roguelike/01-what-is-a-roguelike/">&larr; What is a Roguelike?</a>
  <a href="/vanilla-roguelike/">Contents</a>
  <a href="/vanilla-roguelike/03-first-prototype/">Your First Playable Prototype &rarr;</a>
</nav>
