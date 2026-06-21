---
layout: book
book: modular_rails
title: "Appendix D: Glossary"
permalink: /books/modular-rails/appendix-d-glossary/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/appendix-c-further-reading/">&larr; Appendix C: Further Reading</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/about-the-author/">About the Author &rarr;</a>
</nav>

<h1 id="appendix-d-glossary">Appendix D: Glossary</h1>

<p>Key terms used throughout this book, with chapter references to where each concept is first introduced or discussed in depth.</p>

<hr />

<p><strong>Acyclic Dependencies Principle (ADP)</strong> – The component dependency graph must contain no cycles. If A depends on B depends on C depends on A, you have a cycle – break it with dependency inversion or extract a shared component. (Ch11)</p>

<p><strong>ActiveSupport::Notifications</strong> – Rails’ built-in publish/subscribe mechanism for dispatching and subscribing to in-process events. Used to decouple engines that need to react to each other’s actions without direct dependencies. (Ch8)</p>

<p><strong>Bounded context</strong> – A Domain-Driven Design concept describing a boundary within which a particular domain model is defined and applicable. Different bounded contexts may use the same word (e.g., “account”) to mean different things. (Ch9)</p>

<p><strong>Co-change frequency</strong> – A metric measuring how often files in different components change in the same commit. High co-change frequency between two engines suggests they are coupled and may belong together – or that their boundary is drawn in the wrong place. (Ch9, Ch18)</p>

<p><strong>Common Closure Principle (CCP)</strong> – Classes that change for the same reason and at the same time belong in the same component. The component-level equivalent of the Single Responsibility Principle. (Ch2)</p>

<p><strong>Common Reuse Principle (CRP)</strong> – Don’t force users of a component to depend on things they don’t need. If you only use one class from a gem or engine, you shouldn’t be forced to pull in everything else it contains. (Ch2)</p>

<p><strong>Concern</strong> – An <code>ActiveSupport::Concern</code> module that encapsulates shared behaviour and can be mixed into models or controllers. In engine-based architectures, concerns are the primary integration pattern – the host application’s models include concerns provided by engines. (Ch7, Ch8)</p>

<p><strong>Connascence</strong> – A taxonomy of coupling between software components. Two components are connascent if a change to one could require a change to the other. Ranges from weak forms (connascence of name) to strong forms (connascence of identity). (Ch3)</p>

<p><strong>Data sovereignty</strong> – The degree to which a component owns and controls its own data storage and schema. Full data sovereignty means an engine manages its own tables and no other engine reads or writes them directly. (Ch12)</p>

<p><strong>Dependency inversion</strong> – Depending on abstractions rather than concrete implementations. In engine architectures: using configuration blocks, concerns, and callback hooks instead of hardcoded class references to the host application. (Ch2, Ch8)</p>

<p><strong>Dependency rule</strong> – Source code dependencies must point inward, toward higher-level policies. Low-level engines (infrastructure, utilities) should never depend on high-level engines (domain, business rules). (Ch2)</p>

<p><strong>Dummy app</strong> – A minimal Rails application inside an engine’s <code>test/</code> or <code>spec/dummy</code> directory, used to boot and test the engine in isolation without the full host application. (Ch7)</p>

<p><strong>Engine</strong> – A <code>Rails::Engine</code> subclass that packages a self-contained Rails application – models, controllers, views, routes, migrations – within a host application. The fundamental building block of a modular Rails monolith. (Ch5)</p>

<p><strong>Fitness function</strong> – An automated, objective metric that evaluates whether the architecture is meeting a specific goal. Examples include coupling scores, test execution time, and dependency graph cycle counts. (Ch3, Ch18)</p>

<p><strong>Full engine</strong> – An engine generated with <code>--full</code>, without namespace isolation. Models, routes, and helpers merge directly into the host application. Suitable for framework extensions like Devise, but not for domain isolation. (Ch5)</p>

<p><strong>Host application</strong> – The main Rails application that mounts engines via its <code>Gemfile</code> and <code>config/routes.rb</code>. It provides the shared runtime, database connection, and user-facing entry point. (Ch5)</p>

<p><strong>isolate_namespace</strong> – The <code>Rails::Engine</code> class method that creates structural boundaries around an engine: namespaced models, prefixed database tables, isolated route helpers, and scoped views. The single most important line in a mountable engine. (Ch6)</p>

<p><strong>Modular monolith</strong> – A single deployable application whose internals are divided into modules with explicit boundaries, enforced dependencies, and independent tests. Provides most of the organisational benefits of microservices without the operational overhead. (Ch17)</p>

<p><strong>Mountable engine</strong> – An engine generated with <code>--mountable</code>, which calls <code>isolate_namespace</code> automatically. Used for domain isolation – each mountable engine gets its own namespace, table prefix, and route scope. (Ch5, Ch7)</p>

<p><strong>mattr_accessor</strong> – A module-level attribute accessor provided by ActiveSupport. Commonly used to expose configuration options on an engine’s top-level module, allowing the host application to set values without coupling to internals. (Ch8)</p>

<p><strong>Plain Ruby gem</strong> – A Ruby gem with no Rails dependency, used as an isolation mechanism for framework-independent business logic. Sits between namespaces and engines on the isolation spectrum – provides packaging, versioning, and cross-application reuse without Rails overhead. Best suited for domains that don’t need models, routes, or views. (Ch2, Ch15, Ch16)</p>

<p><strong>Packwerk</strong> – Shopify’s open-source static analysis tool for enforcing module boundaries within a Rails application. Uses package definitions and dependency declarations rather than structural isolation via engines. (Ch16)</p>

<p><strong>Railtie</strong> – The base class in Rails’ boot system. Every major framework component (Active Record, Action Pack), every engine, and the application itself inherits from <code>Rails::Railtie</code>. Understanding Railties is understanding how Rails starts. (Ch5)</p>

<p><strong>Shared kernel</strong> – A small, deliberately stable set of models, concerns, or value objects shared between multiple engines. A Domain-Driven Design pattern – the shared kernel should be versioned carefully and changed only by agreement between the teams that depend on it. (Ch8, Ch11)</p>

<p><strong>Solid Queue / Solid Cache / Solid Cable</strong> – Rails 8’s database-backed replacements for Redis-based job processing, caching, and WebSocket infrastructure. They simplify deployment of modular monoliths by removing external service dependencies. (Ch5)</p>

<p><strong>Strangler fig pattern</strong> – A migration strategy that gradually replaces parts of a legacy system by routing functionality to new components while the old ones remain operational. Named after the strangler fig tree that grows around its host. (Ch10)</p>

<p><strong>Zeitwerk</strong> – Rails’ code autoloader, introduced in Rails 6. Maps file paths to constant names using naming conventions and handles lazy loading. Understanding Zeitwerk is essential for getting engine namespacing right. (Ch5)</p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/appendix-c-further-reading/">&larr; Appendix C: Further Reading</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/about-the-author/">About the Author &rarr;</a>
</nav>
{% endraw %}
