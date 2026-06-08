require("dotenv").config();

const path = require("path");
const uploadRoutes = require("./routes/uploads");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const departmentRoutes = require("./routes/departments");
const skillRoutes = require("./routes/skills");
const employeeRoutes = require("./routes/employees");
const employeeSkillRoutes = require("./routes/employeeSkills");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const transporter = require("./config/mailer");
const profileLinkRequestRoutes = require("./routes/profileLinkRequests");
const leaveRoutes = require("./routes/leaves");
const { swaggerUi, swaggerDocument } = require("./config/swagger");

const app = express();

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

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/uploads", uploadRoutes);
app.use("/api/employee-skills", employeeSkillRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/profile-link-requests", profileLinkRequestRoutes);
app.use("/api/leaves", leaveRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});

app.get("/", (req, res) => {
  res.send("Employee Management Backend is running");
});

app.get("/test-email", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: "Test Email",
      text: "Render email test",
    });

    res.send("Email sent");
  } catch (error) {
    console.error(error);
    res.status(500).send(error.message);
  }
});