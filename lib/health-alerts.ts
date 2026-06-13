// lib/health-alerts.ts
// Detects clinically significant abnormal readings and generates alerts

export type AlertSeverity = "INFO" | "WARNING" | "CRITICAL";

export interface HealthAlert {
  metricType: string;
  value:      number;
  unit:       string;
  severity:   AlertSeverity;
  message:    string;
  advice:     string;
}

interface RangeRule {
  criticalLow?:  number;
  warningLow?:   number;
  warningHigh?:  number;
  criticalHigh?: number;
  unit:          string;
  lowMessage?:   string;
  highMessage?:  string;
  lowAdvice?:    string;
  highAdvice?:   string;
}

const RANGES: Record<string, RangeRule> = {
  HEART_RATE: {
    criticalLow:  40,  warningLow:  50,
    warningHigh:  100, criticalHigh: 150,
    unit: "bpm",
    lowMessage:  "Your heart rate is dangerously low (bradycardia)",
    highMessage: "Your heart rate is elevated (tachycardia)",
    lowAdvice:   "Seek emergency care immediately if you feel faint or short of breath.",
    highAdvice:  "Rest, avoid caffeine and strenuous activity. Contact your doctor if persistent.",
  },
  BLOOD_PRESSURE: {
    criticalLow:  80,  warningLow:  90,
    warningHigh:  140, criticalHigh: 180,
    unit: "mmHg (systolic)",
    lowMessage:  "Your blood pressure is low (hypotension)",
    highMessage: "Your blood pressure is high (hypertension)",
    lowAdvice:   "Lie down, hydrate, and seek medical attention if symptomatic.",
    highAdvice:  "Avoid salt and stress. Contact your cardiologist immediately if ≥180.",
  },
  BLOOD_GLUCOSE: {
    criticalLow:  54,  warningLow:  70,
    warningHigh:  126, criticalHigh: 250,
    unit: "mg/dL",
    lowMessage:  "Your blood glucose is critically low (hypoglycemia)",
    highMessage: "Your blood glucose is elevated (hyperglycemia)",
    lowAdvice:   "Consume fast-acting carbohydrates immediately. Seek help if unresponsive.",
    highAdvice:  "Check for ketones, hydrate, and consult your endocrinologist.",
  },
  OXYGEN_SATURATION: {
    criticalLow:  90,  warningLow:  95,
    unit: "%",
    lowMessage:  "Your blood oxygen level is low",
    lowAdvice:   "Seek immediate medical attention. Sit upright and breathe slowly.",
  },
  BODY_TEMPERATURE: {
    criticalLow:  35,  warningLow:  36.1,
    warningHigh:  37.5, criticalHigh: 39.5,
    unit: "°C",
    lowMessage:  "Your temperature indicates hypothermia",
    highMessage: "Your temperature indicates fever",
    lowAdvice:   "Warm up immediately and seek emergency care.",
    highAdvice:  "Stay hydrated and rest. Seek care if above 39.5°C or lasting >3 days.",
  },
  RESPIRATORY_RATE: {
    criticalLow:  8,   warningLow:  12,
    warningHigh:  20,  criticalHigh: 30,
    unit: "breaths/min",
    lowMessage:  "Your breathing rate is abnormally slow",
    highMessage: "Your breathing rate is elevated",
    lowAdvice:   "Seek emergency care immediately.",
    highAdvice:  "Rest and monitor. Contact your doctor if accompanied by chest pain.",
  },
  WEIGHT: {
    // Relative change alert instead of absolute range
    unit: "kg",
  },
};

export function detectAlerts(
  metricType: string,
  value: number,
): HealthAlert | null {
  const rule = RANGES[metricType];
  if (!rule) return null;

  let severity: AlertSeverity | null = null;
  let isHigh = false;

  if (rule.criticalLow  !== undefined && value <= rule.criticalLow)  { severity = "CRITICAL"; isHigh = false; }
  else if (rule.criticalHigh !== undefined && value >= rule.criticalHigh) { severity = "CRITICAL"; isHigh = true;  }
  else if (rule.warningLow   !== undefined && value <  rule.warningLow)  { severity = "WARNING";  isHigh = false; }
  else if (rule.warningHigh  !== undefined && value >  rule.warningHigh) { severity = "WARNING";  isHigh = true;  }

  if (!severity) return null;

  const message = isHigh ? (rule.highMessage ?? `High ${metricType}`) : (rule.lowMessage ?? `Low ${metricType}`);
  const advice  = isHigh ? (rule.highAdvice  ?? "Contact your doctor.") : (rule.lowAdvice  ?? "Contact your doctor.");

  return { metricType, value, unit: rule.unit, severity, message, advice };
}

export function detectBatchAlerts(
  metrics: Array<{ type: string; value: number }>
): HealthAlert[] {
  return metrics
    .map((m) => detectAlerts(m.type, m.value))
    .filter((a): a is HealthAlert => a !== null);
}

// Detect rapid weight change (>2kg in 7 days)
export function detectWeightChange(
  readings: Array<{ value: number; recordedAt: Date }>
): HealthAlert | null {
  if (readings.length < 2) return null;

  const sorted = [...readings].sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime());
  const latest = sorted[0];
  const week   = sorted.find((r) =>
    r.recordedAt.getTime() < latest.recordedAt.getTime() - 6 * 86400000
  );
  if (!week) return null;

  const change = Math.abs(latest.value - week.value);
  if (change >= 2) {
    const dir = latest.value > week.value ? "gained" : "lost";
    return {
      metricType: "WEIGHT",
      value: change,
      unit: "kg",
      severity: "WARNING",
      message: `Rapid weight change detected: ${dir} ${change.toFixed(1)} kg in 7 days`,
      advice: "Sudden weight changes can indicate fluid retention or other conditions. Consult your doctor.",
    };
  }
  return null;
}
