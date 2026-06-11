/**
 * Notification Repository
 * Direct SQL queries for notification operations
 */

const pool = require("../config/db");

class NotificationRepository {
  /**
   * Create notification
   */
  async createNotification(userId, title, message, relatedEntity = null, relatedId = null) {
    const query = `
      INSERT INTO notifications (user_id, title, message, related_entity, related_id, is_read)
      VALUES ($1, $2, $3, $4, $5, FALSE)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, title, message, relatedEntity, relatedId]);
    return result.rows[0];
  }

  /**
   * Get user notifications
   */
  async getUserNotifications(userId, limit = 20, offset = 0, unreadOnly = false) {
    let query = "SELECT * FROM notifications WHERE user_id = $1";
    const params = [userId];

    if (unreadOnly) {
      query += " AND is_read = FALSE";
    }

    query += " ORDER BY created_at DESC LIMIT $" + (params.length + 1) + " OFFSET $" + (params.length + 2);
    params.push(limit);
    params.push(offset);

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get unread count for user
   */
  async getUnreadCount(userId) {
    const query = "SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = FALSE";
    const result = await pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, client = null) {
    const db = client || pool;
    const query = "UPDATE notifications SET is_read = TRUE WHERE id = $1 RETURNING *";
    const result = await db.query(query, [notificationId]);
    return result.rows[0];
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId, client = null) {
    const db = client || pool;
    const query = "UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE RETURNING *";
    const result = await db.query(query, [userId]);
    return result.rows;
  }

  /**
   * Get notification by ID
   */
  async getNotificationById(id) {
    const query = "SELECT * FROM notifications WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Delete notification
   */
  async deleteNotification(id) {
    const query = "DELETE FROM notifications WHERE id = $1";
    await pool.query(query, [id]);
  }

  /**
   * Delete old notifications (older than days)
   */
  async deleteOldNotifications(days = 30) {
    const query = `DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '${days} days'`;
    await pool.query(query);
  }
}

module.exports = new NotificationRepository();
