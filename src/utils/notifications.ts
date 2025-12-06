// Notification service

import { Notification } from '../types';
import { logger } from './logger';

class NotificationService {
  private notifications: Notification[] = [];

  /**
   * Add a notification
   */
  add(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      read: false,
    };

    this.notifications.unshift(newNotification);

    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    // Show desktop notification if available
    if ('Notification' in window && Notification.permission === 'granted') {
      new window.Notification(notification.title, {
        body: notification.message,
        icon: '/icon.png',
      });
    }

    logger.info('Notification added', { type: notification.type, title: notification.title });
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => {
      n.read = true;
    });
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await window.Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications = [];
  }
}

export const notificationService = new NotificationService();

