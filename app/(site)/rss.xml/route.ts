import { getPayloadClient } from "@/cms/auth/session";
import { listPosts, siteSeo } from "@/cms/content/server";

export const revalidate = 600;

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]!);

/** RSS feed of the latest published blog posts (also served at /feed.xml). */
export async function GET() {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  const [seo, { posts }] = await Promise.all([siteSeo(), getPayloadClient().then((p) => listPosts(p, { limit: 50 }))]);
  const items = posts
    .map(
      (p) => `<item><title>${esc(p.title)}</title><link>${base}/blog/${p.slug}</link><guid isPermaLink="true">${base}/blog/${p.slug}</guid><pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description>${p.category ? `<category>${esc(p.category.name)}</category>` : ""}</item>`,
    )
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${esc(`${seo.name} blog`)}</title><link>${base}/blog</link><description>${esc(seo.description)}</description><language>en</language><atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=600" } });
}
