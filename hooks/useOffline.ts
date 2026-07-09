"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";

export interface OfflineQueueItem {
  id:        number;
  type:      "health-metric" | "appointment" | "message";
  payload:   unknown;
  queuedAt:  string;
  retries:   number;
}

// Background Sync isn't in TypeScript's built-in DOM lib yet, even though most
// Chromium browsers support it at runtime — declare just enough of it here.
interface SyncManager {
  register(tag: string): Promise<void>;
  getTags(): Promise<string[]>;
}

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  readonly sync: SyncManager;
}

// ── IndexedDB helpers ─────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("vitaconnect-offline", 2);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("pending-metrics")) {
        db.createObjectStore("pending-metrics", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("cached-data")) {
        db.createObjectStore("cached-data", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function dbAdd(store: string, data: unknown): Promise<number> {
  const db  = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).add(data);
    req.onsuccess = () => resolve(req.result as number);
    req.onerror   = () => reject(req.error);
  });
}

async function dbGetAll(store: string): Promise<OfflineQueueItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result as OfflineQueueItem[]);
    req.onerror   = () => reject(req.error);
  });
}

async function dbDelete(store: string, id: number): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function dbPut(store: string, data: { key: string; value: unknown; savedAt: string }): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readwrite").objectStore(store).put(data);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

async function dbGet(store: string, key: string): Promise<{ key: string; value: unknown; savedAt: string } | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, "readonly").objectStore(store).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useOffline() {
  const [isOnline,    setIsOnline]    = useState(true);
  const [wasOffline,  setWasOffline]  = useState(false);
  const [queueLength, setQueueLength] = useState(0);
  const [isFlushing,  setIsFlushing]  = useState(false);

  // ── Listen for online/offline events ────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    function handleOnline() {
      setIsOnline(true);
      setWasOffline(true);
      toast.success("Back online — syncing queued data…", { icon: "🌐" });
      flushQueue();

      // Trigger background sync via Service Worker
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        navigator.serviceWorker.ready.then((reg) => {
          const regWithSync = reg as ServiceWorkerRegistrationWithSync;
          regWithSync.sync.register("sync-health-metrics").catch(() => {});
          regWithSync.sync.register("sync-appointments").catch(() => {});
        });
      }
    }

    function handleOffline() {
      setIsOnline(false);
      toast.error("You are offline. Data will be saved and synced when reconnected.", {
        duration: 5000,
        icon: "📡",
      });
    }

    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load queue length on mount ───────────────────────────────────────────────
  useEffect(() => {
    refreshQueueLength();
  }, []);

  async function refreshQueueLength() {
    try {
      const items = await dbGetAll("pending-metrics");
      setQueueLength(items.length);
    } catch { /* IndexedDB not available */ }
  }

  // ── Queue a health metric for offline storage ────────────────────────────────
  const queueHealthMetric = useCallback(async (type: string, records: unknown[]) => {
    try {
      await dbAdd("pending-metrics", {
        type:     "health-metric",
        payload:  { type, records },
        queuedAt: new Date().toISOString(),
        retries:  0,
      });
      await refreshQueueLength();
    } catch (err) {
      console.error("[Offline] Failed to queue metric:", err);
    }
  }, []);

  // ── Flush queue when back online ─────────────────────────────────────────────
  const flushQueue = useCallback(async () => {
    if (isFlushing) return;
    setIsFlushing(true);

    try {
      const items = await dbGetAll("pending-metrics");
      if (items.length === 0) { setIsFlushing(false); return; }

      let synced = 0;
      let failed = 0;

      for (const item of items) {
        try {
          const payload = item.payload as { type: string; records: unknown[] };
          const res = await fetch("/api/health-data/sync", {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify(payload),
          });
          if (res.ok) {
            await dbDelete("pending-metrics", item.id);
            synced++;
          } else {
            failed++;
          }
        } catch {
          failed++;
        }
      }

      await refreshQueueLength();

      if (synced > 0) {
        toast.success(`Synced ${synced} queued health record${synced !== 1 ? "s" : ""}`);
      }
      if (failed > 0) {
        toast.error(`${failed} record${failed !== 1 ? "s" : ""} failed to sync — will retry`);
      }
    } catch (err) {
      console.error("[Offline] Flush failed:", err);
    } finally {
      setIsFlushing(false);
    }
  }, [isFlushing]);

  // ── Save data to IndexedDB for offline reading ────────────────────────────────
  const cacheData = useCallback(async (key: string, value: unknown) => {
    try {
      await dbPut("cached-data", {
        key,
        value,
        savedAt: new Date().toISOString(),
      });
    } catch { /* ignore */ }
  }, []);

  // ── Read cached data ─────────────────────────────────────────────────────────
  const getCachedData = useCallback(async <T>(key: string): Promise<T | null> => {
    try {
      const record = await dbGet("cached-data", key);
      return record ? (record.value as T) : null;
    } catch {
      return null;
    }
  }, []);

  // ── Offline-aware fetch — queues writes when offline ─────────────────────────
  const offlineFetch = useCallback(async (
    url:     string,
    options: RequestInit = {},
  ): Promise<Response> => {
    if (navigator.onLine) {
      const res = await fetch(url, options);
      // Cache GET responses
      if (options.method === undefined || options.method === "GET") {
        if (res.ok) {
          const clone = res.clone();
          clone.json().then((data) => cacheData(url, data)).catch(() => {});
        }
      }
      return res;
    }

    // Offline — for GETs return cached data
    if (!options.method || options.method === "GET") {
      const cached = await getCachedData<unknown>(url);
      if (cached) {
        return new Response(JSON.stringify(cached), {
          status:  200,
          headers: { "Content-Type": "application/json", "X-From-Cache": "true" },
        });
      }
      return new Response(
        JSON.stringify({ offline: true, message: "No cached data available" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    // For POST/PATCH — queue if it's health data
    if (url.includes("/api/health-data/sync") && options.body) {
      const payload = JSON.parse(options.body as string);
      await queueHealthMetric(payload.type, payload.records);
      return new Response(
        JSON.stringify({ queued: true, message: "Saved offline — will sync when back online" }),
        { status: 202, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ offline: true, message: "Cannot complete this action while offline" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }, [cacheData, getCachedData, queueHealthMetric]);

  return {
    isOnline,
    wasOffline,
    queueLength,
    isFlushing,
    queueHealthMetric,
    flushQueue,
    cacheData,
    getCachedData,
    offlineFetch,
  };
}