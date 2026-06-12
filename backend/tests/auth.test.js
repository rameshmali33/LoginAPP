const request = require("supertest");
const express = require("express");
const pool = require("../config/db");

// Mock pg pool
jest.mock("../config/db", () => ({
  query: jest.fn(),
}));

// Mock mailer
jest.mock("../config/mailer", () => jest.fn().mockResolvedValue({ messageId: "test-id" }));

const authRoutes = require("../routes/auth");
const errorHandler = require("../middleware/errorHandler");

const app = express();
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use(errorHandler);

describe("Auth Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST /signup - Successful user signup", async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [] }) // check existing user
      .mockResolvedValueOnce({ rows: [{ id: 1, name: "John Doe", email: "john@example.com" }] }); // insert user

    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe("john@example.com");
  });

  test("POST /signup - Validation failure", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({
        name: "John Doe",
        email: "invalid-email",
        password: "123", // too short
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
