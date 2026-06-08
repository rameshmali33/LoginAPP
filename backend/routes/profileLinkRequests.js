const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.post("/", authMiddleware, roleMiddleware("employee"), async (req, res) => {
  try {
    const { employee_profile_id, message } = req.body;

    if (!employee_profile_id) {
      return res.status(400).json({ message: "Employee profile is required" });
    }

    if (req.user.employee_profile_id) {
      return res.status(400).json({ message: "Your profile is already linked" });
    }

    const existing = await pool.query(
      `
      SELECT *
      FROM profile_link_requests
      WHERE user_id = $1
      AND status = 'pending'
      `,
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "You already have a pending request",
      });
    }

    await pool.query(
      `
      INSERT INTO profile_link_requests(user_id, employee_profile_id, message)
      VALUES($1, $2, $3)
      `,
      [req.user.id, employee_profile_id, message || null]
    );

    res.status(201).json({
      message: "Profile link request submitted successfully",
    });
  } catch (error) {
    console.error("Create Link Request Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.get("/", authMiddleware, roleMiddleware("admin"), async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        plr.id,
        plr.status,
        plr.message,
        plr.created_at,
        u.id AS user_id,
        u.name AS user_name,
        u.email AS user_email,
        ep.id AS employee_profile_id,
        ep.name AS employee_name,
        ep.email AS employee_email,
        ep.designation
      FROM profile_link_requests plr
      INNER JOIN users u
        ON plr.user_id = u.id
      INNER JOIN employee_profiles ep
        ON plr.employee_profile_id = ep.id
      ORDER BY plr.created_at DESC
      `
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Get Link Requests Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

router.put(
  "/:id/approve",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      const request = await pool.query(
        `
        SELECT *
        FROM profile_link_requests
        WHERE id = $1
        AND status = 'pending'
        `,
        [id]
      );

      if (request.rows.length === 0) {
        return res.status(404).json({ message: "Pending request not found" });
      }

      const reqData = request.rows[0];

      await pool.query(
        `
        UPDATE users
        SET role = 'employee',
            employee_profile_id = $1
        WHERE id = $2
        `,
        [reqData.employee_profile_id, reqData.user_id]
      );

      await pool.query(
        `
        UPDATE profile_link_requests
        SET status = 'approved',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [id]
      );

      res.json({ message: "Profile linked successfully" });
    } catch (error) {
      console.error("Approve Link Request Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

router.put(
  "/:id/reject",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;

      await pool.query(
        `
        UPDATE profile_link_requests
        SET status = 'rejected',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        `,
        [id]
      );

      res.json({ message: "Request rejected successfully" });
    } catch (error) {
      console.error("Reject Link Request Error:", error);
      res.status(500).json({ message: "Server Error" });
    }
  }
);

module.exports = router;