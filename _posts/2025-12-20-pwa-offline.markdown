---
layout: post
title:  "PWA Offline Architecture: Lessons from Building CarerNotes"
date:   2025-12-20 22:38:00
categories: web-development pwa architecture
tags: [pwa, offline-first, service-worker, indexeddb, progressive-web-apps, javascript, healthcare-tech, web-architecture, rails]
---

*A technical deep-dive into building a production-ready Progressive Web App with offline-first architecture*

---

## The Problem: Carers in Dead Zones

I've been building [CarerNotes](https://carernotes.uk/) for a while now – it's an AI-powered documentation tool for domiciliary carers. These are healthcare workers who visit patients in their homes, record audio notes during visits, and need those recordings transcribed into CQC-compliant care documentation.

Here's where it gets interesting: carers work in environments with terrible connectivity. Rural areas. Basement flats. Care homes with thick concrete walls. Buildings where even 4G struggles to penetrate. Honestly, I didn't fully appreciate just how bad connectivity could be until I started talking to actual carers.

So I needed an app that:
- Works completely offline
- Records audio reliably without network
- Syncs automatically when connectivity returns
- Runs on any device (Android, iOS, desktop)

The conventional wisdom would be: build native apps for iOS and Android. I went a different route. Was it the right call? Keep reading.

---

## Why PWA Over Native Apps

### One Codebase, Zero App Store Drama

The maths is simple. Native development means:

- **Two codebases** (Swift/Kotlin or React Native with platform-specific code)
- **Two review processes** (App Store reviews can take hours to days, plus back-and-forth if rejected)
- **Two sets of bugs** (platform-specific edge cases)
- **Two deployment pipelines**

As a solo developer, that's not just inefficient – it's impossible to maintain well. I know my limits. With a PWA, I have:

- **One codebase** (Rails + Stimulus + vanilla JavaScript)
- **Instant deployment** (git push, users get updates on next visit)
- **No gatekeepers** (no App Store rejection for arbitrary reasons)
- **Sustainable maintenance** (one person, one stack)

### The Technology Is Ready

In 2025, PWAs are production-ready. The key APIs I depend on all have excellent browser support:

| API | Purpose | Support |
|-----|---------|---------|
| Service Workers | Offline caching, background sync | All modern browsers |
| IndexedDB | Client-side database | All modern browsers |
| MediaRecorder | Audio recording | All modern browsers |
| Cache API | Asset caching | All modern browsers |

The only meaningful limitation is iOS Safari, which I'll address later. Spoiler: it's frustrating, but workable.

### Users Can't Tell the Difference

This was my "aha moment". When I put the PWA in front of carers, they treated it like a native app. They added it to their home screen. They used it offline. They never asked "is this a real app?"

The distinction between "web app" and "native app" is a developer concern, not a user concern. I wish I'd understood this sooner – I spent weeks overthinking the decision.

---

## Architecture: Offline-First from the Ground Up

My offline architecture uses multiple storage layers, each with a specific purpose:

*Diagram: Storage hierarchy – IndexedDB (primary), Cache API (backup), localStorage (metadata), Service Worker cache (assets).*

```mermaid
flowchart TB
    subgraph Browser["Browser Storage"]
        subgraph IDB["IndexedDB (Primary)"]
            visits["visits store<br/>Offline-created visits"]
            recordings["recordings store<br/>Audio chunks & blobs"]
            patients["patients store<br/>Cached patient list"]
        end

        subgraph Cache["Cache API (Backup)"]
            backup["Recording blob backup<br/>for recovery"]
        end

        subgraph LS["localStorage (Metadata)"]
            meta["Recording metadata<br/>for cross-tab recovery"]
        end

        subgraph SW["Service Worker Cache"]
            assets["HTML, JS, CSS, images"]
        end
    end

    IDB --> Cache
    Cache --> LS

    style IDB fill:#4ade80,stroke:#22c55e
    style Cache fill:#60a5fa,stroke:#3b82f6
    style LS fill:#fbbf24,stroke:#f59e0b
    style SW fill:#c084fc,stroke:#a855f7
```

### Why Multiple Storage Layers?

You might be thinking: "Isn't this overkill?" Fair question. Let me explain.

**IndexedDB** is my primary store because it handles large blobs (audio recordings can be 50MB+) and provides proper database semantics.

**Cache API** acts as a backup for audio recordings. If IndexedDB fails or gets cleared, I can recover from the Cache API. This has saved me more than once during testing.

**localStorage** stores lightweight metadata that survives even if both IndexedDB and Cache API are cleared. It's my last line of defence.

*Diagram: Recording redundancy – data flows to IndexedDB, Cache API, and localStorage simultaneously; recovery possible from any layer.*

```mermaid
flowchart TD
    Recording[Audio Recording Created]

    Recording --> IDB[(IndexedDB<br/>Primary Storage)]
    Recording --> Cache[(Cache API<br/>Backup Storage)]
    Recording --> LS[(localStorage<br/>Metadata Only)]

    IDB -->|On Sync| Server[(Server)]
    Cache -.->|If IDB fails| Recover[Recovery Process]
    LS -.->|If both fail| Recover

    Recover --> Server

    style IDB fill:#4ade80,stroke:#22c55e
    style Cache fill:#60a5fa,stroke:#3b82f6
    style LS fill:#fbbf24,stroke:#f59e0b
    style Server fill:#a855f7,stroke:#9333ea
```

This triple redundancy means I've never lost a recording. And believe me, losing a carer's 15-minute audio note would be catastrophic – they can't exactly re-do that visit.

---

## Challenge 1: IndexedDB Is Async Everything

Oh boy, IndexedDB has a learning curve. Unlike localStorage, every operation is asynchronous. You can't just `getItem()` and get a value back. I didn't know this going in, and my first attempts were... not great.

Here's how I wrap IndexedDB for ergonomic use:

```javascript
// app/javascript/services/offline_visits.js

class OfflineVisits {
  constructor() {
    this.dbName = 'carernotes-offline-data';
    this.dbVersion = 3;
    this.db = null;
  }

  async open() {
    if (this.db) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('visits')) {
          const store = db.createObjectStore('visits', { keyPath: 'id' });
          store.createIndex('syncStatus', 'syncStatus', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  async createVisit(visitData) {
    const db = await this.open();
    const visit = {
      id: crypto.randomUUID(),
      ...visitData,
      syncStatus: 'pending',
      createdAt: new Date().toISOString(),
      createdOffline: true
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction('visits', 'readwrite');
      const store = tx.objectStore('visits');
      const request = store.add(visit);

      request.onsuccess = () => resolve(visit);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingVisits() {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('visits', 'readonly');
      const store = tx.objectStore('visits');
      const index = store.index('syncStatus');
      const request = index.getAll('pending');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const offlineVisits = new OfflineVisits();
```

The key insight: wrap everything in Promises. Build a clean async API on top of IndexedDB's callback-based interface. Once I figured this out, working with IndexedDB became much more pleasant.

---

## Challenge 2: Service Worker Gotchas

Service workers are powerful but have sharp edges. Here are the lessons I learned – mostly the hard way.

### Gotcha 1: Cache Versioning Is Critical

When you update your service worker, old cached pages can conflict with new JavaScript. I use a version number in the cache name:

```javascript
// app/views/pwa/service-worker.js

const CACHE_NAME = 'carernotes-v11';

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('carernotes-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

Bump the version, old caches get deleted, users get fresh code. Simple, but I forgot to do this once and spent an embarrassing amount of time debugging why my changes weren't showing up.

### Gotcha 2: Network-First for HTML, Cache-First for Assets

I use different strategies for different resources:

*Diagram: Request routing – API calls bypass cache, static assets use cache-first, HTML pages use network-first with offline fallback.*

```mermaid
flowchart LR
    Request[Incoming Request]

    Request --> Check{Request Type?}

    Check -->|API /api/*| API[Network Only<br/>App handles offline]

    Check -->|Static Assets<br/>.js .css .png| CacheFirst
    subgraph CacheFirst[Cache-First Strategy]
        C1[Check Cache] -->|Hit| C2[Return Cached]
        C1 -->|Miss| C3[Fetch Network]
        C3 --> C4[Cache Response]
        C4 --> C5[Return Response]
    end

    Check -->|HTML Pages| NetworkFirst
    subgraph NetworkFirst[Network-First Strategy]
        N1[Try Network] -->|Success| N2[Cache & Return]
        N1 -->|Fail| N3[Return Cached]
        N3 -->|No Cache| N4[Return /offline]
    end

    style API fill:#ef4444,stroke:#dc2626
    style CacheFirst fill:#22c55e,stroke:#16a34a
    style NetworkFirst fill:#3b82f6,stroke:#2563eb
```

```javascript
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API calls: network only (I handle offline in the app)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Static assets: cache first
  if (url.pathname.match(/\.(js|css|png|svg|woff2)$/)) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  // HTML pages: network first, fall back to cache
  event.respondWith(networkFirst(event.request));
});

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    return cached || caches.match('/offline');
  }
}
```

### Gotcha 3: Prefetch Critical Pages

Users can't access a page offline unless it's cached. This sounds obvious now, but I only realised it after a tester complained they couldn't create visits offline. I prefetch the pages they'll need:

```javascript
// When user logs in, prefetch critical pages
const CRITICAL_PAGES = ['/visits', '/visits/new', '/visits/offline/_template'];

async function prefetchCriticalPages() {
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(CRITICAL_PAGES);
}
```

### How Do You Even Test This?

Testing offline functionality is awkward. Here's what works for me:

1. **Chrome DevTools → Application → Service Workers → Offline checkbox** – Quick toggle for basic testing
2. **Network tab → Throttle to "Offline"** – More realistic, affects all requests
3. **Real devices with airplane mode** – The only way to catch Safari-specific bugs
4. **Simulate flaky networks** – Chrome's "Slow 3G" preset exposes race conditions

The key insight: don't just test "online" and "offline" – test the transitions. What happens if connectivity drops mid-upload? What if it flickers on and off? Those edge cases are where bugs hide.

---

## Challenge 3: navigator.onLine Lies

This was my most frustrating discovery. `navigator.onLine` returns `true` even when you have no actual internet connectivity. It only knows about the network interface, not whether packets can reach the internet.

Do you have any idea how long I spent debugging sync failures before I figured this out? Too long.

My solution: **don't trust navigator.onLine for sync decisions**.

```javascript
// DON'T do this
if (navigator.onLine) {
  await syncVisits(); // Will fail if network is actually down
}

// DO this: try the request, handle failure
async submit(event) {
  event.preventDefault(); // Always prevent default

  try {
    // Try online first
    const response = await fetch('/api/v1/visits', {
      method: 'POST',
      body: JSON.stringify(visitData)
    });

    if (response.ok) {
      window.location.href = `/visits/${response.json().id}`;
      return;
    }
  } catch (error) {
    // Network failed - fall through to offline save
  }

  // Save offline
  const visit = await offlineVisits.createVisit(visitData);
  window.location.href = `/visits/offline/${visit.id}`;
}
```

I only sync when the browser fires the `online` event – that's a reliable signal that connectivity state has changed.

```javascript
window.addEventListener('online', async () => {
  await this.delay(500); // Wait for network to stabilise
  await this.syncPendingVisits();
});
```

Here's the complete sync flow:

*Diagram: Sync sequence – form submission tries network first, falls back to IndexedDB if offline, syncs pending visits when online event fires.*

```mermaid
sequenceDiagram
    participant User
    participant App
    participant IndexedDB
    participant Server

    User->>App: Submit visit form
    App->>Server: POST /api/visits
    alt Network Available
        Server-->>App: 201 Created
        App-->>User: Redirect to visit
    else Network Fails
        App->>IndexedDB: Save visit (pending)
        App-->>User: Redirect to offline view
    end

    Note over App: Later, when online...

    App->>App: online event fires
    App->>App: Wait 500ms (stabilise)
    App->>IndexedDB: Get pending visits
    IndexedDB-->>App: Return pending visits
    loop For each pending visit
        App->>Server: POST /api/visits
        Server-->>App: 201 Created
        App->>IndexedDB: Mark as synced
    end
```

---

## iOS Safari: The Elephant in the Room

iOS Safari is the weakest link for PWAs. Apple has historically been hostile to web apps that compete with the App Store. Surprise, surprise. Here's what I deal with:

### Storage Quotas and Eviction

Safari 17+ uses a dynamic quota system based on disk space – up to 60% of total disk for browser apps, which is quite generous on modern devices. The old "1GB limit" you might read about in older articles no longer applies.

However, Safari has a 7-day eviction policy: if a user doesn't interact with your site for a week, Safari can purge your IndexedDB and Cache API data. This is the real concern for an app used by carers who might take a week's holiday.

My mitigation: aggressive cleanup after successful sync (delete from IndexedDB, Cache API, and localStorage), and clear UI messaging about sync status.

### No Background Sync

Safari doesn't support the Background Sync API. If the user closes the browser mid-sync, that sync attempt is lost. Frustrating, but not a dealbreaker.

My mitigation: sync early and often. I attempt sync as soon as the `online` event fires, and show clear UI indicating sync status. Users learn quickly that they should wait for the "synced" confirmation.

### Service Worker Eviction

Safari can evict service workers after a few weeks of inactivity. The next visit will re-register, but there's a jarring moment.

My mitigation: accept it. The service worker re-registers quickly, and IndexedDB data persists. Not ideal, but I'd rather ship a working product than wait for Apple to fix Safari.

---

## Security: What's Different for Healthcare Data

Building a PWA that handles healthcare data adds extra considerations. Carers record sensitive patient information – names, conditions, medications – and that data lives on their devices, sometimes offline for hours.

### HTTPS and HSTS

Service workers won't register without HTTPS – this is a feature, not a bug. I use Let's Encrypt for free certificates and configure HSTS to force HTTPS on all future visits. Standard stuff, but non-negotiable.

### Client-Side Encryption

Here's the uncomfortable truth: IndexedDB isn't encrypted by default. Anyone with physical access to the device can potentially read it. For healthcare data, that's not acceptable.

I encrypt sensitive fields using the Web Crypto API (AES-GCM) before storing them. The encryption key is derived from the user's session – if they're logged out, the data becomes unreadable. Combined with aggressive cleanup after sync, this provides reasonable protection.

### GDPR Compliance

CarerNotes handles personal health data, which means GDPR applies with extra weight:

- Clear consent mechanisms before recording
- Data minimisation – only store what's necessary
- Right to deletion – users can purge their data
- Audit logs for data access

Honestly, compliance is ongoing work. I'm not claiming perfection here, but these are the foundations. For a deeper dive into PWA security, the [OWASP guidelines](https://owasp.org/www-project-web-security-testing-guide/) are worth reading.

---

## What I'd Do Differently

If I started over, here's what I'd change:

### Build Offline-First from Day One

Honestly, I initially built the "happy path" (online flow) first, then added offline capabilities later. This meant retrofitting offline support into existing code. It worked, but it was messier than it needed to be.

The better approach:

1. Every user action saves to IndexedDB first
2. A background process syncs to the server
3. The UI never waits for network responses

This "local-first" architecture is more work upfront but eliminates an entire class of bugs around network reliability.

### Plan for IndexedDB Schema Migrations

Unlike SQL databases, IndexedDB schema changes only happen in the `onupgradeneeded` callback, and you need to handle existing data carefully. Plan your schema upfront, or at least understand how `onupgradeneeded` versioning works before you need it.

### Test on Real Devices Earlier

Chrome DevTools' offline mode is useful, but it doesn't catch everything. I found bugs on actual iPhones that never appeared in simulation – particularly around audio recording permissions and Safari's quirky service worker behaviour and constraints.

### Don't Underestimate Sync Conflicts

What happens when a carer edits a note offline, and someone else edits it on another device?
If your app has any multi-user editing, think about conflict resolution early.

---

## The Bottom Line

[CarerNotes](https://carernotes.uk/) is still in development – we haven't officially launched yet. But through testing, I've validated that the offline-first PWA approach works. Recordings save locally, sync reliably when connectivity returns, and the triple-redundancy storage has caught every edge case I've thrown at it.

The PWA decision has already paid off:
- No App Store fees or approval delays
- One codebase running on Android, iOS, and desktop
- Instant deploys – git push and it's live
- No platform-specific bugs to chase

The technology is ready. The APIs are stable. The browser support is there.

If you're building a new app in 2025 and considering native vs. PWA, I'd encourage you to seriously evaluate the PWA route.
For many applications – especially those that need to work offline – it's not just viable, it's superior.

---

## Resources

- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [What PWAs Can Do Today](https://whatpwacando.today/)
- [web.dev PWA Guide](https://web.dev/progressive-web-apps/)

---

Thank you for reading, David Silva
