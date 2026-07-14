import Link from "next/link";
import {
  Heart, Shield, Zap, Video, Activity, Smartphone,
  ArrowRight, Star, CheckCircle2, Globe2, Lock, RefreshCw, Menu,
} from "lucide-react";

const FEATURES = [
  {
    icon: Video,
    title: "Instant Video Consults",
    desc: "Connect with board-certified doctors in under 2 minutes, 24/7.",
    color: "brand",
  },
  {
    icon: Activity,
    title: "Real-Time Health Sync",
    desc: "Automatic sync from Health Connect — wearables, glucometers, BP monitors.",
    color: "teal",
  },
  {
    icon: Shield,
    title: "HIPAA-Compliant",
    desc: "End-to-end encrypted consultations and medical records. Your data is yours.",
    color: "purple",
  },
  {
    icon: Smartphone,
    title: "Works Offline",
    desc: "PWA + TWA architecture. Access your health records even without internet.",
    color: "amber",
  },
  {
    icon: RefreshCw,
    title: "Smart Health Alerts",
    desc: "AI-powered anomaly detection flags abnormal readings and notifies your doctor.",
    color: "coral",
  },
  {
    icon: Globe2,
    title: "300+ Specialists",
    desc: "Cardiologists, endocrinologists, GPs, dermatologists and more.",
    color: "green",
  },
];

const STATS = [
  { label: "Active Patients",  value: "120K+"  },
  { label: "Verified Doctors", value: "2,400+" },
  { label: "Consultations",    value: "1.8M+"  },
  { label: "Avg. Wait Time",   value: "<2 min" },
];

const COLOR_MAP: Record<string, { icon: string; border: string; bg: string }> = {
  brand:  { icon: "text-brand-400",   border: "border-brand-500/25",   bg: "bg-brand-500/10"  },
  teal:   { icon: "text-teal-400",    border: "border-teal-500/25",    bg: "bg-teal-500/10"   },
  purple: { icon: "text-violet-400",  border: "border-violet-500/25",  bg: "bg-violet-500/10" },
  amber:  { icon: "text-amber-400",   border: "border-amber-500/25",   bg: "bg-amber-500/10"  },
  coral:  { icon: "text-rose-400",    border: "border-rose-500/25",    bg: "bg-rose-500/10"   },
  green:  { icon: "text-emerald-400", border: "border-emerald-500/25", bg: "bg-emerald-500/10"},
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-950 bg-grid text-primary">

      {/* Noise overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Ambient glows */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-brand-500/15 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-64 rounded-full bg-teal-500/8 blur-3xl" />
      </div>

      {/* ── Nav ── */}
      <header
        className="relative z-10 border-b border-subtle"
        style={{ background: "rgba(10,15,30,0.7)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center shadow-glow-sm">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-lg">VitaConnect</span>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {["Features", "Doctors", "Pricing", "About"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-secondary hover:text-primary transition-colors font-display"
              >
                {item}
              </a>
            ))}
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/auth/login" className="btn-ghost text-sm py-2 px-3 sm:px-4">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-3 sm:px-4">
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Join</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full
                        bg-brand-500/10 border border-brand-500/25 text-brand-400
                        text-xs sm:text-sm font-display font-medium mb-6 sm:mb-8 animate-fade-in">
          <Zap className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
          Now with Health Connect integration
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-7xl font-display font-extrabold leading-tight mb-5 sm:mb-6
                       tracking-tight animate-slide-up px-2">
          Healthcare that{" "}
          <span className="text-gradient">knows</span>
          <br className="hidden sm:block" />
          {" "}your body
        </h1>

        <p
          className="max-w-xl sm:max-w-2xl mx-auto text-base sm:text-lg text-secondary font-body
                     leading-relaxed mb-8 sm:mb-10 animate-slide-up px-2"
          style={{ animationDelay: "0.1s" }}
        >
          VitaConnect syncs your wearable health data via Android Health Connect,
          connects you with specialist doctors in minutes, and keeps your entire medical
          history in one secure place.
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4
                     mb-12 sm:mb-16 animate-slide-up px-4"
          style={{ animationDelay: "0.2s" }}
        >
          <Link
            href="/auth/register"
            className="btn-primary w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-base
                       flex items-center justify-center gap-2"
          >
            Start for Free
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/demo"
            className="btn-ghost w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-base
                       flex items-center justify-center gap-2"
          >
            <Video className="w-4 h-4" />
            Watch Demo
          </Link>
        </div>

        {/* Stats — 2 cols on mobile, 4 on md+ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-3xl mx-auto px-2">
          {STATS.map((s) => (
            <div key={s.label} className="glass p-3 sm:p-4 text-center">
              <p className="text-xl sm:text-2xl font-display font-bold text-gradient">{s.value}</p>
              <p className="text-xs text-muted mt-1 font-display leading-snug">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-10 sm:mb-14 px-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 sm:mb-4">
            Everything you need,{" "}
            <span className="text-gradient-warm">connected</span>
          </h2>
          <p className="text-secondary max-w-xl mx-auto text-sm sm:text-base">
            A complete telemedicine platform built for Android with Health Connect at its core.
          </p>
        </div>

        {/* 1 col mobile → 2 col tablet → 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f) => {
            const c = COLOR_MAP[f.color];
            return (
              <div
                key={f.title}
                className={`metric-card p-5 sm:p-6 border ${c.border}`}
              >
                <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl ${c.bg} border ${c.border}
                                 flex items-center justify-center mb-3 sm:mb-4`}>
                  <f.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${c.icon}`} />
                </div>
                <h3 className="font-display font-bold text-primary mb-1.5 sm:mb-2 text-sm sm:text-base">
                  {f.title}
                </h3>
                <p className="text-xs sm:text-sm text-secondary leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Health Connect CTA ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="glass-strong p-6 sm:p-8 md:p-12 border border-brand-500/25 relative
                        overflow-hidden rounded-3xl text-center">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 to-teal-500/5" />
          <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-brand-500/15 blur-3xl" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full
                            bg-teal-500/10 border border-teal-500/25 text-teal-400
                            text-xs sm:text-sm font-display font-medium mb-5 sm:mb-6">
              <Activity className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              Android Health Connect
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold mb-3 sm:mb-4">
              Your wearables, finally{" "}
              <span className="text-gradient">useful</span>
            </h2>
            <p className="text-secondary max-w-xl mx-auto mb-6 sm:mb-8 text-sm sm:text-base">
              Automatically sync heart rate, blood pressure, sleep data, glucose readings
              and more from any Health Connect-compatible device directly to your care team.
            </p>

            {/* Health tags — wrap naturally on small screens */}
            <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 px-2">
              {["❤️ Heart Rate", "🩸 Blood Pressure", "💤 Sleep", "👟 Steps",
                "🌡️ Temperature", "🫁 SpO2", "🍬 Glucose", "⚖️ Weight"].map((tag) => (
                <span key={tag} className="badge badge-info text-xs">{tag}</span>
              ))}
            </div>

            <Link
              href="/auth/register"
              className="btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base
                         inline-flex items-center justify-center gap-2"
            >
              Connect Health Data
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Social proof ── */}
      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-center mb-8 sm:mb-10">
          Trusted by patients worldwide
        </h2>

        {/* 1 col mobile → 3 col md+ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {[
            {
              name: "Amara N.", role: "Diabetes patient",
              quote: "My glucometer syncs automatically. My doctor sees my trends before I even describe them.",
              rating: 5,
            },
            {
              name: "James K.", role: "Hypertension",
              quote: "I can see my BP trends over weeks and share them with my cardiologist in one tap.",
              rating: 5,
            },
            {
              name: "Fatima O.", role: "Post-surgery follow-up",
              quote: "Video consults from home saved me 3 trips to the hospital. The records feature is incredible.",
              rating: 5,
            },
          ].map((r) => (
            <div key={r.name} className="glass p-5 sm:p-6 border border-subtle">
              <div className="flex gap-0.5 mb-3 sm:mb-4">
                {Array.from({ length: r.rating }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-secondary leading-relaxed mb-3 sm:mb-4 italic">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div>
                <p className="text-sm font-display font-semibold text-primary">{r.name}</p>
                <p className="text-xs text-muted">{r.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-subtle mt-4 sm:mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10
                        flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" fill="white" />
            </div>
            <span className="font-display font-bold text-sm">VitaConnect</span>
          </div>
          <p className="text-xs text-muted font-display text-center">
            © {new Date().getFullYear()} VitaConnect Health Technologies. HIPAA compliant.
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            End-to-end encrypted
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-2 flex-shrink-0" />
            SOC 2 Type II
          </div>
        </div>
      </footer>
    </div>
  );
}