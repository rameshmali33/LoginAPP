/**
 * Auth Service
 * Business logic for authentication, signup, password resets, and verification
 */

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const authRepository = require("../repositories/authRepository");
const sendEmail = require("../config/mailer");
const logger = require("../utils/logger");

const FRONTEND_URL = process.env.FRONTEND_URL || "https://employeemanagementsystem-ten.vercel.app";

class AuthService {
  async signup(name, email, password) {
    const userExist = await authRepository.getUserByEmail(email);
    if (userExist) {
      const error = new Error("Email already exists");
      error.statusCode = 400;
      throw error;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const verificationToken = crypto.randomBytes(32).toString("hex");

    const newUser = await authRepository.createUser(
      name,
      email,
      hashedPassword,
      verificationToken
    );

    const verifyLink = `${FRONTEND_URL}/verify-email/${verificationToken}`;

    logger.info(`Sending verification email to: ${email}`);
    try {
      await sendEmail({
        to: email,
        subject: "Verify Your Email",
        html: `
          <h2>Welcome ${name}</h2>
          <p>Please verify your email:</p>
          <a href="${verifyLink}">Verify Email</a>
        `,
      });
      logger.info("Verification email sent successfully");
    } catch (err) {
      logger.warn("Failed to send verification email:", err.message);
      // We still complete the signup but warn
    }

    return newUser;
  }

  async login(email, password) {
    const user = await authRepository.getUserByEmail(email);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 400;
      throw error;
    }

    if (!user.is_verified) {
      const error = new Error("Please verify your email first");
      error.statusCode = 401;
      throw error;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      const error = new Error("Wrong Password");
      error.statusCode = 400;
      throw error;
    }

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee_profile_id: user.employee_profile_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return token;
  }

  async forgotPassword(email) {
    const user = await authRepository.getUserByEmail(email);
    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await authRepository.updateUserResetToken(email, resetToken, expiry);

    const resetLink = `${FRONTEND_URL}/reset-password/${resetToken}`;

    logger.info(`Sending password reset link to: ${email}`);
    try {
      await sendEmail({
        to: email,
        subject: "Password Reset",
        html: `
          <h2>Password Reset</h2>
          <p>Click below to reset your password:</p>
          <a href="${resetLink}">Reset Password</a>
        `,
      });
      logger.info("Reset email sent successfully");
    } catch (err) {
      logger.error("Failed to send reset password email:", err);
      throw new Error("Failed to send reset email");
    }
  }

  async resetPassword(token, password) {
    const user = await authRepository.getUserByResetToken(token);
    if (!user) {
      const error = new Error("Invalid or expired token");
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await authRepository.updateUserPassword(user.id, hashedPassword);
  }

  async verifyEmail(token) {
    const user = await authRepository.getUserByVerificationToken(token);
    if (!user) {
      const error = new Error("Invalid verification token");
      error.statusCode = 400;
      throw error;
    }

    await authRepository.updateUserVerification(user.id);
  }
}

module.exports = new AuthService();
