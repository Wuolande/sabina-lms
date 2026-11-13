import "server-only";
import type { Payload, Where } from "payload";
import type { Media, Subject, TutorProfile, Language } from "@/payload-types";
import { getPolicies } from "../tutors/server";
import { lexicalToText, type Lexical } from "../content/rich";

/** Everything the public marketplace shows about a tutor (no private fields). */
export type PublicTutor = {
  id: number;
  slug: string;
  name: string;
  headline: string;
  about: Lexical | null;
  teachingStyle: Lexical | null;
  photo: string | null;
  photoLarge: string | null;
  country: string | null;
  timezone: string | null;
  hourlyRate: number;
  offersTrial: boolean;
  trialPrice: number | null;
  /** Biggest package discount on offer (percent), if the tutor sells packages. */
  packageSaving: number | null;
  instantBooking: boolean;
  primarySubject: { id: number; name: string; slug: string } | null;
  subjects: { id: number; name: string; slug: string }[];
  languages: { name: string; level: string }[];
  levelsTaught: string[];
  rating: number;
  reviewCount: number;
  lessonsTaught: number;
  isFeatured: boolean;
  isSuperTutor: boolean;
  verified: boolean;
  introVideoUrl: string | null;
  education: { degree: string; institution: string; field?: string | null; endYear?: number | null; verified: boolean }[];
  certifications: { title: string; issuer: string; year?: number | null; verified: boolean }[];
  experience: { role: string; organization: string; startYear?: number | null; endYear?: number | null; description?: Lexical | null }[];
  joinedAt: string | null;
};

export type Policies = Awaited<ReturnType<typeof getPolicies>>;

const sub = (s: unknown) => (s && typeof s === "object" ? { id: (s as Subject).id, name: (s as Subject).name, slug: String((s as Subject).slug) } : null);

export function toPublicTutor(t: TutorProfile, policies: Policies): PublicTutor {
  const photo = t.photo && typeof t.photo === "object" ? (t.photo as Media) : null;
  const rate = t.hourlyRate ?? 0;
  return {
    id: t.id,
    slug: String(t.slug),
    name: t.displayName ?? "Tutor",
    headline: t.headline ?? "",
    about: (t.about as Lexical | null) ?? null,
    teachingStyle: (t.teachingStyle as Lexical | null) ?? null,
    photo: photo?.sizes?.thumb?.url ?? photo?.url ?? null,
    photoLarge: photo?.sizes?.card?.url ?? photo?.url ?? null,
    country: t.country ?? null,
    timezone: t.timezone ?? null,
    hourlyRate: rate,
    offersTrial: Boolean(t.offersTrial),
    trialPrice: t.offersTrial && rate ? Math.round(((rate * policies.trialLessonMinutes) / 60) * (1 - policies.trialLessonDiscountPercent / 100) * 100) / 100 : null,
    packageSaving: policies.packagesEnabled && (t.packages ?? []).length ? Math.min(Number(policies.packageMaxDiscountPercent ?? 25), Math.max(...(t.packages ?? []).map((k) => Number(k.discountPercent) || 0))) || null : null,
    instantBooking: Boolean(t.instantBooking),
    primarySubject: sub(t.primarySubject),
    subjects: (t.subjects ?? []).map(sub).filter(Boolean) as { id: number; name: string; slug: string }[],
    languages: (t.languages ?? []).filter((l) => l.language && typeof l.language === "object").map((l) => ({ name: (l.language as Language).name, level: l.level })),
    levelsTaught: t.levelsTaught ?? [],
    rating: t.stats?.rating ?? 0,
    reviewCount: t.stats?.reviewCount ?? 0,
    lessonsTaught: t.stats?.lessonsTaught ?? 0,
    isFeatured: Boolean(t.isFeatured),
    isSuperTutor: Boolean(t.isSuperTutor),
    verified: t.status === "approved",
    introVideoUrl: t.introVideoUrl || null,
    education: (t.education ?? []).map((e) => ({ degree: e.degree, institution: e.institution, field: e.field, endYear: e.endYear, verified: Boolean(e.verified) })),
    certifications: (t.certifications ?? []).map((c) => ({ title: c.title, issuer: c.issuer, year: c.year, verified: Boolean(c.verified) })),
    experience: (t.experience ?? []).map((x) => ({ role: x.role, organization: x.organization, startYear: x.startYear, endYear: x.endYear, description: (x.description as Lexical | null) ?? null })),
    joinedAt: t.approvedAt ?? null,
  };
}

export type SearchParams = { q?: string; subject?: string; level?: string; language?: string; min?: string; max?: string; sort?: string; page?: string; trial?: string };
export const SORTS = {
  recommended: { label: "Recommended", sort: ["-isFeatured", "-stats.rating", "-approvedAt"] },
  rating: { label: "Highest rated", sort: ["-stats.rating", "-stats.reviewCount"] },
  price_asc: { label: "Price: low to high", sort: ["hourlyRate"] },
  price_desc: { label: "Price: high to low", sort: ["-hourlyRate"] },
  newest: { label: "Newest", sort: ["-approvedAt"] },
} as const;
export const PAGE_SIZE = 12;

/** Public tutor search. Runs with public (anonymous) access, so only approved tutors and public fields come back. */
export async function searchTutors(payload: Payload, params: SearchParams) {
  const and: Where[] = [{ status: { equals: "approved" } }];
  const q = params.q?.trim().slice(0, 80);
  let subject: Subject | null = null;
  if (params.subject) {
    const s = await payload.find({ collection: "subjects", where: { slug: { equals: params.subject } }, limit: 1, depth: 0, overrideAccess: false });
    subject = s.docs[0] ?? null;
    and.push({ subjects: { in: subject ? [subject.id] : [-1] } });
  }
  if (q) {
    // Free text also matches subject names.
    const subs = await payload.find({ collection: "subjects", where: { name: { like: q } }, limit: 20, depth: 0, overrideAccess: false });
    and.push({
      or: [
        { displayName: { like: q } },
        { headline: { like: q } },
        { aboutText: { like: q } },
        ...(subs.docs.length ? [{ subjects: { in: subs.docs.map((s) => s.id) } }] : []),
      ],
    });
  }
  if (params.level) and.push({ levelsTaught: { in: [params.level] } });
  if (params.language) {
    const l = await payload.find({ collection: "languages", where: { code: { equals: params.language } }, limit: 1, depth: 0, overrideAccess: false });
    and.push({ "languages.language": { in: l.docs[0] ? [l.docs[0].id] : [-1] } });
  }
  const min = Number(params.min), max = Number(params.max);
  if (params.min && Number.isFinite(min)) and.push({ hourlyRate: { greater_than_equal: min } });
  if (params.max && Number.isFinite(max)) and.push({ hourlyRate: { less_than_equal: max } });
  if (params.trial === "1") and.push({ offersTrial: { equals: true } });

  const sortKey = (params.sort && params.sort in SORTS ? params.sort : "recommended") as keyof typeof SORTS;
  const page = Math.max(1, Math.min(500, Number(params.page) || 1));
  const [res, policies] = await Promise.all([
    payload.find({ collection: "tutor-profiles", where: { and }, sort: [...SORTS[sortKey].sort], page, limit: PAGE_SIZE, depth: 1, overrideAccess: false }),
    getPolicies(payload),
  ]);
  return { tutors: res.docs.map((t) => toPublicTutor(t, policies)), total: res.totalDocs, page: res.page ?? 1, pages: res.totalPages, subject, sort: sortKey, policies };
}

export async function getTutorBySlug(payload: Payload, slug: string) {
  const res = await payload.find({ collection: "tutor-profiles", where: { and: [{ slug: { equals: slug } }, { status: { equals: "approved" } }] }, limit: 1, depth: 1, overrideAccess: false });
  if (!res.docs[0]) return null;
  const policies = await getPolicies(payload);
  return { tutor: toPublicTutor(res.docs[0], policies), policies };
}

/** Active subjects with how many approved tutors teach each. */
export async function subjectsWithCounts(payload: Payload) {
  const [subjects, tutors] = await Promise.all([
    payload.find({ collection: "subjects", where: { isActive: { equals: true } }, sort: "sortOrder", limit: 300, depth: 0, pagination: false, overrideAccess: false }),
    payload.find({ collection: "tutor-profiles", where: { status: { equals: "approved" } }, limit: 5000, depth: 0, pagination: false, select: { subjects: true }, overrideAccess: false }),
  ]);
  const counts = new Map<number, number>();
  for (const t of tutors.docs) for (const s of t.subjects ?? []) {
    const id = typeof s === "object" ? s.id : s;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return subjects.docs.map((s) => ({ id: s.id, name: s.name, slug: String(s.slug), category: s.category, description: lexicalToText(s.description), icon: s.icon ?? "BookOpen", isFeatured: Boolean(s.isFeatured), tutorCount: counts.get(s.id) ?? 0 }));
}
export type SubjectSummary = Awaited<ReturnType<typeof subjectsWithCounts>>[number];
