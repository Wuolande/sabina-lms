import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Sabina Edge | Premium 1-on-1 Online Tutoring & Live Classroom",
  description: "Connect with certified, elite private tutors for 1-on-1 live video lessons in languages, STEM, coding, and exam prep.",
  keywords: ["online tutoring", "private tutor", "learn english", "math tutor", "python coding", "live classroom", "ielts prep"],
};

import { ModalProvider } from "@/components/ui/modal-context";
import { LogoProvider } from "@/components/ui/LogoContext";

const THEME_DEFAULTS = { primaryColor: '#14209C', secondaryColor: '#F9C31C', logoUrl: '' };

async function getPlatformTheme(): Promise<{ primaryColor: string; secondaryColor: string; logoUrl: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/theme`, {
      next: { revalidate: 60, tags: ['platform-theme'] },
    });
    if (!res.ok) return THEME_DEFAULTS;
    const data = await res.json();
    return {
      primaryColor:   /^#[0-9A-Fa-f]{6}$/.test(data.primaryColor)   ? data.primaryColor   : THEME_DEFAULTS.primaryColor,
      secondaryColor: /^#[0-9A-Fa-f]{6}$/.test(data.secondaryColor) ? data.secondaryColor : THEME_DEFAULTS.secondaryColor,
      logoUrl:        typeof data.logoUrl === 'string' ? data.logoUrl.trim() : '',
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
    <html lang="en" suppressHydrationWarning className={`h-full ${sans.variable} ${heading.variable}`}>
      <head>
        {/* Inject dynamic brand CSS variables — server-rendered, zero FOUC */}
        <style dangerouslySetInnerHTML={{ __html: cssVars }} />
        {theme.logoUrl && (
          <link rel="icon" href={theme.logoUrl} />
        )}
      </head>
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-100 selection:text-brand-900">
        <LogoProvider initialLogoUrl={theme.logoUrl}>
          <ModalProvider>
            {children}
          </ModalProvider>
        </LogoProvider>
      </body>
    </html>
  );
}
