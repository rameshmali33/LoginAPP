/**
 * Employee Controller
 * Request handlers mapping request parameters/body to employeeService.
 */

const employeeService = require("../services/employeeService");

class EmployeeController {
  createEmployee = async (req, res, next) => {
    try {
      // req.validated is set by Joi validation middleware
      const employee = await employeeService.createEmployee(req.validated, req.user.id);
      res.status(201).json({
        success: true,
        message: "Employee profile created successfully",
        employee,
      });
    } catch (error) {
      next(error);
    }
  };

  getEmployees = async (req, res, next) => {
    try {
      const {
        page,
        limit,
        sortBy = "id",
        order = "ASC",
        department_id,
        status,
        search,
      } = req.query;

      const filters = {};
      if (department_id) filters.department_id = parseInt(department_id, 10);
      if (status) filters.status = status;
      if (search) filters.search = search;

      if (page || limit) {
        const result = await employeeService.getEmployees(
          parseInt(page || 1, 10),
          parseInt(limit || 10, 10),
          filters,
          sortBy,
          order
        );
        res.json(result);
      } else {
        // Fetch all (high limit) to support backward compatibility with frontend
        const result = await employeeService.getEmployees(1, 100000, filters, sortBy, order);
        res.json(result.employees);
      }
    } catch (error) {
      next(error);
    }
  };

  getEmployeeById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const employee = await employeeService.getEmployeeById(parseInt(id, 10));
      res.json(employee);
    } catch (error) {
      next(error);
    }
  };

  updateEmployee = async (req, res, next) => {
    try {
      const { id } = req.params;
      const employee = await employeeService.updateEmployee(parseInt(id, 10), req.validated, req.user.id);
      res.json({
        success: true,
        message: "Employee updated successfully",
        employee,
      });
    } catch (error) {
      next(error);
    }
  };

  updateEmployeeStatus = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !["active", "inactive"].includes(status)) {
        const error = new Error("Invalid status");
        error.statusCode = 400;
        return next(error);
      }
      const employee = await employeeService.updateEmployeeStatus(parseInt(id, 10), status, req.user.id);
      res.json({
        success: true,
        message: "Employee status updated successfully",
        employee,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEmployee = async (req, res, next) => {
    try {
      const { id } = req.params;
      await employeeService.deleteEmployee(parseInt(id, 10), req.user.id);
      res.json({
        success: true,
        message: "Employee deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new EmployeeController();
