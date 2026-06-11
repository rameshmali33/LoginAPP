/**
 * Audit Routes
 * API endpoints for audit trail
 */

const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All audit routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

/**
 * GET /api/audit-logs
 * Get audit logs with pagination and filtering
 * Query: page, limit, table_name, action_type, performed_by, dateFrom, dateTo
 */
router.get("/", auditController.getAuditLogs);

/**
 * GET /api/audit-logs/:tableName/:recordId
 * Get audit history for a specific record
 */
router.get("/:tableName/:recordId", auditController.getRecordHistory);

module.exports = router;
