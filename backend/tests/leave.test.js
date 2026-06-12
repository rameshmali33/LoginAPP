const request = require("supertest");
const express = require("express");
const pool = require("../config/db");

jest.mock("../config/db", () => {
  const queryMock = jest.fn();
  const releaseMock = jest.fn();
  return {
    query: jest.fn(),
    connect: jest.fn().mockResolvedValue({
      query: queryMock,
      release: releaseMock,
    }),
  };
});

// Mock auth middleware
jest.mock("../middleware/authMiddleware", () => {
  return (req, res, next) => {
    req.user = { id: 1, name: "Employee User", role: "employee", employee_profile_id: 10 };
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

const leaveRoutes = require("../routes/leaves");
const errorHandler = require("../middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/leaves", leaveRoutes);
app.use(errorHandler);

describe("Leave Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("GET /balances - Get leave balances successfully", async () => {
    const mockBalances = [
      { leave_name: "Casual Leave", available_days: 10, total_days: 12 }
    ];
    pool.query.mockResolvedValueOnce({ rows: mockBalances });

    const res = await request(app).get("/api/leaves/balances");
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].leave_name).toBe("Casual Leave");
  });

  test("POST /apply - Validation failure (missing from_date)", async () => {
    const res = await request(app)
      .post("/api/leaves/apply")
      .send({
        leave_type_id: 1,
        to_date: "2026-06-20",
        reason: "Vacation",
      });

    expect(res.statusCode).toBe(400);
  });
});
