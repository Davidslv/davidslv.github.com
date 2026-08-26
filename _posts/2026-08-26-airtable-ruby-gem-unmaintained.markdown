---
layout: post
title:  "Airtable's Ruby gem has not shipped code since 2016"
date:   2026-08-26
description: "Airtable's own Ruby client still promises, in its README, that Airtable will maintain it. That promise was committed in May 2016. The last line of code landed in November 2016. I asked Airtable twice, and they confirmed in writing that it is not actively maintained and that I should use something else. So I rebuilt it, and now I am giving it away."
image: /img/og-airtable-ruby-gem-unmaintained.png
---

Open the README of [Airtable's official Ruby client](https://github.com/Airtable/airtable-ruby)
and, before you reach the install instructions, you get this:

> We are currently transitioning this gem to be supported by Airtable. We will
> maintain it moving forward, but until we fully support it, it will stay in
> the status of "community libraries". At that time we will remove this notice
> and add a "ruby" section to the API docs.

That paragraph was committed on **2 May 2016**, in a commit titled
"Clarify the status of the gem as now it's in Airtable org."

Today is 26 August 2026. The notice is still there. There is still no Ruby
section in the API docs.

## The timeline

- **15 November 2016**: the last commit that changed any code. It is called
  "Use proper escape."
- **13 June 2018**: the last commit of any kind, merging a pull request that
  added a paragraph of documentation.
- **18 October 2016**: the release date of `airtable` 0.0.9, which is still
  the version you get today if you run `gem install airtable`.

That gem has been downloaded about 650,000 times. The repository has 170 stars,
14 open issues, 9 open pull requests, and is not archived.

The issue titles tell the story better than I can:

- **#25**, July 2017: "PLEASE deprecate this repo and link to Airrecord"
- **#26**, December 2017: "MAINTAINER needed"
- **#29**, January 2018: "Bump to 0.10 on rubygems.org"
- **#39**, September 2021 (a pull request): "Update gem status in README"
- **#40**, November 2021: "project status?"

None of them have an answer. The most recent activity on the repository is pull
request #45, opened in June 2024: "httparty has multipart/form-data request
tampering vulnerability."

## What ten years of nobody-home actually costs you

Two things, both concrete.

**The setup instructions describe a credential that no longer exists.** The
README tells you to "get an api key" from your Airtable account page. Airtable
began deprecating API keys on 18 January 2023 and switched them off entirely on
1 February 2024. The official Ruby client's own getting-started section has been
describing a dead credential for two and a half years.

**There is a real bug in the four lines that set up authentication.** Here is
the whole of `Airtable::Resource`:

```ruby
def initialize(api_key, app_token, worksheet_name)
  @api_key = api_key
  @app_token = app_token
  @worksheet_name = worksheet_name
  self.class.headers({'Authorization' => "Bearer #{@api_key}"})
end
```

`self.class.headers` sets the header on the HTTParty *class*, not the instance.
Every resource in the process shares it. Build a second client with a different
token and the first client silently starts using the second one's credentials.
Harmless if your app has exactly one token forever. A live authentication bug
the moment it has two.

Neither of these is exotic. They are just what a codebase looks like when nobody
has opened it in a decade.

## The alternatives are good. That is not the problem.

[Airrecord](https://github.com/sirupsen/airrecord) is the healthy one: 2.6 million
downloads, commits as recently as July 2026. I have no criticism of it. But it is
deliberately a different library, with a different philosophy:

```ruby
class Tea < Airrecord::Table
  self.base_key = "app1"
  self.table_name = "Teas"

  has_many :brews, class: "Brew", column: "Brews"
end

Tea.all
```

Against the official gem's:

```ruby
table = client.table("app1", "Teas")
table.records(sort: ["Name", :asc])
```

One models Airtable as a database with declared schema and associations. The
other is a thin client over HTTP. Both are defensible. They are not
interchangeable.

Which means that if you adopted the official gem in 2017 and it is now threaded
through your jobs, your services and your test doubles, moving to Airrecord is a
rewrite. You spend a sprint rewriting working code, and at the end of it you have
the same features you started with. That is a terrible trade, and it is why a
gem last released in 2016 still gets downloaded 650,000 times. Not because anyone
loves it. Because everybody leaving is more expensive than nobody leaving.

What you actually want is the gem you already have, with the ten years of
maintenance it never got.

## I asked Airtable

Twice. I asked whether they wanted to pick their own client back up, or hand it
to somebody who would. What came back was more candid than I expected:

> To be transparent about where things stand, Airtable's officially supported
> and documented API client is the JavaScript library.
>
> There is a Ruby gem published under Airtable's GitHub organization, but it has
> carried a "transitioning to official support" note for a long time without
> that transition being completed, so in practice it is not actively maintained.
> Your engineer is right to be cautious about relying on it.
>
> [...] for a stable and fully supported path, the best options are to call the
> Airtable Web API directly using a standard Ruby HTTP client, since the REST
> API itself is versioned, documented, and fully supported regardless of
> language, or to use the actively maintained community gem "airrecord," which
> many Ruby teams use in production.

I want to be fair about what that is: a support reply to me, not a press
statement. But it is unambiguous, and I think it settles the question. Airtable
knows the notice has been sitting there uncompleted. Airtable agrees the gem is
not maintained. Airtable's recommendation to Ruby developers is to use somebody
else's gem, or to write the HTTP calls yourself.

Their offer was to pass the feedback to the product team. Nobody offered to fix
the README, or to archive the repository, or to add the deprecation notice that
someone requested in 2017. So the 650,000 downloads a year will keep landing on
a gem whose own publisher quietly considers it dead, and whose setup
instructions describe a credential that stopped working in 2024.

That is frustrating. It is also clarifying: it is not coming back, and anything
that happens to it has to happen from outside.

And note the first of the two options they recommend: call the Web API using a
standard Ruby HTTP client. That is a reasonable answer. It is also, almost
exactly, a description of the thing I had already built.

## airtable-rb

So I forked it and did the ten years.

The important design constraint was that it should not cost you a sprint to
adopt. Same namespace, same entry point, same method names:

```ruby
require 'airtable'

client = Airtable::Client.new(ENV.fetch('AIRTABLE_ACCESS_TOKEN'))
table  = client.table('appXXXXXXXXXXXXXX', 'Table Name')

table.records(sort: ['Name', :asc], limit: 50)
table.select(formula: 'Active = 1', fields: %w[Name Email], view: 'Main View')
table.all
table.find('rec02sKGVIzU65eV2')
table.create(Airtable::Record.new(name: 'Sarah Jaine'))
table.update_record_fields('rec03sKOVIzU65eV4', 'Email' => 'new@example.com')
table.destroy('rec03sKOVIzU65eV4')
```

Every one of those calls is shaped the way it was in 2016. What changed is
underneath:

- **Zero runtime dependencies.** HTTParty and ActiveSupport are gone; it is
  `Net::HTTP` and the standard library. Requires Ruby 3.1+.
- **Persistent connections.** Each table keeps a keep-alive connection and
  rebuilds it transparently when the socket dies.
- **Client-side rate limiting.** A thread-safe sliding-window limiter holds you
  under Airtable's 5 requests/second/base cap. It is process-global and keyed by
  base ID, because *per base* is the unit Airtable actually meters. A
  per-client limiter lets four Sidekiq threads cheerfully exceed a limit they
  each individually respect.
- **Automatic retries.** 429 and 503 retry up to three times with exponential
  backoff and full jitter.
- **Error classification.** One `Airtable::Error` carrying `type` and
  `status_code`, with type names matching airtable.js, so teams running both
  clients get one vocabulary for their alerting.
- **Batch create/update/delete** with automatic chunking and per-record partial
  failure reporting, rather than one bad record aborting the run.
- **Upsert**, via Airtable's `performUpsert`.
- **A logger and an `on_request` callback**, so you can wire it into whatever
  you already use for metrics.

## On building it with an AI, and why the canaries matter more than the tests

The repository's history is two days long: 18 and 19 July. This was
AI-assisted work, and I want to be precise about what that means, because
"I had a model write a gem" is not a recommendation.

A client library for a public HTTP API is close to the ideal shape for this kind
of work. The specification is published. The surface is finite. And critically,
every single claim is mechanically checkable. There is no taste involved in
whether `PATCH` takes a `typecast` parameter.

So the check is where the effort went:

- Airtable's Web API documentation is extracted into the repository under
  `docs/api/`, and the code is written against that text rather than against
  anybody's recollection of it.
- 119 tests, all against WebMock. No live calls in the suite.
- A weekly workflow re-extracts Airtable's published OpenAPI contract and diffs
  it against a snapshot committed to the repo. If the live contract moves, it
  opens an issue containing the diff.
- A second weekly workflow does a real round-trip (create, find, update, batch,
  upsert, delete) against a throwaway base. If it breaks, it opens an issue.

The second pair matters more than the first. The tests prove the gem does what I
believed Airtable does. The smoke run proves Airtable still does it. That is
exactly the check the official client never had, and it is why its README could
sit there for ten years describing a credential that had been switched off,
without anything anywhere going red.

The AI wrote a lot of the code. The verification is the actual product.

## It is available, and I do not want to maintain it

I built this because I needed it, not because I want to run a gem. So it is
going to whoever wants it: the repository, and the unclaimed `airtable-rb` name
on RubyGems, transferred to someone who will look after it.

It is deliberately not published yet. Whoever takes it over should cut the first
release themselves and own the name from the start, rather than inherit
something I pushed and walked away from.

The code is at [Davidslv/airtable-rb](https://github.com/Davidslv/airtable-rb).
If you are running Ruby against Airtable in a side project or at work, and you
have opinions about what it should become, I would rather hand it to you than
watch a second Airtable Ruby client go quiet.
