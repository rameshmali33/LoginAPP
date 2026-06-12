const attendanceRepository = require("../repositories/attendanceRepository");

class AttendanceService {
  getEmployeeIdFromUser(user) {
    if (!user.employee_profile_id) {
      const error = new Error("Your user account is not linked to any employee profile");
      error.statusCode = 400;
      throw error;
    }
    return user.employee_profile_id;
  }

  async getToday(user) {
    const employeeId = this.getEmployeeIdFromUser(user);
    return await attendanceRepository.getTodayRecord(employeeId);
  }

  async clockIn(user, notes) {
    const employeeId = this.getEmployeeIdFromUser(user);
    const existing = await attendanceRepository.getTodayRecord(employeeId);

    if (existing && existing.clock_in && !existing.clock_out) {
      const error = new Error("You are already clocked in for today");
      error.statusCode = 400;
      throw error;
    }

    if (existing && existing.clock_in && existing.clock_out) {
      const error = new Error("Today's attendance is already completed");
      error.statusCode = 400;
      throw error;
    }

    return await attendanceRepository.clockIn(employeeId, user.id, notes);
  }

  async clockOut(user, breakMinutes, notes) {
    const employeeId = this.getEmployeeIdFromUser(user);
    const record = await attendanceRepository.clockOut(employeeId, breakMinutes || 0, notes);

    if (!record) {
      const error = new Error("No active clock-in found for today");
      error.statusCode = 400;
      throw error;
    }

    return record;
  }

  async getMyRecords(user, filters) {
    const employeeId = this.getEmployeeIdFromUser(user);
    return await attendanceRepository.getRecords({ ...filters, employee_id: employeeId });
  }

  async getRecords(filters) {
    return await attendanceRepository.getRecords(filters);
  }

  async upsertManualRecord(data, markedBy) {
    const calculated = this.calculateManualWork(data);
    return await attendanceRepository.upsertManualRecord(calculated, markedBy);
  }

  async getSummary(filters) {
    return await attendanceRepository.getSummary(filters);
  }

  calculateManualWork(data) {
    const breakMinutes = parseInt(data.break_minutes || 0, 10);
    let workMinutes = 0;
    let overtimeMinutes = 0;

    if (data.clock_in && data.clock_out) {
      const clockIn = new Date(data.clock_in);
      const clockOut = new Date(data.clock_out);

      if (Number.isNaN(clockIn.getTime()) || Number.isNaN(clockOut.getTime())) {
        const error = new Error("Invalid clock in or clock out time");
        error.statusCode = 400;
        throw error;
      }

      if (clockOut < clockIn) {
        const error = new Error("Clock out cannot be before clock in");
        error.statusCode = 400;
        throw error;
      }

      workMinutes = Math.max(Math.floor((clockOut - clockIn) / 60000) - breakMinutes, 0);
      overtimeMinutes = Math.max(workMinutes - 480, 0);
    }

    return {
      ...data,
      break_minutes: breakMinutes,
      work_minutes: workMinutes,
      overtime_minutes: overtimeMinutes,
    };
  }
}

module.exports = new AttendanceService();
