---
layout: post
title:  "Reading a Binary Game Format in Ruby"
date:   2026-06-30
series: engineers-notebook
series_order: 10
description: "Ruby is the last language most people would reach for to take a binary game archive apart. It turned out to be one of the best — File.binread, String#unpack, and a dependency-free reader for Codemasters' BIGF format, built AI-assisted the whole way."
image: /img/og-reading-binary-in-ruby.png
---

When you say "I'm going to reverse-engineer a binary file format," people picture C,
or Python with `struct`, or Kaitai. Nobody pictures Ruby. Ruby is for web apps and
DSLs and being pleasant; it is not, in the popular imagination, for byte-banging
floats out of a 2003 racing game.

That popular imagination is wrong. The reader for Codemasters' BIGF archive format —
the container that holds the AI data in TOCA Race Driver — is pure, dependency-free
Ruby, and it reads four different games' archives. I should be upfront about how it
came to be: this was reverse engineering done *with* an AI the whole way — me
steering, deciding what to trust and verifying every claim against the bytes; the
model drafting code, recalling the corners of the standard library, and proposing
hypotheses I then tested. What follows is the part of Ruby that made that
collaboration genuinely pleasant: **Ruby strings are byte buffers, and
`String#unpack` is a tiny, fast binary parser hiding in plain sight.**

## Strings are bytes

The first thing to internalise is that a Ruby `String` is not "text." It's a
sequence of bytes with an encoding label attached. Read a file in binary mode and
you get the raw bytes, indexable and sliceable like any string:

```ruby
data = File.binread("aib.big")   # the whole file as an ASCII-8BIT String
data[0, 4]                        # => "BIGF"  — the first four bytes
data.bytesize                     # => 3448832
```

`File.binread` is the key: it reads the file as binary (`ASCII-8BIT` / `BINARY`
encoding), so no UTF-8 interpretation mangles your `0x80`+ bytes. From there,
`data[offset, length]` carves out byte ranges, and `data.index(needle, from)` finds
a magic number or a marker anywhere in the file. That's most of a parser already.

## `unpack`: the binary decoder you already have

The workhorse is `String#unpack` (and its single-value sibling `unpack1`). You hand
it a *format string* of directives and it decodes the bytes. The two directives that
did 90% of the work here:

- **`V`** — an unsigned 32-bit integer, **little-endian**. Every count, block index,
  offset and size in BIGF is a `V`.
- **`e`** — a **little-endian single-precision float** (32-bit). The AI data is
  arrays of these: the racing-line coordinates, the control values, the padding.

```ruby
data[4, 4].unpack1("V")      # => 39        — the entry count, as a u32 LE
data[12, 16].unpack("e4")    # => [0.0, 0.0, 137.0, 0.0]   — four float32s
```

Endianness lives in the directive, which is the whole game: `V` is little-endian
u32, `N` is big-endian; `e` is little-endian float, `g` is big-endian. Codemasters'
PC games are little-endian, so it's `V` and `e` throughout. (When we later looked at
an Xbox 360 file, big-endian PowerPC, it would have been `N` and `g` — the format
string is the only thing that changes.)

`unpack` is implemented in C inside the interpreter, so decoding a few hundred
thousand floats is not slow. You are not paying a "scripting language" tax here.

## Walking the container

BIGF is a header, a directory, and a data section. The header check is a one-liner:

```ruby
MAGIC = "BIGF".b
raise "not a BIGF archive" unless data[0, 4] == MAGIC
```

That `.b` is worth a footnote: it returns a binary copy of the string literal, so
the comparison is byte-for-byte regardless of source-file encoding. I use it for
every binary constant.

BIGF has two directory layouts. One is a flat table of **fixed 24-byte records** —
`char name[16]; u32 size; u32 offset` — which is a textbook `unpack` loop:

```ruby
count = data[4, 4].unpack1("V")
base  = data[8, 4].unpack1("V")    # data-section base, read from the header (not assumed!)
off   = 0x24                        # records start after the 0x20 header + a 4-byte pad

count.times do
  rec = data[off, 24]
  name          = rec[0, 16].split("\x00").first.to_s   # NUL-terminated name field
  size, offset  = rec[16, 8].unpack("V2")               # two u32s in one go
  members << Entry.new(name:, offset: base + offset, size:)
  off += 24
end
```

Three small Ruby niceties are doing real work there. `rec[0, 16].split("\x00").first`
turns a fixed-width, NUL-padded C string into a Ruby string. `unpack("V2")` pulls
*two* integers at once (the count suffix). And — a hard-won detail — `base` is read
from the header field at `0x08` rather than hard-coded, because measuring 1,371 real
files showed it isn't always the `0x800` everyone assumes.

The other layout is variable-length: names interspersed with a `0x44 00 00 00`
marker. That's where `String#index` shines — you scan for the extension, walk back to
the preceding NUL to find the name's start, then look just past it for the marker:

```ruby
while (idx = data.index(".aib", pos)) && idx < limit
  s = idx
  s -= 1 while s.positive? && data.getbyte(s - 1) != 0   # walk back to the NUL
  name = data[s...(idx + 4)]
  # ...marker + block index follow the name...
  pos = idx + 4
end
```

`getbyte` reads a single byte as an integer without allocating a substring — exactly
what you want in a tight backwards scan.

## Decoding the records inside

Carving a member is just a slice — `data[entry.offset, entry.size]` — and Ruby
slicing is *safe*: ask for bytes past the end of the file and you get a short string
or `nil`, never a crash. Inside an AI profile, every 16 bytes is four float32s, and
the parser classifies each record by its bit pattern:

```ruby
SENTINEL   = "\x3f\x3f\x3f\x3f".b.unpack1("e")        # => 0.7470588…  (the padding value)
KTAG_MAGIC = "\x0c\x00\x00\x00\x08\x00\x00\x00".b

def classify(bytes)
  return [:ktag, bytes[8, 4].unpack1("e")] if bytes[0, 8] == KTAG_MAGIC

  a, b, c, d = bytes.unpack("e4")
  if [a, b, c, d].all? { |x| (x - SENTINEL).abs < 1e-5 } then :pad
  elsif a.zero? && b.zero? && c.zero? && d.zero?         then :zero
  elsif b.zero? && d.zero?                               then :scalar   # (v,0,v,0)
  elsif [a,b,c,d].all? { |x| coordish?(x) }              then :path     # (x,y,x,y)
  else :other
  end
end
```

That `SENTINEL` line is a small joy: nobody had to look up "what float is
`0x3f3f3f3f`?" in a calculator — we let Ruby tell us by unpacking the four bytes
(`0.7470588…`). The classifier then reads almost like prose, which matters when the
prose *is* the format specification you're trying to pin down.

One genuine gotcha lives in `coordish?`: some 16-byte records, read as floats, are
denormals or `NaN`. Ruby's `Float#nan?` and a magnitude check handle it cleanly —
but you have to remember that `x == x` is `false` for `NaN`, so the guard is
`!x.nan? && x.abs < 1e30 && …` rather than a naive comparison. (RuboCop will even nag
you toward `nan?` if you write the `x == x` trick.)

## Why Ruby, specifically

Having done this, the case for Ruby on a binary-RE task is concrete:

- **Strings-as-buffers + slicing** make navigation ergonomic — no cursor object, no
  read/seek ceremony, just `data[off, len]`.
- **`unpack` is a complete, fast, C-backed binary decoder** with a one-character
  vocabulary for every integer and float width and endianness.
- **Zero dependencies.** The whole reader is standard library. A research tool that
  has to run on a stranger's machine in five years should not depend on a gem whose
  API has since drifted.
- **It reads like the spec.** When the code that classifies a record is short enough
  to hold in your head, the code *becomes* your documentation of the format — which is
  the entire point of reverse-engineering.
- **The REPL closes the loop.** During the actual work, `irb` with `File.binread` and
  a one-line `unpack` is the fastest way to ask "what is at offset `0x5c00`?" and get
  an answer before the thought has finished.

The gotchas are few and all about staying in binary-land: read with `binread`, write
binary constants with `.b`, get the endianness directive right (`V`/`e`, not `N`/`g`),
use `unpack1` when you want one value instead of an array, and treat `NaN` with
respect. None of them are Ruby's fault; they're just what binary is.

A 2003 racing game's AI, a four-byte magic, a table of offsets, and a few hundred
thousand little-endian floats — all read by twenty lines of standard-library Ruby. The
language people use for `has_many :comments` turns out to be a perfectly good
disassembler's notebook — and, paired with an AI that never tires of unpacking the
next sixteen bytes, a fast one.

---

### Where to look

The full reader is open source — `String#unpack` in anger across two table layouts and
four games:

- **Repository:** [`github.com/davidslv/bigf`](https://github.com/davidslv/bigf) (MIT)
- The container parser: `lib/bigf/archive.rb` · the record decoder: `lib/bigf/toca/profile.rb`
