import Link from "next/link";
import { BadgeCheck, Languages, Sparkles, Star, Zap } from "lucide-react";
import type { PublicTutor } from "@/cms/marketplace/public";
import { money } from "@/lib/money";
import { SaveTutorButton } from "./SaveTutorButton";

export function TutorAvatar({ tutor, size, rounded = "rounded-2xl" }: { tutor: Pick<PublicTutor, "name" | "photo" | "photoLarge">; size: number; rounded?: string }) {
  const src = size > 120 ? tutor.photoLarge ?? tutor.photo : tutor.photo;
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" width={size} height={size} className={`${rounded} object-cover`} style={{ width: size, height: size }} loading="lazy" />
  ) : (
    <span className={`grid place-items-center ${rounded} bg-gradient-to-br from-brand-600 to-brand-900 font-heading font-bold text-white`} style={{ width: size, height: size, fontSize: size * 0.34 }} aria-hidden>
      {tutor.name
        .split(/\s+/)
        .map((w) => w[0])
        .join("")
        .replace(/[^A-Za-z]/g, "")
        .slice(0, 2)}
    </span>
  );
}

export function Rating({ tutor }: { tutor: Pick<PublicTutor, "rating" | "reviewCount"> }) {
  return tutor.reviewCount > 0 ? (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-900">
      <Star size={15} className="fill-amber-400 text-amber-400" /> {tutor.rating.toFixed(1)}
      <span className="font-normal text-slate-500">({tutor.reviewCount})</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
      <Sparkles size={12} /> New tutor
    </span>
  );
}

/** Marketplace card: photo, name, headline, subjects, languages, price. The whole card links to the profile. */
export function TutorCard({ tutor, currency, saved, signedIn, showSave = true }: { tutor: PublicTutor; currency: string; saved?: boolean; signedIn: boolean; showSave?: boolean }) {
  return (
    <article className="group relative flex flex-col rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-20px_rgba(20,32,156,0.35)] hover:ring-brand-200">
      <div className="flex gap-4">
        <div className="relative shrink-0">
          <TutorAvatar tutor={tutor} size={84} />
          {tutor.isSuperTutor && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-950 shadow">Super tutor</span>
          )}
        </div>
        <div className="min-w-0 flex-1 pr-10">
          <h3 className="flex items-center gap-1.5 font-heading text-lg font-bold text-slate-900">
            <Link href={`/tutors/${tutor.slug}`} className="truncate after:absolute after:inset-0 after:rounded-3xl focus-visible:outline-none">
              {tutor.name}
            </Link>
            {tutor.verified && <BadgeCheck size={18} className="shrink-0 text-brand-600" aria-label="Verified tutor" />}
          </h3>
          <p className="truncate text-sm text-slate-500">{[tutor.primarySubject?.name, tutor.country].filter(Boolean).join(" · ")}</p>
          <div className="mt-1.5">
            <Rating tutor={tutor} />
          </div>
        </div>
        {showSave && (
          <div className="absolute right-4 top-4 z-10">
            <SaveTutorButton tutorId={tutor.id} initialSaved={saved} signedIn={signedIn} />
          </div>
        )}
      </div>

      <p className="mt-4 line-clamp-2 min-h-[2.75rem] text-[15px] leading-relaxed text-slate-700">{tutor.headline}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {tutor.subjects.slice(0, 3).map((s) => (
          <span key={s.slug} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
            {s.name}
          </span>
        ))}
        {tutor.subjects.length > 3 && <span className="rounded-full px-1.5 py-1 text-xs font-medium text-slate-500">+{tutor.subjects.length - 3}</span>}
      </div>
      {tutor.languages.length > 0 && (
        <p className="mt-3 flex items-center gap-1.5 truncate text-sm text-slate-500">
          <Languages size={15} className="shrink-0" /> {tutor.languages.map((l) => l.name).join(", ")}
        </p>
      )}

      <div className="flex-1" />
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <div>
          <p className="font-heading text-2xl font-bold text-slate-900">
            {money(tutor.hourlyRate, currency)}
            <span className="text-sm font-medium text-slate-500"> / hour</span>
          </p>
          {tutor.trialPrice != null && <p className="text-xs font-medium text-emerald-700">Trial lesson {money(tutor.trialPrice, currency)}</p>}
        </div>
        <div className="flex items-center gap-2">
          {tutor.instantBooking && (
            <span className="text-amber-500" title="Instant booking">
              <Zap size={16} />
            </span>
          )}
          <span className="inline-flex h-10 items-center rounded-xl bg-brand-700 px-4 text-sm font-semibold text-white transition group-hover:bg-brand-800">View profile</span>
        </div>
      </div>
    </article>
  );
}
