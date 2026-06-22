---
layout: book
book: modular_rails
title: "Extreme Programming and Emergent Design"
permalink: /books/modular-rails/chapter-04-extreme-programming-and-emergent-design/
description: "Why solid Rails architecture emerges through feedback and simple design rather than big up-front planning — Kent Beck's XP applied to engines."
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-03-the-hard-parts/">&larr; The Hard Parts — Reasoning About Trade-offs</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-05-rails-engines-from-the-inside-out/">Rails Engines from the Inside Out &rarr;</a>
</nav>

<h1 id="chapter-4-extreme-programming-and-emergent-design">Chapter 4: Extreme Programming and Emergent Design</h1>

<blockquote>
  <p><em>“Make it work, make it right, make it fast.”</em><br />
– Popularised by Kent Beck; originally from Stephen C. Johnson and Brian W. Kernighan (1983)</p>
</blockquote>

<p>Most architecture books treat design as something you do before you write code. Draw the boxes. Draw the arrows. Label the boundaries. Then build.</p>

<p>Kent Beck’s Extreme Programming argues for the opposite: design emerges from the code itself, driven by tests, guided by refactoring, validated by continuous integration. The architecture isn’t a precondition for development – it’s a consequence of disciplined development.</p>

<p>This might sound incompatible with a book about modular architecture. It’s not. It’s the foundation. Without XP’s practices, boundaries decay. With them, boundaries emerge naturally and stay healthy over time.</p>

<hr />

<h2 id="simple-design-the-four-rules">Simple Design: The Four Rules</h2>

<p>Beck’s four rules of simple design are the most underrated architectural tool in software:</p>

<ol>
  <li><strong>Passes the tests</strong> – the system does what it’s supposed to do</li>
  <li><strong>Reveals intention</strong> – the code is readable and its purpose is clear</li>
  <li><strong>No duplication</strong> – every piece of knowledge has a single, unambiguous representation</li>
  <li><strong>Fewest elements</strong> – there is nothing that could be removed without violating the first three rules</li>
</ol>

<p>At the class level, these are coding guidelines. At the architectural level, they become decision-making tools.</p>

<h3 id="when-to-create-an-engine">When to create an engine</h3>

<p>Apply the four rules to the question “should I extract this into an engine?”</p>

<p><strong>Rule 1 – Passes the tests:</strong> Are your tests for this domain passing? Can you even run them independently? If testing billing requires booting the entire notification system, you have a coupling problem. An engine with its own dummy app would let you test billing in isolation.</p>

<p><strong>Rule 2 – Reveals intention:</strong> Does your directory structure communicate the architecture? When a new developer opens <code>app/models/</code> and sees 200 files, what does that reveal about your system’s structure? Nothing. When they see <code>engines/billing/</code> and <code>engines/notifications/</code>, the architecture is visible in the file tree.</p>

<p><strong>Rule 3 – No duplication:</strong> Are you duplicating concepts across domains? If three different parts of your application each implement their own notification mechanism because there’s no clear notification boundary, that’s architectural duplication. An engine consolidates that knowledge.</p>

<p><strong>Rule 4 – Fewest elements:</strong> Don’t create an engine until you need one. A three-model domain that only one team touches doesn’t need its own engine. The overhead isn’t worth it. Rule four is your guard against premature modularisation.</p>

<p>The four rules tell you to wait until the design pressure is real. Don’t create boundaries because a book told you to. Create them when the absence of a boundary is making your tests slow, your intentions unclear, your knowledge duplicated, or your system needlessly complex.</p>

<hr />

<h2 id="tdd-as-a-design-tool-not-just-a-testing-tool">TDD as a Design Tool, Not Just a Testing Tool</h2>

<p>Test-Driven Development is commonly understood as a testing practice. Write a test, make it pass, refactor. But Beck’s original intent was broader: TDD is a <strong>design</strong> practice. The tests drive you toward better interfaces, smaller components, and clearer boundaries.</p>

<h3 id="how-test-pain-reveals-architecture">How test pain reveals architecture</h3>

<p>Here’s a scenario every Rails developer has experienced. You’re writing a test for a billing feature:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># spec/models/invoice_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="no">Invoice</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:user</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:user</span><span class="p">,</span> <span class="ss">:with_subscription</span><span class="p">,</span> <span class="ss">:verified</span><span class="p">)</span> <span class="p">}</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:plan</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:plan</span><span class="p">,</span> <span class="ss">:premium</span><span class="p">,</span> <span class="ss">trial_days: </span><span class="mi">0</span><span class="p">)</span> <span class="p">}</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">,</span> <span class="ss">plan: </span><span class="n">plan</span><span class="p">)</span> <span class="p">}</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:payment_method</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:payment_method</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">before</span> <span class="k">do</span>
    <span class="n">create</span><span class="p">(</span><span class="ss">:notification_preference</span><span class="p">,</span> <span class="ss">user: </span><span class="n">user</span><span class="p">)</span> <span class="c1"># Why is this here?</span>
    <span class="n">create</span><span class="p">(</span><span class="ss">:team</span><span class="p">,</span> <span class="ss">owner: </span><span class="n">user</span><span class="p">)</span>                   <span class="c1"># And this?</span>
    <span class="n">stub_request</span><span class="p">(</span><span class="ss">:post</span><span class="p">,</span> <span class="sr">/stripe.com/</span><span class="p">)</span>            <span class="c1"># And this?</span>
  <span class="k">end</span>

  <span class="n">it</span> <span class="s2">"calculates the correct amount"</span> <span class="k">do</span>
    <span class="n">invoice</span> <span class="o">=</span> <span class="no">Invoice</span><span class="p">.</span><span class="nf">generate</span><span class="p">(</span><span class="ss">subscription: </span><span class="n">subscription</span><span class="p">)</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">invoice</span><span class="p">.</span><span class="nf">amount_cents</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="mi">2999</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Look at the setup. To test that an invoice calculates the right amount, you need to create a notification preference, a team, and stub Stripe. Why? Because <code>User</code> has validations that require notification preferences. Because <code>Subscription</code> triggers a callback that creates a team record. Because <code>Invoice.generate</code> calls Stripe inline.</p>

<p>The test is telling you something: <strong>billing is coupled to notifications, team management, and payment processing in ways that aren’t necessary for this calculation.</strong></p>

<p>This is test pain. And it’s a design signal.</p>

<h3 id="tdd-inside-an-engine">TDD inside an engine</h3>

<p>Now imagine billing lives in an engine. The engine has its own dummy app, its own test suite, and its own factory setup:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/spec/models/billing/invoice_spec.rb</span>

<span class="no">RSpec</span><span class="p">.</span><span class="nf">describe</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span> <span class="k">do</span>
  <span class="n">let</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">)</span> <span class="p">{</span> <span class="n">create</span><span class="p">(</span><span class="ss">:subscription</span><span class="p">)</span> <span class="p">}</span>

  <span class="n">it</span> <span class="s2">"calculates the correct amount"</span> <span class="k">do</span>
    <span class="n">invoice</span> <span class="o">=</span> <span class="n">described_class</span><span class="p">.</span><span class="nf">generate</span><span class="p">(</span><span class="ss">subscription: </span><span class="n">subscription</span><span class="p">)</span>
    <span class="n">expect</span><span class="p">(</span><span class="n">invoice</span><span class="p">.</span><span class="nf">amount_cents</span><span class="p">).</span><span class="nf">to</span> <span class="n">eq</span><span class="p">(</span><span class="mi">2999</span><span class="p">)</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>No notification preferences. No team creation. No Stripe stubs (because the engine delegates payment processing through a configurable interface, not a hardcoded call). The test is clean because the boundary prevents the coupling from existing in the first place.</p>

<p>The dummy app doesn’t have a notification system. It can’t create team records. The billing engine’s factories only create what the billing domain needs. The test runs in milliseconds instead of seconds.</p>

<p>This is what TDD was always meant to feel like. The engine boundary doesn’t just organise code – it eliminates an entire class of test setup that was only there because of missing boundaries.</p>

<h3 id="the-red-green-refactor-loop-inside-an-engine">The red-green-refactor loop inside an engine</h3>

<div class="diagram"><img src="/img/books/modular-rails/86e07ed076a75c0f5cc0e6dc636afad2a09d064654bfa846f2b1a057c0dec0ca.svg" alt="Mermaid diagram: RED\nWrite a failing test"></div>

<p>When you’re developing a new feature in an engine, the TDD loop is tight:</p>

<ol>
  <li><strong>Red:</strong> Write a failing test in <code>engines/billing/spec/</code></li>
  <li><strong>Green:</strong> Write the minimal code in <code>engines/billing/app/</code> to make it pass</li>
  <li><strong>Refactor:</strong> Clean up, knowing the blast radius is contained within the engine</li>
</ol>

<p>Run the engine’s tests: <code>cd engines/billing &amp;&amp; bundle exec rspec</code>. The suite loads only the billing engine and its dummy app. It finishes in seconds, not minutes. You get feedback immediately.</p>

<p>Compare this to the typical Rails monolith workflow: run a test, wait 30 seconds for the app to boot, wait another 60 seconds for the test suite to run, discover that your change broke an unrelated test in the notification module. With engines, that feedback loop collapses.</p>

<hr />

<h2 id="refactoring-toward-boundaries">Refactoring Toward Boundaries</h2>

<p>XP doesn’t advocate for designing the perfect architecture upfront. It advocates for starting simple and refactoring as understanding grows. Applied to Rails architecture, this means:</p>

<ol>
  <li>Start with everything in the host application</li>
  <li>Observe which areas of the code change together and which change independently</li>
  <li>Notice where test pain, merge conflicts, and accidental coupling concentrate</li>
  <li>Extract an engine when the boundary becomes obvious from the code itself</li>
</ol>

<p>This is emergent design at the architectural level. The boundaries aren’t drawn on a whiteboard – they emerge from the practice of building, testing, and refactoring.</p>

<h3 id="a-practical-example">A practical example</h3>

<p>Let’s say your application has billing logic spread across several files:</p>

<pre><code>app/
  models/
    invoice.rb
    subscription.rb
    payment.rb
    plan.rb
  controllers/
    invoices_controller.rb
    subscriptions_controller.rb
  services/
    invoice_generator.rb
    payment_processor.rb
    subscription_renewal_service.rb
  mailers/
    billing_mailer.rb
</code></pre>

<p>You notice patterns:</p>

<ul>
  <li>These eight files change together in commits. When the billing rules change, you touch <code>invoice.rb</code>, <code>invoice_generator.rb</code>, and <code>subscription.rb</code> in the same pull request.</li>
  <li>They rarely change alongside files in <code>app/models/notification.rb</code> or <code>app/controllers/admin/users_controller.rb</code>.</li>
  <li>Your billing tests are slow because they load the entire application, including the admin panel, notification system, and reporting module.</li>
  <li>New developers keep accidentally coupling billing models to unrelated concerns.</li>
</ul>

<p>These are the signals. The code is telling you: “these files belong together, and they don’t belong with the rest.”</p>

<p>The refactoring is incremental:</p>

<p><strong>Step 1: Namespace within the host app.</strong> Move billing models into <code>app/models/billing/</code>. This is a cheap, reversible step that tests whether the boundary makes sense.</p>

<p><strong>Step 2: Extract shared interfaces.</strong> Identify where billing code reaches into non-billing code. Replace direct references with interfaces (concerns, configuration, events).</p>

<p><strong>Step 3: Generate the engine.</strong> <code>rails plugin new engines/billing --mountable</code>. Move the namespaced code into the engine. Wire up the integration points. Run both test suites.</p>

<p><strong>Step 4: Verify.</strong> The engine’s tests run independently. The host app’s integration tests pass. The boundary holds.</p>

<p>Each step is a small, safe refactoring. At any point you can stop and you still have a working system. The architecture emerges from the refactoring, not from a diagram.</p>

<p>This approach aligns with what Martin Fowler calls evolutionary design. The architecture isn’t a precondition for development – it’s a consequence of disciplined development.</p>

<hr />

<h2 id="continuous-integration-as-architectural-feedback">Continuous Integration as Architectural Feedback</h2>

<p>In XP, Continuous Integration means integrating your work with the mainline frequently – at least daily. In a modular Rails application, CI serves a dual purpose.</p>

<h3 id="the-dual-loop-ci">The dual-loop CI</h3>

<div class="diagram"><img src="/img/books/modular-rails/b7319f3ce1f028e85efe62ad17aa3b11b2dfd5eca516e1fbda86ae700de3b720.svg" alt="Mermaid diagram: git push"></div>

<p>A well-configured CI pipeline for a modular Rails app runs two kinds of tests:</p>

<p><strong>Loop 1: Engine isolation tests.</strong> Each engine’s test suite runs against its own dummy app. This verifies that the engine works correctly in isolation, without the host application.</p>

<p><strong>Loop 2: Integration tests.</strong> The host application’s test suite runs with all engines mounted. This verifies that the engines work together correctly.</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># .github/workflows/ci.yml</span>

<span class="na">name</span><span class="pi">:</span> <span class="s">CI</span>

<span class="na">on</span><span class="pi">:</span> <span class="pi">[</span><span class="nv">push</span><span class="pi">,</span> <span class="nv">pull_request</span><span class="pi">]</span>

<span class="na">jobs</span><span class="pi">:</span>
  <span class="na">engine-tests</span><span class="pi">:</span>
    <span class="na">strategy</span><span class="pi">:</span>
      <span class="na">matrix</span><span class="pi">:</span>
        <span class="na">engine</span><span class="pi">:</span> <span class="pi">[</span><span class="nv">billing</span><span class="pi">,</span> <span class="nv">notifications</span><span class="pi">,</span> <span class="nv">auth</span><span class="pi">]</span>
    <span class="na">runs-on</span><span class="pi">:</span> <span class="s">ubuntu-latest</span>
    <span class="na">steps</span><span class="pi">:</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">actions/checkout@v4</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">ruby/setup-ruby@v1</span>
        <span class="na">with</span><span class="pi">:</span>
          <span class="na">bundler-cache</span><span class="pi">:</span> <span class="kc">true</span>
          <span class="na">working-directory</span><span class="pi">:</span> <span class="s">engines/${{ matrix.engine }}</span>
      <span class="pi">-</span> <span class="na">name</span><span class="pi">:</span> <span class="s">Run engine tests</span>
        <span class="na">working-directory</span><span class="pi">:</span> <span class="s">engines/${{ matrix.engine }}</span>
        <span class="na">run</span><span class="pi">:</span> <span class="pi">|</span>
          <span class="s">bundle exec rails db:prepare</span>
          <span class="s">bundle exec rspec</span>

  <span class="na">integration-tests</span><span class="pi">:</span>
    <span class="c1"># Runs after engine tests to avoid wasting CI time if engines are broken.</span>
    <span class="c1"># Remove `needs` if you prefer parallel execution for faster feedback.</span>
    <span class="na">needs</span><span class="pi">:</span> <span class="s">engine-tests</span>
    <span class="na">runs-on</span><span class="pi">:</span> <span class="s">ubuntu-latest</span>
    <span class="na">steps</span><span class="pi">:</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">actions/checkout@v4</span>
      <span class="pi">-</span> <span class="na">uses</span><span class="pi">:</span> <span class="s">ruby/setup-ruby@v1</span>
        <span class="na">with</span><span class="pi">:</span>
          <span class="na">bundler-cache</span><span class="pi">:</span> <span class="kc">true</span>
      <span class="pi">-</span> <span class="na">name</span><span class="pi">:</span> <span class="s">Run integration tests</span>
        <span class="na">run</span><span class="pi">:</span> <span class="pi">|</span>
          <span class="s">bundle exec rails db:prepare</span>
          <span class="s">bundle exec rspec</span>
</code></pre></div></div>

<p>This pipeline gives you architectural feedback:</p>

<ul>
  <li><strong>Engine tests pass, integration tests fail:</strong> You’ve found a boundary leak. Something in the engine depends on the host app’s state, or two engines interact in a way the isolated tests don’t cover.</li>
  <li><strong>Engine tests fail, integration tests pass:</strong> Unlikely but possible. It means the engine has a bug that’s masked by the host app’s environment. Fix the engine.</li>
  <li><strong>Both pass:</strong> Your architecture is healthy. The boundaries hold.</li>
</ul>

<h3 id="rails-81s-binci">Rails 8.1’s <code>bin/ci</code></h3>

<p>Rails 8.1 introduced a local CI runner with a DSL defined in <code>config/ci.rb</code>. This means you can run the same checks locally that CI runs remotely:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/ci.rb</span>
<span class="no">CI</span><span class="p">.</span><span class="nf">run</span> <span class="k">do</span>
  <span class="n">step</span> <span class="s2">"Lint"</span><span class="p">,</span> <span class="s2">"bundle exec rubocop"</span>
  <span class="n">step</span> <span class="s2">"Billing Engine Tests"</span><span class="p">,</span> <span class="s2">"cd engines/billing &amp;&amp; bundle exec rspec"</span>
  <span class="n">step</span> <span class="s2">"Notifications Engine Tests"</span><span class="p">,</span> <span class="s2">"cd engines/notifications &amp;&amp; bundle exec rspec"</span>
  <span class="n">step</span> <span class="s2">"Integration Tests"</span><span class="p">,</span> <span class="s2">"bundle exec rspec"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Run it with <code>bin/ci</code>. This feedback loop is faster than pushing to GitHub and waiting for CI, and it catches boundary violations before they leave your machine.</p>

<hr />

<h2 id="small-releases-and-incremental-extraction">Small Releases and Incremental Extraction</h2>

<p>XP advocates for small, frequent releases. Applied to engine extraction, this means you don’t extract an entire domain in one massive pull request. You do it incrementally:</p>

<p><strong>Release 1:</strong> Move models into a namespace within the host app. Deploy.</p>

<p><strong>Release 2:</strong> Extract the namespace into an engine, keeping it in the same repository as a path dependency. Deploy.</p>

<p><strong>Release 3:</strong> Add the integration concern pattern. Replace direct model references in the host app with concern includes. Deploy.</p>

<p><strong>Release 4:</strong> Move the engine to its own repository if needed. Deploy.</p>

<p>Each release is small, reviewable, and reversible. If Release 2 causes problems, you can revert it without unwinding three weeks of work.</p>

<p>This is the opposite of the “big bang migration” that most teams attempt. Big bang migrations fail because the risk is concentrated in a single deploy. Incremental extraction spreads the risk across multiple deploys, each small enough to debug quickly.</p>

<hr />

<h2 id="collective-code-ownership-across-engines">Collective Code Ownership Across Engines</h2>

<p>XP’s principle of collective code ownership says that anyone on the team can change any code. This might seem at odds with engines, which naturally create ownership boundaries. But collective code ownership doesn’t mean everyone works on everything simultaneously – it means nobody is <em>forbidden</em> from touching anything.</p>

<p>Engines support this by making boundaries explicit without making them exclusionary:</p>

<ul>
  <li>Any developer can clone an engine’s repository and make changes</li>
  <li>The engine’s test suite runs independently, so you can verify your changes without understanding the entire host application</li>
  <li>Code review at the engine boundary (version bumps in the Gemfile) creates natural checkpoints without gatekeeping</li>
  <li>The engine’s <code>README</code> and test suite serve as documentation of its interface</li>
</ul>

<p>The goal is that when the billing engine’s primary developer goes on holiday, another developer can confidently make changes to the billing engine. The engine boundary helps with this – the scope of what you need to understand is smaller and well-defined.</p>

<hr />

<h2 id="pair-programming-on-boundary-decisions">Pair Programming on Boundary Decisions</h2>

<p>Some decisions are too important for one person. Boundary decisions – where to draw the line between engines, what goes in the shared kernel, how engines communicate – are among them.</p>

<p>Pair programming on these decisions has specific benefits:</p>

<ul>
  <li><strong>Two perspectives on coupling:</strong> One developer might not notice that a proposed boundary splits a frequently-cochanging set of files. A pair is more likely to catch it.</li>
  <li><strong>Knowledge transfer:</strong> Boundary decisions encode architectural understanding. Pairing spreads that understanding across the team.</li>
  <li><strong>Better interfaces:</strong> When two people design the concern-based integration between an engine and the host app, the resulting interface is clearer because it has to satisfy two mental models.</li>
</ul>

<p>You don’t need to pair on everything. But for boundary decisions, for extraction pull requests, for the initial engine architecture – pair. The cost is low and the benefit is high.</p>

<hr />

<h2 id="why-xp-practices-make-modular-architecture-sustainable">Why XP Practices Make Modular Architecture Sustainable</h2>

<p>Architecture without discipline decays. Teams draw boundaries but don’t maintain them. They create engines but let coupling creep back in through “temporary” shortcuts that become permanent.</p>

<p>XP practices are the antidote:</p>

<ul>
  <li><strong>TDD</strong> makes coupling visible immediately through test pain. When your engine test needs setup from another domain, something is wrong.</li>
  <li><strong>Refactoring</strong> provides the mechanism for responding to design signals. You don’t just notice the boundary – you act on it.</li>
  <li><strong>Continuous Integration</strong> catches boundary violations early through the dual-loop test pipeline.</li>
  <li><strong>Small releases</strong> prevent the “big bang extraction” that fails catastrophically.</li>
  <li><strong>Pair programming</strong> spreads architectural understanding and catches coupling that one person might miss.</li>
  <li><strong>Collective code ownership</strong> prevents engines from becoming silos that nobody else can touch.</li>
  <li><strong>Simple design</strong> prevents premature modularisation. Don’t create an engine until the four rules tell you to.</li>
</ul>

<p>These aren’t theoretical benefits. They’re the difference between an architecture that lasts and one that’s abandoned within a year because maintaining it was too hard. The practices are what make the architecture sustainable.</p>

<hr />

<p><em>In the previous chapters, we established why architecture matters and what Clean Architecture teaches us about boundaries. In this chapter, we’ve seen how XP’s practices – TDD, refactoring, CI, small releases – provide the discipline to discover and maintain those boundaries. In Part II, we’ll see how Rails Engines provide the mechanism.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-03-the-hard-parts/">&larr; The Hard Parts — Reasoning About Trade-offs</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-05-rails-engines-from-the-inside-out/">Rails Engines from the Inside Out &rarr;</a>
</nav>
{% endraw %}
