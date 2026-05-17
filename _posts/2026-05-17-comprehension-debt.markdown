---
layout: post
title: "Comprehension Debt"
date: 2026-05-17
---

> "You're not a developer anymore. You're a reviewer of code you don't understand."

That line is from [The Serious CTO](https://www.youtube.com/@TheSeriousCTO), and it named something I'd been feeling but didn't have words for. The shape of the work has changed. The volume of code that gets generated, reviewed, and shipped has decoupled from the volume of code any human actually holds in their head. There's a debt accruing in that gap, and we don't track it.

He calls it **comprehension debt** — the difference between how much code exists in your system and how much of it anyone on the team could explain at 2am.

I want to make the case that this is the most important kind of debt our industry has accumulated in the past two years, and that nothing in the standard toolkit measures it.

## It's not technical debt

Ward Cunningham coined "technical debt" in 1992 to describe a deliberate trade. You take a shortcut, you know you took it, you plan to pay it back. The transaction was between an engineer and the future engineer who would inherit the code. Both were assumed to be humans, and both were assumed to remember why.

Comprehension debt is different in three ways.

It isn't deliberate. Nobody chooses to ship code they don't understand. It happens because the AI generated 600 lines, the spec was implicit in the conversation, the conversation is gone, and the tests pass. The trade was never on the table to refuse.

It isn't local. Technical debt usually sits in a specific module you can point at. Comprehension debt is distributed across thousands of small decisions, each one defensible, none of them remembered. The total is much larger than any of its parts.

And it doesn't show up in any dashboard, which is the part I want to spend a moment on.

## What the dashboards measure

Look at any modern engineering analytics platform and you'll see roughly the same vocabulary. **DORA metrics** — lead time for changes, deployment frequency, change failure rate, mean time to recovery. **Flow metrics** — cycle time, work-in-progress, throughput. And now, increasingly, **AI Impact metrics** — suggestion acceptance rate, percentage of PRs assisted by AI, generated lines per engineer per week. The pitch is the one I keep seeing in the marketing copy: actionable engineering insight across DORA, Flow, AI Impact, and more. Turn engineering insights into predictable outcomes.

These are useful. I look at DORA numbers regularly and I'd argue every team should. They are also, all of them, measurements of motion.

Lead time tells you how fast work moves through the pipeline. Deployment frequency tells you how often it ships. Change failure rate and MTTR tell you what fraction breaks and how fast you recover. Cycle time tells you how long an item sat in flight. AI acceptance rate tells you how often a generated suggestion was kept.

None of them ask the question that matters here: *of the code we shipped last quarter, what percentage could any member of the team explain right now, without opening the file?*

That number doesn't have a name yet. The "AI Impact" category got close — it noticed AI was changing something about engineering and tried to put a measurement on it — but the things it measures are still adoption and volume, not comprehension. Acceptance rate doesn't care whether the engineer who accepted the suggestion understood it. Lines-per-engineer doesn't care whether anyone could narrate those lines six weeks later.

So the lagging-indicator failure mode is precisely what you'd expect. DORA numbers stay green right up until they don't, at which point the debt has already compounded across every change that touched anything near the broken thing. The dashboards eventually notice, but only via the breakage. By then you're not measuring comprehension — you're measuring its absence.

## The standard answers don't measure understanding

This is the part I want to be honest about, because every senior engineer reading this has the same instinct I had: surely more review, more linting, more tests, more automation catches this. They don't, and it's worth being precise about why.

**Code review measures "looks reasonable"**, which is approximately the same problem as the code itself — a human skimming a diff, deciding whether it pattern-matches against something they'd write. It doesn't ask whether anyone could explain *why* this code exists, or what would have to change in the world to make it wrong. The failure mode has a name now: LGTM syndrome. The data backs it up. High-AI-adoption teams in the recent DORA report are merging 98% more PRs while review time goes up 91%. We're rubber-stamping more, faster.

**Linters and type-checkers measure syntax, not intent.** They will tell you the function returns a string. They will not tell you whether the string represents the thing the caller assumed it represented. TypeScript catches an enormous fraction of LLM errors that are *type-check failures*, which is real value, but the errors that matter are the ones that compile.

**Tests measure observed behaviour at the point of writing.** They are a memory of the assumptions that were live when the test was written. When the assumptions change — and they do, constantly, in any product still being shaped — the tests pass and the meaning quietly diverges. Tests are necessary infrastructure. They are not a measurement of comprehension.

**"Future AI will refactor it"** is the most seductive answer and the one most worth refuting. AI can refactor syntax. It cannot refactor meaning it never had. If no human ever understood why a piece of code is the way it is, the AI cleaning it up is doing the same thing the AI that wrote it did — pattern-matching against training data, producing something plausible, hoping the tests pass. You're not paying down the debt. You're laundering it.

## What it looks like when it's compounding

The shape is familiar once you start looking for it.

A field gets added to a model. Six months later nobody can quite explain what it's for, but removing it breaks four jobs. The PR that introduced it was approved, the tests passed, the issue is closed. The "why" exists in nobody's head.

A controller has three early-return branches that each handle a "subtle case". The cases were real when the code was written. Whether they're still real is unclear, and checking would require reconstructing a conversation that happened in a chat session that's now gone.

A 2am incident lands and the person on call can read the trace but can't narrate the code that produced it. The original author, if there even was a single one, is the model that generated it. The graceful degradation everyone hoped for at the architecture stage requires understanding that no longer exists in the team.

None of these are individually catastrophic. Collectively they're the new shape of legacy systems, and we're building them at a rate previous generations of engineers couldn't have imagined.

## A field-level note

I've been building static-analysis and review tooling on a real Rails codebase for a while now. Custom linters, date-gated style rules, multi-agent PR review with worktree isolation, the works. Each layer was a response to something concrete. Each one helps. None of them measure comprehension. That's not a criticism of the tools — they were never trying to. It's a recognition that the thing I'm trying to defend against doesn't yet have a measurement, which means it doesn't yet have a budget, which means it grows.

## What I want to ask

This is the open part, because I genuinely don't know.

What would a codebase look like that *actively* maintained comprehension? Not after the fact, via documentation written under deadline, but as a continuous property the team owned.

What would the measurement be? A coverage metric for "any team member can describe this module within five minutes"? A required-reviewer rule that says the reviewer has to be able to *teach* the change, not just approve it? A spec-first workflow where the human writes the contract and the AI generates the implementation, so review is "does this honour the contract?" rather than "does this code look correct?"

I have partial answers and I'm not confident in any of them. What I am confident in is that the response to comprehension debt cannot be more of the same review, more of the same linters, more of the same hope. Whatever the answer is, it has to measure something we are not currently measuring.

If you're seeing this too, I'd genuinely like to hear what you're trying. The vocabulary exists now. The next part is figuring out what to do with it.

---

*Further viewing: The Serious CTO's videos on [AI killing code review](https://www.youtube.com/watch?v=fFIjrtH6qjc), [where developer time actually goes](https://www.youtube.com/watch?v=fvqD83ffMnw), and [the hidden cost of AI coding](https://www.youtube.com/watch?v=3o2SlgX9BhE) are where the comprehension-debt vocabulary comes from, and they're worth your time.*
