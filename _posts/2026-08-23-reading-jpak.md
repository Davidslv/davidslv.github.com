---
layout: post
title:  "Reading JPAK"
date:   2026-08-23
description: "TOCA Race Driver 3 packed its racing-line data in a format with the magic JPAK. The directory is uncompressed. One filename you can guess. The banner is still visible in the stream. The codec is LZSS, 4 KB window, LSB-first flags."
image: /img/og-reading-jpak.png
---

By 2006, TOCA Race Driver 3 was compressing the per-track AI. The racing
lines sit inside a pack whose first four bytes are `JPAK`. There is no public
specification.

I did not start by guessing the algorithm. I read the container, then one
file I could predict, then the first back-reference. The codec fell out of
those three observations. It is LZSS. 4,096-byte window. Flag bits
least-significant-first.

## The directory is in the clear

A compressed archive is a directory plus payloads. The directory is
uncompressed. Read that first.

A small `.jpk` has a 32-byte header: magic, version, member count, a table
offset, a data-start offset, a timestamp, a hash. Then a table of 32-byte
records. Columns that only go up are offsets. Columns that bounce around are
sizes.

```
col A  0x310  0x317  0x322 …   tiny steps, only up     name-table offsets
col B  0x161  0x1ae7 0x1f1 …   varies                  compressed size
col C  0x440  0x5c0  0x20c0 …  big steps, only up      compressed offset
col D  0x2c2  0x7936 0x373 …   varies                  uncompressed size
```

B divided by D sits between 1.7× and 4.5×, so the payloads really are
compressed. Column A points at a string table. The names are ordinary:
`ad.ini`, `forcefed.ini`, `gl_*.p3d`. One of those names is useful.

## A filename you can guess

`ad.ini` is an adaptive-difficulty config. It almost certainly opens with a
comment. That is the whole attack. Pull the compressed chunk:

```
ff 3b 20 23 20 41 44 41 50   →  · ; # ADAP
ff 54 49 56 45 20 44 49 46   →  · TIVE DIF
ff 46 49 43 55 4c 54 59 20   →  · FICULTY
```

`; # ADAPTIVE DIFFICULTY` is sitting in the stream, with `ff` every eight
characters. `0xff` means eight literals follow. That is LZSS: a flag byte
whose bits each say "literal" or "back-reference". Incompressible banner
text goes through untouched.

Storer and Szymanski, 1982, on top of LZ77 from 1977.

## I brute-forced the match operand first. That failed.

Every textbook LZSS layout decoded the literals and then produced garbage
at the first back-reference. So I traced the bytes instead.

Literals until the first match give
`…[GENERAL]\r\nFixedDifficulty=0\r\nLogging=1`. The next five bytes in the
stream are `69 6e 67 3d 31`, which is `ing=1`. The output already ended in
`Logging=1`, so those five bytes are more literals, not a match. The flag
bits are consumed least-significant-first. I had been reading them the
other way.

LSB-first, the first real match is flag `0x1f`, operand `0x0110`. Read as a
12-bit back-distance that is 272, which is larger than the 77 bytes emitted
so far. Impossible. The operand is not a distance. It is a position in a
4,096-byte ring buffer, pre-filled with spaces. Okumura's LARC/LHarc
layout, the one behind LHA:

```
position = b0 | ((b1 & 0xf0) << 4)
length   = (b1 & 0x0f) + 2
```

Position 16 maps back to a `\r\n\r` already in the output. An INI file
needs that carriage return after a key. It fits.

## Exact sizes, not "looks like INI"

`ad.ini` decompresses to 706 bytes, ending on a `[mtru2]` section. That is
the size recorded in the directory. Then all 23 members of the test archive
decode to their recorded sizes. Then all 143 members of a real per-track AI
pack: configs, `CP3D` car models, and the `AILD` racing-line data. 166
files. If the bit packing were still wrong, it would miss.

The four steps, as used:

1. Read the directory first. It isolates one chunk and often names a file
   you can guess.
2. Guess a plaintext: a config banner, a magic, a file header.
3. Trace the first match. The bytes tell you the bit order and the operand
   layout. Do not brute-force the parameter table.
4. Demand the recorded uncompressed size on every member.

This is the sequel to [Reading a Binary Game Format in Ruby](/2026/06/30/reading-binary-in-ruby.html),
which is the uncompressed BIGF container. JPAK is what TOCA 3 wrapped around
the same racing-line data.
