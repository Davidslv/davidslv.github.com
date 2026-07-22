---
layout: page
title: Books
permalink: /books/
description: "Two technical books by David Silva — Modular Rails: Architecture for the Long Game, and Building Your Own Roguelike — each with a complete, free web edition alongside print and eBook."
image: /img/og-default.png
---

Two technical books — each with a **complete, free web edition** alongside the print and eBook editions.

## Modular Rails: Architecture for the Long Game

<div class="book-listing">
  <picture>
    <source srcset="/img/modular-rails-cover-400.webp" type="image/webp">
    <img class="book-listing__cover" src="/img/modular-rails-cover-400.png" width="400" height="640"
         loading="lazy" decoding="async" alt="Modular Rails: Architecture for the Long Game book cover">
  </picture>
  <div class="book-listing__body">
    <p><strong>A practical guide to building maintainable Ruby on Rails applications with mountable engines — the architecture Rails has been shipping since version 3.1.</strong></p>
    <p>Bridges the gap between software architecture principles and the tools Rails already ships. Takes the thinking of Robert C. Martin, Neal Ford, Mark Richards, and Kent Beck and applies it to real Ruby on Rails applications — with working code, honest trade-offs, and a companion open-source application (<a href="https://github.com/Davidslv/orbit">Orbit</a>) you can clone and run yourself.</p>
    <p>Four parts. Eighteen chapters. 378 pages.</p>
    {% include buy-panel.html book="modular_rails" %}
  </div>
</div>

---

## Building Your Own Roguelike: A Practical Guide

<div class="book-listing">
  <picture>
    <source srcset="/img/roguelike-cover-400.webp" type="image/webp">
    <img class="book-listing__cover" src="/img/roguelike-cover-400.jpg" width="400" height="500"
         loading="lazy" decoding="async" alt="Building Your Own Roguelike: A Practical Guide book cover">
  </picture>
  <div class="book-listing__body">
    <p><strong>Build a complete roguelike in plain Ruby — from a playable prototype to procedural generation, Entity-Component-System architecture, and event-driven systems.</strong></p>
    <p>Vanilla Roguelike is the open-source codebase this book grew out of, written and rewritten over five years. Each chapter walks the same path the codebase actually took: a playable prototype first, then maze generation algorithms, then the architectural breaking points that forced a refactor to ECS, and finally the combat, inventory, AI, and event-driven layers built on top. You learn not just <em>how</em> to write each system, but <em>why</em> each architectural decision was made — and what was tried first and thrown away.</p>
    <p>No frameworks. No engine. Just Ruby, a test suite you can trust, and the trade-offs on the page rather than hidden in conventions.</p>
    {% include buy-panel.html book="vanilla_roguelike" %}
  </div>
</div>
