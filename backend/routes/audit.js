
const express = require("express");
const router = express.Router();
const auditController = require("../controllers/auditController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/", auditController.getAuditLogs);

router.get("/:tableName/:recordId", auditController.getRecordHistory);

module.exports = router;
