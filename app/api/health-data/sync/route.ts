// app/api/health-data/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase";
import { z } from "zod";

// ── Validation ────────────────────────────────────────────────────────────────

const SyncBatchSchema = z.object({
  type:    z.string(),
  records: z.array(z.record(z.unknown())),
});

// Accept either a single batch OR an array of batches
const SyncRequestSchema = z.union([
  SyncBatchSchema,
  z.array(SyncBatchSchema),
]);

// ── HC type → Supabase HealthMetricType ───────────────────────────────────────

const HC_TYPE_MAP: Record<string, string> = {
  HeartRate:            "HEART_RATE",
  Steps:                "STEPS",
  BloodPressure:        "STRESS_LEVEL",
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

const DROPPED_TYPES = new Set<string>(["BodyTemperature"]);

// ── Helper types ──────────────────────────────────────────────────────────────

interface HCMetadata  { id?: string; }
interface HCWithValue { value?: number; }
interface HCWeight    { inKilograms?: number; }
interface HCEnergy    { inKilocalories?: number; }
interface HCDistance  { inMeters?: number; }

function getMeta(r: Record<string, unknown>): HCMetadata {
  return (r.metadata as HCMetadata | undefined) ?? {};
}

function toDate(v: unknown): string {
  return v ? new Date(v as string).toISOString() : new Date().toISOString();
}

// ── Transformer ───────────────────────────────────────────────────────────────

function transformRecord(
  type: string,
  r: Record<string, unknown>,
  userId: string,
) {
  const metricType = HC_TYPE_MAP[type] ?? "HEART_RATE";
  const syncId = getMeta(r).id ?? null;

  const base = {
    user_id: userId,
    type: metricType,
    source: "HEALTH_CONNECT",
    sync_id: syncId,
    is_abnormal: false,
    recorded_at: toDate(r.time || r.endTime || r.startTime),
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
      const stressScore = ((r.systolic as HCWithValue | undefined)?.value) ?? 0;
      return {
        ...base,
        value: stressScore,
        unit: "score",
        is_abnormal: stressScore >= 80,
      };
    }
    case "BloodGlucose": {
      const lvl = ((r.level as HCWithValue | undefined)?.value) ?? 0;
      return {
        ...base,
        value: lvl,
        unit: "mg/dL",
        is_abnormal: lvl > 126 || lvl < 70,
      };
    }
    case "OxygenSaturation": {
      const pct = Number(r.percentage ?? 0) * 100;
      return {
        ...base,
        value: pct,
        unit: "%",
        is_abnormal: pct < 95,
      };
    }
    case "Weight": {
      const kg = ((r.weight as HCWeight | undefined)?.inKilograms) ?? 0;
      return { ...base, value: kg, unit: "kg" };
    }
    case "SleepSession": {
      const start = new Date(r.startTime as string).getTime();
      const end = new Date(r.endTime as string).getTime();
      return {
        ...base,
        value: Math.round((end - start) / 60000),
        unit: "minutes",
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
        unit: "breaths/min",
      };
    }
    case "Distance": {
      const meters = ((r.distance as HCDistance | undefined)?.inMeters) ?? 0;
      return { ...base, value: Math.round(meters), unit: "m" };
    }
    case "ExerciseSession": {
      const start = new Date(r.startTime as string).getTime();
      const end = new Date(r.endTime as string).getTime();
      return {
        ...base,
        value: Math.round((end - start) / 60000),
        unit: "minutes",
        value2: typeof r.exerciseType === "number" ? r.exerciseType : undefined,
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
      return base;
  }
}

// ── POST — sync records from Health Connect ───────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = SyncRequestSchema.parse(body);

    const batches = Array.isArray(parsed) ? parsed : [parsed];

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalAlerts = 0;

    const supabase = createServerSupabaseClient();

    for (const { type, records } of batches) {
      if (DROPPED_TYPES.has(type)) {
        totalSkipped += records.length;
        continue;
      }

      // Deduplication
      const incomingSyncIds = records
        .map((r) => getMeta(r).id)
        .filter((id): id is string => id !== undefined);

      // For simplicity, we'll skip deduplication for now or implement via unique constraint in DB
      const toInsert = records
        .map((r) => transformRecord(type, r, session.user.id));

      if (toInsert.length === 0) {
        totalSkipped += records.length;
        continue;
      }

      const { error: insertError } = await supabase
        .from("HealthMetrics")
        .insert(toInsert);

      if (insertError) throw insertError;

      totalInserted += toInsert.length;
      totalSkipped += records.length - toInsert.length;
    }

    return NextResponse.json({
      inserted: totalInserted,
      skipped: totalSkipped,
      alerts: totalAlerts,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("[health-data/sync POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ── GET — fetch stored metrics ────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const days = parseInt(searchParams.get("days") ?? "7", 10);

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from("HealtMmetrics")
    .select("*")
    .eq("user_id", session.user.id)
    .order("recorded_at", { ascending: false })
    .limit(500);

  if (type) {
    query = query.eq("type", type);
  }

  const { data: metrics, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ metrics });
}