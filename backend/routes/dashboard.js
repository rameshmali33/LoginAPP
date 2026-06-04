const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/stats", authMiddleware, async (req, res) => {
  try {
    const employees = await pool.query(
      "SELECT COUNT(*) FROM employee_profiles"
    );

    const departments = await pool.query(
      "SELECT COUNT(*) FROM departments"
    );

    const skills = await pool.query(
      "SELECT COUNT(*) FROM skills"
    );

    const images = await pool.query(
      "SELECT COUNT(*) FROM employee_images"
    );

    res.json({
      employees: employees.rows[0].count,
      departments: departments.rows[0].count,
      skills: skills.rows[0].count,
      images: images.rows[0].count,
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;