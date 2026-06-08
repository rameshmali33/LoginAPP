const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Route configurations with authentication and role authorizations

// Get available leave types (accessible to all authenticated users)
router.get(
  "/types",
  authMiddleware,
  roleMiddleware("employee", "manager", "hr", "admin"),
  leaveController.getLeaveTypes
);

// Get leave balance for current logged-in employee
router.get(
  "/balances",
  authMiddleware,
  roleMiddleware("employee", "admin"),
  leaveController.getLeaveBalances
);

// Apply for a new leave request (Employees only)
router.post(
  "/apply",
  authMiddleware,
  roleMiddleware("employee", "admin"),
  leaveController.applyLeave
);

// Get leave history for logged-in employee
router.get(
  "/history",
  authMiddleware,
  roleMiddleware("employee", "admin"),
  leaveController.getLeaveHistory
);

// Get pending leave reviews for managers
router.get(
  "/pending-manager",
  authMiddleware,
  roleMiddleware("manager", "admin"),
  leaveController.getPendingForManager
);

// Review (approve/reject) leave request by manager
router.put(
  "/review-manager/:id",
  authMiddleware,
  roleMiddleware("manager", "admin"),
  leaveController.reviewByManager
);

// Get pending leave reviews for HR
router.get(
  "/pending-hr",
  authMiddleware,
  roleMiddleware("hr", "admin"),
  leaveController.getPendingForHR
);

// Review (approve/reject) leave request by HR (ACID transaction deduction)
router.put(
  "/review-hr/:id",
  authMiddleware,
  roleMiddleware("hr", "admin"),
  leaveController.reviewByHR
);

// Get Leave aggregates, monthly trends, absence rankings, and balances report (HR and Admin only)
router.get(
  "/reports",
  authMiddleware,
  roleMiddleware("hr", "admin"),
  leaveController.getLeaveReports
);

module.exports = router;
