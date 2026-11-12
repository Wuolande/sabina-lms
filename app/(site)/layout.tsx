import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";
import { ModalProvider } from "@/components/ui/modal-context";
import { LogoProvider } from "@/components/ui/LogoContext";
import { ThemeSynchronizer } from "@/components/ui/ThemeSynchronizer";
import { getPlatformSeo } from "@/src/shared/seo/platformSeo";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const heading = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-heading",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#14209C",
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");
  const seo = await getPlatformSeo();

  const ogImage = seo.ogImageUrl || `${baseUrl}/images/og-default.png`;
  const favicon = seo.faviconUrl || "/favicon.svg";
  const appleIcon = seo.appleTouchIconUrl || "/apple-touch-icon.png";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: seo.metaTitle,
      template: "%s | Sabina Education",
    },
    description: seo.metaDescription,
    keywords: seo.keywords,
    authors: [{ name: "Sabina Education", url: baseUrl }],
    creator: "Sabina Education",
    publisher: "Sabina Education",
    applicationName: "Sabina Edge LMS",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": `${baseUrl}/rss.xml`,
      },
    },
    icons: {
      icon: [
        { url: favicon, type: seo.faviconUrl ? undefined : "image/svg+xml" },
        { url: "/favicon.ico", sizes: "32x32" },
      ],
      apple: [{ url: appleIcon, sizes: "180x180" }],
      shortcut: favicon,
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: baseUrl,
      siteName: "Sabina Education",
      title: seo.metaTitle,
      description: seo.metaDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: seo.metaTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.metaTitle,
      description: seo.metaDescription,
      creator: seo.twitterHandle || "@SabinaLMS",
      images: [ogImage],
    },
    verification: {
      google: seo.googleSiteVerification || undefined,
      other: seo.bingSiteVerification ? { "msvalidate.01": seo.bingSiteVerification } : undefined,
    },
    robots: seo.allowIndexing
      ? {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        }
      : {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
        },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const seo = await getPlatformSeo();
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://sabina.education").replace(/\/+$/, "");

  const cssVars = `:root{--color-primary:${seo.primaryColor};--color-secondary:${seo.secondaryColor};}`;
  const favicon = seo.faviconUrl || "/favicon.svg";
  const appleIcon = seo.appleTouchIconUrl || "/apple-touch-icon.png";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "Sabina Education",
    url: baseUrl,
    logo: seo.logoUrl || `${baseUrl}/images/og-default.png`,
    description: seo.metaDescription,
    sameAs: [
      seo.twitterHandle ? `https://twitter.com/${seo.twitterHandle.replace('@', '')}` : "https://twitter.com/SabinaLMS",
      "https://www.linkedin.com/company/sabina-education",
    ],
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: "15",
      highPrice: "120",
      offerCount: "500",
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sabina Education",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${baseUrl}/find-tutors?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" suppressHydrationWarning className={`h-full max-w-[100vw] ${sans.variable} ${heading.variable}`}>
      <head>
        {/* Dynamic brand CSS variables — server-rendered */}
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {/* Explicit fallback icon links */}
        <link rel="icon" href={favicon} />
        <link rel="apple-touch-icon" href={appleIcon} />
        {/* RSS 2.0 & Atom Feed Alternate Links */}
        <link rel="alternate" type="application/rss+xml" title="Sabina Education RSS Feed" href={`${baseUrl}/rss.xml`} />
        <link rel="alternate" type="application/atom+xml" title="Sabina Education Atom Feed" href={`${baseUrl}/feed.xml`} />
        {/* Schema.org Organization & WebSite JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body suppressHydrationWarning className="flex min-h-full w-full max-w-[100vw] overflow-x-clip flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-100 selection:text-brand-900">
        <ThemeSynchronizer initialPrimary={seo.primaryColor} initialSecondary={seo.secondaryColor} />
        <LogoProvider initialLogoUrl={seo.logoUrl}>
          <ModalProvider>
            {children}
          </ModalProvider>
        </LogoProvider>
      </body>
    </html>
  );
}
