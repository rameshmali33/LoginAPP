const Joi = require("joi");
const payrollService = require("../services/payrollService");

class PayrollController {
  periodSchema = Joi.object({
    period_name: Joi.string().required().max(120),
    payroll_month: Joi.number().integer().min(1).max(12).required(),
    payroll_year: Joi.number().integer().min(2000).required(),
    start_date: Joi.date().iso().required(),
    end_date: Joi.date().iso().required(),
    working_days: Joi.number().min(0).optional(),
    notes: Joi.string().allow("").max(1000).optional(),
  });

  generateSchema = Joi.object({
    pf_rate: Joi.number().min(0).max(100).default(12),
    esi_rate: Joi.number().min(0).max(100).default(0),
    tds_rate: Joi.number().min(0).max(100).default(0),
    professional_tax: Joi.number().min(0).default(0),
    overtime_multiplier: Joi.number().min(0).default(1.5),
    bonus: Joi.number().min(0).default(0),
    reimbursements: Joi.number().min(0).default(0),
    loan_deduction: Joi.number().min(0).default(0),
    other_deductions: Joi.number().min(0).default(0),
  });

  recordSchema = Joi.object({
    basic_pay: Joi.number().min(0).optional(),
    hra: Joi.number().min(0).optional(),
    conveyance_allowance: Joi.number().min(0).optional(),
    medical_allowance: Joi.number().min(0).optional(),
    special_allowance: Joi.number().min(0).optional(),
    overtime_pay: Joi.number().min(0).optional(),
    bonus: Joi.number().min(0).optional(),
    reimbursements: Joi.number().min(0).optional(),
    loss_of_pay: Joi.number().min(0).optional(),
    provident_fund: Joi.number().min(0).optional(),
    esi: Joi.number().min(0).optional(),
    professional_tax: Joi.number().min(0).optional(),
    tds: Joi.number().min(0).optional(),
    loan_deduction: Joi.number().min(0).optional(),
    other_deductions: Joi.number().min(0).optional(),
    status: Joi.string().valid("draft", "approved", "paid", "hold").optional(),
    payment_date: Joi.date().iso().allow(null, "").optional(),
    payment_reference: Joi.string().allow("").max(120).optional(),
    remarks: Joi.string().allow("").max(1000).optional(),
  });

  createPeriod = async (req, res, next) => {
    try {
      const { error, value } = this.periodSchema.validate(req.body, { stripUnknown: true });
      if (error) {
        error.statusCode = 400;
        return next(error);
      }

      const period = await payrollService.createPeriod(value, req.user.id);
      res.status(201).json({ success: true, message: "Payroll period created", period });
    } catch (error) {
      next(error);
    }
  };

  getPeriods = async (req, res, next) => {
    try {
      const periods = await payrollService.getPeriods();
      res.json({ success: true, periods });
    } catch (error) {
      next(error);
    }
  };

  generatePayroll = async (req, res, next) => {
    try {
      const { error, value } = this.generateSchema.validate(req.body, { stripUnknown: true });
      if (error) {
        error.statusCode = 400;
        return next(error);
      }

      const records = await payrollService.generatePayroll(parseInt(req.params.id, 10), req.user.id, value);
      res.json({ success: true, message: "Payroll generated successfully", records });
    } catch (error) {
      next(error);
    }
  };

  getPayrollRecords = async (req, res, next) => {
    try {
      const result = await payrollService.getPayrollRecords(parseInt(req.params.id, 10));
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getMyPayslips = async (req, res, next) => {
    try {
      const payslips = await payrollService.getMyPayslips(req.user);
      res.json({ success: true, payslips });
    } catch (error) {
      next(error);
    }
  };

  getRecordById = async (req, res, next) => {
    try {
      const record = await payrollService.getRecordById(parseInt(req.params.id, 10), req.user);
      res.json({ success: true, record });
    } catch (error) {
      next(error);
    }
  };

  updateRecord = async (req, res, next) => {
    try {
      const { error, value } = this.recordSchema.validate(req.body, { stripUnknown: true });
      if (error) {
        error.statusCode = 400;
        return next(error);
      }

      const record = await payrollService.updateRecord(parseInt(req.params.id, 10), value);
      res.json({ success: true, message: "Payroll record updated", record });
    } catch (error) {
      next(error);
    }
  };

  updatePeriodStatus = async (req, res, next) => {
    try {
      const schema = Joi.object({
        status: Joi.string().valid("draft", "processed", "paid", "locked").required(),
      });
      const { error, value } = schema.validate(req.body);
      if (error) {
        error.statusCode = 400;
        return next(error);
      }

      const period = await payrollService.updatePeriodStatus(parseInt(req.params.id, 10), value.status);
      res.json({ success: true, message: "Payroll period status updated", period });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new PayrollController();
