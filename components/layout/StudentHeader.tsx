"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  MessageSquare,
  Search,
  Menu,
  Play,
  ChevronDown,
  CheckCheck,
  Video,
  CreditCard,
  Star,
  ExternalLink,
  User,
  KeyRound,
  LogOut,
  Settings,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { studentService } from "@/services/studentService";
import { notificationService } from "@/services/notificationService";
import { messagingService } from "@/services/messagingService";
import { UserNotificationItem } from "@/src/modules/notifications/repositories/notificationRepository";
import { formatDate } from "@/lib/utils";
import { UpdatePasswordModal } from "@/components/auth/UpdatePasswordModal";
import { UserProfile } from "@/types";

interface StudentHeaderProps {
  onToggleSidebar?: () => void;
}

export function StudentHeader({ onToggleSidebar }: StudentHeaderProps) {
  const [unreadNotifs, setUnreadNotifs] = React.useState(0);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [notifications, setNotifications] = React.useState<UserNotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Profile dropdown & Password modal
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  const fetchProfile = React.useCallback(async () => {
    try {
      const user = await studentService.getCurrentStudent();
      setCurrentUser(user);
    } catch {
      // Clean fallback
    }
  }, []);

  const fetchCounts = React.useCallback(async () => {
    try {
      const res = await notificationService.getNotifications();
      setUnreadNotifs(res.unreadCount || 0);
      setNotifications(res.notifications || []);

      const convs = await messagingService.getConversations();
      const totalUnreadMsg = convs.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      setUnreadMessages(totalUnreadMsg);
    } catch {
      // Ignore network hiccup
    }
  }, []);

  React.useEffect(() => {
    fetchProfile();
    fetchCounts();
    const interval = setInterval(fetchCounts, 5000);
    return () => clearInterval(interval);
  }, [fetchProfile, fetchCounts]);

  // Click outside listener for dropdowns
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    if (isNotifOpen || isProfileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isNotifOpen, isProfileMenuOpen]);

  const handleMarkAllRead = async () => {
    await notificationService.markAsRead();
    fetchCounts();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "LESSON_REMINDER":
      case "LESSON_BOOKED":
        return <Video className="h-4 w-4 text-[#14209C]" />;
      case "PAYMENT_SUCCESS":
        return <CreditCard className="h-4 w-4 text-emerald-600" />;
      case "NEW_MESSAGE":
        return <MessageSquare className="h-4 w-4 text-[#14209C]" />;
      case "NEW_REVIEW":
      case "REVIEW_RECEIVED":
        return <Star className="h-4 w-4 text-amber-500" />;
      default:
        return <Bell className="h-4 w-4 text-slate-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 shadow-xs">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/student" className="group flex items-center gap-0 lg:hidden">
          <span className="text-lg font-black tracking-tight text-slate-900 font-heading">Sabina</span>
          <span className="mx-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
            <Play className="h-2.5 w-2.5 fill-white ml-px" />
          </span>
          <span className="text-lg font-black tracking-tight text-[#14209C] font-heading">Edge</span>
        </Link>

        {/* Global Search shortcut */}
        <Link
          href="/find-tutors"
          className="hidden md:flex items-center gap-2.5 h-9 w-64 px-3 rounded-xl border border-slate-200 bg-slate-50/70 text-xs text-slate-400 hover:bg-slate-100 hover:border-slate-300 transition-all cursor-pointer"
        >
          <Search className="h-4 w-4 text-slate-400" />
          <span>Find a tutor or subject...</span>
          <kbd className="ml-auto text-[10px] font-mono bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-400">
            ⌘K
          </kbd>
        </Link>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Messages Shortcut with Unread Badge */}
        <Link
          href="/student/messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          title="Direct Messages"
        >
          <MessageSquare className="h-4 w-4" />
          {unreadMessages > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#14209C] text-[9px] font-black text-white shadow-xs">
              {unreadMessages > 9 ? "9+" : unreadMessages}
            </span>
          )}
        </Link>

        {/* Notification Bell with Interactive Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
            title="Notifications"
            aria-expanded={isNotifOpen}
          >
            <Bell className="h-4 w-4" />
            {unreadNotifs > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white shadow-xs">
                {unreadNotifs > 9 ? "9+" : unreadNotifs}
              </span>
            )}
          </button>

          {/* Notifications Popover Flyout */}
          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-100 bg-slate-50/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900">Notifications</span>
                  {unreadNotifs > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#14209C] text-[10px] font-bold text-white">
                      {unreadNotifs} new
                    </span>
                  )}
                </div>

                {unreadNotifs > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-bold text-[#14209C] hover:underline flex items-center gap-1 transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification Items Stream */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center space-y-1.5 text-xs text-slate-400">
                    <Bell className="w-6 h-6 text-slate-300 mx-auto" />
                    <p>No notifications at the moment</p>
                  </div>
                ) : (
                  notifications.slice(0, 6).map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.actionUrl || "/student/notifications"}
                      onClick={() => setIsNotifOpen(false)}
                      className={`block p-3 transition-colors hover:bg-slate-50 ${
                        !notif.readAt ? "bg-indigo-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700 mt-0.5">
                          {getIcon(notif.type)}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5 text-left">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {notif.title}
                            </span>
                            {!notif.readAt && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#14209C] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-snug">
                            {notif.body}
                          </p>
                          <span className="text-[9px] text-slate-400 block pt-0.5">
                            {formatDate(notif.createdAt)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="p-2.5 border-t border-slate-100 bg-slate-50/80 text-center">
                <Link
                  href="/student/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs font-bold text-[#14209C] hover:underline transition inline-flex items-center gap-1"
                >
                  <span>View all in Notification Center</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-100 mx-1" />

        {/* Top Right Profile Popover Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 py-1 rounded-xl hover:bg-slate-50 px-2 transition-colors cursor-pointer text-left"
            aria-expanded={isProfileMenuOpen}
          >
            <Avatar
              src={currentUser?.avatarUrl}
              fallbackName={currentUser?.displayName || "Student"}
              size="sm"
              statusIndicator="online"
            />
            <div className="hidden md:block">
              <p className="text-xs font-bold text-slate-900 leading-none">{currentUser?.displayName || "Student"}</p>
              <p className="text-[10px] text-slate-500 font-medium mt-0.5">Student Account</p>
            </div>
            <ChevronDown className={`hidden md:block h-3.5 w-3.5 text-slate-400 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex items-center gap-3">
                <Avatar
                  src={currentUser?.avatarUrl}
                  fallbackName={currentUser?.displayName || "Student"}
                  size="md"
                  statusIndicator="online"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-slate-900 truncate">{currentUser?.displayName || "Student"}</h4>
                  <p className="text-[11px] text-slate-500 truncate">{currentUser?.email || ""}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-[#14209C] border border-indigo-100 text-[10px] font-bold">
                      Student
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2 space-y-1 text-xs font-medium">
                <Link
                  href="/student/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-[#14209C]" />
                  <span>My Student Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer text-left"
                >
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Change Password</span>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Security
                    </span>
                  </div>
                </button>

                <Link
                  href="/student/notifications"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notification Settings</span>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="p-2 border-t border-slate-100 bg-slate-50/50">
                <Link
                  href="/login"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors text-xs font-bold"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Update Modal */}
      <UpdatePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </header>
  );
}
