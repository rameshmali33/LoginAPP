const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const transporter = require("../config/mailer");

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExist = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (userExist.rows.length > 0) {
      return res.status(400).json({
        message: "Email already exists"
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const newUser = await pool.query(
      `INSERT INTO users(
        name,
        email,
        password,
        verification_token
      )
      VALUES($1, $2, $3, $4)
       RETURNING *`,
      [name, email, hashedPassword, verificationToken]
    );

    const verifyLink =
      `http://localhost:3000/verify-email/${verificationToken}`;

    console.log("Sending verification email...");
    console.log("To:", email);
    console.log("Token:", verificationToken);
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Verify Your Email",
      html: `
        <h2>Welcome!</h2>
        <p>Please verify your email:</p>

        <a href="${verifyLink}">
          Verify Email
        </a>
      `,
    });
    console.log("Email sent successfully");
    console.log(info);

    res.status(201).json({
      message: "Registration successful. Please verify your email.",
      user: newUser.rows[0]
    });

  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      message: error.message
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "User not found"
      });
    }

    if (!user.rows[0].is_verified) {
      return res.status(401).json({
        message:
          "Please verify your email first",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password
    );

    if (!validPassword) {
      return res.status(400).json({
        message: "Wrong Password"
      });
    }

    const token = jwt.sign(
    {
      id: user.rows[0].id,
      name: user.rows[0].name,
      email: user.rows[0].email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1d"
    }
  );

    res.json({
      message: "Login Success",
      token
    });

  } catch (error) {
      console.error("Signup Error:", error);

      res.status(500).json({
        message: "Server Error",
        error: error.message,
      });
    }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const expiry = new Date(
      Date.now() + 60 * 60 * 1000
    );

    await pool.query(
      `
      UPDATE users
      SET reset_token = $1,
          reset_token_expiry = $2
      WHERE email = $3
      `,
      [resetToken, expiry, email]
    );

    const resetLink =
      `http://localhost:3000/reset-password/${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset",
      html: `
        <h2>Password Reset</h2>
        <p>Click below:</p>
        <a href="${resetLink}">
          Reset Password
        </a>
      `,
    });

    res.json({
      message: "Reset email sent",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});

router.post(
  "/reset-password/:token",
  async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;

      const user = await pool.query(
        `
        SELECT *
        FROM users
        WHERE reset_token = $1
        AND reset_token_expiry > NOW()
        `,
        [token]
      );

      if (user.rows.length === 0) {
        return res.status(400).json({
          message: "Invalid or expired token",
        });
      }

      const hashedPassword =
        await bcrypt.hash(password, 10);

      await pool.query(
        `
        UPDATE users
        SET password = $1,
            reset_token = NULL,
            reset_token_expiry = NULL
        WHERE id = $2
        `,
        [
          hashedPassword,
          user.rows[0].id,
        ]
      );

      res.json({
        message: "Password updated successfully",
      });

    } catch (error) {
      console.error(error);

      res.status(500).json({
        message: "Server Error",
      });
    }
  }
);

router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const user = await pool.query(
      "SELECT * FROM users WHERE verification_token = $1",
      [token]
    );

    if (user.rows.length === 0) {
      return res.status(400).json({
        message: "Invalid verification token",
      });
    }

    await pool.query(
      `UPDATE users
       SET is_verified = TRUE,
           verification_token = NULL
       WHERE id = $1`,
      [user.rows[0].id]
    );

    res.json({
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verify Email Error:", error);
    res.status(500).json({
      message: "Server Error",
    });
  }
});
module.exports = router;