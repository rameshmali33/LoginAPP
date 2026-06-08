const Joi = require("joi");
const leaveService = require("../services/leaveService");

class LeaveController {
  // Schema definitions
  applyLeaveSchema = Joi.object({
    leave_type_id: Joi.number().integer().required(),
    from_date: Joi.date().iso().required(),
    to_date: Joi.date().iso().required(),
    reason: Joi.string().allow("").max(500).optional(),
  });

  reviewLeaveSchema = Joi.object({
    status: Joi.string().valid("approved", "rejected").required(),
    remarks: Joi.string().allow("").max(500).optional(),
  });

  getLeaveTypes = async (req, res) => {
    try {
      const types = await leaveService.getLeaveTypes();
      res.json(types);
    } catch (error) {
      console.error("Get Leave Types Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

  getLeaveBalances = async (req, res) => {
    try {
      const employeeProfileId = req.user.employee_profile_id;
      if (!employeeProfileId) {
        return res.status(400).json({ message: "Your user account is not linked to any employee profile" });
      }

      const balances = await leaveService.getLeaveBalances(employeeProfileId);
      res.json(balances);
    } catch (error) {
      console.error("Get Leave Balances Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

  applyLeave = async (req, res) => {
    try {
      const employeeProfileId = req.user.employee_profile_id;
      if (!employeeProfileId) {
        return res.status(400).json({ message: "Only users with linked employee profiles can apply for leaves." });
      }

      const { error, value } = this.applyLeaveSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const newLeave = await leaveService.applyLeave(
        employeeProfileId,
        value.leave_type_id,
        value.from_date,
        value.to_date,
        value.reason
      );

      res.status(201).json({
        message: "Leave application submitted successfully",
        leave: newLeave,
      });
    } catch (error) {
      console.error("Apply Leave Error:", error);
      res.status(400).json({ message: error.message });
    }
  };

  getLeaveHistory = async (req, res) => {
    try {
      const employeeProfileId = req.user.employee_profile_id;
      if (!employeeProfileId) {
        return res.status(400).json({ message: "Your user account is not linked to any employee profile" });
      }

      const history = await leaveService.getLeaveHistory(employeeProfileId);
      res.json(history);
    } catch (error) {
      console.error("Get Leave History Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

  getPendingForManager = async (req, res) => {
    try {
      const pending = await leaveService.getPendingForManager();
      res.json(pending);
    } catch (error) {
      console.error("Get Manager Pending Leaves Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

  getPendingForHR = async (req, res) => {
    try {
      const pending = await leaveService.getPendingForHR();
      res.json(pending);
    } catch (error) {
      console.error("Get HR Pending Leaves Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };

  reviewByManager = async (req, res) => {
    try {
      const { id } = req.params;
      const { error, value } = this.reviewLeaveSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const updated = await leaveService.reviewByManager(
        id,
        req.user.id,
        value.status,
        value.remarks
      );

      res.json({
        message: `Leave request ${value.status} successfully by manager`,
        leave: updated,
      });
    } catch (error) {
      console.error("Manager Review Leave Error:", error);
      res.status(400).json({ message: error.message });
    }
  };

  reviewByHR = async (req, res) => {
    try {
      const { id } = req.params;
      const { error, value } = this.reviewLeaveSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }

      const updated = await leaveService.reviewByHR(
        id,
        req.user.id,
        value.status,
        value.remarks
      );

      res.json({
        message: `Leave request final approval ${value.status} by HR`,
        leave: updated,
      });
    } catch (error) {
      console.error("HR Review Leave Error:", error);
      res.status(400).json({ message: error.message });
    }
  };

  getLeaveReports = async (req, res) => {
    try {
      const reports = await leaveService.getLeaveReports();
      res.json(reports);
    } catch (error) {
      console.error("Get Leave Reports Error:", error);
      res.status(500).json({ message: "Server Error", error: error.message });
    }
  };
}

module.exports = new LeaveController();
