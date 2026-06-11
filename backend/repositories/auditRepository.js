/**
 * Audit Repository
 * Direct SQL queries for audit log operations
 */

const pool = require("../config/db");

class AuditRepository {
  /**
   * Create audit log entry
   */
  async createAuditLog(
    tableName,
    actionType,
    recordId,
    oldData = null,
    newData = null,
    performedBy = null,
    ipAddress = null,
    userAgent = null
  ) {
    const query = `
      INSERT INTO audit_logs (table_name, action_type, record_id, old_data, new_data, performed_by, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const result = await pool.query(query, [
      tableName,
      actionType,
      recordId,
      oldData ? JSON.stringify(oldData) : null,
      newData ? JSON.stringify(newData) : null,
      performedBy,
      ipAddress,
      userAgent,
    ]);
    return result.rows[0];
  }

  /**
   * Get audit logs with pagination and filtering
   */
  async getAuditLogs(limit = 50, offset = 0, filters = {}) {
    let query = "SELECT * FROM audit_logs WHERE 1=1";
    const params = [];

    // Filter by table name
    if (filters.table_name) {
      params.push(filters.table_name);
      query += ` AND table_name = $${params.length}`;
    }

    // Filter by action type
    if (filters.action_type) {
      params.push(filters.action_type);
      query += ` AND action_type = $${params.length}`;
    }

    // Filter by performed_by user
    if (filters.performed_by) {
      params.push(filters.performed_by);
      query += ` AND performed_by = $${params.length}`;
    }

    // Filter by date range
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      query += ` AND created_at >= $${params.length}`;
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      query += ` AND created_at <= $${params.length}`;
    }

    // Pagination
    params.push(limit);
    params.push(offset);
    query += ` ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get total audit log count
   */
  async getAuditLogCount(filters = {}) {
    let query = "SELECT COUNT(*) as count FROM audit_logs WHERE 1=1";
    const params = [];

    if (filters.table_name) {
      params.push(filters.table_name);
      query += ` AND table_name = $${params.length}`;
    }
    if (filters.action_type) {
      params.push(filters.action_type);
      query += ` AND action_type = $${params.length}`;
    }
    if (filters.performed_by) {
      params.push(filters.performed_by);
      query += ` AND performed_by = $${params.length}`;
    }
    if (filters.dateFrom) {
      params.push(filters.dateFrom);
      query += ` AND created_at >= $${params.length}`;
    }
    if (filters.dateTo) {
      params.push(filters.dateTo);
      query += ` AND created_at <= $${params.length}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id) {
    const query = "SELECT * FROM audit_logs WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get audit logs for a specific record
   */
  async getRecordAuditHistory(tableName, recordId) {
    const query = `
      SELECT 
        al.*,
        u.name as performed_by_name
      FROM audit_logs al
      LEFT JOIN users u ON al.performed_by = u.id
      WHERE al.table_name = $1 AND al.record_id = $2
      ORDER BY al.created_at DESC
    `;
    const result = await pool.query(query, [tableName, recordId]);
    return result.rows;
  }
}

module.exports = new AuditRepository();
