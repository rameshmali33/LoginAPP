const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.get(
  "/stats",
  authMiddleware,
  roleMiddleware("admin", "employee"),
  async (req, res) => {
    try {
      
      console.log("DASHBOARD USER:", req.user);
      
      if (req.user.role === "employee") {
        if (!req.user.employee_profile_id) {
          return res.status(200).json({
            dashboardType: "unlinked_employee",
            message: "Your employee profile is not linked yet. Please contact admin.",
          });
        }

        const profile = await pool.query(
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
            d.department_name
          FROM employee_profiles ep
          LEFT JOIN departments d
            ON ep.department_id = d.id
          WHERE ep.id = $1
          `,
          [req.user.employee_profile_id]
        );

        const skills = await pool.query(
          `
          SELECT s.skill_name
          FROM employee_skills es
          INNER JOIN skills s
            ON es.skill_id = s.id
          WHERE es.employee_id = $1
          `,
          [req.user.employee_profile_id]
        );

        const images = await pool.query(
          `
          SELECT id, image_url
          FROM employee_images
          WHERE employee_id = $1
          ORDER BY id DESC
          `,
          [req.user.employee_profile_id]
        );

        if (profile.rows.length === 0) {
          return res.status(404).json({
            message: "Employee profile not found",
          });
        }

        const employeeProfile = profile.rows[0];

        const fields = [
          employeeProfile.name,
          employeeProfile.email,
          employeeProfile.phone,
          employeeProfile.address,
          employeeProfile.designation,
          employeeProfile.salary,
          employeeProfile.department_name,
        ];

        const filledFields = fields.filter(
          (field) => field !== null && field !== undefined && field !== ""
        ).length;

        const profileCompletion = Math.round((filledFields / fields.length) * 100);

        return res.json({
          dashboardType: "employee",
          profile: employeeProfile,
          skills: skills.rows,
          imageCount: images.rows.length,
          images: images.rows,
          profileCompletion,
        });
      }

      const employees = await pool.query("SELECT COUNT(*) FROM employee_profiles");
      const activeEmployees = await pool.query(
        "SELECT COUNT(*) FROM employee_profiles WHERE status = 'active'"
      );
      const inactiveEmployees = await pool.query(
        "SELECT COUNT(*) FROM employee_profiles WHERE status = 'inactive'"
      );
      const departments = await pool.query("SELECT COUNT(*) FROM departments");
      const skills = await pool.query("SELECT COUNT(*) FROM skills");
      const images = await pool.query("SELECT COUNT(*) FROM employee_images");

      const averageSalary = await pool.query(
        "SELECT COALESCE(ROUND(AVG(salary)), 0) AS average_salary FROM employee_profiles"
      );

      const highestSalary = await pool.query(
        "SELECT COALESCE(MAX(salary), 0) AS highest_salary FROM employee_profiles"
      );

      const employeesWithSkills = await pool.query(
        "SELECT COUNT(DISTINCT employee_id) FROM employee_skills"
      );

      const employeesWithImages = await pool.query(
        "SELECT COUNT(DISTINCT employee_id) FROM employee_images"
      );

      const recentEmployees = await pool.query(
        `
        SELECT
          ep.id,
          ep.name,
          ep.email,
          ep.designation,
          ep.status,
          ep.created_at,
          d.department_name
        FROM employee_profiles ep
        LEFT JOIN departments d
          ON ep.department_id = d.id
        ORDER BY ep.created_at DESC
        LIMIT 5
        `
      );

      const activityLogs = await pool.query(
        `
        SELECT
          al.id,
          al.action,
          al.description,
          al.created_at,
          u.name AS user_name
        FROM activity_logs al
        LEFT JOIN users u
          ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 8
        `
      );

      res.json({
        dashboardType: "admin",
        employees: employees.rows[0].count,
        activeEmployees: activeEmployees.rows[0].count,
        inactiveEmployees: inactiveEmployees.rows[0].count,
        departments: departments.rows[0].count,
        skills: skills.rows[0].count,
        images: images.rows[0].count,
        averageSalary: averageSalary.rows[0].average_salary,
        highestSalary: highestSalary.rows[0].highest_salary,
        employeesWithSkills: employeesWithSkills.rows[0].count,
        employeesWithImages: employeesWithImages.rows[0].count,
        recentEmployees: recentEmployees.rows,
        activityLogs: activityLogs.rows,
      });
    } catch (error) {
      console.error("Dashboard Stats Error:", error);
      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

module.exports = router;