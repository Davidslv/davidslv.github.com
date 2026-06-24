---
layout: book
book: modular_rails
title: "The Microservices Question"
permalink: /books/modular-rails/chapter-17-the-microservices-question/
description: "Modular monolith vs microservices for Rails — when distribution is genuinely necessary, with the Amazon Prime Video case study and DHH's take."
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-16-engines-vs-alternatives/">&larr; Engines vs the Alternatives</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-18-evolving-your-architecture/">Evolving Your Architecture Over Time &rarr;</a>
</nav>

<h1 id="chapter-17-the-microservices-question">Chapter 17: The Microservices Question</h1>

<p><em>For the bigger picture, <a href="/modular-monolith-rails/">The Modular Monolith in Rails</a> is a free overview of why a well-bounded monolith beats microservices for most teams.</em></p>

<blockquote>
  <p><em>“Microservices pose perhaps the biggest siren song for needlessly complicating your system.”</em><br />
– David Heinemeier Hansson</p>
</blockquote>

<p>In 2023, a team at Amazon Prime Video published a case study about their Video Quality Analysis (VQA) monitoring tool – a specific internal service, not the Prime Video platform itself. They moved it from a distributed, microservice-based architecture to a monolith, reducing infrastructure costs by over 90%. The system that was supposed to benefit from distribution was drowning in it.</p>

<p>This chapter isn’t anti-microservices. Distribution is sometimes the right answer. But it’s rarely the first answer, and the Rails community specifically has been poorly served by the assumption that “at scale, you need microservices.”</p>

<hr />

<h2 id="when-distribution-is-genuinely-necessary">When Distribution Is Genuinely Necessary</h2>

<p>Microservices solve specific problems that monoliths – even modular monoliths with engines – cannot:</p>

<p><strong>Different scaling requirements.</strong> If your billing system processes 100 requests per second and your real-time notifications system processes 100,000, they need different infrastructure. Scaling a monolith to handle the notification load means over-provisioning billing.</p>

<p><strong>Different technology requirements.</strong> If your billing system is best served by Ruby on Rails and your machine learning pipeline is best served by Python, they can’t share a runtime.</p>

<p><strong>Organisational independence at scale.</strong> When you have 200+ engineers and 20+ teams, the coordination cost of a shared codebase becomes prohibitive even with engines. Teams need to deploy independently with different release cadences.</p>

<p><strong>Fault isolation.</strong> If a bug in the notification system must not bring down the billing system, process-level isolation (separate services) is the only guarantee. Engine isolation is code-level, not process-level.</p>

<p><strong>Regulatory requirements.</strong> Some compliance frameworks require that certain systems run in separate environments with independent access controls that go beyond what database-level separation provides.</p>

<p>If none of these apply to you, you probably don’t need microservices.</p>

<hr />

<h2 id="the-operational-cost-nobody-talks-about">The Operational Cost Nobody Talks About</h2>

<p>The microservices narrative focuses on the benefits: independent deployment, team autonomy, technology flexibility. The costs are less discussed.</p>

<h3 id="network-latency">Network latency</h3>

<p>A function call in a monolith takes nanoseconds. An HTTP request between services takes milliseconds. That’s six orders of magnitude slower. A user action that traverses five services, each adding 5-10ms of network overhead plus processing time, accumulates 50-100ms of latency that didn’t exist in the monolith.</p>

<h3 id="distributed-debugging">Distributed debugging</h3>

<p>In a monolith, a bug is a stack trace. In microservices, a bug is a distributed puzzle. You need correlation IDs to trace a request across services, centralised logging to aggregate events, and distributed tracing tools (Jaeger, Zipkin) to visualise the flow. These tools have their own operational cost – someone has to deploy, maintain, and pay for them.</p>

<h3 id="data-consistency">Data consistency</h3>

<p>In a monolith, creating an invoice and recording a payment is a single database transaction. ACID guarantees that either both happen or neither does.</p>

<p>In microservices, there’s no cross-service transaction. You need sagas (a series of compensating transactions), eventual consistency (accept that data will be temporarily inconsistent), or the outbox pattern (publish events through a transactional outbox). Each adds complexity and failure modes.</p>

<p>Let’s make this concrete. Here’s the same operation – recording a payment against an invoice – in both architectures:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In a modular monolith -- single database transaction</span>
<span class="k">class</span> <span class="nc">Billing::RecordPayment</span>
  <span class="k">def</span> <span class="nf">call</span><span class="p">(</span><span class="n">invoice_id</span><span class="p">:,</span> <span class="n">amount_cents</span><span class="p">:,</span> <span class="n">payment_method</span><span class="p">:)</span>
    <span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span><span class="p">.</span><span class="nf">transaction</span> <span class="k">do</span>
      <span class="n">invoice</span> <span class="o">=</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">lock</span><span class="p">.</span><span class="nf">find</span><span class="p">(</span><span class="n">invoice_id</span><span class="p">)</span>
      <span class="n">payment</span> <span class="o">=</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Payment</span><span class="p">.</span><span class="nf">create!</span><span class="p">(</span>
        <span class="ss">invoice: </span><span class="n">invoice</span><span class="p">,</span>
        <span class="ss">amount_cents: </span><span class="n">amount_cents</span><span class="p">,</span>
        <span class="ss">payment_method: </span><span class="n">payment_method</span><span class="p">,</span>
        <span class="ss">paid_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span>
      <span class="p">)</span>
      <span class="n">invoice</span><span class="p">.</span><span class="nf">update!</span><span class="p">(</span><span class="ss">status: :paid</span><span class="p">,</span> <span class="ss">paid_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span>

      <span class="no">ActiveSupport</span><span class="o">::</span><span class="no">Notifications</span><span class="p">.</span><span class="nf">instrument</span><span class="p">(</span><span class="s2">"invoice.paid.billing"</span><span class="p">,</span> <span class="p">{</span>
        <span class="ss">invoice_id: </span><span class="n">invoice</span><span class="p">.</span><span class="nf">id</span><span class="p">,</span> <span class="ss">amount_cents: </span><span class="n">amount_cents</span>
      <span class="p">})</span>

      <span class="n">payment</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>15 lines. One transaction. If anything fails, everything rolls back.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In microservices -- distributed saga across two services</span>
<span class="k">class</span> <span class="nc">PaymentSaga</span>
  <span class="k">def</span> <span class="nf">call</span><span class="p">(</span><span class="n">invoice_id</span><span class="p">:,</span> <span class="n">amount_cents</span><span class="p">:,</span> <span class="n">payment_method</span><span class="p">:)</span>
    <span class="n">payment</span> <span class="o">=</span> <span class="kp">nil</span>
    <span class="n">invoice_updated</span> <span class="o">=</span> <span class="kp">false</span>

    <span class="c1"># Step 1: Create payment via Payment Service</span>
    <span class="k">begin</span>
      <span class="n">response</span> <span class="o">=</span> <span class="no">PaymentService</span><span class="p">.</span><span class="nf">client</span><span class="p">.</span><span class="nf">post</span><span class="p">(</span><span class="s2">"/payments"</span><span class="p">,</span> <span class="p">{</span>
        <span class="ss">invoice_id: </span><span class="n">invoice_id</span><span class="p">,</span>
        <span class="ss">amount_cents: </span><span class="n">amount_cents</span><span class="p">,</span>
        <span class="ss">payment_method: </span><span class="n">payment_method</span>
      <span class="p">})</span>
      <span class="n">payment</span> <span class="o">=</span> <span class="n">response</span><span class="p">.</span><span class="nf">body</span>
    <span class="k">rescue</span> <span class="no">PaymentService</span><span class="o">::</span><span class="no">Error</span> <span class="o">=&gt;</span> <span class="n">e</span>
      <span class="c1"># Payment failed -- nothing to compensate yet</span>
      <span class="k">raise</span> <span class="no">PaymentFailed</span><span class="p">,</span> <span class="n">e</span><span class="p">.</span><span class="nf">message</span>
    <span class="k">end</span>

    <span class="c1"># Step 2: Mark invoice as paid via Billing Service</span>
    <span class="k">begin</span>
      <span class="no">BillingService</span><span class="p">.</span><span class="nf">client</span><span class="p">.</span><span class="nf">patch</span><span class="p">(</span><span class="s2">"/invoices/</span><span class="si">#{</span><span class="n">invoice_id</span><span class="si">}</span><span class="s2">"</span><span class="p">,</span> <span class="p">{</span>
        <span class="ss">status: </span><span class="s2">"paid"</span><span class="p">,</span>
        <span class="ss">paid_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">.</span><span class="nf">iso8601</span>
      <span class="p">})</span>
      <span class="n">invoice_updated</span> <span class="o">=</span> <span class="kp">true</span>
    <span class="k">rescue</span> <span class="no">BillingService</span><span class="o">::</span><span class="no">Error</span> <span class="o">=&gt;</span> <span class="n">e</span>
      <span class="c1"># Invoice update failed -- must reverse the payment</span>
      <span class="no">PaymentService</span><span class="p">.</span><span class="nf">client</span><span class="p">.</span><span class="nf">post</span><span class="p">(</span><span class="s2">"/payments/</span><span class="si">#{</span><span class="n">payment</span><span class="p">[</span><span class="s1">'id'</span><span class="p">]</span><span class="si">}</span><span class="s2">/refund"</span><span class="p">)</span>
      <span class="k">raise</span> <span class="no">InvoiceUpdateFailed</span><span class="p">,</span> <span class="n">e</span><span class="p">.</span><span class="nf">message</span>
    <span class="k">end</span>

    <span class="c1"># Step 3: Publish event for downstream consumers</span>
    <span class="k">begin</span>
      <span class="no">EventBus</span><span class="p">.</span><span class="nf">publish</span><span class="p">(</span><span class="s2">"invoice.paid"</span><span class="p">,</span> <span class="p">{</span>
        <span class="ss">invoice_id: </span><span class="n">invoice_id</span><span class="p">,</span>
        <span class="ss">amount_cents: </span><span class="n">amount_cents</span>
      <span class="p">})</span>
    <span class="k">rescue</span> <span class="no">EventBus</span><span class="o">::</span><span class="no">Error</span> <span class="o">=&gt;</span> <span class="n">e</span>
      <span class="c1"># Payment happened. Invoice updated. But event never published.</span>
      <span class="c1"># Downstream services will never know.</span>
      <span class="c1"># Now what? Retry? Dead letter queue?</span>
      <span class="c1"># If we reverse both operations, the customer's money is in limbo.</span>
      <span class="c1"># If we don't, downstream state is permanently inconsistent.</span>
      <span class="no">Rails</span><span class="p">.</span><span class="nf">logger</span><span class="p">.</span><span class="nf">error</span><span class="p">(</span><span class="s2">"CRITICAL: invoice.paid event lost for </span><span class="si">#{</span><span class="n">invoice_id</span><span class="si">}</span><span class="s2">"</span><span class="p">)</span>
    <span class="k">end</span>

    <span class="n">payment</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>40 lines. Two HTTP calls. Two failure modes requiring compensating transactions. A third with no clean recovery. And we haven’t handled: network timeouts, idempotency keys, retry logic, or the case where the compensating transaction itself fails.</p>

<p>This is the same operation. The code complexity difference is not 2x – it’s an order of magnitude, and the failure modes multiply.</p>

<h3 id="deployment-multiplication">Deployment multiplication</h3>

<p>One service needs CI, monitoring, alerting, logging, a deployment pipeline, health checks, and an on-call rotation. Ten services need ten of each. The operational overhead scales linearly with service count.</p>

<h3 id="testing-complexity">Testing complexity</h3>

<p>In a monolith, an integration test boots one application and exercises the complete workflow. In microservices, an integration test requires spinning up multiple services, managing their dependencies, and dealing with network variability. Contract testing (Pact, etc.) helps but adds its own tooling layer.</p>

<h3 id="operational-cost-at-a-glance">Operational cost at a glance</h3>

<div class="diagram"><img src="/img/books/modular-rails/7e0050a15d935eaa3e7f25bbec3a82532ed3c14149e37c109e06a1b8b05da74f.svg" alt="Mermaid diagram: Monolith — 1x"></div>

<p>The cost of microservices scales linearly with service count. Each service needs its own CI, monitoring, alerting, logging, deployment pipeline, health checks, and on-call rotation. A modular monolith with engines adds only marginal overhead (roughly 1.2x) while providing most of the architectural benefits.</p>

<hr />

<h2 id="companies-that-went-to-microservices-and-came-back">Companies That Went to Microservices and Came Back</h2>

<p>These aren’t hypothetical scenarios:</p>

<p><strong>Amazon Prime Video</strong> (2023): A team responsible for the Video Quality Analysis (VQA) monitoring tool moved it from AWS Step Functions and Lambda-based microservices to a monolith. Reduced infrastructure costs by over 90% for that specific service. The orchestration overhead of their distributed architecture was the bottleneck, not the compute.</p>

<p><strong>Segment</strong> (2018): Broke out ~140 event destination integrations into individual microservices for isolation. Spent years dealing with the operational overhead before consolidating them back into a single service called Centrifuge. The per-destination microservice model didn’t justify the costs for their team size and use case.</p>

<p><strong>Istio</strong> (2020): A service mesh tool – software that exists to make microservices work – merged all its microservice components into a single binary (<code>istiod</code>) in version 1.5. Dramatically reduced deployment complexity, cut resource consumption, and eliminated an entire class of failure modes. The irony is hard to miss.</p>

<p><strong>Shopify</strong> (ongoing): The largest Rails monolith in the world. Handles millions of requests per minute at peak. Deliberately chose a modular monolith over microservices. Their reasoning: microservices “would bring their own whole suite of problems” while a modular monolith gives “the advantages of both monoliths and microservices without so many of the downsides.”</p>

<hr />

<h2 id="engines-as-a-stepping-stone">Engines as a Stepping Stone</h2>

<p>This is the pragmatic argument for engines: they give you an exit path without locking you in.</p>

<p>An engine that’s properly isolated – its own namespace, its own tests, clear integration points, event-based communication – is one step away from being a service. The boundary is already drawn. The interface is already defined. Promoting it to a service means:</p>

<div class="diagram"><img src="/img/books/modular-rails/b60da219aee3afa6728296ba519c7c9372fe943cb72fb6e7d37980d3ed5a4085.svg" alt="Mermaid diagram: Engine (isolated, tested, event-driven)"></div>

<ol>
  <li>Create a new Rails application</li>
  <li>Move the engine’s code into it</li>
  <li>Replace the concern-based integration with API calls</li>
  <li>Replace <code>ActiveSupport::Notifications</code> events with HTTP webhooks or message queue events</li>
  <li>Set up independent deployment</li>
</ol>

<p>Steps 1 and 2 are mechanical. Steps 3 and 4 are the real work – but they’re well-defined because the interface already exists. Without engines, step 0 would be “figure out which code belongs to billing and disentangle it from everything else.” That’s the step that takes months.</p>

<h3 id="the-reverse-is-also-true">The reverse is also true</h3>

<p>If you have a service that’s more trouble than it’s worth – it doesn’t need independent scaling, it doesn’t use a different technology, and the operational overhead is crushing – you can demote it back to an engine:</p>

<ol>
  <li>Create an engine in the host application</li>
  <li>Move the service’s models, controllers, and business logic into the engine</li>
  <li>Replace API calls with concern includes and direct method calls</li>
  <li>Replace message queue events with <code>ActiveSupport::Notifications</code></li>
  <li>Decommission the service’s infrastructure</li>
</ol>

<p>This is easier than the promotion path because you’re reducing complexity, not adding it. The engine’s dummy app gives you isolated tests without the operational overhead of a separate deployment.</p>

<hr />

<h2 id="the-modular-monolith-as-the-default-starting-point">The Modular Monolith as the Default Starting Point</h2>

<p>Robert C. Martin writes: <em>“A good architect maximizes the number of decisions not made.”</em></p>

<p>Starting with a modular monolith (engines) instead of microservices maximises the decisions you haven’t made:</p>

<ul>
  <li>You haven’t committed to a network protocol between domains</li>
  <li>You haven’t committed to a data consistency model</li>
  <li>You haven’t committed to separate deployment infrastructure</li>
  <li>You haven’t committed to distributed monitoring and tracing</li>
  <li>You haven’t committed to a service mesh or API gateway</li>
</ul>

<p>All of these decisions can still be made later, with more information, at lower cost. The engine boundaries are already there. Promoting to a service is a known, well-defined process.</p>

<p>Starting with microservices, on the other hand, commits you to all of these decisions immediately, before you have the information to make them well. And reversing those decisions – merging services back into a monolith – is painful and expensive.</p>

<h3 id="the-decision-framework">The decision framework</h3>

<div class="diagram"><img src="/img/books/modular-rails/59e7d368935babdf382d0b8a9cdd981f46ccdf77e313dd8cc7827c37202ce695.svg" alt="Mermaid diagram: 1. Is a single Rails app&lt;br/&gt;sufficient?"></div>

<p>Ask these questions in order:</p>

<ol>
  <li><strong>Is a single Rails application sufficient?</strong> If yes, stop. Use namespaces and good code organisation.</li>
  <li><strong>Do different domains need structural isolation?</strong> If yes, use engines. If no, stay with step 1.</li>
  <li><strong>Do different domains need process-level isolation?</strong> If yes, promote specific engines to services. If no, stay with step 2.</li>
  <li><strong>Do different domains need technology-level isolation?</strong> If yes, build separate services with appropriate technology. If no, stay with step 3.</li>
</ol>

<p>Most applications never get past step 2. And that’s fine. Step 2 – a modular monolith with engines – gives you clean boundaries, independent testing, team scalability, and the option to promote to services later. It’s the architectural sweet spot for the vast majority of Rails applications.</p>

<hr />

<p><em>Microservices are a tool for specific problems at specific scales. For most Rails applications, a modular monolith with engines provides the same architectural benefits without the operational cost. In the final chapter, we’ll discuss how to evolve your architecture over time as your context changes.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-16-engines-vs-alternatives/">&larr; Engines vs the Alternatives</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-18-evolving-your-architecture/">Evolving Your Architecture Over Time &rarr;</a>
</nav>
{% endraw %}
