const path = require("path");
const dotenv = require("dotenv");

// Environment Based Configuration
const env = process.env.NODE_ENV || "development";
dotenv.config({ path: path.join(__dirname, `.env.${env}`) });
dotenv.config(); // Fallback to root .env

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const departmentRoutes = require("./routes/departments");
const skillRoutes = require("./routes/skills");
const employeeRoutes = require("./routes/employees");
const uploadRoutes = require("./routes/uploads");
const employeeSkillRoutes = require("./routes/employeeSkills");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const transporter = require("./config/mailer");
const profileLinkRequestRoutes = require("./routes/profileLinkRequests");
const leaveRoutes = require("./routes/leaves");
const attendanceRoutes = require("./routes/attendance");
const assetRoutes = require("./routes/assets");
const notificationRoutes = require("./routes/notifications");
const auditRoutes = require("./routes/audit");
const searchRoutes = require("./routes/search");
const healthRoutes = require("./routes/health");
const { swaggerUi, swaggerDocument } = require("./config/swagger");
const logger = require("./utils/logger");
const errorHandler = require("./middleware/errorHandler");
const { initCronJobs } = require("./jobs/cronJobs");

const app = express();

// Initialize Background Cron Jobs
initCronJobs();

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: false, // Allows browser access to uploaded files (multer)
  })
);

// API Rate Limiting to prevent spam/abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  message: {
    message: "Too many requests from this IP. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.use(cors());
app.use(express.json());

// API Documentation (Swagger)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Mount routes with API versioning support
const v1Prefix = "/api/v1";
const legacyPrefix = "/api";

[v1Prefix, legacyPrefix].forEach((prefix) => {
  app.use(`${prefix}/auth`, authRoutes);
  app.use(`${prefix}/departments`, departmentRoutes);
  app.use(`${prefix}/skills`, skillRoutes);
  app.use(`${prefix}/employees`, employeeRoutes);
  app.use(`${prefix}/uploads`, uploadRoutes);
  app.use(`${prefix}/employee-skills`, employeeSkillRoutes);
  app.use(`${prefix}/dashboard`, dashboardRoutes);
  app.use(`${prefix}/reports`, reportRoutes);
  app.use(`${prefix}/profile-link-requests`, profileLinkRequestRoutes);
  app.use(`${prefix}/leaves`, leaveRoutes);
  app.use(`${prefix}/attendance`, attendanceRoutes);
  app.use(`${prefix}/assets`, assetRoutes);
  app.use(`${prefix}/notifications`, notificationRoutes);
  app.use(`${prefix}/audit-logs`, auditRoutes);
  app.use(`${prefix}/search`, searchRoutes);
  app.use(`${prefix}/health`, healthRoutes);
});

// Serve uploads
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.listen(process.env.PORT, () => {
  logger.info(`🚀 Server running in [${process.env.NODE_ENV || "development"}] mode on port ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  res.send("Employee Management Backend is running");
});

app.get("/test-email", async (req, res) => {
  try {
    await transporter({
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      html: "<p>Render email test</p>",
    });

    res.send("Email sent");
  } catch (error) {
    logger.error("Test email failed:", error);
    res.status(500).send(error.message);
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);
