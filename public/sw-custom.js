// VitaConnect Service Worker — full offline support
// Handles: static cache, API cache, push notifications, background sync

const CACHE_VERSION   = "v2";
const STATIC_CACHE    = `vitaconnect-static-${CACHE_VERSION}`;
const API_CACHE       = `vitaconnect-api-${CACHE_VERSION}`;
const OFFLINE_PAGE    = "/offline";

// Pages to cache immediately on install
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/offline",
  "/appointments",
  "/health-data",
  "/doctors",
  "/prescriptions",
  "/lab-results",
  "/records",
  "/messages",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// API routes to cache with network-first (show stale when offline)
const API_CACHE_PATTERNS = [
  /\/api\/health-data/,
  /\/api\/appointments/,
  /\/api\/prescriptions/,
  /\/api\/lab-results/,
  /\/api\/profile/,
  /\/api\/doctors/,
  /\/api\/notifications/,
];

// API routes NEVER to cache (auth, payments, messages)
const NO_CACHE_PATTERNS = [
  /\/api\/auth/,
  /\/api\/payments/,
  /\/api\/messages/,
  /\/api\/reviews/,
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate — purge old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const VALID = [STATIC_CACHE, API_CACHE];
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => !VALID.includes(k)).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch strategy ────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET
  if (request.method !== "GET") return;

  // Skip cross-origin (analytics, fonts from CDN etc.)
  if (url.origin !== self.location.origin) return;

  // Never cache auth/payment routes
  if (NO_CACHE_PATTERNS.some((p) => p.test(url.pathname))) return;

  // API routes — network first, fall back to cache
  if (API_CACHE_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(networkFirstAPI(request));
    return;
  }

  // Navigation (page loads) — network first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(navigationStrategy(request));
    return;
  }

  // Static assets — cache first
  event.respondWith(cacheFirstStatic(request));
});

// Network-first for API — serves stale data when offline
async function networkFirstAPI(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Return empty JSON so app doesn't crash
    return new Response(
      JSON.stringify({ offline: true, error: "No cached data available" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}

// Navigation — serve page or offline fallback
async function navigationStrategy(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try exact match first, then offline page
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match(OFFLINE_PAGE);
  }
}

// Cache-first for static assets
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("Offline", { status: 503 });
  }
}

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "VitaConnect", body: event.data.text() }; }

  const options = {
    body:    payload.body ?? payload.message ?? "",
    icon:    "/icons/icon-192x192.png",
    badge:   "/icons/badge-icon.png",
    vibrate: [200, 100, 200],
    data:    { url: payload.url ?? "/dashboard", ...payload.data },
    tag:     payload.tag ?? "vitaconnect",
    requireInteraction: payload.requireInteraction ?? false,
    actions: payload.actions ?? [],
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "VitaConnect", options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        return existing.navigate(targetUrl);
      }
      return clients.openWindow(targetUrl);
    })
  );
});

// ── Background sync — offline health metric queue ─────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-health-metrics") {
    event.waitUntil(flushOfflineQueue());
  }
  if (event.tag === "sync-appointments") {
    event.waitUntil(syncAppointmentData());
  }
});

async function flushOfflineQueue() {
  const db = await openDB("vitaconnect-offline", 1, (db) => {
    if (!db.objectStoreNames.contains("pending-metrics")) {
      db.createObjectStore("pending-metrics", { keyPath: "id", autoIncrement: true });
    }
  });

  const pending = await dbGetAll(db, "pending-metrics");
  for (const item of pending) {
    try {
      const res = await fetch("/api/health-data/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(item.payload),
      });
      if (res.ok) await dbDelete(db, "pending-metrics", item.id);
    } catch {
      // Will retry on next sync event
    }
  }
}

async function syncAppointmentData() {
  try {
    const res = await fetch("/api/appointments?upcoming=true");
    if (res.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put("/api/appointments?upcoming=true", res.clone());
    }
  } catch { /* ignore */ }
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openDB(name, version, upgrade) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (e) => upgrade?.(e.target.result);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function dbGetAll(db, store) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function dbDelete(db, store, id) {
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}