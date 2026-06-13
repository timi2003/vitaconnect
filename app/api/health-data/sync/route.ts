// app/api/health-data/sync/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { HealthMetricType, MetricSource, Prisma } from "@prisma/client";

// ── Validation ────────────────────────────────────────────────────────────────

const SyncRequestSchema = z.object({
  type:    z.string(),
  records: z.array(z.record(z.unknown())),
});

// ── HC type → Prisma HealthMetricType ─────────────────────────────────────────

const HC_TYPE_MAP: Record<string, HealthMetricType> = {
  HeartRate:            HealthMetricType.HEART_RATE,
  Steps:                HealthMetricType.STEPS,
  BloodPressure:        HealthMetricType.BLOOD_PRESSURE,
  BloodGlucose:         HealthMetricType.BLOOD_GLUCOSE,
  OxygenSaturation:     HealthMetricType.OXYGEN_SATURATION,
  BodyTemperature:      HealthMetricType.BODY_TEMPERATURE,
  SleepSession:         HealthMetricType.SLEEP_DURATION,
  Weight:               HealthMetricType.WEIGHT,
  ActiveCaloriesBurned: HealthMetricType.CALORIES_BURNED,
  Distance:             HealthMetricType.DISTANCE,
  ExerciseSession:      HealthMetricType.EXERCISE_SESSION,
  RespiratoryRate:      HealthMetricType.RESPIRATORY_RATE,
  BodyFat:              HealthMetricType.BODY_FAT,
  Nutrition:            HealthMetricType.CALORIES_INTAKE,
};

// ── Helper types ──────────────────────────────────────────────────────────────

interface HCMetadata  { id?: string; }
interface HCWithValue { value?: number; }
interface HCWeight    { inKilograms?: number; }
interface HCEnergy    { inKilocalories?: number; }
interface HCTemp      { inCelsius?: number; }

function getMeta(r: Record<string, unknown>): HCMetadata {
  return (r.metadata as HCMetadata | undefined) ?? {};
}
function toDate(v: unknown): Date {
  return v ? new Date(v as string) : new Date();
}

// ── Transformer — returns a valid HealthMetricCreateManyInput ─────────────────

function transformRecord(
  type: string,
  r: Record<string, unknown>,
  userId: string,
): Prisma.HealthMetricCreateManyInput {
  const metricType = HC_TYPE_MAP[type] ?? HealthMetricType.HEART_RATE;
  const syncId     = getMeta(r).id ?? null;

  const base = {
    userId,
    type:   metricType,
    source: MetricSource.HEALTH_CONNECT,
    syncId,
    isAbnormal: false,
  } as const;

  switch (type) {
    case "HeartRate": {
      const bpm = Number(r.beatsPerMinute ?? 0);
      return { ...base, value: bpm, unit: "bpm", recordedAt: toDate(r.time) };
    }
    case "Steps": {
      return { ...base, value: Number(r.count ?? 0), unit: "steps", recordedAt: toDate(r.endTime) };
    }
    case "BloodPressure": {
      const sys = ((r.systolic as HCWithValue | undefined)?.value) ?? 0;
      const dia = ((r.diastolic as HCWithValue | undefined)?.value) ?? 0;
      return {
        ...base,
        value:      sys,
        value2:     dia,
        unit:       "mmHg",
        recordedAt: toDate(r.time),
        isAbnormal: sys > 140 || sys < 90 || dia > 90 || dia < 60,
      };
    }
    case "BloodGlucose": {
      const lvl = ((r.level as HCWithValue | undefined)?.value) ?? 0;
      return {
        ...base,
        value:      lvl,
        unit:       "mg/dL",
        recordedAt: toDate(r.time),
        isAbnormal: lvl > 126 || lvl < 70,
      };
    }
    case "OxygenSaturation": {
      const pct = Number(r.percentage ?? 0) * 100;
      return {
        ...base,
        value:      pct,
        unit:       "%",
        recordedAt: toDate(r.time),
        isAbnormal: pct < 95,
      };
    }
    case "BodyTemperature": {
      const val = ((r.temperature as HCTemp | undefined)?.inCelsius) ?? 0;
      return {
        ...base,
        value:      val,
        unit:       "°C",
        recordedAt: toDate(r.time),
        isAbnormal: val > 37.5 || val < 36.1,
      };
    }
    case "Weight": {
      const kg = ((r.weight as HCWeight | undefined)?.inKilograms) ?? 0;
      return { ...base, value: kg, unit: "kg", recordedAt: toDate(r.time) };
    }
    case "SleepSession": {
      const start = toDate(r.startTime).getTime();
      const end   = toDate(r.endTime).getTime();
      return {
        ...base,
        value:      Math.round((end - start) / 60_000),
        unit:       "minutes",
        recordedAt: toDate(r.startTime),
      };
    }
    case "ActiveCaloriesBurned": {
      const kcal = ((r.energy as HCEnergy | undefined)?.inKilocalories) ?? 0;
      return { ...base, value: kcal, unit: "kcal", recordedAt: toDate(r.endTime) };
    }
    case "RespiratoryRate": {
      return {
        ...base,
        value:      Number(r.rate ?? 0),
        unit:       "breaths/min",
        recordedAt: toDate(r.time),
      };
    }
    default:
      return { ...base, value: 0, unit: "", recordedAt: new Date() };
  }
}

// ── POST — sync records from Health Connect ───────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body              = await req.json();
    const { type, records } = SyncRequestSchema.parse(body);

    // Collect incoming syncIds for deduplication
    const incomingSyncIds = records
      .map((r) => getMeta(r).id)
      .filter((id): id is string => id !== undefined);

    const existing = await prisma.healthMetric.findMany({
      where:  { userId: session.user.id, syncId: { in: incomingSyncIds } },
      select: { syncId: true },
    });
    const existingSet = new Set(
      existing.map((m: { syncId: string | null }) => m.syncId)
    );

    // Build typed insert array
    const toInsert: Prisma.HealthMetricCreateManyInput[] = records
      .filter((r) => {
        const sid = getMeta(r).id;
        return !sid || !existingSet.has(sid);
      })
      .map((r) => transformRecord(type, r, session.user.id));

    if (toInsert.length === 0) {
      return NextResponse.json({ inserted: 0, skipped: records.length });
    }

    await prisma.healthMetric.createMany({
      data:           toInsert,
      skipDuplicates: true,
    });

    // Upsert sync status
    await prisma.healthConnectSync.upsert({
      where:  { userId_dataType: { userId: session.user.id, dataType: type } },
      create: {
        userId:          session.user.id,
        dataType:        type,
        lastSyncAt:      new Date(),
        status:          "SUCCESS",
        recordsImported: toInsert.length,
      },
      update: {
        lastSyncAt:      new Date(),
        status:          "SUCCESS",
        recordsImported: { increment: toInsert.length },
      },
    });

    // Health alerts for abnormal readings
    const abnormals = toInsert.filter((m) => m.isAbnormal);
    if (abnormals.length > 0) {
      await prisma.notification.createMany({
        data: abnormals.map((m) => ({
          userId:  session.user.id,
          type:    "HEALTH_ALERT" as const,
          title:   `Abnormal ${String(m.type).replace(/_/g, " ")} detected`,
          message: `Your reading of ${m.value} ${m.unit} is outside the normal range.`,
          data:    { metricType: m.type, value: m.value, unit: m.unit },
        })),
      });
    }

    return NextResponse.json({
      inserted: toInsert.length,
      skipped:  records.length - toInsert.length,
      alerts:   abnormals.length,
    });
  } catch (err) {
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
  const type      = searchParams.get("type");
  const days      = parseInt(searchParams.get("days") ?? "7", 10);
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const metrics = await prisma.healthMetric.findMany({
    where: {
      userId:     session.user.id,
      recordedAt: { gte: startDate },
      ...(type ? { type: type as HealthMetricType } : {}),
    },
    orderBy: { recordedAt: "desc" },
    take:    500,
  });

  return NextResponse.json({ metrics });
}