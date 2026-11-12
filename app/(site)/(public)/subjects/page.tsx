import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPayloadClient } from "@/cms/auth/session";
import { subjectsWithCounts } from "@/cms/marketplace/public";
import { CATEGORY_LABEL, SubjectIcon } from "@/components/subjects/SubjectIcon";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Subjects",
  description: "Explore every subject taught on Sabina: languages, maths, sciences, coding, exam preparation and more. Live 1-to-1 lessons with verified tutors.",
  alternates: { canonical: "/subjects" },
};

export default async function SubjectsPage() {
  const subjects = await subjectsWithCounts(await getPayloadClient());
  const groups = Object.keys(CATEGORY_LABEL)
    .map((cat) => ({ cat, items: subjects.filter((s) => s.category === cat) }))
    .filter((g) => g.items.length);

  return (
    <div className="bg-[#F6F7FB]">
      <section className="bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">What do you want to learn?</h1>
          <p className="mt-3 max-w-2xl text-white/75 sm:text-lg">{subjects.length} subjects, taught live and 1-to-1 by verified tutors.</p>
          <nav aria-label="Categories" className="mt-6 flex flex-wrap gap-2">
            {groups.map((g) => (
              <a key={g.cat} href={`#${g.cat}`} className="rounded-full bg-white/10 px-3.5 py-1.5 text-sm font-semibold ring-1 ring-white/20 hover:bg-white/20">
                {CATEGORY_LABEL[g.cat]}
              </a>
            ))}
          </nav>
        </div>
      </section>
      <div className="mx-auto max-w-7xl space-y-12 px-4 py-10 sm:px-6 lg:px-8">
        {groups.map((g) => (
          <section key={g.cat} id={g.cat} className="scroll-mt-24">
            <h2 className="font-heading text-2xl font-bold text-slate-900">{CATEGORY_LABEL[g.cat]}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {g.items.map((s) => (
                <Link key={s.id} href={`/subjects/${s.slug}`} className="group flex flex-col rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(20,32,156,0.45)] hover:ring-brand-200">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-700 group-hover:text-white">
                    <SubjectIcon name={s.icon} />
                  </span>
                  <h3 className="mt-4 font-heading text-lg font-bold text-slate-900">{s.name}</h3>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-slate-500">{s.description}</p>
                  <p className="mt-4 flex items-center justify-between text-sm font-semibold text-brand-700">
                    {s.tutorCount ? `${s.tutorCount} ${s.tutorCount === 1 ? "tutor" : "tutors"}` : "Tutors joining soon"}
                    <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                  </p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
