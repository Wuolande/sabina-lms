import type { MetadataRoute } from "next";
import { siteSeo } from "@/cms/content/server";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  const { index } = await siteSeo().catch(() => ({ index: true }));
  if (!index) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/student", "/tutor", "/lessons/", "/checkout/"] },
    sitemap: `${base}/sitemap.xml`,
  };
}
