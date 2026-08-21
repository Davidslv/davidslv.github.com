---
layout: post
title:  "The racing line in TOCA Race Driver"
date:   2026-08-25
description: "A TOCA Race Driver AI profile is 512 KiB. Two-thirds is padding. The rest is a densely sampled racing line and a handful of per-sector values. Same 16-byte records in 2003, 2004 and 2006."
---

People who played TOCA Race Driver remember the other cars. They take a
line. They brake late and run wide. The compliment is always that they
feel driven.

I already had the container. Codemasters packed the AI into a BIGF
archive: four bytes of magic, a directory, then the files. That is
[Reading a Binary Game Format in Ruby](/2026/06/30/reading-binary-in-ruby.html).
This is what those files hold.

TOCA Race Driver 1 names 39 AI profiles inside `aib.big`. A full one is
exactly 512 KiB. 32,768 records of 16 bytes, each four little-endian
floats. I classified every record by its bit pattern.

| record kind | share of file | what it is |
|---|---|---|
| padding (`0x3f3f3f3f`, the float `0.747`) | **~65%** | unused fill in a fixed-size slot |
| racing-line point `(x0, y0, x1, y1)` | ~21% | the line the AI follows |
| bound scalar `(v, 0, v, 0)` | ~3% | the authored value for a channel |
| control tag (`0c..08` plus a float `K`) | ~0.5% | selects the channel |

## The line

The points chain. Consecutive `(x, y)` pairs sit about fifteen
world-units apart (on one DTM block the mean gap is 14.4, range 2 to
57). Plot them and a circuit appears: a start-finish straight, a
technical infield. A full profile carries somewhere between 5,000 and
17,000 usable points, depending on the series.

The control layer is smaller. A tag
`0c 00 00 00 08 00 00 00` plus a float `K`, then a scalar
`(v, 0, v, 0)` immediately after. In one DTM profile there are nine
distinct `K` values. Each shows up about thirty-five times, once per
sector.

| K | paired v | what it is doing |
|---|---|---|
| 137 | ≈ 8.0 | speed target |
| 552 | ≈ 152 | high target, DTM only |
| -135 | ≈ -79.5 | lateral / braking |

The authored number sits in the scalar that follows the tag. Follow
this line. At this sector, aim for this value.

Driver files sitting next to the archive name the other scalars:
Aggression, Mistakes, Control, SpeedIn, SpeedOut. They are more
tables, loaded once before the grid.

## The first reader was wrong about the base

I assumed the data section always started at `0x800`. It does in a lot
of files. Measuring 1,371 archives showed the base lives in a header
field and runs from `0x60` to `0x5000`. The assumption silently misread
about 290 files.

32 of the 39 names in RD1's `aib.big` are empty stubs. The 512 KiB
blobs live in the series archives (`ela.big`, `dtm.big`) using the same
layout.

## RD1, RD2, TOCA 3

- **RD1 (2003).** One self-contained 512 KiB profile per series. The
  racing line is duplicated inside every file. 39 names.
- **RD2 (2004).** One shared per-track line (`.aid`), then tiny
  per-class overlays (`.aib`, 76 to 84 bytes) and per-class arrays
  (`.red`). The 16-byte record vocabulary is the same. An RD2 overlay
  decodes with the RD1 classifier. 56 modular archives.
- **TOCA 3 (2006).** Car physics and class tuning move to plaintext.
  The bulk AI data is compressed. I wrote that one up as
  [Reading JPAK](/2026/08/23/reading-jpak.html). Inside the pack the
  line has its own four-byte magic, `AILD`.

Harder profiles are different tables. A different line. Different
target values. A wider or narrower error band.

## Sources and limits

Own discs. No game bytes reproduced here, only sizes, magics, and
record shapes.

The shares in the first table are from a full RD1 profile. Other
series spend more or less of the 512 KiB on path against pad.

I have not located the per-frame steering function in the executable.
Several strings that look like an AI servo belong to force-feedback
and the TV camera. I am leaving those out until a later pass.

## Where to look

The classifier is in the same public reader as the container:

- [github.com/davidslv/bigf](https://github.com/davidslv/bigf) (MIT)
- Record decoder: `lib/bigf/toca/profile.rb`
