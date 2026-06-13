// public/sw-custom.js
// Custom service worker additions on top of next-pwa Workbox output

const CACHE_NAME = "vitaconnect-v1";
const HEALTH_CACHE = "vitaconnect-health-v1";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/dashboard",
  "/offline",
  "/manifest.json",
];

// API routes to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /\/api\/health-data/,
  /\/api\/appointments/,
  /\/api\/prescriptions/,
  /\/api\/profile/,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== HEALTH_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Network-first for API, stale-while-revalidate for health data
self.addEventListener("fetch", (event) => {
  const { url, method } = event.request;

  // Only cache GET requests
  if (method !== "GET") return;

  const isHealthData = API_CACHE_PATTERNS.some((p) => p.test(url));

  if (isHealthData) {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const clone = res.clone();
          caches.open(HEALTH_CACHE).then((cache) => cache.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "VitaConnect", body: event.data.text() };
  }

  const options = {
    body:    data.body    ?? data.message ?? "",
    icon:    "/icons/icon-192x192.png",
    badge:   "/icons/icon-72x72.png",
    vibrate: [200, 100, 200],
    data:    data.data ?? {},
    actions: data.actions ?? [],
    tag:     data.tag ?? "vitaconnect",
  };

  event.waitUntil(
    self.registration.showNotification(data.title ?? "VitaConnect", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url ?? "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      const existing = clientList.find((c) => c.url.includes(self.location.origin));
      if (existing) {
        existing.focus();
        existing.navigate(url);
      } else {
        clients.openWindow(url);
      }
    })
  );
});

// Background sync for offline health metric logging
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-health-metrics") {
    event.waitUntil(syncOfflineMetrics());
  }
});

async function syncOfflineMetrics() {
  const db = await openIndexedDB();
  const pending = await getPendingMetrics(db);

  for (const metric of pending) {
    try {
      const res = await fetch("/api/health-data/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metric),
      });
      if (res.ok) await deletePendingMetric(db, metric.id);
    } catch {
      // Will retry on next sync
    }
  }
}

function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vitaconnect-offline", 1);
    req.onsuccess  = () => resolve(req.result);
    req.onerror    = () => reject(req.error);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("pending-metrics")) {
        db.createObjectStore("pending-metrics", { keyPath: "id", autoIncrement: true });
      }
    };
  });
}

function getPendingMetrics(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending-metrics", "readonly");
    const req = tx.objectStore("pending-metrics").getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function deletePendingMetric(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction("pending-metrics", "readwrite");
    const req = tx.objectStore("pending-metrics").delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}
