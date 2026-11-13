import { getPayloadClient, getSessionUser } from "@/cms/auth/session";
import { subjectsWithCounts } from "@/cms/marketplace/public";
import { MATCH_GOALS, MATCH_LEVELS, TIMES } from "@/cms/matching/server";
import { SUBJECT_CATEGORIES } from "@/cms/collections/Subjects";
import { getPolicies } from "@/cms/tutors/server";
import { MatchQuiz } from "@/components/match/MatchQuiz";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Find your tutor in a minute",
  description: "Answer five quick questions and we'll suggest the three tutors who fit you best: subject, level, budget and the times you're free.",
};

export default async function MatchPage({ searchParams }: { searchParams: Promise<{ subject?: string }> }) {
  const payload = await getPayloadClient();
  const [subjects, languages, policies, user, sp] = await Promise.all([
    subjectsWithCounts(payload),
    payload.find({ collection: "languages", where: { isActive: { equals: true } }, sort: "name", limit: 200, depth: 0, pagination: false }),
    getPolicies(payload),
    getSessionUser().catch(() => null),
    searchParams,
  ]);
  const cat = Object.fromEntries(SUBJECT_CATEGORIES.map((c) => [c.value, c.label]));
  const preset = subjects.find((s) => s.slug === sp.subject)?.id ?? null;
  return (
    <div className="min-h-[80vh] bg-gradient-to-b from-brand-50/60 via-white to-white px-4 py-10 sm:py-16">
      <MatchQuiz
        subjects={subjects.filter((s) => s.tutorCount > 0).map((s) => ({ value: s.id, label: s.name, group: cat[s.category] ?? "Other", hint: `${s.tutorCount} ${s.tutorCount === 1 ? "tutor" : "tutors"}` }))}
        languages={languages.docs.map((l) => ({ value: l.id, label: l.name }))}
        levels={[...MATCH_LEVELS]}
        goals={[...MATCH_GOALS]}
        times={[...TIMES]}
        currency={policies.currency}
        rateRange={[Number(policies.tutorMinHourlyRate), Number(policies.tutorMaxHourlyRate)]}
        initialSubject={preset}
        defaultTimezone={user?.timezone ?? null}
      />
    </div>
  );
}
