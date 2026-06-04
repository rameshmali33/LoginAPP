const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/employees", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ep.id,
        u.name,
        u.email,
        d.department_name,
        ep.phone,
        ep.designation,
        ep.salary,

        COALESCE(
          STRING_AGG(DISTINCT s.skill_name, ', '),
          'No Skills'
        ) AS skills,

        COUNT(DISTINCT ei.id) AS image_count

      FROM employee_profiles ep

      INNER JOIN users u
        ON ep.user_id = u.id

      INNER JOIN departments d
        ON ep.department_id = d.id

      LEFT JOIN employee_skills es
        ON ep.id = es.employee_id

      LEFT JOIN skills s
        ON es.skill_id = s.id

      LEFT JOIN employee_images ei
        ON ep.id = ei.employee_id

      GROUP BY
        ep.id,
        u.name,
        u.email,
        d.department_name,
        ep.phone,
        ep.designation,
        ep.salary

      ORDER BY ep.id ASC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Report Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;