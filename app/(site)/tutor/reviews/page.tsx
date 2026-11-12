import { MessageSquareQuote } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { tutorReviews } from "@/cms/lessons/server";
import { Stars } from "@/components/lesson-room/LessonDetail";
import { ReviewReply } from "@/components/lesson-room/ReviewReply";
import { PageHeader } from "@/components/portal/PageHeader";
import { fmtDay, safeTz } from "@/lib/time";

export const metadata = { title: "Reviews" };
export const dynamic = "force-dynamic";

export default async function TutorReviewsPage() {
  const user = await requireUser(["tutor"], "/tutor/reviews");
  const r = await tutorReviews(await getPayloadClient(), user);
  const tz = safeTz(user.timezone);
  const max = Math.max(1, ...r.breakdown);
  return (
    <div className="space-y-6">
      <PageHeader title="Reviews" sub="What your students say. Reviews appear on your public profile." />
      {r.items.length ? (
        <>
          <section className="grid gap-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200/70 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center sm:p-8">
            <div className="text-center sm:pr-8">
              <p className="font-heading text-5xl font-bold text-slate-900">{r.rating.toFixed(1)}</p>
              <div className="mt-2 flex justify-center">
                <Stars value={Math.round(r.rating)} size={18} />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {r.total} review{r.total === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="space-y-1.5">
              {r.breakdown.map((n, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <span className="w-3 text-slate-500">{5 - i}</span>
                  <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <span className="block h-full rounded-full bg-amber-400" style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                  <span className="w-6 text-right text-slate-500">{n}</span>
                </li>
              ))}
            </ul>
          </section>
          <ul className="space-y-4">
            {r.items.map((v) => (
              <li key={v.id} className="rounded-3xl bg-white p-5 ring-1 ring-slate-200/70 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Stars value={v.rating} size={16} />
                  <span className="text-sm text-slate-500">{fmtDay(v.date, tz, { month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                {v.comment ? <p className="mt-2 text-[15px] text-slate-800">{v.comment}</p> : <p className="mt-2 text-sm italic text-slate-400">No written comment</p>}
                <p className="mt-2 text-sm text-slate-500">
                  {v.name}
                  {v.subject ? ` · ${v.subject}` : ""}
                  {v.hidden && <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Hidden by Sabina</span>}
                </p>
                <ReviewReply id={v.id} initial={v.reply} />
              </li>
            ))}
          </ul>
        </>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-500">
            <MessageSquareQuote size={26} />
          </span>
          <h2 className="mt-4 font-heading text-xl font-bold text-slate-900">No reviews yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-slate-500">After each lesson, students are asked to rate it. Their reviews will show up here.</p>
        </div>
      )}
    </div>
  );
}
