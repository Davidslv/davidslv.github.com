---
layout: page
title: "The Modular Monolith in Rails: Engines, Packwerk & Boundaries"
permalink: /modular-monolith-rails/
description: "What a modular monolith is in Ruby on Rails, and how to build one with Rails Engines and Packwerk. Compare approaches, enforce boundaries, and decide between modular monolith and microservices — with runnable example code."
image: /img/modular-rails-cover.png
seo:
  type: Article
---

<p class="post-meta">
  By <a href="/books/modular-rails/about-the-author/">David Silva</a> — Senior Software Engineer, 15+ years in Ruby.
  <em>Last updated: June 2026 (Rails 8, Zeitwerk-era).</em>
</p>

What follows is a question I get asked, in one form or another, almost every month: *"We have a big Rails app, it's getting hard to work in, everyone's stepping on each other — do we need to break it into microservices?"*

Almost always, the answer is no. What you need is a **modular monolith**: a single deployable Ruby on Rails application whose internals are split into well-defined modules with enforced boundaries. You keep one deploy, one test suite, one database connection pool and one place to reason about a request — but you stop letting any object reach into any other object across the whole codebase.

This page is the honest, current (Rails 8, Zeitwerk-era) guide to doing that. It covers what a modular monolith actually is, the three real mechanisms for building one in Rails — **Rails Engines**, **Packwerk**, and plain namespaced modules — and a fair, side-by-side comparison so you can pick. It walks through namespace isolation, inter-module boundaries, data ownership, and testing. And — because nobody else seems to write this part down — it tells you when you should *not* do any of this.

I decompose a Rails monolith into engines for a living at [Tembo](https://www.tembomoney.com/), and I've written a whole book about it. Where a topic deserves a chapter rather than a section, I'll link to the relevant free chapter so you can go deeper.

## What is a modular monolith in Rails?

A monolith is a single application you build, test and deploy as one unit. A *modular* monolith is the same thing with one extra rule: the code inside is divided into modules that own their data and behaviour, and modules talk to each other only through **public interfaces** — never by reaching into each other's internals.

The contrast that matters is not monolith-versus-microservices. It's *modular*-versus-*big ball of mud*. A big ball of mud is also a monolith; it just has no internal boundaries, so any controller can touch any model, any model can call any service, and a change to billing quietly breaks onboarding because they share a half-dozen models nobody owns.

A modular monolith gives you most of what people actually want from microservices — clear ownership, independent reasoning, the ability for two teams to work without colliding — **without** the distributed-systems tax: no network between your modules, no eventual consistency you didn't ask for, no per-service deploy pipeline, no cross-service transaction you now have to fake with a saga. You get a function call where a microservice would give you an HTTP round trip that can fail.

### When you should use one

Reach for a modular monolith when:

- The codebase has grown past the point where one person holds it all in their head (very roughly, six figures of lines, or more than one team committing daily).
- You can already *name* the domains — billing, onboarding, notifications, reporting — even if the code doesn't reflect them yet.
- Changes in one area keep breaking another, and you can't tell why without reading half the app.
- You want the *option* of extracting a service later, but you don't want to pay for distribution today.

That last point is the strategic one. A clean module boundary is the cheapest possible insurance policy: if a module genuinely needs to become its own service in two years, a well-bounded module is a far easier extraction than a tangle. You're buying optionality, not microservices.

## The three mechanisms in Rails

There are exactly three serious ways to enforce modules inside a Rails app. They are not mutually exclusive, but most teams should start with one.

### 1. Rails Engines

An engine is a miniature Rails application that lives inside your app. It's the mechanism Rails itself is built from — `Rails::Application` *is* an `Engine`, which is why the pattern composes so naturally. Each engine has its own `app/` directory, its own routes, its own migrations, and its own namespace.

A mountable engine has a small, predictable layout. The single-nested namespace directory is the part that matters most:

```
components/
  billing/
    lib/
      billing/
        engine.rb
    app/
      models/
        billing/
          ledger.rb      # defines Billing::Ledger
    config/
      routes.rb
    db/
      migrate/
```

The engine declaration is four lines:

```ruby
# components/billing/lib/billing/engine.rb
module Billing
  class Engine < ::Rails::Engine
    isolate_namespace Billing
  end
end
```

That single `isolate_namespace Billing` line is the whole point. It tells Rails that everything in this engine lives under the `Billing` namespace: models, controllers, routes, table-name prefixes, helpers. The engine becomes a unit you can reason about in isolation. I pull apart how this works from the Rails source — why your app is itself an engine, and what `isolate_namespace` actually does to the inheritance chain — in [Rails Engines from the Inside Out](/books/modular-rails/chapter-05-rails-engines-from-the-inside-out/).

You mount an engine in the host app's routes:

```ruby
# config/routes.rb
Rails.application.routes.draw do
  mount Billing::Engine, at: "/billing"
end
```

A common layout is to keep engines inside the repository (a "path gem"), not published anywhere:

```ruby
# Gemfile
gem "billing", path: "components/billing"
gem "onboarding", path: "components/onboarding"
```

Engines are the strongest of the three mechanisms because the boundary is *structural* rather than CI-enforced: each engine has its own `app/` directory, its own isolated routes and helpers, and its own table-name prefix. `isolate_namespace` keeps namespacing automatic, so onboarding code and billing code can't quietly merge into one undifferentiated blob. The boundary isn't only a convention you have to remember — much of it is wired into how Rails loads and mounts the engine.

### 2. Packwerk

[Packwerk](https://github.com/Shopify/packwerk) is the tool Shopify built to add boundaries to a monolith *without* restructuring it into engines. You stay in one `app/` directory, but you declare "packages" with a `package.yml`, mark which constants each package exposes as public, and Packwerk statically checks — at CI time — that nothing violates the boundary.

```yaml
# components/billing/package.yml
enforce_dependencies: true
enforce_privacy: true
dependencies:
  - components/platform
```

```ruby
# A boundary violation Packwerk will flag in CI:
#   Onboarding::SignUp references Billing::Ledger,
#   a private constant of components/billing
```

Two honest things about Packwerk in 2026 that the older blog posts won't tell you. First: it's a *static analysis* tool. It does not change how your code loads or runs; a determined developer can still call a private constant at runtime and the app will happily execute it — Packwerk just fails the build. The enforcement is at CI, not in the loader. Second: Packwerk is still **actively maintained by Shopify** — version 3.3.0 shipped in May 2026 with a steady release cadence — but it is built around one very large company's needs and codebase. That doesn't make it a bad choice; it just means you're adopting a tool whose roadmap is shaped by Shopify's priorities, which is worth weighing for a decision you expect to live with for years.

### 3. Plain namespaced modules

You don't strictly need either tool to start. You can put related code under a namespace, give it a clear public entry point, and enforce the boundary with discipline and code review:

```ruby
# app/billing/billing.rb — the public API
module Billing
  def self.charge(account:, amount_pence:)
    Internal::ChargeService.new(account, amount_pence).call
  end
end
```

This is the lightest possible version and a perfectly reasonable first step for a smaller app. Its weakness is obvious: nothing *enforces* the boundary except humans. The day someone in a hurry calls `Billing::Internal::ChargeService` directly, the boundary is gone and nobody notices for six months.

## Engines vs Packwerk vs gems vs microservices: a fair comparison

Searchers literally type *"packwerk vs engines"*, and every page that ranks picks a side. Here's the honest matrix.

**Short answer:** use **Packwerk** when you have a large existing app you can't restructure right now — it adds boundary checks in CI without moving a single file. Use **Rails Engines** when you want a structural boundary baked into how the app loads and the cleanest path to extracting a service later. The full comparison is below.

| Dimension | Rails Engines | Packwerk | Namespaced modules | Microservices |
|---|---|---|---|---|
| **Boundary enforced by** | App structure + the loader (structural) | Static analysis in CI | Convention / review | The network |
| **Setup overhead** | Medium — real directory structure, mount points | Low — add `package.yml` files | Lowest | Highest |
| **Runtime isolation** | Partial (own app dir, routes, helpers, table prefix) | None (one app dir) | None | Total |
| **Migrations / schema** | Per-engine migrations, table prefixes | Shared schema | Shared schema | Per-service DB |
| **Namespacing** | Automatic via `isolate_namespace` | You declare it | You write it | N/A |
| **Refactor cost to adopt** | Higher (move files into engines) | Low (annotate in place) | Low | Very high |
| **Best when** | You want hard, structural boundaries and a clean extraction path | You have a huge existing app you can't restructure now | Small app, early days | A module has genuinely independent scaling, language or failure needs |

The right way to read this table: **Packwerk meets you where your monolith already is** — it's the lowest-friction way to add boundaries to a large existing codebase without a big move. **Engines give you the strongest boundary** because enforcement lives in the application's structure — separate app directories, isolated routes and helpers, prefixed tables — rather than in a CI check you can forget to wire up, and they give you the cleanest path to a future extraction. They are not enemies; plenty of teams use Packwerk to discover where the seams are, then promote the highest-traffic seams into engines.

And microservices? They belong in this table because they're the same decision taken to its extreme — total isolation at the cost of total operational overhead. You choose them when a module has a genuinely different scaling profile, failure domain, or runtime, *not* because your codebase is messy. A messy monolith becomes several messy services with a network in between. I give Dan Manges' canonical engine-based approach, Shopify's Packwerk path and the microservices question a full treatment in [Engines vs the Alternatives](/books/modular-rails/chapter-16-engines-vs-alternatives/) and [The Microservices Question](/books/modular-rails/chapter-17-the-microservices-question/).

## Namespace isolation and Zeitwerk

This is the part that trips up real teams and that *no* ranking page currently covers: how modular boundaries interact with **Zeitwerk**, the autoloader Rails has used since Rails 6 and the only one in Rails 8.

Zeitwerk maps constant names to file paths. The rule it enforces is unforgiving and useful: a file at `billing/ledger.rb` *must* define `Billing::Ledger`, and nothing else. When an engine calls `isolate_namespace Billing`, Rails arranges the engine's autoload paths so its `app/models/billing/ledger.rb` resolves to `Billing::Ledger`, and keeps that engine's routing and helpers scoped to the `Billing` namespace.

Two practical consequences:

- **Eager loading is per-engine.** In production, Rails eager-loads each engine. If you put a file in the wrong namespace directory, you'll find out at boot, not in production — which is exactly what you want.
- **Don't fight the namespace.** The single most common Zeitwerk error in a modular app is a constant defined in the wrong namespace — `class Ledger` at `billing/ledger.rb` instead of `class Billing::Ledger`. The loader will raise `Zeitwerk::NameError` and tell you precisely what it expected. Treat that error as the boundary doing its job.

One honest caveat, because it matters: engines contribute their `app/` paths to the *same* Zeitwerk loader, and the host eager-loads every engine. So `Billing::Ledger` is technically a resolvable constant from inside onboarding at runtime — Rails does not hard-block cross-engine constant access on its own. The guarantee an engine gives you is namespacing, prefixed tables, and isolated routes and helpers — a *structural* boundary, not constant-level privacy. If you want privacy enforced, you layer Packwerk (or a visibility gem) on top. I spend a whole chapter on the autoloader's behaviour under modular layouts — autoload paths, eager-load ordering, and the namespacing edge cases — in [Namespace Isolation](/books/modular-rails/chapter-06-namespace-isolation/).

## Inter-module communication: a spectrum, not a dogma

How should one module call another? The advice online swings between naively simple (a service object that just instantiates the other module's classes) and wildly over-engineered (Kafka, an outbox table and sagas before you have your second module). The truth is a spectrum, and you should pick the *least* powerful tool that works.

**1. A public method call.** The default. The calling module invokes the other module's public API — and *only* its public API.

```ruby
# In onboarding — talking to billing through its front door:
Billing.charge(account: account, amount_pence: 4_999)
```

**2. Published events, in-process.** When a module needs to announce that something happened without caring who listens, use `ActiveSupport::Notifications`. No new infrastructure, still synchronous, still in one process. Following the book's `entity.action.engine_name` naming convention:

```ruby
# Billing publishes — note this runs every subscriber inline, synchronously:
ActiveSupport::Notifications.instrument("charge.succeeded.billing", account_id: account.id)

# Onboarding subscribes, without Billing knowing it exists:
ActiveSupport::Notifications.subscribe("charge.succeeded.billing") do |event|
  Onboarding.activate(account_id: event.payload[:account_id])
end
```

One correctness trap to know about: these subscribers run **synchronously, in-line, in the publisher's call stack**. If the onboarding subscriber raises, the exception propagates straight back into billing's charge path and can break the publisher — so the "decoupling" is real for *who knows whom*, but not for *who can break whom*. Keep subscriber bodies tiny and defensive (rescue and report, or enqueue a job), or you've coupled failure where you thought you'd decoupled it.

**3. Asynchronous / outbox.** Only when you genuinely need durability across a failure — the work *must* happen even if the process crashes after the charge commits. This is where a background job, and occasionally an outbox table, earns its keep. In Rails 8, [Solid Queue](https://github.com/rails/solid_queue) ships in the box, so durable async is a built-in database table rather than a new piece of infrastructure to operate.

The mistake is starting at level three. Begin with a method call. Move to events when you have a real second listener. Move to async only when you have a real durability requirement. [Managing Inter-Engine Dependencies](/books/modular-rails/chapter-11-managing-inter-engine-dependencies/) walks the whole spectrum with the trade-offs spelled out.

## Data ownership

Boundaries in the code mean nothing if every module reads and writes every table. The rule that makes a modular monolith real is: **each module owns its tables, and no other module touches them directly.**

The sane default in 2026 is *not* a database per module, and it is *not* PostgreSQL schemas. It's **one database, logical ownership.** Billing owns `billing_*` tables. Nothing outside billing issues SQL against them — they go through `Billing`'s public API. Foreign keys *within* a module are encouraged; foreign keys *across* modules are a smell, because they hard-wire two modules together at the database level and make a future extraction painful.

```ruby
# Bad: onboarding reaches across the boundary into billing's tables.
account.billing_ledger_entries.where(status: :settled)

# Good: onboarding asks billing a question.
Billing.settled_balance_for(account)
```

You only reach for split databases or `connects_to` multi-database setups when a module has a genuinely independent scaling or isolation need — and at that point you're most of the way to being able to extract it as a service. Start with one database and disciplined ownership. I cover the migration story, table prefixes and the cross-boundary foreign-key question in [Data Ownership](/books/modular-rails/chapter-12-data-ownership/).

## Testing a modular monolith

A good module structure should make your tests *faster* and *clearer*, not just better organised. Each module keeps its own tests beside its own code:

```
components/
  billing/
    app/
    spec/        # billing's tests live here
  onboarding/
    app/
    spec/
```

Three things modern Rails makes possible that older write-ups predate:

- **Run a module's suite in isolation.** Because an engine is a self-contained unit, you can run just `components/billing`'s tests when you change billing — a tighter feedback loop than booting the whole app.
- **Test against the boundary, not the internals.** A module's tests should exercise its *public API*. When `Onboarding` needs `Billing`, stub `Billing.charge` rather than reaching into billing's internal classes. If your tests can only be written by touching another module's internals, that's the boundary telling you it's been crossed.
- **Parallelise per module.** With one suite per module, CI can shard along module lines, and a change to billing need not re-run onboarding's slow integration tests.

This is exactly the area Babbel and others have openly admitted is unresolved in their write-ups. I lay out a concrete strategy — fixtures versus factories per module, where to put cross-module integration tests, and how to keep them fast — in [Testing Strategy](/books/modular-rails/chapter-13-testing-strategy/).

## A safe, incremental migration path from a messy app

You do not rewrite. You extract one seam at a time, and every step leaves you with a shippable app. This is the loop:

1. **Pick a seam.** Choose one domain with the *fewest* inbound dependencies — notifications and reporting are often good first candidates. Don't start with the most tangled one.
2. **Namespace it in place.** Move its classes under a `Module::` namespace, leaving everything else alone. Ship. The app still works; you've only renamed.
3. **Define the public API.** Add a single entry-point module (`Notifications.deliver(...)`) and route external callers through it. Ship.
4. **Draw the boundary.** Either annotate it as a Packwerk package, or move it into an engine. Ship.
5. **Enforce it.** Turn on `enforce_privacy` for that package, or rely on the engine's structure. Fix the violations CI now surfaces. Ship.
6. **Repeat** with the next seam.

The important property is that **steps 2 through 5 each have a safe stopping point.** If priorities change after step 2, you've still left the codebase better than you found it — namespaced and a little clearer — and nothing is half-migrated and broken. That revertability is what makes this safe to do on a live, revenue-generating app. The full extraction playbook, including how to choose the first seam and how to handle the inevitable two-way dependency, is in [Identifying Boundaries](/books/modular-rails/chapter-09-identifying-boundaries/) and [Extracting Your First Engine](/books/modular-rails/chapter-10-extracting-your-first-engine/).

## Runnable companion code

Reading about boundaries only gets you so far. There are first-party, clonable repositories built to go with this material:

- **[Orbit](https://github.com/Davidslv/orbit)** — a worked modular Rails application you can clone and run.
- **[seams](https://github.com/Davidslv/seams)** and **[seams-example](https://github.com/Davidslv/seams-example)** — tooling and a reference app for finding and drawing the seams in an existing codebase.

Clone one, run it, and break a boundary on purpose to watch the enforcement fire. That's worth more than any diagram.

## When NOT to build a modular monolith

This is the section the incumbents don't write, and it's the most useful one. A modular monolith is a cost, not a free win. Don't pay it when:

- **Your app is young or small.** Below roughly 50–75k lines, or with one small team, boundaries cost more than they save. You don't yet *know* where the real seams are, and premature boundaries drawn in the wrong place are worse than no boundaries — you'll spend your time fighting walls you put up by guessing. Build the ball of mud first; let the domains reveal themselves.
- **You can't name your domains.** If the team can't agree on what the modules *are*, you're not ready to draw lines. Modularisation encodes a domain model you understand; it can't discover one you don't.
- **It's a thin CRUD app.** Some applications are genuinely a database with a web form on top. Adding engines to a small admin tool is architecture for its own sake.
- **You're reaching for it to fix a people problem.** If the real issue is no ownership, no review, or no tests, boundaries won't fix it — and may give you false confidence that you've solved something you haven't.

There's also a Rails-8-specific reason the bar for *leaving* the monolith has gone *up*. The classic argument for extracting a service was operational: you needed a separate thing to run your queue, your cache, your real-time layer. Rails 8 ships [Solid Queue](https://github.com/rails/solid_queue), Solid Cache and Solid Cable — durable jobs, caching and WebSockets backed by your existing database, no Redis, no separate broker. A lot of the historical pressure to extract services for operational reasons has simply evaporated. That strengthens, not weakens, the case for staying a well-organised modular monolith. I make the full "when engines are the wrong tool" argument in [When Engines Are the Wrong Tool](/books/modular-rails/chapter-15-when-engines-are-wrong/).

## Read the whole thing, free

This page is the map. If you want the territory — the boot process read from the Rails source, the full extraction playbook, the team-workflow chapter, and the honest trade-offs — the entire book *Modular Rails: Architecture for the Long Game* is **free to read online**, all 18 chapters, no signup.

[Read Modular Rails free online →](/books/modular-rails/)

## Frequently asked questions

### What is a modular monolith in Rails?

A modular monolith is a single Rails application — one deploy, one test suite, one database — whose internal code is divided into modules that own their own data and behaviour and communicate only through public interfaces. It gives you the clear ownership and independent reasoning people want from microservices without the distributed-systems overhead, because your modules talk via in-process method calls rather than over a network.

### Packwerk or Rails Engines — which should I use?

Use **Packwerk** when you have a large existing app you can't restructure right now: it adds boundary checks in CI without moving your files. Use **Rails Engines** when you want the strongest, structural boundary — own app directory, isolated routes and helpers, prefixed tables — and a clean path to extracting a service later. They're complementary — many teams use Packwerk to find the seams, then promote the most important ones into engines. Packwerk is actively maintained by Shopify (3.3.0 shipped in May 2026), though its roadmap follows one company's needs, which is worth weighing for a long-lived codebase.

### Does a modular monolith mean a separate database per module?

No. The sane default is **one database with logical ownership**: each module owns its tables and nothing else queries them directly. Keep foreign keys *within* a module, avoid them *across* modules, and only split into separate databases when a module has a genuine, independent scaling or isolation need — at which point you're nearly ready to extract it as a service anyway.

### How does Zeitwerk affect a modular Rails app?

Zeitwerk maps constants to file paths, so a modular layout works best when every file sits in the namespace its directory implies — `billing/ledger.rb` must define `Billing::Ledger`. With engines, `isolate_namespace` wires up each engine's autoload paths, routing and helpers so its internals stay scoped to it. Note that engines share one loader and the host eager-loads them all, so cross-engine constants are technically reachable at runtime — engines give you a structural boundary, not constant-level privacy. The most common error is a constant defined in the wrong namespace; treat the resulting `Zeitwerk::NameError` as the boundary working as intended.

### When should I NOT use a modular monolith?

Skip it when your app is young or small (roughly under 50–75k lines or a single small team), when you can't yet name your domains, when it's a thin CRUD app, or when you're using it to paper over a people or process problem. Premature boundaries drawn in the wrong place cost more than no boundaries at all.

### Do I still need microservices in Rails 8?

Far less often than the hype suggests. Rails 8 ships Solid Queue, Solid Cache and Solid Cable — durable jobs, caching and real-time backed by your database — which removes much of the operational pressure that used to push teams towards extracting services. Reach for a microservice only when a module has a genuinely different scaling profile, failure domain or runtime, not because your codebase has become hard to work in. A modular monolith fixes the latter.

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "headline": "The Modular Monolith in Rails: Engines, Packwerk & Boundaries",
      "description": "What a modular monolith is in Ruby on Rails, and how to build one with Rails Engines and Packwerk. Compare approaches, enforce boundaries, and decide between modular monolith and microservices — with runnable example code.",
      "image": "https://davidslv.uk/img/modular-rails-cover.png",
      "datePublished": "2026-06-24",
      "dateModified": "2026-06-24",
      "inLanguage": "en-GB",
      "author": {
        "@type": "Person",
        "name": "David Silva",
        "url": "https://davidslv.uk/books/modular-rails/about-the-author/"
      },
      "publisher": {
        "@type": "Person",
        "name": "David Silva",
        "url": "https://davidslv.uk/"
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": "https://davidslv.uk/modular-monolith-rails/"
      }
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "What is a modular monolith in Rails?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "A modular monolith is a single Rails application — one deploy, one test suite, one database — whose internal code is divided into modules that own their own data and behaviour and communicate only through public interfaces. It gives you the clear ownership and independent reasoning people want from microservices without the distributed-systems overhead, because your modules talk via in-process method calls rather than over a network."
          }
        },
        {
          "@type": "Question",
          "name": "Packwerk or Rails Engines — which should I use?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Use Packwerk when you have a large existing app you can't restructure right now: it adds boundary checks in CI without moving your files. Use Rails Engines when you want the strongest, structural boundary — own app directory, isolated routes and helpers, prefixed tables — and a clean path to extracting a service later. They're complementary — many teams use Packwerk to find the seams, then promote the most important ones into engines. Packwerk is actively maintained by Shopify (3.3.0 shipped in May 2026), though its roadmap follows one company's needs, which is worth weighing for a long-lived codebase."
          }
        },
        {
          "@type": "Question",
          "name": "Does a modular monolith mean a separate database per module?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "No. The sane default is one database with logical ownership: each module owns its tables and nothing else queries them directly. Keep foreign keys within a module, avoid them across modules, and only split into separate databases when a module has a genuine, independent scaling or isolation need — at which point you're nearly ready to extract it as a service anyway."
          }
        },
        {
          "@type": "Question",
          "name": "How does Zeitwerk affect a modular Rails app?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Zeitwerk maps constants to file paths, so a modular layout works best when every file sits in the namespace its directory implies — billing/ledger.rb must define Billing::Ledger. With engines, isolate_namespace wires up each engine's autoload paths, routing and helpers so its internals stay scoped to it. Note that engines share one loader and the host eager-loads them all, so cross-engine constants are technically reachable at runtime — engines give you a structural boundary, not constant-level privacy. The most common error is a constant defined in the wrong namespace; treat the resulting Zeitwerk::NameError as the boundary working as intended."
          }
        },
        {
          "@type": "Question",
          "name": "When should I NOT use a modular monolith?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Skip it when your app is young or small (roughly under 50–75k lines or a single small team), when you can't yet name your domains, when it's a thin CRUD app, or when you're using it to paper over a people or process problem. Premature boundaries drawn in the wrong place cost more than no boundaries at all."
          }
        },
        {
          "@type": "Question",
          "name": "Do I still need microservices in Rails 8?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Far less often than the hype suggests. Rails 8 ships Solid Queue, Solid Cache and Solid Cable — durable jobs, caching and real-time backed by your database — which removes much of the operational pressure that used to push teams towards extracting services. Reach for a microservice only when a module has a genuinely different scaling profile, failure domain or runtime, not because your codebase has become hard to work in. A modular monolith fixes the latter."
          }
        }
      ]
    }
  ]
}
</script>
