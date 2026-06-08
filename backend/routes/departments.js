const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET all departments
router.get("/",authMiddleware, roleMiddleware("admin", "employee"), async (req, res) => {
  try {
    const departments = await pool.query(
      "SELECT * FROM departments ORDER BY id ASC"
    );

    res.json(departments.rows);
  } catch (error) {
    console.error("Get Departments Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// POST create department
router.post("/",authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { department_name } = req.body;

    if (!department_name) {
      return res.status(400).json({
        message: "Department name is required",
      });
    }

    const existingDepartment = await pool.query(
      `
      SELECT *
      FROM departments
      WHERE LOWER(department_name) = LOWER($1)
      `,
      [department_name]
    );

    if (existingDepartment.rows.length > 0) {
      return res.status(400).json({
        message: "Department already exists",
      });
    }

    const newDepartment = await pool.query(
      `
      INSERT INTO departments(department_name)
      VALUES($1)
      RETURNING *
      `,
      [department_name]
    );

    res.status(201).json({
      message: "Department created successfully",
      department: newDepartment.rows[0],
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;