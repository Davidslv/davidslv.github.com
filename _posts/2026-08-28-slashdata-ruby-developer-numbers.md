---
layout: post
title:  "SlashData counted 4.9 million Ruby developers in 2025"
date:   2026-08-28
description: "SlashData's series had 1.3 million people using Ruby in 2019 and 4.9 million in late 2025. The count is anyone who used the language. The 2024–2025 jump is the one they put down to AI tools."
image: /img/og-slashdata-ruby-developer-numbers.png
---

SlashData's 30th Developer Nation language paper, published in October 2025, put Ruby at **4.9 million** active developers. The same series, in the Q4 2019 edition, had **1.3 million**.

I wanted the years in between, and what the number actually counts.

## What the number is

SlashData does not count "professional Rails developers". Twice a year they run the Developer Nation survey, lately about 10,000 to 12,000 respondents, and they ask which languages each person used across 13 areas of development: web, backend, mobile, games, embedded, industrial IoT, and the rest. They scale those shares against their own estimate of every active software developer on earth, which they build from the survey plus GitHub, Stack Overflow, and employment statistics.

A person who touched Ruby this year counts as one, whether they maintain GitHub or ran a script once. The same person also counts in JavaScript if they used that too. Language totals therefore overlap. They add up to more than the global population.

Students and hobbyists are in the figure. Rails is not split out from Ruby. "Used" is not "primary language".

## The series

| Wave | Edition | Global developers | Ruby | Ruby as a share of the global total |
|---|---|---|---|---|
| Q4 2019 | 18th | 20.4 million | **1.3 million** | 6.4% |
| Q1 2022 | 22nd | about 31 million | not printed in the public write-up | n/a |
| Q1 2024 | 26th | about 43–45 million | **2.5 million** in the contemporary write-up, restated as **2.7 million** a year later | about 6% |
| Q1 2025 | 29th | **47 million** (36.5 million of them professional) | **4.3 million** | 9.1% |
| Q3 2025 | 30th | **48.4 million** | **4.9 million** | about 10% |
| Q1 2026 | 31st | not fully public | **not in the public summary** | n/a |

Sources for each cell sit at the end.

The Q1 2022 paper named Ruby as a backend language that grew slower than Go. It printed Go at 3.3 million and did not print a Ruby headcount.

The Q1 2024 cell disagrees with itself by 200,000. [The New Stack](https://thenewstack.io/rust-growing-fastest-but-javascript-reigns-supreme/), writing up the 26th edition at the time, printed 2.5 million. SlashData's own Q1 2025 paper, looking back, restated Q1 2024 as 2.7 million. I have kept both.

The 31st edition is out. The 22 May 2026 announcement quoted JavaScript at 27.3 million, Python at 26.3 million, Java at 24 million, and C# at 13.9 million. It did not quote Ruby. That number is in the gated PDF. Wave 32 is in the field as of August 2026.

## The jump from 2024 to 2025

From Q1 2024 to Q1 2025, Ruby added **1.6 million** people in twelve months. SlashData's sentence in the May 2025 paper:

> Ruby's developer population surged from 2.7M in Q1 2024 to 4.3M in Q1 2025.

They put that down to AI coding assistants lowering the entry barrier. In that wave, **45% of the Ruby community used AI tools**. They also report small increases in consumer electronics, industrial IoT, and embedded, so some of the new people are not web developers.

By the 30th edition they say Ruby **doubled in two years**, plus 2.8 million, to 4.9 million, "broader expansion rather than a single niche." That implies about 2.1 million two years earlier, which sits next to the 2.5–2.7 million print from Q1 2024.

## The rest of the pie grew too

Language totals rise when the global total rises, even if share is flat.

| Date | Global developers | Of whom professional |
|---|---|---|
| End of 2019 | 20.4 million | n/a |
| Q1 2022 | about 31 million | 21.8 million |
| Q1 2025 | 47 million | 36.5 million |
| Q3 2025 | 48.4 million | n/a |

Professionals grew 70% from early 2022 to early 2025. SlashData says the amateur segment shrank. Ruby's share of their world still moved from about 6% to about 10%. That is a real change in the series. It is also the part that should not be read as two million new people maintaining a Rails monolith.

## Other clocks

SlashData is an absolute headcount of "used this language". TIOBE, RedMonk, GitHub Octoverse, and Stack Overflow are relative. They do not have to agree.

Stack Overflow asks about "extensive development work in the past year". A February 2026 round-up of the [2025 Developer Survey](https://survey.stackoverflow.co/2025/technology#most-popular-technologies-language) put Ruby at **6.4% of all respondents and 6.9% of professional developers**. Apply 6.9% to SlashData's 36.5 million professionals and you get about **2.5 million** working Ruby users. That is the same order as SlashData's pre-spike print, not the 4.9 million.

Other floors that do not depend on SlashData:

- **814** people at [Rails World 2025](https://rubyonrails.org/2025/9/15/rails-world-2025-recap) in Amsterdam.
- **2,479** job postings mentioning Ruby on Rails in the 90 days to 24 August 2026, [indexed by Skillenai](https://skillenai.com/data/skill/ruby-on-rails).
- **413,156** live websites with a detectable Ruby signature in a July 2026 crawl, [reported by ruby-doc.org](https://ruby-doc.org/blog/websites-made-with-ruby-what-the-data-shows-in-2026/). Backend languages hide, so that is a floor.
- RedMonk's Q1 2025 ranking, which uses GitHub and Stack Overflow activity, had Ruby at **#9**. TIOBE, which uses search-engine mentions, had it at **#24** in the same period.

## What the free papers also cover

Besides the bar chart of millions, the language papers talk about:

- the domain where each language is most and least used
- adoption by years of experience (they say mid-career developers, three to ten years, "carry the stack")
- adoption by earnings (JavaScript and PHP lowest among high earners; C and Rust higher)
- professional versus amateur

The useful cuts, Rails versus Ruby, web-only Ruby, country, company size, sit on paid dashboards. The free PDF is the ranking and the AI paragraph.

## What they have not printed

They have not printed a Rails-only number. They have not printed a "primary language" number. They have not printed the Q1 2026 Ruby headcount in public.

The durable working population in this series is the **2.5 million** band from 2024. That is the figure that lines up with Stack Overflow's professional share applied to SlashData's own professional population. The extra bodies in 2025 are the ones SlashData explains with AI assistants and a few non-web domains.

## Sources

1. SlashData, *Sizing programming language communities*, Q1 2025 (29th edition, May 2025). Ruby 4.3 million, restated Q1 2024 as 2.7 million, 45% of Ruby developers using AI tools, 47 million developers globally, survey of 10,500+ respondents. [PDF](https://developer-economics.cdn.prismic.io/developer-economics/aCSH3SdWJ-7kSFQo_DN29SoN-Programminglanguagecommunities.pdf).
2. SlashData, *State of the Developer Nation*, Q4 2019 (18th edition). Ruby 1.3 million, 20.4 million developers globally. [PDF](https://s3-eu-west-1.amazonaws.com/vm-blog/uploads/2020/04/DE18-SoN-Digital-.pdf).
3. SlashData, 26th edition, Q1 2024, as reported by The New Stack, 7 June 2024. Ruby 2.5 million, JavaScript 25.2 million. [Article](https://thenewstack.io/rust-growing-fastest-but-javascript-reigns-supreme/).
4. SlashData, *From Hype to Data in Q4 2025*, 22 October 2025. 30th edition (DN30). Ruby 4.9 million, doubled in two years. [Blog](https://www.slashdata.co/post/from-hype-to-data-in-q4-2025-6-developer-signals-on-agentic-ai-cloud-finops-and-language-communit).
5. SlashData, 6 November 2025. Ruby 4.9 million, plus 2.8 million over two years. [X](https://x.com/SlashDataHQ/status/1986459957739282456).
6. SlashData, *Developer Population Sizing*, updated Q3 2025. 48.4 million developers globally. [Page](https://www.slashdata.co/research/developer-population).
7. SlashData, professional population 21.8 million in early 2022 to 36.5 million in early 2025, 70% growth, amateurs contracting. Population webinar, 24 April 2025. [Recording](https://www.youtube.com/live/fnaDQV07LD0).
8. SlashData, 22nd edition, Q1 2022, as reported by InfoWorld, 19 May 2022. Go 3.3 million. Ruby named, no headcount printed. [Article](https://www.infoworld.com/article/2335421/developer-survey-javascript-and-python-reign-but-rust-is-rising.html).
9. SlashData, 31st edition, Q1 2026. Survey of 11,500+ respondents in 95 countries. Public summary 22 May 2026: JavaScript 27.3 million, Python 26.3 million, Java 24 million, C# 13.9 million. Ruby not quoted. [X](https://x.com/SlashDataHQ/status/2057846589914222710). [Report page](https://www.slashdata.co/free-industry-reports/sizing-programming-language-communities).
10. SlashData, [methodology](https://www.slashdata.co/company/methodology).
11. @IT, 11 June 2025, recap of the 29th edition. Ruby plus 1.6 million year on year. [Article](https://atmarkit.itmedia.co.jp/ait/spv/2506/11/news020.html).
12. Stack Overflow Developer Survey 2025, language section. [Results](https://survey.stackoverflow.co/2025/technology#most-popular-technologies-language). Ruby at 6.4% of all respondents and 6.9% of professionals, plus RedMonk Q1 2025 at #9 and TIOBE at #24, quoted via *State of Ruby 2026*, The Dev Newsletter, 9 February 2026. [Round-up](https://devnewsletter.com/p/state-of-ruby-2026/).
13. Ruby on Rails, *Rails World 2025 Recap*, 15 September 2025. 814 attendees. [Post](https://rubyonrails.org/2025/9/15/rails-world-2025-recap).
14. Skillenai, Ruby on Rails jobs, 90 days ending 24 August 2026. 2,479 postings. [Page](https://skillenai.com/data/skill/ruby-on-rails).
15. ruby-doc.org, *Websites Made With Ruby*, July 2026 crawl. 413,156 live sites. [Post](https://ruby-doc.org/blog/websites-made-with-ruby-what-the-data-shows-in-2026/).
