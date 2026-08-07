---
layout: page
title: "Transcribe Offline for Mac"
permalink: /transcribe-offline/
description: "A macOS app that turns a video or audio file into a transcript. No account, no upload, no network — everything it needs is already inside. Export as txt, srt or vtt."
image: /img/og-transcribe-offline.png
---

> **Drag a recording in. Read the transcript. Export it.**
> Nothing you open ever leaves your Mac.

Transcribe Offline turns a video or audio file into text. There is no account, no
sign-in, and no network connection at any point — not on first launch, not ever.
Everything it needs is already inside: install it once and it works on a plane.

That last part is the whole design. Recordings you would not hand to a stranger —
interviews, one-to-ones, medical or legal conversations, anything under an NDA —
never reach a server, because the app cannot reach one.

<p><a class="btn-read" href="#coming-soon">Coming to the Mac App Store</a>
<a class="btn-buy" href="/transcribe-offline/support/">Support</a></p>

<figure>
  <picture>
    <source srcset="/img/transcribe/speakers.webp" type="image/webp">
    <img src="/img/transcribe/speakers.png" width="900" height="420" decoding="async"
         alt="Transcribe Offline showing a transcript labelled Speaker 1 and Speaker 2, with Copy and Export controls.">
  </picture>
  <figcaption>A transcript with speakers identified. Everything on this screen was produced on-device.</figcaption>
</figure>

## How it works

Drop a video or audio file onto the window or the Dock icon, or pick one with
**File ▸ Open**. The app decodes the audio, shows its progress, and puts a
copyable transcript on screen.

From there you can copy the whole thing in one click, or **Export** it as plain
text (`.txt`), SubRip (`.srt`) or WebVTT (`.vtt`) — the subtitle formats carry
timestamps. Nothing is written to disk until you choose where it goes.

## Multilingual, with no setup

The spoken language is detected per file. There is no language menu to get wrong:
open a Portuguese recording after an English one and it simply works.

## Identify speakers

Turn on **Identify speakers** and the transcript is labelled `Speaker 1:`,
`Speaker 2:`, which makes interviews and meetings far easier to read. It is off by
default, and it also runs entirely on your Mac, on models bundled in the app.

One honest note: the labels are stable and distinct, but arbitrary. "Speaker 1" is
not necessarily the first person to talk.

## About the size

The app is around 575 MB, and nearly all of that is the speech model. That is the
cost of an app that works with the network switched off and asks nothing of a
server. Once it is installed, there is nothing further to fetch — ever.

## What it is built on

Apple's AVFoundation decodes the audio in memory — no ffmpeg, no bundled
binaries, no shelling out. [whisper.cpp](https://github.com/ggml-org/whisper.cpp)
runs the multilingual `large-v3-turbo` model with Metal acceleration. Speaker
identification uses the
[pyannote community-1](https://huggingface.co/pyannote/speaker-diarization-community-1)
models via [FluidAudio](https://github.com/FluidInference/FluidAudio), on the
Neural Engine. All of it is bundled; none of it downloads anything.

## Requirements

A Mac with Apple silicon, running macOS 14 (Sonoma) or later.

<h2 id="coming-soon">Coming soon</h2>

Transcribe Offline is built and being prepared for the Mac App Store. This page
will carry the download link as soon as it is live.

If you want to be told when that happens, or you have a question in the meantime,
the [support page](/transcribe-offline/support/) has the address. The
[privacy policy](/transcribe-offline/privacy/) is short, because the app collects
nothing.
