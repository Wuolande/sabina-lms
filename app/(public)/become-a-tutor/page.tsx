"use client";

import * as React from "react";
import Link from "next/link";
import {
  DollarSign,
  Clock,
  Globe,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";

export default function BecomeATutorPage() {
  const [hourlyRate, setHourlyRate] = React.useState<number>(45);
  const [hoursPerWeek, setHoursPerWeek] = React.useState<number>(15);

  const monthlyGross = hourlyRate * hoursPerWeek * 4.33;
  const platformFee = monthlyGross * 0.18; // 18% fee
  const monthlyNet = monthlyGross - platformFee;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <Badge variant="secondary" size="sm" className="bg-accent-400 text-slate-950 font-bold">
          Join 250+ Certified Mentors
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          Teach global students on your terms.
        </h1>
        <p className="text-base text-slate-600">
          Set your own hourly rate, build your professional brand, teach through our live browser classroom, and enjoy automated bi-weekly payouts.
        </p>

        <div className="pt-4">
          <Link href="/register?role=TUTOR">
            <Button variant="default" size="xl" className="font-extrabold bg-brand-700 hover:bg-brand-800 px-8 shadow-elevation">
              Start Tutor Application (Free)
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Earnings Calculator */}
      <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 to-brand-950 text-white p-8 sm:p-12 shadow-elevation">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-accent-400">
              Interactive Calculator
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              Estimate your monthly teaching income
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center pt-4">
            {/* Sliders */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center text-sm font-bold mb-2">
                  <span className="text-slate-300">Your Hourly Rate:</span>
                  <span className="text-accent-400 text-lg font-extrabold">${hourlyRate}/hr</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full accent-accent-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>$20/hr</span>
                  <span>$70/hr</span>
                  <span>$120/hr</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-sm font-bold mb-2">
                  <span className="text-slate-300">Lessons per week:</span>
                  <span className="text-accent-400 text-lg font-extrabold">{hoursPerWeek} hrs/week</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={hoursPerWeek}
                  onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  className="w-full accent-accent-400 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                  <span>5 hrs</span>
                  <span>20 hrs</span>
                  <span>40 hrs (Full-time)</span>
                </div>
              </div>
            </div>

            {/* Income Output Box */}
            <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/10 text-center space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Estimated Net Earnings
              </span>
              <div className="text-4xl sm:text-5xl font-black text-accent-400">
                {formatCurrency(Math.round(monthlyNet))}
                <span className="text-sm font-semibold text-slate-300 block">/ month</span>
              </div>
              <p className="text-xs text-slate-300">
                Based on {hoursPerWeek} lessons/week at ${hourlyRate}/hr after Sabina Edge 18% service fee.
              </p>
              <Link href="/register?role=TUTOR" className="block pt-2">
                <Button variant="secondary" size="lg" className="w-full font-bold bg-accent-400 hover:bg-accent-500 text-slate-950">
                  Apply to Teach Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Why teach with Sabina Edge */}
      <div className="space-y-8">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 text-center">
          Why top educators choose Sabina Edge
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <DollarSign className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Guaranteed & On-Time Payouts</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Never chase student payments. Students prepay when booking, and funds are automatically transferred directly to your bank account via Stripe Connect.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Video className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Built-in Teaching Tools</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              No need for third-party zoom links or extra subscriptions. Enjoy browser-based video, shared whiteboard, student goals, and lesson notes in one unified interface.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-card space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
              <Globe className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Global Student Base</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Connect with students eager to learn English, math, science, programming, and foreign languages across North America, Europe, Asia, and the Middle East.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
