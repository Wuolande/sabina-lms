import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { idList, ownStudentProfile } from "@/cms/students/server";
import { searchTutors, type PublicTutor } from "@/cms/marketplace/public";
import { getPolicies } from "@/cms/tutors/server";
import { STUDENT_GOALS, STUDENT_LEVELS, STUDENT_PACE } from "@/cms/collections/StudentProfiles";
import { LearningGoalsForm } from "@/components/portal/LearningGoalsForm";
import { TutorCard } from "@/components/marketplace/TutorCard";
import type { Lexical } from "@/cms/content/rich";

export const metadata = { title: "Learning goals" };

export default async function StudentProfilePage() {
  const user = await requireUser(["student"], "/student/profile");
  const payload = await getPayloadClient();
  const [profile, subjects, languages, policies] = await Promise.all([
    ownStudentProfile(payload, user),
    payload.find({ collection: "subjects", where: { isActive: { equals: true } }, sort: "sortOrder", limit: 300, depth: 0, pagination: false }),
    payload.find({ collection: "languages", where: { isActive: { equals: true } }, sort: "name", limit: 200, depth: 0, pagination: false }),
    getPolicies(payload),
  ]);
  const chosen = idList(profile.subjects);
  const saved = new Set(idList(profile.savedTutors));

  // Recommendations: tutors for each chosen subject within budget, best first, no duplicates.
  const recs: PublicTutor[] = [];
  for (const id of chosen.slice(0, 3)) {
    const slug = subjects.docs.find((s) => s.id === id)?.slug;
    if (!slug) continue;
    const r = await searchTutors(payload, { subject: String(slug), max: profile.budgetMax ? String(profile.budgetMax) : undefined, min: profile.budgetMin ? String(profile.budgetMin) : undefined });
    for (const t of r.tutors) if (!recs.some((x) => x.id === t.id) && recs.length < 6) recs.push(t);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Learning goals</h1>
        <p className="mt-1 text-slate-500">What you want to learn, and tutors who match.</p>
      </header>
      <LearningGoalsForm
        initial={{ subjects: chosen, goal: profile.goal ?? null, level: profile.level ?? null, pace: profile.pace ?? null, budgetMin: profile.budgetMin ?? null, budgetMax: profile.budgetMax ?? null, goalDetails: (profile.goalDetails as Lexical | null) ?? null, preferredLanguages: idList(profile.preferredLanguages) }}
        subjects={subjects.docs.map((s) => ({ id: s.id, name: s.name }))}
        languages={languages.docs.map((l) => ({ id: l.id, name: l.name }))}
        goals={[...STUDENT_GOALS]}
        levels={[...STUDENT_LEVELS]}
        paces={[...STUDENT_PACE]}
        currency={policies.currency}
      />
      <section>
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-xl font-bold text-slate-900">Recommended for you</h2>
          <Link href="/find-tutors" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:underline">
            Browse all <ArrowRight size={15} />
          </Link>
        </div>
        {recs.length ? (
          <div className="mt-4 grid gap-5 md:grid-cols-2 2xl:grid-cols-3">
            {recs.map((t) => (
              <TutorCard key={t.id} tutor={t} currency={policies.currency} saved={saved.has(t.id)} signedIn />
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-white p-6 text-sm text-slate-600 ring-1 ring-slate-200/70">
            {chosen.length ? "No tutors match these goals yet. Try widening your budget, or browse all tutors." : "Choose what you want to learn above and we'll suggest tutors."}
          </p>
        )}
      </section>
    </div>
  );
}
