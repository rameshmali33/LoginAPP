const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// GET Skills
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

// POST Skill
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

module.exports = router;