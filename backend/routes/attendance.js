const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/today", roleMiddleware("employee", "manager", "hr", "admin"), attendanceController.getToday);
router.post("/clock-in", roleMiddleware("employee", "manager", "hr", "admin"), attendanceController.clockIn);
router.post("/clock-out", roleMiddleware("employee", "manager", "hr", "admin"), attendanceController.clockOut);
router.get("/my", roleMiddleware("employee", "manager", "hr", "admin"), attendanceController.getMyRecords);

router.get("/", roleMiddleware("manager", "hr", "admin"), attendanceController.getRecords);
router.get("/summary", roleMiddleware("manager", "hr", "admin"), attendanceController.getSummary);
router.post("/manual", roleMiddleware("hr", "admin"), attendanceController.upsertManualRecord);

module.exports = router;
