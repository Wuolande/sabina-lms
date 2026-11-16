"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

type Props = { currency: string; feePercent: number; minRate: number; maxRate: number };

const nice = (n: number, step: number) => Math.round(n / step) * step;

/** Monthly estimate from the platform's real fee and allowed rates. */
export function BecomeTutorEarningsCalculator({ currency, feePercent, minRate, maxRate }: Props) {
  const money = React.useMemo(() => new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }), [currency]);
  const step = maxRate - minRate > 200 ? 5 : 1;
  const [rate, setRate] = React.useState(() => Math.min(maxRate, Math.max(minRate, nice(minRate + (maxRate - minRate) * 0.15, step))));
  const [hours, setHours] = React.useState(10);
  const net = rate * hours * (52 / 12) * (1 - feePercent / 100);
  const mid = nice((minRate + maxRate) / 2, step);

  return (
    <section aria-labelledby="calc-title" className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-900 to-brand-950 p-5 text-white shadow-elevation sm:rounded-3xl sm:p-12">
      <div className="mx-auto w-full min-w-0 max-w-3xl space-y-6 sm:space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-accent-400">Earnings estimate</p>
          <h2 id="calc-title" className="font-heading text-xl font-black text-white sm:text-4xl">
            What could you earn in a month?
          </h2>
        </div>

        <div className="grid grid-cols-1 items-center gap-6 pt-2 sm:gap-8 sm:pt-4 md:grid-cols-2">
          <div className="space-y-5 sm:space-y-6">
            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold sm:text-sm">
                <label htmlFor="calc-rate" className="text-slate-300">
                  Your hourly rate
                </label>
                <span className="text-base font-extrabold text-accent-400 sm:text-lg">{money.format(rate)}/h</span>
              </div>
              <input id="calc-rate" type="range" min={minRate} max={maxRate} step={step} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-accent-400" />
              <div className="mt-1 flex justify-between text-[11px] font-bold text-slate-400" aria-hidden="true">
                <span>{money.format(minRate)}</span>
                <span>{money.format(mid)}</span>
                <span>{money.format(maxRate)}</span>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-xs font-bold sm:text-sm">
                <label htmlFor="calc-hours" className="text-slate-300">
                  Hours of lessons a week
                </label>
                <span className="text-base font-extrabold text-accent-400 sm:text-lg">{hours} h</span>
              </div>
              <input id="calc-hours" type="range" min={1} max={40} step={1} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="h-2 w-full cursor-pointer accent-accent-400" />
              <div className="mt-1 flex justify-between text-[11px] font-bold text-slate-400" aria-hidden="true">
                <span>1 h</span>
                <span>20 h</span>
                <span>40 h</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-white/10 bg-white/10 p-5 text-center backdrop-blur-md sm:space-y-4 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">You&apos;d keep about</p>
            <p className="font-heading text-3xl font-black text-accent-400 sm:text-5xl" aria-live="polite">
              {money.format(Math.round(net))}
              <span className="mt-0.5 block text-xs font-semibold text-slate-300 sm:text-sm">a month</span>
            </p>
            <p className="text-xs text-slate-300">
              {hours} hours a week at {money.format(rate)}/h, after the {feePercent}% platform fee. An estimate, not a promise: what you earn depends on the lessons you teach.
            </p>
            <Link href="/register?role=tutor" className="block pt-2">
              <Button variant="secondary" size="lg" className="h-11 min-h-[44px] w-full bg-accent-400 font-bold text-slate-950 hover:bg-accent-500">
                Apply to teach
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
