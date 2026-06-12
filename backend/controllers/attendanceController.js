const Joi = require("joi");
const attendanceService = require("../services/attendanceService");

class AttendanceController {
  clockInSchema = Joi.object({
    notes: Joi.string().allow("").max(500).optional(),
  });

  clockOutSchema = Joi.object({
    break_minutes: Joi.number().integer().min(0).default(0),
    notes: Joi.string().allow("").max(500).optional(),
  });

  manualSchema = Joi.object({
    employee_id: Joi.number().integer().required(),
    attendance_date: Joi.date().iso().required(),
    clock_in: Joi.date().iso().allow(null, "").optional(),
    clock_out: Joi.date().iso().allow(null, "").optional(),
    break_minutes: Joi.number().integer().min(0).default(0),
    status: Joi.string().valid("present", "absent", "half_day", "leave", "holiday", "late").required(),
    notes: Joi.string().allow("").max(500).optional(),
  });

  getToday = async (req, res, next) => {
    try {
      const record = await attendanceService.getToday(req.user);
      res.json({ success: true, record });
    } catch (error) {
      next(error);
    }
  };

  clockIn = async (req, res, next) => {
    try {
      const { error, value } = this.clockInSchema.validate(req.body);
      if (error) {
        error.statusCode = 400;
        return next(error);
      }

      const record = await attendanceService.clockIn(req.user, value.notes);
      res.status(201).json({ success: true, message: "Clocked in successfully", record });
    } catch (error) {
      next(error);
    }
  };

  clockOut = async (req, res, next) => {
    try {
      const { error, value } = this.clockOutSchema.validate(req.body);
      if (error) {
        error.statusCode = 400;
        return next(error);
      }

      const record = await attendanceService.clockOut(req.user, value.break_minutes, value.notes);
      res.json({ success: true, message: "Clocked out successfully", record });
    } catch (error) {
      next(error);
    }
  };

  getMyRecords = async (req, res, next) => {
    try {
      const { from, to, status } = req.query;
      const records = await attendanceService.getMyRecords(req.user, { from, to, status });
      res.json({ success: true, records });
    } catch (error) {
      next(error);
    }
  };

  getRecords = async (req, res, next) => {
    try {
      const { from, to, status, employee_id } = req.query;
      const records = await attendanceService.getRecords({ from, to, status, employee_id });
      res.json({ success: true, records });
    } catch (error) {
      next(error);
    }
  };

  upsertManualRecord = async (req, res, next) => {
    try {
      const { error, value } = this.manualSchema.validate(req.body, { stripUnknown: true });
      if (error) {
        error.statusCode = 400;
        return next(error);
      }

      const record = await attendanceService.upsertManualRecord(value, req.user.id);
      res.json({ success: true, message: "Attendance record saved successfully", record });
    } catch (error) {
      next(error);
    }
  };

  getSummary = async (req, res, next) => {
    try {
      const { from, to, employee_id } = req.query;
      const summary = await attendanceService.getSummary({ from, to, employee_id });
      res.json({ success: true, summary });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AttendanceController();
