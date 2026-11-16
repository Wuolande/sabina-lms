import type { Metadata } from "next";
import Link from "next/link";
import { BookOpen, Mail, MessageSquare, Phone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ContactFormClient } from "@/components/contact/ContactFormClient";
import { siteChrome } from "@/cms/content/server";
import { getSessionUser } from "@/cms/auth/session";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Questions about lessons, payments or teaching on Sabina? Send us a message and our team will reply by email.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const [site, user] = await Promise.all([siteChrome(), getSessionUser().catch(() => null)]);
  const inbox = user?.role === "tutor" ? "/tutor/messages" : user?.role === "student" ? "/student/messages" : null;
  const name = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") : "";
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-10 px-4 py-8 sm:space-y-16 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto w-full min-w-0 max-w-2xl space-y-3 text-center sm:space-y-4">
        <Badge variant="subtle" size="sm" className="bg-brand-50 font-bold text-brand-800">
          Contact us
        </Badge>
        <h1 className="font-heading text-3xl font-black tracking-tight text-slate-900 sm:text-5xl">How can we help?</h1>
        <p className="text-sm text-slate-600 sm:text-base">Ask about booking, payments, the classroom or teaching on {site.name}. A member of our team will reply by email.</p>
      </div>

      <div className="mx-auto grid w-full min-w-0 max-w-5xl grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
        <aside className="flex w-full min-w-0 max-w-full flex-col justify-between gap-6 rounded-2xl bg-slate-900 p-6 text-white sm:rounded-3xl sm:p-8">
          <div className="space-y-6">
            <h2 className="font-heading text-xl font-bold">Other ways to reach us</h2>
            <ul className="space-y-4 text-sm text-slate-300">
              {site.supportEmail && (
                <li className="flex items-center gap-3">
                  <Mail className="h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
                  <a href={`mailto:${site.supportEmail}`} className="min-w-0 break-all hover:text-white">
                    {site.supportEmail}
                  </a>
                </li>
              )}
              {site.supportPhone && (
                <li className="flex items-center gap-3">
                  <Phone className="h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
                  <a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="hover:text-white">
                    {site.supportPhone}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-3">
                <MessageSquare className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
                {inbox ? (
                  <span>
                    For a question about a lesson, message your tutor or student from{" "}
                    <Link href={inbox} className="font-semibold text-white underline underline-offset-2">
                      your messages
                    </Link>
                    .
                  </span>
                ) : (
                  <span>Once you have an account, you can message your tutor directly from your dashboard.</span>
                )}
              </li>
              <li className="flex items-start gap-3">
                <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-accent-400" aria-hidden="true" />
                <span>
                  Quick answers:{" "}
                  <Link href="/how-it-works" className="font-semibold text-white underline underline-offset-2">
                    how it works
                  </Link>{" "}
                  and our{" "}
                  <Link href="/refund-policy" className="font-semibold text-white underline underline-offset-2">
                    refund policy
                  </Link>
                  .
                </span>
              </li>
            </ul>
          </div>
        </aside>

        <ContactFormClient defaults={{ name, email: user?.email ?? "" }} />
      </div>
    </div>
  );
}
