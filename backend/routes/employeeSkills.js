const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// Assign skills to employee
router.post("/:employeeId", authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { skills } = req.body;

    if (!skills || skills.length === 0) {
      return res.status(400).json({
        message: "Please select at least one skill",
      });
    }

    await pool.query(
      "DELETE FROM employee_skills WHERE employee_id = $1",
      [employeeId]
    );

    for (const skillId of skills) {
      await pool.query(
        `
        INSERT INTO employee_skills(employee_id, skill_id)
        VALUES($1, $2)
        `,
        [employeeId, skillId]
      );
    }

    res.json({
      message: "Skills assigned successfully",
    });
  } catch (error) {
    console.error("Assign Skills Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// Get skills of employee
router.get("/:employeeId", authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;

    const result = await pool.query(
      `
      SELECT
        s.id,
        s.skill_name
      FROM employee_skills es
      INNER JOIN skills s
        ON es.skill_id = s.id
      WHERE es.employee_id = $1
      ORDER BY s.id ASC
      `,
      [employeeId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get Employee Skills Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;