import Link from "next/link";
import { Award, BookOpen, CheckCircle2, GraduationCap } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { listCourses } from "@/cms/academy/server";
import { PageHeader } from "@/components/portal/PageHeader";

export const metadata = { title: "Academy" };
export const dynamic = "force-dynamic";

export default async function AcademyPage() {
  const user = await requireUser(["tutor"], "/tutor/training");
  const courses = await listCourses(await getPayloadClient(), user);
  const earned = courses.filter((c) => c.passed);
  return (
    <div className="space-y-8">
      <PageHeader title="Academy" sub="Short courses on how Sabina works and how to teach well online." />
      {courses.length === 0 ? (
        <div className="rounded-3xl bg-white px-6 py-14 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
            <GraduationCap size={26} />
          </span>
          <p className="mt-4 font-semibold text-slate-900">No courses yet</p>
          <p className="mt-1 text-sm text-slate-500">New courses will appear here as our team adds them.</p>
        </div>
      ) : (
        <ul className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => (
            <li key={c.slug} className="flex flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
              {c.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.cover} alt="" className="aspect-[16/8] w-full object-cover" />
              ) : (
                <div className="grid aspect-[16/8] place-items-center bg-gradient-to-br from-brand-600 to-brand-900 text-white/90" aria-hidden="true">
                  <GraduationCap size={44} strokeWidth={1.5} />
                </div>
              )}
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  {c.recommended && !c.passed && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">Recommended</span>}
                  {c.passed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                      <CheckCircle2 size={13} /> Completed
                    </span>
                  )}
                </div>
                <h2 className="mt-2 font-heading text-lg font-bold text-slate-900">{c.title}</h2>
                <p className="mt-1 flex-1 text-[15px] leading-relaxed text-slate-600">{c.summary}</p>
                <p className="mt-4 flex items-center gap-1.5 text-sm text-slate-500">
                  <BookOpen size={15} /> {c.lessons} lessons · about {c.minutes} min
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={c.percent} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} progress`}>
                  <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${c.percent}%` }} />
                </div>
                <Link
                  href={`/tutor/training/${c.slug}`}
                  className={`mt-5 inline-flex h-11 items-center justify-center rounded-full text-sm font-semibold transition ${c.passed ? "bg-slate-100 text-slate-800 hover:bg-slate-200" : "bg-brand-700 text-white hover:bg-brand-800"}`}
                >
                  {c.passed ? "Review course" : c.percent > 0 ? "Continue" : "Start course"}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      {earned.length > 0 && (
        <section>
          <h2 className="mb-2 px-4 text-[13px] font-medium uppercase tracking-wide text-slate-500">Certificates</h2>
          <ul className="divide-y divide-slate-100 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200/70">
            {earned.map((c) => (
              <li key={c.slug}>
                <Link href={`/tutor/training/${c.slug}/certificate`} className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-100 text-amber-700">
                    <Award size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <b className="block truncate text-[15px] font-semibold text-slate-900">{c.title}</b>
                    <span className="text-sm text-slate-500">Certificate {c.certificate}</span>
                  </span>
                  <span className="text-sm font-semibold text-brand-700">View</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
