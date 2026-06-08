const swaggerUi = require("swagger-ui-express");

const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "Employee Profile Management System (EPMS) API Documentation",
    version: "1.0.0",
    description: "API documentation for the EPMS including Authentication, Role-based Dashboards, and the Leave Management & Approval Workflow system.",
  },
  servers: [
    {
      url: "http://localhost:5000/api",
      description: "Local Development Server",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    "/auth/login": {
      post: {
        summary: "User login",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
                required: ["email", "password"],
              },
            },
          },
        },
        responses: {
          200: { description: "Successful login, returns JWT token" },
          400: { description: "Invalid email/password, or user not found" },
        },
      },
    },
    "/leaves/types": {
      get: {
        summary: "Get list of all leave types",
        tags: ["Leaves"],
        responses: {
          200: { description: "List of leave types" },
        },
      },
    },
    "/leaves/balances": {
      get: {
        summary: "Get leave balances for the logged-in employee",
        tags: ["Leaves"],
        responses: {
          200: { description: "List of available leave balances per leave type" },
          400: { description: "Employee profile not linked" },
        },
      },
    },
    "/leaves/apply": {
      post: {
        summary: "Submit a new leave application",
        tags: ["Leaves"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  leave_type_id: { type: "integer" },
                  from_date: { type: "string", format: "date" },
                  to_date: { type: "string", format: "date" },
                  reason: { type: "string" },
                },
                required: ["leave_type_id", "from_date", "to_date"],
              },
            },
          },
        },
        responses: {
          201: { description: "Leave application submitted" },
          400: { description: "Invalid dates, or insufficient balance" },
        },
      },
    },
    "/leaves/history": {
      get: {
        summary: "Get leave applications history for the logged-in employee",
        tags: ["Leaves"],
        responses: {
          200: { description: "Array of past leave requests" },
        },
      },
    },
    "/leaves/pending-manager": {
      get: {
        summary: "Get pending leave applications requiring manager approval",
        tags: ["Leaves"],
        responses: {
          200: { description: "Array of pending manager-level leave requests" },
        },
      },
    },
    "/leaves/review-manager/{id}": {
      put: {
        summary: "Approve or reject leave application (Manager Level)",
        tags: ["Leaves"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["approved", "rejected"] },
                  remarks: { type: "string" },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          200: { description: "Manager review processed successfully" },
        },
      },
    },
    "/leaves/pending-hr": {
      get: {
        summary: "Get pending leave applications requiring HR final approval",
        tags: ["Leaves"],
        responses: {
          200: { description: "Array of pending HR-level leave requests" },
        },
      },
    },
    "/leaves/review-hr/{id}": {
      put: {
        summary: "Approve or reject leave application (HR Final Level)",
        tags: ["Leaves"],
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "integer" },
          },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["approved", "rejected"] },
                  remarks: { type: "string" },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          200: { description: "HR final review processed (balances updated on approval)" },
        },
      },
    },
    "/leaves/reports": {
      get: {
        summary: "Get leave analytics reports (Admin/HR only)",
        tags: ["Leaves"],
        responses: {
          200: { description: "Stats, department leaves, monthly trends, absence rankings" },
        },
      },
    },
  },
};

module.exports = { swaggerUi, swaggerDocument };
