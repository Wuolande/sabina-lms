import Link from "next/link";
import { Heart } from "lucide-react";
import { getPayloadClient, requireUser } from "@/cms/auth/session";
import { idList, ownStudentProfile } from "@/cms/students/server";
import { toPublicTutor } from "@/cms/marketplace/public";
import { getPolicies } from "@/cms/tutors/server";
import { TutorCard } from "@/components/marketplace/TutorCard";

export const metadata = { title: "Saved tutors" };

export default async function SavedTutorsPage() {
  const user = await requireUser(["student"], "/student/favorites");
  const payload = await getPayloadClient();
  const [profile, policies] = await Promise.all([ownStudentProfile(payload, user), getPolicies(payload)]);
  const ids = idList(profile.savedTutors);
  const res = ids.length ? await payload.find({ collection: "tutor-profiles", where: { and: [{ id: { in: ids } }, { status: { equals: "approved" } }] }, limit: 200, depth: 1, overrideAccess: false }) : { docs: [] };
  // Keep the order the student saved them in.
  const tutors = ids.map((id) => res.docs.find((d) => d.id === id)).filter(Boolean).map((t) => toPublicTutor(t!, policies));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Saved tutors</h1>
        <p className="mt-1 text-slate-500">Tutors you&apos;ve saved to compare or book later.</p>
      </header>
      {tutors.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {tutors.map((t) => (
            <TutorCard key={t.id} tutor={t} currency={policies.currency} saved signedIn />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-rose-50 text-rose-500">
            <Heart size={26} />
          </span>
          <h2 className="mt-4 font-heading text-xl font-bold text-slate-900">No saved tutors yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-slate-500">Tap the heart on any tutor to keep them here.</p>
          <Link href="/find-tutors" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
            Find a tutor
          </Link>
        </div>
      )}
    </div>
  );
}
