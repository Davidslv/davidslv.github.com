---
layout: post
title:  "The inner life of a peep"
date:   2026-08-29
description: "A patient's feelings in Theme Hospital update when they walk. A peep who has arrived and stopped has stopped feeling."
---

Theme Hospital (1997) runs every patient and every staff member as a
peep. I ported the handlers that tick them and checked each function
against the original, 2,000 randomised trials at a time.

A patient's inner life is maintained by walking.

The patient's walk step runs the whole mood tick, then the
misbehaviour picker. Warmth, crowding, thirst, the bladder, boredom,
vomiting and litter all fire from the step a patient takes toward
wherever they are going. The staff walk step runs none of that.

A patient who has arrived and stopped has stopped feeling. The game
does not update a stationary patient's feelings. Queues and corridors
are where a hospital's mood is made.

## Patient and staff

The per-tick composites share their structure. The differences are
policy.

| | patient | staff |
|---|---|---|
| Comfortable warmth band | gains happiness | gains nothing |
| What warmth can do | reward or punish | only cost |
| What pays happiness | comfort, treatment progress | being rested |
| Walk step side-effects | full mood tick and misbehaviour picker | none |

Both ticks rate-limit on a wrapping stamp. The restamp is the current
tick plus a per-peep offset, so the population's updates spread across
frames instead of all firing on the same one.

## The empty slot

On a recorded session of 108,306 peep samples, one state accounts for
77,784 of them. 72% of dispatch. Ported, that handler is a decrement
and a memory clear. It is the empty slot. The most-run handler in the
wave clears memory.

## Misbehaviour in the corridor

The picker only runs from the patient's walk step. Patients act out
while moving through the hospital, not while parked in a room.

A staff member who is not already pulling a patient has roughly a 7 in
100 chance, on those ticks, of stopping to chat. The roll is two
independent checks.

An idle room is re-checked against the announcement queue twice as
often when the hospital's patient count exceeds that staff member's
tiredness. That comparison is in the original. It mixes patient count
with tiredness.

## The announcement queue

A queue record that already carries a staff member's index is theirs,
whatever else it says.

Ordering is an invariant. A staff member inside a room is told to
leave before they are told to arrive. The two arms of that function
differ only in that order.

An emergency jumps the queue. Nothing else does.

## Sources and limits

The reading comes from the original PC executable, ported function by
function and checked against it. The full suite is 361 of 361 at 2,000
trials. A recorded session of 108,306 peep samples replayed byte for
byte.

I am not publishing the port. This is what the code says about the
design.

Period engines often hang an agent's updates off its motion step.
A stationary agent is frozen. That is cheap, and it spreads the work
across frames. A queue keeps walking, so it keeps feeling.
