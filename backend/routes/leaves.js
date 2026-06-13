const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/types",
  authMiddleware,
  roleMiddleware("employee", "manager", "hr", "admin"),
  leaveController.getLeaveTypes
);

router.get(
  "/balances",
  authMiddleware,
  roleMiddleware("employee", "admin"),
  leaveController.getLeaveBalances
);

router.post(
  "/apply",
  authMiddleware,
  roleMiddleware("employee", "admin"),
  leaveController.applyLeave
);

router.get(
  "/history",
  authMiddleware,
  roleMiddleware("employee", "admin"),
  leaveController.getLeaveHistory
);

router.get(
  "/pending-manager",
  authMiddleware,
  roleMiddleware("manager", "admin"),
  leaveController.getPendingForManager
);

router.put(
  "/review-manager/:id",
  authMiddleware,
  roleMiddleware("manager", "admin"),
  leaveController.reviewByManager
);

router.get(
  "/pending-hr",
  authMiddleware,
  roleMiddleware("hr", "admin"),
  leaveController.getPendingForHR
);

router.put(
  "/review-hr/:id",
  authMiddleware,
  roleMiddleware("hr", "admin"),
  leaveController.reviewByHR
);

router.get(
  "/reports",
  authMiddleware,
  roleMiddleware("hr", "admin"),
  leaveController.getLeaveReports
);

module.exports = router;
