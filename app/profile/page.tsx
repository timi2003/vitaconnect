"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  User, Bell, Shield, Smartphone, CreditCard,
  Camera, Save, LogOut, Trash2, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile",       label: "Profile",        icon: User       },
  { id: "notifications", label: "Notifications",  icon: Bell       },
  { id: "devices",       label: "Health Devices", icon: Smartphone },
  { id: "security",      label: "Security",       icon: Shield     },
  { id: "billing",       label: "Billing",        icon: CreditCard },
];

type Form = {
  name:              string;
  email:             string;
  phone:             string;
  dateOfBirth:       string;
  gender:            string;
  bloodType:         string;
  height:            string;
  weight:            string;
  allergies:         string;
  chronicConditions: string;
  emergencyName:     string;
  emergencyPhone:    string;
  emergencyRel:      string;
};

const EMPTY_FORM: Form = {
  name: "", email: "", phone: "", dateOfBirth: "",
  gender: "", bloodType: "", height: "", weight: "",
  allergies: "", chronicConditions: "",
  emergencyName: "", emergencyPhone: "", emergencyRel: "",
};

// ── Types matching the API response ──────────────────────────────────────────

interface UserProfile {
  id:                string;
  name:              string | null;
  email:             string;
  image:             string | null;
  phone:             string | null;
  role:              string;
  isVerified:        boolean;
  dateOfBirth:       string | null;
  gender:            string | null;
  bloodType:         string | null;
  height:            number | null;
  weight:            number | null;
  allergies:         string[];
  chronicConditions: string[];
  emergencyContact:  { name?: string; phone?: string; relationship?: string } | null;
  timezone:          string;
  locale:            string;
  createdAt:         string;
  patientProfile: {
    insuranceProvider: string | null;
    insurancePolicyNo: string | null;
    insuranceGroupNo:  string | null;
    preferredLanguage: string;
  } | null;
  doctorProfile: {
    licenseNumber:   string;
    specializations: string[];
    consultationFee: number;
    rating:          number;
    totalReviews:    number;
    isAvailableNow:  boolean;
    hospital:        string | null;
    department:      string | null;
  } | null;
}

function userToForm(user: UserProfile): Form {
  const ec = user.emergencyContact;
  return {
    name:              user.name              ?? "",
    email:             user.email             ?? "",
    phone:             user.phone             ?? "",
    dateOfBirth:       user.dateOfBirth       ? user.dateOfBirth.slice(0, 10) : "",
    gender:            user.gender            ?? "",
    bloodType:         user.bloodType         ?? "",
    height:            user.height  != null   ? String(user.height)  : "",
    weight:            user.weight  != null   ? String(user.weight)  : "",
    allergies:         Array.isArray(user.allergies)
                         ? user.allergies.join(", ") : "",
    chronicConditions: Array.isArray(user.chronicConditions)
                         ? user.chronicConditions.join(", ") : "",
    emergencyName:     ec?.name         ?? "",
    emergencyPhone:    ec?.phone        ?? "",
    emergencyRel:      ec?.relationship ?? "",
  };
}

export default function ProfilePage() {
  const [tab, setTab]         = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [form, setForm]       = useState<Form>(EMPTY_FORM);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // ── Fetch from User table via /api/user/profile ───────────────────────────

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          const { error: msg } = await res.json().catch(() => ({}));
          setError(msg ?? "Failed to load profile");
          return;
        }
        const { user } = (await res.json()) as { user: UserProfile };
        setProfile(user);
        setForm(userToForm(user));
      } catch {
        setError("Network error loading profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  function update(k: keyof Form, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/profile", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:              form.name,
          phone:             form.phone,
          dateOfBirth:       form.dateOfBirth       || undefined,
          gender:            form.gender             || undefined,
          bloodType:         form.bloodType          || undefined,
          height:            form.height             || undefined,
          weight:            form.weight             || undefined,
          allergies:         form.allergies,
          chronicConditions: form.chronicConditions,
          emergencyName:     form.emergencyName,
          emergencyPhone:    form.emergencyPhone,
          emergencyRel:      form.emergencyRel,
        }),
      });

      if (!res.ok) {
        const { error: msg } = await res.json().catch(() => ({}));
        setError(msg ?? "Failed to save");
        return;
      }

      const { user: updated } = (await res.json()) as { user: UserProfile };
      setProfile(updated);
      setForm(userToForm(updated));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Network error — changes not saved");
    } finally {
      setSaving(false);
    }
  }

  // ── Derived display values ────────────────────────────────────────────────

  const initials = form.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-US", {
        month: "long", year: "numeric",
      })
    : null;

  // ── Loading state ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto space-y-6 pb-24 lg:pb-8">
          <div className="h-8 w-48 rounded-lg bg-surface-700/50 animate-pulse" />
          <div className="flex gap-6 flex-col lg:flex-row">
            <div className="lg:w-52 flex-shrink-0">
              <div className="glass border border-subtle p-2 space-y-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-9 rounded-lg bg-surface-700/30 animate-pulse" />
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="glass border border-subtle p-6 space-y-3">
                  <div className="h-4 w-32 rounded bg-surface-700/50 animate-pulse" />
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="h-10 rounded-lg bg-surface-700/30 animate-pulse" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-enter max-w-4xl mx-auto space-y-6 pb-24 lg:pb-8">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Profile & Settings</h1>
          <p className="text-sm text-muted mt-0.5">Manage your account and health preferences</p>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">

          {/* Sidebar */}
          <div className="lg:w-52 flex-shrink-0">
            <div className="glass border border-subtle p-2 space-y-0.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn("nav-item w-full", tab === t.id && "active")}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
              <div className="pt-2 mt-2 border-t border-subtle">
                <button className="nav-item w-full text-rose-400 hover:bg-rose-500/10">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>

            {/* Member since — sourced from User.createdAt */}
            {memberSince && (
              <p className="text-xs text-muted text-center mt-3 font-mono">
                Member since {memberSince}
              </p>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* Feedback banners */}
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl bg-teal-500/10 border border-teal-500/30 px-4 py-3 text-sm text-teal-400">
                Profile updated successfully.
              </div>
            )}

            {/* ── Profile tab ─────────────────────────────────────────────── */}
            {tab === "profile" && (
              <>
                {/* Avatar + identity */}
                <div className="glass border border-subtle p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profile?.image ? (
                        <img
                          src={profile.image}
                          alt={form.name}
                          className="w-20 h-20 rounded-2xl object-cover border border-subtle"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-2xl bg-brand-600/30 border border-brand-500/30
                                        flex items-center justify-center font-display font-bold text-3xl text-brand-300">
                          {initials}
                        </div>
                      )}
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-brand-500
                                         flex items-center justify-center shadow-glow-sm">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-primary">
                        {form.name || "—"}
                      </h2>
                      <p className="text-sm text-muted">{form.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={cn(
                          "badge text-xs py-0.5",
                          profile?.isVerified ? "badge-success" : "badge-warning"
                        )}>
                          {profile?.isVerified ? "Verified Patient" : "Unverified"}
                        </span>
                        {profile?.role && profile.role !== "PATIENT" && (
                          <span className="badge badge-info text-xs py-0.5">
                            {profile.role.charAt(0) + profile.role.slice(1).toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal info */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        { label: "Full Name",     key: "name",        type: "text"  },
                        { label: "Email",          key: "email",       type: "email" },
                        { label: "Phone",          key: "phone",       type: "tel"   },
                        { label: "Date of Birth",  key: "dateOfBirth", type: "date"  },
                      ] as { label: string; key: keyof Form; type: string }[]
                    ).map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="text-xs text-muted font-display block mb-1.5">
                          {label}
                        </label>
                        <input
                          className="input text-sm"
                          type={type}
                          readOnly={key === "email"}
                          value={form[key]}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </div>
                    ))}

                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Gender</label>
                      <select
                        className="input text-sm"
                        value={form.gender}
                        onChange={(e) => update("gender", e.target.value)}
                      >
                        <option value="">— select —</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="NON_BINARY">Non-binary</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Blood Type</label>
                      <select
                        className="input text-sm"
                        value={form.bloodType}
                        onChange={(e) => update("bloodType", e.target.value)}
                      >
                        <option value="">— select —</option>
                        {[
                          "A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE",
                          "AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE","UNKNOWN",
                        ].map((bt) => (
                          <option key={bt} value={bt}>
                            {bt.replace("_POSITIVE"," +").replace("_NEGATIVE"," -")}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Body metrics */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Body Metrics</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Height (cm)</label>
                      <input
                        className="input text-sm"
                        type="number"
                        value={form.height}
                        onChange={(e) => update("height", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Weight (kg)</label>
                      <input
                        className="input text-sm"
                        type="number"
                        value={form.weight}
                        onChange={(e) => update("weight", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* BMI — computed client-side from User.height + User.weight */}
                  {form.height && form.weight && (
                    <div className="pt-2 border-t border-subtle">
                      <p className="text-xs text-muted font-display">
                        BMI{" "}
                        <span className="text-primary font-mono font-bold ml-1">
                          {(
                            Number(form.weight) /
                            Math.pow(Number(form.height) / 100, 2)
                          ).toFixed(1)}
                        </span>
                        <span className="ml-2 text-muted">
                          {(() => {
                            const bmi =
                              Number(form.weight) /
                              Math.pow(Number(form.height) / 100, 2);
                            if (bmi < 18.5) return "Underweight";
                            if (bmi < 25)   return "Normal";
                            if (bmi < 30)   return "Overweight";
                            return "Obese";
                          })()}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Medical background */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Medical Background</h3>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">
                      Known Allergies{" "}
                      <span className="opacity-50">(comma-separated)</span>
                    </label>
                    <input
                      className="input text-sm"
                      placeholder="e.g. Penicillin, Shellfish…"
                      value={form.allergies}
                      onChange={(e) => update("allergies", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">
                      Chronic Conditions{" "}
                      <span className="opacity-50">(comma-separated)</span>
                    </label>
                    <input
                      className="input text-sm"
                      placeholder="e.g. Hypertension, Diabetes…"
                      value={form.chronicConditions}
                      onChange={(e) => update("chronicConditions", e.target.value)}
                    />
                  </div>

                  {/* Insurance — from patientProfile, read-only display */}
                  {profile?.patientProfile?.insuranceProvider && (
                    <div className="pt-3 border-t border-subtle grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { label: "Insurance Provider", value: profile.patientProfile.insuranceProvider },
                        { label: "Policy No.",         value: profile.patientProfile.insurancePolicyNo },
                        { label: "Group No.",          value: profile.patientProfile.insuranceGroupNo  },
                      ].map(({ label, value }) =>
                        value ? (
                          <div key={label}>
                            <p className="text-xs text-muted font-display mb-1">{label}</p>
                            <p className="text-sm font-mono text-primary">{value}</p>
                          </div>
                        ) : null
                      )}
                    </div>
                  )}
                </div>

                {/* Emergency contact */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Emergency Contact</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(
                      [
                        { label: "Name",         key: "emergencyName",  type: "text" },
                        { label: "Phone",         key: "emergencyPhone", type: "tel"  },
                        { label: "Relationship",  key: "emergencyRel",   type: "text" },
                      ] as { label: string; key: keyof Form; type: string }[]
                    ).map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="text-xs text-muted font-display block mb-1.5">
                          {label}
                        </label>
                        <input
                          className="input text-sm"
                          type={type}
                          value={form[key]}
                          onChange={(e) => update(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 text-sm"
                >
                  <Save className="w-4 h-4" />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            )}

            {/* ── Notifications tab ───────────────────────────────────────── */}
            {tab === "notifications" && (
              <div className="glass border border-subtle p-6 space-y-5">
                <h3 className="font-display font-bold text-primary text-sm">
                  Notification Preferences
                </h3>
                {[
                  { label: "Appointment Reminders",  desc: "1 hour before your appointment",        checked: true  },
                  { label: "New Messages",            desc: "When a doctor sends you a message",     checked: true  },
                  { label: "Lab Result Ready",        desc: "When test results are available",       checked: true  },
                  { label: "Health Alerts",           desc: "Abnormal readings from Health Connect", checked: true  },
                  { label: "Prescription Updates",    desc: "New prescriptions or refill reminders", checked: true  },
                  { label: "Marketing",               desc: "News and platform updates",             checked: false },
                ].map((n) => (
                  <div
                    key={n.label}
                    className="flex items-center justify-between py-2 border-b border-subtle last:border-0"
                  >
                    <div>
                      <p className="text-sm font-display font-semibold text-primary">{n.label}</p>
                      <p className="text-xs text-muted">{n.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input type="checkbox" defaultChecked={n.checked} className="sr-only peer" />
                      <div className="w-10 h-5 bg-surface-700 rounded-full peer
                                      peer-checked:bg-brand-500 transition-colors duration-200
                                      after:content-[''] after:absolute after:top-0.5 after:left-0.5
                                      after:w-4 after:h-4 after:rounded-full after:bg-white
                                      after:transition-transform after:duration-200
                                      peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* ── Devices tab ─────────────────────────────────────────────── */}
            {tab === "devices" && (
              <div className="space-y-4">
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    Health Connect Status
                  </h3>
                  <div className="flex items-center justify-between p-4 rounded-xl
                                  bg-teal-500/8 border border-teal-500/25">
                    <div>
                      <p className="text-sm font-display font-semibold text-teal-300">
                        Android Health Connect
                      </p>
                      <p className="text-xs text-muted">
                        12 data types synced · Last sync: 3 min ago
                      </p>
                    </div>
                    <span className="badge badge-success">Connected</span>
                  </div>
                </div>

                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">
                    Connected Devices
                  </h3>
                  {[
                    { name: "Samsung Galaxy Watch 6", type: "Smartwatch",      icon: "⌚", connected: true,  lastSeen: "Just now"    },
                    { name: "Omron BP Monitor",        type: "Blood Pressure",  icon: "🩺", connected: true,  lastSeen: "2 hours ago" },
                    { name: "Dexcom G7",               type: "Glucose Monitor", icon: "🩸", connected: false, lastSeen: "3 days ago"  },
                  ].map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center gap-3 p-3 rounded-xl border border-subtle
                                 hover:border-brand-500/25 transition-colors"
                    >
                      <span className="text-2xl">{d.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-display font-semibold text-primary">{d.name}</p>
                        <p className="text-xs text-muted">{d.type} · {d.lastSeen}</p>
                      </div>
                      <span className={cn(
                        "badge text-xs py-0.5",
                        d.connected ? "badge-success" : "badge-warning",
                      )}>
                        {d.connected ? "Active" : "Offline"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Security tab ────────────────────────────────────────────── */}
            {tab === "security" && (
              <div className="space-y-4">
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Change Password</h3>
                  {["Current Password", "New Password", "Confirm New Password"].map((label) => (
                    <div key={label}>
                      <label className="text-xs text-muted font-display block mb-1.5">{label}</label>
                      <input className="input text-sm" type="password" placeholder="••••••••" />
                    </div>
                  ))}
                  <button className="btn-primary text-sm">Update Password</button>
                </div>

                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">
                    Two-Factor Authentication
                  </h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary">Authenticator App</p>
                      <p className="text-xs text-muted">Adds an extra layer of security</p>
                    </div>
                    <button className="btn-ghost text-xs py-2 px-4">Enable</button>
                  </div>
                </div>

                {/* Account info — from User table */}
                {profile && (
                  <div className="glass border border-subtle p-6 space-y-3">
                    <h3 className="font-display font-bold text-primary text-sm">Account Details</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-muted font-display">Account ID</p>
                        <p className="font-mono text-primary mt-0.5 truncate">{profile.id}</p>
                      </div>
                      <div>
                        <p className="text-muted font-display">Role</p>
                        <p className="font-mono text-primary mt-0.5">{profile.role}</p>
                      </div>
                      <div>
                        <p className="text-muted font-display">Timezone</p>
                        <p className="font-mono text-primary mt-0.5">{profile.timezone}</p>
                      </div>
                      <div>
                        <p className="text-muted font-display">Locale</p>
                        <p className="font-mono text-primary mt-0.5">{profile.locale}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="glass border border-rose-500/25 bg-rose-500/5 p-6 space-y-3">
                  <h3 className="font-display font-bold text-rose-400 text-sm">Danger Zone</h3>
                  <button className="btn-ghost text-xs py-2 px-4 text-rose-400 border-rose-500/30
                                     hover:bg-rose-500/10 flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* ── Billing tab ─────────────────────────────────────────────── */}
            {tab === "billing" && (
              <div className="space-y-4">
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Current Plan</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl
                                  bg-brand-500/8 border border-brand-500/25">
                    <div>
                      <p className="font-display font-bold text-primary">Free Plan</p>
                      <p className="text-xs text-muted">
                        3 consultations/month · Basic health sync
                      </p>
                    </div>
                    <button className="btn-primary text-xs py-2 px-4">Upgrade</button>
                  </div>
                </div>

                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Payment History</h3>
                  {[
                    { desc: "Consultation – Dr. Sarah Chen",  date: "May 28", amount: "$75.00", status: "Paid" },
                    { desc: "Consultation – Dr. Priya Patel", date: "May 20", amount: "$90.00", status: "Paid" },
                  ].map((p) => (
                    <div
                      key={p.desc}
                      className="flex items-center justify-between py-2 border-b border-subtle last:border-0"
                    >
                      <div>
                        <p className="text-sm font-display font-medium text-secondary">{p.desc}</p>
                        <p className="text-xs text-muted">{p.date}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-mono font-bold text-primary">{p.amount}</p>
                        <span className="badge badge-success text-xs py-0.5">{p.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}