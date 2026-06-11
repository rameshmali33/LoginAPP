/**
 * Notification Service
 * Business logic for notifications
 */

const notificationRepository = require("../repositories/notificationRepository");
const logger = require("../utils/logger");

class NotificationService {
  /**
   * Create notification for user
   * Called from asset/leave services when events occur
   */
  async notifyUser(userId, title, message, relatedEntity = null, relatedId = null) {
    try {
      const notification = await notificationRepository.createNotification(
        userId,
        title,
        message,
        relatedEntity,
        relatedId
      );
      logger.info(`Notification created for user ${userId}: ${title}`);
      return notification;
    } catch (error) {
      logger.error(`Failed to create notification for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Notify multiple users
   */
  async notifyUsers(userIds, title, message, relatedEntity = null, relatedId = null) {
    const notifications = [];
    for (const userId of userIds) {
      try {
        const notification = await this.notifyUser(userId, title, message, relatedEntity, relatedId);
        notifications.push(notification);
      } catch (error) {
        logger.error(`Failed to notify user ${userId}:`, error);
      }
    }
    return notifications;
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    const offset = (page - 1) * limit;
    const notifications = await notificationRepository.getUserNotifications(
      userId,
      limit,
      offset,
      unreadOnly
    );
    const unreadCount = await notificationRepository.getUnreadCount(userId);

    return {
      data: notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total: unreadCount,
      },
    };
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId) {
    return await notificationRepository.getUnreadCount(userId);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    const notification = await notificationRepository.getNotificationById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    return await notificationRepository.markAsRead(notificationId);
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  }

  /**
   * Broadcast notification to admins/managers
   * Called after important events (asset damaged, leave rejected, etc.)
   */
  async broadcastToAdmins(title, message, relatedEntity = null, relatedId = null) {
    // Query admin users from DB
    // Note: This assumes a role field in users table
    // Adjust based on your actual schema
    const query = `SELECT id FROM users WHERE role = 'admin'`;
    const { rows } = await require("../config/db").query(query);
    const adminIds = rows.map((row) => row.id);

    return await this.notifyUsers(adminIds, title, message, relatedEntity, relatedId);
  }
}

module.exports = new NotificationService();
