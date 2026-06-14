// sw-custom.js — VitaConnect custom service worker additions
// next-pwa injects Workbox before this file via importScripts

const CACHE_VERSION  = "v1";
const STATIC_CACHE   = `vitaconnect-static-${CACHE_VERSION}`;
const HEALTH_CACHE   = `vitaconnect-health-${CACHE_VERSION}`;
const OFFLINE_URL    = "/offline";

// ── Assets to precache on install ────────────────────────────────────────────
const PRECACHE_URLS = [
  "/",
  "/dashboard",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate — clean old caches ───────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  const VALID = [STATIC_CACHE, HEALTH_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !VALID.includes(k)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch — network-first for API, cache-first for assets ────────────────────
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET and cross-origin
  if (event.request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // Health data API — network first, fallback to cache
  if (url.pathname.startsWith("/api/health-data") ||
      url.pathname.startsWith("/api/appointments") ||
      url.pathname.startsWith("/api/profile")) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(HEALTH_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Other API routes — network only (don't cache auth, payments etc.)
  if (url.pathname.startsWith("/api/")) return;

  // Static assets — cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          if (res.ok && res.type === "basic") {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return res;
        })
        .catch(() => {
          // Offline fallback for navigation requests
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
        });
    })
  );
});

// ── Push notifications ────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try { payload = event.data.json(); }
  catch { payload = { title: "VitaConnect", body: event.data.text() }; }

  const options = {
    body:    payload.body    ?? payload.message ?? "",
    icon:    "/icons/icon-192x192.png",
    badge:   "/icons/badge-icon.png",
    vibrate: [200, 100, 200],
    data:    payload.data    ?? {},
    tag:     payload.tag     ?? "vitaconnect",
    actions: payload.actions ?? [],
    requireInteraction: payload.type === "APPOINTMENT_STARTED",
  };

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "VitaConnect", options)
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const existing = list.find((c) => c.url.startsWith(self.location.origin));
      if (existing) {
        existing.focus();
        return existing.navigate(url);
      }
      return clients.openWindow(url);
    })
  );
});

// ── Background sync — offline health metric queue ─────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-health-metrics") {
    event.waitUntil(flushOfflineMetrics());
  }
});

async function flushOfflineMetrics() {
  let db;
  try {
    db = await openDB();
    const pending = await getAllPending(db);
    for (const item of pending) {
      try {
        const res = await fetch("/api/health-data/sync", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.payload),
        });
        if (res.ok) await deleteItem(db, item.id);
      } catch {
        // Will retry on next sync event
      }
    }
  } catch (err) {
    console.warn("[SW] flushOfflineMetrics failed:", err);
  }
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vitaconnect-offline", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending")) {
        db.createObjectStore("pending", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function getAllPending(db) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction("pending", "readonly");
    const req = tx.objectStore("pending").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function deleteItem(db, id) {
  return new Promise((resolve, reject) => {
    const tx  = db.transaction("pending", "readwrite");
    const req = tx.objectStore("pending").delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}