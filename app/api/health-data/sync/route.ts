// app/api/health-data/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession }          from "next-auth";
import { authOptions }               from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z }                         from "zod";
import { randomUUID }                from "crypto";

// ── Validation ────────────────────────────────────────────────────────────────

const SyncBatchSchema = z.object({
  type:    z.string(),
  records: z.array(z.record(z.unknown())),
});

const SyncRequestSchema = z.union([
  SyncBatchSchema,
  z.array(SyncBatchSchema),
]);

// ── HC type → Postgres enum value (must match public.HealthMetricType exactly) ─

const HC_TYPE_MAP: Record<string, string> = {
  HeartRate:            "HEART_RATE",
  Steps:                "STEPS",
  BloodPressure:        "STRESS_LEVEL",      // Oraimo: stress score not real BP
  BloodGlucose:         "BLOOD_GLUCOSE",
  OxygenSaturation:     "OXYGEN_SATURATION",
  SleepSession:         "SLEEP_DURATION",
  Weight:               "WEIGHT",
  ActiveCaloriesBurned: "CALORIES_BURNED",
  Distance:             "DISTANCE",
  ExerciseSession:      "EXERCISE_SESSION",
  RespiratoryRate:      "RESPIRATORY_RATE",
  BodyFat:              "BODY_FAT",
  Nutrition:            "CALORIES_INTAKE",
};

// Types we intentionally skip (BodyTemperature = ambient weather on Oraimo)
const SKIP_TYPES = new Set(["BodyTemperature"]);

// ── Helper types ──────────────────────────────────────────────────────────────

interface HCMetadata  { id?: string }
interface HCWithValue { value?: number }
interface HCWeight    { inKilograms?: number }
interface HCEnergy    { inKilocalories?: number }
interface HCDistance  { inMeters?: number }

function getMeta(r: Record<string, unknown>): HCMetadata {
  return (r.metadata as HCMetadata | undefined) ?? {};
}

function toISO(v: unknown): string {
  return v ? new Date(v as string).toISOString() : new Date().toISOString();
}

// ── Row builder ───────────────────────────────────────────────────────────────
// Returns an object whose keys match the quoted camelCase column names in
// the Supabase "HealthMetric" table exactly.

function buildRow(
  type:    string,
  r:       Record<string, unknown>,
  userId:  string,
): Record<string, unknown> {
  const metricType = HC_TYPE_MAP[type] ?? "HEART_RATE";
  const syncId     = getMeta(r).id ?? null;

  const base = {
    id:          randomUUID(),          // PK has no default — must be supplied
    userId,                              // camelCase FK
    type:        metricType,            // Postgres enum value string
    source:      "HEALTH_CONNECT",      // Postgres enum MetricSource
    syncId,
    isAbnormal:  false,
    recordedAt:  toISO(r.time ?? r.endTime ?? r.startTime),
    // optional columns — leave null unless we have a value
    value2:      null as number | null,
    notes:       null as string | null,
    deviceId:    null as string | null,
  };

  switch (type) {

    case "HeartRate": {
      const bpm = Number(r.beatsPerMinute ?? 0);
      return { ...base, value: bpm, unit: "bpm" };
    }

    case "Steps": {
      return { ...base, value: Number(r.count ?? 0), unit: "steps" };
    }

    case "BloodPressure": {
      // On Oraimo this is a 0–100 stress score, not real mmHg.
      const score = ((r.systolic as HCWithValue | undefined)?.value) ?? 0;
      return {
        ...base,
        value:      score,
        unit:       "score",
        isAbnormal: score >= 80,
      };
    }

    case "BloodGlucose": {
      const lvl = ((r.level as HCWithValue | undefined)?.value) ?? 0;
      return {
        ...base,
        value:      lvl,
        unit:       "mg/dL",
        isAbnormal: lvl > 126 || lvl < 70,
      };
    }

    case "OxygenSaturation": {
      // HC SDK returns 0–100; some devices return 0–1
      const raw = Number(r.percentage ?? 0);
      const pct = raw <= 1 ? raw * 100 : raw;
      return {
        ...base,
        value:      Math.round(pct * 10) / 10,
        unit:       "%",
        isAbnormal: pct < 95,
      };
    }

    case "Weight": {
      const kg = ((r.weight as HCWeight | undefined)?.inKilograms) ?? 0;
      return { ...base, value: kg, unit: "kg" };
    }

    case "SleepSession": {
      const start = new Date(r.startTime as string).getTime();
      const end   = new Date(r.endTime   as string).getTime();
      return {
        ...base,
        value: Math.round((end - start) / 60_000),
        unit:  "minutes",
        recordedAt: toISO(r.startTime),
      };
    }

    case "ActiveCaloriesBurned": {
      const kcal = ((r.energy as HCEnergy | undefined)?.inKilocalories) ?? 0;
      return { ...base, value: kcal, unit: "kcal" };
    }

    case "RespiratoryRate": {
      return {
        ...base,
        value: Number(r.rate ?? 0),
        unit:  "breaths/min",
      };
    }

    case "Distance": {
      const m = ((r.distance as HCDistance | undefined)?.inMeters) ?? 0;
      return { ...base, value: Math.round(m), unit: "m" };
    }

    case "ExerciseSession": {
      const start = new Date(r.startTime as string).getTime();
      const end   = new Date(r.endTime   as string).getTime();
      return {
        ...base,
        value:  Math.round((end - start) / 60_000),
        value2: typeof r.exerciseType === "number" ? r.exerciseType : null,
        unit:   "minutes",
        recordedAt: toISO(r.startTime),
      };
    }

    case "BodyFat": {
      const raw = Number(r.percentage ?? 0);
      const pct = raw <= 1 ? raw * 100 : raw;
      return { ...base, value: Math.round(pct * 10) / 10, unit: "%" };
    }

    case "Nutrition": {
      const kcal = ((r.energy as HCEnergy | undefined)?.inKilocalories) ?? 0;
      return { ...base, value: Math.round(kcal), unit: "kcal" };
    }

    default:
      return { ...base, value: 0, unit: "" };
  }
}

// ── POST /api/health-data/sync ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body   = await req.json();
    const parsed = SyncRequestSchema.parse(body);
    const batches = Array.isArray(parsed) ? parsed : [parsed];

    const supabase = createServerSupabaseClient();
    const userId   = session.user.id;

    let totalInserted = 0;
    let totalSkipped  = 0;
    let totalAlerts   = 0;

    for (const { type, records } of batches) {

      // Skip types we deliberately exclude
      if (SKIP_TYPES.has(type)) {
        totalSkipped += records.length;
        continue;
      }

      if (!HC_TYPE_MAP[type]) {
        console.warn(`[sync] Unknown type "${type}" — skipping`);
        totalSkipped += records.length;
        continue;
      }

      // ── Deduplicate by syncId ─────────────────────────────────────────────
      const incomingSyncIds = records
        .map((r) => getMeta(r as Record<string, unknown>).id)
        .filter((id): id is string => !!id);

      let existingSyncIds = new Set<string>();

      if (incomingSyncIds.length > 0) {
        const { data: existing, error: fetchErr } = await supabase
          .from("HealthMetric")
          .select("syncId")
          .eq("userId", userId)
          .in("syncId", incomingSyncIds);

        if (fetchErr) {
          console.error("[sync] dedup fetch error:", fetchErr.message);
        } else {
          existingSyncIds = new Set(
            (existing ?? [])
              .map((m: { syncId: string | null }) => m.syncId)
              .filter(Boolean) as string[]
          );
        }
      }

      // Filter out already-synced records
      const newRecords = records.filter((r) => {
        const sid = getMeta(r as Record<string, unknown>).id;
        return !sid || !existingSyncIds.has(sid);
      });

      if (newRecords.length === 0) {
        totalSkipped += records.length;
        continue;
      }

      // ── Build rows ────────────────────────────────────────────────────────
      const rows = newRecords.map((r) =>
        buildRow(type, r as Record<string, unknown>, userId)
      );

      // ── Insert into Supabase in chunks of 100 ─────────────────────────────
      const CHUNK = 100;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const chunk = rows.slice(i, i + CHUNK);
        const { error: insertErr } = await supabase
          .from("HealthMetric")
          .insert(chunk);

        if (insertErr) {
          // "duplicate key" (code 23505) means row already exists — skip gracefully
          if (insertErr.code === "23505") {
            totalSkipped += chunk.length;
            continue;
          }
          console.error(`[sync] insert error for type "${type}":`, insertErr);
          throw new Error(insertErr.message);
        }

        totalInserted += chunk.length;

        // Count abnormals for alerts
        totalAlerts += chunk.filter(
          (row) => row.isAbnormal === true
        ).length;
      }

      totalSkipped += records.length - newRecords.length;

      // ── Upsert HealthConnectSync status ───────────────────────────────────
      const now = new Date().toISOString();
      const { error: syncErr } = await supabase
        .from("HealthConnectSync")
        .upsert(
          {
            id:              randomUUID(),  // ignored on update due to onConflict
            userId,
            dataType:        type,
            lastSyncAt:      now,
            status:          "SUCCESS",
            recordsImported: newRecords.length,
            updatedAt:       now,
          },
          {
            onConflict:     "userId,dataType",   // matches the unique index
            ignoreDuplicates: false,
          }
        );

      if (syncErr) {
        // Non-fatal — log but don't fail the whole sync
        console.warn("[sync] HealthConnectSync upsert failed:", syncErr.message);
      }
    }

    // ── Create notifications for abnormal readings ─────────────────────────
    if (totalAlerts > 0) {
      const now = new Date().toISOString();
      const { error: notifErr } = await supabase
        .from("Notification")
        .insert({
          id:        randomUUID(),
          userId,
          type:      "HEALTH_ALERT",
          title:     `${totalAlerts} abnormal reading${totalAlerts > 1 ? "s" : ""} detected`,
          message:   "One or more of your health metrics is outside the normal range.",
          read:      false,
          createdAt: now,
        });

      if (notifErr) {
        console.warn("[sync] Notification insert failed:", notifErr.message);
      }
    }

    return NextResponse.json({
      inserted: totalInserted,
      skipped:  totalSkipped,
      alerts:   totalAlerts,
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : "Internal server error";
    console.error("[health-data/sync POST]", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ── GET /api/health-data/sync ─────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type  = searchParams.get("type");
  const days  = Math.min(parseInt(searchParams.get("days") ?? "7", 10), 90);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("HealthMetric")
    .select("id, type, value, value2, unit, recordedAt, isAbnormal, source, syncId")
    .eq("userId", session.user.id)
    .gte("recordedAt", since)
    .order("recordedAt", { ascending: false })
    .limit(500);

  if (type) {
    // Accept both HC SDK name ("HeartRate") and enum value ("HEART_RATE")
    const enumVal = HC_TYPE_MAP[type] ?? type;
    query = query.eq("type", enumVal);
  }

  const { data: metrics, error } = await query;

  if (error) {
    console.error("[health-data/sync GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ metrics: metrics ?? [] });
}