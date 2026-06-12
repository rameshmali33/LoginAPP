const payrollRepository = require("../repositories/payrollRepository");
const notificationService = require("./notificationService");

class PayrollService {
  async createPeriod(data, userId) {
    const workingDays = data.working_days || this.calculateWeekdays(data.start_date, data.end_date);
    return await payrollRepository.createPeriod({ ...data, working_days: workingDays }, userId);
  }

  async getPeriods() {
    return await payrollRepository.getPeriods();
  }

  async generatePayroll(periodId, userId, options = {}) {
    const period = await payrollRepository.getPeriodById(periodId);
    if (!period) {
      const error = new Error("Payroll period not found");
      error.statusCode = 404;
      throw error;
    }

    const employees = await payrollRepository.getActiveEmployees();
    const attendanceStats = await payrollRepository.getAttendanceStats(period.start_date, period.end_date);
    const attendanceByEmployee = new Map(attendanceStats.map((item) => [item.employee_id, item]));
    const records = [];

    for (const employee of employees) {
      const record = this.calculatePayrollRecord(period, employee, attendanceByEmployee.get(employee.id), options);
      const saved = await payrollRepository.upsertPayrollRecord(record, userId);
      records.push(saved);
    }

    await payrollRepository.markPeriodProcessed(periodId, userId);
    await notificationService.notifyRoles(
      ["hr", "admin"],
      "Payroll Generated",
      `${period.period_name} payroll generated for ${records.length} employee(s).`,
      "payroll_period",
      periodId
    );

    return records;
  }

  async getPayrollRecords(periodId) {
    const records = await payrollRepository.getPayrollRecords(periodId);
    const summary = await payrollRepository.getPayrollSummary(periodId);
    return { records, summary };
  }

  async getMyPayslips(user) {
    if (!user.employee_profile_id) {
      const error = new Error("Your user account is not linked to any employee profile");
      error.statusCode = 400;
      throw error;
    }
    return await payrollRepository.getMyPayslips(user.employee_profile_id);
  }

  async getRecordById(id, user) {
    const record = await payrollRepository.getPayrollRecordById(id);
    if (!record) {
      const error = new Error("Payroll record not found");
      error.statusCode = 404;
      throw error;
    }

    if (user.role === "employee" && record.employee_id !== user.employee_profile_id) {
      const error = new Error("You do not have access to this payslip");
      error.statusCode = 403;
      throw error;
    }

    return record;
  }

  async updateRecord(id, data) {
    const existing = await payrollRepository.getPayrollRecordById(id);
    if (!existing) {
      const error = new Error("Payroll record not found");
      error.statusCode = 404;
      throw error;
    }

    const recalculated = this.recalculateEditedRecord({ ...existing, ...data });
    const updated = await payrollRepository.updateRecord(id, recalculated);

    await this.notifyPayrollStatusChange(existing, updated);

    return updated;
  }

  async updatePeriodStatus(id, status) {
    const period = await payrollRepository.updatePeriodStatus(id, status);
    if (!period) {
      const error = new Error("Payroll period not found");
      error.statusCode = 404;
      throw error;
    }
    await notificationService.notifyRoles(
      ["hr", "admin"],
      "Payroll Period Updated",
      `${period.period_name} status changed to ${status}.`,
      "payroll_period",
      id
    );

    return period;
  }

  calculatePayrollRecord(period, employee, attendance = {}, options = {}) {
    const workingDays = Number(period.working_days || 0);
    const salary = Number(employee.salary || 0);
    const presentDays = Number(attendance.present_days || 0);
    const halfDays = Number(attendance.half_days || 0);
    const absentDays = Number(attendance.absent_days || 0);
    const leaveDays = Number(attendance.leave_days || 0);
    const overtimeMinutes = Number(attendance.overtime_minutes || 0);
    const unpaidDays = absentDays + halfDays * 0.5;
    const paidDays = Math.max(workingDays - unpaidDays, 0);
    const perDaySalary = workingDays > 0 ? salary / workingDays : 0;
    const perHourSalary = workingDays > 0 ? salary / (workingDays * 8) : 0;

    const basicPay = this.money(salary * 0.5);
    const hra = this.money(basicPay * 0.4);
    const conveyance = this.money(Math.min(1600, salary * 0.05));
    const medical = this.money(Math.min(1250, salary * 0.04));
    const special = this.money(Math.max(salary - basicPay - hra - conveyance - medical, 0));
    const overtimePay = this.money((overtimeMinutes / 60) * perHourSalary * Number(options.overtime_multiplier || 1.5));
    const bonus = this.money(Number(options.bonus || 0));
    const reimbursements = this.money(Number(options.reimbursements || 0));
    const lossOfPay = this.money(unpaidDays * perDaySalary);
    const providentFund = this.money(basicPay * (Number(options.pf_rate || 0) / 100));
    const esi = this.money(salary * (Number(options.esi_rate || 0) / 100));
    const professionalTax = this.money(Number(options.professional_tax || 0));
    const tds = this.money(salary * (Number(options.tds_rate || 0) / 100));
    const loanDeduction = this.money(Number(options.loan_deduction || 0));
    const otherDeductions = this.money(Number(options.other_deductions || 0));
    const grossEarnings = this.money(salary + overtimePay + bonus + reimbursements);
    const totalDeductions = this.money(
      lossOfPay + providentFund + esi + professionalTax + tds + loanDeduction + otherDeductions
    );
    const netPay = this.money(Math.max(grossEarnings - totalDeductions, 0));

    return {
      period_id: period.id,
      employee_id: employee.id,
      basic_salary: this.money(salary),
      paid_days: this.money(paidDays),
      present_days: this.money(presentDays),
      half_days: this.money(halfDays),
      absent_days: this.money(absentDays),
      leave_days: this.money(leaveDays),
      overtime_minutes: overtimeMinutes,
      basic_pay: basicPay,
      hra,
      conveyance_allowance: conveyance,
      medical_allowance: medical,
      special_allowance: special,
      overtime_pay: overtimePay,
      bonus,
      reimbursements,
      gross_earnings: grossEarnings,
      loss_of_pay: lossOfPay,
      provident_fund: providentFund,
      esi,
      professional_tax: professionalTax,
      tds,
      loan_deduction: loanDeduction,
      other_deductions: otherDeductions,
      total_deductions: totalDeductions,
      net_pay: netPay,
      status: "draft",
    };
  }

  recalculateEditedRecord(record) {
    const grossEarnings = this.money(
      Number(record.basic_pay || 0) +
        Number(record.hra || 0) +
        Number(record.conveyance_allowance || 0) +
        Number(record.medical_allowance || 0) +
        Number(record.special_allowance || 0) +
        Number(record.overtime_pay || 0) +
        Number(record.bonus || 0) +
        Number(record.reimbursements || 0)
    );

    const totalDeductions = this.money(
      Number(record.loss_of_pay || 0) +
        Number(record.provident_fund || 0) +
        Number(record.esi || 0) +
        Number(record.professional_tax || 0) +
        Number(record.tds || 0) +
        Number(record.loan_deduction || 0) +
        Number(record.other_deductions || 0)
    );

    return {
      ...record,
      gross_earnings: grossEarnings,
      total_deductions: totalDeductions,
      net_pay: this.money(Math.max(grossEarnings - totalDeductions, 0)),
    };
  }

  calculateWeekdays(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let count = 0;

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const day = date.getDay();
      if (day !== 0 && day !== 6) count += 1;
    }

    return count;
  }

  money(value) {
    return Math.round(Number(value || 0) * 100) / 100;
  }

  async notifyPayrollStatusChange(previous, updated) {
    if (!updated || previous.status === updated.status) return;

    const statusMessages = {
      approved: {
        title: "Payslip Approved",
        message: `Your payslip for ${updated.period_name} has been approved. Net pay: INR ${Number(updated.net_pay || 0).toFixed(2)}.`,
      },
      paid: {
        title: "Salary Paid",
        message: `Your salary for ${updated.period_name} has been marked as paid. Net pay: INR ${Number(updated.net_pay || 0).toFixed(2)}.`,
      },
      hold: {
        title: "Payroll On Hold",
        message: `Your payroll for ${updated.period_name} has been put on hold. Please contact HR for details.`,
      },
    };

    const notification = statusMessages[updated.status];
    if (!notification) return;

    await notificationService.safeNotifyEmployeeByProfileId(
      updated.employee_id,
      notification.title,
      notification.message,
      "payroll",
      updated.id
    );
  }
}

module.exports = new PayrollService();
