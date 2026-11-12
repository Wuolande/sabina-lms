import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarCheck, Video } from "lucide-react";
import { getPayloadClient } from "@/cms/auth/session";
import { searchTutors } from "@/cms/marketplace/public";
import { marketplaceViewer } from "@/cms/marketplace/viewer";
import { TutorCard } from "@/components/marketplace/TutorCard";
import { CATEGORY_LABEL, SubjectIcon } from "@/components/subjects/SubjectIcon";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

async function getSubject(slug: string) {
  const payload = await getPayloadClient();
  return (await payload.find({ collection: "subjects", where: { slug: { equals: slug } }, limit: 1, depth: 0, overrideAccess: false })).docs[0] ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getSubject((await params).slug);
  if (!s) return { title: "Subject not found", robots: { index: false } };
  return {
    title: `${s.name} tutors & online lessons`,
    description: `${s.description ?? ""} Learn ${s.name} live, 1-to-1 with a verified tutor on Sabina.`.trim().slice(0, 160),
    alternates: { canonical: `/subjects/${s.slug}` },
  };
}

export default async function SubjectPage({ params }: Props) {
  const { slug } = await params;
  const subject = await getSubject(slug);
  if (!subject) notFound();
  const payload = await getPayloadClient();
  const [result, viewer] = await Promise.all([searchTutors(payload, { subject: slug }), marketplaceViewer(payload)]);
  const tutors = result.tutors.slice(0, 6);

  return (
    <div className="bg-[#F6F7FB]">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white">
        <div aria-hidden className="absolute -right-20 -top-24 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link href="/subjects" className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/70 hover:text-white">
            <ArrowLeft size={16} /> All subjects
          </Link>
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <SubjectIcon name={subject.icon} size={30} />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-accent-300">{CATEGORY_LABEL[subject.category] ?? subject.category}</p>
              <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">{subject.name}</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-white/80 sm:text-lg">{subject.description}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={`/find-tutors?subject=${subject.slug}`} className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent-400 px-5 font-semibold text-brand-950 hover:bg-accent-300">
              See all {subject.name} tutors <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: BadgeCheck, title: "Verified tutors", body: "Every tutor is interviewed, ID-checked and qualified." },
            { icon: Video, title: "Live classroom", body: "HD video, a shared whiteboard and notes, right in your browser." },
            { icon: CalendarCheck, title: "Your schedule", body: "Book lessons at times that suit you, in your own time zone." },
          ].map((f) => (
            <div key={f.title} className="flex gap-3 rounded-2xl bg-white p-5 ring-1 ring-slate-200/70">
              <f.icon size={22} className="shrink-0 text-brand-600" />
              <div>
                <p className="font-semibold text-slate-900">{f.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        <section>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-heading text-2xl font-bold text-slate-900">{result.total ? `Top ${subject.name} tutors` : `${subject.name} tutors`}</h2>
            {result.total > tutors.length && (
              <Link href={`/find-tutors?subject=${subject.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
                View all {result.total}
              </Link>
            )}
          </div>
          {tutors.length ? (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {tutors.map((t) => (
                <TutorCard key={t.id} tutor={t} currency={result.policies.currency} saved={viewer.saved.has(t.id)} signedIn={viewer.signedIn} showSave={!viewer.signedIn || viewer.isStudent} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-3xl bg-white p-8 text-center ring-1 ring-slate-200/70">
              <p className="font-semibold text-slate-900">New {subject.name} tutors are joining soon.</p>
              <p className="mt-1 text-sm text-slate-500">Do you teach {subject.name}?</p>
              <Link href="/register?role=tutor" className="mt-4 inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
                Apply to teach
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
