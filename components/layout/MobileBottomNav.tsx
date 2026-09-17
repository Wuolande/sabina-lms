"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  MessageSquare,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { messagingService } from "@/services/messagingService";

interface MobileBottomNavProps {
  role: "student" | "tutor";
  onOpenMenu: () => void;
}

export function MobileBottomNav({ role, onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();
  const [unreadMessages, setUnreadMessages] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;
    const fetchUnread = async () => {
      try {
        const convs = await messagingService.getConversations();
        if (isMounted) {
          const totalUnread = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
          setUnreadMessages(totalUnread);
        }
      } catch {
        // Soft fallback
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 6000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const studentTabs = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/student/lessons", label: "Lessons", icon: BookOpen },
    { href: "/student/calendar", label: "Calendar", icon: Calendar },
    { href: "/student/messages", label: "Messages", icon: MessageSquare, badge: unreadMessages },
  ];

  const tutorTabs = [
    { href: "/tutor", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/tutor/calendar", label: "Schedule", icon: Calendar },
    { href: "/tutor/lessons", label: "Lessons", icon: BookOpen },
    { href: "/tutor/messages", label: "Messages", icon: MessageSquare, badge: unreadMessages },
  ];

  const tabs = role === "student" ? studentTabs : tutorTabs;

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isDark = role === "tutor";

  return (
    <nav
      aria-label="Mobile Navigation"
      className={cn(
        "lg:hidden fixed bottom-0 inset-x-0 z-30",
        "border-t pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-2px_12px_rgba(0,0,0,0.06)]",
        isDark
          ? "bg-slate-950/95 border-slate-800 text-slate-400 backdrop-blur-md"
          : "bg-white/95 border-slate-200 text-slate-500 backdrop-blur-md"
      )}
    >
      <div className="flex h-14 items-stretch justify-around px-1">
        {tabs.map((tab) => {
          const active = isActive(tab.href, tab.exact);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 select-none",
                active
                  ? isDark
                    ? "text-accent font-bold"
                    : "text-brand font-bold"
                  : isDark
                  ? "hover:text-white"
                  : "hover:text-slate-900"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active ? "stroke-[2.5]" : "stroke-2")} />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-1 ring-white">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] leading-none font-medium truncate max-w-[64px]">
                {tab.label}
              </span>
              {active && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-5 rounded-full",
                    isDark ? "bg-accent" : "bg-brand"
                  )}
                />
              )}
            </Link>
          );
        })}

        {/* More / Menu Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenMenu}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer select-none",
            isDark ? "hover:text-white" : "hover:text-slate-900"
          )}
          aria-label="Open portal navigation menu"
        >
          <Menu className="h-5 w-5 stroke-2" />
          <span className="text-[10px] leading-none font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
