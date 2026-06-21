---
layout: book
book: modular_rails
title: "Team Workflow and Developer Experience"
permalink: /books/modular-rails/chapter-14-team-workflow/
---
{% raw %}

<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-13-testing-strategy/">&larr; Testing Strategy for a Modular Monolith</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-15-when-engines-are-wrong/">When Engines Are the Wrong Tool &rarr;</a>
</nav>

<h1 id="chapter-14-team-workflow-and-developer-experience">Chapter 14: Team Workflow and Developer Experience</h1>

<p>Architecture that makes developers’ lives harder won’t survive. No matter how clean the boundaries are, if the daily workflow is painful, developers will take shortcuts that erode those boundaries. This chapter covers the practical workflows that make modular Rails development sustainable.</p>

<hr />

<h2 id="local-development-of-separate-repo-engines">Local Development of Separate-Repo Engines</h2>

<p>When engines live in separate repositories (referenced as git dependencies), developing them alongside the host app creates friction. You make a change in the engine, push it, tag a release, bump the Gemfile, run <code>bundle install</code> – all before you can test the change in the host app.</p>

<p>Bundler has a built-in mechanism for exactly this: <code>bundle config local</code>. The Gemfile declares the git source with a <code>branch:</code> instead of a <code>tag:</code>, and each developer configures their local path override separately:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Gemfile -- always uses the git source</span>
<span class="n">gem</span> <span class="s2">"billing"</span><span class="p">,</span>       <span class="ss">git: </span><span class="s2">"git@github.com:your-org/billing-engine.git"</span><span class="p">,</span>       <span class="ss">branch: </span><span class="s2">"main"</span>
<span class="n">gem</span> <span class="s2">"notifications"</span><span class="p">,</span>  <span class="ss">git: </span><span class="s2">"git@github.com:your-org/notifications-engine.git"</span><span class="p">,</span>  <span class="ss">branch: </span><span class="s2">"main"</span>
</code></pre></div></div>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># Developer sets local overrides (stored in .bundle/config, which is gitignored)</span>
bundle config <span class="nb">set</span> <span class="nt">--local</span> local.billing ../billing-engine
bundle config <span class="nb">set</span> <span class="nt">--local</span> local.notifications ../notifications-engine
</code></pre></div></div>

<p>Now Bundler uses the local checkout instead of fetching from the remote. The <code>Gemfile.lock</code> stays unchanged – it still records the git remote and revision. Bundler verifies that the local repo is on the correct branch and that the revision exists.</p>

<p>To remove the override:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bundle config <span class="nb">unset</span> <span class="nt">--local</span> local.billing
</code></pre></div></div>

<p>The trade-off: <code>bundle config local</code> requires <code>branch:</code> in the Gemfile, not <code>tag:</code>. If your workflow pins to tags in production, you would switch to <code>branch: "main"</code> during development and pin to a tag for releases. For most teams, tracking <code>main</code> during development is fine – the tag pin happens at release time.</p>

<div class="diagram"><img src="/img/books/modular-rails/71359f1c15e74046bbcdbaee6d08aa1382badf86e2aee9c8203df021c89ae716.svg" alt="Mermaid diagram: Developer starts work"></div>

<p>The blue loop is the fast local development cycle – no pushing or tagging required. Only when you are done do you break out to the green release step.</p>

<h3 id="directory-layout">Directory layout</h3>

<p>The convention we use: engines live as siblings to the host app:</p>

<pre><code>projects/
├── my-app/              # Host application
├── billing-engine/      # Engine (separate repo)
├── notifications-engine/ # Engine (separate repo)
└── core-engine/         # Engine (separate repo)
</code></pre>

<p>A setup script clones everything:</p>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c">#!/bin/bash</span>
<span class="c"># setup.sh</span>

<span class="nv">GITHUB_ORG</span><span class="o">=</span><span class="s2">"your-org"</span>
<span class="nv">ENGINES</span><span class="o">=(</span><span class="s2">"billing-engine"</span> <span class="s2">"notifications-engine"</span> <span class="s2">"core-engine"</span><span class="o">)</span>

<span class="k">for </span>engine <span class="k">in</span> <span class="s2">"</span><span class="k">${</span><span class="nv">ENGINES</span><span class="p">[@]</span><span class="k">}</span><span class="s2">"</span><span class="p">;</span> <span class="k">do
  if</span> <span class="o">[</span> <span class="o">!</span> <span class="nt">-d</span> <span class="s2">"../</span><span class="nv">$engine</span><span class="s2">"</span> <span class="o">]</span><span class="p">;</span> <span class="k">then
    </span><span class="nb">echo</span> <span class="s2">"Cloning </span><span class="nv">$engine</span><span class="s2">..."</span>
    git clone <span class="s2">"git@github.com:</span><span class="nv">$GITHUB_ORG</span><span class="s2">/</span><span class="nv">$engine</span><span class="s2">.git"</span> <span class="s2">"../</span><span class="nv">$engine</span><span class="s2">"</span>
  <span class="k">else
    </span><span class="nb">echo</span> <span class="s2">"</span><span class="nv">$engine</span><span class="s2"> already exists, pulling latest..."</span>
    <span class="o">(</span><span class="nb">cd</span> <span class="s2">"../</span><span class="nv">$engine</span><span class="s2">"</span> <span class="o">&amp;&amp;</span> git pull<span class="o">)</span>
  <span class="k">fi
done

</span><span class="nb">echo</span> <span class="s2">"Use 'bundle config set --local local.&lt;engine&gt; ../&lt;engine&gt;' to develop an engine locally."</span>
</code></pre></div></div>

<p>New developers run <code>./setup.sh</code> once and they have the complete development environment.</p>

<hr />

<h2 id="versioning-strategy-git-tags-and-semantic-versioning">Versioning Strategy: Git Tags and Semantic Versioning</h2>

<p>Each engine has a version file:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># lib/billing/version.rb</span>

<span class="k">module</span> <span class="nn">Billing</span>
  <span class="no">VERSION</span> <span class="o">=</span> <span class="s2">"0.5.2"</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Follow semantic versioning strictly:</p>

<ul>
  <li><strong>Patch</strong> (0.5.3): Bug fixes. No interface changes. The host app can bump without reading the changelog.</li>
  <li><strong>Minor</strong> (0.6.0): New features, new concern methods, new configuration options. Backward-compatible. The host app might want to use the new features but doesn’t have to change anything.</li>
  <li><strong>Major</strong> (1.0.0): Breaking changes. Renamed methods, removed configuration options, changed concern interfaces. The host app must update its integration code.</li>
</ul>

<h3 id="the-release-workflow">The release workflow</h3>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># In the engine repository</span>
<span class="c"># 1. Make your changes, commit them</span>
git add <span class="nb">.</span>
git commit <span class="nt">-m</span> <span class="s2">"Add invoice PDF generation"</span>

<span class="c"># 2. Bump the version</span>
<span class="c"># Update lib/billing/version.rb</span>

<span class="c"># 3. Commit the version bump</span>
git add lib/billing/version.rb
git commit <span class="nt">-m</span> <span class="s2">"Bump version to 0.6.0"</span>

<span class="c"># 4. Tag the release</span>
git tag <span class="nt">-a</span> v0.6.0 <span class="nt">-m</span> <span class="s2">"Add invoice PDF generation"</span>

<span class="c"># 5. Push with tags</span>
git push origin main <span class="nt">--tags</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In the host app's Gemfile, bump the tag</span>
<span class="n">gem</span> <span class="s2">"billing"</span><span class="p">,</span> <span class="ss">git: </span><span class="s2">"git@github.com:your-org/billing-engine.git"</span><span class="p">,</span> <span class="ss">tag: </span><span class="s2">"v0.6.0"</span>
</code></pre></div></div>

<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c"># In the host app</span>
bundle update billing
</code></pre></div></div>

<p>The version bump is a deliberate decision. The host app’s <code>Gemfile.lock</code> records exactly which engine version is deployed. If something breaks, you know exactly which version introduced the problem.</p>

<div class="diagram"><img src="/img/books/modular-rails/e2238decab2f954171b0bceb7d308a81f57b049fbc293fa5921539b8a087ee6c.svg" alt="Mermaid diagram: Make changes in engine repo"></div>

<p>The top half (blue) happens in the engine repo. The bottom half (green) happens in the host app. The git tag is the handoff point between the two.</p>

<hr />

<h2 id="separate-repositories-vs-monorepo">Separate Repositories vs Monorepo</h2>

<p>Two approaches, each with trade-offs.</p>

<h3 id="separate-repositories">Separate repositories</h3>

<p>Each engine lives in its own git repository. This is what a fintech company I work with uses.</p>

<p><strong>Advantages:</strong></p>
<ul>
  <li>Clear ownership and access control per engine</li>
  <li>Independent CI pipelines – engine tests run only when engine code changes</li>
  <li>Versioned releases force deliberate integration</li>
  <li>Smaller repositories are faster to clone and search</li>
</ul>

<p><strong>Disadvantages:</strong></p>
<ul>
  <li>Cross-engine changes require coordinated PRs across repositories</li>
  <li>A <code>bundle config local</code> override is needed for local development</li>
  <li>Keeping dependency versions in sync requires attention</li>
</ul>

<p><strong>Best for:</strong> Teams larger than 8-10 developers, engines that are mature and change independently, engines that might be shared across multiple applications.</p>

<h3 id="monorepo-with-path-gems">Monorepo with path gems</h3>

<p>All engines live in the host app’s repository under <code>engines/</code>.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Gemfile</span>
<span class="n">gem</span> <span class="s2">"billing"</span><span class="p">,</span>       <span class="ss">path: </span><span class="s2">"engines/billing"</span>
<span class="n">gem</span> <span class="s2">"notifications"</span><span class="p">,</span>  <span class="ss">path: </span><span class="s2">"engines/notifications"</span>
</code></pre></div></div>

<p><strong>Advantages:</strong></p>
<ul>
  <li>Single repository to clone, one <code>git log</code> to search</li>
  <li>Cross-engine changes are a single PR</li>
  <li>No version management – the engine is always at “latest”</li>
  <li>No local-override config needed</li>
  <li>Atomic commits across engine boundaries</li>
</ul>

<p><strong>Disadvantages:</strong></p>
<ul>
  <li>No versioned releases – any change to any engine ships with the next deploy</li>
  <li>CI runs all engine tests on every push (unless you add selective execution)</li>
  <li>Access control is repository-level, not engine-level</li>
  <li>Repository grows large over time</li>
</ul>

<p><strong>Best for:</strong> Teams smaller than 8-10 developers, engines that are young and changing rapidly, applications where all engines deploy together.</p>

<h3 id="the-migration-path">The migration path</h3>

<p>Start with a monorepo. It’s simpler, and you don’t need versioning until the engines stabilise. When an engine matures – its interface is stable, its tests are comprehensive, it changes infrequently – promote it to its own repository with versioned tags.</p>

<p>This isn’t a one-way door. If a separate repository creates too much coordination overhead, bring it back into the monorepo. The engine’s code doesn’t care where the repository boundary is – <code>isolate_namespace</code> works the same either way.</p>

<hr />

<h2 id="code-review-across-engine-boundaries">Code Review Across Engine Boundaries</h2>

<p>When a developer changes an engine and bumps its version in the host app’s Gemfile, the PR has two parts: the engine change and the host app integration.</p>

<h3 id="for-monorepo-setups">For monorepo setups</h3>

<p>Both changes are in the same PR. Reviewers can see the full picture. Standard code review applies.</p>

<h3 id="for-separate-repository-setups">For separate repository setups</h3>

<p>Two PRs are needed:</p>

<ol>
  <li><strong>Engine PR:</strong> The change to the engine itself. Reviewed by the engine’s owners. Merged and tagged.</li>
  <li><strong>Host app PR:</strong> The Gemfile version bump and any integration changes. Reviewed by the host app team.</li>
</ol>

<p>The engine PR should be merged and tagged first. The host app PR references the new tag. This order ensures the engine change is stable before the host app depends on it.</p>

<h3 id="what-reviewers-should-check-at-the-boundary">What reviewers should check at the boundary</h3>

<ul>
  <li><strong>Does the engine expose new concerns or configuration?</strong> Review the interface carefully – it’s the contract other code depends on.</li>
  <li><strong>Does the engine reach into the host app?</strong> Any reference to a host app class is a red flag. The engine should use configuration or concerns, not direct references.</li>
  <li><strong>Does the Gemfile bump include only the intended changes?</strong> Check the engine’s changelog or diff between the old and new tags.</li>
  <li><strong>Do the integration tests cover the new functionality?</strong> Cross-engine workflows need testing at the host level.</li>
</ul>

<hr />

<h2 id="onboarding-new-developers">Onboarding New Developers</h2>

<p>A modular codebase is easier to onboard into than a monolith – if you document it right.</p>

<h3 id="the-engine-map">The engine map</h3>

<p>Create a visual map of your engines and their dependencies. This can be as simple as a text diagram in the README:</p>

<div class="diagram"><img src="/img/books/modular-rails/8d5546fa1bc84d1aeb1dbbe0271220f1014cd488df98807c42bde3958095e138.svg" alt="Mermaid diagram: Host App"></div>

<p>Arrows show dependency direction (A → B means A depends on B).</p>

<h3 id="the-first-task-strategy">The “first task” strategy</h3>

<p>Assign new developers their first task inside a single engine. They clone the engine (or navigate to <code>engines/billing/</code>), read the README, run the engine’s tests, make a small change, and submit a PR. They learn the engine pattern with a small, bounded scope.</p>

<p>Only after they’ve completed a task in one engine should they work on cross-engine features. By then, they understand the boundary patterns and can navigate the architecture confidently.</p>

<h3 id="engine-readmes">Engine READMEs</h3>

<p>Each engine should have a README that answers:</p>

<ul>
  <li>What business domain does this engine cover?</li>
  <li>What concerns does it expose to the host app?</li>
  <li>What configuration does it require?</li>
  <li>How do I run the tests?</li>
  <li>Who owns this engine?</li>
</ul>

<p>Keep it short. A developer should be able to read the README in two minutes and understand what the engine does and how to work with it.</p>

<h2 id="debugging-and-the-rails-console">Debugging and the Rails Console</h2>

<p>Working with engines in the Rails console and debugger requires a few adjustments to your usual workflow.</p>

<h3 id="engine-models-in-the-console">Engine models in the console</h3>

<p>Engine models are fully namespaced. You’ll type the full constant:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># In rails console</span>
<span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">count</span>
<span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">where</span><span class="p">(</span><span class="ss">status: </span><span class="s2">"pending"</span><span class="p">).</span><span class="nf">to_sql</span>
<span class="no">Notifications</span><span class="o">::</span><span class="no">Notification</span><span class="p">.</span><span class="nf">unread</span><span class="p">.</span><span class="nf">recent</span><span class="p">.</span><span class="nf">to_a</span>
</code></pre></div></div>

<p>Nothing surprising here, but it’s worth noting for developers new to the codebase. Tab completion works with namespaced constants – type <code>Bill</code> and hit Tab.</p>

<h3 id="engine-routes-in-the-console">Engine routes in the console</h3>

<p>The <code>app</code> helper in the console routes through the host app by default. To use engine route helpers:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># Host app routes</span>
<span class="n">app</span><span class="p">.</span><span class="nf">root_path</span>                    <span class="c1"># =&gt; "/"</span>

<span class="c1"># Engine routes via the mounted proxy</span>
<span class="n">app</span><span class="p">.</span><span class="nf">billing</span><span class="p">.</span><span class="nf">invoices_path</span>        <span class="c1"># =&gt; "/billing/invoices"</span>
<span class="n">app</span><span class="p">.</span><span class="nf">billing</span><span class="p">.</span><span class="nf">invoice_path</span><span class="p">(</span><span class="mi">1</span><span class="p">)</span>      <span class="c1"># =&gt; "/billing/invoices/1"</span>
<span class="n">app</span><span class="p">.</span><span class="nf">notifications</span><span class="p">.</span><span class="nf">notifications_path</span>  <span class="c1"># =&gt; "/notifications/notifications"</span>
</code></pre></div></div>

<p>The pattern is <code>app.&lt;mount_name&gt;.&lt;route_helper&gt;</code>. The mount name comes from the <code>as:</code> option in your routes (defaults to the engine name).</p>

<h3 id="reading-stack-traces-across-engines">Reading stack traces across engines</h3>

<p>When an error occurs inside an engine, the stack trace passes through engine code, the host app, and Rails internals. The key frames are usually:</p>

<pre><code>engines/billing/app/models/billing/invoice.rb:15:in `mark_as_paid!'
engines/billing/app/controllers/billing/invoices_controller.rb:8:in `update'
</code></pre>

<p>The <code>engines/</code> prefix makes them easy to spot. If you’re using an error tracker (Sentry, Honeybadger), add <code>engines/</code> to your in-app paths so engine frames aren’t collapsed as library code.</p>

<h3 id="breakpoints-in-engine-code">Breakpoints in engine code</h3>

<p>The <code>debug</code> gem works inside engines with no special configuration. Add a <code>debugger</code> statement anywhere in engine code:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/models/billing/invoice.rb</span>

<span class="k">def</span> <span class="nf">mark_as_paid!</span>
  <span class="n">debugger</span>  <span class="c1"># Drops you into the engine's model context</span>
  <span class="n">update!</span><span class="p">(</span><span class="ss">status: </span><span class="s2">"paid"</span><span class="p">,</span> <span class="ss">paid_at: </span><span class="no">Time</span><span class="p">.</span><span class="nf">current</span><span class="p">)</span>
<span class="k">end</span>
</code></pre></div></div>

<p>When the breakpoint hits, you have full access to the engine’s context – <code>self</code>, associations, scopes, everything. You can also step into event subscribers and background jobs to trace cross-engine flows.</p>

<h3 id="reloading-engine-code-in-development">Reloading engine code in development</h3>

<p>In development, engine code reloads automatically on each request – Zeitwerk handles this for engines the same way it handles host app code. But if you’re in the Rails console and want to pick up changes:</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="n">reload!</span>
</code></pre></div></div>

<p>This reloads both host app and engine code. There’s one gotcha: if you change an engine’s <code>engine.rb</code> or any initialiser, you need to restart the console entirely. Only application code (models, controllers, jobs) reloads – configuration runs once at boot.</p>

<hr />

<h2 id="dependency-injection">Dependency Injection</h2>

<p>As your engine count grows beyond four or five, wiring engine services into the host app can become scattered across initializers. For most teams, the <code>mattr_accessor</code> configuration pattern from Chapter 8 is sufficient. If you find yourself needing a more structured approach, Appendix B includes a recipe for using <code>Dry::Container</code> to centralise service wiring.</p>

<hr />

<h2 id="admin-panels-across-engines">Admin Panels Across Engines</h2>

<p>Once you have three or four engines, the admin question becomes unavoidable. You need to manage invoices (billing), notification templates, user accounts – all from one admin interface. Where does that admin code live?</p>

<p>There’s no single right answer. It depends on team size and who owns what.</p>

<h3 id="option-a-host-app-admin">Option A: Host-App Admin</h3>

<p>The simplest approach. All admin controllers live in the host app. They reach into engine models directly.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/controllers/admin/invoices_controller.rb</span>
<span class="k">class</span> <span class="nc">Admin::InvoicesController</span> <span class="o">&lt;</span> <span class="no">Admin</span><span class="o">::</span><span class="no">ApplicationController</span>
  <span class="k">def</span> <span class="nf">index</span>
    <span class="vi">@invoices</span> <span class="o">=</span> <span class="no">Billing</span><span class="o">::</span><span class="no">Invoice</span><span class="p">.</span><span class="nf">recent</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># app/controllers/admin/notification_templates_controller.rb</span>
<span class="k">class</span> <span class="nc">Admin::NotificationTemplatesController</span> <span class="o">&lt;</span> <span class="no">Admin</span><span class="o">::</span><span class="no">ApplicationController</span>
  <span class="k">def</span> <span class="nf">index</span>
    <span class="vi">@templates</span> <span class="o">=</span> <span class="no">Notifications</span><span class="o">::</span><span class="no">Template</span><span class="p">.</span><span class="nf">all</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p><strong>Advantage:</strong> One admin panel to maintain. One set of layouts, one navigation, one authentication setup. New developers know exactly where admin code lives.</p>

<p><strong>Disadvantage:</strong> The host app needs to know about every engine’s models. Admin code for the billing domain lives outside the billing engine. When the billing team changes their models, the host app’s admin controllers break.</p>

<h3 id="option-b-engine-scoped-admin">Option B: Engine-Scoped Admin</h3>

<p>Each engine provides its own admin controllers, namespaced under <code>Admin</code> within the engine.</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/app/controllers/billing/admin/invoices_controller.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">module</span> <span class="nn">Admin</span>
    <span class="k">class</span> <span class="nc">InvoicesController</span> <span class="o">&lt;</span> <span class="no">Billing</span><span class="o">::</span><span class="no">ApplicationController</span>
      <span class="k">def</span> <span class="nf">index</span>
        <span class="vi">@invoices</span> <span class="o">=</span> <span class="no">Invoice</span><span class="p">.</span><span class="nf">order</span><span class="p">(</span><span class="ss">created_at: :desc</span><span class="p">).</span><span class="nf">page</span><span class="p">(</span><span class="n">params</span><span class="p">[</span><span class="ss">:page</span><span class="p">])</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/config/routes.rb</span>
<span class="no">Billing</span><span class="o">::</span><span class="no">Engine</span><span class="p">.</span><span class="nf">routes</span><span class="p">.</span><span class="nf">draw</span> <span class="k">do</span>
  <span class="n">resources</span> <span class="ss">:invoices</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:index</span><span class="p">,</span> <span class="ss">:show</span><span class="p">]</span>
  <span class="n">resources</span> <span class="ss">:subscriptions</span><span class="p">,</span> <span class="ss">only: </span><span class="p">[</span><span class="ss">:index</span><span class="p">,</span> <span class="ss">:show</span><span class="p">]</span>

  <span class="n">namespace</span> <span class="ss">:admin</span> <span class="k">do</span>
    <span class="n">resources</span> <span class="ss">:invoices</span>
    <span class="n">resources</span> <span class="ss">:plans</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>The host app mounts the engine as usual, and the admin routes are available at <code>/billing/admin/invoices</code>.</p>

<p><strong>Advantage:</strong> Admin code lives with the domain it manages. The billing team owns their admin views. When they change their models, they update the admin controllers in the same PR. No cross-repo coordination needed.</p>

<p><strong>Disadvantage:</strong> You need a way to stitch all engine admin panels into one navigation. A shared layout partial or a registry of admin links solves this, but it’s extra wiring.</p>

<h3 id="option-c-third-party-admin-framework">Option C: Third-Party Admin Framework</h3>

<p>If you’re already using ActiveAdmin, Avo, or Administrate, you can load each engine’s admin definitions using the initializer hook pattern from Chapter 8 (Pattern 4):</p>

<div class="language-ruby highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># engines/billing/lib/billing/engine.rb</span>
<span class="k">module</span> <span class="nn">Billing</span>
  <span class="k">class</span> <span class="nc">Engine</span> <span class="o">&lt;</span> <span class="o">::</span><span class="no">Rails</span><span class="o">::</span><span class="no">Engine</span>
    <span class="n">isolate_namespace</span> <span class="no">Billing</span>

    <span class="n">initializer</span> <span class="s2">"billing.active_admin"</span> <span class="k">do</span>
      <span class="k">if</span> <span class="k">defined?</span><span class="p">(</span><span class="no">ActiveAdmin</span><span class="p">)</span>
        <span class="no">ActiveAdmin</span><span class="p">.</span><span class="nf">application</span><span class="p">.</span><span class="nf">load_paths</span> <span class="o">+=</span> <span class="no">Dir</span><span class="p">[</span><span class="no">Engine</span><span class="p">.</span><span class="nf">root</span><span class="p">.</span><span class="nf">join</span><span class="p">(</span><span class="s2">"app/admin"</span><span class="p">)]</span>
      <span class="k">end</span>
    <span class="k">end</span>
  <span class="k">end</span>
<span class="k">end</span>
</code></pre></div></div>

<p>Each engine ships its own <code>app/admin/</code> directory with resource definitions. ActiveAdmin picks them up automatically. The host app doesn’t need to know the details – just mount ActiveAdmin as normal.</p>

<p><strong>Advantage:</strong> You get a polished admin UI without building one. Engine teams still own their admin definitions.</p>

<p><strong>Disadvantage:</strong> You’re coupling every engine to a third-party framework. If you ever want to switch admin tools, every engine needs updating. And these frameworks have their own opinions about how models should behave, which can clash with your engine boundaries.</p>

<h3 id="which-option-to-pick">Which Option to Pick</h3>

<p>Start with <strong>Option A</strong> for small teams (under five developers). It’s the least code and the easiest to reason about. The coupling between host app and engine models is real, but at that team size, the same people are working on both sides anyway.</p>

<p>Move to <strong>Option B</strong> when engine teams want ownership of their admin. This usually happens around the time you split into separate repositories – the team that owns the billing engine shouldn’t need to submit PRs to the host app just to add an admin filter.</p>

<p>Use <strong>Option C</strong> only if you’re already committed to a third-party admin framework. Don’t adopt ActiveAdmin just to solve the multi-engine admin problem. The engine initializer hook is elegant, but you’re taking on a significant dependency.</p>

<table>
  <thead>
    <tr>
      <th> </th>
      <th>Option A: Host-App Admin</th>
      <th>Option B: Engine-Scoped Admin</th>
      <th>Option C: Third-Party Framework</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Admin lives in</strong></td>
      <td>Host app</td>
      <td>Each engine</td>
      <td>Host app (via framework)</td>
    </tr>
    <tr>
      <td><strong>Controllers</strong></td>
      <td><code>Admin::InvoicesController</code> in host</td>
      <td><code>Billing::Admin::InvoicesController</code> in engine</td>
      <td><code>app/admin/invoices.rb</code> (ActiveAdmin DSL)</td>
    </tr>
    <tr>
      <td><strong>Engine coupling</strong></td>
      <td>Host reads engine models directly</td>
      <td>Engine owns its own admin routes</td>
      <td>Engine registers resources via initializer</td>
    </tr>
    <tr>
      <td><strong>Best for</strong></td>
      <td>Small teams (&lt; 5 devs)</td>
      <td>Separate repos, engine team ownership</td>
      <td>Teams already using ActiveAdmin</td>
    </tr>
    <tr>
      <td><strong>Trade-off</strong></td>
      <td>Simplest, but couples host to engine internals</td>
      <td>More code, but engine teams own their admin</td>
      <td>Elegant hook, but adds framework dependency</td>
    </tr>
  </tbody>
</table>

<hr />

<h2 id="day-to-day-workflow-summary">Day-to-Day Workflow Summary</h2>

<p>Here’s what daily development looks like in a modular Rails app:</p>

<p><strong>Working on a single engine:</strong></p>
<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code>bundle config <span class="nb">set</span> <span class="nt">--local</span> local.billing ../billing-engine  <span class="c"># Use local engine</span>
<span class="nb">cd </span>engines/billing                      <span class="c"># Navigate to the engine</span>
bundle <span class="nb">exec </span>rspec                       <span class="c"># Run engine tests (fast)</span>
<span class="c"># ... make changes, run tests, iterate ...</span>
<span class="nb">cd</span> ../..                                <span class="c"># Back to host app</span>
bundle <span class="nb">exec </span>rspec spec/integration/     <span class="c"># Run integration tests</span>
git add <span class="nb">.</span> <span class="o">&amp;&amp;</span> git commit                 <span class="c"># Commit</span>
</code></pre></div></div>

<p><strong>Releasing an engine change (separate repos):</strong></p>
<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd</span> ../billing-engine
git add <span class="nb">.</span> <span class="o">&amp;&amp;</span> git commit <span class="nt">-m</span> <span class="s2">"Add discount codes"</span>
<span class="c"># bump version in lib/billing/version.rb</span>
git commit <span class="nt">-m</span> <span class="s2">"Bump to v0.6.0"</span>
git tag <span class="nt">-a</span> v0.6.0 <span class="nt">-m</span> <span class="s2">"Add discount codes"</span>
git push origin main <span class="nt">--tags</span>

<span class="nb">cd</span> ../my-app
<span class="c"># update Gemfile tag to v0.6.0</span>
bundle update billing
bundle <span class="nb">exec </span>rspec
git add <span class="nb">.</span> <span class="o">&amp;&amp;</span> git commit <span class="nt">-m</span> <span class="s2">"Bump billing engine to v0.6.0"</span>
</code></pre></div></div>

<p><strong>Adding a new engine:</strong></p>
<div class="language-bash highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="nb">cd </span>my-app
rails plugin new engines/reporting <span class="nt">--mountable</span> <span class="nt">--database</span><span class="o">=</span>postgresql
<span class="c"># Configure engine, add to Gemfile, mount routes</span>
<span class="c"># Start writing code</span>
</code></pre></div></div>

<p>The workflow is designed to be familiar. It’s the same <code>git</code>, <code>bundle</code>, <code>rspec</code> commands Rails developers already know. The engines add structure, not ceremony.</p>

<h2 id="deploying-with-kamal">Deploying with Kamal</h2>

<p>Kamal 2 is Rails’ default deployment tool, and it works well with engine-based applications. The key considerations are worker configuration, the shutdown window, and Docker builds.</p>

<h3 id="configuring-solid-queue-workers-per-engine">Configuring Solid Queue workers per engine</h3>

<p>Your <code>config/deploy.yml</code> defines accessories for background workers. With engine-based queue naming, you can run dedicated workers per engine:</p>

<div class="language-yaml highlighter-rouge"><div class="highlight"><pre class="highlight"><code><span class="c1"># config/deploy.yml</span>

<span class="na">service</span><span class="pi">:</span> <span class="s">myapp</span>

<span class="na">servers</span><span class="pi">:</span>
  <span class="na">billing-worker</span><span class="pi">:</span>
    <span class="na">hosts</span><span class="pi">:</span>
      <span class="pi">-</span> <span class="s">worker-1.example.com</span>
    <span class="na">cmd</span><span class="pi">:</span> <span class="s">bundle exec rake solid_queue:start</span>

  <span class="na">notifications-worker</span><span class="pi">:</span>
    <span class="na">hosts</span><span class="pi">:</span>
      <span class="pi">-</span> <span class="s">worker-1.example.com</span>
    <span class="na">cmd</span><span class="pi">:</span> <span class="s">bundle exec rake solid_queue:start</span>

  <span class="na">default-worker</span><span class="pi">:</span>
    <span class="na">hosts</span><span class="pi">:</span>
      <span class="pi">-</span> <span class="s">worker-2.example.com</span>
    <span class="na">cmd</span><span class="pi">:</span> <span class="s">bundle exec rake solid_queue:start</span>
</code></pre></div></div>

<p>Queue-to-worker mapping is configured in <code>config/solid_queue.yml</code> (see Chapter 5), not via environment variables. Each worker process defined above runs its own Solid Queue supervisor, picking up the queues assigned to it in the YAML configuration. Kamal handles the process lifecycle; Solid Queue handles queue assignment.</p>

<h3 id="the-30-second-shutdown-window">The 30-second shutdown window</h3>

<p>When Kamal deploys, it sends SIGTERM to running containers and waits 30 seconds before SIGKILL. This affects engine jobs differently depending on their runtime:</p>

<ul>
  <li><strong>Fast jobs</strong> (notifications, webhooks): Usually finish within the window. No special handling needed.</li>
  <li><strong>Slow jobs</strong> (report generation, batch processing): Need the cursor-based resumable pattern (Chapter 8, Pattern 8) to checkpoint progress and resume after deploy.</li>
</ul>

<p>The practical rule: any engine job that regularly takes more than 10 seconds should use the cursor pattern to batch and re-enqueue. You want a comfortable margin, not a race against the shutdown clock.</p>

<h3 id="docker-build-considerations">Docker build considerations</h3>

<p>For monorepo setups (engines live inside <code>engines/</code>), the Dockerfile is straightforward – <code>COPY . .</code> captures everything. For separate-repo engines, you have two options:</p>

<ol>
  <li><strong>Private gem server:</strong> Publish engine gems to a private Gemfury, Packager, or GitHub Packages registry. The Dockerfile does a normal <code>bundle install</code> and pulls engines as regular gems.</li>
  <li><strong>Multi-stage build with git:</strong> Clone engine repos in a build stage and reference them as path gems. More complex, but avoids running a gem server.</li>
</ol>

<p>The monorepo approach is simpler to build and deploy. If you’re on separate repos, invest in a private gem server early – it pays for itself in CI simplicity alone.</p>

<h3 id="thruster">Thruster</h3>

<p>Rails 8’s default Dockerfile includes Thruster, an HTTP proxy that sits in front of Puma, handling asset serving, compression, and X-Sendfile. There are no engine-specific concerns here – Thruster serves the compiled asset pipeline output regardless of which engine contributed the assets. Propshaft (or Sprockets) handles the merging; Thruster just serves the result.</p>

<hr />

<p><em>Part III is now complete. You know how to identify boundaries, extract engines, manage dependencies, handle data ownership, design test strategies, and build team workflows. In Part IV, we address the hardest question honestly: when is all of this the wrong approach?</em></p>


<nav class="quire-chapter-nav">
  <a class="quire-chapter-nav__prev" href="/books/modular-rails/chapter-13-testing-strategy/">&larr; Testing Strategy for a Modular Monolith</a>
  <a class="quire-chapter-nav__toc" href="/books/modular-rails/">Contents</a>
  <a class="quire-chapter-nav__next" href="/books/modular-rails/chapter-15-when-engines-are-wrong/">When Engines Are the Wrong Tool &rarr;</a>
</nav>
{% endraw %}
