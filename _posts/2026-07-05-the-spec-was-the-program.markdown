---
layout: post
title:  "The Spec Was the Program"
date:   2026-07-05
series: engineers-notebook
series_order: 11
description: "I read a real codebase, wrote a specification, and handed it cold to two AI agents in sealed rooms — one building in Ruby, one in Rust, both test-first. They finished within nine seconds of each other. Then I diffed their output and found something worth writing down: they agreed on everything I had specified exactly, and disagreed only where I hadn't."
image: /img/og-default.png
---

Here is an uncomfortable question for anyone who writes specifications: if you handed
the same spec to two competent engineers who had never met, working in two different
languages, in two sealed rooms — how close would their programs actually land? Not
"roughly the same feature set." I mean: would they produce the *same behaviour*, byte
for byte, on the same input?

Most of us have never run that experiment, because it's expensive. You need two
engineers, two languages, real isolation, and a way to compare the results that isn't
just "looks fine to me." Last week I ran it in about half an hour, for the price of
some tokens, and the result taught me more about my own specification than about
either language.

## The setup

I'd spent an afternoon reading a **code-context engine** — the kind of local tool that
indexes a repository so an AI coding assistant can *search* for the handful of relevant
functions instead of re-reading whole files. Index the repo, chunk each file into
functions and classes along its syntax tree, embed each chunk into a vector, and answer
a query with a hybrid of vector similarity and keyword search. It's a genuinely useful
piece of engineering, and once I understood it I wanted to know how much of it was
*essential* and how much was Python-the-language.

So I wrote a specification. Not a sketch — a **normative** one. Exact constants. The
precise tokeniser, down to which bytes count as word characters. The chunk-ID hash
(`SHA-256` of `path:start:end:` plus the first hundred bytes of content, first sixteen
hex digits). A deterministic embedding function built on `FNV-1a` hashing, so it needed
no model and would produce identical vectors on any machine. The BM25 formula with
`k1 = 1.2`, `b = 0.75`, and the Lucene form of IDF. Reciprocal Rank Fusion with
`k = 60`. The confidence blend, the path penalty, the per-file diversity cap. I even
pinned a tiny fixture corpus and three queries, and demanded each implementation emit a
`conformance.json` describing exactly what it chunked and ranked.

Why so exact? Because I wanted the two implementations to be *comparable*. If the maths
is pinned, then two correct programs must produce identical numbers, and any difference
is a signal. Vagueness would have made the experiment unfalsifiable — "well, they're
both kind of a search engine" proves nothing.

Then I set the two rooms. One agent would build in **Ruby**, one in **Rust**. Each got
the specification and nothing else. The rules were blunt: implement from the spec only,
never look at the original, never look at each other, work test-first, document every
file, benchmark the result. The spec file itself lived inside each agent's working
directory — it was part of the deliverable, their single source of truth.

I pressed go on both and waited.

## Two builds, twenty-five minutes

They came back within nine seconds of one another. The Ruby agent took 25 minutes and
9 seconds; the Rust agent, 25 minutes flat. I hadn't asked them to race, and the near
tie is almost certainly coincidence, but it's a pleasing one.

|                        | Ruby                         | Rust                          |
|------------------------|------------------------------|-------------------------------|
| Wall-clock build       | 25m 09s                      | 25m 00s                       |
| Tests (test-first)     | 84                           | 60                            |
| Line coverage          | 94%                          | 87%                           |
| Parser                 | `ruby_tree_sitter`           | `tree-sitter` crates          |
| Storage                | SQLite                       | JSON on disk                  |
| Query latency (p50)    | 24.5 ms                      | **0.62 ms**                   |
| Index throughput       | ~2,300 chunks/s              | ~14,500 chunks/s              |

Both were real programs: a working command-line tool, a persisted index you could
build in one process and query in another, benchmarks against a pinned copy of Flask,
and — because I'd insisted — a header on every single file explaining why it existed and
what it was responsible for. Both practised the red-green-refactor loop I'd asked for
and kept a log of it. Neither asked me a single question; where the spec was ambiguous,
each made a decision, wrote it into a `DECISIONS.md`, and carried on. That habit turns
out to matter enormously, and I'll come back to it.

The performance columns are the obvious story, and the boring one. Rust answers queries
roughly forty times faster and indexes about six times faster. Of course it does; it's
compiled, and the hot loop of this system — parsing files and multiplying vectors — is
exactly the kind of CPU-bound work where that gap shows up. It's real, it's worth
knowing, and it's *orthogonal to correctness*. It's not the thing I want to write about.

## The moment of truth

The thing I want to write about is what happened when I diffed the two
`conformance.json` files.

The fixture is three files: a little `auth.py` with two functions and a class, a
`payments.py` with two functions, and a `README.md` that isn't code and falls back to a
whole-file chunk. Seven chunks in total. Each implementation, independently, from my
prose, had to parse those files, hash the chunks, embed them, and rank them against
three queries.

**All six code chunks — every function and the class — had byte-identical IDs across
Ruby and Rust.** Same `SHA-256` inputs, therefore same sixteen hex digits. The
tokenisers agreed. The syntax-tree walk agreed on where each function began and ended.
Every query's top result was identical. Every score matched to six decimal places. Two
programs, written in two languages by two agents that never communicated, agreed to the
last bit on the part of the system I had specified precisely.

And then, one difference. Exactly one.

The `README.md` fallback chunk had a different ID in each. Ruby said it ended on line 3;
Rust said line 2. That flipped its hash, and because I'd made the chunk ID the
tie-breaker for equal-scoring results, it quietly permuted the order of three
low-relevance chunks near the bottom of each result list.

## The autopsy

Here's the part worth the whole experiment. I went looking for the bug, fully expecting
to find that one of the agents had been sloppy. Neither had.

The `README.md` files were byte-identical — 45 bytes, both ending in a newline. My spec
said the fallback chunk's `end_line` should be "the number of lines." A file whose last
character is a newline is, depending on how you count, either two lines or three. Ruby
counted the newlines and added one, and got three. Rust used its standard library's
line iterator, which doesn't yield a trailing empty line, and got two. **Both are
correct. My specification was not.** I had written an ambiguity and never noticed,
because in my head "number of lines" was obvious, and it simply isn't.

There was a second one, subtler, in the benchmark. I'd written "index the repository's
Python sources," and the two agents scoped that differently — one indexed more of the
tree than the other — which is why their token-savings numbers diverged (81% versus
90%) while their recall came out identical. Same hole, same class of defect: a sentence
I thought was precise and wasn't.

Two independent implementations, built to converge, had converged *exactly to the
precision of my spec* — and every place they diverged was a place where I had left a
hole. The agents didn't disagree with each other. They disagreed with the parts of my
writing that didn't actually say anything.

## What I actually learned

A specification is a program. You write it in English instead of Ruby or Rust, and its
bugs aren't crashes — they're ambiguities, sentences with more than one valid reading.
The trouble is that ambiguity is nearly invisible to the author, because the author
already knows which reading they meant. You can stare at "the number of lines" all day
and never see the fork in it.

What this experiment gave me is a way to *make ambiguity visible*: build the same spec
twice, in two different languages, independently, and diff the results. Two diverse
implementations are a **differential tester for your specification.** Where they agree,
you specified well. Where they disagree, you have a sentence to fix — and you get handed
the exact sentence, not a vague sense that something's off. The `DECISIONS.md` files
each agent kept were the other half of it: every divergence had a paper trail leading
straight back to the clause that caused it.

Two things made the signal clean rather than noisy, and both were choices in the spec
rather than the code. **Determinism**: because I'd specified a hashing embedder with no
model and pinned every constant, "identical behaviour" was a testable claim and not a
hand-wave — floating-point noise couldn't hide a real difference, and a real difference
couldn't hide in floating-point noise. **Test-first**: because both agents pinned the
spec's anchor values in tests before writing the code — the published `FNV-1a` vectors,
a BM25 example I'd worked out by hand — the maths was nailed down early, so the only
thing left to diverge was the handful of places I'd genuinely under-specified.

I fully expected the interesting finding to be Ruby-versus-Rust: which is faster, which
is nicer, which I'd reach for. That comparison exists, and Rust wins the benchmark
exactly as everyone would predict. But it wasn't the lesson. The lesson was that the two
languages were never really the variable under test. **The spec was.** Two agents held a
mirror up to my writing and showed me, to the line, the two places I'd been vague — and
they did it in the time it takes to drink a coffee, for the cost of the tokens to build
two programs I then threw away.

I'll take that trade. The programs were disposable. The two sentences I fixed weren't.
