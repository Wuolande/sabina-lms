import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Award, BadgeCheck, Briefcase, CalendarClock, Clock, Globe2, GraduationCap, Languages, MessageCircle, MessageSquare, ShieldCheck, Star, Zap } from "lucide-react";
import { getPayloadClient } from "@/cms/auth/session";
import { getTutorBySlug } from "@/cms/marketplace/public";
import { publicReviews } from "@/cms/lessons/server";
import { Stars } from "@/components/lesson-room/LessonDetail";
import { marketplaceViewer } from "@/cms/marketplace/viewer";
import { Rating, TutorAvatar } from "@/components/marketplace/TutorCard";
import { SaveTutorButton } from "@/components/marketplace/SaveTutorButton";
import { money } from "@/lib/money";
import { videoEmbedUrl } from "@/lib/video";
import { RichText } from "@/components/content/RichText";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

const LEVEL_LABEL: Record<string, string> = { primary: "Primary school", secondary: "Secondary school", university: "University", adult: "Adults & professionals", exam: "Exam preparation" };
const LANG_LEVEL: Record<string, string> = { native: "Native", c2: "Fluent", c1: "Advanced", b2: "Upper intermediate", b1: "Intermediate", a2: "Basic" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTutorBySlug(await getPayloadClient(), slug);
  if (!data) return { title: "Tutor not found", robots: { index: false } };
  const t = data.tutor;
  const subject = t.primarySubject?.name ?? "Online";
  return {
    title: `${t.name}, ${subject} tutor`,
    description: `${t.headline} Live 1-to-1 lessons from ${money(t.hourlyRate, data.policies.currency)}/hour on Sabina.`.slice(0, 160),
    alternates: { canonical: `/tutors/${t.slug}` },
    openGraph: { title: `${t.name}, ${subject} tutor on Sabina`, description: t.headline, images: t.photoLarge ? [{ url: t.photoLarge }] : undefined, type: "profile" },
  };
}

function Section({ icon: Icon, title, children }: { icon: typeof Star; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-8">
      <h2 className="flex items-center gap-2.5 font-heading text-lg font-bold text-slate-900">
        <Icon size={20} className="text-brand-600" /> {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function TutorProfilePage({ params }: Props) {
  const { slug } = await params;
  const payload = await getPayloadClient();
  const [data, viewer] = await Promise.all([getTutorBySlug(payload, slug), marketplaceViewer(payload)]);
  if (!data) notFound();
  const { tutor: t, policies } = data;
  const reviews = await publicReviews(payload, t.id);
  const currency = policies.currency;
  const embed = videoEmbedUrl(t.introVideoUrl);
  const canSave = !viewer.signedIn || viewer.isStudent;
  const site = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: t.name,
    description: t.headline,
    url: `${site}/tutors/${t.slug}`,
    image: t.photoLarge ?? undefined,
    jobTitle: `${t.primarySubject?.name ?? ""} tutor`.trim(),
    knowsLanguage: t.languages.map((l) => l.name),
    knowsAbout: t.subjects.map((s) => s.name),
    ...(t.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: t.rating, reviewCount: t.reviewCount } } : {}),
    makesOffer: { "@type": "Offer", price: t.hourlyRate, priceCurrency: currency, description: "60-minute online lesson" },
  };

  const priceCard = (
    <div className="rounded-3xl bg-white p-6 shadow-[0_20px_50px_-30px_rgba(20,32,156,0.45)] ring-1 ring-slate-200/70">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-heading text-3xl font-bold text-slate-900">{money(t.hourlyRate, currency)}</p>
        <span className="text-sm text-slate-500">per 60-min lesson</span>
      </div>
      {t.trialPrice != null && (
        <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
          Trial lesson: {policies.trialLessonMinutes} min for <b>{money(t.trialPrice, currency)}</b>
        </p>
      )}
      <div className="mt-5 space-y-2.5">
        <Link href={`/tutors/${t.slug}/book`} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-700 font-semibold text-white transition hover:bg-brand-800">
          <CalendarClock size={18} /> Book a lesson
        </Link>
        {t.trialPrice != null && (
          <Link href={`/tutors/${t.slug}/book?type=trial`} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-200 transition hover:bg-emerald-100">
            Book a trial lesson
          </Link>
        )}
        {canSave && (
          <Link
            href={viewer.signedIn ? `/student/messages?tutor=${t.id}` : `/login?redirect=${encodeURIComponent(`/student/messages?tutor=${t.id}`)}`}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <MessageSquare size={18} /> Send a message
          </Link>
        )}
        {canSave && <SaveTutorButton tutorId={t.id} initialSaved={viewer.saved.has(t.id)} signedIn={viewer.signedIn} variant="full" />}
      </div>
      <p className="mt-3 text-center text-xs text-slate-500">{t.instantBooking ? "Instant booking: pick a time and you're confirmed." : `${t.name.split(" ")[0]} confirms each request personally.`} Free cancellation up to {policies.cancellationRefundHours} hours before.</p>
      <ul className="mt-5 space-y-2.5 border-t border-slate-100 pt-5 text-sm text-slate-600">
        <li className="flex items-center gap-2.5">
          <ShieldCheck size={17} className="text-emerald-600" /> ID and qualifications checked by Sabina
        </li>
        {t.instantBooking && (
          <li className="flex items-center gap-2.5">
            <Zap size={17} className="text-amber-500" /> Instant booking
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <Clock size={17} className="text-slate-400" /> Free cancellation up to {policies.cancellationRefundHours} h before
        </li>
      </ul>
    </div>
  );

  return (
    <div className="bg-[#F6F7FB] pb-28 lg:pb-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <Link href={t.primarySubject ? `/find-tutors?subject=${t.primarySubject.slug}` : "/find-tutors"} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900">
          <ArrowLeft size={16} /> {t.primarySubject ? `${t.primarySubject.name} tutors` : "All tutors"}
        </Link>
      </div>

      <div className="mx-auto mt-5 grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="min-w-0 space-y-6">
          {/* Header */}
          <section className="relative overflow-hidden rounded-3xl bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 sm:p-8">
            <div aria-hidden className="absolute inset-x-0 top-0 h-24 bg-gradient-to-r from-brand-700 via-brand-600 to-brand-800" />
            <div className="relative flex flex-col gap-5 pt-8 sm:flex-row sm:items-end">
              <div className="w-fit rounded-[22px] bg-white p-1.5 shadow-lg">
                <TutorAvatar tutor={t} size={128} rounded="rounded-[18px]" />
              </div>
              <div className="min-w-0 flex-1 pb-1">
                <h1 className="flex flex-wrap items-center gap-2 font-heading text-3xl font-bold tracking-tight text-slate-900">
                  {t.name}
                  <BadgeCheck size={24} className="text-brand-600" aria-label="Verified tutor" />
                  {t.isSuperTutor && <span className="rounded-full bg-accent-400 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-brand-950">Super tutor</span>}
                </h1>
                <p className="mt-1 text-slate-500">{[t.primarySubject?.name && `${t.primarySubject.name} tutor`, t.country].filter(Boolean).join(" · ")}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-slate-600">
                  <Rating tutor={t} />
                  {t.lessonsTaught > 0 && <span>{t.lessonsTaught} lessons taught</span>}
                  {t.languages.length > 0 && (
                    <span className="inline-flex items-center gap-1.5">
                      <Languages size={15} /> {t.languages.map((l) => l.name).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <p className="relative mt-6 text-lg font-medium leading-relaxed text-slate-800">{t.headline}</p>
            <div className="relative mt-4 flex flex-wrap gap-2">
              {t.subjects.map((s) => (
                <Link key={s.slug} href={`/find-tutors?subject=${s.slug}`} className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800 ring-1 ring-brand-100 hover:bg-brand-100">
                  {s.name}
                </Link>
              ))}
            </div>
          </section>

          {/* Price card on phones */}
          <div className="lg:hidden">{priceCard}</div>

          {embed && (
            <section className="overflow-hidden rounded-3xl bg-slate-900 ring-1 ring-slate-200/70">
              <div className="aspect-video">
                <iframe src={embed} title={`${t.name}'s introduction`} className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
              </div>
            </section>
          )}

          <Section icon={MessageCircle} title={`About ${t.name.split(" ")[0]}`}>
            <RichText data={t.about} className="leading-relaxed text-slate-700" />
            {t.teachingStyle && (
              <>
                <h3 className="mt-6 font-semibold text-slate-900">Teaching style</h3>
                <RichText data={t.teachingStyle} className="mt-2 leading-relaxed text-slate-700" />
              </>
            )}
            <dl className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Teaches</dt>
                <dd className="mt-1 text-sm text-slate-800">{t.levelsTaught.map((l) => LEVEL_LABEL[l] ?? l).join(", ") || "All levels"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Speaks</dt>
                <dd className="mt-1 text-sm text-slate-800">{t.languages.map((l) => `${l.name} (${LANG_LEVEL[l.level] ?? l.level})`).join(", ")}</dd>
              </div>
              {t.timezone && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Time zone</dt>
                  <dd className="mt-1 flex items-center gap-1.5 text-sm text-slate-800">
                    <Globe2 size={14} /> {t.timezone.replace(/_/g, " ")}
                  </dd>
                </div>
              )}
            </dl>
          </Section>

          {(t.education.length > 0 || t.certifications.length > 0) && (
            <Section icon={GraduationCap} title="Education & certificates">
              <ul className="space-y-4">
                {t.education.map((e, i) => (
                  <li key={`e${i}`} className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                      <GraduationCap size={19} />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {e.degree}
                        {e.field ? `, ${e.field}` : ""}
                      </p>
                      <p className="text-sm text-slate-500">
                        {e.institution}
                        {e.endYear ? ` · ${e.endYear}` : ""}
                      </p>
                      {e.verified && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <BadgeCheck size={13} /> Diploma verified
                        </span>
                      )}
                    </div>
                  </li>
                ))}
                {t.certifications.map((c, i) => (
                  <li key={`c${i}`} className="flex gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-50 text-accent-700">
                      <Award size={19} />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900">{c.title}</p>
                      <p className="text-sm text-slate-500">
                        {c.issuer}
                        {c.year ? ` · ${c.year}` : ""}
                      </p>
                      {c.verified && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                          <BadgeCheck size={13} /> Certificate verified
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {t.experience.length > 0 && (
            <Section icon={Briefcase} title="Experience">
              <ol className="relative space-y-5 border-l-2 border-slate-100 pl-5">
                {t.experience.map((x, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[27px] top-1.5 h-3 w-3 rounded-full bg-brand-600 ring-4 ring-white" />
                    <p className="font-semibold text-slate-900">{x.role}</p>
                    <p className="text-sm text-slate-500">
                      {x.organization}
                      {x.startYear ? ` · ${x.startYear} – ${x.endYear ?? "present"}` : ""}
                    </p>
                    {x.description && <RichText data={x.description} className="mt-1.5 text-sm leading-relaxed text-slate-700" />}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          <Section icon={Star} title={reviews.total ? `Reviews (${reviews.total})` : "Reviews"}>
            {reviews.items.length ? (
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-heading text-3xl font-bold text-slate-900">{t.rating.toFixed(1)}</span>
                  <Stars value={Math.round(t.rating)} size={18} />
                </div>
                <ul className="mt-5 divide-y divide-slate-100">
                  {reviews.items.map((r) => (
                    <li key={r.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900">{r.name}</span>
                        <span className="text-sm text-slate-500">{new Date(r.date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</span>
                      </div>
                      <div className="mt-1">
                        <Stars value={r.rating} size={14} />
                      </div>
                      {r.comment && <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{r.comment}</p>}
                      {r.reply && (
                        <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                          <span className="font-semibold text-slate-800">{t.name.split(" ")[0]} replied:</span> {r.reply}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-slate-600">{t.name.split(" ")[0]} is new on Sabina, so there are no reviews yet. Reviews come from students after real lessons.</p>
            )}
          </Section>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24">{priceCard}</div>
        </aside>
      </div>

      {/* Sticky price bar on phones */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl lg:hidden">
        <div>
          <p className="font-heading text-xl font-bold text-slate-900">
            {money(t.hourlyRate, currency)}
            <span className="text-sm font-medium text-slate-500"> / hour</span>
          </p>
          {t.trialPrice != null && <p className="text-xs font-medium text-emerald-700">Trial {money(t.trialPrice, currency)}</p>}
        </div>
        {canSave ? <div className="w-36"><SaveTutorButton tutorId={t.id} initialSaved={viewer.saved.has(t.id)} signedIn={viewer.signedIn} variant="full" /></div> : null}
      </div>
    </div>
  );
}
