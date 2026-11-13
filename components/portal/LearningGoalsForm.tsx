"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Target } from "lucide-react";
import { Alert } from "@/components/auth/fields";
import { Card, Chips, RichTextArea, Select } from "./form";
import type { Lexical } from "@/cms/content/rich";

type Opt = { value: string; label: string };
export type GoalsValue = { subjects: number[]; goal: string | null; level: string | null; pace: string | null; budgetMin: number | null; budgetMax: number | null; goalDetails: Lexical | null; preferredLanguages: number[] };

export function LearningGoalsForm({ initial, subjects, languages, goals, levels, paces, currency }: { initial: GoalsValue; subjects: { id: number; name: string }[]; languages: { id: number; name: string }[]; goals: Opt[]; levels: Opt[]; paces: Opt[]; currency: string }) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/student/profile", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : { error: "Couldn't reach Sabina." };
    setBusy(false);
    if (res?.ok) {
      setMsg({ tone: "success", text: "Saved. Your recommendations are updated below." });
      router.refresh();
    } else setMsg({ tone: "error", text: d.error ?? "Couldn't save." });
  }

  return (
    <Card>
      <form onSubmit={save} className="space-y-6" noValidate>
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <Target size={22} />
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold text-slate-900">Your learning goals</h2>
            <p className="text-sm text-slate-500">Tell us what you want to achieve. We use this to recommend tutors and share it with the tutors you book.</p>
          </div>
        </div>
        <Chips label="What do you want to learn?" options={subjects.map((s) => ({ value: s.id, label: s.name }))} value={v.subjects} onChange={(subjects) => setV({ ...v, subjects })} max={10} />
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Main goal" placeholder="Choose…" clearable options={goals.map((o) => ({ value: o.value, label: o.label }))} value={v.goal} onChange={(x) => setV({ ...v, goal: x })} />
          <Select label="Current level" placeholder="Choose…" clearable options={levels.map((o) => ({ value: o.value, label: o.label }))} value={v.level} onChange={(x) => setV({ ...v, level: x })} />
          <Select label="How often" placeholder="Choose…" clearable options={paces.map((o) => ({ value: o.value, label: o.label }))} value={v.pace} onChange={(x) => setV({ ...v, pace: x })} />
        </div>
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-semibold text-slate-800">Budget per lesson ({currency})</legend>
          <div className="flex items-center gap-3">
            <input type="number" min={0} inputMode="numeric" aria-label="Lowest price" placeholder="Min" value={v.budgetMin ?? ""} onChange={(e) => setV({ ...v, budgetMin: e.target.value === "" ? null : Number(e.target.value) })} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] shadow-sm focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15" />
            <span className="text-slate-400">to</span>
            <input type="number" min={0} inputMode="numeric" aria-label="Highest price" placeholder="Max" value={v.budgetMax ?? ""} onChange={(e) => setV({ ...v, budgetMax: e.target.value === "" ? null : Number(e.target.value) })} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-[15px] shadow-sm focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-600/15" />
          </div>
        </fieldset>
        <Chips label="Tutor should speak (optional)" options={languages.map((l) => ({ value: l.id, label: l.name }))} value={v.preferredLanguages} onChange={(preferredLanguages) => setV({ ...v, preferredLanguages })} max={5} />
        <RichTextArea label="Anything else? (optional)" minHeight={90} maxLength={600} value={v.goalDetails} onChange={(x) => setV({ ...v, goalDetails: x })} placeholder="e.g. I'm sitting KCSE in November and struggle with calculus." />
        <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
          <button type="submit" disabled={busy} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-6 font-semibold text-white hover:bg-brand-800 disabled:opacity-60">
            {busy && <Loader2 size={18} className="animate-spin" />} Save goals
          </button>
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        </div>
      </form>
    </Card>
  );
}
