---
layout: post
title:  "The Propshaft Version Lever You Were Told Was Gone"
date:   2026-06-23
series: engineers-notebook
series_order: 8
description: "Community feedback claimed Rails 8's Propshaft removed config.assets.version. I read the source and ran the experiment on a clean Rails 8.1.3 app: it's still there, still wired into the digest, and bumping it forces every fingerprint to change. Plus the cache-busting problem it doesn't solve."
image: /img/modular-rails-cover.png
---

A piece of feedback to the Rails community crossed my feed this week. A team had migrated an application to Rails 8.1.3, adopted Propshaft — the asset pipeline that replaced Sprockets as the Rails 8 default — and concluded that it had removed the ability to set a version string to force new fingerprints on precompile. Their words were that this introduced "a weakness to the platform." The reasoning was sound: they used that lever to be certain a client was running the latest deployed assets, and now it appeared to be gone.

The instinct is correct. That lever matters. But the conclusion is wrong, and the way I know it is wrong is the point of this post: I cloned Propshaft, read the source, and then generated a fresh Rails 8.1.3 app and tested it, rather than trusting the blog posts. The version setting is still there. It is wired into the digest. The Rails generator writes it into your initializer with a comment explaining what it does. And when I precompiled twice to prove it, it behaved exactly as advertised. It is missing from Propshaft's README — which is a different problem from being removed, and a much smaller one.

## What the blog posts will tell you

Search for "Propshaft cache busting" and every result says the same thing, more or less correctly:

> Propshaft appends a content-based fingerprint to each filename. `application.css` becomes `application-a1b2c3d4.css`. When the content changes, the digest changes, the filename changes, and the browser fetches the new file. Unlike Sprockets, there is no `config.assets.version` to manage — the content hash handles everything.

That last sentence is the one that does the damage. It is repeated across tutorials, and it is the source of the belief that the lever was deleted. The first half is true. The second half is folklore.

## What the source actually says

Propshaft is small enough to read in a sitting, which is exactly why I reach for `git clone` before I reach for an opinion. The whole digest mechanism is one method in `lib/propshaft/asset.rb`:

```ruby
def digest
  @digest ||= Digest::SHA1.hexdigest("#{content_with_compile_references}#{load_path.version}").first(8)
end
```

Read it slowly. The string being hashed is not just the file's content. It is the content **concatenated with `load_path.version`**. The fingerprint is a SHA1 of *content plus a version string*, truncated to eight characters.

So where does `load_path.version` come from? Two short hops up. The load path is built in `lib/propshaft/assembly.rb`:

```ruby
def load_path
  @load_path ||= Propshaft::LoadPath.new(
    config.paths,
    compilers: compilers,
    version: config.version,          # <- right here
    file_watcher: config.file_watcher,
    integrity_hash_algorithm: config.integrity_hash_algorithm
  )
end
```

And `config.version` is `config.assets.version`, which the Propshaft railtie sets a default for in `lib/propshaft/railtie.rb`:

```ruby
config.assets.version = "1"
```

The chain is unbroken:

```mermaid
flowchart LR
    A["config.assets.version<br/>(generated app: &quot;1.0&quot;)"] --> B[Assembly]
    B -->|"version: config.version"| C[LoadPath.version]
    C --> D["Asset#digest<br/>SHA1(content + version)"]
    D --> E["application-a1b2c3d4.css"]

    style A fill:#e8a838,stroke:#b07828,color:#fff
    style D fill:#4a90d9,stroke:#2c5f8a,color:#fff
    style E fill:#27ae60,stroke:#1e8449,color:#fff
```

`config.assets.version` exists in Propshaft. The railtie defaults it to `"1"`, it is folded into every single asset digest, and this is Propshaft 1.3.2 — the version shipping with current Rails 8.

And here is the part that turns "undocumented" into "actually documented, in your own repository." Generate a fresh Rails 8.1.3 app and open `config/initializers/assets.rb`, and the generator has already written this for you:

```ruby
# Version of your assets, change this if you want to expire all your assets.
Rails.application.config.assets.version = "1.0"
```

The generated app overrides the railtie's `"1"` with `"1.0"`, but the point is the comment. The exact "enter version information to force new fingerprints" feature the feedback believed was disabled is scaffolded into every new Rails app, on a line whose comment names the precise use case: *change this if you want to expire all your assets*. Nobody removed the lever. It is sitting in an initializer the generator wrote, one `git grep version config/` away.

## Using it

Because the version string is part of the hashed input, changing it changes the hash for **every asset**, regardless of whether any file content changed. Edit the line the generator already gave you:

```ruby
# config/initializers/assets.rb
Rails.application.config.assets.version = "2.0"
```

Precompile, and every fingerprint differs from the previous build — the same shift for every file in the pipeline. The asset URLs embedded in your views all change, and any client requesting an old URL gets a cache miss and pulls the fresh file. That is precisely the "force new fingerprint generation on precompile" behaviour the feedback assumed had been taken away.

It is worth noting this is *more* reliable than the feature people remember. Sprockets had a long-standing bug ([sprockets-rails#240](https://github.com/rails/sprockets-rails/issues/240)) where bumping `config.assets.version` produced identical digests anyway — the lever was connected to nothing. Propshaft's version genuinely participates in the hash. The thing that was supposedly removed actually works better than the original.

## I didn't take the source's word for it

Reading the source tells you what *should* happen. Before publishing this I generated a clean Rails 8.1.3 app (`propshaft (1.3.2)`, no Sprockets in the lockfile), added one declaration to `app/assets/stylesheets/application.css`, and precompiled it twice. Between the two builds I changed nothing except the version string, and I checked that the CSS file was byte-for-byte identical (same MD5) across both runs.

**Build one**, with the default `config.assets.version = "1.0"`, produced this manifest:

```json
{ "application.css": { "digested_path": "application-a863ad16.css" } }
```

**Build two**, after changing only the version to `"2.0"` — no content change, identical MD5 — produced:

```json
{ "application.css": { "digested_path": "application-09b5bd28.css" } }
```

Every digest moved, not just the stylesheet's:

| asset | `version = "1.0"` | `version = "2.0"` |
| --- | --- | --- |
| `application.css` | `a863ad16` | `09b5bd28` |
| `rails-ujs.esm.js` | `e925103b` | `a4ead74f` |
| `rails-ujs.js` | `20eaf715` | `0b7c6ef1` |

Then, to be sure I understood *why*, I reproduced the digest by hand from the formula in `asset.rb` — `SHA1(content + version)` truncated to eight characters:

```ruby
require "digest"
content = File.read("app/assets/stylesheets/application.css")
Digest::SHA1.hexdigest("#{content}1.0").first(8)  # => "a863ad16"  ✓ matches build one
Digest::SHA1.hexdigest("#{content}2.0").first(8)  # => "09b5bd28"  ✓ matches build two
```

Both hand-computed digests matched the precompiled filenames exactly. The lever works, it works for the documented reason, and the mechanism is no deeper than concatenating a string before hashing.

## Why you almost never need it

Here is the more interesting half, and the reason the lever is quietly scaffolded rather than loudly advertised.

With Sprockets, the version string earned its keep because Sprockets' digests were not purely content-addressed and were occasionally inconsistent between environments and gem versions. The version knob was the manual override you reached for when you did not trust the automatic digest. It was a workaround for unpredictability.

Propshaft's digest is a plain SHA1 of the content. It is deterministic: identical bytes always produce the identical fingerprint, and any byte change produces a new one. The automatic case is now trustworthy, so the manual override has almost nothing left to do. If you changed an asset, its fingerprint already changed — you do not bump a version to "make sure," because the content *is* the version.

The only scenario where the global lever is the right tool is when you want every asset to get a new URL *without changing any content*: forcing a CDN that keyed on something unexpected to re-pull, recovering from a poisoned edge cache, or invalidating after a build-toolchain change that altered how files are produced but not what they contain. Real situations, but rare ones. That rarity is why the generated app sets the field to `"1.0"` and most teams never touch it again — not because it was deleted.

## The cache-busting problem the lever does not solve

There is a deeper point hiding in the original feedback, and it is the part worth carrying away even if you never touch `config.assets.version`.

The stated goal was "make sure the client indeed has the latest asset being deployed." Bumping the asset version does not, on its own, guarantee that — because the fingerprinted URL lives **inside your HTML**:

```html
<link rel="stylesheet" href="/assets/application-9f8e7d6c.css">
```

A fingerprinted asset is safe to cache forever, which is the whole win: the URL only points at one immutable version of the file. But the *document* that references it is a different cache layer entirely. If a CDN, a reverse proxy, or the browser is holding an old copy of the HTML, the client keeps reading the *old* asset URL — and your shiny new `version = "2.0"` digests sit on the server unrequested.

So "did the client get the latest assets?" is really two questions stacked on top of each other:

- **Assets:** solved by fingerprinting, automatically, the moment content changes. Cache them with `max-age` set to a year and `immutable`.
- **The HTML that names them:** *not* an asset-pipeline concern at all. This is the layer to get right — a short or zero `max-age` on the document, `ETag`/`Last-Modified` revalidation, and correct CDN cache rules for HTML responses. If this layer serves stale HTML, no amount of fingerprinting downstream will help.

Reaching for `config.assets.version` to fix a stale-client problem is, most of the time, fixing the layer that already works and ignoring the one that does not. The fingerprint was never the weak link. The document cache is.

## The generalisable lesson

There are two, and they are both cheap habits.

**Read the source, then run the experiment, before you declare a feature gone.** Propshaft is a few hundred lines. The entire digest behaviour — the thing three dozen blog posts summarise, sometimes wrongly — is one method you can read in under a minute. Cloning the repository and grepping for `version` took less time than writing the post that announced its removal, and it would have produced the opposite, correct conclusion. Generating a throwaway app and precompiling it twice took five more minutes and turned "the source says it should work" into "I watched it work." When a tool's behaviour surprises you, the library's own code is the primary source and a two-build experiment is the proof. Tutorials are secondary, and they inherit each other's mistakes.

**Match the fix to the layer.** "The client has stale assets" feels like one problem but spans two caches with two different owners. Fingerprinting owns the asset layer and has owned it well since Propshaft shipped. HTTP cache headers own the document layer. Bumping an asset version to solve a document-caching symptom is the kind of fix that appears to work — because you redeployed and cleared something — while leaving the actual cause in place to resurface on the next deploy.

The lever you were told was gone is still bolted to the dashboard. It is just that the car mostly steers itself now, and the warning light you are chasing is wired to a different system entirely.

---

*The code in this post is from [Propshaft](https://github.com/rails/propshaft) 1.3.2, the asset pipeline that ships by default with Rails 8. The digest method is `lib/propshaft/asset.rb`; the railtie default is in `lib/propshaft/railtie.rb`; the generated `config.assets.version` line is in `config/initializers/assets.rb`. Every digest in this post was reproduced from a clean `rails new` on Rails 8.1.3 — two precompiles, one version change, identical content — not from memory.*

*If you want the longer story on building Rails applications that stay maintainable as they grow — boundaries, engines, testing, and honest trade-offs — that is what [Modular Rails: Architecture for the Long Game](/modular-rails/) covers in depth. [Read it free on the web](/books/modular-rails/), or get the [paperback](https://www.amazon.com/dp/1066649405) ([UK](https://www.amazon.co.uk/dp/1066649405)).*
