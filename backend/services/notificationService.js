
const notificationRepository = require("../repositories/notificationRepository");
const logger = require("../utils/logger");

class NotificationService {
  async notifyUser(userId, title, message, relatedEntity = null, relatedId = null) {
    if (!userId) return null;

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
      return null;
    }
  }

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

  async getUnreadCount(userId) {
    return await notificationRepository.getUnreadCount(userId);
  }

  async markAsRead(notificationId, userId) {
    const notification = await notificationRepository.getNotificationById(notificationId);
    if (!notification) {
      throw new Error("Notification not found");
    }

    if (notification.user_id !== userId) {
      const error = new Error("You do not have access to this notification");
      error.statusCode = 403;
      throw error;
    }

    return await notificationRepository.markAsRead(notificationId);
  }

  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  }

  async broadcastToAdmins(title, message, relatedEntity = null, relatedId = null) {
    const adminIds = await notificationRepository.getUserIdsByRoles(["admin"]);
    return await this.notifyUsers(adminIds, title, message, relatedEntity, relatedId);
  }

  async notifyRoles(roles, title, message, relatedEntity = null, relatedId = null) {
    try {
      const userIds = await notificationRepository.getUserIdsByRoles(roles);
      return await this.notifyUsers(userIds, title, message, relatedEntity, relatedId);
    } catch (error) {
      logger.error(`Failed to notify roles ${roles.join(",")}:`, error);
      return [];
    }
  }

  async safeNotifyEmployeeByProfileId(employeeId, title, message, relatedEntity = null, relatedId = null) {
    try {
      return await this.notifyEmployeeByProfileId(employeeId, title, message, relatedEntity, relatedId);
    } catch (error) {
      logger.error(`Failed to notify employee profile ${employeeId}:`, error);
      return null;
    }
  }

  async notifyEmployeeByProfileId(employeeId, title, message, relatedEntity = null, relatedId = null) {
    const userId = await notificationRepository.getUserIdForEmployee(employeeId);
    if (!userId) {
      logger.warn(`No linked user found for employee profile ${employeeId}`);
      return null;
    }

    return await this.notifyUser(userId, title, message, relatedEntity, relatedId);
  }
}

module.exports = new NotificationService();
