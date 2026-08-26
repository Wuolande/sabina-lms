/**
 * Notification Repository — Supabase DB Access for Notifications
 * -----------------------------------------------------------------------
 */

import { adminSupabase } from '@/src/shared/database/supabase';

export interface UserNotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  readAt?: string;
  createdAt: string;
}

export class NotificationRepository {
  /**
   * Get notifications and unread count for user.
   */
  async getUserNotifications(userId: string): Promise<{ unreadCount: number; notifications: UserNotificationItem[] }> {
    const { data, error } = await adminSupabase.rpc('get_user_notifications', {
      p_user_id: userId,
    });

    if (error) {
      throw new Error(`[NotificationRepository.getUserNotifications] ${error.message}`);
    }
    return data || { unreadCount: 0, notifications: [] };
  }

  /**
   * Mark notification(s) as read.
   */
  async markAsRead(userId: string, notificationId?: string): Promise<void> {
    let query = adminSupabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (notificationId) {
      query = query.eq('id', notificationId);
    }

    const { error } = await query;
    if (error) {
      throw new Error(`[NotificationRepository.markAsRead] ${error.message}`);
    }
  }
}

export const notificationRepository = new NotificationRepository();
