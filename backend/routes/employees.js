const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const {
  employeeCreateSchema,
  employeeUpdateSchema,
  validateSchema,
} = require("../validators/validators");

// All routes require authentication
router.use(authMiddleware);

// GET /api/employees - list profiles (accessible to admin and employee)
router.get("/", roleMiddleware("admin", "employee"), employeeController.getEmployees);

// GET /api/employees/:id - get single profile (accessible to admin and employee)
router.get("/:id", roleMiddleware("admin", "employee"), employeeController.getEmployeeById);

// POST /api/employees - create profile (admin only)
router.post("/", roleMiddleware("admin"), validateSchema(employeeCreateSchema), employeeController.createEmployee);

// PUT /api/employees/:id - update profile (admin only)
router.put("/:id", roleMiddleware("admin"), validateSchema(employeeUpdateSchema), employeeController.updateEmployee);

// PATCH /api/employees/:id/status - update status (admin only)
router.patch("/:id/status", roleMiddleware("admin"), employeeController.updateEmployeeStatus);

// DELETE /api/employees/:id - delete profile (admin only)
router.delete("/:id", roleMiddleware("admin"), employeeController.deleteEmployee);

module.exports = router;