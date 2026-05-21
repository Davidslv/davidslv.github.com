---
layout: post
title: "Spec is the Artefact"
date: 2026-05-22
---

A passing test tells you the implementation is correct. The second-order question — was the work behind this code the work we meant to do — is the one [comprehension debt](https://davidslv.uk/2026/05/17/comprehension-debt.html) and [the perception gap](https://davidslv.uk/2026/05/21/the-perception-gap.html) have both been circling. This post is the third leg.

The argument of the first two posts was diagnostic. Teams using AI-assisted code accrue a gap between what exists in the codebase and what anyone on the team understands; the mechanism that hides the gap from inside is a perception failure on both sides of the review. Neither post offered a remedy. The closing of the second one promised this one would.

There are several remedies that would be defensible at this point — more local architecture, mentor-model review, a financial reframing of the conversation with leadership. They are all real moves. The argument here is for the one I have found most leverage in: change what the primary artefact is.

## The wrong primary artefact

The implicit model for most code review, AI-assisted or not, is that code is the artefact. The author produces it. The reviewer evaluates it. Tests guard it. CI signs off on it. Everything is oriented to the diff.

This worked, more or less, when the human writing the code carried the intent in their head. Code was a lossy projection of intent, and the reviewer could partially reconstruct the projection because both author and reviewer had been trained to read code as if it spoke for the work behind it. The PR description filled in what the code didn't say.

When the AI produces the code, the human author no longer carries the intent in the same way. The intent was in the prompt, in the chat session, in the back-and-forth — most of it gone by the time the diff lands in the reviewer's queue. What remains is what the [previous post called an *appearance signal*](https://davidslv.uk/2026/05/21/the-perception-gap.html) — visible enough to be trusted, opaque about whether the work behind it cohered. It looks like the work has been done. It cannot be inspected to confirm the work was done.

The PR description is in the same category. A thoughtful PR description is the human side of a structured reasoning trace. The reviewer is now holding two appearance signals and no ground truth.

## Spec is the artefact

The structural move that follows is small and unfashionable. Stop treating the code as the primary artefact. Treat the *specification* as the primary artefact — the contract the implementation is meant to honour, written by a human before the AI touches anything. Code becomes implementation detail. Review becomes verification against the contract.

The framing has a forty-year lineage. Bertrand Meyer's [*Applying Design by Contract*](https://se.inf.ethz.ch/~meyer/publications/computer/contract.pdf) (IEEE Computer, 1992) made the same structural argument for Eiffel: a routine is the contract it promises to honour, the implementation is detail. What is new is what the cost of skipping the contract has become. Under human authoring, the cost was future debugging. Under AI authoring, the cost is that the reviewer cannot tell whether the work was done at all.

The current vocabulary is **Spec-Driven Development**, the framing The Serious CTO uses in [the talk](https://www.youtube.com/watch?v=3o2SlgX9BhE) this trilogy has drawn vocabulary from. GitHub's [Spec Kit](https://github.com/github/spec-kit) calls the same thing a *project constitution*: non-negotiable principles around code quality, testing, user experience, and performance, baked in before generation begins. Caporusso & Perdue ([ISCAP 2025](https://iscap.us/proceedings/2025/pdf/6416.pdf)) compared direct prompting against requirements-first prompting across seven LLMs and found that structured requirements improved code quality — early empirical support for a move whose case is still mostly programmatic.

The point is not new tooling. The point is that the artefact a reviewer is asked to evaluate now sits above the code, in a layer the human author still authored. The author still carries intent — into the spec, where it is durable, rather than into the chat session, where it is not.

## Why this compresses the perception gap

The perception gap was structural. Author and reviewer held different artefacts in working memory. The author held the description, the boundaries, the tests they wrote. The reviewer held the diff. Neither could feel what they were costing the other.

When the spec is the artefact, this asymmetry compresses. The author and the reviewer are both oriented to the same object — the contract. The author wrote it; the reviewer is evaluating whether the implementation honours it. The cognitive load on the reviewer is bounded by spec size, not diff size. An eighteen-hundred-line implementation of a one-page spec is reviewable in a way an eighteen-hundred-line diff with a thoughtful description is not.

This also removes the silent disagreement about what *the work* is. The author and the reviewer can disagree about whether the implementation honours the contract — that is a productive disagreement, scoped to a shared artefact. The perception gap depended on them disagreeing about what the work had been at all.

## What this looks like in practice

"Spec" is doing several jobs at once here, and it is worth being honest about it. Some specs are prose contracts a human writes out in English. Some are executable. Some are inferred from a type system. Each lives at a different level of formality. What they share, under AI authoring, is that they are independently checkable artefacts of intent — the only parts of the loop that are not appearance-of-thought signals.

In a Ruby codebase, the move is mostly elevating instruments the team already has.

- **RSpec and the discipline behind it.** A well-written test is a spec of behaviour at the granularity the team has chosen. The shift is in workflow order — write the contract as a test before the AI drafts the implementation, then accept the implementation only when it honours the test. This is TDD without nostalgia; it works at LLM speed because the spec lives somewhere the AI cannot edit during generation.
- **Property-based testing.** [Claessen & Hughes (2000)](https://dl.acm.org/doi/10.1145/351240.351266) framed properties as specifications of permitted output shapes — the implementation is graded by random sampling against the property, not by the cases the author happened to enumerate. Where example-based tests check the cases you remembered, property tests check the cases the AI might have missed.
- **Consumer-driven contracts at service boundaries.** [Ian Robinson's 2006 framing](https://martinfowler.com/articles/consumerDrivenContracts.html) — and twenty years of Pact in production — capture exactly the property contracts need to have under AI authoring: durable, executable, and owned by both sides. A boundary contract is a spec the implementation cannot edit on its way through.
- **Architectural decision records.** [Michael Nygard's 2011 piece](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) already named the problem the trilogy is circling: *"one of the hardest things to track during the life of a project is the motivation behind certain decisions."* An ADR is the spec for the next change, written by the team that owns the consequences.
- **Type systems where you have them.** Sorbet and RBS in Ruby, or static typing in any other language, are specs the compiler verifies for free. Mündler et al. ([PLDI 2025](https://arxiv.org/abs/2504.09246)) found that in TypeScript, 94% of compilation errors in LLM-generated code are type-check failures — useful evidence that the instrument pays off where it exists, and a useful caution that dynamic languages do not get this protection for free and have to recover the discipline elsewhere.

None of these are new. What is new is the framing. Under code-as-artefact, these instruments are quality-of-life. Under spec-as-artefact, they are structurally load-bearing — they are the parts of the loop that intent is durable in.

## What this doesn't fix

The obvious objection is that the AI will draft the spec too, and the perception gap re-enters one layer up. The objection is real. Zietsman ([2026](https://arxiv.org/abs/2603.25773)) calls this the correlated-failure problem: without an external reference, the generating agent and the reviewing agent share the same training distribution, and "the review checks code against itself, not against intent."

The defence is that a specification a human authored — even one the AI drafted and the human pruned — sits in a different cognitive position than code the human glanced at. The specs worth keeping are the ones the author can answer questions about. That discipline is exactly what the previous post called comprehension, surfaced one layer up.

The honest counter is that the same deadline pressure that produced comprehension debt will erode spec-first discipline too. Kuutila et al.'s [systematic review of time pressure in software engineering](https://arxiv.org/abs/1901.05771) found that quality assurance is the practice that bends first under load — and spec-first work is QA upstream of itself. The argument is not that spec-first survives the pressure without institutional support. It is that under spec-first, the practice that bends first is visible, named, and budgetable.

## The trilogy

I have started writing specs first on the work I review. I have not finished. The discipline is harder than the writing it replaces, because it forces decisions I was making by inference earlier — what is in scope, what is out of scope, what counts as success. The work surfaces.

Three sentences for the trilogy. Comprehension debt is what AI-assisted teams accrue when generation outruns understanding. The perception gap is what hides the debt from inside the team. The structural response is to move the artefact one layer up — to write the contract first, and to commit to keeping it there.

This is one shape of answer. There are others; the architectural ones and the financial ones are both real. I have argued for this one because it makes the smallest change to the workflow and the largest change to what is being reviewed. The discipline is fragile. It is also the only one I have found that compresses the gap.

---

*Series: [Comprehension Debt](https://davidslv.uk/2026/05/17/comprehension-debt.html) · [The Perception Gap](https://davidslv.uk/2026/05/21/the-perception-gap.html) · Spec is the Artefact (this post).*

*Sources: [Meyer — Applying Design by Contract (IEEE Computer, 1992)](https://se.inf.ethz.ch/~meyer/publications/computer/contract.pdf) · [Mündler et al. — Type-Constrained Code Generation with Language Models (PLDI 2025)](https://arxiv.org/abs/2504.09246) · [Caporusso & Perdue — ISCAP 2025](https://iscap.us/proceedings/2025/pdf/6416.pdf) · [Claessen & Hughes — QuickCheck (ICFP 2000)](https://dl.acm.org/doi/10.1145/351240.351266) · [Robinson — Consumer-Driven Contracts (2006)](https://martinfowler.com/articles/consumerDrivenContracts.html) · [Nygard — Documenting Architecture Decisions (2011)](https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions) · [Zietsman — The Specification as Quality Gate (2026)](https://arxiv.org/abs/2603.25773) · [Kuutila et al. — Time Pressure in Software Engineering (2020)](https://arxiv.org/abs/1901.05771) · GitHub's [Spec Kit](https://github.com/github/spec-kit). Vocabulary from The Serious CTO's video on [the hidden cost of AI coding](https://www.youtube.com/watch?v=3o2SlgX9BhE).*
