const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/my-payslips", roleMiddleware("employee", "manager", "hr", "admin"), payrollController.getMyPayslips);
router.get("/records/:id", roleMiddleware("employee", "manager", "hr", "admin"), payrollController.getRecordById);

router.get("/periods", roleMiddleware("hr", "admin"), payrollController.getPeriods);
router.post("/periods", roleMiddleware("hr", "admin"), payrollController.createPeriod);
router.post("/periods/:id/generate", roleMiddleware("hr", "admin"), payrollController.generatePayroll);
router.get("/periods/:id/records", roleMiddleware("hr", "admin"), payrollController.getPayrollRecords);
router.patch("/periods/:id/status", roleMiddleware("hr", "admin"), payrollController.updatePeriodStatus);
router.patch("/records/:id", roleMiddleware("hr", "admin"), payrollController.updateRecord);

module.exports = router;
