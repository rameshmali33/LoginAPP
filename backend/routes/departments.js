const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

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

router.put("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { department_name } = req.body;
    const trimmedName = department_name?.trim();

    if (!trimmedName) {
      return res.status(400).json({
        message: "Department name is required",
      });
    }

    const existingDepartment = await pool.query(
      `
      SELECT *
      FROM departments
      WHERE LOWER(department_name) = LOWER($1)
        AND id <> $2
      `,
      [trimmedName, id]
    );

    if (existingDepartment.rows.length > 0) {
      return res.status(400).json({
        message: "Department already exists",
      });
    }

    const updatedDepartment = await pool.query(
      `
      UPDATE departments
      SET department_name = $1
      WHERE id = $2
      RETURNING *
      `,
      [trimmedName, id]
    );

    if (updatedDepartment.rows.length === 0) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json({
      message: "Department updated successfully",
      department: updatedDepartment.rows[0],
    });
  } catch (error) {
    console.error("Update Department Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.delete("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const employeeCount = await pool.query(
      "SELECT COUNT(*)::int AS count FROM employee_profiles WHERE department_id = $1",
      [id]
    );

    if (employeeCount.rows[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete department because employees are assigned to it",
      });
    }

    const deletedDepartment = await pool.query(
      "DELETE FROM departments WHERE id = $1 RETURNING *",
      [id]
    );

    if (deletedDepartment.rows.length === 0) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    res.json({
      message: "Department deleted successfully",
      department: deletedDepartment.rows[0],
    });
  } catch (error) {
    console.error("Delete Department Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;
