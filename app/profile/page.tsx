"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  User, Bell, Shield, Smartphone, CreditCard,
  ChevronRight, Camera, Save, LogOut, Trash2,
  Activity, Globe, Moon, Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "profile",       label: "Profile",       icon: User      },
  { id: "notifications", label: "Notifications", icon: Bell      },
  { id: "devices",       label: "Health Devices",icon: Smartphone },
  { id: "security",      label: "Security",      icon: Shield    },
  { id: "billing",       label: "Billing",       icon: CreditCard },
];

export default function ProfilePage() {
  const [tab, setTab] = useState("profile");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "Alex Johnson", email: "patient@vitaconnect.health",
    phone: "+1-555-0100", dateOfBirth: "1990-03-15",
    gender: "MALE", bloodType: "O_POSITIVE",
    height: "178", weight: "73.2",
    allergies: "Penicillin, Shellfish",
    chronicConditions: "Hypertension, Prediabetes",
    emergencyName: "Jamie Johnson", emergencyPhone: "+1-555-0200",
    emergencyRel: "Spouse",
  });

  function update(k: string, v: string) {
    setForm((p) => ({ ...p, [k]: v }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
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
          {/* Sidebar tabs */}
          <div className="lg:w-52 flex-shrink-0">
            <div className="glass border border-subtle p-2 space-y-0.5">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn("nav-item w-full", tab === t.id && "active")}>
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
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-5">

            {/* ── Profile tab ── */}
            {tab === "profile" && (
              <>
                {/* Avatar */}
                <div className="glass border border-subtle p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl bg-brand-600/30 border border-brand-500/30
                                      flex items-center justify-center font-display font-bold text-3xl text-brand-300">
                        AJ
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-brand-500
                                         flex items-center justify-center shadow-glow-sm">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    <div>
                      <h2 className="font-display font-bold text-lg text-primary">{form.name}</h2>
                      <p className="text-sm text-muted">{form.email}</p>
                      <span className="badge badge-success mt-1.5">Verified Patient</span>
                    </div>
                  </div>
                </div>

                {/* Personal info */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Full Name",     key: "name",         type: "text"  },
                      { label: "Email",          key: "email",        type: "email" },
                      { label: "Phone",          key: "phone",        type: "tel"   },
                      { label: "Date of Birth",  key: "dateOfBirth",  type: "date"  },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="text-xs text-muted font-display block mb-1.5">{label}</label>
                        <input className="input text-sm" type={type}
                          value={form[key as keyof typeof form]}
                          onChange={(e) => update(key, e.target.value)} />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Gender</label>
                      <select className="input text-sm" value={form.gender} onChange={(e) => update("gender", e.target.value)}>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="NON_BINARY">Non-binary</option>
                        <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Blood Type</label>
                      <select className="input text-sm" value={form.bloodType} onChange={(e) => update("bloodType", e.target.value)}>
                        {["A_POSITIVE","A_NEGATIVE","B_POSITIVE","B_NEGATIVE","AB_POSITIVE","AB_NEGATIVE","O_POSITIVE","O_NEGATIVE","UNKNOWN"].map((bt) => (
                          <option key={bt} value={bt}>{bt.replace("_", " ").replace("POSITIVE","+").replace("NEGATIVE","-")}</option>
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
                      <input className="input text-sm" type="number" value={form.height} onChange={(e) => update("height", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Weight (kg)</label>
                      <input className="input text-sm" type="number" value={form.weight} onChange={(e) => update("weight", e.target.value)} />
                    </div>
                  </div>
                </div>

                {/* Medical background */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Medical Background</h3>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">Known Allergies</label>
                    <input className="input text-sm" placeholder="e.g. Penicillin, Shellfish…"
                      value={form.allergies} onChange={(e) => update("allergies", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">Chronic Conditions</label>
                    <input className="input text-sm" placeholder="e.g. Hypertension, Diabetes…"
                      value={form.chronicConditions} onChange={(e) => update("chronicConditions", e.target.value)} />
                  </div>
                </div>

                {/* Emergency contact */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Emergency Contact</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Name</label>
                      <input className="input text-sm" value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Phone</label>
                      <input className="input text-sm" type="tel" value={form.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Relationship</label>
                      <input className="input text-sm" value={form.emergencyRel} onChange={(e) => update("emergencyRel", e.target.value)} />
                    </div>
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="btn-primary flex items-center gap-2 text-sm">
                  <Save className="w-4 h-4" />
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </>
            )}

            {/* ── Notifications tab ── */}
            {tab === "notifications" && (
              <div className="glass border border-subtle p-6 space-y-5">
                <h3 className="font-display font-bold text-primary text-sm">Notification Preferences</h3>
                {[
                  { label: "Appointment Reminders",  desc: "1 hour before your appointment",      checked: true  },
                  { label: "New Messages",            desc: "When a doctor sends you a message",   checked: true  },
                  { label: "Lab Result Ready",        desc: "When test results are available",     checked: true  },
                  { label: "Health Alerts",           desc: "Abnormal readings from Health Connect",checked: true },
                  { label: "Prescription Updates",    desc: "New prescriptions or refill reminders",checked: true },
                  { label: "Marketing",               desc: "News and platform updates",           checked: false },
                ].map((n) => (
                  <div key={n.label} className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
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

            {/* ── Devices tab ── */}
            {tab === "devices" && (
              <div className="space-y-4">
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm flex items-center gap-2">
                    <Activity className="w-4 h-4 text-teal-400" />
                    Health Connect Status
                  </h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-teal-500/8 border border-teal-500/25">
                    <div>
                      <p className="text-sm font-display font-semibold text-teal-300">Android Health Connect</p>
                      <p className="text-xs text-muted">12 data types synced · Last sync: 3 min ago</p>
                    </div>
                    <span className="badge badge-success">Connected</span>
                  </div>
                </div>

                {/* Connected devices */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Connected Devices</h3>
                  {[
                    { name: "Samsung Galaxy Watch 6", type: "Smartwatch",       icon: "⌚", connected: true,  lastSeen: "Just now" },
                    { name: "Omron BP Monitor",        type: "Blood Pressure",   icon: "🩺", connected: true,  lastSeen: "2 hours ago" },
                    { name: "Dexcom G7",               type: "Glucose Monitor",  icon: "🩸", connected: false, lastSeen: "3 days ago" },
                  ].map((d) => (
                    <div key={d.name} className="flex items-center gap-3 p-3 rounded-xl border border-subtle
                                                  hover:border-brand-500/25 transition-colors">
                      <span className="text-2xl">{d.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-display font-semibold text-primary">{d.name}</p>
                        <p className="text-xs text-muted">{d.type} · {d.lastSeen}</p>
                      </div>
                      <span className={cn("badge text-xs py-0.5", d.connected ? "badge-success" : "badge-warning")}>
                        {d.connected ? "Active" : "Offline"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Security tab ── */}
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
                  <h3 className="font-display font-bold text-primary text-sm">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary">Authenticator App</p>
                      <p className="text-xs text-muted">Adds an extra layer of security</p>
                    </div>
                    <button className="btn-ghost text-xs py-2 px-4">Enable</button>
                  </div>
                </div>

                <div className="glass border border-rose-500/25 bg-rose-500/5 p-6 space-y-3">
                  <h3 className="font-display font-bold text-rose-400 text-sm">Danger Zone</h3>
                  <button className="btn-ghost text-xs py-2 px-4 text-rose-400 border-rose-500/30
                                     hover:bg-rose-500/10 flex items-center gap-2">
                    <Trash2 className="w-3.5 h-3.5" /> Delete Account
                  </button>
                </div>
              </div>
            )}

            {/* ── Billing tab ── */}
            {tab === "billing" && (
              <div className="space-y-4">
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Current Plan</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl bg-brand-500/8 border border-brand-500/25">
                    <div>
                      <p className="font-display font-bold text-primary">Free Plan</p>
                      <p className="text-xs text-muted">3 consultations/month · Basic health sync</p>
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
                    <div key={p.desc} className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
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
