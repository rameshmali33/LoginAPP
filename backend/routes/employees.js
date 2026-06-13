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

router.use(authMiddleware);

router.get("/", roleMiddleware("admin", "employee"), employeeController.getEmployees);

router.get("/:id", roleMiddleware("admin", "employee"), employeeController.getEmployeeById);

router.post("/", roleMiddleware("admin"), validateSchema(employeeCreateSchema), employeeController.createEmployee);

router.put("/:id", roleMiddleware("admin"), validateSchema(employeeUpdateSchema), employeeController.updateEmployee);

router.patch("/:id/status", roleMiddleware("admin"), employeeController.updateEmployeeStatus);

router.delete("/:id", roleMiddleware("admin"), employeeController.deleteEmployee);

module.exports = router;