const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  validateSchema,
} = require("../validators/validators");

router.post("/signup", validateSchema(signupSchema), authController.signup);
router.post("/login", validateSchema(loginSchema), authController.login);
router.post(
  "/forgot-password",
  validateSchema(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password/:token",
  validateSchema(resetPasswordSchema),
  authController.resetPassword
);
router.get("/verify-email/:token", authController.verifyEmail);

module.exports = router;