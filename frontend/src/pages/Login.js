import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import {
  FaEye,
  FaEyeSlash,
  FaUsers,
  FaChartPie,
  FaShieldAlt,
  FaFileExcel,
} from "react-icons/fa";

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
    <div
      className="min-vh-100 d-flex align-items-center"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e3a8a 45%, #2563eb 100%)",
      }}
    >
      <div className="container py-5">
        <div className="row align-items-center justify-content-center g-5">
          <div className="col-lg-6 text-white">
            <div className="mb-4">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-4 bg-white text-primary shadow mb-4"
                style={{
                  width: "80px",
                  height: "80px",
                  fontSize: "34px",
                  fontWeight: "800",
                }}
              >
                EP
              </div>

              <h1 className="display-5 fw-bold mb-3">
                Employee Profile Management System
              </h1>

              <p className="lead text-white-50 mb-4">
                A secure and modern platform to manage employee profiles,
                departments, skills, images, reports and role-based dashboards
                in one place.
              </p>
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <div className="p-3 rounded-4 bg-white bg-opacity-10 border border-light border-opacity-25 h-100">
                  <FaUsers className="fs-3 mb-3" />
                  <h6 className="fw-bold">Employee Management</h6>
                  <p className="small text-white-50 mb-0">
                    Create, update and manage complete employee profiles.
                  </p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-4 bg-white bg-opacity-10 border border-light border-opacity-25 h-100">
                  <FaShieldAlt className="fs-3 mb-3" />
                  <h6 className="fw-bold">Secure Access</h6>
                  <p className="small text-white-50 mb-0">
                    JWT authentication with admin and employee role access.
                  </p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-4 bg-white bg-opacity-10 border border-light border-opacity-25 h-100">
                  <FaChartPie className="fs-3 mb-3" />
                  <h6 className="fw-bold">Smart Dashboard</h6>
                  <p className="small text-white-50 mb-0">
                    View statistics, charts, recent activity and insights.
                  </p>
                </div>
              </div>

              <div className="col-md-6">
                <div className="p-3 rounded-4 bg-white bg-opacity-10 border border-light border-opacity-25 h-100">
                  <FaFileExcel className="fs-3 mb-3" />
                  <h6 className="fw-bold">Reports & Export</h6>
                  <p className="small text-white-50 mb-0">
                    Generate employee reports and export data to Excel.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-5 col-md-8">
            <div className="card shadow-lg border-0 rounded-4">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white mb-3"
                    style={{
                      width: "60px",
                      height: "60px",
                      fontSize: "24px",
                      fontWeight: "700",
                    }}
                  >
                    EP
                  </div>

                  <h2 className="fw-bold mb-1">Welcome Back</h2>
                  <p className="text-muted mb-0">
                    Login to access your dashboard
                  </p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email</label>

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className="form-control form-control-lg"
                      value={form.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Password</label>

                    <div className="input-group input-group-lg">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Enter your password"
                        className="form-control"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />

                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <Link to="/forgot-password" className="text-decoration-none">
                      Forgot Password?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-lg w-100"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <span className="text-muted">Don't have an account?</span>{" "}
                  <Link to="/signup" className="fw-semibold text-decoration-none">
                    Register
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-center text-white-50 small mt-4 mb-0">
              © {new Date().getFullYear()} Employee Profile Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;