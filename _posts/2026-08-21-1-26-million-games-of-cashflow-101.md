---
layout: post
title:  "1.26 million games of Cashflow 101"
date:   2026-08-21
description: "I simulated 1.26 million games of Cashflow 101. Luck moves the result 2.8 times as far as skill. The janitor beats the doctor because the finish line is smaller, not because low expenses are virtue."
image: /img/og-1-26-million-games-of-cashflow-101.png
---

Cashflow 101 is the board game that sold a generation of people on the idea that
the janitor retires before the doctor. Robert Kiyosaki's *Rich Dad Poor Dad*
lesson, turned into cardboard: buy assets, watch passive income cross expenses,
escape the Rat Race. The box says it is a game of decisions.

I wanted to know whether that was true. There is no ROM to disassemble. I
took the board and the deal decks from one fan implementation, the profession
cards from a second, and cross-checked the professions against a third. Then
I wrote a deterministic simulator and ran it.

**1,260,000 games later, the deck moves the result about 2.8 times as far as
the player does.** On identical cards, the best player I could find beats a
merely enthusiastic one less than half the time, for a median gain of zero
turns.

The shuffle, the dice and the opponents sit on separate seeds, so two
policies can play the same deck. The difference is then the decisions.

## Luck versus skill

Hold the best player I found perfectly fixed and change nothing but the seed:

| percentile | turns to escape |
|---|---|
| p10 | 17 |
| **p50** | **35** |
| p90 | 59 |

The same player, playing identically well, finishes anywhere from 17 to 59
turns depending on card order. A 42-turn band. A 3.5× spread.

Now hold the deck fixed and change the player. Across every policy that
actually plays the game, median turns run from 35 (best) to 50 (worst). Fifteen
turns of skill against 42 turns of draw.

**Luck : skill is about 2.8 : 1.**

The paired test is the one that surprised me. 120,000 trials, same cards, same
dice:

| matchup | A faster | B faster | tie | median gain to A |
|---|---|---|---|---|
| `sharp` vs `greedy` | 46.6% | 27.3% | 26.1% | **0 turns** |
| `sharp` vs `reckless` | 63.6% | 20.4% | 16.0% | 11 turns |
| `sharp` vs `random` | 97.6% | 2.1% | 0.3% | 92 turns |

Against greedy, on the same cards, sharp is faster 47% of the time and the
median gain is zero turns. Random is the one it can actually tell apart.

Sharp is not proven to be optimal. It is the best of ninety
configurations in a grid search. The first "expert" policy I wrote, patient,
lost to the naive one. Yield discipline, never borrow at 120% a year: 45
turns against greedy's 39. Better investment philosophy, worse way to play.
I left that in the findings instead of quietly fixing it.

## The janitor really does beat the doctor

Kiyosaki's headline is true, and the effect is bigger than the entire skill
range:

| rank | profession | salary | escape target | median turns |
|---|---|---|---|---|
| 1 | Mechanic | $2,000 | $1,300 | 30 |
| 2 | Janitor | $1,600 | $1,000 | 30 |
| 3 | Secretary | $2,500 | $1,700 | 31 |
| 4 | Teacher | $3,300 | $2,100 | 32 |
| 10 | Lawyer | $7,500 | $5,100 | 41 |
| 12 | Doctor | $13,200 | $8,300 | **46** |

- salary → turns: **r = 0.981**
- escape target → turns: **r = 0.987**
- payday / target → turns: **r = 0.123**

That third line is the interesting one. It quietly contradicts the moral the
game attaches to the first two.

Every profession is balanced to almost the same *ratio* of payday to escape
target. The janitor's is 0.60. The doctor's is 0.59. On the game's own terms
they are equally well off. The janitor still wins by 16 turns.

The mechanism is not financial wisdom. **The deal deck is denominated in fixed
absolute dollars.** A card pays $500 or $2,000 or $5,000 a month regardless of
who drew it. The janitor needs $1,000 of monthly passive income and can be done
in a single lucky card. The doctor needs $8,300 and needs most of a decade of
them. The strides are the same size. The finish line is closer.

That is a real and teachable insight. Arguably a better one than the box
intends. It is a property of the deck's denomination, not of the janitor's
virtue.

## What actually rewards skill is the thing the game never mentions

The grid search covered ninety configurations across four settings. Their
marginal effects, in turns:

| setting | effect | best |
|---|---|---|
| **when to flip a property** | **15 turns** | sell at about 1.5 to 2 times the down payment |
| appetite for bank debt | 4 turns | borrow only what the current payday can service |
| when to reach for Big Deals | 3 turns | around $15,000 cash |
| minimum return on capital | **1 turn** | no floor at all |

Flipping is the entire game. A player who never sells a cash-flowing property
takes a median of 52 turns. One who sells at a decent premium takes 37. The
market deck pays absurd prices relative to the deal deck. A 4-plex bought for
$16,000 down carries a $64,000 mortgage. The Plex Buyer card offers $35,000
per unit, which is $140,000, netting **$76,000 on a $16,000 stake.** Buy, wait
for a buyer, sell, repeat. No card, rule or piece of the manual mentions it.

Refuse to buy unless the deal yields 30% a year and you finish one turn
later. Median is 37. That is the whole effect.

You win when passive income is higher than expenses. Cash sitting in your
hand does not count. Passing on a deal that already pays you, because you
want a better yield later, just costs turns.

The best ten of those ninety configurations finish within **one turn of each
other**. There is almost no deep strategy to discover because there is almost
no strategy there.

## The cards' own advice is harmful

Several deal cards urge the player to borrow. Bank loans in Cashflow 101 cost
**10% of principal per month**: 120% a year. The best deal in the entire deck
yields 132% a year. The median yields 48%. So the card is recommending
120%-a-year debt to buy a 48%-a-year asset.

The `reckless` policy does exactly what the cards say. It escapes **72%** of
the time versus 100% for every disciplined policy, spends 40% of its turns
with a negative payday, and accumulates a mean peak bank loan of **$517
million**. Following the instructions printed on the cards is the difference
between always escaping and failing more than a quarter of the time.

## The bank always says yes

This is the hole the rest of the numbers sit in. The bank has no limit, no
underwriting, no collateral check. You ask, it writes $1,000 blocks, and 10%
of the principal lands on your expenses every month. That is 120% a year.
Today a loan like that is hard to come by. On this board it is automatic.

That is why the paper trade is even possible. Three symbols print a $1 card
and a $40 to $50 card. You can borrow the whole bankroll, buy at $1, and sell
at forty times that. Only you may buy at the printed price. Everyone at the
table may sell. You do not need to draw the expensive card yourself. An
opponent drawing it is your exit.

One hand-played run got to $649,470 a month of passive income against a $5,900
target.

Chasing that as a policy still loses. Over 9,600 games it finishes in 37 turns
median, against 35 for the tuned policy. The trade needs two specific cards in
the right order, so you sit in cash that earns nothing while you wait. The
loan payment also raises the escape line, because it is an expense. The
spectacular run is what unlimited credit looks like. It is not a strategy that
wins on average. The unrestricted bank is the design. The $1 card is just what
you can do with it.

## Where the numbers come from

There is no official digital ruleset.

The board and the deal decks come from one fan implementation. The profession
cards come from a second, checked against a third. Those two matched on
eleven of twelve profession cards. They disagreed on the janitor. One gives
him a negative payday, so he could never win. The other gives him +$600,
which is what published descriptions of the card say. I used the +$600
version. A test asserts the janitor's $600 payday and the doctor's $4,900.
The decks were not digitised twice.

Small deals: 55 cards, published count is 56. Big deals: 41, published is 42.
One card missing from each deck.

Opponents are not full players. They fire market and paper events for the
table. They do not compete with you for a specific deal. Games that have not
escaped by turn 200 are counted as 200 turns.

Sharp is the best of ninety configurations in a grid search. It is not proven
to be optimal. The best ten of those ninety finish within one turn of each
other.

## Play it

Same rules as the study. Play a run in the browser. Afterward you get a
decision log.

[davidslv.uk/games/rat-race-ledger](https://davidslv.uk/games/rat-race-ledger/)
