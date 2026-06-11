/**
 * Notification Controller
 * Request handlers for notification operations
 */

const notificationService = require("../services/notificationService");
const logger = require("../utils/logger");

class NotificationController {
  /**
   * GET /api/notifications
   * Get current user's notifications
   */
  getNotifications = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, unread_only = false } = req.query;
      const userId = req.user.id;

      const result = await notificationService.getUserNotifications(
        userId,
        parseInt(page, 10),
        parseInt(limit, 10),
        unread_only === "true"
      );

      res.json({
        success: true,
        message: "Notifications retrieved successfully",
        ...result,
      });
    } catch (error) {
      logger.error("Get Notifications Error:", error);
      next(error);
    }
  };

  /**
   * GET /api/notifications/unread-count
   * Get unread notification count for current user
   */
  getUnreadCount = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const unreadCount = await notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        message: "Unread count retrieved",
        unreadCount,
      });
    } catch (error) {
      logger.error("Get Unread Count Error:", error);
      next(error);
    }
  };

  /**
   * PUT /api/notifications/:id/read
   * Mark single notification as read
   */
  markAsRead = async (req, res, next) => {
    try {
      const { id } = req.params;
      const notification = await notificationService.markAsRead(parseInt(id, 10));

      res.json({
        success: true,
        message: "Notification marked as read",
        notification,
      });
    } catch (error) {
      if (error.message.includes("not found")) {
        error.statusCode = 404;
      }
      logger.error("Mark As Read Error:", error);
      next(error);
    }
  };

  /**
   * PUT /api/notifications/read-all
   * Mark all notifications as read for current user
   */
  markAllAsRead = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const notifications = await notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: "All notifications marked as read",
        count: notifications.length,
      });
    } catch (error) {
      logger.error("Mark All As Read Error:", error);
      next(error);
    }
  };
}

module.exports = new NotificationController();
