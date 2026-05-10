---
layout: page
title: "Modular Rails: Architecture for the Long Game"
permalink: /modular-rails/
---

<div style="text-align: center; margin-bottom: 2em;">
  <img src="/img/modular-rails-cover.png" alt="Modular Rails: Architecture for the Long Game book cover" style="max-width: 350px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);">
</div>

**A practical guide to building maintainable Ruby on Rails applications using Rails Engines.**

The last comprehensive book on extending Ruby on Rails from the inside was published over a decade ago. Since then, applications have grown from small startups to enormous monoliths, teams have scaled from three developers to fifty, and the codebase that was delightful at 20 models became terrifying at 200.

Meanwhile, Ruby on Rails itself has been shipping the answer since version 3.1: mountable engines with namespace isolation. The same mechanism that powers Devise, Spree, and ActiveAdmin.

This book bridges the gap between software architecture principles and the tools Ruby on Rails already ships. It takes the thinking of Robert C. Martin, Neal Ford, Mark Richards, and Kent Beck and applies it to real Ruby on Rails applications — with working code, honest trade-offs, and a companion open-source application you can run yourself.

---

## What you'll learn

- Clean Architecture principles translated for the Ruby audience
- How Rails Engines work from the inside out
- Namespace isolation, inter-engine dependencies, and data ownership
- Testing strategies for modular applications
- When engines are the wrong choice — and what to use instead
- The microservices question: when to split, when to stay

---

## Who this book is for

Senior Ruby on Rails developers, tech leads, and engineering managers who have felt the pain of a growing monolith. If your team debates microservices vs monolith, if your test suite takes too long, or if new developers take weeks to become productive in your codebase, this book is for you.

---

## What makes this book different

Every chapter includes working code. Three open-source repositories track the book at increasing levels of architectural commitment:

- **[Orbit](https://github.com/Davidslv/orbit)** — the worked example for Parts II and III. Three engines, deliberately small enough to read in an afternoon.
- **[seams](https://github.com/Davidslv/seams)** — a CLI framework that ships the patterns the book teaches as opinionated generators. Auth, accounts, billing, notifications, teams, and admin engines, all installable into any Rails 8 host with `bin/rails generate seams:<engine>`.
- **[seams-example](https://github.com/Davidslv/seams-example)** — a reference Rails 8 host wiring all six canonical seams engines end-to-end. The "what does this look like in production shape" answer.

Four parts. Eighteen chapters. From principles to practice to the hard questions most architecture books skip.

---

## Read Chapter 1 for free

[Why Architecture Matters in Rails Applications](/2026/05/05/why-architecture-matters.html) -- an adapted excerpt from Chapter 1. See the writing style, the diagrams, and the practical code examples before you buy.

---

## Buy the book

| Format | Price | Link |
|--------|-------|------|
| Colour Paperback | $49.99 / £44.99 | [Amazon UK](https://www.amazon.co.uk/dp/1066649405) · [Amazon US](https://www.amazon.com/dp/1066649405) |
| B&W Paperback | $29.99 / £24.99 | [Amazon UK](https://www.amazon.co.uk/dp/1066649421) · [Amazon US](https://www.amazon.com/dp/1066649421) |
| Kindle | $29.99 / £24.99 | [Amazon UK](https://www.amazon.co.uk/dp/B0GZL7D53M) · [Amazon US](https://www.amazon.com/dp/B0GZL7D53M) |

*Also available through bookshops and libraries via IngramSpark.*

---

## Table of contents

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

---

## About the author

David Silva is a Senior Software Engineer at Tembo Money, where he leads architectural modernisation of a mortgage recommendation platform, decomposing a large Rails monolith into modular engines and applying the exact patterns discussed in this book. He has over 15 years of experience building Ruby applications across fintech (Tembo Money, Creditspring), government services (GOV.UK, Ministry of Justice), and platforms serving over a million users (Indeed).

He is the founder of [CarerNotes](https://carernotes.uk), and the author of [Building Your Own Roguelike: A Practical Guide](https://www.amazon.co.uk/dp/B0G1SGN181).

---

## Companion code

Three open-source repositories accompany the book at increasing levels of architectural commitment. Read the book first, then explore each in order:

1. **[Orbit](https://github.com/Davidslv/orbit)** — the original worked example. A small, focused Rails app demonstrating the engine pattern from Parts II and III, deliberately kept simple enough to read in an afternoon.
2. **[seams](https://github.com/Davidslv/seams)** — a CLI framework that ships the patterns from this book as opinionated generators. Auth, accounts, billing, notifications, teams, and admin engines, all installable into any Rails 8 host with `bin/rails generate seams:<engine>`. The book's later chapters reference seams directly.
3. **[seams-example](https://github.com/Davidslv/seams-example)** — a reference Rails 8 host wiring all six canonical seams engines, regenerated against seams main on every release. The "what does a real production-shaped seams app look like" answer.
