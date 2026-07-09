"use client";

import { useState } from "react";
import { DoctorDashboardLayout } from "@/components/layout/DoctorDasboardLayout";
import { Star, TrendingUp, MessageSquare, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

const REVIEWS = [
  { id:"r1", patient:"Alex J.",  rating:5, date:"Jun 1",  tags:["Professional","Thorough","Helpful"],
    comment:"Dr. reviewed my Health Connect data before the call and had specific recommendations ready. Excellent consultation.",
    response:"Thank you Alex! Looking forward to your next check-in.", responded:true },
  { id:"r2", patient:"Maria S.", rating:5, date:"May 28", tags:["Knowledgeable","Clear explanations"],
    comment:"Very detailed explanation of my diabetes management plan. I finally understand my treatment.",
    response:null, responded:false },
  { id:"r3", patient:"Kwame M.", rating:4, date:"May 20", tags:["Professional","Punctual"],
    comment:"Good consultation. Doctor was on time and addressed all my concerns about hypertension.",
    response:null, responded:false },
  { id:"r4", patient:"Priya N.", rating:5, date:"May 15", tags:["Caring","Helpful","Thorough"],
    comment:"Best post-surgery follow-up experience. Doctor was very thorough and reassuring.",
    response:"Thank you Priya! Wishing you a speedy recovery.", responded:true },
  { id:"r5", patient:"James O.", rating:4, date:"May 10", tags:["Knowledgeable"],
    comment:"Very knowledgeable. Slightly rushed at the end but overall very good.",
    response:null, responded:false },
  { id:"r6", patient:"Amara D.", rating:5, date:"Apr 30", tags:["Professional","Clear explanations","Helpful"],
    comment:"Wonderful doctor. Explained everything in simple terms. Highly recommend.",
    response:null, responded:false },
];

const RATING_DIST = [
  { label:"5★", count:4, color:"#4ade80" },
  { label:"4★", count:2, color:"#60a5fa" },
  { label:"3★", count:0, color:"#fbbf24" },
  { label:"2★", count:0, color:"#fb923c" },
  { label:"1★", count:0, color:"#f87171" },
];

const TAG_COUNTS = REVIEWS.flatMap(r=>r.tags)
  .reduce<Record<string,number>>((acc,t)=>{ acc[t]=(acc[t]??0)+1; return acc; }, {});

export default function ReviewsPage() {
  const [responses, setResponses]   = useState<Record<string,string>>({});
  const [responding,setResponding]  = useState<string|null>(null);

  const avgRating = (REVIEWS.reduce((s,r)=>s+r.rating,0)/REVIEWS.length).toFixed(1);

  function handleRespond(id:string) {
    if (responding === id) setResponding(null);
    else setResponding(id);
  }

  return (
    <DoctorDashboardLayout>
      <div className="page-enter space-y-6 pb-24 lg:pb-8">
        <div>
          <h1 className="text-2xl font-display font-bold text-primary">Reviews</h1>
          <p className="text-sm text-muted mt-0.5">Patient feedback and ratings</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label:"Average Rating", value:avgRating,           sub:"out of 5.0",    color:"text-amber-400", icon:Star   },
            { label:"Total Reviews",  value:String(REVIEWS.length), sub:"verified",   color:"text-brand-400", icon:MessageSquare },
            { label:"Response Rate",  value:"33%",               sub:"2 of 6",        color:"text-teal-400",  icon:ThumbsUp },
            { label:"Recommend",      value:"100%",              sub:"would recommend",color:"text-accent-green",icon:TrendingUp },
          ].map((s) => (
            <div key={s.label} className="glass border border-subtle p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted font-display">{s.label}</span>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className={cn("text-2xl font-display font-bold", s.color)}>{s.value}</p>
              <p className="text-xs text-muted mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: reviews list */}
          <div className="lg:col-span-2 space-y-4">
            {REVIEWS.map((r) => (
              <div key={r.id} className="glass border border-subtle p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-display font-bold text-primary">{r.patient}</p>
                      <div className="flex items-center gap-0.5">
                        {Array.from({length:5}).map((_,i)=>(
                          <Star key={i} className={cn("w-3 h-3",
                            i<r.rating ? "text-amber-400 fill-amber-400" : "text-surface-600"
                          )} />
                        ))}
                      </div>
                      <span className="text-xs text-muted font-mono">{r.date}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {r.tags.map((t)=>(
                        <span key={t} className="badge badge-info text-xs py-0">{t}</span>
                      ))}
                    </div>
                  </div>
                  {!r.responded && (
                    <span className="badge badge-warning text-xs py-0.5 flex-shrink-0">Needs response</span>
                  )}
                </div>

                <p className="text-sm text-secondary italic leading-relaxed">&ldquo;{r.comment}&rdquo;</p>

                {/* Existing response */}
                {r.response && (
                  <div className="p-3 rounded-xl bg-brand-500/8 border border-brand-500/20">
                    <p className="text-xs text-brand-400 font-display font-semibold mb-1">Your response:</p>
                    <p className="text-xs text-secondary">{r.response}</p>
                  </div>
                )}

                {/* Response input */}
                {!r.responded && (
                  <>
                    <button onClick={() => handleRespond(r.id)}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      {responding === r.id ? "Cancel" : "Respond"}
                    </button>
                    {responding === r.id && (
                      <div className="space-y-2">
                        <textarea
                          className="input text-sm min-h-[72px] resize-none"
                          placeholder="Write a professional, empathetic response…"
                          value={responses[r.id] ?? ""}
                          onChange={(e) => setResponses((p)=>({...p,[r.id]:e.target.value}))}
                        />
                        <button className="btn-primary text-xs py-2 px-4">Post Response</button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Right: analytics */}
          <div className="space-y-4">

            {/* Rating distribution */}
            <div className="glass border border-subtle p-5">
              <h3 className="text-sm font-display font-bold text-primary mb-4">Rating Distribution</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-4xl font-display font-bold text-amber-400">{avgRating}</span>
                <div>
                  <div className="flex gap-0.5 mb-1">
                    {Array.from({length:5}).map((_,i)=>(
                      <Star key={i} className={cn("w-4 h-4",
                        i < Math.round(Number(avgRating))
                          ? "text-amber-400 fill-amber-400" : "text-surface-600"
                      )} />
                    ))}
                  </div>
                  <p className="text-xs text-muted">{REVIEWS.length} reviews</p>
                </div>
              </div>
              <div className="space-y-2">
                {RATING_DIST.map((d) => (
                  <div key={d.label} className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted w-5">{d.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-surface-800">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{
                          width:`${REVIEWS.length > 0 ? (d.count/REVIEWS.length)*100 : 0}%`,
                          background: d.color
                        }} />
                    </div>
                    <span className="text-xs text-muted w-3">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top tags */}
            <div className="glass border border-subtle p-5">
              <h3 className="text-sm font-display font-bold text-primary mb-3">Top Feedback Tags</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(TAG_COUNTS)
                  .sort((a,b)=>b[1]-a[1])
                  .map(([tag,count])=>(
                    <span key={tag} className="badge badge-teal text-xs">
                      {tag} ({count})
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DoctorDashboardLayout>
  );
}