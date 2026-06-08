require("dotenv").config();

const path = require("path");
const uploadRoutes = require("./routes/uploads");
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const departmentRoutes = require("./routes/departments");
const skillRoutes = require("./routes/skills");
const employeeRoutes = require("./routes/employees");
const employeeSkillRoutes = require("./routes/employeeSkills");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");
const transporter = require("./config/mailer");
const profileLinkRequestRoutes = require("./routes/profileLinkRequests");

const app = express();

app.use(cors());
app.use(express.json());

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