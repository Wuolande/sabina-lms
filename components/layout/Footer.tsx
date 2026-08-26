"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck, Globe, Lock } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const footerLinks = {
  subjects: [
    { href: "/find-tutors?subject=english", label: "English Tutors" },
    { href: "/find-tutors?subject=mathematics", label: "Math & Calculus" },
    { href: "/find-tutors?subject=spanish", label: "Spanish Tutors" },
    { href: "/find-tutors?subject=python-data-science", label: "Python & Coding" },
    { href: "/find-tutors?subject=ielts-toefl-prep", label: "IELTS / TOEFL Prep" },
    { href: "/subjects", label: "All 16+ Subjects →", accent: true },
  ],
  platform: [
    { href: "/find-tutors", label: "Find a Tutor" },
    { href: "/become-a-tutor", label: "Become a Tutor" },
    { href: "/how-it-works", label: "How It Works" },
    { href: "/student", label: "Student Dashboard" },
    { href: "/tutor", label: "Tutor Dashboard" },
  ],
  company: [
    { href: "/about", label: "About Sabina Edge" },
    { href: "/contact", label: "Contact Support" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/refund-policy", label: "Refund Policy" },
    { href: "/cookies", label: "Cookie Policy" },
    { href: "/admin", label: "Admin Console", accent: true },
  ],
};

const socials = [
  {
    href: "#",
    label: "X (Twitter)",
    icon: () => (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "LinkedIn",
    icon: () => (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.68 1.68 0 1 0 0-3.36 1.68 1.68 0 0 0 0 3.36m1.39 9.74v-8.37H5.07v8.37z" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "YouTube",
    icon: () => (
      <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
  {
    href: "#",
    label: "Instagram",
    icon: () => (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
      </svg>
    ),
  },
];

const trustItems = [
  { icon: ShieldCheck, label: "100% Verified Tutors" },
  { icon: Lock, label: "SSL Encrypted" },
  { icon: Globe, label: "Global Timezone Sync" },
];

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300">
      {/* ─── Trust Banner ─── */}
      <div className="border-b border-slate-800/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <Logo size="default" variant="dark" href="/" />

          {/* Trust Items */}
          <div className="flex flex-wrap items-center justify-center gap-5">
            {trustItems.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 text-xs font-semibold text-slate-400"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-800">
                  <Icon className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Main Footer Body ─── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="col-span-2 lg:col-span-2 space-y-5">
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Sabina Edge connects ambitious learners with verified, elite
              tutors worldwide. Master any subject through live 1-on-1 video
              classrooms and personalised learning goals.
            </p>

            {/* Newsletter */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-white uppercase tracking-widest">
                Stay in the loop
              </p>
              <form onSubmit={(e) => e.preventDefault()} className="flex gap-2">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="flex-1 min-w-0 h-9 rounded-xl border border-slate-700 bg-slate-900 px-3 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="h-9 px-4 shrink-0 rounded-xl bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-500 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-2">
              {socials.map(({ href, icon: IconComponent, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-600 hover:text-white transition-all"
                >
                  <IconComponent />
                </a>
              ))}
            </div>
          </div>

          {/* Subjects */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
              Popular Subjects
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.subjects.map(({ href, label, accent }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className={`text-sm transition-colors ${
                      accent
                        ? "text-emerald-400 hover:text-emerald-300 font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
              Platform
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.platform.map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-slate-400 hover:text-white transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-white">
              Company
            </h4>
            <ul className="space-y-2.5">
              {footerLinks.company.map(({ href, label, accent }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className={`text-sm transition-colors ${
                      accent
                        ? "text-amber-400 hover:text-amber-300 font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ─── Bottom Bar ─── */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-6">
          <p className="text-xs text-slate-500">
            © 2026 Sabina Edge Inc. All rights reserved.
          </p>
          <p className="text-xs text-slate-600">
            Built for high-trust live online learning
          </p>
        </div>
      </div>
    </footer>
  );
}
