const pool = require("../config/db");

class AttendanceRepository {
  async getTodayRecord(employeeId) {
    const result = await pool.query(
      `
      SELECT ar.*, ep.name AS employee_name
      FROM attendance_records ar
      INNER JOIN employee_profiles ep ON ep.id = ar.employee_id
      WHERE ar.employee_id = $1 AND ar.attendance_date = CURRENT_DATE
      `,
      [employeeId]
    );
    return result.rows[0] || null;
  }

  async clockIn(employeeId, userId, notes) {
    const result = await pool.query(
      `
      INSERT INTO attendance_records(employee_id, attendance_date, clock_in, status, notes, marked_by)
      VALUES($1, CURRENT_DATE, CURRENT_TIMESTAMP, 'present', $2, $3)
      ON CONFLICT (employee_id, attendance_date)
      DO UPDATE SET
        clock_in = COALESCE(attendance_records.clock_in, EXCLUDED.clock_in),
        status = CASE
          WHEN attendance_records.status IN ('absent', 'holiday') THEN 'present'
          ELSE attendance_records.status
        END,
        notes = COALESCE(EXCLUDED.notes, attendance_records.notes),
        marked_by = EXCLUDED.marked_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [employeeId, notes || null, userId]
    );
    return result.rows[0];
  }

  async clockOut(employeeId, breakMinutes, notes) {
    const result = await pool.query(
      `
      UPDATE attendance_records
      SET
        clock_out = CURRENT_TIMESTAMP,
        break_minutes = $2,
        work_minutes = GREATEST(
          FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - clock_in)) / 60)::INT - $2,
          0
        ),
        overtime_minutes = GREATEST(
          FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - clock_in)) / 60)::INT - $2 - 480,
          0
        ),
        status = CASE
          WHEN GREATEST(FLOOR(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - clock_in)) / 60)::INT - $2, 0) < 240 THEN 'half_day'
          ELSE status
        END,
        notes = COALESCE($3, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $1
        AND attendance_date = CURRENT_DATE
        AND clock_in IS NOT NULL
        AND clock_out IS NULL
      RETURNING *
      `,
      [employeeId, breakMinutes, notes || null]
    );
    return result.rows[0] || null;
  }

  async getRecords(filters = {}) {
    const params = [];
    let query = `
      SELECT
        ar.*,
        ep.name AS employee_name,
        ep.email AS employee_email,
        ep.designation,
        d.department_name
      FROM attendance_records ar
      INNER JOIN employee_profiles ep ON ep.id = ar.employee_id
      LEFT JOIN departments d ON d.id = ep.department_id
      WHERE 1=1
    `;

    if (filters.employee_id) {
      params.push(filters.employee_id);
      query += ` AND ar.employee_id = $${params.length}`;
    }

    if (filters.status) {
      params.push(filters.status);
      query += ` AND ar.status = $${params.length}`;
    }

    if (filters.from) {
      params.push(filters.from);
      query += ` AND ar.attendance_date >= $${params.length}`;
    }

    if (filters.to) {
      params.push(filters.to);
      query += ` AND ar.attendance_date <= $${params.length}`;
    }

    query += " ORDER BY ar.attendance_date DESC, ep.name ASC";

    const result = await pool.query(query, params);
    return result.rows;
  }

  async upsertManualRecord(data, markedBy) {
    const {
      employee_id,
      attendance_date,
      clock_in,
      clock_out,
      break_minutes = 0,
      work_minutes = 0,
      overtime_minutes = 0,
      status,
      notes,
    } = data;

    const result = await pool.query(
      `
      INSERT INTO attendance_records(
        employee_id,
        attendance_date,
        clock_in,
        clock_out,
        break_minutes,
        work_minutes,
        overtime_minutes,
        status,
        notes,
        marked_by
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (employee_id, attendance_date)
      DO UPDATE SET
        clock_in = EXCLUDED.clock_in,
        clock_out = EXCLUDED.clock_out,
        break_minutes = EXCLUDED.break_minutes,
        work_minutes = EXCLUDED.work_minutes,
        overtime_minutes = EXCLUDED.overtime_minutes,
        status = EXCLUDED.status,
        notes = EXCLUDED.notes,
        marked_by = EXCLUDED.marked_by,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
      `,
      [
        employee_id,
        attendance_date,
        clock_in || null,
        clock_out || null,
        break_minutes,
        work_minutes,
        overtime_minutes,
        status,
        notes || null,
        markedBy,
      ]
    );

    return result.rows[0];
  }

  async getSummary(filters = {}) {
    const params = [];
    let query = `
      SELECT
        ep.id AS employee_id,
        ep.name AS employee_name,
        d.department_name,
        COUNT(ar.id)::INT AS total_records,
        COUNT(ar.id) FILTER (WHERE ar.status = 'present')::INT AS present_days,
        COUNT(ar.id) FILTER (WHERE ar.status = 'half_day')::INT AS half_days,
        COUNT(ar.id) FILTER (WHERE ar.status = 'absent')::INT AS absent_days,
        COUNT(ar.id) FILTER (WHERE ar.status = 'late')::INT AS late_days,
        COUNT(ar.id) FILTER (WHERE ar.status = 'leave')::INT AS leave_days,
        COUNT(ar.id) FILTER (WHERE ar.clock_in IS NOT NULL AND ar.clock_out IS NULL)::INT AS open_days,
        COALESCE(SUM(ar.work_minutes), 0)::INT AS total_work_minutes,
        COALESCE(SUM(ar.overtime_minutes), 0)::INT AS total_overtime_minutes
      FROM employee_profiles ep
      LEFT JOIN departments d ON d.id = ep.department_id
      LEFT JOIN attendance_records ar ON ar.employee_id = ep.id
    `;

    const conditions = [];
    if (filters.employee_id) {
      params.push(filters.employee_id);
      conditions.push(`ep.id = $${params.length}`);
    }

    if (filters.from) {
      params.push(filters.from);
      conditions.push(`(ar.attendance_date IS NULL OR ar.attendance_date >= $${params.length})`);
    }

    if (filters.to) {
      params.push(filters.to);
      conditions.push(`(ar.attendance_date IS NULL OR ar.attendance_date <= $${params.length})`);
    }

    if (conditions.length) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += " GROUP BY ep.id, ep.name, d.department_name ORDER BY ep.name ASC";

    const result = await pool.query(query, params);
    return result.rows;
  }
}

module.exports = new AttendanceRepository();
