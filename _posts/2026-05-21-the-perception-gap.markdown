---
layout: post
title: "The Perception Gap"
date: 2026-05-21
---

An engineer opens a pull request. It is eighteen hundred lines across roughly fifteen files. The description has the kind of structure you write when you mean it — what changed, why, what you would push back on if you were the reviewer. They have thought about it. They feel organised. They are organised, from where they're sitting.

The reviewer opens it and is being asked to evaluate two or three architectural decisions and several new features in one sitting. The diff is too large to hold in working memory. The PR description helps, but only at the level it summarises — the line-by-line judgement is still on the reviewer. They are also organised, in the way the work has arrived at their desk.

Both of them are right about how organised they are. Neither of them is in a position to feel what they are costing the other.

This is the perception gap. It runs through teams building seriously with AI-assisted code, and from inside it is hard to see.

## What the research says

In a 2025 study by [METR](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/), sixteen experienced open-source developers were timed on 246 real tasks. They predicted AI would speed them up by 24%. It slowed them down by 19%. After the slowdown was measured, they still reported feeling 20% faster.

The sample is small and the headline slowdown finding is contested — METR themselves [posted an update in early 2026](https://metr.org/blog/2026-02-24-uplift-update/) acknowledging selection-bias problems that may mean their numbers underestimate AI speedup. What the update doesn't undermine is the *perception* finding: a 39-point gap between what developers reported feeling after the experiment and what was measured during it. Developers who had just been timed being slower still believed they had been faster.

The interesting finding is not the slowdown itself. The interesting finding is that the developers could not perceive it. This is a calibration problem of a familiar shape — the literature on self-assessment is decades old — with a new accelerant. The feedback loop that would ordinarily tell an experienced engineer "you should adjust how you're working" was gone.

## It doesn't stop at the developer

The METR study measured solo developers on tasks. The same shape extends past the solo case in a way the study didn't measure: the perception gap operates not just within a single developer using AI, but between the AI-assisted *author* and the human *reviewer*.

I have spent recent sprints on the receiving end of this. A single AI-assisted author on one of the codebases I review put up tens of thousands of net lines in a fortnight, across PRs whose individual diffs comfortably exceeded the eighteen hundred lines I opened with. The PRs were thoughtful: tight commit messages, sensible scoping, descriptions that named what changed. The volume was not reviewable at human pace. What I felt as a reviewer — that I was perpetually catching up, that the diff was always larger than the attention I could supply — is the same shape the METR developers reported on themselves, only viewed from the other side of the keyboard.

The author writes a thoughtful PR. They feel organised because they are organised — by the description they wrote, by the boundaries they named, by the tests they added. The artefacts of their thinking are visible to them. What is not visible to them is the cognitive cost of the whole change held in the reviewer's head at the same time.

The reviewer experiences something else. The description helps but does not substitute. Two-or-three architectural decisions plus several new features in one diff is a working-memory load no amount of structure in the PR body resolves. The reviewer is not lazy, not slow, not failing — the diff is simply asking for a kind of attention the human reviewer cannot supply at the rate the PR was assembled.

Both authors and reviewers are honest about their experience. Neither has the feedback that would let them correct the other. The author keeps shipping at one rate, the reviewer keeps absorbing at theirs, the mismatch compounds across every PR until something visible breaks.

## Where the cost shows up

The cost is real. It appears in places leaders aren't watching closely.

The [2024 DORA report](https://dora.dev/research/2024/dora-report/) found that a 25% increase in AI adoption corresponded with a 7.2% decrease in delivery stability and a 1.5% decrease in throughput. Independent industry telemetry from Faros AI, sampling ten thousand-plus developers across more than a thousand teams, puts the throughput side of the same picture in starker terms: high-AI-adoption teams merging substantially more pull requests while code review time goes up. The dashboards leaders watch for "AI is working" — PR volume, individual velocity — were green. The dashboard for whether the system itself was holding together was quietly drifting in the other direction.

[Veracode's 2025 GenAI Code Security Report](https://www.veracode.com/blog/genai-code-security-report/) tested over 100 large language models against 80 code-completion tasks designed to surface OWASP Top 10 vulnerabilities. 45% of the generated code contained security flaws. AI failed to defend against cross-site scripting in 86% of relevant samples. Java fared worst, at a 72% security failure rate.

[GitClear's analysis](https://www.gitclear.com/ai_assistant_code_quality_2025_research) of 211 million lines of code found that 2024 was the first year on record where copy-pasted code exceeded refactored code. Duplicated code blocks of five or more lines rose roughly eightfold over the year, while moved code fell from around a quarter of all changes in 2021 to under 10% in 2024. The code was growing faster than it was being shaped.

The pattern isn't only on the human side. Apple's [Illusion of Thinking](https://machinelearning.apple.com/research/illusion-of-thinking) (2025) found that large reasoning models reduce their reasoning effort as problem complexity grows past a threshold, despite having token budget to spare — and raised the question of whether the visible reasoning trace reflects reasoning or its appearance. (The headline accuracy-collapse finding has been [contested](https://arxiv.org/abs/2506.09250) on methodology grounds; the effort-decline result is the part the critique didn't touch.) The author's structured PR description and the model's structured reasoning trace are artefacts of the same kind — visible enough to be trusted, opaque about whether the work behind them held. The reviewer is downstream of both.

Three independent sources, three different facets — throughput, security, code shape — all measuring outcomes consistent with a perception gap.

The pattern that ties them together is what I called [comprehension debt](https://davidslv.uk/2026/05/17/comprehension-debt.html) in the previous post: the gap between how much code exists in your system and how much of it any human actually understands. If the perception gap is the *mechanism*, comprehension debt is the *form* it takes. The author shipped code, the reviewer approved it, the dashboards stayed green — and at the end of all that, fewer people on the team can explain what the system is doing than before.

## What to do about it

I am in the vignette above. The reviewer is me as often as the author is, and both seats are familiar. When AI has sped up my own work, the speed-up has felt real. So has the cost on the other side of my own multi-thousand-line PRs. Both kinds of experience happened to the same engineer. Neither corrected the other in time to change the next one.

The dashboards leaders look at are not pointed at this. PR volume, individual velocity, lead time — none of them measure the cognitive split between the two sides of a review, or the fraction of last quarter's shipped code anyone on the team could explain at 2am without opening the file. There is no automated way to measure that second number; it requires asking, which is part of why it doesn't get measured.

A question worth taking to your team this week, then. Look at the last three large pull requests you approved. Without re-reading the diff, can you re-derive why the architectural decisions in each had to go that way? If the answer is no for two of them, the perception gap is already operating in your codebase, and your dashboards haven't told you. The structural response is the subject of the next post.

---

*Data drawn from: [METR — Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity (2025)](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/) and [METR's Feb 2026 design update](https://metr.org/blog/2026-02-24-uplift-update/) · [DORA — Accelerate State of DevOps Report 2024](https://dora.dev/research/2024/dora-report/) · [Veracode — 2025 GenAI Code Security Report](https://www.veracode.com/blog/genai-code-security-report/) · [GitClear — AI Copilot Code Quality 2025 Research](https://www.gitclear.com/ai_assistant_code_quality_2025_research) · [Apple — The Illusion of Thinking (2025)](https://machinelearning.apple.com/research/illusion-of-thinking).*

*Vocabulary from The Serious CTO's videos on [AI killing code review](https://www.youtube.com/watch?v=fFIjrtH6qjc), [where developer time actually goes](https://www.youtube.com/watch?v=fvqD83ffMnw), and [the hidden cost of AI coding](https://www.youtube.com/watch?v=3o2SlgX9BhE).*
