"use client";

import * as React from "react";
import Link from "next/link";
import { Bell, CheckCheck, Clock, Video, CreditCard, Star, MessageSquare, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { notificationService } from "@/services/notificationService";
import { UserNotificationItem } from "@/src/modules/notifications/repositories/notificationRepository";
import { formatDate } from "@/lib/utils";

export default function StudentNotificationsPage() {
  const [notifications, setNotifications] = React.useState<UserNotificationItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchNotifs = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const handleMarkAllRead = async () => {
    await notificationService.markAsRead();
    fetchNotifs();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "LESSON_REMINDER":
      case "LESSON_BOOKED":
        return <Video className="h-5 w-5 text-[#14209C]" />;
      case "PAYMENT_SUCCESS":
        return <CreditCard className="h-5 w-5 text-emerald-600" />;
      case "NEW_MESSAGE":
        return <MessageSquare className="h-5 w-5 text-[#14209C]" />;
      case "NEW_REVIEW":
      case "REVIEW_RECEIVED":
        return <Star className="h-5 w-5 text-amber-500" />;
      default:
        return <Bell className="h-5 w-5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time lesson reminders, tutor messages, and schedule updates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifs}
            className="text-xs flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="default"
            size="sm"
            onClick={handleMarkAllRead}
            className="font-bold bg-[#14209C] hover:bg-[#0d1870] text-white text-xs flex items-center gap-1.5"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all read</span>
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 divide-y divide-slate-100">
        {loading ? (
          <div className="space-y-3 py-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">No notifications</h4>
            <p className="text-xs text-slate-400">You're all caught up with your classes and messages.</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`pt-4 first:pt-0 flex items-start justify-between gap-4 transition-colors ${
                !notif.readAt ? "bg-indigo-50/40 -mx-6 px-6 py-3 rounded-2xl" : ""
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                  {getIcon(notif.type)}
                </div>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      {notif.title}
                    </h4>
                    {!notif.readAt && (
                      <span className="h-2 w-2 rounded-full bg-[#14209C]" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {notif.body}
                  </p>
                  <span className="text-[10px] text-slate-400 block pt-0.5">
                    {formatDate(notif.createdAt)}
                  </span>
                </div>
              </div>

              {notif.actionUrl && (
                <Link href={notif.actionUrl} className="shrink-0">
                  <Button variant="outline" size="sm" className="text-xs font-semibold">
                    View
                  </Button>
                </Link>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
