/**
 * Site-wide SEO from Payload (admin → Settings → Site settings → Search and sharing).
 * Kept with the old shape so the root layout keeps working.
 */
import { maybePayload, mediaUrl, siteSeo } from "@/cms/content/server";
import { brandColours, type BrandColours } from "@/cms/brand";

export interface PlatformSeoConfig {
  colours: BrandColours;
  siteName: string;
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
  const g = (payload ? await payload.findGlobal({ slug: "site-settings", depth: 1, overrideAccess: true }).catch(() => null) : null) as { brand?: { logo?: unknown; icon?: unknown; colours?: Record<string, unknown> } } | null;
  const colours = brandColours(g?.brand?.colours);
  return {
    colours,
    siteName: seo.name,
    primaryColor: colours.primary,
    secondaryColor: colours.accent,
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
