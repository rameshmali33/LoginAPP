import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import {
  FaArrowRight,
  FaBriefcase,
  FaChartLine,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaIdBadge,
  FaLock,
  FaShieldAlt,
  FaUserCheck,
} from "react-icons/fa";
import "./Login.css";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      const res = await API.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      localStorage.setItem("token", res.data.token);

      await Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: "Welcome back!",
        timer: 1500,
        showConfirmButton: false,
      });

      navigate("/dashboard");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.response?.data?.message || "Invalid email or password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="login-brand-mark">
          <span>EP</span>
        </div>

        <div className="login-brand-copy">
          <p className="login-kicker">Employee operations suite</p>
          <h1>EP Management System</h1>
          <p>
            Manage people records, attendance, payroll, assets, reports, and
            approvals from one secure workspace.
          </p>
        </div>

        <div className="login-metrics">
          <div>
            <strong>29</strong>
            <span>Employees</span>
          </div>
          <div>
            <strong>12</strong>
            <span>Departments</span>
          </div>
          <div>
            <strong>24/7</strong>
            <span>Access</span>
          </div>
        </div>

        <div className="login-feature-grid">
          <div className="login-feature">
            <FaUserCheck />
            <div>
              <strong>Employee Records</strong>
              <span>Profiles, departments, and skills.</span>
            </div>
          </div>

          <div className="login-feature">
            <FaChartLine />
            <div>
              <strong>Analytics</strong>
              <span>Live dashboard and reports.</span>
            </div>
          </div>

          <div className="login-feature">
            <FaBriefcase />
            <div>
              <strong>Payroll Ready</strong>
              <span>Formal salary and deduction flow.</span>
            </div>
          </div>

          <div className="login-feature">
            <FaShieldAlt />
            <div>
              <strong>Role Security</strong>
              <span>Admin and employee access control.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-card">
          <div className="login-card-header">
            <div className="login-card-icon">
              <FaIdBadge />
            </div>
            <div>
              <h2>Sign in</h2>
              <p>Use your registered company credentials.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Email address</label>
              <div className="login-input-wrap">
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

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrap">
                <FaLock />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="login-form-row">
              <span>Secure session</span>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button type="submit" className="login-submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
              {!loading && <FaArrowRight />}
            </button>
          </form>

          <div className="login-register">
            <span>Need an account?</span>
            <Link to="/signup">Create account</Link>
          </div>
        </div>

        <p className="login-footer">
          (c) {new Date().getFullYear()} EP Management System
        </p>
      </section>
    </main>
  );
}

export default Login;
