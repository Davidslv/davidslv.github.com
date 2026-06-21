---
layout: default
title: Archive
permalink: /archive/
---

<style>
  .archive-intro { color: var(--meta-color); margin: 0 0 1.9rem; }
  .archive-year { margin: 0 0 1.7rem; }
  .archive-year h2 {
    font-size: 1.05rem; color: var(--meta-color); font-weight: 600; letter-spacing: .04em;
    margin: 0 0 .55rem; padding-bottom: .35rem; border-bottom: 1px solid var(--border-color);
  }
  .archive-list { list-style: none; margin: 0; padding: 0; }
  .archive-list li { display: flex; gap: 1rem; align-items: baseline; padding: .32rem 0; }
  .archive-list .d {
    color: var(--meta-color); font-variant-numeric: tabular-nums;
    white-space: nowrap; min-width: 3.6rem; font-size: .85rem;
  }
  .archive-list a { text-decoration: none; }
  .archive-list a:hover { text-decoration: underline; }
</style>

<div class="post">
  <header class="post-header">
    <h1 class="post-title">Archive</h1>
  </header>
  <article class="post-content">
    <p class="archive-intro">Everything I&rsquo;ve written, newest first &mdash; {{ site.posts.size }} posts.</p>

    {% assign byYear = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
    {% for year in byYear %}
    <section class="archive-year">
      <h2>{{ year.name }}</h2>
      <ul class="archive-list">
        {% for post in year.items %}
        <li>
          <span class="d">{{ post.date | date: "%b %-d" }}</span>
          <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
        </li>
        {% endfor %}
      </ul>
    </section>
    {% endfor %}
  </article>
</div>
