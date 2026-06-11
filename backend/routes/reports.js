const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const ExcelJS = require("exceljs");
const logger = require("../utils/logger");

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
      logger.error("Report Error:", error);
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
      logger.error("Export Error:", error);
      res.status(500).json({
        message: "Export Failed",
      });
    }
  }
);

/**
 * GET /api/reports/leaves
 * Get leave report data
 */
router.get(
  "/leaves",
  authMiddleware,
  roleMiddleware("hr", "admin"),
  async (req, res, next) => {
    try {
      const query = `
        SELECT 
          u.id,
          u.name,
          d.department_name,
          lt.leave_name,
          la.from_date,
          la.to_date,
          la.total_days,
          la.status,
          la.reason,
          la.created_at
        FROM leave_applications la
        JOIN users u ON u.id = (SELECT user_id FROM employee_profiles WHERE id = la.employee_id)
        LEFT JOIN employee_profiles ep ON ep.user_id = u.id
        LEFT JOIN departments d ON d.id = ep.department_id
        JOIN leave_types lt ON lt.id = la.leave_type_id
        ORDER BY la.created_at DESC
      `;
      const result = await pool.query(query);
      res.json({
        success: true,
        message: "Leave report retrieved",
        data: result.rows,
      });
    } catch (error) {
      logger.error("Leave Report Error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/reports/leaves/export
 * Export leave report to Excel
 */
router.get(
  "/leaves/export",
  authMiddleware,
  roleMiddleware("hr", "admin"),
  async (req, res, next) => {
    try {
      const query = `
        SELECT 
          u.id,
          u.name,
          d.department_name,
          lt.leave_name,
          la.from_date,
          la.to_date,
          la.total_days,
          la.status,
          la.reason,
          la.created_at
        FROM leave_applications la
        JOIN users u ON u.id = (SELECT user_id FROM employee_profiles WHERE id = la.employee_id)
        LEFT JOIN employee_profiles ep ON ep.user_id = u.id
        LEFT JOIN departments d ON d.id = ep.department_id
        JOIN leave_types lt ON lt.id = la.leave_type_id
        ORDER BY la.created_at DESC
      `;
      const result = await pool.query(query);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Leave Report");

      worksheet.columns = [
        { header: "Name", key: "name", width: 25 },
        { header: "Department", key: "department_name", width: 20 },
        { header: "Leave Type", key: "leave_name", width: 15 },
        { header: "From Date", key: "from_date", width: 15 },
        { header: "To Date", key: "to_date", width: 15 },
        { header: "Total Days", key: "total_days", width: 12 },
        { header: "Status", key: "status", width: 15 },
        { header: "Reason", key: "reason", width: 30 },
        { header: "Applied On", key: "created_at", width: 15 },
      ];

      worksheet.addRows(result.rows);
      worksheet.getRow(1).font = { bold: true };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=leave_report.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      logger.error("Leave Export Error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/reports/assets
 * Get asset report data
 */
router.get(
  "/assets",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {
      const query = `
        SELECT 
          a.id,
          a.asset_code,
          a.asset_name,
          a.asset_type,
          a.purchase_date,
          a.purchase_cost,
          a.status,
          u.name as allocated_to,
          aa.allocated_date,
          aa.return_date
        FROM assets a
        LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status = 'allocated'
        LEFT JOIN employee_profiles ep ON aa.employee_id = ep.id
        LEFT JOIN users u ON ep.user_id = u.id
        ORDER BY a.created_at DESC
      `;
      const result = await pool.query(query);
      res.json({
        success: true,
        message: "Asset report retrieved",
        data: result.rows,
      });
    } catch (error) {
      logger.error("Asset Report Error:", error);
      next(error);
    }
  }
);

/**
 * GET /api/reports/assets/export
 * Export asset report to Excel
 */
router.get(
  "/assets/export",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {
      const query = `
        SELECT 
          a.id,
          a.asset_code,
          a.asset_name,
          a.asset_type,
          a.purchase_date,
          a.purchase_cost,
          a.status,
          u.name as allocated_to,
          aa.allocated_date,
          aa.return_date
        FROM assets a
        LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status = 'allocated'
        LEFT JOIN employee_profiles ep ON aa.employee_id = ep.id
        LEFT JOIN users u ON ep.user_id = u.id
        ORDER BY a.created_at DESC
      `;
      const result = await pool.query(query);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Asset Report");

      worksheet.columns = [
        { header: "Asset Code", key: "asset_code", width: 15 },
        { header: "Asset Name", key: "asset_name", width: 25 },
        { header: "Type", key: "asset_type", width: 15 },
        { header: "Purchase Date", key: "purchase_date", width: 15 },
        { header: "Purchase Cost", key: "purchase_cost", width: 15 },
        { header: "Status", key: "status", width: 15 },
        { header: "Allocated To", key: "allocated_to", width: 20 },
        { header: "Allocated Date", key: "allocated_date", width: 15 },
        { header: "Return Date", key: "return_date", width: 15 },
      ];

      worksheet.addRows(result.rows);
      worksheet.getRow(1).font = { bold: true };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=asset_report.xlsx"
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      logger.error("Asset Export Error:", error);
      next(error);
    }
  }
);

module.exports = router;