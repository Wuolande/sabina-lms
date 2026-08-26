"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Search, BookOpen, Calendar,
  MessageSquare, Heart, TrendingUp, CreditCard,
  Bell, Settings, Sparkles, LogOut, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const links = [
  { href: "/student",               label: "Dashboard",        icon: LayoutDashboard, exact: true },
  { href: "/find-tutors",           label: "Find Tutors",      icon: Search },
  { href: "/student/lessons",       label: "My Lessons",       icon: BookOpen },
  { href: "/student/calendar",      label: "Calendar",         icon: Calendar },
  { href: "/student/messages",      label: "Messages",         icon: MessageSquare, badge: "3" },
  { href: "/student/favorites",     label: "Saved Tutors",     icon: Heart },
  { href: "/student/progress",      label: "Learning Progress",icon: TrendingUp },
  { href: "/student/payments",      label: "Billing & Invoices",icon: CreditCard },
  { href: "/student/notifications", label: "Notifications",    icon: Bell, badge: "2" },
  { href: "/student/settings",      label: "Settings",         icon: Settings },
];

interface StudentSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function StudentSidebar({ isOpen, onClose }: StudentSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-slate-100 shadow-elevation lg:static lg:shadow-none lg:translate-x-0 transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Header ── */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-slate-100">
          <Logo size="sm" href="/" />

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 lg:hidden transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* ── Context Badge ── */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-brand-50 border border-brand-100 px-3 py-2.5">
            <div className="h-7 w-7 rounded-lg bg-brand-700 flex items-center justify-center shrink-0">
              <LayoutDashboard className="h-3.5 w-3.5 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-brand-900 leading-tight">Student Portal</p>
              <p className="text-[10px] text-brand-600 font-medium leading-tight">Alex Johnson</p>
            </div>
          </div>
        </div>

        {/* ── Nav Items ── */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-hide">
          {links.map((link) => {
            const active = isActive(link.href, link.exact);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150",
                  active
                    ? "bg-brand-700 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-400")}
                  />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      active ? "bg-white/25 text-white" : "bg-red-100 text-red-700"
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ── Streak Banner ── */}
        <div className="mx-3 mb-3 rounded-2xl bg-gradient-to-br from-brand-800 to-brand-950 p-4 text-white space-y-1.5 shadow-glow-brand">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-accent-400" />
            <span className="text-xs font-extrabold text-accent-400 uppercase tracking-wide">Learning Streak</span>
          </div>
          <p className="text-[13px] font-semibold text-brand-100">
            🔥 14-day streak! 2 lessons this week.
          </p>
          <Link
            href="/student/progress"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-300 hover:text-white transition-colors"
          >
            View progress
            <span>→</span>
          </Link>
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-brand-700 transition-colors"
          >
            ← Marketplace
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}
