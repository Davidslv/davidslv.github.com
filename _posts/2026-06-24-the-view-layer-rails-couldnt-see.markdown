---
layout: post
title:  "The View Layer Rails Couldn't See"
date:   2026-06-24
series: engineers-notebook
series_order: 9
description: "Every layer of a Rails app has had a parser-based linter for years — except the one that ships HTML. Marco Roth's Herb makes ERB HTML-aware. What that bought us in a real engine, what's still rough, and the honest reason Arbre had to go."
image: /img/og-the-view-layer.png
---

For most of Rails' history, almost every layer of the stack has had a tool that *parses* it. RuboCop reads your Ruby as a syntax tree; Brakeman traces tainted data through it; ESLint reads your JavaScript. The view layer was the exception. The ERB linters we had worked on the *text* of the template, not on the HTML that text produces.

[Marco Roth's Herb](https://herb-tools.dev) closes that gap: written in C, it parses HTML-with-embedded-ERB into a real syntax tree. We have run it in production in a Rails engine for a few months. Here is what we wired in, what it caught, and what is still rough.

## The blind spot

For about twenty years, ERB tooling was string-based. `erb_lint` and `better-html` did useful work, but they pattern-matched over text — they had no parse tree of *the HTML you were producing*, so they could not reliably catch a `<div>` opened inside a `<p>`, or a value interpolated into an attribute where the escaping rules differ from body text.

The harder case in our codebase was not ERB at all. Parts of our admin surface were written in **Arbre** — the object-oriented "DOM in Ruby" that ActiveAdmin uses to build markup with `div do … end` blocks instead of templates. Arbre first appeared in 2011 and solved a real problem of its era. I never warmed to the abstraction myself, but taste is beside the point here. The real issue is that Arbre is invisible to static analysis: there is no HTML in the file, only Ruby that emits HTML at runtime. No HTML linter sees it, no language server checks the Stimulus targets inside it, no formatter touches it. Every `.html.arb` file is a file outside the ecosystem.

## What a parse tree makes possible

Once you have a tree, checks become expressible that a string linter cannot do reliably. In our engine, `herb analyze` gates on two:

- **Nesting** — invalid element nesting, the kind browsers silently repair and then render differently than you meant.
- **Accessibility** — structural checks (missing labels and the like) that only make sense with the element tree in front of you.

Herb can also check security — for instance, output in an attribute position, where a naive `<%= %>` can break out of the attribute. We leave those rules off, though: `better_html` (under `erb_lint`) already owns ERB safety, and running both would just double-report. Either way the point holds: the tree is what makes the check possible at all.

## The view layer has been consolidating on ERB

Herb did not appear in a vacuum. For a decade the view layer has been moving in one direction:

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

Two things get conflated here — a commenter rightly called me on it. The *substrate* has settled: ERB is where the ecosystem's weight sits, and that is a safe bet. The *tooling* on top is young — Herb is at 0.10. That is not a contradiction; it is the reason this is worth writing down. (The one popular bet the other way is Phlex — pure-Ruby views, genuinely good for composition. It is a different trade: write views as Ruby, and you are back to having no HTML for an HTML-aware tool to read.)

## The lived test: porting Arbre out of an engine

Here is where it became a diff. We wrote a hard rule into the engine's style guide: **new view partials are `.html.erb`, and the moment you touch an existing `.html.arb` file for any reason, you port it to ERB in the same pull request.**

Existing Arbre files keep working untouched until something forces an edit — a bug fix, a copy change, a new field. Then you port the whole file first and make your change in ERB. Pre-commit and CI both fail on any added or modified `.html.arb` in the diff (`git diff --diff-filter=AM | grep '\.html\.arb$'`). No hotfix bypass — the gate is only credible if it survives pressure.

That has the engine at **193 ERB partials and three remaining Arbre files** — the three are just ones nobody has needed to touch. There was no big-bang migration; the legacy set shrinks as you work.

What makes the rule fair is that porting Arbre is mechanical. You convert the whole file once, and it is done. That is cheap enough to demand on every touch — which it would not be for, say, a cop that rewrote existing method calls.

Here is one of those three files, trimmed. In Arbre the markup is Ruby — there is no `<div>`, no class, no attribute for a tool to read:

```ruby
div class: 'bg-white rounded-xl border px-6 py-5' do
  para t("#{i18n}.heading"), class: 'text-xs uppercase'
  text_node button_to t("#{i18n}.button"),
            sync_record_path(record),
            method: :post,
            class: 'px-4 py-2 rounded-lg bg-blue-600 text-white'
end
```

Ported, the same output is real HTML that `herb analyze` and `herb-lsp` can parse:

```erb
<div class="bg-white rounded-xl border px-6 py-5">
  <p class="text-xs uppercase"><%= t("#{i18n}.heading") %></p>
  <%= button_to t("#{i18n}.button"),
        sync_record_path(record),
        method: :post,
        class: "px-4 py-2 rounded-lg bg-blue-600 text-white" %>
</div>
```

`div do … end` becomes `<div>…</div>`, `para` becomes `<p>`, and the `text_node` wrappers fall away. One file, one pass.

## Honest about the rough edges

In the editor, `herb-lsp` (we list `marcoroth.herb-lsp` as a recommended extension) gives live HTML diagnostics as you type. But this is a young toolchain — 0.10.1 — and two things are still rough:

**Stimulus checks are off, on purpose.** We bootstrap Stimulus inline in an ERB partial rather than in `application.js`, and the Stimulus parser cannot follow controller registrations embedded in ERB — so it flags every real, registered controller as unknown. The four `stimulus-data-*` rules are disabled in `.herb.yml` until our bootstrap moves to a `.js` file. So the diagnostic I most wanted — catching a typo'd `data-controller` as I type it — is not live for us yet.

**Two ERB linters, side by side.** `herb analyze` for the parser-level validators, Shopify's `erb_lint` for whitespace and `better_html` safety. Where they overlap, we keep the rule in one so they do not double-report. The new tool has not replaced the old one; it sits next to it and will subsume more over time.

## The lesson

One idea is worth keeping: **the reach of your tooling is an architectural property, and you choose it.** Picking Arbre years ago did not just pick a way to write markup — it put that markup beyond every analyser we would later wish we had. Picking ERB put the view layer back inside reach of the linters, the language servers, the safety checks, and whatever Rails builds next on Herb. The template-engine debate usually turns on ergonomics; the more durable axis is legibility to tools, and on that axis HTML-aware ERB is in a different class from the DSLs it replaces.

So: write ERB, lint it with something that actually parses the HTML, and when you find a corner the tools cannot see, treat it as a bug in your architecture — not a quirk you live with.

---

*The setup here is a production Rails engine running [Herb](https://herb-tools.dev) 0.10.1 (`herb analyze` in pre-push and CI), `erb_lint` 0.9.0 with `better_html` for safety, `marcoroth.herb-lsp` as a recommended extension, and an enforced Arbre-to-ERB porting rule that has the engine at 193 ERB partials to 3 remaining Arbre files.*

*If you want the longer story on building Rails applications that stay maintainable as they grow — boundaries, engines, testing, and honest trade-offs — that is what [Modular Rails: Architecture for the Long Game](/modular-rails/) covers in depth. [Read it free on the web](/books/modular-rails/), or get the [paperback](https://www.amazon.com/dp/1066649405) ([UK](https://www.amazon.co.uk/dp/1066649405)).*
