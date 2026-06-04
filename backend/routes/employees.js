const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// CREATE employee profile
router.post("/", authMiddleware, async (req, res) => {
  try {
    const {
      user_id,
      department_id,
      phone,
      address,
      designation,
      salary,
    } = req.body;

    if (!user_id || !department_id) {
      return res.status(400).json({
        message: "User and department are required",
      });
    }

    const newEmployee = await pool.query(
      `
      INSERT INTO employee_profiles(
        user_id,
        department_id,
        phone,
        address,
        designation,
        salary
      )
      VALUES($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [
        user_id,
        department_id,
        phone,
        address,
        designation,
        salary,
      ]
    );

    res.status(201).json({
      message: "Employee profile created successfully",
      employee: newEmployee.rows[0],
    });
  } catch (error) {
    console.error("Create Employee Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// GET all employee profiles with JOIN
router.get("/", authMiddleware, async (req, res) => {
  try {
    const employees = await pool.query(
      `
      SELECT
        ep.id,
        ep.phone,
        ep.address,
        ep.designation,
        ep.salary,
        ep.created_at,
        u.name,
        u.email,
        d.department_name
      FROM employee_profiles ep
      INNER JOIN users u
        ON ep.user_id = u.id
      INNER JOIN departments d
        ON ep.department_id = d.id
      ORDER BY ep.id ASC
      `
    );

    res.json(employees.rows);
  } catch (error) {
    console.error("Get Employees Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// GET single employee profile
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await pool.query(
      `
      SELECT
        ep.id,
        ep.user_id,
        ep.department_id,
        ep.phone,
        ep.address,
        ep.designation,
        ep.salary,
        ep.created_at,
        u.name,
        u.email,
        d.department_name
      FROM employee_profiles ep
      INNER JOIN users u
        ON ep.user_id = u.id
      INNER JOIN departments d
        ON ep.department_id = d.id
      WHERE ep.id = $1
      `,
      [id]
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json(employee.rows[0]);
  } catch (error) {
    console.error("Get Employee Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// UPDATE employee profile
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const {
      department_id,
      phone,
      address,
      designation,
      salary,
    } = req.body;

    const updatedEmployee = await pool.query(
      `
      UPDATE employee_profiles
      SET
        department_id = $1,
        phone = $2,
        address = $3,
        designation = $4,
        salary = $5
      WHERE id = $6
      RETURNING *
      `,
      [
        department_id,
        phone,
        address,
        designation,
        salary,
        id,
      ]
    );

    if (updatedEmployee.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json({
      message: "Employee updated successfully",
      employee: updatedEmployee.rows[0],
    });
  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

// DELETE employee profile
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedEmployee = await pool.query(
      `
      DELETE FROM employee_profiles
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (deletedEmployee.rows.length === 0) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    res.json({
      message: "Employee deleted successfully",
    });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;