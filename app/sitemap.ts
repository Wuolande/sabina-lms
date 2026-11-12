import type { MetadataRoute } from "next";
import { getPayloadClient } from "@/cms/auth/session";

export const revalidate = 3600;

/** Public pages, approved tutor profiles, subjects, published posts and pages. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  const now = new Date();
  const fixed: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    ...["/find-tutors", "/subjects", "/how-it-works", "/become-a-tutor", "/blog"].map((p) => ({ url: `${base}${p}`, lastModified: now, changeFrequency: "daily" as const, priority: 0.9 })),
  ];
  try {
    const payload = await getPayloadClient();
    const [tutors, subjects, posts, pages] = await Promise.all([
      payload.find({ collection: "tutor-profiles", where: { status: { equals: "approved" } }, limit: 5000, pagination: false, depth: 0, select: { slug: true, updatedAt: true }, overrideAccess: true }),
      payload.find({ collection: "subjects", limit: 500, pagination: false, depth: 0, select: { slug: true, updatedAt: true }, overrideAccess: true }),
      payload.find({ collection: "posts", where: { and: [{ status: { equals: "published" } }, { publishedAt: { less_than_equal: now.toISOString() } }] }, limit: 5000, pagination: false, depth: 0, select: { slug: true, updatedAt: true }, overrideAccess: true }),
      payload.find({ collection: "pages", where: { status: { equals: "published" } }, limit: 500, pagination: false, depth: 0, select: { slug: true, updatedAt: true, seo: true }, overrideAccess: true }),
    ]);
    const standard = new Set(["about", "pricing", "terms", "privacy", "cookies", "refund-policy"]);
    return [
      ...fixed,
      ...["/about", "/pricing", "/terms", "/privacy", "/cookies", "/refund-policy"].map((p) => ({ url: `${base}${p}`, changeFrequency: "monthly" as const, priority: 0.5 })),
      ...tutors.docs.filter((t) => t.slug).map((t) => ({ url: `${base}/tutors/${t.slug}`, lastModified: new Date(t.updatedAt), changeFrequency: "weekly" as const, priority: 0.8 })),
      ...subjects.docs.filter((s) => s.slug).map((s) => ({ url: `${base}/subjects/${s.slug}`, lastModified: new Date(s.updatedAt), changeFrequency: "weekly" as const, priority: 0.7 })),
      ...posts.docs.filter((p) => p.slug).map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "monthly" as const, priority: 0.6 })),
      ...pages.docs.filter((p) => p.slug && !standard.has(p.slug) && !p.seo?.noIndex).map((p) => ({ url: `${base}/pages/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "monthly" as const, priority: 0.4 })),
    ];
  } catch {
    return fixed;
  }
}
