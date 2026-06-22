---
layout: book
book: modular_rails
title: "Identifying Boundaries in an Existing Application"
permalink: /books/modular-rails/chapter-09-identifying-boundaries/
description: "Where to draw boundaries in a 150-model Rails monolith — using git history, coupling signals and domain analysis to find the seams that are really there."
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-08-engine-integration-patterns/">&larr; Engine Integration Patterns</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-10-extracting-your-first-engine/">Extracting Your First Engine &rarr;</a>
</nav>

<h1 id="chapter-9-identifying-boundaries-in-an-existing-application">Chapter 9: Identifying Boundaries in an Existing Application</h1>

<blockquote>
  <p><em>“Your goal is to implement the boundaries right at the inflection point where the cost of implementing becomes less than the cost of ignoring.”</em><br />
– Robert C. Martin, <em>Clean Architecture</em></p>
</blockquote>

<p>You know you need boundaries. Your <code>app/models/</code> directory has 150 files. Your test suite takes 20 minutes. A change to billing logic broke a notification test last week. But where do you draw the lines?</p>

<p>This chapter gives you concrete techniques for identifying boundaries in an existing Rails application. Not theory – tools you can run today against your codebase.</p>

<hr />

<h2 id="reading-your-git-history-for-coupling-signals">Reading Your Git History for Coupling Signals</h2>

<p>Your git history is the most honest documentation of your architecture. It doesn’t lie about which files change together, how often, and why.</p>

<h3 id="co-change-analysis">Co-change analysis</h3>

<p>Files that change in the same commit have <strong>temporal coupling</strong>. Sometimes that coupling is accidental (a developer happened to fix two unrelated things). But when two files change together in 10, 20, 50 commits, there’s a structural relationship.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1">#!/usr/bin/env ruby</span>
<span class="c1"># scripts/co_change_analysis.rb</span>
<span class="c1">#</span>
<span class="c1"># Analyses git history to find files that frequently change together.</span>
<span class="c1"># Usage: ruby scripts/co_change_analysis.rb</span>

<span class="nb">require</span> <span class="s2">"set"</span>

<span class="c1"># Parse git log for commits that touch app/ or spec/</span>
<span class="n">raw</span> <span class="o">=</span> <span class="sb">`git log --name-only --pretty=format:"COMMIT" --diff-filter=ACRM -- app/ spec/ lib/`</span>
<span class="n">commits</span> <span class="o">=</span> <span class="n">raw</span><span class="p">.</span><span class="nf">split</span><span class="p">(</span><span class="s2">"COMMIT"</span><span class="p">).</span><span class="nf">map</span> <span class="p">{</span> <span class="o">|</span><span class="n">c</span><span class="o">|</span> <span class="n">c</span><span class="p">.</span><span class="nf">strip</span><span class="p">.</span><span class="nf">split</span><span class="p">(</span><span class="s2">"</span><span class="se">\n</span><span class="s2">"</span><span class="p">).</span><span class="nf">reject</span><span class="p">(</span><span class="o">&amp;</span><span class="ss">:empty?</span><span class="p">)</span> <span class="p">}.</span><span class="nf">reject</span><span class="p">(</span><span class="o">&amp;</span><span class="ss">:empty?</span><span class="p">)</span>

<span class="c1"># Count co-changes</span>
<span class="n">co_changes</span> <span class="o">=</span> <span class="no">Hash</span><span class="p">.</span><span class="nf">new</span> <span class="p">{</span> <span class="o">|</span><span class="n">h</span><span class="p">,</span> <span class="n">k</span><span class="o">|</span> <span class="n">h</span><span class="p">[</span><span class="n">k</span><span class="p">]</span> <span class="o">=</span> <span class="no">Hash</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="mi">0</span><span class="p">)</span> <span class="p">}</span>
<span class="n">file_change_count</span> <span class="o">=</span> <span class="no">Hash</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span><span class="mi">0</span><span class="p">)</span>

<span class="n">commits</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">files</span><span class="o">|</span>
  <span class="n">files</span><span class="p">.</span><span class="nf">each</span> <span class="p">{</span> <span class="o">|</span><span class="n">f</span><span class="o">|</span> <span class="n">file_change_count</span><span class="p">[</span><span class="n">f</span><span class="p">]</span> <span class="o">+=</span> <span class="mi">1</span> <span class="p">}</span>
  <span class="n">files</span><span class="p">.</span><span class="nf">combination</span><span class="p">(</span><span class="mi">2</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">a</span><span class="p">,</span> <span class="n">b</span><span class="o">|</span>
    <span class="n">co_changes</span><span class="p">[</span><span class="n">a</span><span class="p">][</span><span class="n">b</span><span class="p">]</span> <span class="o">+=</span> <span class="mi">1</span>
    <span class="n">co_changes</span><span class="p">[</span><span class="n">b</span><span class="p">][</span><span class="n">a</span><span class="p">]</span> <span class="o">+=</span> <span class="mi">1</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="c1"># Print strongest relationships</span>
<span class="nb">puts</span> <span class="s2">"Files that frequently change together:"</span>
<span class="nb">puts</span> <span class="s2">"="</span> <span class="o">*</span> <span class="mi">70</span>

<span class="n">printed</span> <span class="o">=</span> <span class="no">Set</span><span class="p">.</span><span class="nf">new</span>
<span class="n">co_changes</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">file</span><span class="p">,</span> <span class="n">partners</span><span class="o">|</span>
  <span class="n">partners</span><span class="p">.</span><span class="nf">sort_by</span> <span class="p">{</span> <span class="o">|</span><span class="n">_</span><span class="p">,</span> <span class="n">count</span><span class="o">|</span> <span class="o">-</span><span class="n">count</span> <span class="p">}.</span><span class="nf">first</span><span class="p">(</span><span class="mi">5</span><span class="p">).</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">partner</span><span class="p">,</span> <span class="n">count</span><span class="o">|</span>
    <span class="n">pair</span> <span class="o">=</span> <span class="p">[</span><span class="n">file</span><span class="p">,</span> <span class="n">partner</span><span class="p">].</span><span class="nf">sort</span>
    <span class="k">next</span> <span class="k">if</span> <span class="n">printed</span><span class="p">.</span><span class="nf">include?</span><span class="p">(</span><span class="n">pair</span><span class="p">)</span>
    <span class="k">next</span> <span class="k">if</span> <span class="n">count</span> <span class="o">&lt;</span> <span class="mi">5</span>  <span class="c1"># Minimum threshold</span>

    <span class="n">printed</span><span class="p">.</span><span class="nf">add</span><span class="p">(</span><span class="n">pair</span><span class="p">)</span>
    <span class="nb">puts</span> <span class="s2">"</span><span class="si">#{</span><span class="n">count</span><span class="p">.</span><span class="nf">to_s</span><span class="p">.</span><span class="nf">rjust</span><span class="p">(</span><span class="mi">4</span><span class="p">)</span><span class="si">}</span><span class="s2"> times: </span><span class="si">#{</span><span class="n">file</span><span class="si">}</span><span class="s2">"</span>
    <span class="nb">puts</span> <span class="s2">"         </span><span class="si">#{</span><span class="n">partner</span><span class="si">}</span><span class="s2">"</span>
    <span class="nb">puts</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Run this against your repository. You’ll see clusters emerge:</p>

<pre><code>  47 times: app/models/invoice.rb
           app/services/invoice_generator.rb

  38 times: app/models/invoice.rb
           app/models/subscription.rb

  31 times: app/models/subscription.rb
           app/models/plan.rb

  12 times: app/models/invoice.rb
           app/controllers/invoices_controller.rb

   3 times: app/models/invoice.rb
           app/models/notification.rb
</code></pre>

<p>The billing cluster is clear: <code>invoice.rb</code>, <code>invoice_generator.rb</code>, <code>subscription.rb</code>, and <code>plan.rb</code> change together constantly. The connection to <code>notification.rb</code> is weak – only 3 co-changes. That’s your boundary signal.</p>

<h3 id="change-frequency-by-directory">Change frequency by directory</h3>

<p>A simpler analysis: which areas of the codebase change most?</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>git log <span class="nt">--name-only</span> <span class="nt">--pretty</span><span class="o">=</span>format: <span class="nt">--diff-filter</span><span class="o">=</span>ACRM <span class="nt">--</span> app/ | <span class="se">\</span>
  <span class="nb">sed</span> <span class="s1">'s|/[^/]*$||'</span> | <span class="nb">sort</span> | <span class="nb">uniq</span> <span class="nt">-c</span> | <span class="nb">sort</span> <span class="nt">-rn</span> | <span class="nb">head</span> <span class="nt">-20</span>
</code></pre></div></div>

<p>This shows you which directories have the most churn. High-churn areas benefit most from isolation because the risk of accidental coupling is highest where change is most frequent.</p>

<hr />

<h2 id="the-change-together-heuristic">The “Change Together” Heuristic</h2>

<p>The Common Closure Principle says: <em>“Gather into components those classes that change for the same reasons and at the same times.”</em></p>

<p>“Change for the same reasons” is hard to measure. “Change at the same times” is measurable – that’s what the co-change analysis gives you.</p>

<p>But there’s a subtlety. Two files might change together because:</p>

<ol>
  <li>
    <p><strong>They belong to the same domain.</strong> <code>Invoice</code> and <code>LineItem</code> change together because billing rules affect both. This is healthy coupling – they should be in the same engine.</p>
  </li>
  <li>
    <p><strong>One depends on the other unnecessarily.</strong> <code>Invoice</code> and <code>NotificationPreference</code> change together because <code>Invoice.after_create</code> sends a notification that checks preferences. This is accidental coupling – they should be in different engines, communicating through events.</p>
  </li>
  <li>
    <p><strong>They share a concern that should be extracted.</strong> <code>Invoice</code> and <code>Report</code> both change when the money formatting rules change. This signals a shared concern (<code>Monetizable</code>, <code>Formattable</code>) that should live in a core engine.</p>
  </li>
</ol>

<p>The co-change data tells you <em>what</em> changes together. You still need judgement to determine <em>why</em> and what to do about it.</p>

<hr />

<h2 id="domain-driven-design-bounded-contexts-in-rails-terms">Domain-Driven Design: Bounded Contexts in Rails Terms</h2>

<p>Eric Evans’ concept of <strong>bounded contexts</strong> maps naturally to Rails Engines. A bounded context is a boundary within which a particular model has a specific, consistent meaning.</p>

<p>Consider “User” in a typical Rails application:</p>

<ul>
  <li>In the <strong>authentication</strong> context, a User has a password, email, and session tokens</li>
  <li>In the <strong>billing</strong> context, a User has subscriptions, invoices, and a billing email</li>
  <li>In the <strong>notification</strong> context, a User has notification preferences and a device token</li>
  <li>In the <strong>team management</strong> context, a User has team memberships and roles</li>
</ul>

<p>These are four different models that happen to share a database table and a Ruby class. In DDD terms, each context should have its own representation of a User – or, more practically in Rails, each engine should interact with users through a focused concern.</p>

<p>The authentication engine provides <code>Authenticatable</code>. The billing engine provides <code>Billable</code>. The notification engine provides <code>Notifiable</code>. Each concern gives the <code>User</code> model only the behaviour relevant to that context. The <code>User</code> class in <code>app/models/user.rb</code> becomes a composition point:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="k">class</span> <span class="nc">User</span> <span class="o">&lt;</span> <span class="no">ApplicationRecord</span>
  <span class="kp">include</span> <span class="no">Auth</span><span class="o">::</span><span class="no">Authenticatable</span>
  <span class="kp">include</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Billable</span>
  <span class="kp">include</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Notifiable</span>
  <span class="kp">include</span> <span class="no">Teams</span><span class="o">::</span><span class="no">Membership</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Each line is an explicit declaration: “User participates in this domain.” Remove a line, and the user loses that capability. The bounded contexts are visible in the code.</p>

<div class="diagram"><img src="/img/books/modular-rails/0ed701ea2c7192b200c0619f1990b15db139cabf9f46498c0e1393d007840e92.svg" alt="Mermaid diagram: User (composition point)"></div>

<p>Each context gives <code>User</code> only the behaviour it needs. The <code>User</code> model is the composition point where bounded contexts meet – not a god object that owns everything.</p>

<h3 id="ubiquitous-language">Ubiquitous Language</h3>

<p>Each engine should have its own internally consistent vocabulary. In the billing engine, a “customer” is someone who pays. In the notifications engine, a “recipient” is someone who receives messages. They might be the same person, but the names reflect different concerns.</p>

<p>This matters more than it sounds. When the billing team says “user”, they mean someone with payment methods and invoices. When the notifications team says “user”, they mean someone with notification preferences and a device token. Using the same word for both creates ambiguity in conversations, code reviews, and bug reports.</p>

<p>The engine boundary gives you permission to use different names for the same underlying entity. <code>Billing::Billable</code> and <code>Notifications::Notifiable</code> are different vocabularies for different contexts, applied to the same <code>User</code> model at the composition point. This is DDD’s ubiquitous language in practice: each context speaks its own dialect.</p>

<h3 id="context-mapping-how-engines-relate">Context Mapping: How Engines Relate</h3>

<p>Not all engine relationships are equal. DDD defines several context mapping patterns that describe how bounded contexts interact. The ones that matter most for Rails engines:</p>

<ul>
  <li>
    <p><strong>Published Language</strong> — The publishing engine defines an event contract (<code>"invoice.created.billing"</code> with a specific payload shape). Subscribing engines conform to this contract. This is Pattern 5 from Chapter 8.</p>
  </li>
  <li>
    <p><strong>Conformist</strong> — The consuming engine uses the publishing engine’s data model as-is. When the notifications engine includes <code>Billing::Billable</code> in its dummy app user, it conforms to billing’s interface. This is Pattern 1 from Chapter 8.</p>
  </li>
  <li>
    <p><strong>Anti-Corruption Layer (ACL)</strong> — The consuming engine translates the publishing engine’s model into its own terms. Instead of using <code>Billing::Invoice</code> directly, a reporting engine might define <code>Reporting::RevenueEntry</code> and translate invoice data at the boundary:</p>
  </li>
</ul>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/reporting/app/services/reporting/invoice_translator.rb</span>

<span class="k">module</span> <span class="nn">Reporting</span>
  <span class="k">class</span> <span class="nc">InvoiceTranslator</span>
    <span class="k">def</span> <span class="nc">self</span><span class="o">.</span><span class="nf">from_event</span><span class="p">(</span><span class="n">payload</span><span class="p">)</span>
      <span class="no">RevenueEntry</span><span class="p">.</span><span class="nf">new</span><span class="p">(</span>
        <span class="ss">source_id: </span><span class="n">payload</span><span class="p">[</span><span class="ss">:invoice_id</span><span class="p">],</span>
        <span class="ss">amount_cents: </span><span class="n">payload</span><span class="p">[</span><span class="ss">:amount_cents</span><span class="p">],</span>
        <span class="ss">recorded_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span>
      <span class="p">)</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The ACL protects the reporting engine from changes in billing’s data model. If billing renames <code>amount_cents</code> to <code>total_cents</code>, only the translator needs updating – the rest of the reporting engine is insulated.</p>

<ul>
  <li><strong>Upstream/Downstream</strong> — The billing engine is upstream (it publishes events and defines the contract). The notifications engine is downstream (it subscribes and conforms). This direction matters: the upstream engine can change its contract, breaking downstream engines. Downstream engines can’t break upstream.</li>
</ul>

<p>You don’t need to label every engine relationship with DDD terminology. But when you’re debugging a coupling problem or planning an extraction, asking “is this a conformist relationship or should we add an anti-corruption layer?” helps you make better design decisions.</p>

<h3 id="event-storming-for-boundary-discovery">Event Storming for Boundary Discovery</h3>

<p>When you’re uncertain where boundaries should go, Event Storming is a practical technique for finding out. Gather the team (developers, product, domain experts) and map out the system’s behaviour as a sequence of domain events on sticky notes:</p>

<ol>
  <li><strong>Orange stickies:</strong> Domain events (“Invoice Created”, “Payment Received”, “Notification Sent”)</li>
  <li><strong>Blue stickies:</strong> Commands that trigger events (“Create Invoice”, “Process Payment”)</li>
  <li><strong>Yellow stickies:</strong> Aggregates that handle commands (“Invoice”, “Subscription”)</li>
  <li><strong>Pink stickies:</strong> Boundaries – where you draw the lines between groups of related events</li>
</ol>

<p>The events cluster naturally. All invoice-related events group together. All notification events group together. The boundaries between clusters are your engine boundaries.</p>

<p>You don’t need a formal workshop. Even 30 minutes at a whiteboard with your team, listing the domain events and seeing which ones cluster together, gives you more boundary clarity than a week of staring at code.</p>

<h3 id="aggregate-boundaries-vs-engine-boundaries">Aggregate Boundaries vs Engine Boundaries</h3>

<p>In DDD, an aggregate is a cluster of objects treated as a unit for data changes. <code>Invoice</code> with its <code>LineItem</code>s is an aggregate – you don’t modify a line item without going through the invoice.</p>

<p>Engine boundaries are coarser than aggregate boundaries. An engine typically contains multiple aggregates: the billing engine has <code>Invoice</code>, <code>Subscription</code>, and <code>Plan</code> aggregates. The engine boundary wraps the entire billing domain; the aggregate boundary wraps a single transactional unit within that domain.</p>

<p>The practical implication: references between aggregates within the same engine use normal associations. References between engines use identity (IDs) rather than object references. <code>Billing::Invoice</code> has a <code>user_id</code> integer, not a <code>belongs_to :user</code> pointing to the host app’s <code>User</code> model. This is the same principle DDD applies between aggregates: reference by identity, not by object.</p>

<hr />

<h2 id="mapping-business-capabilities-to-engines">Mapping Business Capabilities to Engines</h2>

<p>A business capability is something your organisation does. Billing is a capability. Customer support is a capability. User onboarding is a capability.</p>

<p>Each capability typically maps to:</p>
<ul>
  <li>A set of database tables</li>
  <li>A set of models, services, and controllers</li>
  <li>A team or stakeholder group</li>
  <li>A reason to change</li>
</ul>

<p>List your application’s business capabilities. Then map each model to its primary capability:</p>

<table>
  <thead>
    <tr>
      <th>Model</th>
      <th>Primary Capability</th>
      <th>Secondary</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Invoice</td>
      <td>Billing</td>
      <td>Reporting</td>
      <td>Reporting reads, doesn’t write</td>
    </tr>
    <tr>
      <td>Subscription</td>
      <td>Billing</td>
      <td>–</td>
      <td> </td>
    </tr>
    <tr>
      <td>Plan</td>
      <td>Billing</td>
      <td>Marketing</td>
      <td>Marketing sets prices</td>
    </tr>
    <tr>
      <td>Document</td>
      <td>Document Management</td>
      <td>–</td>
      <td> </td>
    </tr>
    <tr>
      <td>Template</td>
      <td>Document Management</td>
      <td>–</td>
      <td> </td>
    </tr>
    <tr>
      <td>Signature</td>
      <td>Document Management</td>
      <td>–</td>
      <td> </td>
    </tr>
    <tr>
      <td>Notification</td>
      <td>Notifications</td>
      <td>–</td>
      <td> </td>
    </tr>
    <tr>
      <td>NotificationPreference</td>
      <td>Notifications</td>
      <td>–</td>
      <td> </td>
    </tr>
    <tr>
      <td>Team</td>
      <td>Team Management</td>
      <td>–</td>
      <td> </td>
    </tr>
    <tr>
      <td>TeamMembership</td>
      <td>Team Management</td>
      <td>–</td>
      <td> </td>
    </tr>
    <tr>
      <td>User</td>
      <td>Authentication</td>
      <td>Everything</td>
      <td>Composition point</td>
    </tr>
    <tr>
      <td>AuditLog</td>
      <td>Shared/Core</td>
      <td>–</td>
      <td>Cross-cutting</td>
    </tr>
  </tbody>
</table>

<p>The document management cluster emerged directly from the git co-change analysis – <code>document.rb</code>, <code>template.rb</code>, and <code>signature.rb</code> changed together in 85%+ of commits, and almost never changed alongside billing files. That kind of signal makes it a strong candidate for its own <code>documents</code> engine.</p>

<p>Models that map to a single capability are clear engine candidates. Models that map to multiple capabilities need analysis: are the secondary uses through read-only queries (fine, use cross-engine reads), or through writes (harder, might need events or a shared concern)?</p>

<p>The <code>User</code> model maps to “Everything” because it’s the composition point. It stays in the host app and includes concerns from each engine. <code>AuditLog</code> maps to “Shared” because every domain uses it – it belongs in a core engine.</p>

<hr />

<h2 id="when-a-boundary-is-obvious-vs-when-its-not">When a Boundary Is Obvious vs When It’s Not</h2>

<h3 id="obvious-boundaries">Obvious boundaries</h3>

<ul>
  <li><strong>The domain has its own tables.</strong> Billing has <code>invoices</code>, <code>subscriptions</code>, <code>plans</code>, <code>line_items</code>. They reference each other heavily and are rarely referenced by non-billing code.</li>
  <li><strong>The domain has a clear owner.</strong> The finance team owns billing. The product team owns notifications.</li>
  <li><strong>Changes are contained.</strong> When billing rules change, only billing files change.</li>
  <li><strong>The domain is a common gem.</strong> Authentication (Devise), e-commerce (Spree/Solidus), admin panels (ActiveAdmin) – these are already engines in the gem ecosystem. If your domain looks like one of these, the boundary is proven.</li>
</ul>

<h3 id="non-obvious-boundaries">Non-obvious boundaries</h3>

<ul>
  <li><strong>Shared models with mixed concerns.</strong> The <code>User</code> model serves every domain. It’s not a boundary – it’s a composition point.</li>
  <li><strong>Cross-cutting concerns.</strong> Audit logging, soft deletion, multi-tenancy – these belong in a core engine, not in any domain engine.</li>
  <li><strong>Tightly coupled domains.</strong> Orders and inventory in an e-commerce app are theoretically separate domains, but they share so many data points (stock levels affect order fulfilment, order cancellations restore stock) that separating them might create more problems than it solves.</li>
  <li><strong>Small domains.</strong> A domain with 2 models and 1 controller might not justify the overhead of an engine. A plain Ruby module or namespace within the host app might be enough.</li>
</ul>

<p>When in doubt, apply Kent Beck’s four rules. If extracting the domain makes the system simpler (reveals intention, reduces duplication), do it. If it makes the system more complex (adds indirection without reducing coupling), don’t. You can always extract later when the boundary becomes clearer.</p>

<hr />

<h2 id="starting-with-the-dependency-graph-you-have">Starting with the Dependency Graph You Have</h2>

<p>Before drawing new boundaries, visualise the dependencies you already have:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1">#!/usr/bin/env ruby</span>
<span class="c1"># scripts/dependency_graph.rb</span>
<span class="c1">#</span>
<span class="c1"># Generates a dependency graph of models based on associations.</span>
<span class="c1"># Output is a DOT file viewable with Graphviz.</span>

<span class="nb">require_relative</span> <span class="s2">"../config/environment"</span>

<span class="c1"># Ensure all models are loaded (Zeitwerk lazy-loads by default)</span>
<span class="no">Rails</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">eager_load!</span>

<span class="nb">puts</span> <span class="s2">"digraph models {"</span>
<span class="nb">puts</span> <span class="s2">"  rankdir=LR;"</span>
<span class="nb">puts</span> <span class="s2">"  node [shape=box];"</span>

<span class="no">ActiveRecord</span><span class="o">::</span><span class="no">Base</span><span class="p">.</span><span class="nf">descendants</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">model</span><span class="o">|</span>
  <span class="k">next</span> <span class="k">if</span> <span class="n">model</span><span class="p">.</span><span class="nf">abstract_class?</span>
  <span class="k">next</span> <span class="k">unless</span> <span class="n">model</span><span class="p">.</span><span class="nf">name</span> <span class="c1"># Skip anonymous classes</span>

  <span class="n">model</span><span class="p">.</span><span class="nf">reflect_on_all_associations</span><span class="p">.</span><span class="nf">each</span> <span class="k">do</span> <span class="o">|</span><span class="n">assoc</span><span class="o">|</span>
    <span class="n">target</span> <span class="o">=</span> <span class="n">assoc</span><span class="p">.</span><span class="nf">class_name</span>
    <span class="k">next</span> <span class="k">unless</span> <span class="n">target</span><span class="p">.</span><span class="nf">safe_constantize</span>

    <span class="nb">puts</span> <span class="s2">"  </span><span class="se">\"</span><span class="si">#{</span><span class="n">model</span><span class="p">.</span><span class="nf">name</span><span class="si">}</span><span class="se">\"</span><span class="s2"> -&gt; </span><span class="se">\"</span><span class="si">#{</span><span class="n">target</span><span class="si">}</span><span class="se">\"</span><span class="s2">;"</span>
  <span class="k">end</span>
<span class="k">end</span>

<span class="nb">puts</span> <span class="s2">"}"</span>
</code></pre></div></div>

<p>Run it:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>rails runner scripts/dependency_graph.rb <span class="o">&gt;</span> models.dot
dot <span class="nt">-Tpng</span> models.dot <span class="nt">-o</span> models.png
</code></pre></div></div>

<p>Open <code>models.png</code>. You’ll see clusters of tightly connected models and sparse connections between clusters. Those clusters are your candidate engines. The sparse connections are your integration points.</p>

<p>Here’s what a typical dependency graph looks like, with domain clusters highlighted:</p>

<div class="diagram"><img src="/img/books/modular-rails/498121cdd7009eda1074d0ad6dc7ef139ea24f1351acd86a21bfa1c22ffadd2d.svg" alt="Mermaid diagram: NotificationPreference"></div>

<p>The solid arrows within each coloured cluster are strong domain relationships. The dashed arrows crossing cluster boundaries are the weak coupling signals – your candidate integration points.</p>

<p>If the graph looks like a hairball with everything connected to everything, you have significant coupling to address before extraction. Start by removing unnecessary associations, replacing direct references with events, and extracting shared concerns into a core module.</p>

<hr />

<h2 id="a-practical-approach-start-with-one">A Practical Approach: Start with One</h2>

<p>Don’t try to identify all boundaries at once. The analysis paralysis of mapping your entire application to bounded contexts before writing a single line of engine code is a trap.</p>

<p>Instead:</p>

<ol>
  <li><strong>Pick the most obvious domain.</strong> The one where the co-change data is clearest, the ownership is most defined, and the coupling to other domains is lowest.</li>
  <li><strong>Extract it</strong> (see Chapter 10).</li>
  <li><strong>Learn from the extraction.</strong> What was harder than expected? What coupling did you discover that the analysis missed?</li>
  <li><strong>Pick the next domain.</strong> Your understanding of the codebase is now deeper. The second extraction is smoother.</li>
  <li><strong>Repeat.</strong></li>
</ol>

<p>Each extraction sharpens your intuition for where boundaries belong. The first one takes a week. The fifth takes a day. The boundaries that weren’t obvious at the start become obvious after you’ve extracted the easy ones, because the remaining coupling stands out against the now-clean structure.</p>

<hr />

<p><em>You’ve identified where the boundaries should go. In the next chapter, we’ll walk through the complete extraction process step by step.</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-08-engine-integration-patterns/">&larr; Engine Integration Patterns</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-10-extracting-your-first-engine/">Extracting Your First Engine &rarr;</a>
</nav>
{% endraw %}
