const leaveRepository = require("../repositories/leaveRepository");
const pool = require("../config/db");

class LeaveService {
  async getLeaveTypes() {
    return await leaveRepository.getLeaveTypes();
  }

  async getLeaveBalances(employeeId) {
    return await leaveRepository.getLeaveBalances(employeeId);
  }

  async applyLeave(employeeId, leaveTypeId, fromDate, toDate, reason) {
    // Calculate total days
    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new Error("Invalid from_date or to_date format");
    }

    if (start > end) {
      throw new Error("Start date cannot be after end date");
    }

    const diffTime = Math.abs(end - start);
    const totalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Check available balance
    const available = await leaveRepository.checkLeaveBalance(employeeId, leaveTypeId);
    if (available < totalDays) {
      throw new Error(`Insufficient leave balance. Required: ${totalDays}, Available: ${available}`);
    }

    return await leaveRepository.createLeaveApplication(
      employeeId,
      leaveTypeId,
      fromDate,
      toDate,
      totalDays,
      reason
    );
  }

  async getLeaveHistory(employeeId) {
    return await leaveRepository.getLeaveHistory(employeeId);
  }

  async getPendingForManager() {
    return await leaveRepository.getPendingApplicationsForManager();
  }

  async getPendingForHR() {
    return await leaveRepository.getPendingApplicationsForHR();
  }

  // Manager action (updates status to pending_hr or rejected)
  async reviewByManager(leaveId, managerUserId, status, remarks) {
    if (status !== "approved" && status !== "rejected") {
      throw new Error("Status must be approved or rejected");
    }

    const application = await leaveRepository.getLeaveApplicationById(leaveId);
    if (!application) {
      throw new Error("Leave application not found");
    }

    if (application.status !== "pending_manager") {
      throw new Error(`Leave application is already in status: ${application.status}`);
    }

    const nextStatus = status === "approved" ? "pending_hr" : "rejected";
    const action = status === "approved" ? "approved_by_manager" : "rejected_by_manager";

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updatedApp = await leaveRepository.updateApplicationStatus(client, leaveId, nextStatus);
      await leaveRepository.createApprovalHistory(client, leaveId, managerUserId, action, remarks);

      await client.query("COMMIT");
      return updatedApp;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // HR action (final approval updates status to approved/rejected, deducts available days on approval)
  async reviewByHR(leaveId, hrUserId, status, remarks) {
    if (status !== "approved" && status !== "rejected") {
      throw new Error("Status must be approved or rejected");
    }

    const application = await leaveRepository.getLeaveApplicationById(leaveId);
    if (!application) {
      throw new Error("Leave application not found");
    }

    if (application.status !== "pending_hr") {
      throw new Error(`Leave application is in status: ${application.status}. HR review is only allowed for pending_hr status.`);
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      let updatedApp;
      if (status === "rejected") {
        updatedApp = await leaveRepository.updateApplicationStatus(client, leaveId, "rejected");
        await leaveRepository.createApprovalHistory(client, leaveId, hrUserId, "rejected_by_hr", remarks);
      } else {
        // Double check balance before deducting
        const available = await leaveRepository.checkLeaveBalance(
          application.employee_id,
          application.leave_type_id
        );
        if (available < application.total_days) {
          throw new Error(`Insufficient leave balance to approve this leave. Required: ${application.total_days}, Available: ${available}`);
        }

        // Deduct balance
        await leaveRepository.deductLeaveBalance(
          client,
          application.employee_id,
          application.leave_type_id,
          application.total_days
        );

        // Update application status to approved
        updatedApp = await leaveRepository.updateApplicationStatus(client, leaveId, "approved");

        // Log to history
        await leaveRepository.createApprovalHistory(client, leaveId, hrUserId, "approved_by_hr", remarks);
      }

      await client.query("COMMIT");
      return updatedApp;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // Get combined leave reports data
  async getLeaveReports() {
    const stats = await leaveRepository.getLeaveStats();
    const departmentLeaves = await leaveRepository.getDepartmentWiseLeaves();
    const monthlyTrends = await leaveRepository.getMonthlyLeaveTrends();
    const mostAbsent = await leaveRepository.getMostAbsentEmployees();
    const balanceReport = await leaveRepository.getLeaveBalanceReport();

    return {
      stats,
      departmentLeaves,
      monthlyTrends,
      mostAbsent,
      balanceReport,
    };
  }
}

module.exports = new LeaveService();
