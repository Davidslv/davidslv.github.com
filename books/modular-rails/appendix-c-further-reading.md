---
layout: book
book: modular_rails
title: "Appendix C: Further Reading"
permalink: /books/modular-rails/appendix-c-further-reading/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/appendix-b-quick-reference/">&larr; Appendix B: Rails Engine Quick Reference</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/appendix-d-glossary/">Appendix D: Glossary &rarr;</a>
</nav>

<h1 id="appendix-c-further-reading">Appendix C: Further Reading</h1>

<h2 id="books">Books</h2>

<ul>
  <li><strong>Clean Code</strong> by Robert C. Martin (2008) – Chapters 6 and 10 on encapsulation and class design</li>
  <li><strong>Clean Architecture</strong> by Robert C. Martin (2017) – Chapters 12-15 on component cohesion and coupling</li>
  <li><strong>Software Architecture: The Hard Parts</strong> by Neal Ford, Mark Richards, Pramod Sadalage, and Zhamak Dehghani (2021) – Trade-off analysis, data decomposition, and modularity drivers</li>
  <li><strong>Extreme Programming Explained</strong> by Kent Beck (2nd edition, 2004) – Simple design, TDD, continuous integration, and the values behind the practices</li>
  <li><strong>Domain-Driven Design</strong> by Eric Evans (2003) – Bounded contexts, ubiquitous language, and strategic design</li>
  <li><strong>Crafting Rails Applications</strong> by José Valim (2011) – The original deep dive into Rails internals, engines, and Railties</li>
  <li><strong>Agile Software Development: Principles, Patterns, and Practices</strong> by Robert C. Martin (2002) – Original formulation of the package/component design principles</li>
  <li><strong>Gradual Modularization for Ruby and Rails</strong> by Stephan Hagemann – The Packwerk-based approach to modularisation</li>
</ul>

<h2 id="key-blog-posts-and-talks">Key Blog Posts and Talks</h2>

<ul>
  <li><a href="https://medium.com/@dan_manges/the-modular-monolith-rails-architecture-fb1023826fc4">The Modular Monolith: Rails Architecture</a> by Dan Manges (Root Insurance)</li>
  <li><a href="https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity">Deconstructing the Monolith</a> by Shopify Engineering</li>
  <li><a href="https://shopify.engineering/a-packwerk-retrospective">A Packwerk Retrospective</a> by Shopify Engineering</li>
  <li><a href="https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html">The Clean Architecture</a> by Robert C. Martin</li>
  <li><a href="https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html">The Single Responsibility Principle</a> by Robert C. Martin</li>
</ul>

<h2 id="blog-posts-and-case-studies">Blog Posts and Case Studies</h2>

<ul>
  <li>“Scaling up the Prime Video audio/video monitoring service and reducing costs by 90%” by Marcin Kolny, Amazon (2023) – Microservices to monolith for cost and scalability. Originally published on primevideotech.com (site now redirects to aboutamazon.com).</li>
  <li><a href="https://www.twilio.com/en-us/blog/developers/best-practices/goodbye-microservices">Goodbye Microservices: From 100s of problem children to 1 superstar</a> by Alexandra Noonan, Segment (2018) – Team overwhelmed by microservice operational overhead</li>
  <li><a href="https://istio.io/latest/blog/2020/istiod/">Introducing istiod: simplifying the control plane</a> by Istio team (2020) – Merging four control plane microservices into one binary</li>
  <li><a href="https://blog.christianposta.com/microservices/istio-as-an-example-of-when-not-to-do-microservices/">Istio as an Example of When Not to Do Microservices</a> by Christian Posta (2020) – Analysis of Istio’s re-consolidation rationale</li>
  <li><a href="https://martinfowler.com/bliki/MonolithFirst.html">MonolithFirst</a> by Martin Fowler (2015) – Start monolithic, split only when necessary</li>
  <li><a href="https://martinfowler.com/articles/dont-start-monolith.html">Don’t start with a monolith</a> by Stefan Tilkov (2015) – Counterpoint: carve up early if microservices are the goal</li>
  <li><a href="https://signalvnoise.com/svn3/the-majestic-monolith/">The Majestic Monolith</a> by DHH (2016) – In defence of the single, integrated Rails application</li>
  <li><a href="https://signalvnoise.com/svn3/the-majestic-monolith-can-become-the-citadel/">The Majestic Monolith can become The Citadel</a> by DHH (2020) – Monolith core with satellite “outpost” services</li>
</ul>

<h2 id="talks">Talks</h2>

<ul>
  <li><a href="https://shopify.engineering/shopify-monolith">Under Deconstruction: The State of Shopify’s Monolith</a> by Kirsten Westeinde, Shopify (2020) – Packwerk, components, and lessons from a 2.8M-line Rails app</li>
  <li><a href="https://speakerdeck.com/palkan/railsconf-2020-between-monoliths-and-microservices">Between Monoliths and Microservices</a> by Vladimir Dementyev, RailsConf (2020) – Rails engines as the modular middle ground</li>
  <li><a href="https://www.rubyevents.org/talks/applying-microservices-patterns-to-a-modular-monolith">Applying Microservices Patterns to a Modular Monolith</a> by Guillermo Aguirre – Data consistency patterns inside a modular monolith</li>
</ul>

<h2 id="tools">Tools</h2>

<ul>
  <li><a href="https://github.com/Shopify/packwerk">Packwerk</a> – Shopify’s gem for enforcing package boundaries in Rails</li>
  <li><a href="https://sorbet.org/">Sorbet</a> – Stripe’s gradual type checker for Ruby</li>
  <li><a href="https://graphviz.org/">Graphviz</a> – Open-source graph visualisation for dependency diagrams</li>
</ul>

<h2 id="community-resources">Community Resources</h2>

<ul>
  <li><a href="https://guides.rubyonrails.org/engines.html">Rails Guides: Getting Started with Engines</a></li>
  <li><a href="https://cbra.info/">Component-Based Rails Applications (CBRA)</a> by Stephan Hagemann</li>
  <li><a href="https://github.com/rubyatscale">RubyAtScale</a> – Gusto’s open-source modularisation tooling</li>
</ul>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/appendix-b-quick-reference/">&larr; Appendix B: Rails Engine Quick Reference</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/appendix-d-glossary/">Appendix D: Glossary &rarr;</a>
</nav>
{% endraw %}
