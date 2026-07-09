"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import { TestTube2, Plus, Trash2, Loader2, ArrowLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface TestItem { id: string; testCode: string; testName: string; category: string; isStat: boolean; }
interface PatientOption { id: string; name: string; image: string | null; }

const LAB_PANELS = [
  { category:"Metabolic",    tests:[
    { code:"CMP",  name:"Comprehensive Metabolic Panel" },
    { code:"BMP",  name:"Basic Metabolic Panel" },
    { code:"GLUC", name:"Fasting Glucose" },
    { code:"HBA1C",name:"HbA1c (Glycated Hemoglobin)" },
  ]},
  { category:"Lipids",       tests:[
    { code:"LIPID",name:"Lipid Panel (Full)" },
    { code:"LDL",  name:"LDL Cholesterol" },
    { code:"HDL",  name:"HDL Cholesterol" },
    { code:"TG",   name:"Triglycerides" },
  ]},
  { category:"Hematology",   tests:[
    { code:"CBC",  name:"Complete Blood Count (CBC)" },
    { code:"ESR",  name:"Erythrocyte Sedimentation Rate" },
    { code:"CRP",  name:"C-Reactive Protein" },
    { code:"FERR", name:"Ferritin" },
  ]},
  { category:"Thyroid",      tests:[
    { code:"TSH",  name:"Thyroid Stimulating Hormone" },
    { code:"FT4",  name:"Free T4" },
    { code:"FT3",  name:"Free T3" },
  ]},
  { category:"Cardiac",      tests:[
    { code:"TROP", name:"Troponin I" },
    { code:"BNP",  name:"BNP / NT-proBNP" },
    { code:"CK",   name:"Creatine Kinase (CK-MB)" },
    { code:"ECG",  name:"12-Lead ECG" },
  ]},
  { category:"Urinalysis",   tests:[
    { code:"UA",   name:"Urinalysis (Complete)" },
    { code:"UCUL", name:"Urine Culture" },
    { code:"ACR",  name:"Albumin-to-Creatinine Ratio" },
  ]},
];

function newTest(): TestItem {
  return { id: Date.now().toString(), testCode:"", testName:"", category:"Other", isStat:false };
}

function NewLabOrderForm() {
  const sp     = useSearchParams();
  const router = useRouter();
  const preselectedPatientId = sp.get("patientId");

  const [patientId,      setPatientId]      = useState<string | null>(null);
  const [patientQuery,   setPatientQuery]   = useState("");
  const [patientResults, setPatientResults] = useState<PatientOption[]>([]);
  const [searchingPatients, setSearchingPatients] = useState(false);
  const [showResults,    setShowResults]    = useState(false);

  const [priority,      setPriority]      = useState("ROUTINE");
  const [labName,       setLabName]       = useState("");
  const [notes,         setNotes]         = useState("");
  const [tests,         setTests]         = useState<TestItem[]>([]);
  const [loading,       setLoading]       = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  // ── If a patientId came in via the URL (e.g. "Order labs" from a patient's
  // chart), look up their real name instead of assuming who they are ──────────
  useEffect(() => {
    if (!preselectedPatientId) return;
    (async () => {
      try {
        const res = await fetch(`/api/patients?id=${encodeURIComponent(preselectedPatientId)}`);
        if (!res.ok) return;
        const { patients } = await res.json();
        const match = patients?.[0];
        if (match) {
          setPatientId(match.id);
          setPatientQuery(match.name);
        }
      } catch (err) {
        console.error("[NewLabOrderPage] preselected patient lookup failed:", err);
      }
    })();
  }, [preselectedPatientId]);

  // ── Live patient search ──────────────────────────────────────────────────
  useEffect(() => {
    if (!patientQuery.trim() || patientId) {
      setPatientResults([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearchingPatients(true);
      try {
        const res = await fetch(`/api/patients?search=${encodeURIComponent(patientQuery.trim())}`);
        if (!res.ok) throw new Error("Patient search failed");
        const { patients } = await res.json();
        setPatientResults(
          (patients || []).map((p: any) => ({ id: p.id, name: p.name, image: p.image ?? null }))
        );
      } catch (err) {
        console.error("[NewLabOrderPage] patient search failed:", err);
      } finally {
        setSearchingPatients(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [patientQuery, patientId]);

  // Close the results dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function selectPatient(p: PatientOption) {
    setPatientId(p.id);
    setPatientQuery(p.name);
    setPatientResults([]);
    setShowResults(false);
  }

  function clearPatient() {
    setPatientId(null);
    setPatientQuery("");
  }

  function addFromPanel(test: { code:string; name:string }, category: string) {
    if (tests.find((t) => t.testCode === test.code)) {
      setTests((p) => p.filter((t) => t.testCode !== test.code));
    } else {
      setTests((p) => [...p, { id: Date.now().toString(), testCode:test.code, testName:test.name, category, isStat:false }]);
    }
  }

  function addCustomTest() { setTests((p) => [...p, newTest()]); }

  function updateTest(id: string, key: keyof TestItem, value: string | boolean) {
    setTests((p) => p.map((t) => t.id === id ? { ...t, [key]: value } : t));
  }

  function removeTest(id: string) { setTests((p) => p.filter((t) => t.id !== id)); }

  async function handleSubmit() {
    if (!patientId) { toast.error("Select a patient from the search results"); return; }
    if (tests.length === 0) { toast.error("Add at least one test"); return; }
    setLoading(true);
    try {
      // TODO: wire to a real /api/lab-orders endpoint once the LabOrder table
      // schema is confirmed — this still doesn't persist anything yet.
      await new Promise((r) => setTimeout(r, 900));
      toast.success(`Lab order placed for ${tests.length} test(s)`);
      router.push("/doctor-portal/patients");
    } catch {
      toast.error("Failed to place lab order");
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
          <h1 className="text-2xl font-display font-bold text-primary">Order Lab Tests</h1>
          <p className="text-sm text-muted mt-0.5">Submit a diagnostic lab order for your patient</p>
        </div>

        {/* Patient + priority */}
        <div className="glass border border-subtle p-5 space-y-4">
          <h2 className="text-sm font-display font-bold text-primary">Order Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div ref={searchBoxRef} className="relative">
              <label className="text-xs text-muted font-display block mb-1.5">Patient</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
                <input className="input pl-10 text-sm" placeholder="Search patient by name…"
                  value={patientQuery}
                  onFocus={() => setShowResults(true)}
                  onChange={(e) => {
                    setPatientQuery(e.target.value);
                    setPatientId(null); // typing again means the prior selection no longer applies
                    setShowResults(true);
                  }} />
                {patientId && (
                  <button onClick={clearPatient}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted hover:text-secondary">
                    ×
                  </button>
                )}
              </div>

              {showResults && patientQuery.trim() && !patientId && (
                <div className="absolute z-10 mt-1 w-full border border-subtle rounded-xl bg-surface-900 shadow-lg overflow-hidden">
                  {searchingPatients && (
                    <div className="flex justify-center py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-muted" />
                    </div>
                  )}
                  {!searchingPatients && patientResults.length === 0 && (
                    <p className="text-xs text-muted text-center py-3">No patients found.</p>
                  )}
                  {!searchingPatients && patientResults.map((p) => (
                    <button key={p.id} onClick={() => selectPatient(p)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface-800/60 transition-colors">
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-xs text-muted font-display block mb-1.5">Priority</label>
              <select className="input text-sm" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="STAT">STAT (Immediate)</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted font-display block mb-1.5">Preferred Lab (optional)</label>
              <input className="input text-sm" placeholder="e.g. Quest Diagnostics, LabCorp"
                value={labName} onChange={(e) => setLabName(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted font-display block mb-1.5">Clinical Notes</label>
            <textarea className="input text-sm min-h-[64px] resize-none"
              placeholder="Reason for tests, clinical context…"
              value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        {/* Test panels */}
        <div className="glass border border-subtle p-5 space-y-4">
          <h2 className="text-sm font-display font-bold text-primary flex items-center gap-2">
            <TestTube2 className="w-4 h-4 text-teal-400" /> Select Tests
            {tests.length > 0 && (
              <span className="badge badge-teal text-xs">{tests.length} selected</span>
            )}
          </h2>

          <div className="space-y-4">
            {LAB_PANELS.map((panel) => (
              <div key={panel.category}>
                <p className="text-xs font-mono font-bold text-muted uppercase tracking-wider mb-2">
                  {panel.category}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {panel.tests.map((test) => {
                    const selected = tests.some((t) => t.testCode === test.code);
                    return (
                      <button key={test.code} onClick={() => addFromPanel(test, panel.category)}
                        className={cn(
                          "p-2.5 rounded-xl border text-left transition-all duration-200",
                          selected
                            ? "border-teal-500/40 bg-teal-500/12 text-teal-300"
                            : "border-subtle text-muted hover:border-teal-500/25 hover:text-secondary"
                        )}>
                        <p className="text-xs font-mono font-bold">{test.code}</p>
                        <p className="text-xs font-display mt-0.5 truncate">{test.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom tests */}
          <div className="border-t border-subtle pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-display text-muted">Custom / Other Tests</p>
              <button onClick={addCustomTest}
                className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Add Custom
              </button>
            </div>
            {tests.filter((t) => t.category === "Other").map((test) => (
              <div key={test.id} className="flex items-center gap-2 mb-2">
                <input className="input text-sm flex-1" placeholder="Test name"
                  value={test.testName}
                  onChange={(e) => updateTest(test.id, "testName", e.target.value)} />
                <input className="input text-sm w-24" placeholder="Code"
                  value={test.testCode}
                  onChange={(e) => updateTest(test.id, "testCode", e.target.value)} />
                <button onClick={() => removeTest(test.id)} className="text-rose-400 hover:text-rose-300">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Selected summary */}
        {tests.length > 0 && (
          <div className="glass border border-teal-500/25 bg-teal-500/5 p-4">
            <p className="text-xs font-display font-bold text-teal-400 mb-2">Order Summary</p>
            <div className="flex flex-wrap gap-1.5">
              {tests.map((t) => (
                <span key={t.id} className="badge badge-teal text-xs flex items-center gap-1">
                  {t.testCode || t.testName}
                  <button onClick={() => removeTest(t.id)} className="hover:text-rose-300 ml-0.5">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn-ghost">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Placing Order…" : `Place Order (${tests.length} test${tests.length !== 1 ? "s" : ""})`}
          </button>
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}

export default function NewLabOrderPage() {
  return (
    <Suspense fallback={
      <DoctorDashboardLayout>
        <div className="flex justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
        </div>
      </DoctorDashboardLayout>
    }>
      <NewLabOrderForm />
    </Suspense>
  );
}