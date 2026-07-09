"use client";

import { useState } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import { Clock, Plus, Trash2, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const TIMES = ["07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00",
               "11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30",
               "16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00"];

interface Slot { id:string; dayOfWeek:number; startTime:string; endTime:string; slotDuration:number; isAvailable:boolean; }

const DEFAULT_SLOTS: Slot[] = [
  { id:"s1", dayOfWeek:1, startTime:"09:00", endTime:"17:00", slotDuration:30, isAvailable:true },
  { id:"s2", dayOfWeek:2, startTime:"09:00", endTime:"17:00", slotDuration:30, isAvailable:true },
  { id:"s3", dayOfWeek:3, startTime:"09:00", endTime:"13:00", slotDuration:30, isAvailable:true },
  { id:"s4", dayOfWeek:4, startTime:"09:00", endTime:"17:00", slotDuration:30, isAvailable:true },
  { id:"s5", dayOfWeek:5, startTime:"09:00", endTime:"15:00", slotDuration:30, isAvailable:true },
];

export default function AvailabilityPage() {
  const [slots,       setSlots]       = useState<Slot[]>(DEFAULT_SLOTS);
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [consultFee,  setConsultFee]  = useState("75");
  const [followUpFee, setFollowUpFee] = useState("45");
  const [slotDuration,setSlotDuration]= useState("30");

  function addSlot() {
    setSlots((p) => [...p, {
      id: Date.now().toString(), dayOfWeek:1,
      startTime:"09:00", endTime:"17:00", slotDuration:30, isAvailable:true,
    }]);
  }

  function removeSlot(id:string) { setSlots((p) => p.filter((s) => s.id !== id)); }

  function updateSlot(id:string, key:keyof Slot, value:string|number|boolean) {
    setSlots((p) => p.map((s) => s.id === id ? { ...s, [key]: value } : s));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    toast.success("Availability saved successfully");
  }

  // Compute total slots per week
  const totalWeeklySlots = slots
    .filter((s) => s.isAvailable)
    .reduce((sum, s) => {
      const [sh,sm] = s.startTime.split(":").map(Number);
      const [eh,em] = s.endTime.split(":").map(Number);
      const mins = (eh*60+em) - (sh*60+sm);
      return sum + Math.floor(mins / Number(slotDuration));
    }, 0);

  return (
    <DoctorDashboardLayout>
      <div className="page-enter max-w-3xl mx-auto space-y-6 pb-24 lg:pb-8">

        <div>
          <h1 className="text-2xl font-display font-bold text-primary">My Schedule</h1>
          <p className="text-sm text-muted mt-0.5">Set your availability and consultation fees</p>
        </div>

        {/* Global toggle */}
        <div className={cn(
          "glass border p-5 flex items-center justify-between",
          isAvailable ? "border-teal-500/30 bg-teal-500/5" : "border-subtle"
        )}>
          <div>
            <p className="font-display font-semibold text-primary">
              {isAvailable ? "You are currently available" : "You are currently offline"}
            </p>
            <p className="text-sm text-muted mt-0.5">
              {isAvailable
                ? "Patients can book appointments and see you as available"
                : "You won't appear as available to patients"}
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer flex-shrink-0">
            <input type="checkbox" checked={isAvailable}
              onChange={() => setIsAvailable(!isAvailable)} className="sr-only peer" />
            <div className="w-12 h-6 bg-surface-700 rounded-full peer-checked:bg-teal-500
                            transition-colors duration-200
                            after:content-[''] after:absolute after:top-0.5 after:left-0.5
                            after:w-5 after:h-5 after:rounded-full after:bg-white
                            after:transition-transform after:duration-200
                            peer-checked:after:translate-x-6" />
          </label>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Weekly Slots",    value:String(totalWeeklySlots), color:"text-brand-400"  },
            { label:"Active Days",     value:String(slots.filter(s=>s.isAvailable).length), color:"text-teal-400" },
            { label:"Slot Duration",   value:`${slotDuration}m`,       color:"text-violet-400" },
          ].map((s) => (
            <div key={s.label} className="glass border border-subtle p-4 text-center">
              <p className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted font-display mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Fees */}
        <div className="glass border border-subtle p-5 space-y-4">
          <h2 className="text-sm font-display font-bold text-primary">Consultation Fees</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-muted font-display block mb-1.5">First Consultation ($)</label>
              <input className="input text-sm" type="number" min={0}
                value={consultFee} onChange={(e) => setConsultFee(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted font-display block mb-1.5">Follow-up Fee ($)</label>
              <input className="input text-sm" type="number" min={0}
                value={followUpFee} onChange={(e) => setFollowUpFee(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted font-display block mb-1.5">Slot Duration (min)</label>
              <select className="input text-sm" value={slotDuration}
                onChange={(e) => setSlotDuration(e.target.value)}>
                {[15,20,30,45,60].map((d) => (
                  <option key={d} value={d}>{d} minutes</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Weekly schedule */}
        <div className="glass border border-subtle p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" /> Weekly Schedule
            </h2>
            <button onClick={addSlot}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Day
            </button>
          </div>

          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.id}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-xl border flex-wrap",
                  slot.isAvailable ? "border-brand-500/20 bg-brand-500/5" : "border-subtle opacity-60"
                )}>
                {/* Toggle */}
                <label className="relative inline-flex cursor-pointer flex-shrink-0">
                  <input type="checkbox" checked={slot.isAvailable}
                    onChange={(e) => updateSlot(slot.id, "isAvailable", e.target.checked)}
                    className="sr-only peer" />
                  <div className="w-8 h-4 bg-surface-700 rounded-full peer-checked:bg-brand-500
                                  transition-colors after:content-[''] after:absolute after:top-0.5
                                  after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full
                                  after:transition-transform peer-checked:after:translate-x-4" />
                </label>

                {/* Day */}
                <select className="input text-xs w-32 py-2"
                  value={slot.dayOfWeek}
                  onChange={(e) => updateSlot(slot.id, "dayOfWeek", Number(e.target.value))}>
                  {DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>

                {/* Times */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <select className="input text-xs py-2 flex-1"
                    value={slot.startTime}
                    onChange={(e) => updateSlot(slot.id, "startTime", e.target.value)}>
                    {TIMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <span className="text-xs text-muted flex-shrink-0">to</span>
                  <select className="input text-xs py-2 flex-1"
                    value={slot.endTime}
                    onChange={(e) => updateSlot(slot.id, "endTime", e.target.value)}>
                    {TIMES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>

                {/* Delete */}
                <button onClick={() => removeSlot(slot.id)}
                  className="text-rose-400 hover:text-rose-300 transition-colors flex-shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2">
          {saving ? <><Clock className="w-4 h-4 animate-spin" /> Saving…</>
                  : <><Save className="w-4 h-4" /> Save Availability</>}
        </button>
      </div>
    </DoctorDashboardLayout>
  );
}