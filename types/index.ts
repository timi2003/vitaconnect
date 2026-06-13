// types/index.ts

// ── User & Auth ───────────────────────────────────────────────────────────────
export type UserRole = "PATIENT" | "DOCTOR" | "ADMIN" | "NURSE" | "PHARMACIST";
export type Gender   = "MALE" | "FEMALE" | "NON_BINARY" | "PREFER_NOT_TO_SAY";
export type BloodType =
  | "A_POSITIVE" | "A_NEGATIVE"
  | "B_POSITIVE" | "B_NEGATIVE"
  | "AB_POSITIVE"| "AB_NEGATIVE"
  | "O_POSITIVE" | "O_NEGATIVE"
  | "UNKNOWN";

export interface UserProfile {
  id:                string;
  email:             string;
  name:              string;
  image?:            string;
  role:              UserRole;
  phone?:            string;
  dateOfBirth?:      string;
  gender?:           Gender;
  bloodType?:        BloodType;
  height?:           number;
  weight?:           number;
  allergies:         string[];
  chronicConditions: string[];
  emergencyContact?: { name: string; phone: string; relationship: string };
  isVerified:        boolean;
  createdAt:         string;
}

// ── Appointments ──────────────────────────────────────────────────────────────
export type ConsultType        = "VIDEO" | "AUDIO" | "CHAT" | "IN_PERSON";
export type AppointmentStatus  =
  | "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS"
  | "COMPLETED" | "CANCELLED" | "NO_SHOW" | "RESCHEDULED";

export interface AppointmentSummary {
  id:          string;
  scheduledAt: string;
  duration:    number;
  type:        ConsultType;
  status:      AppointmentStatus;
  reason?:     string;
  symptoms:    string[];
  roomId?:     string;
  fee:         number;
  doctorName:  string;
  specialty:   string;
}

// ── Health Metrics ────────────────────────────────────────────────────────────
export type HealthMetricType =
  | "HEART_RATE" | "BLOOD_PRESSURE" | "BLOOD_GLUCOSE"
  | "OXYGEN_SATURATION" | "BODY_TEMPERATURE"
  | "STEPS" | "DISTANCE" | "CALORIES_BURNED" | "ACTIVE_MINUTES"
  | "SLEEP_DURATION" | "WEIGHT" | "HEIGHT" | "BMI" | "BODY_FAT"
  | "RESPIRATORY_RATE" | "CALORIES_INTAKE" | "WATER_INTAKE";

export type MetricSource = "MANUAL" | "HEALTH_CONNECT" | "WEARABLE" | "MEDICAL_DEVICE" | "IMPORTED";

export interface HealthMetricRecord {
  id:          string;
  type:        HealthMetricType;
  value:       number;
  value2?:     number;
  unit:        string;
  recordedAt:  string;
  source:      MetricSource;
  isAbnormal:  boolean;
  notes?:      string;
  syncId?:     string;
}

// ── Health Connect ────────────────────────────────────────────────────────────
export type HCAvailability = "checking" | "Available" | "NotInstalled" | "NotSupported" | "WebOnly";
export type SyncStatus     = "PENDING" | "SYNCING" | "SUCCESS" | "FAILED" | "PARTIAL";

export interface DeviceConnection {
  id:          string;
  deviceName:  string;
  deviceType:  string;
  manufacturer?: string;
  model?:      string;
  isConnected: boolean;
  lastSeenAt?: string;
}

// ── Prescriptions ─────────────────────────────────────────────────────────────
export type PrescriptionStatus = "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED" | "ON_HOLD";

export interface Medication {
  id:              string;
  medicationName:  string;
  genericName?:    string;
  dosage:          string;
  form?:           string;
  frequency:       string;
  duration:        string;
  quantity:        number;
  instructions?:   string;
  isChronic:       boolean;
}

export interface PrescriptionRecord {
  id:             string;
  status:         PrescriptionStatus;
  diagnosis?:     string;
  issueDate:      string;
  expiryDate?:    string;
  refillsAllowed: number;
  refillsUsed:    number;
  medications:    Medication[];
  doctorName?:    string;
  notes?:         string;
}

// ── Lab Results ───────────────────────────────────────────────────────────────
export interface LabTestResult {
  id:              string;
  testName:        string;
  testCode?:       string;
  value:           string;
  unit?:           string;
  referenceRange?: string;
  isAbnormal:      boolean;
  abnormalFlag?:   string;
  interpretation?: string;
  reportedAt?:     string;
  labName?:        string;
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType =
  | "APPOINTMENT_REMINDER" | "APPOINTMENT_CONFIRMED" | "APPOINTMENT_CANCELLED"
  | "APPOINTMENT_STARTED" | "NEW_MESSAGE" | "PRESCRIPTION_READY"
  | "LAB_RESULT_READY" | "HEALTH_ALERT" | "PAYMENT_SUCCESS" | "PAYMENT_FAILED"
  | "DOCTOR_AVAILABLE" | "SYSTEM";

export interface AppNotification {
  id:        string;
  type:      NotificationType;
  title:     string;
  message:   string;
  data?:     Record<string, unknown>;
  isRead:    boolean;
  createdAt: string;
}

// ── API responses ─────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data:  T[];
  total: number;
  page:  number;
  limit: number;
}

export interface ApiError {
  error:   string;
  details?: unknown;
  status:  number;
}
