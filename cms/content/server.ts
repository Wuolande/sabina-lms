import "server-only";
import { cache } from "react";
import type { Payload, Where } from "payload";
import type { BlogCategory, HomePage, Media, Page, Post, User } from "@/payload-types";
import { getPayloadClient } from "../auth/session";
import { getPolicies } from "../tutors/server";
import { DEFAULT_PAGES, HOME_DEFAULTS } from "./defaults";
import { PLATFORM_DEFAULTS } from "../globals/PlatformSettings";

/* ------------------------------------------------------------------ rules in copy */

/** Payload, or null when it can't start (e.g. during a build without database access). */
export async function maybePayload(): Promise<Payload | null> {
  try {
    return await getPayloadClient();
  } catch (err) {
    console.warn("[content] Payload unavailable, using default content:", err instanceof Error ? err.message : err);
    return null;
  }
}

export async function contentRules(payload: Payload | null) {
  const p = payload ? await getPolicies(payload) : (PLATFORM_DEFAULTS as typeof PLATFORM_DEFAULTS & Record<string, unknown>);
  return {
    cancelHours: Number(p.cancellationRefundHours),
    trialMinutes: Number(p.trialLessonMinutes),
    tutorShare: 100 - Number(p.platformFeePercent),
    earlyJoin: Number(p.classroomEarlyJoinMinutes),
    lateRefund: Number(p.lateCancellationRefundPercent ?? 0),
    lateRefundSentence: Number(p.lateCancellationRefundPercent ?? 0) > 0 ? `${Number(p.lateCancellationRefundPercent)}% of the price is refunded` : "the lesson isn't refunded",
  };
}
type Rules = Awaited<ReturnType<typeof contentRules>>;

/** Replace {tokens} in every string inside a value (works on Lexical JSON too). */
export function fill<T>(value: T, rules: Rules): T {
  if (typeof value === "string") return value.replace(/\{(cancelHours|trialMinutes|tutorShare|earlyJoin|lateRefundSentence|lateRefund)\}/g, (_, k: keyof Rules) => String(rules[k])) as T;
  if (Array.isArray(value)) return value.map((v) => fill(v, rules)) as T;
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, rules)])) as T;
  return value;
}

export const mediaUrl = (m: unknown, size?: "card" | "thumb") =>
  m && typeof m === "object" ? ((size && (m as Media).sizes?.[size]?.url) || (m as Media).url || null) : null;

/* ------------------------------------------------------------------ homepage */

const pick = <T,>(v: T | null | undefined, d: T): T => (v === null || v === undefined || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length) ? d : v);
type Counter = { value: number | string; suffix?: string | null; decimals?: number | null; label: string };
/** Each part of a counter falls back on its own, so an empty number can follow the platform rules. */
const counter = (c: Partial<Counter> | null | undefined, d: Counter) => {
  const value = c?.value !== null && c?.value !== undefined && c.value !== "" ? c.value : d.value;
  return { value: Number(value) || 0, suffix: c?.suffix || d.suffix || " ", decimals: c?.decimals ?? d.decimals ?? 0, label: c?.label || d.label };
};

/** Homepage content in the shape the homepage component reads, with defaults and live numbers. */
export async function homeContent(payload: Payload | null) {
  const [g, rules] = await Promise.all([(payload ? payload.findGlobal({ slug: "home-page", depth: 1, overrideAccess: true }).catch(() => null) : Promise.resolve(null)) as Promise<HomePage | null>, contentRules(payload)]);
  const D = fill(HOME_DEFAULTS, rules);
  // First visit after set-up: copy the default content into the Homepage editor so it can be edited.
  if (payload && g && !g.hero?.pretitle && !g.hero?.headlines?.length) void import("./seed-home").then((m) => m.seedHomePage(payload)).catch(() => undefined);
  const h: NonNullable<HomePage["hero"]> = g?.hero ?? {};
  const s: NonNullable<HomePage["stats"]> = g?.stats ?? {};
  const x: NonNullable<HomePage["sections"]> = g?.sections ?? {};

  const reviews = payload
    ? await payload.find({ collection: "reviews", where: { status: { equals: "published" } }, limit: 5000, pagination: false, depth: 0, select: { rating: true }, overrideAccess: true }).catch(() => ({ docs: [] as { rating?: number | null }[] }))
    : { docs: [] as { rating?: number | null }[] };
  const n = reviews.docs.length;
  const avg = n ? reviews.docs.reduce((t, r) => t + (r.rating ?? 0), 0) / n : 0;

  let stats = {
    stat1: counter(s.stat1 as Counter, D.stats.stat1 as Counter),
    stat2: counter(s.stat2 as Counter, D.stats.stat2 as Counter),
    stat3: counter(s.stat3 as Counter, D.stats.stat3 as Counter),
    stat4: counter(s.stat4 as Counter, D.stats.stat4 as Counter),
  };
  if (s.live && payload) {
    const [tutors, students, lessons] = await Promise.all([
      payload.count({ collection: "tutor-profiles", where: { status: { equals: "approved" } }, overrideAccess: true }),
      payload.count({ collection: "users", where: { role: { equals: "student" } }, overrideAccess: true }),
      payload.count({ collection: "bookings", where: { status: { equals: "completed" } }, overrideAccess: true }),
    ]);
    stats = {
      stat1: { value: tutors.totalDocs, suffix: " ", decimals: 0, label: "Approved tutors" },
      stat2: { value: students.totalDocs, suffix: " ", decimals: 0, label: "Students" },
      stat3: { value: lessons.totalDocs, suffix: " ", decimals: 0, label: "Lessons taught" },
      stat4: { value: Math.round(avg * 10) / 10, suffix: " ★", decimals: 1, label: `Average rating from ${n} reviews` },
    };
  }

  const steps = pick(x.steps?.items, D.sections.steps.items);
  return {
    heroSection: fill(
      {
        pretitle: pick(h.pretitle, D.hero.pretitle),
        typewriterHeadlines: pick(h.headlines?.map((r) => r.text), D.hero.headlines),
        subheading: pick(h.subheading, D.hero.subheading),
        searchPlaceholder: pick(h.searchPlaceholder, D.hero.searchPlaceholder),
        popularTags: pick(h.popularTags?.map((t) => ({ label: t.label, slug: t.slug })), D.hero.popularTags),
        socialProofCount: n >= 5 ? `${pick(h.proofText, D.hero.proofText)} · ${n} reviews` : pick(h.proofText, D.hero.proofText),
        socialProofRating: n >= 5 ? avg.toFixed(1) : "",
        heroStudentImage: mediaUrl(h.image) ?? undefined,
        floatingCard1: counter(h.card1 as Counter, D.hero.card1 as Counter),
        floatingCard2: counter(h.card2 as Counter, D.hero.card2 as Counter),
        floatingCard3: counter(h.card3 as Counter, D.hero.card3 as Counter),
      },
      rules,
    ),
    statsSection: stats,
    categoriesSection: fill({ pretitle: pick(x.subjects?.pretitle, D.sections.subjects.pretitle), title: pick(x.subjects?.title, D.sections.subjects.title), ctaText: pick(x.subjects?.cta, D.sections.subjects.cta) }, rules),
    featuredTutorsSection: fill({ pretitle: pick(x.tutors?.pretitle, D.sections.tutors.pretitle), title: pick(x.tutors?.title, D.sections.tutors.title), ctaText: pick(x.tutors?.cta, D.sections.tutors.cta) }, rules),
    classroomTourSection: fill({ badge: pick(x.classroom?.badge, D.sections.classroom.badge), title: pick(x.classroom?.title, D.sections.classroom.title), subtitle: pick(x.classroom?.subtitle, D.sections.classroom.subtitle) }, rules),
    howItWorksSection: fill(
      { pretitle: pick(x.steps?.pretitle, D.sections.steps.pretitle), title: pick(x.steps?.title, D.sections.steps.title), steps: steps.map((st, i) => ({ num: String(i + 1).padStart(2, "0"), title: st.title, desc: st.text })) },
      rules,
    ),
    becomeTutorSection: fill(
      {
        badge: pick(x.teach?.badge, D.sections.teach.badge),
        title: pick(x.teach?.title, D.sections.teach.title),
        subtitle: pick(x.teach?.subtitle, D.sections.teach.subtitle),
        bulletPoints: pick(x.teach?.points?.map((p) => p.text), D.sections.teach.points),
        ctaButtonText: pick(x.teach?.cta, D.sections.teach.cta),
        secondaryButtonText: pick(x.teach?.secondary, D.sections.teach.secondary),
      },
      rules,
    ),
    faqSection: fill({ pretitle: pick(x.faq?.pretitle, D.sections.faq.pretitle), title: pick(x.faq?.title, D.sections.faq.title), faqs: pick(x.faq?.items?.map((f) => ({ q: f.q, a: f.a })), D.sections.faq.items) }, rules),
  };
}

/* ------------------------------------------------------------------ pages */

/** A published page. The standard pages (about, pricing, legal) are created from defaults on first visit. */
export const pageBySlug = cache(async (slug: string) => {
  const payload = await maybePayload();
  if (!payload) {
    // No database (e.g. a build without access): show the standard page's default text.
    const d = DEFAULT_PAGES[slug];
    if (!d) return null;
    const now = new Date().toISOString();
    return fill({ id: 0, slug, title: d.title, intro: d.intro, kind: d.kind, status: "published", body: d.body, updatedAt: now, createdAt: now } as unknown as Page, await contentRules(null));
  }
  let page = (await payload.find({ collection: "pages", where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: true })).docs[0] as Page | undefined;
  if (!page && DEFAULT_PAGES[slug]) {
    const d = DEFAULT_PAGES[slug]!;
    page = (await payload.create({ collection: "pages", data: { slug, title: d.title, intro: d.intro, kind: d.kind, status: "published", body: d.body }, overrideAccess: true }).catch(async () =>
      // Two first visits at once: the other request created it.
      (await payload.find({ collection: "pages", where: { slug: { equals: slug } }, limit: 1, depth: 1, overrideAccess: true })).docs[0],
    )) as Page | undefined;
  }
  if (!page || page.status !== "published") return null;
  return fill(page, await contentRules(payload));
});

/* ------------------------------------------------------------------ blog */

import type { PostCard } from "./types";
export type { PostCard };

const live = (): Where => ({ and: [{ status: { equals: "published" } }, { publishedAt: { less_than_equal: new Date().toISOString() } }] });
const authorName = (u: unknown) => (u && typeof u === "object" ? ((u as User).name || [(u as User).firstName, (u as User).lastName].filter(Boolean).join(" ") || null) : null);

export const toCard = (p: Post): PostCard => ({
  id: p.id,
  slug: p.slug ?? String(p.id),
  title: p.title,
  excerpt: p.excerpt,
  cover: mediaUrl(p.cover, "card"),
  category: p.category && typeof p.category === "object" ? { name: (p.category as BlogCategory).name, slug: (p.category as BlogCategory).slug ?? "" } : null,
  author: authorName(p.author),
  authorTitle: p.authorTitle ?? null,
  publishedAt: p.publishedAt ?? p.createdAt,
  minutes: p.readingMinutes ?? 1,
  featured: Boolean(p.featured),
});

export async function listPosts(payload: Payload, opts: { category?: string; page?: number; limit?: number } = {}) {
  const where: Where[] = [live()];
  if (opts.category) where.push({ "category.slug": { equals: opts.category } });
  const r = await payload.find({ collection: "posts", where: { and: where }, sort: "-publishedAt", page: opts.page ?? 1, limit: opts.limit ?? 12, depth: 1, overrideAccess: true });
  return { posts: r.docs.map(toCard), page: r.page ?? 1, pages: r.totalPages, total: r.totalDocs };
}

export async function blogCategories(payload: Payload) {
  const r = await payload.find({ collection: "blog-categories", sort: "order", limit: 50, depth: 0, overrideAccess: true });
  return r.docs.map((c) => ({ name: c.name, slug: c.slug ?? "" }));
}

export const postBySlug = cache(async (slug: string) => {
  const payload = await maybePayload();
  if (!payload) return null;
  const p = (await payload.find({ collection: "posts", where: { and: [live(), { slug: { equals: slug } }] }, limit: 1, depth: 1, overrideAccess: true })).docs[0];
  if (!p) return null;
  const cat = p.category && typeof p.category === "object" ? p.category.id : null;
  const related = await payload.find({ collection: "posts", where: { and: [live(), { id: { not_equals: p.id } }, ...(cat ? [{ category: { equals: cat } }] : [])] }, sort: "-publishedAt", limit: 3, depth: 1, overrideAccess: true });
  return { post: p, card: toCard(p), related: related.docs.map(toCard) };
});

/* ------------------------------------------------------------------ SEO */

export const siteSeo = cache(async () => {
  const payload = await maybePayload();
  const g = payload && await payload.findGlobal({ slug: "site-settings", depth: 1, overrideAccess: true }).catch(() => null);
  const seo = (g as { seo?: Record<string, unknown> } | null)?.seo ?? {};
  return {
    name: (g as { platformName?: string } | null)?.platformName || "Sabina Education",
    title: (seo.title as string) || "Sabina: live 1-on-1 tutoring with verified tutors",
    description: (seo.description as string) || "Find a tutor for maths, sciences, languages, KCSE and IELTS. Book a time that suits you and learn live in your browser.",
    image: mediaUrl(seo.image),
    twitter: (seo.twitter as string) || null,
    google: (seo.googleVerification as string) || null,
    bing: (seo.bingVerification as string) || null,
    index: seo.allowIndexing !== false,
  };
});
