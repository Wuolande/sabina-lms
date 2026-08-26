/**
 * Notification Service — Business Logic for Notifications
 * -----------------------------------------------------------------------
 */

import { notificationRepository, UserNotificationItem } from '../repositories/notificationRepository';

export class NotificationService {
  async getUserNotifications(userId: string): Promise<{ unreadCount: number; notifications: UserNotificationItem[] }> {
    return notificationRepository.getUserNotifications(userId);
  }

  async markAsRead(userId: string, notificationId?: string): Promise<void> {
    return notificationRepository.markAsRead(userId, notificationId);
  }
}

export const domainNotificationService = new NotificationService();
