/**
 * Global Search Routes
 * Search across employees, departments, skills
 */

const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const logger = require("../utils/logger");

router.use(authMiddleware);

/**
 * GET /api/search?q=term
 * Global search across employees, departments, skills
 */
router.get("/", async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        message: "Search term too short",
        results: { employees: [], departments: [], skills: [] },
      });
    }

    const searchTerm = `%${q}%`;
    const limit = 10;

    // Search employees
    const employeeQuery = `
      SELECT 
        u.id,
        u.name,
        u.email,
        d.department_name,
        ep.designation,
        'employee' as entity_type
      FROM users u
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN departments d ON d.id = ep.department_id
      WHERE u.name ILIKE $1 OR u.email ILIKE $1 OR ep.designation ILIKE $1
      LIMIT $2
    `;

    // Search departments
    const departmentQuery = `
      SELECT 
        id,
        department_name as name,
        'department' as entity_type
      FROM departments
      WHERE department_name ILIKE $1
      LIMIT $2
    `;

    // Search skills
    const skillQuery = `
      SELECT 
        id,
        skill_name as name,
        'skill' as entity_type
      FROM skills
      WHERE skill_name ILIKE $1
      LIMIT $2
    `;

    const [empResult, deptResult, skillResult] = await Promise.all([
      pool.query(employeeQuery, [searchTerm, limit]),
      pool.query(departmentQuery, [searchTerm, limit]),
      pool.query(skillQuery, [searchTerm, limit]),
    ]);

    res.json({
      success: true,
      message: "Search results retrieved",
      results: {
        employees: empResult.rows,
        departments: deptResult.rows,
        skills: skillResult.rows,
      },
    });
  } catch (error) {
    logger.error("Search Error:", error);
    next(error);
  }
});

module.exports = router;
