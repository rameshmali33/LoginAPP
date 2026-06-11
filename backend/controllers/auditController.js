/**
 * Audit Controller
 * Request handlers for audit log operations
 */

const auditService = require("../services/auditService");
const logger = require("../utils/logger");

class AuditController {
  /**
   * GET /api/audit-logs
   * Get audit logs (admin only)
   */
  getAuditLogs = async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 50,
        table_name,
        action_type,
        performed_by,
        dateFrom,
        dateTo,
      } = req.query;

      const filters = {};
      if (table_name) filters.table_name = table_name;
      if (action_type) filters.action_type = action_type;
      if (performed_by) filters.performed_by = parseInt(performed_by, 10);
      if (dateFrom) filters.dateFrom = dateFrom;
      if (dateTo) filters.dateTo = dateTo;

      const result = await auditService.getAuditLogs(
        parseInt(page, 10),
        parseInt(limit, 10),
        filters
      );

      res.json({
        success: true,
        message: "Audit logs retrieved successfully",
        ...result,
      });
    } catch (error) {
      logger.error("Get Audit Logs Error:", error);
      next(error);
    }
  };

  /**
   * GET /api/audit-logs/:tableName/:recordId
   * Get audit history for a specific record
   */
  getRecordHistory = async (req, res, next) => {
    try {
      const { tableName, recordId } = req.params;
      const history = await auditService.getRecordHistory(tableName, parseInt(recordId, 10));

      res.json({
        success: true,
        message: "Record audit history retrieved successfully",
        data: history,
      });
    } catch (error) {
      logger.error("Get Record History Error:", error);
      next(error);
    }
  };
}

module.exports = new AuditController();
