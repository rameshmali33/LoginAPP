/**
 * Employee Repository
 * Database access layer for employee profile management
 */

const pool = require("../config/db");

class EmployeeRepository {
  async createEmployee(data) {
    const {
      name,
      email,
      department_id,
      phone,
      address,
      designation,
      salary,
      status,
    } = data;

    const query = `
      INSERT INTO employee_profiles(
        name,
        email,
        department_id,
        phone,
        address,
        designation,
        salary,
        status
      )
      VALUES($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const result = await pool.query(query, [
      name.trim(),
      email.trim(),
      department_id,
      phone ? phone.trim() : null,
      address ? address.trim() : null,
      designation.trim(),
      salary,
      status || "active",
    ]);

    return result.rows[0];
  }

  async getEmployees(limit = 10, offset = 0, filters = {}, sortBy = "id", order = "ASC") {
    let query = `
      SELECT
        ep.id,
        ep.name,
        ep.email,
        ep.phone,
        ep.address,
        ep.designation,
        ep.salary,
        ep.status,
        ep.created_at,
        d.department_name
      FROM employee_profiles ep
      INNER JOIN departments d
        ON ep.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Filter by department
    if (filters.department_id) {
      params.push(filters.department_id);
      query += ` AND ep.department_id = $${params.length}`;
    }

    // Filter by status
    if (filters.status) {
      params.push(filters.status);
      query += ` AND ep.status = $${params.length}`;
    }

    // Search query
    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (ep.name ILIKE $${params.length} OR ep.email ILIKE $${params.length} OR ep.designation ILIKE $${params.length})`;
    }

    // Sorting
    const validColumns = ["id", "name", "email", "designation", "salary", "status", "created_at"];
    const sortColumn = validColumns.includes(sortBy) ? sortBy : "id";
    const orderDir = order.toUpperCase() === "DESC" ? "DESC" : "ASC";
    query += ` ORDER BY ep.${sortColumn} ${orderDir}`;

    // Pagination
    params.push(limit);
    params.push(offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getEmployeeCount(filters = {}) {
    let query = `
      SELECT COUNT(*) as count
      FROM employee_profiles ep
      INNER JOIN departments d
        ON ep.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    if (filters.department_id) {
      params.push(filters.department_id);
      query += ` AND ep.department_id = $${params.length}`;
    }

    if (filters.status) {
      params.push(filters.status);
      query += ` AND ep.status = $${params.length}`;
    }

    if (filters.search) {
      params.push(`%${filters.search}%`);
      query += ` AND (ep.name ILIKE $${params.length} OR ep.email ILIKE $${params.length} OR ep.designation ILIKE $${params.length})`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  async getEmployeeById(id) {
    const query = `
      SELECT
        ep.id,
        ep.department_id,
        ep.name,
        ep.email,
        ep.phone,
        ep.address,
        ep.designation,
        ep.salary,
        ep.status,
        ep.created_at,
        d.department_name
      FROM employee_profiles ep
      INNER JOIN departments d
        ON ep.department_id = d.id
      WHERE ep.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async updateEmployee(id, data) {
    const {
      name,
      email,
      department_id,
      phone,
      address,
      designation,
      salary,
      status,
    } = data;

    const query = `
      UPDATE employee_profiles
      SET
        name = $1,
        email = $2,
        department_id = $3,
        phone = $4,
        address = $5,
        designation = $6,
        salary = $7,
        status = $8
      WHERE id = $9
      RETURNING *
    `;

    const result = await pool.query(query, [
      name.trim(),
      email.trim(),
      department_id,
      phone ? phone.trim() : null,
      address ? address.trim() : null,
      designation.trim(),
      salary,
      status || "active",
      id,
    ]);

    return result.rows[0] || null;
  }

  async updateEmployeeStatus(id, status) {
    const query = `
      UPDATE employee_profiles
      SET status = $1
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, id]);
    return result.rows[0] || null;
  }

  async deleteEmployee(id) {
    const query = `
      DELETE FROM employee_profiles
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  async addActivityLog(action, description, userId) {
    try {
      await pool.query(
        `
        INSERT INTO activity_logs(action, description, user_id)
        VALUES($1, $2, $3)
        `,
        [action, description, userId || null]
      );
    } catch (error) {
      console.error("Activity Log Error:", error);
    }
  }
}

module.exports = new EmployeeRepository();
