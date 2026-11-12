/**
 * Site-wide SEO from Payload (admin → Settings → Site settings → Search and sharing).
 * Kept with the old shape so the root layout keeps working.
 */
import { maybePayload, mediaUrl, siteSeo } from "@/cms/content/server";

export interface PlatformSeoConfig {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  faviconUrl: string;
  appleTouchIconUrl: string;
  ogImageUrl: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  googleSiteVerification: string;
  bingSiteVerification: string;
  twitterHandle: string;
  allowIndexing: boolean;
}

export async function getPlatformSeo(): Promise<PlatformSeoConfig> {
  const seo = await siteSeo();
  const payload = await maybePayload();
  const g = (payload ? await payload.findGlobal({ slug: "site-settings", depth: 1, overrideAccess: true }).catch(() => null) : null) as { brand?: { logo?: unknown; icon?: unknown; colours?: { primary?: string; accent?: string } } } | null;
  return {
    primaryColor: g?.brand?.colours?.primary || "#14209C",
    secondaryColor: g?.brand?.colours?.accent || "#F9C31C",
    logoUrl: mediaUrl(g?.brand?.logo) ?? "",
    faviconUrl: mediaUrl(g?.brand?.icon) ?? "",
    appleTouchIconUrl: mediaUrl(g?.brand?.icon) ?? "",
    ogImageUrl: seo.image ?? "",
    metaTitle: seo.title,
    metaDescription: seo.description,
    keywords: ["online tutoring", "private tutor", "KCSE tutor", "maths tutor", "IELTS preparation", "learn English online"],
    googleSiteVerification: seo.google ?? "",
    bingSiteVerification: seo.bing ?? "",
    twitterHandle: seo.twitter ?? "",
    allowIndexing: seo.index,
  };
}
