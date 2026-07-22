---
layout: page
title: "Modular Rails: Architecture for the Long Game"
permalink: /modular-rails/
theme: namespace
description: "Build maintainable Ruby on Rails apps with mountable engines: clean architecture, namespace isolation, and the modular monolith. Working code, honest trade-offs."
image: /img/og-modular-rails.png
---

<div class="book-hero">
  <picture class="book-hero__cover">
    <source srcset="/img/modular-rails-cover-520.webp" type="image/webp">
    <img src="/img/modular-rails-cover-520.png" width="520" height="832"
         fetchpriority="high" decoding="async"
         alt="Modular Rails: Architecture for the Long Game book cover">
  </picture>
  <div class="book-hero__body">
    <p class="book-hero__hook">Microservices are not the answer to your growing Rails monolith. They never were.</p>
    <p>There is a better way, and it has been hiding in plain sight inside Ruby on Rails since version 3.1: mountable engines with namespace isolation, the same mechanism that powers Devise, Spree, and ActiveAdmin. Real boundaries at every layer, models, controllers, routes, views and even database tables, without putting HTTP between your services.</p>
    <p class="book-hero__actions">
      <a class="btn-read" href="#get-the-book">Get the book</a>
      <a class="btn-buy" href="/books/modular-rails/">Read it free online</a>
    </p>
    <p class="byline-credential">Written by <strong>David Silva</strong>. Fifteen years of Ruby at GOV.UK, the Ministry of Justice, Indeed and Tembo Money, where he is decomposing a production Rails monolith into engines using the patterns in this book.</p>
  </div>
</div>

The last comprehensive book on extending Ruby on Rails from the inside was published over a decade ago. Since then the codebase that was delightful at 20 models became terrifying at 200. This book takes the thinking of Robert C. Martin, Neal Ford, Mark Richards and Kent Beck and applies it to real Rails applications, with working code and honest trade-offs.

## Get the book

{% include buy-panel.html book="modular_rails" %}

{% include newsletter.html %}

## What you'll learn

- Clean Architecture principles translated for the Ruby audience
- How Rails Engines work from the inside out
- Namespace isolation, inter-engine dependencies, and data ownership
- Testing strategies for modular applications
- When engines are the wrong choice, and what to use instead
- The microservices question: when to split, when to stay

## Who this book is for

Senior Ruby on Rails developers, tech leads, and engineering managers who have felt the pain of a growing monolith. If your team debates microservices vs monolith, if your test suite takes too long, or if new developers take weeks to become productive in your codebase, this book is for you.

## What makes this book different

Every chapter includes working code, and three open-source repositories track the book at increasing levels of architectural commitment, from a small worked example to a production-shaped reference app. From principles to practice to the hard questions most architecture books skip.

## Table of contents

<details class="toc-details" markdown="1">
  <summary>Show all 18 chapters and four appendices</summary>

**Part I: Principles**

- Chapter 1: Why Architecture Matters
- Chapter 2: Clean Architecture for Rubyists
- Chapter 3: The Hard Parts — Reasoning About Trade-offs
- Chapter 4: Extreme Programming and Emergent Design

**Part II: The Mechanism**

- Chapter 5: Rails Engines from the Inside Out
- Chapter 6: Namespace Isolation
- Chapter 7: Building Your First Engine
- Chapter 8: Engine Integration Patterns

**Part III: Practice**

- Chapter 9: Identifying Boundaries in an Existing Application
- Chapter 10: Extracting Your First Engine
- Chapter 11: Managing Inter-Engine Dependencies
- Chapter 12: Data Ownership and the Database Question
- Chapter 13: Testing Strategy for a Modular Monolith
- Chapter 14: Team Workflow and Developer Experience

**Part IV: Trade-offs**

- Chapter 15: When Engines Are the Wrong Tool
- Chapter 16: Engines vs the Alternatives
- Chapter 17: The Microservices Question
- Chapter 18: Evolving Your Architecture Over Time

**Appendices**

- Appendix A: The Companion Application
- Appendix B: Rails Engine Quick Reference
- Appendix C: Further Reading
- Appendix D: Glossary

</details>

## About the author

David Silva is a Senior Software Engineer at Tembo Money, where he leads the architectural modernisation of a mortgage recommendation platform. Over fifteen years he has built Ruby applications across fintech (Tembo Money, Creditspring), government services (GOV.UK, Ministry of Justice), and platforms serving more than a million users (Indeed).

## Companion code

The patterns are public. Read the code before you spend anything.

1. **[Orbit](https://github.com/Davidslv/orbit)**: the worked example from Parts II and III. Three engines, small enough to read in an afternoon.
2. **[seams](https://github.com/Davidslv/seams)**: a CLI framework that ships these patterns as Rails generators. Auth, accounts, billing, notifications, teams and admin engines, installable into any Rails 8 host.
3. **[seams-example](https://github.com/Davidslv/seams-example)**: a reference Rails 8 host wiring all six engines together. The production-shaped answer.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Book",
  "name": "Modular Rails: Architecture for the Long Game",
  "author": { "@type": "Person", "name": "David Silva", "url": "https://davidslv.uk", "sameAs": ["https://www.amazon.co.uk/stores/author/B0DWX7G5YK", "https://github.com/davidslv", "https://twitter.com/davidslv"] },
  "inLanguage": "en",
  "bookFormat": "https://schema.org/Paperback",
  "isbn": "9781066649426",
  "numberOfPages": 378,
  "url": "https://davidslv.uk/modular-rails/",
  "image": "https://davidslv.uk/img/og-modular-rails.png",
  "publisher": { "@type": "Organization", "name": "David Silva" }
}
</script>
