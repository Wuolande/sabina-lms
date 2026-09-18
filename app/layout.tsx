import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Outfit } from "next/font/google";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Sabina Edge | Premium 1-on-1 Online Tutoring & Live Classroom",
  description: "Connect with certified, elite private tutors for 1-on-1 live video lessons in languages, STEM, coding, and exam prep.",
  keywords: ["online tutoring", "private tutor", "learn english", "math tutor", "python coding", "live classroom", "ielts prep"],
};

import { ModalProvider } from "@/components/ui/modal-context";
import { LogoProvider } from "@/components/ui/LogoContext";
import { ThemeSynchronizer } from "@/components/ui/ThemeSynchronizer";
import { adminSupabase } from "@/src/shared/database/supabase";

const THEME_DEFAULTS = { primaryColor: '#14209C', secondaryColor: '#F9C31C', logoUrl: '' };

function isValidHex(val: unknown): val is string {
  return typeof val === 'string' && /^#[0-9A-Fa-f]{6}$/.test(val);
}

async function getPlatformTheme(): Promise<{ primaryColor: string; secondaryColor: string; logoUrl: string }> {
  try {
    const { data, error } = await adminSupabase
      .from('platform_theme')
      .select('primary_color, secondary_color, logo_url')
      .eq('id', 'default')
      .maybeSingle();

    if (error || !data) return THEME_DEFAULTS;

    return {
      primaryColor:   isValidHex(data.primary_color)   ? data.primary_color   : THEME_DEFAULTS.primaryColor,
      secondaryColor: isValidHex(data.secondary_color) ? data.secondary_color : THEME_DEFAULTS.secondaryColor,
      logoUrl:        typeof data.logo_url === 'string' ? data.logo_url.trim() : '',
    };
  } catch {
    return THEME_DEFAULTS;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getPlatformTheme();

  const cssVars = `:root{--color-primary:${theme.primaryColor};--color-secondary:${theme.secondaryColor};}`;

  return (
    <html lang="en" suppressHydrationWarning className={`h-full overflow-x-hidden max-w-[100vw] ${sans.variable} ${heading.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        {/* Inject dynamic brand CSS variables — server-rendered, zero FOUC */}
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {theme.logoUrl && (
          <link rel="icon" href={theme.logoUrl} />
        )}
      </head>
      <body suppressHydrationWarning className="flex min-h-full w-full max-w-[100vw] overflow-x-hidden flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-100 selection:text-brand-900">
        <ThemeSynchronizer initialPrimary={theme.primaryColor} initialSecondary={theme.secondaryColor} />
        <LogoProvider initialLogoUrl={theme.logoUrl}>
          <ModalProvider>
            {children}
          </ModalProvider>
        </LogoProvider>
      </body>
    </html>
  );
}
