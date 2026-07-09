"use client";

import { useState, useEffect } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import {
  User, Bell, Shield, CreditCard, Camera,
  Save, Trash2, Plus, X, BadgeCheck, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notif", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "billing", label: "Billing", icon: CreditCard },
];

const SPECIALTIES = [
  "General Practice", "Cardiology", "Endocrinology", "Dermatology", "Neurology",
  "Orthopedics", "Psychiatry", "Pediatrics", "Oncology", "Gynecology",
];

const LANGUAGES = ["English", "French", "Spanish", "Arabic", "Yoruba", "Hausa", "Igbo", "Portuguese", "Mandarin", "Hindi"];

type FormState = {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  npiNumber: string;
  experience: string;
  hospital: string;
  department: string;
  bio: string;
  consultFee: string;
  followUpFee: string;
  specializations: string[];
  languages: string[];
};

const EMPTY_FORM: FormState = {
  name: "", email: "", phone: "", licenseNumber: "", npiNumber: "",
  experience: "", hospital: "", department: "", bio: "",
  consultFee: "", followUpFee: "", specializations: [], languages: [],
};

export default function DoctorProfilePage() {
  const [tab, setTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [qualifications, setQualifications] = useState<{ degree: string; institution: string; year: string }[]>([]);

  // ── Load real data on mount ──────────────────────────────────────────────
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) throw new Error("Failed to load profile");
        const { user } = await res.json();
        const doctor = user.doctor_profile ?? {};

        setForm({
          name: user.name ?? "",
          email: user.email ?? "",
          phone: user.phone ?? "",
          licenseNumber: doctor.licenseNumber ?? "",
          npiNumber: doctor.npiNumber ?? "",
          experience: doctor.experience?.toString() ?? "",
          hospital: doctor.hospital ?? "",
          department: doctor.department ?? "",
          bio: doctor.bio ?? "",
          consultFee: doctor.consultationFee?.toString() ?? "",
          followUpFee: doctor.followUpFee?.toString() ?? "",
          specializations: doctor.specializations ?? [],
          languages: doctor.languages ?? [],
        });
        setQualifications(doctor.qualifications ?? []);
      } catch (err) {
        console.error("[DoctorProfilePage] load failed:", err);
        toast.error("Couldn't load your profile");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  function update(k: string, v: string) { setForm((p) => ({ ...p, [k]: v })); }

  function toggleSpec(s: string) {
    setForm((p) => ({
      ...p,
      specializations: p.specializations.includes(s)
        ? p.specializations.filter((x) => x !== s)
        : [...p.specializations, s],
    }));
  }

  function toggleLang(l: string) {
    setForm((p) => ({
      ...p,
      languages: p.languages.includes(l)
        ? p.languages.filter((x) => x !== l)
        : [...p.languages, l],
    }));
  }

  function addQual() {
    setQualifications((p) => [...p, { degree: "", institution: "", year: "" }]);
  }

  function updateQual(i: number, k: string, v: string) {
    setQualifications((p) => p.map((q, idx) => (idx === i ? { ...q, [k]: v } : q)));
  }

  function removeQual(i: number) {
    setQualifications((p) => p.filter((_, idx) => idx !== i));
  }

  // ── Save real data ────────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          licenseNumber: form.licenseNumber,
          npiNumber: form.npiNumber,
          experience: form.experience ? Number(form.experience) : undefined,
          hospital: form.hospital,
          department: form.department,
          bio: form.bio,
          consultationFee: form.consultFee ? Number(form.consultFee) : undefined,
          followUpFee: form.followUpFee ? Number(form.followUpFee) : undefined,
          specializations: form.specializations,
          languages: form.languages,
          qualifications,
        }),
      });

      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: "Failed to save" }));
        throw new Error(error || "Failed to save");
      }

      toast.success("Profile saved successfully");
    } catch (err: any) {
      console.error("[DoctorProfilePage] save failed:", err);
      toast.error(err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <DoctorDashboardLayout doctorName="">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
        </div>
      </DoctorDashboardLayout>
    );
  }

  return (
    <DoctorDashboardLayout doctorName={form.name}>
      <div className="page-enter max-w-4xl mx-auto space-y-6 pb-24 lg:pb-8">

        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Profile & Settings</h1>
          <p className="text-sm text-muted mt-0.5">Manage your doctor profile and preferences</p>
        </div>

        <div className="flex gap-6 flex-col lg:flex-row">

          {/* Sidebar tabs */}
          <div className="lg:w-48 flex-shrink-0">
            <div className="glass border border-subtle p-2 space-y-0.5">
              {TABS.map((t) => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={cn("nav-item w-full", tab === t.id && "active")}>
                  <t.icon className="w-4 h-4" />{t.label}
                </button>
              ))}
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
                      <div className="w-20 h-20 rounded-2xl bg-teal-600/30 border border-teal-500/30
                                      flex items-center justify-center font-display font-bold text-3xl text-teal-300">
                        {form.name
                          .split(" ")
                          .map((w) => w[0])
                          .filter(Boolean)
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "DR"}
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-teal-500
                                         flex items-center justify-center">
                        <Camera className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="font-display font-bold text-lg text-primary">{form.name}</h2>
                        <BadgeCheck className="w-4 h-4 text-brand-400" />
                      </div>
                      <p className="text-sm text-muted">{form.email}</p>
                      <span className="badge badge-teal mt-1.5">Verified Doctor</span>
                    </div>
                  </div>
                </div>

                {/* Personal info */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { label: "Full Name", key: "name", type: "text" },
                      { label: "Email", key: "email", type: "email" },
                      { label: "Phone", key: "phone", type: "tel" },
                      { label: "License Number", key: "licenseNumber", type: "text" },
                      { label: "NPI Number", key: "npiNumber", type: "text" },
                      { label: "Years Experience", key: "experience", type: "number" },
                    ].map(({ label, key, type }) => (
                      <div key={key}>
                        <label className="text-xs text-muted font-display block mb-1.5">{label}</label>
                        <input className="input text-sm" type={type}
                          disabled={key === "email"}
                          value={form[key as keyof typeof form] as string}
                          onChange={(e) => update(key, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Practice info */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Practice Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Hospital / Clinic</label>
                      <input className="input text-sm" value={form.hospital}
                        onChange={(e) => update("hospital", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Department</label>
                      <input className="input text-sm" value={form.department}
                        onChange={(e) => update("department", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Consultation Fee ($)</label>
                      <input className="input text-sm" type="number"
                        value={form.consultFee}
                        onChange={(e) => update("consultFee", e.target.value)} />
                    </div>
                    <div>
                      <label className="text-xs text-muted font-display block mb-1.5">Follow-up Fee ($)</label>
                      <input className="input text-sm" type="number"
                        value={form.followUpFee}
                        onChange={(e) => update("followUpFee", e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">Bio</label>
                    <textarea className="input text-sm min-h-[96px] resize-none"
                      value={form.bio}
                      onChange={(e) => update("bio", e.target.value)} />
                  </div>
                </div>

                {/* Specializations */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Specializations</h3>
                  <div className="flex flex-wrap gap-2">
                    {SPECIALTIES.map((s) => (
                      <button key={s} onClick={() => toggleSpec(s)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-display font-medium transition-all",
                          form.specializations.includes(s)
                            ? "border-teal-500/40 bg-teal-500/12 text-teal-300"
                            : "border-subtle text-muted hover:border-teal-500/25"
                        )}>{s}</button>
                    ))}
                  </div>
                </div>

                {/* Languages */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Languages Spoken</h3>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((l) => (
                      <button key={l} onClick={() => toggleLang(l)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl border text-xs font-display font-medium transition-all",
                          form.languages.includes(l)
                            ? "border-brand-500/40 bg-brand-500/12 text-brand-300"
                            : "border-subtle text-muted hover:border-brand-500/25"
                        )}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Qualifications */}
                <div className="glass border border-subtle p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display font-bold text-primary text-sm">Qualifications</h3>
                    <button onClick={addQual}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add
                    </button>
                  </div>
                  <div className="space-y-3">
                    {qualifications.map((q, i) => (
                      <div key={i} className="flex items-center gap-2 flex-wrap">
                        <input className="input text-sm flex-1 min-w-32" placeholder="Degree"
                          value={q.degree} onChange={(e) => updateQual(i, "degree", e.target.value)} />
                        <input className="input text-sm flex-1 min-w-48" placeholder="Institution"
                          value={q.institution} onChange={(e) => updateQual(i, "institution", e.target.value)} />
                        <input className="input text-sm w-20" placeholder="Year" type="number"
                          value={q.year} onChange={(e) => updateQual(i, "year", e.target.value)} />
                        <button onClick={() => removeQual(i)}
                          className="text-rose-400 hover:text-rose-300 transition-colors flex-shrink-0">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="btn-primary flex items-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                           : <><Save className="w-4 h-4" />Save Changes</>}
                </button>
              </>
            )}

            {/* ── Notifications tab ── */}
            {tab === "notif" && (
              <div className="glass border border-subtle p-6 space-y-4">
                <h3 className="font-display font-bold text-primary text-sm">Notification Preferences</h3>
                {[
                  { label: "New Appointment Bookings", desc: "When a patient books a consultation", checked: true },
                  { label: "Appointment Reminders", desc: "15 minutes before each appointment", checked: true },
                  { label: "Patient Messages", desc: "When a patient sends you a message", checked: true },
                  { label: "Lab Result Updates", desc: "When lab results for your patients arrive", checked: true },
                  { label: "Review Notifications", desc: "When a patient leaves a review", checked: false },
                  { label: "Platform Updates", desc: "News and feature announcements", checked: false },
                ].map((n) => (
                  <div key={n.label}
                    className="flex items-center justify-between py-2 border-b border-subtle last:border-0">
                    <div>
                      <p className="text-sm font-display font-semibold text-primary">{n.label}</p>
                      <p className="text-xs text-muted">{n.desc}</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer">
                      <input type="checkbox" defaultChecked={n.checked} className="sr-only peer" />
                      <div className="w-10 h-5 bg-surface-700 rounded-full peer-checked:bg-teal-500
                                      transition-colors after:content-[''] after:absolute after:top-0.5
                                      after:left-0.5 after:w-4 after:h-4 after:rounded-full after:bg-white
                                      after:transition-transform peer-checked:after:translate-x-5" />
                    </label>
                  </div>
                ))}
              </div>
            )}

            {/* ── Security tab ── */}
            {tab === "security" && (
              <div className="space-y-5">
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Change Password</h3>
                  {["Current Password", "New Password", "Confirm New Password"].map((l) => (
                    <div key={l}>
                      <label className="text-xs text-muted font-display block mb-1.5">{l}</label>
                      <input className="input text-sm" type="password" placeholder="••••••••" />
                    </div>
                  ))}
                  <button className="btn-primary text-sm">Update Password</button>
                </div>
                <div className="glass border border-subtle p-6 space-y-3">
                  <h3 className="font-display font-bold text-primary text-sm">Two-Factor Authentication</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-secondary">Authenticator App</p>
                      <p className="text-xs text-muted">Strongly recommended for medical professionals</p>
                    </div>
                    <button className="btn-ghost text-xs py-2 px-4">Enable</button>
                  </div>
                </div>
                <div className="glass border border-rose-500/25 bg-rose-500/5 p-6">
                  <h3 className="font-display font-bold text-rose-400 text-sm mb-3">Danger Zone</h3>
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
                <div className="glass border border-subtle p-6 space-y-3">
                  <h3 className="font-display font-bold text-primary text-sm">Current Plan</h3>
                  <div className="flex items-center justify-between p-4 rounded-xl
                                  bg-teal-500/8 border border-teal-500/25">
                    <div>
                      <p className="font-display font-bold text-primary">VitaConnect Pro</p>
                      <p className="text-xs text-muted">Unlimited consultations · Priority listing · Analytics</p>
                    </div>
                    <span className="badge badge-success">Active</span>
                  </div>
                </div>
                <div className="glass border border-subtle p-6 space-y-4">
                  <h3 className="font-display font-bold text-primary text-sm">Earnings</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "This Month", value: "$2,840" },
                      { label: "Last Month", value: "$3,120" },
                      { label: "Total", value: "$18,450" },
                    ].map((e) => (
                      <div key={e.label} className="text-center p-3 rounded-xl bg-surface-800/40 border border-subtle">
                        <p className="text-lg font-display font-bold text-teal-400">{e.value}</p>
                        <p className="text-xs text-muted mt-0.5">{e.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}