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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`h-full ${sans.variable} ${heading.variable}`}>
      <body suppressHydrationWarning className="flex min-h-full flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-brand-100 selection:text-brand-900">
        <ModalProvider>
          {children}
        </ModalProvider>
      </body>
    </html>
  );
}
