---
layout: page
title: "Transcribe Offline — Support"
permalink: /transcribe-offline/support/
image: /img/og-transcribe-offline.png
description: "Support for the Transcribe Offline macOS app: requirements, supported formats, common questions, and how to get help."
---

Support for **Transcribe Offline**, a macOS app that turns a video or audio file
into a transcript, entirely on your own Mac.

## Get in touch

**davidslv.london@gmail.com**

It is one person answering, so please allow a couple of days. Telling me the
macOS version, the Mac you are using, and the file format that gave you trouble
will usually save a round trip.

## Requirements

- A Mac with **Apple silicon** (M1 or later). Intel Macs are not supported.
- **macOS 14 (Sonoma)** or later.
- About 600 MB of disk space.

## Supported formats

Most things you are likely to have: `mp4`, `mov`, `m4a`, `mp3`, `aac`, `wav`,
`caf`, and the other formats macOS itself can decode. If a file opens in QuickTime
Player, it will almost certainly open here.

## Common questions

### Why is the app so large?

Around 575 MB, and nearly all of it is the speech-recognition model. That is the
price of an app that works with the network switched off. Apps that download a
model on first launch, or send your audio to a server, are smaller for exactly the
reason you might not want them.

### Does it need an internet connection?

No — and it cannot use one. The app runs sandboxed without network access, so it
is technically prevented from connecting to anything. See the
[privacy policy](/transcribe-offline/privacy/).

### Which languages does it handle?

The model is multilingual and the spoken language is detected per file. There is
no language setting to configure.

### "Speaker 1" isn't the first person who talks

Correct, and that is expected. The speaker labels are stable and distinct within a
transcript — the same voice keeps the same number — but the numbering itself is
arbitrary. It is not the order in which people spoke.

### Can I get timestamps?

Yes. Export as **SubRip (.srt)** or **WebVTT (.vtt)** and each line carries its
timing. The plain-text export has no timestamps.

### Where did my transcript go?

Nowhere, unless you exported it. The app writes nothing to disk on its own. Use
**Copy** to put the transcript on the clipboard, or **Export…** to save it where
you choose.

### It says "no speech detected"

The audio track was decoded but no speech was found in it. Usually this means a
silent track, a music-only file, or a video whose audio is on a track the file
does not mark as the primary one. Try playing the file first to confirm you can
hear speech.

### Speaker identification is slower

It is doing more work — a second pass over the same audio to separate voices — so
it takes longer than a plain transcript. It is off by default for that reason.

## Known limitations

- Apple silicon only. Speaker identification needs a Neural Engine, which Intel
  Macs do not have.
- Transcription accuracy depends heavily on recording quality. Overlapping
  speech, heavy background noise, and distant microphones all degrade it.
- Speaker labels are arbitrary numbers, not names, and the app cannot tell you
  who anybody is.

## Credits

The app is built on work released by others under open licences — whisper.cpp,
OpenAI's Whisper models, FluidAudio, and the pyannote community-1 models. Full
attribution is in the app under **Transcribe ▸ Acknowledgements**.
