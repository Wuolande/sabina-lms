"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Play,
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  Briefcase,
  Shield,
  Video,
  Info,
  LifeBuoy,
  ArrowRight,
  BookOpen,
  DollarSign,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const mainNavLinks = [
  { href: "/find-tutors", label: "Find Tutors" },
  { href: "/subjects", label: "Subjects" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/become-a-tutor", label: "Become a Tutor" },
  { href: "/blog", label: "Blog" },
];

const portalItems = [
  {
    href: "/student",
    label: "Student Portal",
    sub: "Manage lessons, streak & messages",
    icon: GraduationCap,
    badge: "Student",
    color: "text-brand-700",
    bg: "bg-brand-50 group-hover:bg-brand-100",
  },
  {
    href: "/tutor",
    label: "Tutor Console",
    sub: "Calendar, availability & earnings",
    icon: Briefcase,
    badge: "Tutor",
    color: "text-emerald-700",
    bg: "bg-emerald-50 group-hover:bg-emerald-100",
  },
  {
    href: "/admin",
    label: "Admin Panel",
    sub: "Platform management & audits",
    icon: Shield,
    badge: "Staff",
    color: "text-amber-700",
    bg: "bg-amber-50 group-hover:bg-amber-100",
  },
  {
    href: "/lessons/les_01/classroom",
    label: "Live Classroom Demo",
    sub: "Interactive HD video stage & whiteboard",
    icon: Video,
    badge: "Live",
    color: "text-purple-700",
    bg: "bg-purple-50 group-hover:bg-purple-100",
  },
];

const secondaryLinks = [
  { href: "/about", label: "About Us", icon: Info },
  { href: "/contact", label: "Contact Support", icon: LifeBuoy },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [portalsOpen, setPortalsOpen] = React.useState(false);
  const portalsRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on route change
  React.useEffect(() => {
    setMobileOpen(false);
    setPortalsOpen(false);
  }, [pathname]);

  // Click outside to close portals dropdown
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        portalsRef.current &&
        !portalsRef.current.contains(event.target as Node)
      ) {
        setPortalsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-[70px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ─── 1. Brand Logo ─── */}
        <Logo size="default" href="/" />

        {/* ─── 2. Desktop Navigation ─── */}
        <nav className="hidden lg:flex items-center gap-1">
          {mainNavLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
                  active
                    ? "text-slate-950 bg-slate-100 font-bold"
                    : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                )}
              >
                {link.label}
                {active && (
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-brand-700" />
                )}
              </Link>
            );
          })}

          {/* Portals & Workspace Dropdown (Opens on click AND hover) */}
          <div
            ref={portalsRef}
            className="relative"
            onMouseEnter={() => setPortalsOpen(true)}
            onMouseLeave={() => setPortalsOpen(false)}
          >
            <button
              type="button"
              onClick={() => setPortalsOpen(!portalsOpen)}
              className={cn(
                "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150",
                portalsOpen || pathname.startsWith("/student") || pathname.startsWith("/tutor") || pathname.startsWith("/admin")
                  ? "text-brand-700 bg-brand-50/80 font-bold"
                  : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
              )}
              aria-expanded={portalsOpen}
            >
              <span>Portals & Hubs</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform duration-200",
                  portalsOpen ? "rotate-180 text-brand-700" : "text-slate-400"
                )}
              />
            </button>

            {/* Dropdown Menu */}
            {portalsOpen && (
              <div className="absolute left-0 top-full pt-2 z-50 w-72 animate-fade-in-scale">
                <div className="rounded-2xl border border-slate-100 bg-white p-2 shadow-elevation-lg">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    Application Workspaces
                  </div>

                  <div className="space-y-1">
                    {portalItems.map((p) => {
                      const Icon = p.icon;
                      const isActivePortal = pathname === p.href || pathname.startsWith(p.href + "/");
                      return (
                        <Link
                          key={p.href}
                          href={p.href}
                          onClick={() => setPortalsOpen(false)}
                          className={cn(
                            "group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all",
                            isActivePortal ? "bg-slate-100" : "hover:bg-slate-50"
                          )}
                        >
                          <div
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors",
                              p.bg
                            )}
                          >
                            <Icon className={cn("h-4 w-4", p.color)} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={cn("text-xs font-bold leading-tight", p.color)}>
                                {p.label}
                              </span>
                              <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                                {p.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate">
                              {p.sub}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Secondary Quick Links in Dropdown */}
                  <div className="mt-2 pt-2 border-t border-slate-100 space-y-0.5">
                    {secondaryLinks.map((s) => {
                      const Icon = s.icon;
                      return (
                        <Link
                          key={s.href}
                          href={s.href}
                          onClick={() => setPortalsOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-950 hover:bg-slate-50 rounded-lg transition-colors"
                        >
                          <Icon className="h-3.5 w-3.5 text-slate-400" />
                          <span>{s.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* ─── 3. Right Auth & Quick Actions ─── */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Link
            href="/register"
            className="h-10 px-5 inline-flex items-center rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 shadow-xs hover:border-slate-300 hover:bg-slate-50 transition-all active:scale-[0.98]"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="h-10 px-5 inline-flex items-center rounded-xl bg-slate-950 text-xs font-bold text-white shadow-[0_1px_3px_rgb(0_0_0/0.2),inset_0_1px_0_rgb(255_255_255/0.06)] hover:bg-slate-800 transition-all active:scale-[0.98]"
          >
            Log in
          </Link>
        </div>

        {/* ─── 4. Mobile Menu Toggle ─── */}
        <div className="flex lg:hidden items-center gap-2">
          <Link
            href="/login"
            className="h-9 px-4 inline-flex items-center rounded-xl bg-slate-950 text-xs font-bold text-white"
          >
            Log in
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ─── 5. Comprehensive Mobile Drawer (Contains ALL Site Navs) ─── */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-slate-100 bg-white px-4 pb-8 pt-4 shadow-elevation max-h-[85vh] overflow-y-auto animate-slide-down">
          {/* Main Marketplace Links */}
          <div className="space-y-1">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              Marketplace
            </p>
            {mainNavLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors",
                    active
                      ? "bg-brand-50 text-brand-700 font-bold"
                      : "text-slate-800 hover:bg-slate-50"
                  )}
                >
                  <span>{link.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300" />
                </Link>
              );
            })}
          </div>

          {/* Portals & Workspaces Section */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
              Workspaces & Live LMS
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {portalItems.map((p) => {
                const Icon = p.icon;
                const active = pathname === p.href;
                return (
                  <Link
                    key={p.href}
                    href={p.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3 border transition-colors",
                      active ? "border-brand-700 bg-brand-50/50" : "border-slate-100 bg-slate-50/60 hover:bg-slate-100"
                    )}
                  >
                    <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", p.bg.split(" ")[0])}>
                      <Icon className={cn("h-4 w-4", p.color)} />
                    </div>
                    <div>
                      <span className={cn("text-xs font-bold block", p.color)}>
                        {p.label}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {p.badge} access
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Company & Support */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">
              Company
            </p>
            <div className="grid grid-cols-2 gap-1">
              {secondaryLinks.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  {s.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Auth Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3">
            <Link
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="h-11 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-800 shadow-xs"
            >
              Sign up
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileOpen(false)}
              className="h-11 flex items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white shadow-subtle"
            >
              Log in
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
