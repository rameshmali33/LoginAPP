/**
 * Notification Routes
 * API endpoints for notifications
 */

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const authMiddleware = require("../middleware/authMiddleware");

// All notification routes require authentication
router.use(authMiddleware);

/**
 * GET /api/notifications
 * Get current user's notifications
 * Query: page, limit, unread_only
 */
router.get("/", notificationController.getNotifications);

/**
 * GET /api/notifications/unread-count
 * Get unread count
 */
router.get("/unread-count", notificationController.getUnreadCount);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put("/:id/read", notificationController.markAsRead);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put("/read-all", notificationController.markAllAsRead);

module.exports = router;
