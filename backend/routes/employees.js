const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^[0-9]{10}$/;

const addActivityLog = async (action, description, userId) => {
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
};

router.post("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const {
      name,
      email,
      department_id,
      phone,
      address,
      designation,
      salary,
      status,
    } = req.body;

    if (!name || !email || !department_id || !phone || !address || !designation || !salary) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    if (Number(salary) <= 0) {
      return res.status(400).json({ message: "Salary must be greater than 0" });
    }

    const newEmployee = await pool.query(
      `
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
      VALUES($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
      `,
      [
        name.trim(),
        email.trim(),
        department_id,
        phone,
        address.trim(),
        designation.trim(),
        salary,
        status || "active",
      ]
    );

    await addActivityLog(
      "Employee Created",
      `${name} employee profile was created`,
      req.user.id
    );

    res.status(201).json({
      message: "Employee profile created successfully",
      employee: newEmployee.rows[0],
    });
  } catch (error) {
    console.error("Create Employee Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", authMiddleware, roleMiddleware("admin", "employee"), async (req, res) => {
  try {
    const employees = await pool.query(
      `
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
      ORDER BY ep.id ASC
      `
    );

    res.json(employees.rows);
  } catch (error) {
    console.error("Get Employees Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/:id", authMiddleware, roleMiddleware("admin", "employee"), async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await pool.query(
      `
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
      `,
      [id]
    );

    if (employee.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    res.json(employee.rows[0]);
  } catch (error) {
    console.error("Get Employee Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      email,
      department_id,
      phone,
      address,
      designation,
      salary,
      status,
    } = req.body;

    if (!name || !email || !department_id || !phone || !address || !designation || !salary) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ message: "Phone number must be exactly 10 digits" });
    }

    if (Number(salary) <= 0) {
      return res.status(400).json({ message: "Salary must be greater than 0" });
    }

    const updatedEmployee = await pool.query(
      `
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
      `,
      [
        name.trim(),
        email.trim(),
        department_id,
        phone,
        address.trim(),
        designation.trim(),
        salary,
        status || "active",
        id,
      ]
    );

    if (updatedEmployee.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await addActivityLog(
      "Employee Updated",
      `${name} employee profile was updated`,
      req.user.id
    );

    res.json({
      message: "Employee updated successfully",
      employee: updatedEmployee.rows[0],
    });
  } catch (error) {
    console.error("Update Employee Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.patch("/:id/status", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updatedEmployee = await pool.query(
      `
      UPDATE employee_profiles
      SET status = $1
      WHERE id = $2
      RETURNING *
      `,
      [status, id]
    );

    if (updatedEmployee.rows.length === 0) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await addActivityLog(
      "Employee Status Changed",
      `${updatedEmployee.rows[0].name} status changed to ${status}`,
      req.user.id
    );

    res.json({
      message: "Employee status updated successfully",
      employee: updatedEmployee.rows[0],
    });
  } catch (error) {
    console.error("Update Status Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.delete("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
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
      return res.status(404).json({ message: "Employee not found" });
    }

    await addActivityLog(
      "Employee Deleted",
      `${deletedEmployee.rows[0].name} employee profile was deleted`,
      req.user.id
    );

    res.json({ message: "Employee deleted successfully" });
  } catch (error) {
    console.error("Delete Employee Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;