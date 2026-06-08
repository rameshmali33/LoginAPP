const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ExcelJS = require("exceljs");

const employeeReportQuery = `
  SELECT
    ep.id,
    ep.name,
    ep.email,
    d.department_name,
    ep.phone,
    ep.designation,
    ep.salary,
    ep.status,

    COALESCE(
      STRING_AGG(DISTINCT s.skill_name, ', '),
      'No Skills'
    ) AS skills,

    COUNT(DISTINCT ei.id) AS image_count

  FROM employee_profiles ep

  INNER JOIN departments d
    ON ep.department_id = d.id

  LEFT JOIN employee_skills es
    ON ep.id = es.employee_id

  LEFT JOIN skills s
    ON es.skill_id = s.id

  LEFT JOIN employee_images ei
    ON ep.id = ei.employee_id

  GROUP BY
    ep.id,
    ep.name,
    ep.email,
    d.department_name,
    ep.phone,
    ep.designation,
    ep.salary,
    ep.status

  ORDER BY ep.id ASC
`;

router.get(
  "/employees",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(employeeReportQuery);
      res.json(result.rows);
    } catch (error) {
      console.error("Report Error:", error);
      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

router.get(
  "/employees/export",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res) => {
    try {
      const result = await pool.query(employeeReportQuery);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Employee Report");

      worksheet.columns = [
        { header: "ID", key: "id", width: 10 },
        { header: "Name", key: "name", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Department", key: "department_name", width: 20 },
        { header: "Phone", key: "phone", width: 18 },
        { header: "Designation", key: "designation", width: 22 },
        { header: "Salary", key: "salary", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Skills", key: "skills", width: 35 },
        { header: "Images", key: "image_count", width: 12 },
      ];

      worksheet.addRows(
        result.rows.map((emp) => ({
          ...emp,
          status: emp.status === "inactive" ? "Inactive" : "Active",
        }))
      );

      worksheet.getRow(1).font = { bold: true };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );

      res.setHeader(
        "Content-Disposition",
        "attachment; filename=employee_report.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      console.error("Export Error:", error);
      res.status(500).json({
        message: "Export Failed",
      });
    }
  }
);

module.exports = router;