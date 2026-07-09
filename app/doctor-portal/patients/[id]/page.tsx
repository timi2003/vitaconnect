"use client";

import { useParams, useRouter } from "next/navigation";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import {
  ArrowLeft, Video, MessageSquare, Pill, TestTube2,
  Heart, Activity, Wind, Scale, Moon, Droplets,
  Calendar, FileText, AlertTriangle, BadgeCheck, Clock,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";

const MOCK_PATIENT = {
  id: "p1", name: "Alex Johnson", avatar: "AJ", avatarBg: "bg-brand-600/30 text-brand-300",
  age: 35, gender: "Male", bloodType: "O+", weight: "73.2 kg", height: "178 cm",
  phone: "+1-555-0100", email: "alex@email.com",
  insurance: "BlueCross BC-8829-AJ",
  allergies: ["Penicillin", "Shellfish"],
  conditions: ["Hypertension", "Prediabetes"],
  emergencyContact: "Jamie Johnson — Spouse — +1-555-0200",
  risk: "medium",
  lastVisit: "Today, 2:30 PM",
  nextVisit: "Jun 15, 10:00 AM",
  vitals: {
    bp: "128/84", bpTrend: [125,130,128,132,126,128,130,128,129,128,130,128],
    hr: 74,       hrTrend:  [72, 75, 73, 78, 71, 74, 76, 73, 75, 74, 72, 74],
    o2: 98,       o2Trend:  [97, 98, 98, 97, 99, 98, 98, 97, 98, 99, 98, 98],
    glucose: 94,  glucoseTrend:[100,98,96,99,94,97,95,94,96,94,95,94],
  },
  recentPrescriptions: [
    { name:"Lisinopril 10mg",  freq:"Once daily",  status:"ACTIVE" },
    { name:"Metformin 500mg",  freq:"Twice daily",  status:"ACTIVE" },
  ],
  recentLabResults: [
    { name:"HbA1c",          value:"6.2%",    date:"Jun 1",  flag:null },
    { name:"LDL Cholesterol",value:"138 mg/dL",date:"Jun 1", flag:"H"  },
    { name:"Fasting Glucose",value:"94 mg/dL", date:"Jun 1", flag:null },
  ],
  notes: [
    { date:"Today",  text:"Patient reports occasional dizziness when standing. BP trending slightly elevated. Adjusted Lisinopril dose." },
    { date:"May 28", text:"Follow-up on Metformin. No GI side effects reported. HbA1c improved from 6.8 to 6.2." },
  ],
};

const MiniChart = ({ data, color }: { data: number[]; color: string }) => (
  <ResponsiveContainer width="100%" height={48}>
    <AreaChart data={data.map((v,i)=>({i,v}))}>
      <defs>
        <linearGradient id={`g${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%"  stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
        fill={`url(#g${color.replace("#","")})`} dot={false} />
    </AreaChart>
  </ResponsiveContainer>
);

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const p = MOCK_PATIENT;

  return (
    <DoctorDashboardLayout>
      <div className="page-enter space-y-5 pb-24 lg:pb-8 max-w-5xl mx-auto">

        {/* Back */}
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors font-display">
          <ArrowLeft className="w-4 h-4" /> Back to patients
        </button>

        {/* Header */}
        <div className="glass border border-subtle p-5">
          <div className="flex items-start gap-5 flex-wrap">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-xl",
              "border border-white/10 flex-shrink-0", p.avatarBg
            )}>{p.avatar}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-display font-bold text-primary">{p.name}</h1>
                <BadgeCheck className="w-4 h-4 text-brand-400" />
                <span className="badge badge-warning text-xs">{p.risk} risk</span>
              </div>
              <p className="text-sm text-muted">{p.age}y · {p.gender} · Blood type: {p.bloodType}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                <span className="text-xs text-secondary">{p.email}</span>
                <span className="text-xs text-secondary">{p.phone}</span>
                <span className="text-xs text-secondary">{p.insurance}</span>
              </div>
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {p.conditions.map((c) => <span key={c} className="badge badge-info text-xs">{c}</span>)}
                {p.allergies.map((a) => <span key={a} className="badge badge-danger text-xs">⚠ {a}</span>)}
              </div>
            </div>

            <div className="flex flex-col gap-2 flex-shrink-0">
              <Link href={`/video?room=${p.id}`} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> Start Video
              </Link>
              <Link href={`/doctor-portal/messages?patientId=${p.id}`}
                className="btn-ghost text-xs py-2 px-4 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Message
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left — vitals + history */}
          <div className="lg:col-span-2 space-y-5">

            {/* Vital signs */}
            <div className="glass border border-subtle p-5">
              <h2 className="text-sm font-display font-bold text-primary mb-4 flex items-center gap-2">
                <Activity className="w-4 h-4 text-brand-400" /> Latest Vital Signs
                <span className="text-xs text-muted font-normal ml-1">(from Health Connect)</span>
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label:"Blood Pressure", value:p.vitals.bp,      unit:"mmHg", color:"#60a5fa", data:p.vitals.bpTrend,      icon:Activity, warn:false  },
                  { label:"Heart Rate",     value:p.vitals.hr,       unit:"bpm",  color:"#f87171", data:p.vitals.hrTrend,      icon:Heart,    warn:false  },
                  { label:"SpO2",           value:p.vitals.o2,       unit:"%",    color:"#2dd4bf", data:p.vitals.o2Trend,      icon:Wind,     warn:false  },
                  { label:"Blood Glucose",  value:p.vitals.glucose,  unit:"mg/dL",color:"#fbbf24", data:p.vitals.glucoseTrend, icon:Droplets, warn:false  },
                ].map((v) => (
                  <div key={v.label} className="glass border border-subtle p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted font-display">{v.label}</span>
                      <v.icon className="w-3.5 h-3.5" style={{ color: v.color }} />
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-xl font-display font-bold text-primary">{v.value}</span>
                      <span className="text-xs text-muted font-mono">{v.unit}</span>
                    </div>
                    <MiniChart data={v.data} color={v.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor notes */}
            <div className="glass border border-subtle p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-display font-bold text-primary flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-400" /> Consultation Notes
                </h2>
                <button className="btn-primary text-xs py-1.5 px-3">Add Note</button>
              </div>
              <div className="space-y-3">
                {p.notes.map((n, i) => (
                  <div key={i} className="p-3 rounded-xl bg-surface-800/40 border border-subtle">
                    <p className="text-xs text-muted font-mono mb-1.5">{n.date}</p>
                    <p className="text-sm text-secondary leading-relaxed">{n.text}</p>
                  </div>
                ))}
              </div>
              <textarea className="input mt-3 min-h-[80px] resize-none text-sm"
                placeholder="Add consultation note…" />
              <button className="btn-primary text-sm mt-2">Save Note</button>
            </div>

            {/* Recent lab results */}
            <div className="glass border border-subtle p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-display font-bold text-primary flex items-center gap-2">
                  <TestTube2 className="w-4 h-4 text-teal-400" /> Recent Lab Results
                </h2>
                <Link href={`/doctor-portal/lab-orders/new?patientId=${p.id}`}
                  className="btn-ghost text-xs py-1.5 px-3">Order Tests</Link>
              </div>
              <div className="divide-y divide-subtle">
                {p.recentLabResults.map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-secondary font-display">{r.name}</span>
                    <span className="text-xs text-muted font-mono">{r.date}</span>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        r.flag === "H" ? "text-amber-400" : r.flag === "L" ? "text-rose-400" : "text-primary"
                      )}>{r.value}</span>
                      {r.flag && <span className="badge badge-warning text-xs py-0">{r.flag}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — quick actions + prescriptions */}
          <div className="space-y-4">

            {/* Visit info */}
            <div className="glass border border-subtle p-4 space-y-3">
              <h3 className="text-xs font-display font-bold text-muted uppercase tracking-wider">Visit Info</h3>
              {[
                { label:"Last Visit",   value:p.lastVisit,  icon:Calendar },
                { label:"Next Visit",   value:p.nextVisit,  icon:Calendar },
                { label:"Height",       value:p.height,     icon:Scale    },
                { label:"Weight",       value:p.weight,     icon:Scale    },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-muted font-display flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />{label}
                  </span>
                  <span className="text-xs font-semibold text-primary">{value}</span>
                </div>
              ))}
            </div>

            {/* Active prescriptions */}
            <div className="glass border border-subtle p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-display font-bold text-muted uppercase tracking-wider">
                  Active Prescriptions
                </h3>
                <Link href={`/doctor-portal/prescriptions/new?patientId=${p.id}`}
                  className="text-xs text-brand-400 hover:text-brand-300">+ New</Link>
              </div>
              <div className="space-y-2">
                {p.recentPrescriptions.map((rx, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-surface-800/40 border border-subtle">
                    <Pill className="w-4 h-4 text-violet-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-display font-semibold text-primary truncate">{rx.name}</p>
                      <p className="text-xs text-muted">{rx.freq}</p>
                    </div>
                    <span className="badge badge-success text-xs py-0">Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency contact */}
            <div className="glass border border-amber-500/25 bg-amber-500/5 p-4">
              <h3 className="text-xs font-display font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> Emergency Contact
              </h3>
              <p className="text-xs text-secondary">{p.emergencyContact}</p>
            </div>

            {/* Quick actions */}
            <div className="glass border border-subtle p-4 space-y-2">
              <h3 className="text-xs font-display font-bold text-muted uppercase tracking-wider mb-3">
                Quick Actions
              </h3>
              {[
                { label:"Issue Prescription", href:`/doctor-portal/prescriptions/new?patientId=${p.id}`, icon:Pill,      color:"text-violet-400" },
                { label:"Order Lab Tests",    href:`/doctor-portal/lab-orders/new?patientId=${p.id}`,    icon:TestTube2, color:"text-teal-400"   },
                { label:"View Full Records",  href:`/doctor-portal/medical-records?patientId=${p.id}`,   icon:FileText,  color:"text-brand-400"  },
                { label:"Schedule Follow-up", href:`/doctor-portal/appointments`,                         icon:Calendar,  color:"text-amber-400"  },
              ].map((a) => (
                <Link key={a.label} href={a.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-subtle
                             hover:border-brand-500/25 hover:bg-surface-800/30 transition-all duration-200">
                  <a.icon className={cn("w-4 h-4 flex-shrink-0", a.color)} />
                  <span className="text-xs font-display font-medium text-secondary">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}