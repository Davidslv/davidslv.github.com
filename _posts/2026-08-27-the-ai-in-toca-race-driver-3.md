---
layout: post
title:  "The AI in TOCA Race Driver 3"
date:   2026-08-27
description: "Players say the other cars drive through them at turn 1. TOCA Race Driver 3 ships 2,279 authored racing lines. Personality is six floats. There is no avoidance field."
image: /img/og-the-ai-in-toca-race-driver-3.png
---

Players of TOCA Race Driver 3 have a complaint about lap 1, turn 1.
The other cars commit to the apex and arrive anyway. A typical report:

> "The AI of TOCA Race Driver 3 is very aggressive? I can't even finish
> turn 1, I'm out of the race. It seems like the AI doesn't even
> acknowledge you are racing with them, and drives through the scripted
> racing line crashing with you as if you are not there."

That is a testable claim. I opened `rd3.exe` and the AI archive
`aib.big`.

I already had the files.
[The racing line in TOCA Race Driver](/2026/08/25/the-racing-line-in-toca-race-driver.html)
is what they hold.
[Reading JPAK](/2026/08/23/reading-jpak.html)
is how TOCA 3 packed them. This is what the executable does with them.

The line is scripted. 2,279 pre-authored `.aib` files, one set per
track and car class, sometimes per car. The 2003 original had 39. The
job of the AI is to follow that line.

Avoiding you is not one of the authored traits. Each driver is six
floats: aggression, control, mistakes, speed in, speed out, and a
dedicated start-line mode. There is no avoidance, overtake, gap, or
yield field. Muscle cars sit at 0.84 aggression. Most circuit classes
sit at 0.44.

The cars do collide. The HUD draws a proximity arrow. Those are
collision physics and a player aid. The driver config does not mention
them.

## 2,279 files

`aib.big` is the same BIGF family as TOCA Race Driver 1 and 2, the
container from
[Reading a Binary Game Format in Ruby](/2026/06/30/reading-binary-in-ruby.html).
Nested: about forty per-track sub-archives (`sil`, `spa`, `mon`,
`nur`, `hoc`, `lag`, `bra`, `don`, `zan`, and the rest), and inside
those files like `sil1_v8su.aib`, `sil1_bgtc.aib`,
`ade1_bgtc_CC5.aib`.

39 files in 2003. 2,279 in 2006. About sixty times as much hand-authored
line data.

I have not decoded a TR3 `.aib` node-for-node yet. RD1's payloads were
dense racing-line nodes plus tuning scalars. The AI still follows an
authored line. I have not found a function that reasons about the track
at runtime.

## Six floats

The per-driver config parser in `rd3.exe` stores six floats into one
struct:

| field | what it does |
|---|---|
| `AIAggression` | how hard it fights for space |
| `AIControl` | grip / control margin |
| `AIMistakes` | error injected into the line-follow |
| `AISpeedIn` | corner-entry target speed |
| `AISpeedOut` | corner-exit target speed |
| `AIStartline` | start / first-corner behaviour |

I searched the binary for `AIAvoid`, `AIOvertake`, `AIGap`, `AIYield`,
`AIDefend`. None of those keys exist.

The global `ai.ini` sets a per-class aggression default `av`:

| car class | aggression `av` |
|---|---|
| Most circuit classes (`80gp`, `90gp`, `70gt`, `for1`…) | 0.44 |
| Monster trucks (`mtru`) | 0.60 |
| Muscle cars (`musc`) | **0.84** |

Aggression is set per class, then per driver. Heavier and looser
classes are authored more aggressive. `AIStartline` is a special mode
for the start and first corner, which is where the reports sit.

## Strings that are not the AI

I followed several strings that looked like an AI servo. They belong
to other systems.

- `AI Spring`, `SpringK` / `Damp` / `Scale`. Force-feedback. The same
  function reads `Castor`, `MaxForce`, `ResponsivenessVibrator`.
- `boSimulatedHuman`. A TV-camera director. It reads `boPanning`,
  `boTracking`, `boZooming`.
- `fNode%03ux/y/z/speed/roll/zoom`, `s_racingline`, `Splines.big`. The
  cinematic camera and the on-screen racing-line overlay. `roll` and
  `zoom` give it away. `s_racingline` sits with HUD keys (`FLineCol`,
  `ProgLineCol`).
- `neighborGroups`, `theNeighbors`. Mesh normal-smoothing.
- `OvertakingArrows`, `CorneringArrow`. The HUD arrow that warns you.
- `Flag_Overtaking`, `NoOvertaking`. Yellow-flag rules.
- `Collisions`, `CollisionDetect`. Physics and sound after contact.

The racing-line post parked this. Those checks are now done.

I found the authored struct. I have not found the per-frame driving
controller. Avoidance is not an authored trait. I have not proven there
is no reactive avoidance in the controller, because I have not found
the controller.

## Turn 1

Everything lines up at the lap-1 first corner.

1. Every car is bunched together and off its normal racing-line nodes.
   Grid start.
2. `AIStartline` is active.
3. Aggression is at its authored value, 0.44 to 0.84, and typically
   scales further with difficulty.
4. The dominant term is get to the apex at the target speed. There is
   no authored term that says abort the line because a human occupies
   the space.

If you are in that space, it arrives anyway. That is the behaviour the
complaint describes.

## What is measured

| finding | status |
|---|---|
| 2,279 authored `.aib` files | measured (archive) |
| Six-float personality | measured (parser in the executable) |
| Per-class aggression 0.44–0.84 | measured (`ai.ini`) |
| No avoidance field in that struct | measured (no such key) |
| Per-frame steering function | not found |
| Reactive avoidance in the controller | unmeasured |
| Turn-1 as line + start-line + aggression | fits the data, wants a live run |

Three things would close the gaps: find the controller and see whether
it reads another car's position; watch a lap-1 turn 1 from an AI car,
muscle class against a 0.44 class; decode one `.aib` (for example
`sil1_v8su.aib`) from the data side.

## Sources and limits

Own copy of the PC game. Strings, the BIGF directory, and the plaintext
`ai.ini`. No game bytes reproduced.

I have not located the per-frame steering function. Turn 1 as
line-priority plus start-line mode plus high aggression fits the
authored data. It still wants a live run.

## Where to look

The container reader and the RD1 classifier are public:

- [github.com/davidslv/bigf](https://github.com/davidslv/bigf) (MIT)
- Record decoder: `lib/bigf/toca/profile.rb`

The TR3 `.aib` layout is a follow-up. The six-float struct lives in the
executable, not in that reader.
