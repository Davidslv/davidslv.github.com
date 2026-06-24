---
layout: post
title:  "The View Layer Rails Couldn't See"
date:   2026-06-24
series: engineers-notebook
series_order: 9
description: "Every layer of a Rails app has had static analysis for years — RuboCop on Ruby, Brakeman on security — except the one that ships HTML to users. Herb closes that blind spot by making ERB HTML-aware. Here is what that bought us in a real engine: ~190 templates pulled into the reach of tooling, a class of bugs caught as you type, and the honest reason Arbre had to go."
image: /img/modular-rails-cover.png
---

The Rails view-layer question has consolidated. After years of churn — Arbre, Erector, the Slim and Haml DSLs, then the components debate — the community has settled, and at the same time ERB itself is being rebuilt as a first-class, HTML-aware foundation. The interesting part is not which template engine won the argument. It is *why* it won, and what changed underneath it to make the win durable. The community is moving **toward** ERB, not away from it, and the reason is a tool called Herb.

I want to be specific about this, because I have been living it. We run [Marco Roth's Herb toolchain](https://herb-tools.dev) in production in a Rails engine, and the benefits were not the ones I expected when I wired it in. The headline feature — "an HTML-aware ERB parser" — sounds like a linter upgrade. It is actually the closing of a blind spot that Rails has had for its entire existence.

## The blind spot

Think about where static analysis already reaches in a mature Rails app. Your Ruby is read by RuboCop, line by line, with an AST that understands the language. Your security surface is read by Brakeman, which traces taint from request to query. Your migrations get checked for lock risk. Your JavaScript has ESLint and a type checker. Every layer of the stack has a tool that *understands* it — that parses it into a structure and reasons about that structure.

Except one. The layer that actually emits HTML to the user.

For twenty years, ERB tooling was string-based. The linters of the previous generation — `erb_lint`, `better-html` — did real and useful work, but they were fundamentally pattern-matching over text with some clever heuristics bolted on. They did not have a parse tree of *the HTML you were producing*. They could not reliably tell you that you had opened a `<div>` inside a `<p>`, or that you had interpolated user data into an attribute position where escaping rules differ from body text, because they were not parsing HTML — they were parsing ERB and squinting at the strings between the tags.

And that is the *good* case. The worse case is the one we actually had: large parts of our admin surface were written in **Arbre**, the Ruby DSL that ActiveAdmin uses to build markup with `div do … end` blocks instead of templates. Arbre is elegant to write. It is also completely invisible to every modern static-analysis tool. No HTML linter sees it, because there is no HTML in the file — only Ruby that happens to produce HTML at runtime. No language server can tell you a Stimulus target is misspelled inside it. No formatter touches it. Every `.html.arb` file we wrote was, in a real and measurable sense, a file outside the ecosystem.

## What "HTML-aware" actually buys you

Herb is written in C and parses HTML-with-embedded-ERB into a genuine syntax tree. That single architectural decision is the whole story, because it moves an entire class of checks from "impossible with regexes" to "trivial with a tree."

In our engine, `herb analyze` runs a set of parser-level validators that the old string linters simply could not express:

- **Security** — ERB output in attribute position, where the escaping context is different from body text and where a naive `<%= %>` can let an attacker break out of an attribute. You cannot find this reliably without knowing you are *in* an attribute, which means you need to have parsed the HTML.
- **Nesting** — malformed or invalid element nesting, the kind that browsers paper over silently and then render differently than you intended.
- **Accessibility** — missing labels, the structural a11y checks that only make sense once you have the element tree in front of you.

None of those are exotic. They are the bread-and-butter mistakes that ship to production because nothing in the pipeline was looking. The shift from a string linter to a tree-based one is the same shift Ruby made when it got a real parser: you stop catching *some* of a problem with heuristics and start catching *the actual problem* structurally.

## Read the room: where the view layer has actually been heading

This is not one tool appearing in a vacuum. It is the latest move in a decade-long consolidation, and the direction matters more than any single release. Here is the throughline:

<style>
.vl-timeline{margin:2rem 0;padding-left:1.6rem;border-left:2px solid var(--border-color)}
.vl-tl{position:relative;padding-bottom:1.6rem}
.vl-tl:last-child{padding-bottom:0}
.vl-tl::before{content:"";position:absolute;left:calc(-1.6rem - 7px);top:5px;width:11px;height:11px;border-radius:50%;background:#c2a06a;border:2px solid var(--background-color)}
.vl-tl .vl-yr{display:block;font-family:var(--code-font, "SFMono-Regular", Menlo, Consolas, monospace);font-size:.78rem;font-weight:600;letter-spacing:.02em;color:#c2a06a;text-transform:uppercase}
.vl-tl h4{margin:.15rem 0 .2rem;font-size:1.02rem;line-height:1.3;color:var(--text-color)}
.vl-tl p{margin:0;font-size:.92rem;line-height:1.5;color:var(--meta-color)}
</style>
<div class="vl-timeline" role="list" aria-label="Timeline of ERB's reinvigoration">
  <div class="vl-tl" role="listitem">
    <span class="vl-yr">2019</span>
    <h4>ViewComponent born at GitHub</h4>
    <p>An ERB template plus a Ruby class. Built and run by the most prolific ERB renderer on the planet — and still rendering ERB.</p>
  </div>
  <div class="vl-tl" role="listitem">
    <span class="vl-yr">2023 · Rails 7.1</span>
    <h4>Strict locals land</h4>
    <p>A magic comment gives plain partials required, typed parameters — closing much of the safety gap that sent people looking for alternatives.</p>
  </div>
  <div class="vl-tl" role="listitem">
    <span class="vl-yr">2024–25</span>
    <h4>Phlex 2 ships</h4>
    <p>Pure-Ruby views — fast and composable, but deliberately outside ERB. Good, and against the grain of everything around it.</p>
  </div>
  <div class="vl-tl" role="listitem">
    <span class="vl-yr">2025</span>
    <h4>Herb arrives</h4>
    <p>An HTML-aware ERB parser, linter, formatter and language server, written in C. The first time the view layer gets a real parse tree.</p>
  </div>
  <div class="vl-tl" role="listitem">
    <span class="vl-yr">2025–26</span>
    <h4>GitHub adopts Herb · Rails core leans in</h4>
    <p>Herb runs across GitHub's enormous ERB surface, and a proposed “ReActionView” direction at Rails World 2025 imagines Herb as the foundation Rails parses views with.</p>
  </div>
</div>

Read that as a single sentence and it says: the ecosystem keeps investing in ERB, and the investment is accelerating, not winding down. ViewComponent — built and run by GitHub, the most prolific ERB renderer on the planet — renders *ERB templates*. Rails 7.1's strict locals gave plain partials typed, required parameters, closing much of the safety gap that made people reach for alternatives. And the proposed "ReActionView" direction floated at Rails World 2025 is explicitly about making Herb the foundation Rails parses views with — roughly *what HEEx is to Phoenix, Herb could be to Rails*.

The one option that runs against this grain is Phlex, and it is instructive *why*. Phlex is genuinely good — pure-Ruby views, fast, composable. But its founding premise is to replace ERB with Ruby. Which means it lands you back in exactly the position Arbre put us in: no HTML for an HTML-aware tool to see. You trade the tooling reach for ergonomics. For some teams that is the right trade. But it is a trade *against* the direction every other piece of the ecosystem is reinforcing, and that is worth naming out loud before you make it.

## The lived test: porting Arbre out of an engine

Here is where it stopped being a philosophy and started being a diff. Our engine had a handful of Arbre admin templates left over from earlier days. The decision we took — and wrote into the engine's style guide as a hard rule — was: **new view partials are `.html.erb`, full stop, and the moment you touch an existing `.html.arb` file for any reason, you port it to ERB in the same pull request.**

That is the boy-scout rule with teeth. Existing Arbre files keep working, untouched, until something forces you to edit one — a bug fix, a copy change, a new field. At that point you do not patch the Arbre; you port the whole file to ERB and *then* make your change. Both pre-commit and CI fail on any added or modified `.html.arb` in the diff. There is no "just this hotfix" bypass, because the gate is only credible if it survives pressure.

The result, today, is roughly **190 ERB templates and three remaining Arbre files** in the engine — and those three are simply ones nobody has had a reason to touch yet. Every one of those 190 templates is now inside the reach of `herb analyze`, the editor language server, and `erb_lint`. They went from invisible to fully instrumented, one boy-scout port at a time, with no big-bang migration project.

The justification for being this strict is specific, and I think it generalises: the Arbre-to-ERB conversion is *per-file mechanical* — you port the whole file once and you are done — rather than per-call behavioural. That is what makes per-touch enforcement feasible here in a way it would not be for, say, a syntax cop on existing method calls. When the cost of compliance is "convert this one file you were editing anyway," the rule can be absolute. Match the strictness of a rule to how cheap compliance actually is.

## The cheapest place to catch a bug is as you type it

The CI gate is the floor, not the ceiling. The part that changed daily work most was the editor.

Herb ships a language server (`herb-lsp`), and it pairs with the Stimulus language server (`stimulus-lsp`, also Marco Roth's) because the Stimulus tooling is built *on top of* Herb's HTML+ERB parser. Install both — we list them as recommended extensions in the repo so a fresh clone gets prompted — and you get real-time diagnostics for a class of bug we had previously been catching only in code review: missing or undeclared Stimulus targets, action-method mismatches, undefined controllers, value-type errors, data-attribute format mistakes.

These are the bugs that are maddening precisely because they are *not* Ruby errors. A typo in `data-controller="affordabilty"` does not raise. It just silently does nothing, and you find out when a button stops working in a feature spec, or worse, in production. Moving that detection from "a reviewer notices on PR #86" to "you see it underlined as you type" is the cheapest feedback loop there is. The error and the fix happen in the same five seconds, with full context, before the code has even been committed.

## Be honest about the rough edges

This is a young toolchain — we are running version 0.10 — and pretending otherwise would be the kind of folklore I try to write *against*. Two honest caveats from our setup:

The first is that we run `stimulus-lint` manually but do **not** gate CI on it yet. The reason is a real interaction bug, not laziness: we bootstrap Stimulus inline in an ERB partial rather than in a standard `application.js`, and the current Stimulus parser cannot follow controller registrations embedded in ERB. So it flags every one of our real, registered controllers as "unknown." Worse, in the version we are on, neither the config-file disable nor inline `herb:disable` comments suppress those particular plugin rules — an upstream packaging issue. So the tool stays installed for manual use, and it goes behind the CI gate the day either our bootstrap moves to a `.js` file or upstream fixes the disable mechanism. Naming the exact condition for promotion is how a "held back" tool avoids quietly becoming "abandoned."

The second is that we deliberately run *two* ERB linters side by side — `herb analyze` for the parser-level validators and Shopify's `erb_lint` for whitespace and the `better_html` safety checks — and baseline the overlapping rules in one so they do not double-report. The new tool did not replace the old one overnight; it earned its place next to it and will subsume more of it over time. That is the normal, unglamorous shape of adopting infrastructure that is still maturing.

## The generalisable lesson

Strip away the specifics and there is one idea worth keeping.

**The reach of your tooling is an architectural property, and you get to choose it.** When we chose Arbre years ago, we were not only choosing a pleasant way to write markup — we were, without realising it, choosing to put that markup beyond the reach of every analyser we would later wish we had. When we chose to consolidate on ERB, we were choosing a substrate that the entire ecosystem's tooling can see into: the linters, the language servers, the security validators, the formatter, and whatever Rails core builds next on the Herb foundation. The template engine debate is usually argued on ergonomics and performance. The more durable axis is *legibility to tools*, and on that axis HTML-aware ERB is now in a different class from the DSLs it is replacing.

So the recommendation is narrow and confident. Write ERB. Lint it with something that actually parses the HTML. Keep your view layer inside the reach of the tools, the way every other layer of your app already is — and when you find a corner of it that the tools cannot see, treat that as a bug in your architecture, not a quirk you live with.

The view layer was the last place Rails couldn't see. It can see now. Point it at your templates.

---

*The setup in this post is from a production Rails engine running the [Herb](https://herb-tools.dev) toolchain at version 0.10.1: `herb analyze` wired into pre-push via lefthook and CI, `herb-lsp` and `stimulus-lsp` as recommended editor extensions, and an enforced Arbre-to-ERB porting rule that has the engine at ~190 ERB templates to 3 remaining Arbre files. The ecosystem timeline draws on ViewComponent, Rails 7.1 strict locals, Phlex 2, and the "ReActionView" direction discussed at Rails World 2025.*

*If you want the longer story on building Rails applications that stay maintainable as they grow — boundaries, engines, testing, and honest trade-offs — that is what [Modular Rails: Architecture for the Long Game](/modular-rails/) covers in depth. [Read it free on the web](/books/modular-rails/), or get the [paperback](https://www.amazon.com/dp/1066649405) ([UK](https://www.amazon.co.uk/dp/1066649405)).*
