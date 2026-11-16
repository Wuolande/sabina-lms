import Link from "next/link";
import { CalendarClock, Lock, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { siteChrome, type SocialKey } from "@/cms/content/server";

const ICONS: Record<SocialKey, string> = {
  x: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  facebook: "M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.33l-.53 3.49h-2.8V24C19.61 23.1 24 18.1 24 12.07",
  instagram: "M12 2.16c3.2 0 3.58.01 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.15 3.23-1.66 4.77-4.92 4.92-1.27.06-1.64.07-4.85.07s-3.58-.01-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92-.06-1.27-.07-1.64-.07-4.85s.01-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07 2.7.27.27 2.69.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.2 4.36 2.62 6.78 6.98 6.98 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c4.35-.2 6.78-2.62 6.98-6.98.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.2-4.35-2.62-6.78-6.98-6.98C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z",
  linkedin: "M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.68 1.68 0 1 0 0-3.36 1.68 1.68 0 0 0 0 3.36m1.39 9.74v-8.37H5.07v8.37z",
  youtube: "M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.87.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z",
  tiktok: "M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
};

const trustItems = [
  { icon: ShieldCheck, label: "Every tutor checked by our team" },
  { icon: Lock, label: "Secure payments" },
  { icon: CalendarClock, label: "Times shown in your time zone" },
];

const platformLinks = [
  { href: "/find-tutors", label: "Find a tutor" },
  { href: "/match", label: "Get matched" },
  { href: "/become-a-tutor", label: "Become a tutor" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
];

const companyLinks = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact us" },
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of service" },
  { href: "/refund-policy", label: "Refund policy" },
  { href: "/cookies", label: "Cookie policy" },
];

function Column({ title, links }: { title: string; links: { href: string; label: string; accent?: boolean }[] }) {
  return (
    <div className="min-w-0 space-y-4">
      <h2 className="text-xs font-extrabold uppercase tracking-widest text-white">{title}</h2>
      <ul className="space-y-2.5">
        {links.map(({ href, label, accent }) => (
          <li key={href}>
            <Link href={href} className={`text-sm transition-colors ${accent ? "font-semibold text-accent hover:brightness-110" : "text-slate-400 hover:text-white"}`}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function Footer() {
  const site = await siteChrome();
  const subjectLinks = [
    ...site.footerSubjects.map((s) => ({ href: `/subjects/${s.slug}`, label: s.name })),
    { href: "/subjects", label: site.subjectCount > 5 ? `All ${site.subjectCount} subjects →` : "All subjects →", accent: true },
  ];
  return (
    <footer className="bg-slate-950 text-slate-300">
      <div className="border-b border-slate-800/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6 lg:px-8">
          <Logo size="default" variant="dark" href="/" />
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
            {trustItems.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-xs font-semibold text-slate-400">
                <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800">
                  <Icon className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:gap-10 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 space-y-5">
            <p className="max-w-sm text-sm leading-relaxed text-slate-400">
              {site.tagline || "Live 1-on-1 lessons with tutors our team has checked. Book a time that suits you and learn in your browser."}
            </p>
            {(site.supportEmail || site.supportPhone) && (
              <ul className="space-y-1.5 text-sm">
                {site.supportEmail && (
                  <li>
                    <a href={`mailto:${site.supportEmail}`} className="break-all text-slate-300 hover:text-white">
                      {site.supportEmail}
                    </a>
                  </li>
                )}
                {site.supportPhone && (
                  <li>
                    <a href={`tel:${site.supportPhone.replace(/[^\d+]/g, "")}`} className="text-slate-300 hover:text-white">
                      {site.supportPhone}
                    </a>
                  </li>
                )}
              </ul>
            )}
            {site.social.length > 0 && (
              <ul className="flex flex-wrap items-center gap-2">
                {site.social.map((s) => (
                  <li key={s.key}>
                    <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition-all hover:border-slate-600 hover:text-white">
                      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d={ICONS[s.key]} />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {site.footerSubjects.length > 0 && <Column title="Subjects" links={subjectLinks} />}
          <Column title="Learn and teach" links={platformLinks} />
          <Column title="Company" links={companyLinks} />
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-6 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} {site.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
