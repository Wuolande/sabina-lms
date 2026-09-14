"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, GraduationCap, UserCheck,
  Calendar, CreditCard, DollarSign, Star, BarChart3,
  Settings, ShieldAlert, FileText, LogOut, X, Shield, LayoutTemplate, BookOpen, Mail, Newspaper,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { adminService } from "@/services/adminService";

const staticLinks = [
  { href: "/admin",                label: "Overview",           icon: LayoutDashboard, exact: true },
  { href: "/admin/blogs",          label: "Blog & Articles",    icon: Newspaper },
  { href: "/admin/cms",            label: "CMS",                icon: LayoutTemplate },
  { href: "/admin/training",       label: "Tutor Academy",      icon: BookOpen },
  { href: "/admin/emails",         label: "Email Broadcasts",   icon: Mail },
  { href: "/admin/tutors/pending", label: "Tutor Applications", icon: UserCheck, isPendingTutors: true },
  { href: "/admin/tutors",         label: "Manage Tutors",      icon: GraduationCap },
  { href: "/admin/users",          label: "Users & Students",   icon: Users },
  { href: "/admin/bookings",       label: "Bookings & Lessons", icon: Calendar },
  { href: "/admin/payments",       label: "Payments",           icon: CreditCard },
  { href: "/admin/payouts",        label: "Tutor Payouts",      icon: DollarSign },
  { href: "/admin/reviews",        label: "Review Moderation",  icon: Star },
  { href: "/admin/reports",        label: "Analytics",          icon: BarChart3 },
  { href: "/admin/audit-logs",     label: "Audit Logs",         icon: FileText },
  { href: "/admin/settings",       label: "Taxonomy & Settings",icon: Settings },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = React.useState<number | null>(null);

  // Fetch live stats dynamically for badges
  const fetchLiveCounts = React.useCallback(async () => {
    try {
      const stats = await adminService.getStats();
      setPendingCount(stats.pendingTutorApplications);
    } catch {
      // Non-blocking
    }
  }, []);

  React.useEffect(() => {
    fetchLiveCounts();
  }, [fetchLiveCounts, pathname]);

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
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950 border-r border-slate-800 text-slate-300 transition-transform duration-300 ease-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-2 min-w-0">
            <Logo size="sm" variant="dark" href="/admin" />
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/20 text-accent border border-accent/30 shrink-0">
              Admin
            </span>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-white lg:hidden transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Operator badge */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-accent/10 border border-accent/20 px-3 py-2.5">
            <ShieldAlert className="h-4 w-4 text-accent shrink-0" />
            <div>
              <p className="text-xs font-bold text-accent leading-tight">Super Admin</p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight">Operator · Full Access</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5 scrollbar-hide">
          {staticLinks.map((link) => {
            const active = isActive(link.href, link.exact);
            const Icon = link.icon;
            const badgeValue = link.isPendingTutors && pendingCount !== null && pendingCount > 0
              ? String(pendingCount)
              : null;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-150",
                  active
                    ? "bg-accent text-slate-950 shadow-xs font-bold"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-slate-950" : "text-slate-500")} />
                  <span>{link.label}</span>
                </div>
                {badgeValue && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-black leading-none",
                      active
                        ? "bg-slate-950 text-accent font-bold"
                        : "bg-red-500 text-white shadow-xs"
                    )}
                  >
                    {badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

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
            Exit
          </Link>
        </div>
      </aside>
    </>
  );
}
