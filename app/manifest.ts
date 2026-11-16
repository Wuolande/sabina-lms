import type { MetadataRoute } from "next";
import { getPlatformSeo } from "@/src/shared/seo/platformSeo";
import { BRAND_COLOURS } from "@/cms/brand";

export const dynamic = "force-dynamic";

/** Makes Sabina installable on phones and computers (Add to Home Screen / Install app). */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const seo = await getPlatformSeo().catch(() => null);
  return {
    id: "/",
    name: seo?.siteName ? `${seo.siteName}: live 1-on-1 lessons` : "Sabina: live 1-on-1 lessons",
    short_name: seo?.siteName?.split(" ")[0] || "Sabina",
    description: seo?.metaDescription || "Live 1-on-1 lessons with tutors our team has checked.",
    start_url: "/student?source=app",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: seo?.primaryColor || BRAND_COLOURS.primary,
    categories: ["education"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "My lessons", url: "/student/lessons", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Messages", url: "/student/messages", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Find a tutor", url: "/find-tutors", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
