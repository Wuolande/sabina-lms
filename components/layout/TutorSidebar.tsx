"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Clock, BookOpen,
  Users, MessageSquare, DollarSign, Star,
  Settings, User, Bell, LogOut, X, TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";

const links = [
  { href: "/tutor",               label: "Dashboard",         icon: LayoutDashboard, exact: true },
  { href: "/tutor/calendar",      label: "Schedule",          icon: Calendar },
  { href: "/tutor/lessons",       label: "Lessons",           icon: BookOpen },
  { href: "/tutor/students",      label: "My Students",       icon: Users },
  { href: "/tutor/messages",      label: "Messages",          icon: MessageSquare, badge: "2" },
  { href: "/tutor/availability",  label: "Availability",      icon: Clock },
  { href: "/tutor/earnings",      label: "Earnings & Payouts",icon: DollarSign },
  { href: "/tutor/reviews",       label: "Student Reviews",   icon: Star },
  { href: "/tutor/profile",       label: "Public Profile",    icon: User },
  { href: "/tutor/settings",      label: "Settings & Rates",  icon: Settings },
];

interface TutorSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function TutorSidebar({ isOpen, onClose }: TutorSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950 text-slate-300 border-r border-slate-800 transition-transform duration-300 ease-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-slate-800">
          <Logo size="sm" variant="dark" href="/" />

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Tutor context badge */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-2.5">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
              <TrendingUp className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">Tutor Console</p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Maria Garcia · Approved</p>
            </div>
          </div>
        </div>

        {/* Nav */}
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
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-white" : "text-slate-500")} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                      active ? "bg-white/25 text-white" : "bg-red-500/20 text-red-400"
                    )}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Earnings snapshot */}
        <div className="mx-3 mb-3 rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-2">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block">
            This Month
          </span>
          <div className="text-2xl font-black text-accent-400 font-heading leading-none">
            $3,977
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Net earnings after 18% platform fee.
          </p>
          <Link
            href="/tutor/earnings"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View breakdown →
          </Link>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-white transition-colors"
          >
            ← Marketplace
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
}
