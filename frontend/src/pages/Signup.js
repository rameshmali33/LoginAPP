import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import {
  FaArrowRight,
  FaCheckCircle,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaIdBadge,
  FaLock,
  FaShieldAlt,
  FaUser,
  FaUserPlus,
  FaUsersCog,
} from "react-icons/fa";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (form.password.length < 6) {
      Swal.fire("Weak Password", "Password must be at least 6 characters", "warning");
      return false;
    }

    if (form.password !== form.confirmPassword) {
      Swal.fire("Password Mismatch", "Password and confirm password do not match", "warning");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      const res = await API.post("/auth/signup", {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      await Swal.fire({
        icon: "success",
        title: "Account Created",
        text:
          res.data.message ||
          "Registration successful. Please verify your email.",
      });

      navigate("/login");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: err.response?.data?.message || "Unable to create account",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = form.email.trim();

    if (!email) {
      Swal.fire("Email Required", "Enter your email address first", "warning");
      return;
    }

    try {
      setResending(true);
      const res = await API.post("/auth/resend-verification", { email });
      Swal.fire(
        "Verification Email Sent",
        res.data.message || "Please check your inbox for the verification link.",
        "success"
      );
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Could Not Send Link",
        text: err.response?.data?.message || "Unable to send verification email",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="signup-page">
      <section className="signup-brand-panel">
        <div className="signup-brand-mark">
          <span>EP</span>
        </div>

        <div className="signup-brand-copy">
          <p className="signup-kicker">Create your workspace access</p>
          <h1>Join EP Management System</h1>
          <p>
            Register your account to access employee records, attendance,
            payroll, assets, reports, and operational workflows from one secure
            platform.
          </p>
        </div>

        <div className="signup-benefits">
          <div className="signup-benefit">
            <FaUsersCog />
            <div>
              <strong>Role-based workspace</strong>
              <span>Separate access for employees, managers, HR, and admins.</span>
            </div>
          </div>

          <div className="signup-benefit">
            <FaShieldAlt />
            <div>
              <strong>Verified access</strong>
              <span>Email verification keeps account onboarding controlled.</span>
            </div>
          </div>

          <div className="signup-benefit">
            <FaCheckCircle />
            <div>
              <strong>Complete operations</strong>
              <span>Profiles, leave, payroll, reports, assets, and notifications.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="signup-form-panel">
        <div className="signup-card">
          <div className="signup-card-header">
            <div className="signup-card-icon">
              <FaUserPlus />
            </div>
            <div>
              <h2>Create account</h2>
              <p>Use your official details to register.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <div className="signup-field">
              <label htmlFor="name">Full name</label>
              <div className="signup-input-wrap">
                <FaUser />
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="email">Email address</label>
              <div className="signup-input-wrap">
                <FaEnvelope />
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name@company.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="password">Password</label>
              <div className="signup-input-wrap">
                <FaLock />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Minimum 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="signup-field">
              <label htmlFor="confirmPassword">Confirm password</label>
              <div className="signup-input-wrap">
                <FaIdBadge />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="signup-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <button type="submit" className="signup-submit" disabled={loading}>
              {loading ? "Creating account..." : "Create account"}
              {!loading && <FaArrowRight />}
            </button>
          </form>

          <div className="signup-login-link">
            <span>Already have an account?</span>
            <Link to="/login">Login</Link>
          </div>

          <div className="signup-resend-box">
            <span>Registered but not verified?</span>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
            >
              {resending ? "Sending..." : "Resend verification link"}
            </button>
          </div>
        </div>

        <p className="signup-footer">
          © {new Date().getFullYear()} EP Management System
        </p>
      </section>
    </main>
  );
}

export default Signup;
