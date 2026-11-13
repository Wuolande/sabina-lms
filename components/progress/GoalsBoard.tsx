"use client";
import { useState } from "react";
import { Check, Loader2, Pencil, Plus, Target, Trophy, X } from "lucide-react";
import type { GoalView } from "@/cms/progress/server";
import { controlCls } from "@/components/portal/form";

async function call(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
  const d = (await res?.json().catch(() => ({}))) as GoalView & { error?: string };
  return { ok: Boolean(res?.ok), d };
}

function Editor({ initial, onSave, onCancel, busy }: { initial?: GoalView; onSave: (g: { title: string; targetDate: string | null; milestones: { text: string; done: boolean }[] }) => void; onCancel: () => void; busy: boolean }) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial?.targetDate?.slice(0, 10) ?? "");
  const [steps, setSteps] = useState(initial?.milestones.length ? initial.milestones : [{ text: "", done: false }]);
  return (
    <div className="space-y-3 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
      <input aria-label="Goal" autoFocus value={title} maxLength={140} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Get a B+ in KCSE Chemistry" className={`${controlCls} h-11 font-semibold`} />
      <label className="flex items-center gap-2 text-sm text-slate-600">
        By (optional)
        <input type="date" aria-label="Target date" value={date} onChange={(e) => setDate(e.target.value)} className={`${controlCls} h-10 w-auto text-sm`} />
      </label>
      <div className="space-y-2">
        <p className="text-sm font-semibold text-slate-800">Steps to get there</p>
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input aria-label={`Step ${i + 1}`} value={s.text} maxLength={160} onChange={(e) => setSteps(steps.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} placeholder={i === 0 ? "Finish organic chemistry topics" : "Next step"} className={`${controlCls} h-10 text-sm`} />
            {steps.length > 1 && (
              <button type="button" onClick={() => setSteps(steps.filter((_, j) => j !== i))} aria-label={`Remove step ${i + 1}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-white">
                <X size={15} />
              </button>
            )}
          </div>
        ))}
        {steps.length < 12 && (
          <button type="button" onClick={() => setSteps([...steps, { text: "", done: false }])} className="text-sm font-semibold text-brand-700 hover:underline">
            + Add a step
          </button>
        )}
      </div>
      <div className="flex gap-2">
        <button type="button" disabled={busy || !title.trim()} onClick={() => onSave({ title, targetDate: date || null, milestones: steps.filter((s) => s.text.trim()) })} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">
          {busy && <Loader2 size={15} className="animate-spin" />} Save goal
        </button>
        <button type="button" onClick={onCancel} className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-white">
          Cancel
        </button>
      </div>
    </div>
  );
}

/** Learning goals with steps. Editable by the student and by their tutors. */
export function GoalsBoard({ initial, studentId, editable = true, who = "you" }: { initial: GoalView[]; studentId?: number; editable?: boolean; who?: string }) {
  const [goals, setGoals] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(g: Parameters<Parameters<typeof Editor>[0]["onSave"]>[0]) {
    setBusy(true);
    setError(null);
    const { ok, d } = await call("/api/goals", "POST", { ...g, studentId });
    setBusy(false);
    if (!ok) return setError(d.error || "We couldn't save that goal.");
    setGoals([d, ...goals]);
    setAdding(false);
  }
  async function update(id: number, patch: Record<string, unknown>) {
    const before = goals;
    // Ticking a step shows straight away; it's put back if saving fails.
    if (Array.isArray(patch.milestones)) {
      const ms = patch.milestones as GoalView["milestones"];
      setGoals(goals.map((g) => (g.id === id ? { ...g, milestones: ms, progress: ms.length ? Math.round((ms.filter((m) => m.done).length / ms.length) * 100) : g.progress } : g)));
    }
    setBusy(true);
    setError(null);
    const { ok, d } = await call(`/api/goals/${id}`, "PATCH", patch);
    setBusy(false);
    if (!ok) {
      setGoals(before);
      return setError(d.error || "We couldn't save that.");
    }
    setGoals(goals.map((g) => (g.id === id ? d : g)).filter((g) => g.status !== "archived"));
    setEditing(null);
  }

  return (
    <div className="space-y-3">
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      {goals.map((g) =>
        editing === g.id ? (
          <Editor key={g.id} initial={g} busy={busy} onCancel={() => setEditing(null)} onSave={(v) => update(g.id, v)} />
        ) : (
          <article key={g.id} className={`rounded-2xl p-4 ring-1 ${g.status === "achieved" ? "bg-emerald-50/60 ring-emerald-200" : "bg-white ring-slate-200"}`}>
            <div className="flex items-start gap-3">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${g.status === "achieved" ? "bg-emerald-600 text-white" : "bg-brand-50 text-brand-700"}`}>{g.status === "achieved" ? <Trophy size={17} /> : <Target size={17} />}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{g.title}</p>
                <p className="text-xs text-slate-500">
                  {g.status === "achieved" ? "Achieved" : `${g.progress}% done`}
                  {g.targetDate && g.status !== "achieved" ? ` · by ${new Date(g.targetDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </p>
              </div>
              {editable && (
                <button type="button" onClick={() => setEditing(g.id)} aria-label={`Edit ${g.title}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <Pencil size={15} />
                </button>
              )}
            </div>
            {g.milestones.length > 0 && (
              <>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${g.progress}%` }} />
                </div>
                <ul className="mt-3 space-y-1.5">
                  {g.milestones.map((m, i) => (
                    <li key={i}>
                      <label className={`flex items-start gap-2.5 text-sm ${editable ? "cursor-pointer" : ""}`}>
                        <input
                          type="checkbox"
                          checked={m.done}
                          disabled={!editable}
                          onChange={() => update(g.id, { milestones: g.milestones.map((x, j) => (j === i ? { ...x, done: !x.done } : x)) })}
                          className="mt-0.5 h-4 w-4 accent-emerald-600"
                        />
                        <span className={m.done ? "text-slate-400 line-through" : "text-slate-700"}>{m.text}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {editable && (
              <div className="mt-3 flex flex-wrap gap-2">
                {g.status === "active" ? (
                  <button type="button" onClick={() => update(g.id, { status: "achieved" })} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white hover:bg-emerald-700">
                    <Check size={14} /> Mark as achieved
                  </button>
                ) : (
                  <button type="button" onClick={() => update(g.id, { status: "active" })} className="h-9 rounded-lg px-3 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-white">
                    Keep working on it
                  </button>
                )}
                <button type="button" onClick={() => update(g.id, { status: "archived" })} className="h-9 rounded-lg px-3 text-xs font-semibold text-slate-500 hover:bg-slate-100">
                  Remove
                </button>
              </div>
            )}
          </article>
        ),
      )}
      {!goals.length && !adding && <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">No goals yet. Setting one gives {who} something clear to work towards.</p>}
      {editable &&
        (adding ? (
          <Editor busy={busy} onCancel={() => setAdding(false)} onSave={create} />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
            <Plus size={16} /> Add a goal
          </button>
        ))}
    </div>
  );
}
