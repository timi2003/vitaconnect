// hooks/useHealthConnect.ts
// Health Connect SDK integration for Android WebView / TWA
// Docs: https://developer.android.com/health-and-fitness/guides/health-connect

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import toast from "react-hot-toast";

// ─── Types matching Health Connect Read Types ───────────────────────────────

export type HCPermission =
  | "android.permission.health.READ_HEART_RATE"
  | "android.permission.health.WRITE_HEART_RATE"
  | "android.permission.health.READ_STEPS"
  | "android.permission.health.WRITE_STEPS"
  | "android.permission.health.READ_BLOOD_PRESSURE"
  | "android.permission.health.WRITE_BLOOD_PRESSURE"
  | "android.permission.health.READ_BLOOD_GLUCOSE"
  | "android.permission.health.WRITE_BLOOD_GLUCOSE"
  | "android.permission.health.READ_OXYGEN_SATURATION"
  | "android.permission.health.WRITE_OXYGEN_SATURATION"
  | "android.permission.health.READ_BODY_TEMPERATURE"
  | "android.permission.health.WRITE_BODY_TEMPERATURE"
  | "android.permission.health.READ_SLEEP"
  | "android.permission.health.WRITE_SLEEP"
  | "android.permission.health.READ_WEIGHT"
  | "android.permission.health.WRITE_WEIGHT"
  | "android.permission.health.READ_HEIGHT"
  | "android.permission.health.READ_ACTIVE_CALORIES_BURNED"
  | "android.permission.health.READ_DISTANCE"
  | "android.permission.health.READ_EXERCISE"
  | "android.permission.health.WRITE_EXERCISE"
  | "android.permission.health.READ_RESPIRATORY_RATE"
  | "android.permission.health.READ_BODY_FAT"
  | "android.permission.health.READ_NUTRITION"
  | "android.permission.health.WRITE_NUTRITION";

export type HCDataType =
  | "HeartRate"
  | "Steps"
  | "BloodPressure"
  | "BloodGlucose"
  | "OxygenSaturation"
  | "BodyTemperature"
  | "SleepSession"
  | "Weight"
  | "Height"
  | "ActiveCaloriesBurned"
  | "Distance"
  | "ExerciseSession"
  | "RespiratoryRate"
  | "BodyFat"
  | "Nutrition";

export interface HCRecord {
  type: HCDataType;
  time?: string;         // ISO8601
  startTime?: string;
  endTime?: string;
  count?: number;        // steps
  beatsPerMinute?: number;
  systolic?: { value: number; unit: string };
  diastolic?: { value: number; unit: string };
  level?: { value: number; unit: string };    // glucose, o2, temp
  percentage?: number;   // body fat
  inKilograms?: number;
  inMeters?: number;
  inKilocalories?: number;
  inKilometers?: number;
  exerciseType?: number;
  stages?: Array<{ startTime: string; endTime: string; stage: number }>;
  metadata?: {
    id: string;
    clientRecordId?: string;
    lastModifiedTime?: string;
    dataOrigin?: string;
    recordingMethod?: number;
    device?: {
      manufacturer?: string;
      model?: string;
      type?: number;
    };
  };
}

export interface HCSyncResult {
  dataType: HCDataType;
  count: number;
  error?: string;
}

interface HealthConnectBridge {
  isAvailable: () => Promise<boolean>;
  checkAvailability: () => Promise<"Available" | "NotInstalled" | "NotSupported">;
  requestPermissions: (permissions: HCPermission[]) => Promise<{ grantedPermissions: HCPermission[] }>;
  revokeAllPermissions: () => Promise<void>;
  getGrantedPermissions: () => Promise<{ grantedPermissions: HCPermission[] }>;
  readRecords: (type: HCDataType, options: {
    timeRangeFilter: {
      operator: "between" | "before" | "after";
      startTime?: string;
      endTime?: string;
    };
    pageSize?: number;
    pageToken?: string;
    ascendingOrder?: boolean;
  }) => Promise<{ records: HCRecord[]; pageToken?: string }>;
  insertRecords: (records: Array<{
    recordType: HCDataType;
    [key: string]: unknown;
  }>) => Promise<{ recordIdsList: string[] }>;
  deleteRecordsByUuids: (type: HCDataType, idList: string[], clientRecordIdsList?: string[]) => Promise<void>;
  getChanges: (token: string) => Promise<{
    upsertedRecords: HCRecord[];
    deletedUids: string[];
    hasMore: boolean;
    nextChangesToken: string;
  }>;
  getChangesToken: (types: HCDataType[]) => Promise<{ token: string }>;
}

// ─── Android bridge detection ────────────────────────────────────────────────

function getHealthConnectBridge(): HealthConnectBridge | null {
  if (typeof window === "undefined") return null;

  // TWA/WebView injects this bridge via JavaScript interface
  const w = window as unknown as {
    HealthConnectAndroid?: HealthConnectBridge;
    Android?: { healthConnect?: HealthConnectBridge };
    ReactNativeWebView?: unknown;
  };

  if (w.HealthConnectAndroid) return w.HealthConnectAndroid;
  if (w.Android?.healthConnect) return w.Android.healthConnect;

  return null;
}

// ─── Required permissions for the platform ──────────────────────────────────

export const ALL_READ_PERMISSIONS: HCPermission[] = [
  "android.permission.health.READ_HEART_RATE",
  "android.permission.health.READ_STEPS",
  "android.permission.health.READ_BLOOD_PRESSURE",
  "android.permission.health.READ_BLOOD_GLUCOSE",
  "android.permission.health.READ_OXYGEN_SATURATION",
  "android.permission.health.READ_BODY_TEMPERATURE",
  "android.permission.health.READ_SLEEP",
  "android.permission.health.READ_WEIGHT",
  "android.permission.health.READ_HEIGHT",
  "android.permission.health.READ_ACTIVE_CALORIES_BURNED",
  "android.permission.health.READ_DISTANCE",
  "android.permission.health.READ_EXERCISE",
  "android.permission.health.READ_RESPIRATORY_RATE",
  "android.permission.health.READ_BODY_FAT",
];

// ─── Main hook ───────────────────────────────────────────────────────────────

export function useHealthConnect() {
  const [isAvailable, setIsAvailable]               = useState(false);
  const [availability, setAvailability]             = useState<"checking" | "Available" | "NotInstalled" | "NotSupported" | "WebOnly">("checking");
  const [grantedPermissions, setGrantedPermissions] = useState<HCPermission[]>([]);
  const [isSyncing, setIsSyncing]                   = useState(false);
  const [lastSyncAt, setLastSyncAt]                 = useState<Date | null>(null);
  const [syncResults, setSyncResults]               = useState<HCSyncResult[]>([]);
  const bridgeRef = useRef<HealthConnectBridge | null>(null);

  // ── Initialise ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function init() {
      bridgeRef.current = getHealthConnectBridge();

      if (!bridgeRef.current) {
        setAvailability("WebOnly");
        setIsAvailable(false);
        return;
      }

      try {
        const status = await bridgeRef.current.checkAvailability();
        setAvailability(status);
        setIsAvailable(status === "Available");

        if (status === "Available") {
          const { grantedPermissions: perms } =
            await bridgeRef.current.getGrantedPermissions();
          setGrantedPermissions(perms);
        }
      } catch {
        setAvailability("NotSupported");
      }
    }

    init();
  }, []);

  // ── Request permissions ──────────────────────────────────────────────────
  const requestPermissions = useCallback(
    async (permissions: HCPermission[] = ALL_READ_PERMISSIONS) => {
      if (!bridgeRef.current || !isAvailable) {
        toast.error("Health Connect is not available on this device");
        return [];
      }
      try {
        const { grantedPermissions: perms } =
          await bridgeRef.current.requestPermissions(permissions);
        setGrantedPermissions(perms);
        toast.success(`${perms.length} health permissions granted`);
        return perms;
      } catch (err) {
        console.error("Permission request failed", err);
        toast.error("Failed to request Health Connect permissions");
        return [];
      }
    },
    [isAvailable]
  );

  // ── Read records ─────────────────────────────────────────────────────────
  const readRecords = useCallback(
    async (
      type: HCDataType,
      startTime: Date,
      endTime: Date = new Date(),
      pageSize = 1000
    ): Promise<HCRecord[]> => {
      if (!bridgeRef.current || !isAvailable) return [];

      const allRecords: HCRecord[] = [];
      let pageToken: string | undefined;

      do {
        const result = await bridgeRef.current.readRecords(type, {
          timeRangeFilter: {
            operator: "between",
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          },
          pageSize,
          pageToken,
          ascendingOrder: false,
        });
        allRecords.push(...result.records);
        pageToken = result.pageToken;
      } while (pageToken);

      return allRecords;
    },
    [isAvailable]
  );

  // ── Sync all health data to server ───────────────────────────────────────
  const syncToServer = useCallback(
    async (since?: Date) => {
      if (!isAvailable) {
        toast.error("Health Connect not available");
        return;
      }

      setIsSyncing(true);
      const results: HCSyncResult[] = [];
      const startTime = since ?? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days

      const dataTypes: HCDataType[] = [
        "HeartRate", "Steps", "BloodPressure", "BloodGlucose",
        "OxygenSaturation", "BodyTemperature", "SleepSession",
        "Weight", "ActiveCaloriesBurned", "Distance",
        "RespiratoryRate",
      ];

      for (const type of dataTypes) {
        try {
          const records = await readRecords(type, startTime);
          if (records.length === 0) continue;

          const response = await fetch("/api/health-data/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, records }),
          });

          if (!response.ok) throw new Error("Sync request failed");
          const data = await response.json();
          results.push({ dataType: type, count: data.inserted ?? records.length });
        } catch (err) {
          results.push({
            dataType: type,
            count: 0,
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      setSyncResults(results);
      setLastSyncAt(new Date());
      setIsSyncing(false);

      const total = results.reduce((sum, r) => sum + r.count, 0);
      toast.success(`Synced ${total} health records`);
      return results;
    },
    [isAvailable, readRecords]
  );

  // ── Incremental sync using change tokens ─────────────────────────────────
  const incrementalSync = useCallback(
    async (token: string) => {
      if (!bridgeRef.current || !isAvailable) return null;
      return bridgeRef.current.getChanges(token);
    },
    [isAvailable]
  );

  const getChangesToken = useCallback(
    async (types: HCDataType[] = ["HeartRate", "Steps", "BloodPressure"]) => {
      if (!bridgeRef.current || !isAvailable) return null;
      const { token } = await bridgeRef.current.getChangesToken(types);
      return token;
    },
    [isAvailable]
  );

  // ── Latest metrics ────────────────────────────────────────────────────────
  const getLatestMetric = useCallback(
    async (type: HCDataType): Promise<HCRecord | null> => {
      const records = await readRecords(
        type,
        new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      return records[0] ?? null;
    },
    [readRecords]
  );

  const hasPermission = useCallback(
    (permission: HCPermission) => grantedPermissions.includes(permission),
    [grantedPermissions]
  );

  return {
    isAvailable,
    availability,
    grantedPermissions,
    isSyncing,
    lastSyncAt,
    syncResults,
    requestPermissions,
    readRecords,
    syncToServer,
    incrementalSync,
    getChangesToken,
    getLatestMetric,
    hasPermission,
  };
}
