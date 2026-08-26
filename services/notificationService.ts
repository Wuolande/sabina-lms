/**
 * Client Notification Service — Connected to Supabase DB API
 * -----------------------------------------------------------------------
 */

import { UserNotificationItem } from "@/src/modules/notifications/repositories/notificationRepository";

export const notificationService = {
  /**
   * Get notifications and unread count for current user.
   */
  async getNotifications(): Promise<{ unreadCount: number; notifications: UserNotificationItem[] }> {
    try {
      const res = await fetch('/api/notifications');
      if (!res.ok) return { unreadCount: 0, notifications: [] };
      return res.json();
    } catch {
      return { unreadCount: 0, notifications: [] };
    }
  },

  /**
   * Get unread notifications count.
   */
  async getUnreadCount(): Promise<number> {
    try {
      const data = await this.getNotifications();
      return data.unreadCount || 0;
    } catch {
      return 0;
    }
  },

  /**
   * Mark notification(s) as read.
   */
  async markAsRead(notificationId?: string): Promise<boolean> {
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },
};
