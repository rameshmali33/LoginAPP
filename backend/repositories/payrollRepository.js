const pool = require("../config/db");

class PayrollRepository {
  async createPeriod(data, userId) {
    const result = await pool.query(
      `
      INSERT INTO payroll_periods(
        period_name,
        payroll_month,
        payroll_year,
        start_date,
        end_date,
        working_days,
        notes,
        processed_by
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
      `,
      [
        data.period_name,
        data.payroll_month,
        data.payroll_year,
        data.start_date,
        data.end_date,
        data.working_days,
        data.notes || null,
        userId,
      ]
    );

    return result.rows[0];
  }

  async getPeriods() {
    const result = await pool.query(
      "SELECT * FROM payroll_periods ORDER BY payroll_year DESC, payroll_month DESC"
    );
    return result.rows;
  }

  async getPeriodById(id) {
    const result = await pool.query("SELECT * FROM payroll_periods WHERE id = $1", [id]);
    return result.rows[0] || null;
  }

  async getActiveEmployees() {
    const result = await pool.query(
      `
      SELECT id, name, email, designation, salary
      FROM employee_profiles
      WHERE COALESCE(status, 'active') = 'active'
      ORDER BY name ASC
      `
    );
    return result.rows;
  }

  async getAttendanceStats(startDate, endDate) {
    const result = await pool.query(
      `
      SELECT
        employee_id,
        COUNT(*) FILTER (WHERE status IN ('present', 'late'))::NUMERIC AS present_days,
        COUNT(*) FILTER (WHERE status = 'half_day')::NUMERIC AS half_days,
        COUNT(*) FILTER (WHERE status = 'absent')::NUMERIC AS absent_days,
        COUNT(*) FILTER (WHERE status = 'leave')::NUMERIC AS leave_days,
        COALESCE(SUM(overtime_minutes), 0)::INT AS overtime_minutes
      FROM attendance_records
      WHERE attendance_date BETWEEN $1 AND $2
      GROUP BY employee_id
      `,
      [startDate, endDate]
    );

    return result.rows;
  }

  async upsertPayrollRecord(record, userId) {
    const result = await pool.query(
      `
      INSERT INTO payroll_records(
        period_id,
        employee_id,
        basic_salary,
        paid_days,
        present_days,
        half_days,
        absent_days,
        leave_days,
        overtime_minutes,
        basic_pay,
        hra,
        conveyance_allowance,
        medical_allowance,
        special_allowance,
        overtime_pay,
        bonus,
        reimbursements,
        gross_earnings,
        loss_of_pay,
        provident_fund,
        esi,
        professional_tax,
        tds,
        loan_deduction,
        other_deductions,
        total_deductions,
        net_pay,
        status,
        generated_by
      )
      VALUES(
        $1, $2, $3, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29
      )
      ON CONFLICT (period_id, employee_id)
      DO UPDATE SET
        basic_salary = EXCLUDED.basic_salary,
        paid_days = EXCLUDED.paid_days,
        present_days = EXCLUDED.present_days,
        half_days = EXCLUDED.half_days,
        absent_days = EXCLUDED.absent_days,
        leave_days = EXCLUDED.leave_days,
        overtime_minutes = EXCLUDED.overtime_minutes,
        basic_pay = EXCLUDED.basic_pay,
        hra = EXCLUDED.hra,
        conveyance_allowance = EXCLUDED.conveyance_allowance,
        medical_allowance = EXCLUDED.medical_allowance,
        special_allowance = EXCLUDED.special_allowance,
        overtime_pay = EXCLUDED.overtime_pay,
        bonus = EXCLUDED.bonus,
        reimbursements = EXCLUDED.reimbursements,
        gross_earnings = EXCLUDED.gross_earnings,
        loss_of_pay = EXCLUDED.loss_of_pay,
        provident_fund = EXCLUDED.provident_fund,
        esi = EXCLUDED.esi,
        professional_tax = EXCLUDED.professional_tax,
        tds = EXCLUDED.tds,
        loan_deduction = EXCLUDED.loan_deduction,
        other_deductions = EXCLUDED.other_deductions,
        total_deductions = EXCLUDED.total_deductions,
        net_pay = EXCLUDED.net_pay,
        generated_by = EXCLUDED.generated_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [
        record.period_id,
        record.employee_id,
        record.basic_salary,
        record.paid_days,
        record.present_days,
        record.half_days,
        record.absent_days,
        record.leave_days,
        record.overtime_minutes,
        record.basic_pay,
        record.hra,
        record.conveyance_allowance,
        record.medical_allowance,
        record.special_allowance,
        record.overtime_pay,
        record.bonus,
        record.reimbursements,
        record.gross_earnings,
        record.loss_of_pay,
        record.provident_fund,
        record.esi,
        record.professional_tax,
        record.tds,
        record.loan_deduction,
        record.other_deductions,
        record.total_deductions,
        record.net_pay,
        record.status || "draft",
        userId,
      ]
    );

    return result.rows[0];
  }

  async markPeriodProcessed(periodId, userId) {
    const result = await pool.query(
      `
      UPDATE payroll_periods
      SET status = 'processed',
          processed_by = $2,
          processed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [periodId, userId]
    );
    return result.rows[0] || null;
  }

  async getPayrollRecords(periodId) {
    const result = await pool.query(
      `
      SELECT
        pr.*,
        pp.period_name,
        pp.payroll_month,
        pp.payroll_year,
        ep.name AS employee_name,
        ep.email AS employee_email,
        ep.designation
      FROM payroll_records pr
      INNER JOIN payroll_periods pp ON pp.id = pr.period_id
      INNER JOIN employee_profiles ep ON ep.id = pr.employee_id
      WHERE pr.period_id = $1
      ORDER BY ep.name ASC
      `,
      [periodId]
    );
    return result.rows;
  }

  async getPayrollRecordById(id) {
    const result = await pool.query(
      `
      SELECT
        pr.*,
        pp.period_name,
        pp.payroll_month,
        pp.payroll_year,
        pp.start_date,
        pp.end_date,
        pp.working_days,
        ep.name AS employee_name,
        ep.email AS employee_email,
        ep.designation
      FROM payroll_records pr
      INNER JOIN payroll_periods pp ON pp.id = pr.period_id
      INNER JOIN employee_profiles ep ON ep.id = pr.employee_id
      WHERE pr.id = $1
      `,
      [id]
    );
    return result.rows[0] || null;
  }

  async getMyPayslips(employeeId) {
    const result = await pool.query(
      `
      SELECT
        pr.*,
        pp.period_name,
        pp.payroll_month,
        pp.payroll_year,
        pp.start_date,
        pp.end_date,
        pp.working_days,
        ep.name AS employee_name,
        ep.email AS employee_email,
        ep.designation
      FROM payroll_records pr
      INNER JOIN payroll_periods pp ON pp.id = pr.period_id
      INNER JOIN employee_profiles ep ON ep.id = pr.employee_id
      WHERE pr.employee_id = $1 AND pr.status IN ('approved', 'paid')
      ORDER BY pp.payroll_year DESC, pp.payroll_month DESC
      `,
      [employeeId]
    );
    return result.rows;
  }

  async updateRecord(id, record) {
    const result = await pool.query(
      `
      UPDATE payroll_records
      SET
        basic_pay = $1,
        hra = $2,
        conveyance_allowance = $3,
        medical_allowance = $4,
        special_allowance = $5,
        overtime_pay = $6,
        bonus = $7,
        reimbursements = $8,
        gross_earnings = $9,
        loss_of_pay = $10,
        provident_fund = $11,
        esi = $12,
        professional_tax = $13,
        tds = $14,
        loan_deduction = $15,
        other_deductions = $16,
        total_deductions = $17,
        net_pay = $18,
        status = $19,
        payment_date = $20,
        payment_reference = $21,
        remarks = $22,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $23
      RETURNING *
      `,
      [
        record.basic_pay,
        record.hra,
        record.conveyance_allowance,
        record.medical_allowance,
        record.special_allowance,
        record.overtime_pay,
        record.bonus,
        record.reimbursements,
        record.gross_earnings,
        record.loss_of_pay,
        record.provident_fund,
        record.esi,
        record.professional_tax,
        record.tds,
        record.loan_deduction,
        record.other_deductions,
        record.total_deductions,
        record.net_pay,
        record.status,
        record.payment_date || null,
        record.payment_reference || null,
        record.remarks || null,
        id,
      ]
    );
    return result.rows[0] || null;
  }

  async updatePeriodStatus(id, status) {
    const result = await pool.query(
      `
      UPDATE payroll_periods
      SET status = $2,
          paid_at = CASE WHEN $2 = 'paid' THEN CURRENT_TIMESTAMP ELSE paid_at END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [id, status]
    );
    return result.rows[0] || null;
  }

  async getPayrollSummary(periodId) {
    const result = await pool.query(
      `
      SELECT
        COUNT(*)::INT AS employee_count,
        COALESCE(SUM(gross_earnings), 0)::NUMERIC(12, 2) AS gross_total,
        COALESCE(SUM(total_deductions), 0)::NUMERIC(12, 2) AS deduction_total,
        COALESCE(SUM(tds), 0)::NUMERIC(12, 2) AS tds_total,
        COALESCE(SUM(net_pay), 0)::NUMERIC(12, 2) AS net_total,
        COUNT(*) FILTER (WHERE status = 'paid')::INT AS paid_count,
        COUNT(*) FILTER (WHERE status = 'hold')::INT AS hold_count
      FROM payroll_records
      WHERE period_id = $1
      `,
      [periodId]
    );
    return result.rows[0];
  }
}

module.exports = new PayrollRepository();
