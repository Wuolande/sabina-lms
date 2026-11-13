import Link from "next/link";
import { ClipboardList, ListChecks } from "lucide-react";
import type { AssignmentView } from "@/cms/progress/server";
import { fmtDay } from "@/lib/time";

export function statusOf(a: Pick<AssignmentView, "status" | "kind" | "dueAt" | "score" | "outOf">, viewer: "student" | "tutor") {
  const late = a.status === "assigned" && a.dueAt && Date.parse(a.dueAt) < Date.now();
  if (a.status === "assigned") return late ? { t: "Overdue", c: "bg-rose-50 text-rose-700 ring-rose-200" } : { t: viewer === "student" ? "To do" : "Waiting", c: "bg-amber-50 text-amber-800 ring-amber-200" };
  if (a.kind === "quiz") return { t: `${a.score}/${a.outOf}`, c: "bg-emerald-50 text-emerald-800 ring-emerald-200" };
  if (a.status === "submitted") return { t: viewer === "tutor" ? "To mark" : "Handed in", c: viewer === "tutor" ? "bg-brand-50 text-brand-800 ring-brand-200" : "bg-slate-100 text-slate-700 ring-slate-200" };
  return { t: "Marked", c: "bg-emerald-50 text-emerald-800 ring-emerald-200" };
}

/** Homework and quizzes as a list (student or tutor). */
export function HomeworkList({ items, viewer, tz, empty }: { items: AssignmentView[]; viewer: "student" | "tutor"; tz: string; empty: string }) {
  if (!items.length) return <p className="rounded-2xl bg-slate-50 p-5 text-center text-sm text-slate-500">{empty}</p>;
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl ring-1 ring-slate-200/70">
      {items.map((a) => {
        const st = statusOf(a, viewer);
        const Icon = a.kind === "quiz" ? ListChecks : ClipboardList;
        return (
          <li key={a.id}>
            <Link href={`/${viewer}/homework/${a.id}`} className="flex items-center gap-3 bg-white px-4 py-3.5 transition hover:bg-slate-50">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                <Icon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900">{a.title}</span>
                <span className="block truncate text-sm text-slate-500">
                  {viewer === "tutor" ? a.student.name : a.tutor.name}
                  {a.subject ? ` · ${a.subject}` : ""}
                  {a.dueAt ? ` · due ${fmtDay(a.dueAt, tz, { month: "short", day: "numeric" })}` : ""}
                </span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${st.c}`}>{st.t}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
