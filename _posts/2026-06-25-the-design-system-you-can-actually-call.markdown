---
layout: post
title:  "The Design System You Can Actually Call"
date:   2026-06-25
series: engineers-notebook
series_order: 10
description: "We had twelve chapters of design-system HTML — every button drawn, every state documented — and it still wasn't a system, because a manual describes a button, it doesn't give you one. This is the story of turning that manual into an invokable Rails component library: why strict-locals partials beat ViewComponent for this codebase, how a preview-driven registry auto-wires every helper, and why the docs can't drift from the code when the docs *are* the code rendered."
image: /img/modular-rails-cover.png
---

We had a beautiful design system. Twelve chapters of HTML — foundations, components, patterns, accessibility — every button and dialog drawn, every state documented, every rule written down. It looked finished.

It wasn't, and the reason is the most important idea in this post:

> A manual *describes* a button. It does not *give you one.*

Every screen that wanted a button still had to hand-write the markup — `<button class="btn btn-primary">…</button>` — and hope it remembered the right classes, the right `type`, the right `aria-*`. The manual is a picture of the component; the app re-keys it by hand every time. The first time someone forgets a class or an attribute, the system has **drifted**, and nothing catches it.

So "sign-off" never meant "the manual is pretty." It meant something stricter: the documented components must become **real, callable units** — one source of truth each, invoked by name with parameters, so that fixing a component once fixes every screen. That is the difference between a *style guide* and a *component library*, and it is the whole job. This is the story of building the second one — the decision, the architecture, and the conventions that keep it honest.

## The decision: how, not just what

The instinct in 2025–2026 Rails is to reach for **ViewComponent**. We didn't — and the reasoning matters more than the answer, because it is specific to *this* codebase rather than a general verdict on the gem.

The field has three live answers, all current and all battle-tested:

| Approach | What it is |
|---|---|
| **Strict-locals partials + helpers** | Rails-native; a `<%# locals: (…) %>` partial plus a thin helper |
| **ViewComponent** | GitHub's gem; a Ruby class plus an ERB template, precompiled |
| **Phlex** | Pure-Ruby views, no templates at all |

What the research changed in our thinking was the realisation that the substrate is moving, and you want to bet *with* it:

- **ERB is being reinvigorated, not replaced.** [Herb](https://herb-tools.dev) — an HTML-aware ERB parser, linter, formatter and language server — has been adopted by GitHub off the now-archived `erb_lint`, the Rails core team wants it to replace Erubi, and a "ReActionView" engine is on the table. I wrote about what that buys you [last week](/2026/06/24/the-view-layer-rails-couldnt-see.html); the short version is that betting on ERB is betting with the ecosystem.
- **"ERB + Herb" welcomes ViewComponent** — its templates *are* ERB — and **excludes Phlex**, because there is no ERB for Herb to see. So Phlex was out for us on the first cut.
- The real contest, then, was **partials versus ViewComponent** — both ERB, both Herb-native, both proven.

**Why partials won here** comes down to three constraints specific to this codebase:

1. **Portability.** The app is built on `seams`, a generator framework whose engines depend on `rails + thor` *only* and must stay portable. ViewComponent would push a UI-framework dependency into every engine that wanted to invoke a component. Partials add nothing to anyone's dependency surface.
2. **The Herb + RuboCop gate.** Plain ERB partials and helpers keep the *entire* component surface inside the quality gate the team already runs, with no new toolchain to learn.
3. **Onboarding.** A new Rails engineer is productive on day one — they already know partials and helpers. There is no new mental model to absorb before they can ship.

ViewComponent's genuine wins — isolated `render_inline` tests, first-class slots, Lookbook previews — are real, but none of them is load-bearing for us, and [Rails 7.1 strict locals](https://guides.rubyonrails.org/action_view_overview.html) close much of the safety gap they used to own: required and typed parameters, a single compile. And the escape hatch is clean. Partials → ViewComponent is an incremental, per-component migration over the *same* CSS and the *same* class contract, so we are never locked in.

**The verdict:** strict-locals partials and helpers, packaged as a first-party `compositor` engine — the same model GOV.UK runs on internally with `govuk_publishing_components`. Good company for a boring decision.

## The architecture

```
engines/compositor/
  lib/compositor.rb              # the component registry (derived from previews)
  lib/compositor/engine.rb       # non-isolated engine; wires the helper app-wide
  lib/generators/compositor/…    # rails g compositor:component
  app/helpers/compositor_helper.rb           # compositor_icon + the auto-wirer
  app/views/compositor/_*.html.erb           # the components (strict-locals partials)
  app/views/compositor/previews/_*.html.erb  # one preview per public component
  app/views/compositor/guide/index.html.erb  # the living gallery (auto-iterates)
  app/controllers/compositor/guide_controller.rb
  app/assets/stylesheets/compositor.css      # the shipped stylesheet (propshaft)
```

A few of those decisions are worth understanding, because they are what make the rest cheap.

**It's a non-isolated engine.** Most Rails engines call `isolate_namespace`. Compositor deliberately does *not* — its partials and its helper must be available in the host, in `quire_rails`, and in the `seams` engines, so that a component can be invoked anywhere. The engine is picked up automatically by `config/seams_engines.rb` (which loads every `engines/*`), and the helper is mixed in app-wide via a `to_prepare` hook:

```ruby
# lib/compositor/engine.rb
initializer "compositor.helpers" do |app|
  app.config.to_prepare do
    Compositor.reset_component_names!
    CompositorHelper.define_component_helpers!     # see below
    ActionController::Base.helper(CompositorHelper)
  end
end
```

**The partial is the source of truth; the helper is sugar.** A component is a strict-locals ERB partial, and that is the whole of it:

```erb
<%# app/views/compositor/_button.html.erb %>
<%# locals: (variant: :default, size: nil, type: "button", content: nil, **attrs) -%>
<%= tag.button type: type,
      class: class_names("btn", "btn-#{variant}" => variant.to_s != "default",
                         "btn-#{size}" => size.present?),
      **attrs do %><%= content %><% end %>
```

Three conventions do a lot of work in those four lines:

- **Strict locals** (`<%# locals: (…) %>`) make the parameters required and typed and compile the partial once. A missing required local raises, instead of rendering something subtly wrong and shipping it.
- **`**attrs` splatting** onto the root element lets any caller add `id`, `data-*` or `aria-*` without forking the partial.
- **Accessibility is baked into the partial**, not the call site. A caller *can't* forget the `aria-invalid` / `aria-describedby` wiring on a field, because the partial always emits it. The safe thing is the default thing.

**CSS rides along.** `compositor.css` lives in the engine's `app/assets` and is served by propshaft (`stylesheet_link_tag "compositor"`). Because the markup is nothing more than class names, it renders identically in host views (which use Tailwind) and in framework-free engine views. One stylesheet, one contract, no per-context branching.

**Behaviour reaches for the platform first.** The dialog is a native `<dialog>` — focus-trap, `Esc`, and `::backdrop` for free — wired to a six-line Stimulus controller (`compositor-dialog`). Reach for the browser before you reach for JavaScript, and most of the time the browser has already done the hard part.

## The auto-wire conventions: less to maintain

After hand-building the first four components — Button, Tag, Field, Dialog — the *pattern* was clear, and the moment a pattern is clear is the moment to stop repeating it by hand. Two conventions remove the boilerplate before we even scaffold the next one.

**A preview makes a component "public."** Every component ships a preview partial under `previews/`. That preview is the list the rest of the system reads:

```ruby
# lib/compositor.rb — the registry is just the preview filenames
def component_names
  @component_names ||= Dir[previews_root.join("_*.html.erb")]
    .map { |p| File.basename(p).delete_prefix("_").delete_suffix(".html.erb") }
    .sort
end
```

Internal partials — the icon, the sprite — have no preview, so they get no helper and never appear in the guide. Public components are exactly the ones with a preview. The visibility rule *is* the file's existence.

**Helpers are derived, not written.** There is no `compositor_button` method anywhere in the source. One method defines them all from the registry:

```ruby
# app/helpers/compositor_helper.rb
def self.define_component_helpers!
  Compositor.component_names.each do |name|
    define_method("compositor_#{name}") do |**locals, &block|
      locals = locals.merge(content: capture(&block)) if block
      render "compositor/#{name}", **locals
    end
  end
end
```

So `compositor_tag(label: "Ready", status: :ready)` renders `compositor/_tag.html.erb`; a block becomes the `content` local; every other keyword flows straight through, with the extras landing in the partial's `**attrs`. Add a component and its helper simply exists, with zero extra code to write or remember.

**The guide auto-discovers.** The living gallery at `/compositor/guide` iterates the registry and renders each preview. Add a component and it appears — with its helper name and its states — without a single edit to the guide. The docs *cannot* drift from the implementation, because the docs *are* the implementation, rendered. That is the property the original twelve-chapter manual could never have, no matter how carefully it was maintained.

## When boilerplate earns a tool

With those conventions in place, adding a component is two files in lockstep — a partial and a preview — which is exactly the shape a generator is for. We waited until the pattern was proven (the rule of three; we had done four) before building the tool, so it codifies a *stable* convention rather than chasing a moving target.

```
$ rails g compositor:component badge
      create  engines/compositor/app/views/compositor/_badge.html.erb
      create  engines/compositor/app/views/compositor/previews/_badge.html.erb

  compositor:component badge scaffolded.
  1. Build the markup … using compositor.css classes; bake in accessibility.
  2. Show its states in previews/_badge.html.erb
  3. compositor_badge is now callable in every view; see /compositor/guide.
```

The generated partial already carries the strict-locals header, the `**attrs` splat, and an accessibility reminder. The generator scaffolds the *skeleton and the conventions* — it does not design the component; the markup is still hand-authored against `compositor.css`. It kills boilerplate and drift, not design effort. And it is idiomatic to the stack: `seams` generates engines, Compositor generates components.

## The fan-out, and how it's verified

Once the four-component slice had proved the pattern and the generator and auto-wiring were in place, the rest of the library was fanned out in parallel — eighteen more components (card, panel, note, empty, switch, checkbox, radio, input group, counter, segmented, meter, toast, banner, pagination, kbd, save-state, stepper, menu) authored against `compositor.css` at once. **Twenty-two components** now ship.

That fan-out is exactly where the gates earn their keep. The parallel authors introduced two real bugs, and each was caught by a gate, not by luck:

- **`bin/herb lint`** over the engine partials flagged a string interpolation in the counter — `"#{current} / #{max}"` — that its `erb-prefer-direct-output` rule wants as separate `<%= %>` tags. Plain ERB means Herb sees *everything*; a DSL would have hidden it.
- **A render pass over every preview** — `Compositor.component_names.each { render … }` — surfaced two components calling `compositor_icon(name: …)` with a keyword when the helper takes the name positionally. A two-line fix, found in a single pass.

After the fixes: **22 components, 0 render failures, Herb clean across 48 files, the guide returns 200 with all 22 sections, and the integration test is green.** Every layer has a gate, and the whole thing boots with the engine auto-loaded, the helpers resolving in a real view context, and propshaft serving the stylesheet. The point of the gates is not that they are elaborate — it is that a careless parallel fan-out still landed clean, because nothing was allowed to merge without passing through them.

## Gotchas worth keeping

- **Don't put `.dialog` on the native `<dialog>` element.** `.dialog` sets `display: flex`, which overrides the browser's `dialog:not([open]) { display: none }` and leaves the modal showing when it should be closed. The fix is a transparent `.cdialog` wrapper element with the `.dialog` panel *inside* it. Found by looking at the render, not the code — which is its own small lesson.
- **A duplicated stylesheet is a latent drift.** For a while `compositor.css` existed twice — the written manual's copy and the engine's shipped copy. The engine's is canonical; folding them together so there is exactly one stylesheet removes the only place the system could still quietly disagree with itself.
- **Strict locals + `**attrs` is the load-bearing pairing.** It is what lets one auto-wired helper drive every component uniformly while still allowing arbitrary pass-through attributes. Lose either half and the whole "one helper, every component" trick stops working.

## Adding a component, the whole recipe

1. `rails g compositor:component <name>`.
2. Build the partial from `compositor.css` classes; bake in accessibility; splat `**attrs` onto the root.
3. Show every state in the preview.
4. If it needs behaviour, add a `compositor-*` Stimulus controller — and prefer native elements first.
5. Run `bin/herb lint` and the guide; add focused assertions if it has non-trivial accessibility.

`compositor_<name>` exists the moment the preview does. It shows up in the guide automatically. There is no step where you wire a helper or edit the gallery, because those steps were designed out.

## Why this is the right shape

The thread running through every decision is the same: **stay inside the grain of the codebase you actually have.** `seams` is minimal and generator-driven, so Compositor is a generator-driven engine with no new dependency. The quality gate is ERB-aware, so Compositor is plain ERB. The team values fast onboarding, so a new engineer needs zero new concepts. And the ecosystem is investing in ERB, so the bet ages well rather than badly.

A design system earns sign-off when it stops being a description and becomes a thing you call. That is what this is: one source of truth per component, invoked by name, accessible by default, impossible to drift from its docs — and cheap enough to extend that there is no longer any excuse to hand-roll a button, ever again.

---

*This is drawn from a production Rails engine: a first-party `compositor` engine built on the `seams` generator framework, shipping 22 strict-locals components behind an auto-wired helper and a self-discovering guide, gated by Herb and a render pass over every preview. The view-layer tooling it leans on is the subject of [the previous notebook entry](/2026/06/24/the-view-layer-rails-couldnt-see.html).*

*If you want the longer story on building Rails applications that stay maintainable as they grow — boundaries, engines, testing, and honest trade-offs — that is what [Modular Rails: Architecture for the Long Game](/modular-rails/) covers in depth. [Read it free on the web](/books/modular-rails/), or get the [paperback](https://www.amazon.com/dp/1066649405) ([UK](https://www.amazon.co.uk/dp/1066649405)).*
