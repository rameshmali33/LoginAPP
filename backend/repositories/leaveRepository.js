const pool = require("../config/db");

class LeaveRepository {
  async getLeaveTypes() {
    const result = await pool.query("SELECT * FROM leave_types ORDER BY id");
    return result.rows;
  }

  async getLeaveBalances(employeeId) {
    const query = `
      SELECT 
        lb.id,
        lb.employee_id,
        lb.leave_type_id,
        lb.available_days,
        lt.leave_name,
        lt.total_days AS max_days
      FROM leave_balance lb
      INNER JOIN leave_types lt ON lb.leave_type_id = lt.id
      WHERE lb.employee_id = $1
      ORDER BY lt.id
    `;
    const result = await pool.query(query, [employeeId]);
    return result.rows;
  }

  async checkLeaveBalance(employeeId, leaveTypeId) {
    const query = `
      SELECT available_days 
      FROM leave_balance 
      WHERE employee_id = $1 AND leave_type_id = $2
    `;
    const result = await pool.query(query, [employeeId, leaveTypeId]);
    return result.rows[0] ? result.rows[0].available_days : 0;
  }

  async createLeaveApplication(employeeId, leaveTypeId, fromDate, toDate, totalDays, reason) {
    const query = `
      INSERT INTO leave_applications (employee_id, leave_type_id, from_date, to_date, total_days, reason, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'pending_manager')
      RETURNING *
    `;
    const result = await pool.query(query, [employeeId, leaveTypeId, fromDate, toDate, totalDays, reason]);
    return result.rows[0];
  }

  async getLeaveApplicationById(id) {
    const query = `
      SELECT la.*, lt.leave_name, ep.name AS employee_name, ep.designation
      FROM leave_applications la
      INNER JOIN leave_types lt ON la.leave_type_id = lt.id
      INNER JOIN employee_profiles ep ON la.employee_id = ep.id
      WHERE la.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  async getLeaveHistory(employeeId) {
    const query = `
      SELECT 
        la.id,
        la.from_date,
        la.to_date,
        la.total_days,
        la.reason,
        la.status,
        la.created_at,
        lt.leave_name
      FROM leave_applications la
      INNER JOIN leave_types lt ON la.leave_type_id = lt.id
      WHERE la.employee_id = $1
      ORDER BY la.created_at DESC
    `;
    const result = await pool.query(query, [employeeId]);
    return result.rows;
  }

  async getPendingApplicationsForManager() {
    const query = `
      SELECT 
        la.id,
        la.from_date,
        la.to_date,
        la.total_days,
        la.reason,
        la.status,
        la.created_at,
        lt.leave_name,
        ep.name AS employee_name,
        ep.designation
      FROM leave_applications la
      INNER JOIN leave_types lt ON la.leave_type_id = lt.id
      INNER JOIN employee_profiles ep ON la.employee_id = ep.id
      WHERE la.status = 'pending_manager'
      ORDER BY la.created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getPendingApplicationsForHR() {
    const query = `
      SELECT 
        la.id,
        la.from_date,
        la.to_date,
        la.total_days,
        la.reason,
        la.status,
        la.created_at,
        lt.leave_name,
        ep.name AS employee_name,
        ep.designation
      FROM leave_applications la
      INNER JOIN leave_types lt ON la.leave_type_id = lt.id
      INNER JOIN employee_profiles ep ON la.employee_id = ep.id
      WHERE la.status = 'pending_hr'
      ORDER BY la.created_at ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Update status (supports Transaction client)
  async updateApplicationStatus(client, id, status) {
    const queryExecutor = client || pool;
    const query = `
      UPDATE leave_applications
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await queryExecutor.query(query, [status, id]);
    return result.rows[0];
  }

  // Deduct available days (supports Transaction client)
  async deductLeaveBalance(client, employeeId, leaveTypeId, deductDays) {
    const queryExecutor = client || pool;
    const query = `
      UPDATE leave_balance
      SET available_days = available_days - $3
      WHERE employee_id = $1 AND leave_type_id = $2
      RETURNING *
    `;
    const result = await queryExecutor.query(query, [employeeId, leaveTypeId, deductDays]);
    return result.rows[0];
  }

  // Add history record (supports Transaction client)
  async createApprovalHistory(client, leaveId, approvedByUserId, action, remarks) {
    const queryExecutor = client || pool;
    const query = `
      INSERT INTO approval_history (leave_id, approved_by, action, remarks)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await queryExecutor.query(query, [leaveId, approvedByUserId, action, remarks]);
    return result.rows[0];
  }

  // Aggregate stats & reports (Using Subqueries, Joins, Window Functions, Group By)
  async getLeaveStats() {
    const totalRequests = await pool.query("SELECT COUNT(*) FROM leave_applications");
    const pendingManager = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'pending_manager'");
    const pendingHR = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'pending_hr'");
    const approved = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'approved'");
    const rejected = await pool.query("SELECT COUNT(*) FROM leave_applications WHERE status = 'rejected'");

    return {
      total: parseInt(totalRequests.rows[0].count || 0),
      pendingManager: parseInt(pendingManager.rows[0].count || 0),
      pendingHR: parseInt(pendingHR.rows[0].count || 0),
      approved: parseInt(approved.rows[0].count || 0),
      rejected: parseInt(rejected.rows[0].count || 0),
    };
  }

  async getDepartmentWiseLeaves() {
    // Advanced query with GROUP BY and JOIN
    const query = `
      SELECT 
        d.department_name,
        COUNT(la.id) AS leave_count,
        COALESCE(SUM(la.total_days), 0) AS total_days
      FROM departments d
      LEFT JOIN employee_profiles ep ON ep.department_id = d.id
      LEFT JOIN leave_applications la ON la.employee_id = ep.id AND la.status = 'approved'
      GROUP BY d.department_name
      ORDER BY leave_count DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getMonthlyLeaveTrends() {
    // Aggregation of approved leaves monthly
    const query = `
      SELECT 
        TO_CHAR(la.from_date, 'Mon YYYY') AS month_year,
        EXTRACT(MONTH FROM la.from_date) AS month_num,
        EXTRACT(YEAR FROM la.from_date) AS year_num,
        COUNT(la.id) AS leave_count,
        COALESCE(SUM(la.total_days), 0) AS total_days
      FROM leave_applications la
      WHERE la.status = 'approved'
      GROUP BY TO_CHAR(la.from_date, 'Mon YYYY'), EXTRACT(MONTH FROM la.from_date), EXTRACT(YEAR FROM la.from_date)
      ORDER BY year_num ASC, month_num ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getMostAbsentEmployees() {
    // Uses ROW_NUMBER() Window function as required by Document 2
    const query = `
      WITH employee_absences AS (
        SELECT 
          ep.id AS employee_id,
          ep.name AS employee_name,
          COALESCE(SUM(la.total_days), 0) AS total_absent_days,
          COUNT(la.id) AS approved_leaves_count
        FROM employee_profiles ep
        INNER JOIN leave_applications la ON la.employee_id = ep.id
        WHERE la.status = 'approved'
        GROUP BY ep.id, ep.name
      )
      SELECT 
        employee_id,
        employee_name,
        total_absent_days,
        approved_leaves_count,
        DENSE_RANK() OVER (ORDER BY total_absent_days DESC) AS absence_rank
      FROM employee_absences
      LIMIT 10
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  async getLeaveBalanceReport() {
    const query = `
      SELECT 
        ep.name AS employee_name,
        lt.leave_name,
        lb.available_days,
        lt.total_days AS total_allocated
      FROM leave_balance lb
      INNER JOIN employee_profiles ep ON lb.employee_id = ep.id
      INNER JOIN leave_types lt ON lb.leave_type_id = lt.id
      ORDER BY ep.name, lt.leave_name
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = new LeaveRepository();
