import { NextResponse } from "next/server";
import { serverBlogService } from "@/src/modules/blog/services/blogService";
import { getPlatformSeo } from "@/src/shared/seo/platformSeo";

export const dynamic = "force-dynamic";

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  const seo = await getPlatformSeo();

  let posts: any[] = [];
  try {
    const res = await serverBlogService.getPublishedPosts({ pageSize: 50 });
    posts = res.posts || [];
  } catch (err) {
    console.error("[RSS Route] Error fetching posts for RSS:", err);
  }

  const siteTitle = escapeXml(seo.metaTitle || "Sabina Education — Global 1-on-1 Online Tutoring");
  const siteDescription = escapeXml(
    seo.metaDescription || "Master any subject with top 1% certified educators worldwide. Live interactive lessons."
  );
  const now = new Date().toUTCString();

  const itemsXml = posts
    .map((post) => {
      const postUrl = `${baseUrl}/blog/${post.slug}`;
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : post.createdAt
        ? new Date(post.createdAt).toUTCString()
        : now;
      const author = escapeXml(post.author || "Sabina Editorial");
      const coverImage = post.coverImage;

      return `    <item>
      <title><![CDATA[${post.title || "Untitled Article"}]]></title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>${author}</author>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <content:encoded><![CDATA[${post.content || ""}]]></content:encoded>
      ${coverImage ? `<enclosure url="${coverImage}" type="image/jpeg" />` : ""}
      ${post.category ? `<category><![CDATA[${post.category}]]></category>` : ""}
    </item>`;
    })
    .join("\n");

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${siteTitle}</title>
    <link>${baseUrl}</link>
    <description>${siteDescription}</description>
    <language>en-us</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;

  return new NextResponse(rssXml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
