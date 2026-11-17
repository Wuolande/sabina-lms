"use client";
import { useState } from "react";
import { Check, Copy, Gift, MessageCircle, UserPlus } from "lucide-react";
import { money } from "@/lib/money";
import type { ReferralSummary } from "@/cms/referrals/server";

const fmt = (at: string) => new Date(at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });

/** Invite link, how rewards work, who joined and the credit history. */
export function InvitePanel({ data }: { data: ReferralSummary }) {
  const [copied, setCopied] = useState(false);
  const { rewards, currency } = data;
  const you = money(rewards.you, currency);
  const friend = money(rewards.friend, currency);
  const message = `I use Sabina for online lessons with great tutors. Join with my link${rewards.friend > 0 ? ` and get ${friend} of lesson credit after your first paid lesson` : ""}: ${data.link}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(data.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* select manually */
    }
  }

  if (!data.enabled)
    return <p className="rounded-2xl bg-white p-6 text-slate-600 ring-1 ring-slate-200/70">Invites are paused right now. Please check back soon.</p>;

  return (
    <div className="space-y-6">
      <section aria-labelledby="link-h" className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-6 text-white sm:p-8">
        <p className="flex items-center gap-2 text-sm font-semibold text-accent-300"><Gift size={16} /> Your invite link</p>
        <h2 id="link-h" className="mt-2 font-heading text-2xl font-bold sm:text-3xl">
          {rewards.asEarnings ? `Earn ${you} for every tutor or student you bring` : `Get ${you} of lesson credit for every friend who joins`}
        </h2>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={data.link} aria-label="Invite link" onFocus={(e) => e.currentTarget.select()} className="h-12 min-w-0 flex-1 rounded-xl bg-white/10 px-4 text-white ring-1 ring-white/25 focus:outline-none focus:ring-2 focus:ring-accent-300" />
          <button type="button" onClick={copy} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent-400 px-5 font-semibold text-slate-900 hover:bg-accent-300">
            {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copied" : "Copy link"}
          </button>
          <a href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white/10 px-5 font-semibold ring-1 ring-white/25 hover:bg-white/20">
            <MessageCircle size={18} /> Share on WhatsApp
          </a>
        </div>
        <p className="mt-3 text-sm text-white/75">Your code: <b className="tracking-wide text-white">{data.code}</b></p>
      </section>

      <section aria-labelledby="how-h" className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70">
        <h2 id="how-h" className="font-heading text-lg font-bold text-slate-900">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            ["Share your link", "Send it to friends, classmates or other tutors."],
            ["They join and take a paid lesson", "The reward comes after their first paid lesson is finished."],
            [rewards.asEarnings ? `You earn ${you}` : `You both get credit`, rewards.asEarnings ? "It's added to your earnings and paid out with your lessons." : `You get ${you} and your friend gets ${friend}, used automatically at checkout.`],
          ].map(([t, d], i) => (
            <li key={t} className="rounded-2xl bg-slate-50 p-4">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white">{i + 1}</span>
              <b className="mt-3 block text-slate-900">{t}</b>
              <span className="text-sm text-slate-600">{d}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
          <p className="text-sm text-slate-500">Friends joined</p>
          <p className="font-heading text-2xl font-bold text-slate-900">{data.invited.length}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
          <p className="text-sm text-slate-500">Earned from invites</p>
          <p className="font-heading text-2xl font-bold text-slate-900">{money(data.earned, currency)}</p>
        </div>
        {!rewards.asEarnings && (
          <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200/70">
            <p className="text-sm text-slate-500">Lesson credit to spend</p>
            <p className="font-heading text-2xl font-bold text-slate-900" data-testid="credit-balance">{money(data.balance, currency)}</p>
          </div>
        )}
      </div>

      <section aria-labelledby="friends-h" className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70">
        <h2 id="friends-h" className="font-heading text-lg font-bold text-slate-900">People you invited</h2>
        {data.invited.length ? (
          <ul className="mt-3 divide-y divide-slate-100">
            {data.invited.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-3">
                <span>
                  <b className="block text-slate-900">{f.name}</b>
                  <span className="text-sm text-slate-500">Joined {fmt(f.joinedAt)}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${f.rewarded ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-slate-50 text-slate-600 ring-slate-200"}`}>
                  {f.rewarded ? "Reward earned" : "Waiting for first paid lesson"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><UserPlus size={17} /> No one has joined with your link yet. Share it to get started.</p>
        )}
      </section>

      {data.history.length > 0 && (
        <section aria-labelledby="hist-h" className="rounded-3xl bg-white p-6 ring-1 ring-slate-200/70">
          <h2 id="hist-h" className="font-heading text-lg font-bold text-slate-900">{rewards.asEarnings ? "Bonuses" : "Credit history"}</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {data.history.map((h) => (
              <li key={h.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  <span className="block text-slate-900">{h.note}</span>
                  <span className="text-slate-500">{fmt(h.at)}</span>
                </span>
                <b className={`tabular-nums ${h.amount < 0 ? "text-slate-700" : "text-emerald-700"}`}>{h.amount > 0 ? "+" : ""}{money(h.amount, h.currency)}</b>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
