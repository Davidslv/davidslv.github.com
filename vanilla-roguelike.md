---
layout: page
title: "Building Your Own Roguelike: A Practical Guide"
permalink: /vanilla-roguelike/
description: "Build a complete roguelike in plain Ruby: procedural generation, Entity-Component-System architecture, and the Vanilla Roguelike codebase. Working code, honest trade-offs."
image: /img/roguelike-cover.jpg
last_modified_at: 2026-08-30
---

<div class="book-hero">
  <picture class="book-hero__cover">
    <source srcset="/img/roguelike-cover-400.webp" type="image/webp">
    <img src="/img/roguelike-cover-400.jpg" width="400" height="499"
         fetchpriority="high" decoding="async"
         alt="Building Your Own Roguelike: A Practical Guide book cover">
  </picture>
  <div class="book-hero__body">
    <p class="book-hero__hook">A game engine will not teach you architecture. Building a roguelike in plain Ruby will.</p>
    <p>Vanilla Roguelike is the open-source codebase this book grew out of, written and rewritten over five years. Each chapter walks the path the code actually took: a playable prototype first, then maze generation, then the architectural breaking point that forced a refactor to Entity-Component-System, and finally combat, inventory, AI and event-driven systems on top. You learn not just how to write each system, but why each decision was made — and what was tried first and thrown away.</p>
    <p class="book-hero__actions">
      {% include buy-cta-button.html book="vanilla_roguelike" %}
      <a class="btn-buy" href="/books/vanilla-roguelike/">Read it free online</a>
    </p>
    <p class="byline-credential">Written by <strong>David Silva</strong>. Fifteen years of Ruby at GOV.UK, the Ministry of Justice, Indeed and Tembo Money. Five years of one codebase, no engine, and the trade-offs on the page rather than hidden in a framework.</p>
  </div>
</div>

No frameworks. No engine. Just Ruby, a test suite you can trust, and a complete game you can clone, run and change.

## Get the book

{% include buy-panel.html book="vanilla_roguelike" %}

{% include newsletter.html tag="source:landing" book_tag="vanilla-roguelike" %}

## What you'll learn

- Maze generation algorithms, grids, and graph theory you can see on screen
- Procedural content beyond mazes: rooms, items, and seedable variety
- How a growing game hits an architectural breaking point, and what to do next
- Entity-Component-System architecture from first principles — entities, components, systems, and the world coordinator
- Combat, inventory, monster AI, and event-driven systems built on that architecture
- Testing procedural generation, and the performance trade-offs that actually matter

## Who this book is for

Rubyists, game-curious programmers, and anyone who wants to understand how a game is put together without wrapping an engine. If you have ever opened a Unity tutorial and felt you were learning the tool rather than the ideas, this book is for you. The concepts transfer; the code happens to be Ruby.

## What makes this book different

It is not a tour of a finished architecture presented as if it arrived fully formed. The chapters follow a real five-year codebase: the naive `Game` class, the breaking point, the ECS refactor, and the systems built once the seams were in the right place. Working code, honest trade-offs, and a companion repository you can clone before you spend anything.

## Table of contents

<details class="toc-details" markdown="1">
  <summary>Show all 22 chapters</summary>

**Getting started**

- Chapter 1: What is a Roguelike?
- Chapter 2: The Development Mindset
- Chapter 3: Your First Playable Prototype
- Chapter 4: Understanding Grids and Cells

**Procedural generation**

- Chapter 5: Maze Generation Algorithms
- Chapter 6: Exploring Algorithm Diversity
- Chapter 7: Beyond Mazes — Procedural Content

**Architecture**

- Chapter 8: The Architecture Problem
- Chapter 9: Introduction to Entity-Component-System (ECS)
- Chapter 10: Building ECS — Entities and Components
- Chapter 11: Building ECS — Systems
- Chapter 12: The World Coordinator

**Game systems**

- Chapter 13: Input and Movement
- Chapter 14: Collision and Interaction
- Chapter 15: Combat System
- Chapter 16: Items and Inventory
- Chapter 17: AI and Monsters
- Chapter 18: Event-Driven Architecture

**Practice**

- Chapter 19: Testing Your Roguelike
- Chapter 20: Performance Considerations
- Chapter 21: Extending Your Game
- Chapter 22: Your Roguelike Journey

</details>

Every chapter is [free to read on the web](/books/vanilla-roguelike/).

## About the author

David Silva is a Senior Software Engineer at Tembo Money. Over fifteen years he has built Ruby applications across fintech (Tembo Money, Creditspring), government services (GOV.UK, Ministry of Justice), and platforms serving more than a million users (Indeed). Vanilla Roguelike took five years to reach the form it has today; this book is the path that codebase actually took.

His other book, *[Modular Rails: Architecture for the Long Game](/modular-rails/)*, applies the same thinking to large Rails monoliths.

## Companion code

The game is public. Read the code before you spend anything.

**[Vanilla Roguelike](https://github.com/Davidslv/vanilla-roguelike)**: the open-source codebase this book is built on. Every architectural decision is in the commit history — maze algorithms, the breaking point, the ECS refactor, and the systems built on top.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Book",
  "name": "Building Your Own Roguelike: A Practical Guide",
  "author": { "@type": "Person", "name": "David Silva", "url": "https://davidslv.uk", "sameAs": ["https://www.amazon.co.uk/stores/author/B0DWX7G5YK", "https://github.com/davidslv", "https://twitter.com/davidslv"] },
  "inLanguage": "en",
  "bookFormat": "https://schema.org/Paperback",
  "isbn": "9798273984271",
  "url": "https://davidslv.uk/vanilla-roguelike/",
  "image": "https://davidslv.uk/img/roguelike-cover.jpg",
  "publisher": { "@type": "Organization", "name": "David Silva" },
  "workExample": {
    "@type": "Book",
    "bookFormat": "https://schema.org/EBook",
    "url": "https://www.amazon.co.uk/dp/B0G1RBWF6V",
    "identifier": { "@type": "PropertyValue", "propertyID": "ASIN", "value": "B0G1RBWF6V" }
  }
}
</script>
