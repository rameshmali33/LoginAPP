const request = require("supertest");
const express = require("express");
const pool = require("../config/db");

// Mock pg pool
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

// Mock mailer
jest.mock("../config/mailer", () => jest.fn().mockResolvedValue({ messageId: "test-id" }));

// Mock auth middleware to bypass token verification and supply standard user
jest.mock("../middleware/authMiddleware", () => {
  return (req, res, next) => {
    req.user = { id: 1, name: "Admin User", role: "admin" };
    next();
  };
});

// Mock role middleware
jest.mock("../middleware/roleMiddleware", () => {
  return (...allowedRoles) => {
    return (req, res, next) => {
      next();
    };
  };
});

const employeeRoutes = require("../routes/employees");
const errorHandler = require("../middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/employees", employeeRoutes);
app.use(errorHandler);

describe("Employee Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET / - List employees", async () => {
    const mockEmployees = [
      { id: 1, name: "Alice", email: "alice@example.com", designation: "Engineer", department_name: "IT" }
    ];
    pool.query
      .mockResolvedValueOnce({ rows: mockEmployees }) // getEmployees
      .mockResolvedValueOnce({ rows: [{ count: 1 }] }); // count

    const res = await request(app).get("/api/employees");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].name).toBe("Alice");
  });

  test("POST / - Create employee successful", async () => {
    const newEmp = {
      id: 2,
      name: "Bob",
      email: "bob@example.com",
      designation: "Developer",
      department_id: 1,
      salary: 50000,
      phone: "1234567890"
    };

    pool.query
      .mockResolvedValueOnce({ rows: [newEmp] }) // createEmployee in repo
      .mockResolvedValueOnce({ rows: [] }); // addActivityLog

    const res = await request(app)
      .post("/api/employees")
      .send({
        name: "Bob",
        email: "bob@example.com",
        designation: "Developer",
        department_id: 1,
        salary: 50000,
        phone: "1234567890",
        address: "123 street",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.employee.name).toBe("Bob");
  });

  test("POST / - Create employee validation failure", async () => {
    const res = await request(app)
      .post("/api/employees")
      .send({
        name: "Bob",
        email: "invalid-email",
        designation: "Developer",
        department_id: "not-an-integer",
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
