
const authService = require("../services/authService");

const normalizeUrl = (url) => String(url || "").replace(/\/+$/, "");
const FRONTEND_URL = normalizeUrl(
  process.env.FRONTEND_URL || "https://employeemanagementsystem-ten.vercel.app"
);

const sendVerificationPage = (res, { success, title, message }) => {
  const color = success ? "#16a34a" : "#dc2626";
  const icon = success ? "✓" : "!";

  res
    .status(success ? 200 : 400)
    .type("html")
    .send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        font-family: Arial, sans-serif;
        background: #f4f7fb;
        color: #111827;
      }
      .card {
        width: min(440px, calc(100vw - 32px));
        padding: 36px;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        background: #ffffff;
        text-align: center;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.12);
      }
      .icon {
        width: 72px;
        height: 72px;
        margin: 0 auto 18px;
        border-radius: 999px;
        display: grid;
        place-items: center;
        background: ${success ? "#dcfce7" : "#fee2e2"};
        color: ${color};
        font-size: 38px;
        font-weight: 800;
      }
      h1 {
        margin: 0 0 12px;
        font-size: 28px;
      }
      p {
        margin: 0 0 24px;
        color: #64748b;
        line-height: 1.6;
      }
      a {
        display: inline-block;
        padding: 12px 18px;
        border-radius: 8px;
        background: #2563eb;
        color: #ffffff;
        font-weight: 700;
        text-decoration: none;
      }
    </style>
  </head>
  <body>
    <main class="card">
      <div class="icon">${icon}</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="${FRONTEND_URL}/login">Go to Login</a>
    </main>
  </body>
</html>`);
};

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

  resendVerification = async (req, res, next) => {
    try {
      const { email } = req.validated;
      await authService.resendVerification(email);
      res.json({
        success: true,
        message: "Verification email sent successfully",
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

      if (req.accepts(["html", "json"]) === "html") {
        return sendVerificationPage(res, {
          success: true,
          title: "Email Verified",
          message: "Your email has been verified successfully. You can now log in to your account.",
        });
      }

      res.json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      if (req.accepts(["html", "json"]) === "html") {
        return sendVerificationPage(res, {
          success: false,
          title: "Verification Failed",
          message: error.message || "The verification link is invalid or expired.",
        });
      }

      next(error);
    }
  };
}

module.exports = new AuthController();
