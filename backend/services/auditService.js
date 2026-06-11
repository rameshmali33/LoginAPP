/**
 * Audit Service
 * Business logic for audit trail
 */

const auditRepository = require("../repositories/auditRepository");
const logger = require("../utils/logger");

class AuditService {
  /**
   * Log a data change
   * Called from services when entities are created/updated/deleted
   */
  async logChange(
    tableName,
    actionType,
    recordId,
    oldData = null,
    newData = null,
    userId = null,
    ipAddress = null,
    userAgent = null
  ) {
    try {
      const auditLog = await auditRepository.createAuditLog(
        tableName,
        actionType,
        recordId,
        oldData,
        newData,
        userId,
        ipAddress,
        userAgent
      );

      logger.info(
        `Audit log created: ${tableName} ${actionType} record ${recordId} by user ${userId}`
      );
      return auditLog;
    } catch (error) {
      logger.error(`Failed to create audit log for ${tableName}:`, error);
      // Don't throw - audit failure shouldn't break the main operation
    }
  }

  /**
   * Get audit logs with pagination
   */
  async getAuditLogs(page = 1, limit = 50, filters = {}) {
    const offset = (page - 1) * limit;
    const logs = await auditRepository.getAuditLogs(limit, offset, filters);
    const total = await auditRepository.getAuditLogCount(filters);

    return {
      data: logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get audit history for a specific record
   */
  async getRecordHistory(tableName, recordId) {
    return await auditRepository.getRecordAuditHistory(tableName, recordId);
  }
}

module.exports = new AuditService();
