/**
 * Employee Service
 * Business logic for employee profile management and emailing
 */

const employeeRepository = require("../repositories/employeeRepository");
const sendEmail = require("../config/mailer");
const logger = require("../utils/logger");

class EmployeeService {
  async createEmployee(data, userId) {
    const employee = await employeeRepository.createEmployee(data);

    // Send Welcome Email
    logger.info(`Sending welcome email to newly created employee: ${employee.email}`);
    try {
      await sendEmail({
        to: employee.email,
        subject: "Welcome to the Employee Management System",
        html: `
          <h2>Hello ${employee.name},</h2>
          <p>Your profile has been created successfully in the Employee Management System!</p>
          <p><strong>Designation:</strong> ${employee.designation}</p>
          <p><strong>Department ID:</strong> ${employee.department_id}</p>
          <p>Please contact your administrator if you have any questions.</p>
        `,
      });
      logger.info("Welcome email sent successfully.");
    } catch (err) {
      logger.warn("Failed to send welcome email:", err.message);
    }

    // Add activity log
    await employeeRepository.addActivityLog(
      "Employee Created",
      `${employee.name} employee profile was created`,
      userId
    );

    return employee;
  }

  async getEmployees(page = 1, limit = 10, filters = {}, sortBy = "id", order = "ASC") {
    const offset = (page - 1) * limit;
    const employees = await employeeRepository.getEmployees(limit, offset, filters, sortBy, order);
    const total = await employeeRepository.getEmployeeCount(filters);

    return {
      employees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getEmployeeById(id) {
    const employee = await employeeRepository.getEmployeeById(id);
    if (!employee) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }
    return employee;
  }

  async updateEmployee(id, data, userId) {
    // Check if employee exists
    const existing = await employeeRepository.getEmployeeById(id);
    if (!existing) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await employeeRepository.updateEmployee(id, data);

    await employeeRepository.addActivityLog(
      "Employee Updated",
      `${updated.name} employee profile was updated`,
      userId
    );

    return updated;
  }

  async updateEmployeeStatus(id, status, userId) {
    const existing = await employeeRepository.getEmployeeById(id);
    if (!existing) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }

    const updated = await employeeRepository.updateEmployeeStatus(id, status);

    await employeeRepository.addActivityLog(
      "Employee Status Changed",
      `${updated.name} status changed to ${status}`,
      userId
    );

    return updated;
  }

  async deleteEmployee(id, userId) {
    const existing = await employeeRepository.getEmployeeById(id);
    if (!existing) {
      const error = new Error("Employee not found");
      error.statusCode = 404;
      throw error;
    }

    await employeeRepository.deleteEmployee(id);

    await employeeRepository.addActivityLog(
      "Employee Deleted",
      `${existing.name} employee profile was deleted`,
      userId
    );
  }
}

module.exports = new EmployeeService();
