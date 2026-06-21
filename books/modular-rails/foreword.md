---
layout: book
book: modular_rails
title: "Foreword"
permalink: /books/modular-rails/foreword/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/also-by/">&larr; Also by David Silva</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/introduction/">Introduction &rarr;</a>
</nav>

<h1 id="foreword">Foreword</h1>

<p>I’ve been staring at Rails monoliths for a long time now.</p>

<p>For the past several years, I’ve worked at a fintech company where our Rails application does what Rails applications tend to do when they succeed: it grows. It grew past the point where any single person could hold the whole system in their head. Past the point where “just follow the conventions” was enough to keep things from tangling. Past the point where a change to billing could quietly break notifications, and nobody would notice until a customer did.</p>

<p>I’ve spent a good portion of that time working with Rails engines in production. Not as a thought experiment. Not as a weekend side project. In production, with real money moving through the system, with a team that needed to ship features without stepping on each other’s toes. I’ve seen what works. I’ve seen what doesn’t. I’ve made mistakes I don’t want you to repeat.</p>

<p>More recently, I founded CarerNotes – a Rails application that helps care providers document their work. Building it from scratch gave me the chance to apply these architectural ideas from day one, not as a retrofit. The patterns in this book aren’t just about taming legacy monoliths. They work just as well when you’re starting fresh and want to stay organised as you grow.</p>

<p>That experience is the reason this book exists.</p>

<h2 id="the-gap">The Gap</h2>

<p>There are excellent books that teach you Rails. There are excellent books that teach you software architecture. What I couldn’t find was a book that sat at the intersection – one that took the architectural thinking of Robert C. Martin, Neal Ford, Mark Richards, Kent Beck, and Eric Evans, and applied it specifically to Rails applications using the tools Rails already ships.</p>

<p>Rails has had mountable, namespace-isolated engines since version 3.1. The mechanism is mature, battle-tested, and powers some of the most widely-used gems in the ecosystem. Yet most Rails developers have never built one. Most teams reaching for microservices have never seriously considered the modular monolith. The information is scattered across blog posts, conference talks, and tribal knowledge locked inside companies that figured it out the hard way.</p>

<p>I wanted one place where all of it came together. I couldn’t find that place, so I built it.</p>

<h2 id="who-this-book-is-for">Who This Book Is For</h2>

<p>This book is for senior Rails developers, tech leads, and engineering managers who feel the weight of their monolith and are looking for a way forward. You know Rails well. You’ve probably read a book or two on architecture. What you need is someone to show you how those ideas translate into actual Rails code – with real extraction strategies, real testing patterns, and an honest accounting of the costs.</p>

<p>If you’re considering microservices because your monolith has become painful, read this book first. You might still end up with services. But you’ll make that decision with a clearer understanding of the alternatives.</p>

<h2 id="what-this-book-is-not">What This Book Is Not</h2>

<p>I want to be upfront about what you won’t find here.</p>

<p>This is not a Rails tutorial. If you’re still learning how controllers and models work, come back later. This is not an argument that engines are always the right answer – Chapter 15 is entirely about when they’re the wrong tool. And this is not a theoretical exercise. Every chapter has working code. Every pattern has been used in production. Every trade-off section reflects real decisions I’ve had to make, not hypothetical ones.</p>

<p>I have strong opinions, and they come through in the writing. But I’ve tried to be honest about where those opinions end and where genuine uncertainty begins. Architecture is trade-off analysis, not dogma.</p>

<h2 id="acknowledgements">Acknowledgements</h2>

<p>This book stands on the shoulders of work I deeply respect. Robert C. Martin’s <em>Clean Architecture</em> gave me the vocabulary for thinking about component boundaries. Kent Beck’s <em>Extreme Programming Explained</em> taught me that good architecture emerges from disciplined practice. Neal Ford and Mark Richards’ <em>Software Architecture: The Hard Parts</em> showed me how to reason about trade-offs without hiding behind “it depends.” Eric Evans’ <em>Domain-Driven Design</em> shaped how I think about where boundaries belong.</p>

<p>I owe a debt to the Rails core team – particularly for building and maintaining the engine infrastructure that makes everything in this book possible. And to the broader Ruby community, which has always valued clarity, developer happiness, and the belief that code should be a pleasure to work with.</p>

<hr />

<p>Architecture is not a destination. It’s a series of decisions you make under uncertainty, with incomplete information, while the business keeps moving. This book won’t give you a perfect architecture. It will give you the tools to make better decisions and the confidence to change them when you learn more.</p>

<p>Let’s get to work.</p>

<p><em>David Silva, 2026</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/also-by/">&larr; Also by David Silva</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/introduction/">Introduction &rarr;</a>
</nav>
{% endraw %}
