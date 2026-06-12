/**
 * Auth Controller
 * Handles incoming auth requests, Joi schema validation, and forwards to authService.
 */

const authService = require("../services/authService");

class AuthController {
  signup = async (req, res, next) => {
    try {
      const { name, email, password } = req.validated;
      const user = await authService.signup(name, email, password);
      res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email.",
        user,
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req, res, next) => {
    try {
      const { email, password } = req.validated;
      const token = await authService.login(email, password);
      res.json({
        success: true,
        message: "Login Success",
        token,
      });
    } catch (error) {
      next(error);
    }
  };

  forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.validated;
      await authService.forgotPassword(email);
      res.json({
        success: true,
        message: "Reset email sent",
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req, res, next) => {
    try {
      const { token } = req.params;
      const { password } = req.validated;
      await authService.resetPassword(token, password);
      res.json({
        success: true,
        message: "Password updated successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req, res, next) => {
    try {
      const { token } = req.params;
      await authService.verifyEmail(token);
      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new AuthController();
