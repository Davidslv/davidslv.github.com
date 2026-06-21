---
layout: book
book: modular_rails
title: "Introduction"
permalink: /books/modular-rails/introduction/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/foreword/">&larr; Foreword</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-01-why-architecture-matters/">Why Architecture Matters &rarr;</a>
</nav>

<h1 id="introduction">Introduction</h1>

<h2 id="the-state-of-rails-architecture-in-2026">The State of Rails Architecture in 2026</h2>

<p>The last time someone wrote a comprehensive book about extending Rails from the inside was José Valim’s <em>Crafting Rails Applications</em> (2011, with a second edition in 2013 covering Rails 4). It showed us how to build on Rails’ internals – Railties, engines, custom renderers, generators. It was a masterclass. And then, for over a decade, nothing of that depth came along for the Ruby community.</p>

<p>In that time, the Rails world changed dramatically. Applications grew from small startups to enormous monoliths serving millions of users. Teams went from three developers in a room to fifty engineers across multiple time zones. The codebase that was delightful at 20 models became terrifying at 200.</p>

<p>The community’s response was fragmented. Some teams reached for microservices and discovered the hard way that distributed systems are a different kind of hard. Some adopted Packwerk and gained visibility into their dependencies – with static analysis enforcement in CI, but not the runtime or structural enforcement that prevents violations in production code. Some added Sorbet and got type safety but not modularity. Some just kept going, adding more models to <code>app/models/</code>, more services to <code>app/services/</code>, and hoping that convention and discipline would hold it together.</p>

<p>Meanwhile, Rails itself had been shipping the answer since version 3.1: <strong>mountable Rails Engines</strong> with namespace isolation. The same mechanism that powers Devise, Spree, and ActiveAdmin – self-contained, namespace-isolated, independently testable modules that plug into a host application. Not a gem from a startup. Not an experimental pattern. A core framework feature, battle-tested across thousands of production applications.</p>

<p>This book is about using that mechanism properly, grounded in the architectural principles that explain <em>why</em> it works.</p>

<h2 id="what-this-book-is-and-isnt">What This Book Is (And Isn’t)</h2>

<p>This book <strong>is</strong>:</p>

<ul>
  <li>A practical guide to modularising Rails applications using engines</li>
  <li>An explanation of software architecture principles translated for the Ruby audience, drawing from Robert C. Martin’s <em>Clean Architecture</em>, Neal Ford and Mark Richards’ <em>Software Architecture: The Hard Parts</em>, and Kent Beck’s <em>Extreme Programming Explained</em></li>
  <li>Full of working code examples that you can run, modify, and learn from</li>
  <li>Honest about trade-offs – every architectural decision has a cost, and we’ll talk about both sides</li>
</ul>

<p>This book <strong>is not</strong>:</p>

<ul>
  <li>A Rails tutorial (you should be comfortable building Rails applications already)</li>
  <li>A theoretical treatise that avoids code (every chapter has implementation)</li>
  <li>An argument that engines are always the right answer (they’re not, and we’ll discuss when)</li>
  <li>A sales pitch for any particular gem, tool, or methodology</li>
</ul>

<h2 id="how-to-read-this-book">How to Read This Book</h2>

<p>The book is structured in four parts, and they’re meant to be read roughly in order, though you can skip ahead if your needs are immediate.</p>

<p><strong>Part I (Principles)</strong> gives you the vocabulary and mental models. If you already know Clean Architecture and XP well, skim these chapters – but do read them, because we specifically frame every concept through the lens of Rails development.</p>

<p><strong>Part II (The Mechanism)</strong> is the technical deep dive into Rails Engines. Even if you’ve used engines before, you’ll likely learn something about how they work internally. If you’re eager to start building, jump here.</p>

<p><strong>Part III (Practice)</strong> is where theory meets reality. Extraction strategies, testing patterns, team workflows, data ownership questions. This is the part you’ll reference most often when you’re in the middle of the work.</p>

<p><strong>Part IV (Trade-offs)</strong> is the part most architecture books skip. When engines are wrong. When Packwerk is actually better. When you genuinely do need microservices. How to evolve your decisions over time.</p>

<h2 id="the-companion-application">The Companion Application</h2>

<p>Throughout this book, we build and evolve <strong>Orbit</strong> – a simplified SaaS platform that manages subscriptions, generates invoices, and sends notifications to customers. It lives in its own repository at <a href="https://github.com/Davidslv/orbit">github.com/Davidslv/orbit</a> and starts as a standard Rails monolith that gets progressively modularised through the book. Each chapter references specific commits and branches so you can follow along, and each engine we extract is a self-contained, runnable module with its own test suite.</p>

<p>You don’t need Orbit to understand the book, but you’ll get more out of it if you run the code and experiment.</p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/foreword/">&larr; Foreword</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-01-why-architecture-matters/">Why Architecture Matters &rarr;</a>
</nav>
{% endraw %}
