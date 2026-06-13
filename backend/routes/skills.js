const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get("/",authMiddleware, roleMiddleware("admin", "employee"), async (req, res) => {
  try {
    const skills = await pool.query(
      `
      SELECT *
      FROM skills
      ORDER BY id ASC
      `
    );

    res.json(skills.rows);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.post("/",authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { skill_name } = req.body;

    if (!skill_name) {
      return res.status(400).json({
        message: "Skill name is required",
      });
    }

    const existingSkill = await pool.query(
      `
      SELECT *
      FROM skills
      WHERE LOWER(skill_name) = LOWER($1)
      `,
      [skill_name]
    );

    if (existingSkill.rows.length > 0) {
      return res.status(400).json({
        message: "Skill already exists",
      });
    }

    const newSkill = await pool.query(
      `
      INSERT INTO skills(skill_name)
      VALUES($1)
      RETURNING *
      `,
      [skill_name]
    );

    res.status(201).json({
      message: "Skill added successfully",
      skill: newSkill.rows[0],
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
    const { skill_name } = req.body;
    const trimmedName = skill_name?.trim();

    if (!trimmedName) {
      return res.status(400).json({
        message: "Skill name is required",
      });
    }

    const existingSkill = await pool.query(
      `
      SELECT *
      FROM skills
      WHERE LOWER(skill_name) = LOWER($1)
        AND id <> $2
      `,
      [trimmedName, id]
    );

    if (existingSkill.rows.length > 0) {
      return res.status(400).json({
        message: "Skill already exists",
      });
    }

    const updatedSkill = await pool.query(
      `
      UPDATE skills
      SET skill_name = $1
      WHERE id = $2
      RETURNING *
      `,
      [trimmedName, id]
    );

    if (updatedSkill.rows.length === 0) {
      return res.status(404).json({
        message: "Skill not found",
      });
    }

    res.json({
      message: "Skill updated successfully",
      skill: updatedSkill.rows[0],
    });
  } catch (error) {
    console.error("Update Skill Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.delete("/:id", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const assignmentCount = await pool.query(
      "SELECT COUNT(*)::int AS count FROM employee_skills WHERE skill_id = $1",
      [id]
    );

    if (assignmentCount.rows[0].count > 0) {
      return res.status(400).json({
        message: "Cannot delete skill because it is assigned to employees",
      });
    }

    const deletedSkill = await pool.query(
      "DELETE FROM skills WHERE id = $1 RETURNING *",
      [id]
    );

    if (deletedSkill.rows.length === 0) {
      return res.status(404).json({
        message: "Skill not found",
      });
    }

    res.json({
      message: "Skill deleted successfully",
      skill: deletedSkill.rows[0],
    });
  } catch (error) {
    console.error("Delete Skill Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;
