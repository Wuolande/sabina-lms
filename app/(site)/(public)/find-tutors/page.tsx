import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import { getPayloadClient } from "@/cms/auth/session";
import { PAGE_SIZE, SORTS, searchTutors, type SearchParams } from "@/cms/marketplace/public";
import { marketplaceViewer } from "@/cms/marketplace/viewer";
import { TutorCard } from "@/components/marketplace/TutorCard";
import { FormSelect } from "@/components/ui/FormSelect";
import { lexicalToText } from "@/cms/content/rich";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<SearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const payload = await getPayloadClient();
  const subject = sp.subject ? (await payload.find({ collection: "subjects", where: { slug: { equals: sp.subject } }, limit: 1, depth: 0 })).docs[0] : null;
  const title = subject ? `${subject.name} tutors online` : "Find a tutor";
  return {
    title,
    description: subject
      ? `Book a verified ${subject.name} tutor for live 1-to-1 online lessons. Compare prices, read profiles and start with a discounted trial.`
      : "Browse verified tutors for live 1-to-1 online lessons. Filter by subject, level, language and price, and book a discounted trial lesson.",
    alternates: { canonical: subject ? `/find-tutors?subject=${subject.slug}` : "/find-tutors" },
  };
}

const LEVELS = [
  { value: "primary", label: "Primary school" },
  { value: "secondary", label: "Secondary school" },
  { value: "university", label: "University" },
  { value: "adult", label: "Adults" },
  { value: "exam", label: "Exam prep" },
];
const PRICES: { label: string; min?: number; max?: number }[] = [
  { label: "Any price" },
  { label: "Under 15", max: 15 },
  { label: "15 – 30", min: 15, max: 30 },
  { label: "30 – 50", min: 30, max: 50 },
  { label: "50+", min: 50 },
];


export default async function FindTutorsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const payload = await getPayloadClient();
  const [result, subjects, languages, viewer] = await Promise.all([
    searchTutors(payload, sp),
    payload.find({ collection: "subjects", where: { isActive: { equals: true } }, sort: "name", limit: 300, depth: 0, pagination: false }),
    payload.find({ collection: "languages", where: { isActive: { equals: true } }, sort: "name", limit: 200, depth: 0, pagination: false }),
    marketplaceViewer(payload),
  ]);
  const { tutors, total, page, pages, subject, policies } = result;
  const currency = policies.currency;
  const priceKey = PRICES.findIndex((p) => String(p.min ?? "") === (sp.min ?? "") && String(p.max ?? "") === (sp.max ?? ""));

  const href = (patch: Partial<SearchParams>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, page: undefined, ...patch })) if (v) next.set(k, String(v));
    const s = next.toString();
    return `/find-tutors${s ? `?${s}` : ""}`;
  };
  const active: { label: string; clear: Partial<SearchParams> }[] = [
    ...(sp.q ? [{ label: `“${sp.q}”`, clear: { q: undefined } }] : []),
    ...(subject ? [{ label: subject.name, clear: { subject: undefined } }] : []),
    ...(sp.level ? [{ label: LEVELS.find((l) => l.value === sp.level)?.label ?? sp.level, clear: { level: undefined } }] : []),
    ...(sp.language ? [{ label: `Speaks ${languages.docs.find((l) => l.code === sp.language)?.name ?? sp.language}`, clear: { language: undefined } }] : []),
    ...(priceKey > 0 ? [{ label: `${PRICES[priceKey]!.label} ${currency}`, clear: { min: undefined, max: undefined } }] : []),
    ...(sp.trial === "1" ? [{ label: "Offers a trial", clear: { trial: undefined } }] : []),
  ];

  const filters = (
    <>
      <input type="hidden" name="q" value={sp.q ?? ""} />
      <div className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</span>
        <FormSelect name="subject" aria-label="Subject" defaultValue={sp.subject ?? ""} placeholder="All subjects" searchPlaceholder="Search subjects" options={subjects.docs.map((s) => ({ value: String(s.slug), label: s.name }))} />
      </div>
      <div className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Level</span>
        <FormSelect name="level" aria-label="Level" defaultValue={sp.level ?? ""} placeholder="Any level" options={LEVELS.map((l) => ({ value: l.value, label: l.label }))} />
      </div>
      <div className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tutor speaks</span>
        <FormSelect name="language" aria-label="Tutor speaks" defaultValue={sp.language ?? ""} placeholder="Any language" searchPlaceholder="Search languages" options={languages.docs.map((l) => ({ value: l.code, label: l.name }))} />
      </div>
      <fieldset className="space-y-1.5">
        <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price per hour ({currency})</legend>
        <div className="grid grid-cols-2 gap-1.5">
          {PRICES.map((p, i) => (
            <Link
              key={p.label}
              href={href({ min: p.min?.toString(), max: p.max?.toString() })}
              className={`rounded-lg px-2.5 py-2 text-center text-sm font-medium ring-1 ${i === Math.max(0, priceKey) ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-slate-700 ring-slate-200 hover:ring-slate-300"} ${i === 0 ? "col-span-2" : ""}`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </fieldset>
      <input type="hidden" name="min" value={sp.min ?? ""} />
      <input type="hidden" name="max" value={sp.max ?? ""} />
      <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700">
        <input type="checkbox" name="trial" value="1" defaultChecked={sp.trial === "1"} className="h-4 w-4 rounded border-slate-300 accent-brand-700" />
        Offers a trial lesson
      </label>
      <input type="hidden" name="sort" value={sp.sort ?? ""} />
      <button type="submit" className="h-11 w-full rounded-xl bg-brand-700 text-sm font-semibold text-white hover:bg-brand-800">
        Apply filters
      </button>
    </>
  );

  return (
    <div className="bg-[#F6F7FB]">
      {/* Header + search */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 text-white">
        <div aria-hidden className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-400/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-5xl">{subject ? `${subject.name} tutors` : "Find your tutor"}</h1>
          <p className="mt-3 max-w-2xl text-white/75 sm:text-lg">{lexicalToText(subject?.description) || "Every tutor is interviewed and ID-verified. Learn live, 1-to-1, in our online classroom."}</p>
          <form action="/find-tutors" className="mt-7 flex max-w-2xl gap-2 rounded-2xl bg-white p-2 shadow-xl">
            {sp.subject && <input type="hidden" name="subject" value={sp.subject} />}
            <label className="flex flex-1 items-center gap-2 px-3">
              <Search size={18} className="shrink-0 text-slate-400" />
              <span className="sr-only">Search tutors</span>
              <input name="q" defaultValue={sp.q ?? ""} placeholder="Try “KCSE maths” or “IELTS”" className="h-11 w-full bg-transparent text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none" />
            </label>
            <button type="submit" className="h-11 shrink-0 rounded-xl bg-accent-400 px-5 text-sm font-semibold text-brand-950 hover:bg-accent-300">
              Search
            </button>
          </form>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          {/* Filters: sidebar on desktop, collapsible on phones */}
          <aside className="min-w-0">
            <details className="group rounded-2xl bg-white ring-1 ring-slate-200/70 lg:hidden">
              <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-slate-800">
                <span className="inline-flex items-center gap-2">
                  <SlidersHorizontal size={16} /> Filters {active.length ? `(${active.length})` : ""}
                </span>
                <span className="text-slate-400 transition group-open:rotate-180">⌄</span>
              </summary>
              <form action="/find-tutors" className="space-y-5 border-t border-slate-100 p-4">
                {filters}
              </form>
            </details>
            <form action="/find-tutors" className="hidden space-y-5 rounded-3xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/70 lg:sticky lg:top-24 lg:block">
              <h2 className="font-heading text-base font-semibold text-slate-900">Filters</h2>
              {filters}
            </form>
          </aside>

          <div className="min-w-0 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                <b className="text-slate-900">{total}</b> {total === 1 ? "tutor" : "tutors"} available
              </p>
              <nav aria-label="Sort" className="flex flex-wrap gap-1.5">
                {Object.entries(SORTS).map(([key, s]) => (
                  <Link
                    key={key}
                    href={href({ sort: key === "recommended" ? undefined : key })}
                    aria-current={result.sort === key ? "true" : undefined}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${result.sort === key ? "bg-slate-900 text-white ring-slate-900" : "bg-white text-slate-600 ring-slate-200 hover:text-slate-900"}`}
                  >
                    {s.label}
                  </Link>
                ))}
              </nav>
            </div>

            {active.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {active.map((a) => (
                  <Link key={a.label} href={href(a.clear)} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 ring-1 ring-brand-200 hover:bg-brand-100">
                    {a.label} <X size={13} />
                  </Link>
                ))}
                <Link href="/find-tutors" className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                  Clear all
                </Link>
              </div>
            )}

            {tutors.length ? (
              <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {tutors.map((t) => (
                  <TutorCard key={t.id} tutor={t} currency={currency} saved={viewer.saved.has(t.id)} signedIn={viewer.signedIn} showSave={!viewer.signedIn || viewer.isStudent} />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl bg-white p-10 text-center ring-1 ring-slate-200/70">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-700">
                  <Search size={26} />
                </span>
                <h2 className="mt-4 font-heading text-xl font-bold text-slate-900">No tutors match yet</h2>
                <p className="mx-auto mt-2 max-w-md text-slate-500">
                  {active.length ? "Try removing a filter or searching for something broader." : "We're onboarding new tutors every week. Check back soon, or apply to teach."}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {active.length > 0 && (
                    <Link href="/find-tutors" className="inline-flex h-11 items-center rounded-xl bg-brand-700 px-5 text-sm font-semibold text-white hover:bg-brand-800">
                      Clear filters
                    </Link>
                  )}
                  <Link href="/become-a-tutor" className="inline-flex h-11 items-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50">
                    Become a tutor
                  </Link>
                </div>
              </div>
            )}

            {pages > 1 && (
              <nav aria-label="Pages" className="flex items-center justify-center gap-2 pt-4">
                <Link aria-disabled={page <= 1} href={href({ page: String(page - 1) })} className={`inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold ring-1 ring-slate-200 ${page <= 1 ? "pointer-events-none opacity-40" : "bg-white hover:bg-slate-50"}`}>
                  <ChevronLeft size={16} /> Previous
                </Link>
                <span className="px-2 text-sm text-slate-600">
                  Page {page} of {pages}
                </span>
                <Link aria-disabled={page >= pages} href={href({ page: String(page + 1) })} className={`inline-flex h-10 items-center gap-1 rounded-xl px-3 text-sm font-semibold ring-1 ring-slate-200 ${page >= pages ? "pointer-events-none opacity-40" : "bg-white hover:bg-slate-50"}`}>
                  Next <ChevronRight size={16} />
                </Link>
              </nav>
            )}
            <p className="sr-only">{PAGE_SIZE} tutors per page</p>
          </div>
        </div>
      </div>
    </div>
  );
}
