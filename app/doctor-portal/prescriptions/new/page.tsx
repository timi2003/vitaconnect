"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import { Pill, Plus, Trash2, Loader2, ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface MedItem {
  id:           string;
  medicationName:string;
  dosage:       string;
  form:         string;
  frequency:    string;
  duration:     string;
  quantity:     number;
  instructions: string;
  isChronic:    boolean;
}

const COMMON_MEDS = [
  "Lisinopril","Metformin","Amlodipine","Atorvastatin","Omeprazole",
  "Levothyroxine","Aspirin","Metoprolol","Losartan","Albuterol",
  "Amoxicillin","Ibuprofen","Paracetamol","Azithromycin","Cetirizine",
];

const FREQ_OPTIONS = [
  "Once daily","Twice daily","Three times daily","Four times daily",
  "Every 6 hours","Every 8 hours","Every 12 hours","As needed","At bedtime",
];

const FORM_OPTIONS = ["Tablet","Capsule","Liquid","Injection","Inhaler","Cream","Patch","Drops"];

function newMed(): MedItem {
  return {
    id:            Date.now().toString(),
    medicationName:"",
    dosage:        "",
    form:          "Tablet",
    frequency:     "Once daily",
    duration:      "30 days",
    quantity:      30,
    instructions:  "",
    isChronic:     false,
  };
}

export default function NewPrescriptionPage() {
  const sp     = useSearchParams();
  const router = useRouter();

  const [patientSearch, setPatientSearch] = useState(sp.get("patientId") ? "Alex Johnson" : "");
  const [diagnosis,     setDiagnosis]     = useState("");
  const [notes,         setNotes]         = useState("");
  const [refills,       setRefills]       = useState(0);
  const [meds,          setMeds]          = useState<MedItem[]>([newMed()]);
  const [loading,       setLoading]       = useState(false);

  function updateMed(id: string, key: keyof MedItem, value: string | number | boolean) {
    setMeds((prev) => prev.map((m) => m.id === id ? { ...m, [key]: value } : m));
  }

  function addMed() { setMeds((prev) => [...prev, newMed()]); }

  function removeMed(id: string) {
    if (meds.length === 1) return;
    setMeds((prev) => prev.filter((m) => m.id !== id));
  }

  async function handleSubmit() {
    const invalid = meds.find((m) => !m.medicationName || !m.dosage);
    if (invalid) { toast.error("Fill in medication name and dosage for all items"); return; }
    if (!patientSearch) { toast.error("Select a patient"); return; }

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000)); // replace with real API call
      toast.success("Prescription issued successfully");
      router.push("/doctor-portal/patients");
    } catch {
      toast.error("Failed to issue prescription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DoctorDashboardLayout>
      <div className="page-enter max-w-3xl mx-auto space-y-5 pb-24 lg:pb-8">

        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-muted hover:text-primary transition-colors font-display">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Issue Prescription</h1>
          <p className="text-sm text-muted mt-0.5">Create a digital prescription for your patient</p>
        </div>

        {/* Patient */}
        <div className="glass border border-subtle p-5 space-y-4">
          <h2 className="text-sm font-display font-bold text-primary">Patient</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input className="input pl-10 text-sm" placeholder="Search patient name…"
              value={patientSearch} onChange={(e) => setPatientSearch(e.target.value)} />
          </div>
          {patientSearch && (
            <div className="p-3 rounded-xl bg-surface-800/40 border border-subtle flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-600/30 text-brand-300 border border-white/10
                              flex items-center justify-center font-display font-bold text-xs">
                {patientSearch.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-display font-semibold text-primary">{patientSearch}</p>
                <p className="text-xs text-muted">Patient confirmed</p>
              </div>
            </div>
          )}
        </div>

        {/* Diagnosis */}
        <div className="glass border border-subtle p-5 space-y-3">
          <h2 className="text-sm font-display font-bold text-primary">Diagnosis & Notes</h2>
          <div>
            <label className="text-xs text-muted font-display block mb-1.5">Diagnosis</label>
            <input className="input text-sm" placeholder="e.g. Hypertension, Type 2 Diabetes"
              value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-muted font-display block mb-1.5">Notes (optional)</label>
            <textarea className="input text-sm min-h-[72px] resize-none"
              placeholder="Additional instructions for the patient or pharmacist…"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted font-display">Refills allowed</label>
            <select className="input w-24 text-sm"
              value={refills} onChange={(e) => setRefills(Number(e.target.value))}>
              {[0,1,2,3,5,11].map((n) => (
                <option key={n} value={n}>{n === 11 ? "PRN" : n}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Medications */}
        <div className="glass border border-subtle p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-display font-bold text-primary flex items-center gap-2">
              <Pill className="w-4 h-4 text-violet-400" /> Medications
            </h2>
            <button onClick={addMed}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add Medication
            </button>
          </div>

          <div className="space-y-4">
            {meds.map((med, idx) => (
              <div key={med.id}
                className="p-4 rounded-xl border border-subtle bg-surface-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted">Medication {idx + 1}</span>
                  {meds.length > 1 && (
                    <button onClick={() => removeMed(med.id)}
                      className="text-rose-400 hover:text-rose-300 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Name with suggestions */}
                <div>
                  <label className="text-xs text-muted font-display block mb-1.5">
                    Medication Name <span className="text-accent-coral">*</span>
                  </label>
                  <input className="input text-sm" list={`meds-${med.id}`}
                    placeholder="e.g. Lisinopril"
                    value={med.medicationName}
                    onChange={(e) => updateMed(med.id, "medicationName", e.target.value)} />
                  <datalist id={`meds-${med.id}`}>
                    {COMMON_MEDS.map((m) => <option key={m} value={m} />)}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">
                      Dosage <span className="text-accent-coral">*</span>
                    </label>
                    <input className="input text-sm" placeholder="e.g. 10mg"
                      value={med.dosage}
                      onChange={(e) => updateMed(med.id, "dosage", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">Form</label>
                    <select className="input text-sm" value={med.form}
                      onChange={(e) => updateMed(med.id, "form", e.target.value)}>
                      {FORM_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">Frequency</label>
                    <select className="input text-sm" value={med.frequency}
                      onChange={(e) => updateMed(med.id, "frequency", e.target.value)}>
                      {FREQ_OPTIONS.map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">Duration</label>
                    <input className="input text-sm" placeholder="e.g. 30 days"
                      value={med.duration}
                      onChange={(e) => updateMed(med.id, "duration", e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-muted font-display block mb-1.5">Quantity</label>
                    <input className="input text-sm" type="number" min={1}
                      value={med.quantity}
                      onChange={(e) => updateMed(med.id, "quantity", Number(e.target.value))} />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={med.isChronic}
                        onChange={(e) => updateMed(med.id, "isChronic", e.target.checked)}
                        className="sr-only peer" />
                      <div className="w-8 h-4 bg-surface-700 rounded-full peer-checked:bg-brand-500
                                      transition-colors after:content-[''] after:absolute after:top-0.5
                                      after:left-0.5 after:w-3 after:h-3 after:bg-white after:rounded-full
                                      after:transition-transform peer-checked:after:translate-x-4 relative" />
                      <span className="text-xs text-muted font-display">Chronic</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted font-display block mb-1.5">Instructions</label>
                  <input className="input text-sm" placeholder="e.g. Take with food, avoid alcohol…"
                    value={med.instructions}
                    onChange={(e) => updateMed(med.id, "instructions", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Issuing…" : "Issue Prescription"}
          </button>
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}