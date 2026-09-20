"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export function BecomeTutorEarningsCalculator() {
  const [hourlyRate, setHourlyRate] = React.useState<number>(45);
  const [hoursPerWeek, setHoursPerWeek] = React.useState<number>(15);

  const monthlyGross = hourlyRate * hoursPerWeek * 4.33;
  const platformFee = monthlyGross * 0.18; // 18% fee
  const monthlyNet = monthlyGross - platformFee;

  return (
    <div className="w-full max-w-full min-w-0 rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-900 to-brand-950 text-white p-5 sm:p-12 shadow-elevation">
      <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 w-full min-w-0">
        <div className="text-center space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-400">
            Interactive Calculator
          </span>
          <h2 className="text-xl sm:text-4xl font-black text-white font-heading">
            Estimate your monthly teaching income
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-center pt-2 sm:pt-4">
          {/* Sliders */}
          <div className="space-y-5 sm:space-y-6">
            <div>
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2">
                <span className="text-slate-300">Your Hourly Rate:</span>
                <span className="text-accent-400 text-base sm:text-lg font-extrabold">${hourlyRate}/hr</span>
              </div>
              <input
                type="range"
                min="20"
                max="120"
                step="5"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(Number(e.target.value))}
                className="w-full accent-accent-400 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>$20/hr</span>
                <span>$70/hr</span>
                <span>$120/hr</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-xs sm:text-sm font-bold mb-2">
                <span className="text-slate-300">Lessons per week:</span>
                <span className="text-accent-400 text-base sm:text-lg font-extrabold">{hoursPerWeek} hrs/week</span>
              </div>
              <input
                type="range"
                min="5"
                max="40"
                step="1"
                value={hoursPerWeek}
                onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                className="w-full accent-accent-400 cursor-pointer h-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-1">
                <span>5 hrs</span>
                <span>20 hrs</span>
                <span>40 hrs (Full-time)</span>
              </div>
            </div>
          </div>

          {/* Income Output Box */}
          <div className="rounded-2xl bg-white/10 p-5 sm:p-6 backdrop-blur-md border border-white/10 text-center space-y-3 sm:space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Estimated Net Earnings
            </span>
            <div className="text-3xl sm:text-5xl font-black text-accent-400 font-heading">
              {formatCurrency(Math.round(monthlyNet))}
              <span className="text-xs sm:text-sm font-semibold text-slate-300 block mt-0.5">/ month</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300">
              Based on {hoursPerWeek} lessons/week at ${hourlyRate}/hr after Sabina Edge 18% service fee.
            </p>
            <Link href="/register?role=TUTOR" className="block pt-2">
              <Button variant="secondary" size="lg" className="w-full font-bold bg-accent-400 hover:bg-accent-500 text-slate-950 h-11 min-h-[44px]">
                Apply to Teach Now
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
