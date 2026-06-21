"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";

// ── Types ─────────────────────────────────────────────────────────────────────

export type HCAvailability =
  | "checking" | "Available" | "NotInstalled" | "NotSupported" | "WebOnly";

export type HCDataType =
  | "HeartRate" | "Steps" | "BloodPressure" | "BloodGlucose"
  | "OxygenSaturation" | "BodyTemperature" | "SleepSession"
  | "Weight" | "ActiveCaloriesBurned" | "RespiratoryRate";

export interface HCRecord {
  type:            HCDataType;
  time?:           string;
  startTime?:      string;
  endTime?:        string;
  count?:          number;
  beatsPerMinute?: number;
  rate?:           number;
  percentage?:     number;
  systolic?:       { value: number };
  diastolic?:      { value: number };
  level?:          { value: number };
  weight?:         { inKilograms: number };
  energy?:         { inKilocalories: number };
  temperature?:    { inCelsius: number };
  metadata?:       { id: string; dataOrigin?: string };
}

export interface SyncResult {
  dataType: HCDataType;
  inserted: number;
  skipped:  number;
  alerts:   number;
  error?:   string;
}

// ── Bridge interface ──────────────────────────────────────────────────────────

interface HCBridge {
  checkAvailability:       () => string;
  requestPermissions:      (json: string, cbId: string) => void;
  getGrantedPermissions:   (cbId: string) => void;
  readHeartRate:           (s: string, e: string, cb: string) => void;
  readSteps:               (s: string, e: string, cb: string) => void;
  readBloodPressure:       (s: string, e: string, cb: string) => void;
  readBloodGlucose:        (s: string, e: string, cb: string) => void;
  readOxygenSaturation:    (s: string, e: string, cb: string) => void;
  readBodyTemperature:     (s: string, e: string, cb: string) => void;
  readWeight:              (s: string, e: string, cb: string) => void;
  readSleepSession:        (s: string, e: string, cb: string) => void;
  readActiveCaloriesBurned:(s: string, e: string, cb: string) => void;
  readRespiratoryRate:     (s: string, e: string, cb: string) => void;
}

interface PermBridge { launchPermissions: () => void; }

type CBFn = (error: string | null, data: string | null) => void;

// ── Global callback registry ──────────────────────────────────────────────────
// Kotlin calls window.__hcCb(id, error, data) after each async read

function setupRegistry() {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w.__hcCb) return;

  const reg = new Map<string, CBFn>();
  w.__hcCb  = (id: string, err: string | null, data: string | null) => {
    const cb = reg.get(id);
    if (cb) { cb(err, data); reg.delete(id); }
  };
  w.__hcReg = reg;
}

function callBridge(
  method: keyof HCBridge,
  ...args: string[]
): Promise<HCRecord[]> {
  return new Promise((resolve, reject) => {
    const w   = window as unknown as Record<string, unknown>;
    const bridge = (w.HealthConnectAndroid as HCBridge | undefined);
    if (!bridge) return reject(new Error("Bridge not available"));

    const reg = w.__hcReg as Map<string, CBFn>;
    const id  = `hc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    reg.set(id, (err, data) => {
      if (err)   return reject(new Error(err));
      try        { resolve(JSON.parse(data ?? "[]")); }
      catch      { resolve([]); }
    });

    (bridge[method] as (...a: string[]) => void)(...args, id);

    // 15s timeout
    setTimeout(() => {
      if (reg.has(id)) {
        reg.delete(id);
        reject(new Error(`Timeout: ${method}`));
      }
    }, 15_000);
  });
}

// ── Data types and their bridge methods ───────────────────────────────────────

const SYNC_TYPES: Array<{ type: HCDataType; method: keyof HCBridge }> = [
  { type: "HeartRate",            method: "readHeartRate"             },
  { type: "Steps",                method: "readSteps"                 },
  { type: "BloodPressure",        method: "readBloodPressure"         },
  { type: "BloodGlucose",         method: "readBloodGlucose"          },
  { type: "OxygenSaturation",     method: "readOxygenSaturation"      },
  { type: "BodyTemperature",      method: "readBodyTemperature"       },
  { type: "Weight",               method: "readWeight"                },
  { type: "SleepSession",         method: "readSleepSession"          },
  { type: "ActiveCaloriesBurned", method: "readActiveCaloriesBurned"  },
  { type: "RespiratoryRate",      method: "readRespiratoryRate"       },
];

const POLL_MS     = 60_000;
const LOOKBACK_MS = 60_000;

// ── Main hook ─────────────────────────────────────────────────────────────────

export function useHealthConnect() {
  const [availability,       setAvailability]       = useState<HCAvailability>("checking");
  const [isAvailable,        setIsAvailable]        = useState(false);
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>([]);
  const [isSyncing,          setIsSyncing]          = useState(false);
  const [isPolling,          setIsPolling]          = useState(false);
  const [lastSyncAt,         setLastSyncAt]         = useState<Date | null>(null);
  const [syncResults,        setSyncResults]        = useState<SyncResult[]>([]);
  const [liveMetrics,        setLiveMetrics]        = useState<Record<string, HCRecord>>({});

  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastPollRef  = useRef<Date>(new Date(Date.now() - LOOKBACK_MS));

  // ── Initialise ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    setupRegistry();

    const w      = window as unknown as Record<string, unknown>;
    const bridge = w.HealthConnectAndroid as HCBridge | undefined;

    if (!bridge) {
      setAvailability("WebOnly");
      setIsAvailable(false);
      return;
    }

    try {
      const status = bridge.checkAvailability();   // synchronous
      setAvailability(status as HCAvailability);
      const available = status === "Available";
      setIsAvailable(available);

      if (available) {
        // Get existing permissions
        const reg = w.__hcReg as Map<string, CBFn>;
        const id  = `hc_init_${Date.now()}`;
        reg.set(id, (_err, data) => {
          try {
            const perms = JSON.parse(data ?? "[]") as string[];
            setGrantedPermissions(perms);
          } catch { /* ignore */ }
        });
        bridge.getGrantedPermissions(id);
      }
    } catch {
      setAvailability("NotSupported");
    }
  }, []);

  // ── Listen for permission request event ────────────────────────────────────
  // Bridge fires this event, we forward to native launcher
  useEffect(() => {
    function handlePermissionRequest() {
      const w    = window as unknown as Record<string, unknown>;
      const perm = w.HealthConnectPermissions as PermBridge | undefined;
      perm?.launchPermissions();
    }
    window.addEventListener("hc-request-permissions", handlePermissionRequest);
    return () => window.removeEventListener("hc-request-permissions", handlePermissionRequest);
  }, []);

  // ── FIXED Request permissions ─────────────────────────────────────────────
  const requestPermissions = useCallback(async () => {
    const w = window as any;
    const bridge = w.HealthConnectAndroid as HCBridge | undefined;

    if (!bridge || !isAvailable) {
      toast.error("Health Connect is not available on this device");
      return [];
    }

    return new Promise<string[]>((resolve) => {
      const reg = w.__hcReg as Map<string, CBFn>;
      const id = `hc_perm_${Date.now()}`;

      reg.set(id, (_err, data) => {
        try {
          const granted = JSON.parse(data ?? "[]") as string[];
          setGrantedPermissions(granted);

          if (granted.length > 0) {
            toast.success(`✅ ${granted.length} permissions granted`);
          } else {
            toast.error("No permissions granted. Please allow health data access.");
          }
          resolve(granted);
        } catch {
          resolve([]);
        }
      });

      // ONLY call bridge.requestPermissions — this is the fix
      bridge.requestPermissions("[]", id);
    });
  }, [isAvailable]);

  // ── Read one data type ─────────────────────────────────────────────────────
  const readRecords = useCallback(
    async (type: HCDataType, since: Date, until: Date = new Date()): Promise<HCRecord[]> => {
      if (!isAvailable) return [];
      const entry = SYNC_TYPES.find((s) => s.type === type);
      if (!entry) return [];
      try {
        return await callBridge(entry.method, since.toISOString(), until.toISOString());
      } catch (err) {
        console.warn(`[HC] ${type} read failed:`, err);
        return [];
      }
    },
    [isAvailable]
  );

  // ── Post batch to server ───────────────────────────────────────────────────
  async function postToServer(type: HCDataType, records: HCRecord[]): Promise<SyncResult> {
    if (!records.length) return { dataType: type, inserted: 0, skipped: 0, alerts: 0 };
    try {
      const res = await fetch("/api/health-data/sync", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type, records }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const d = await res.json();
      return { dataType: type, inserted: d.inserted ?? 0, skipped: d.skipped ?? 0, alerts: d.alerts ?? 0 };
    } catch (err) {
      return { dataType: type, inserted: 0, skipped: 0, alerts: 0, error: String(err) };
    }
  }

  // ── Full sync ──────────────────────────────────────────────────────────────
  const syncToServer = useCallback(async (since?: Date) => {
    if (!isAvailable) {
      toast.error("Health Connect is not available");
      return [];
    }
    setIsSyncing(true);
    const from    = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const results: SyncResult[] = [];

    for (const { type } of SYNC_TYPES) {
      const records = await readRecords(type, from);
      const result  = await postToServer(type, records);
      results.push(result);
      if (records.length > 0) setLiveMetrics((p) => ({ ...p, [type]: records[0] }));
    }

    setSyncResults(results);
    setLastSyncAt(new Date());
    setIsSyncing(false);
    lastPollRef.current = new Date();

    const total  = results.reduce((s, r) => s + r.inserted, 0);
    const alerts = results.reduce((s, r) => s + r.alerts,   0);
    if (total > 0) toast.success(`Synced ${total} readings${alerts > 0 ? ` · ${alerts} alerts` : ""}`);
    else toast(`No new readings found`, { icon: "ℹ️" });

    return results;
  }, [isAvailable, readRecords]);

  // ── Incremental poll ───────────────────────────────────────────────────────
  const incrementalSync = useCallback(async () => {
    if (!isAvailable || isSyncing) return;
    const since = lastPollRef.current;
    const now   = new Date();

    for (const { type } of SYNC_TYPES) {
      const records = await readRecords(type, since, now);
      if (!records.length) continue;
      setLiveMetrics((p) => ({ ...p, [type]: records[0] }));
      postToServer(type, records).then((r) => {
        if (r.alerts > 0) toast.error(`⚠️ Abnormal ${type} reading`, { duration: 8000 });
      });
    }

    lastPollRef.current = now;
    setLastSyncAt(new Date());
  }, [isAvailable, isSyncing, readRecords]);

  // ── Start / stop polling ───────────────────────────────────────────────────
  const startPolling = useCallback(() => {
    if (pollTimerRef.current || !isAvailable) return;
    setIsPolling(true);
    incrementalSync();
    pollTimerRef.current = setInterval(incrementalSync, POLL_MS);
  }, [isAvailable, incrementalSync]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) { clearInterval(pollTimerRef.current); pollTimerRef.current = null; }
    setIsPolling(false);
  }, []);

  // ── Auto-start when permissions are present ────────────────────────────────
  useEffect(() => {
    if (isAvailable && grantedPermissions.length > 0) startPolling();
    return () => stopPolling();
  }, [isAvailable, grantedPermissions, startPolling, stopPolling]);

  useEffect(() => () => { if (pollTimerRef.current) clearInterval(pollTimerRef.current); }, []);

  return {
    availability,
    isAvailable,
    grantedPermissions,
    isSyncing,
    isPolling,
    lastSyncAt,
    syncResults,
    liveMetrics,
    requestPermissions,
    syncToServer,
    startPolling,
    stopPolling,
    readRecords,
  };
}