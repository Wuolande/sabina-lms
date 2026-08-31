"use client";

import * as React from "react";
import Link from "next/link";
import {
  Bell,
  MessageSquare,
  Menu,
  Play,
  ShieldCheck,
  ChevronDown,
  CheckCheck,
  Video,
  CreditCard,
  Star,
  ExternalLink,
  KeyRound,
  User,
  LogOut,
  Sparkles,
  Settings,
  Lock,
} from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { notificationService } from "@/services/notificationService";
import { messagingService } from "@/services/messagingService";
import { tutorService } from "@/services/tutorService";
import { UserNotificationItem } from "@/src/modules/notifications/repositories/notificationRepository";
import { formatDate } from "@/lib/utils";
import { UpdatePasswordModal } from "@/components/auth/UpdatePasswordModal";

interface TutorHeaderProps {
  onToggleSidebar?: () => void;
}

export function TutorHeader({ onToggleSidebar }: TutorHeaderProps) {
  const [isAccepting, setIsAccepting] = React.useState(true);
  const [unreadNotifs, setUnreadNotifs] = React.useState(0);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [notifications, setNotifications] = React.useState<UserNotificationItem[]>([]);
  const [isNotifOpen, setIsNotifOpen] = React.useState(false);
  const notifRef = React.useRef<HTMLDivElement>(null);

  // Profile dropdown & Password modal
  const [isProfileMenuOpen, setIsProfileMenuOpen] = React.useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  const [profileData, setProfileData] = React.useState<any | null>(null);

  const fetchProfile = React.useCallback(async () => {
    try {
      const data = await tutorService.getMyProfile();
      if (data) {
        setProfileData(data);
      }
    } catch {
      // Fallback
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

  const displayName = profileData?.user?.displayName || "Tutor";
  const avatarUrl = profileData?.user?.avatarUrl || undefined;
  const email = profileData?.user?.email || "";
  const hourlyRate = profileData?.hourlyRate || 45;
  const averageRating = profileData?.averageRating || 5.0;
  const slug = profileData?.slug || "";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800 bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 shadow-xs">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/tutor" className="group flex items-center gap-0 lg:hidden">
          <span className="text-lg font-black tracking-tight text-white font-heading">Sabina</span>
          <span className="mx-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500">
            <Play className="h-2.5 w-2.5 fill-white ml-px" />
          </span>
          <span className="text-lg font-black tracking-tight text-[#14209C] font-heading">Edge</span>
        </Link>

        <div className="hidden lg:block">
          <p className="text-xs font-extrabold uppercase tracking-widest text-slate-500">Tutor Console</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Availability Toggle */}
        <button
          type="button"
          onClick={() => setIsAccepting(!isAccepting)}
          className="hidden sm:flex items-center gap-2 h-9 px-4 rounded-xl border border-slate-700 bg-slate-900 text-xs font-bold text-slate-300 hover:border-slate-600 hover:text-white transition-all"
        >
          <span
            className={`h-2 w-2 rounded-full shrink-0 ${
              isAccepting ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
            }`}
          />
          {isAccepting ? "Accepting Bookings" : "Paused"}
        </button>

        {/* Verified Badge */}
        <Badge
          variant="success"
          size="sm"
          className="hidden md:inline-flex items-center gap-1 bg-emerald-950/80 text-emerald-300 border border-emerald-800/80"
        >
          <ShieldCheck className="h-3 w-3 text-emerald-400" />
          Verified Tutor
        </Badge>

        {/* Messages Shortcut with Unread Badge */}
        <Link
          href="/tutor/messages"
          className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white transition-colors"
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
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:text-white transition-colors cursor-pointer"
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
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-white">Notifications</span>
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
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="text-xs font-bold text-slate-400">All caught up!</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">No notifications at the moment.</p>
                  </div>
                ) : (
                  notifications.slice(0, 6).map((notif) => (
                    <Link
                      key={notif.id}
                      href={notif.actionUrl || "/tutor/notifications"}
                      onClick={() => setIsNotifOpen(false)}
                      className={`block p-3 transition-colors hover:bg-slate-800/70 ${
                        !notif.readAt ? "bg-slate-800/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-800 border border-slate-700 text-slate-300 mt-0.5">
                          {getIcon(notif.type)}
                        </div>

                        <div className="min-w-0 flex-1 space-y-0.5 text-left">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-white truncate">
                              {notif.title}
                            </span>
                            {!notif.readAt && (
                              <span className="h-1.5 w-1.5 rounded-full bg-[#14209C] shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug">
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
              <div className="p-2.5 border-t border-slate-800 bg-slate-950/80 text-center">
                <Link
                  href="/tutor/notifications"
                  onClick={() => setIsNotifOpen(false)}
                  className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition inline-flex items-center gap-1"
                >
                  <span>View all in Notification Center</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-800 mx-1" />

        {/* Top Right Profile Popover Dropdown */}
        <div className="relative" ref={profileMenuRef}>
          <button
            type="button"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="flex items-center gap-2.5 py-1 rounded-xl hover:bg-slate-800 px-2 transition-colors cursor-pointer text-left"
            aria-expanded={isProfileMenuOpen}
          >
            <Avatar
              src={avatarUrl}
              fallbackName={displayName}
              size="sm"
              statusIndicator="online"
            />
            <div className="hidden md:block">
              <p className="text-xs font-bold text-white leading-none">{displayName}</p>
              <p className="text-[10px] text-emerald-400 font-bold mt-0.5">
                ${hourlyRate}/hr · {averageRating}★
              </p>
            </div>
            <ChevronDown className={`hidden md:block h-3.5 w-3.5 text-slate-500 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {isProfileMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-slate-800 bg-slate-900 text-slate-200 shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
              {/* User Identity Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/90 flex items-center gap-3">
                <Avatar
                  src={avatarUrl}
                  fallbackName={displayName}
                  size="md"
                  statusIndicator="online"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white truncate">{displayName}</h4>
                  <p className="text-[11px] text-slate-400 truncate">{email}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-bold">
                      Tutor
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                      Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2 space-y-1 text-xs font-medium">
                <Link
                  href="/tutor/profile"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <User className="w-4 h-4 text-indigo-400" />
                  <span>Edit Public Profile & Photo</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer text-left"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <div className="flex-1 flex items-center justify-between">
                    <span>Change Password</span>
                    <span className="text-[10px] font-bold text-amber-400/90 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/80">
                      Security
                    </span>
                  </div>
                </button>

                <Link
                  href={`/tutors/${slug}`}
                  target="_blank"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                  <span>View Public Marketplace Listing</span>
                </Link>

                <Link
                  href="/tutor/notifications"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-4 h-4 text-slate-400" />
                  <span>Notification Preferences</span>
                </Link>
              </div>

              {/* Sign Out */}
              <div className="p-2 border-t border-slate-800 bg-slate-950/40">
                <Link
                  href="/login"
                  onClick={() => setIsProfileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors text-xs font-bold"
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
