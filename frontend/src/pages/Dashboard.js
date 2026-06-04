import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import API from "../services/api";
import Navbar from "../components/Navbar";

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [stats, setStats] = useState({
    employees: 0,
    departments: 0,
    skills: 0,
    images: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await API.get("/dashboard/stats");
        setStats(res.data);
      } catch (error) {
        console.error("Dashboard Stats Error:", error);
      }
    };

    if (token) {
      fetchStats();
    }
  }, [token]);

  if (!token) {
    return <Navigate to="/login" />;
  }

  const user = jwtDecode(token);

  return (
    <>
      <Navbar />

      <div className="container py-5">
        <div className="text-center text-white mb-5">
          <h1 className="display-4 fw-bold">
            Welcome, {user.name} 👋
          </h1>

          <p className="lead">
            Employee Profile Management System
          </p>
        </div>

        <div className="row g-4 mb-5">
          <div className="col-lg-3 col-md-6">
            <div className="card shadow-lg border-0 text-center p-4">
              <h2>👥</h2>
              <h4>Total Employees</h4>
              <h1>{stats.employees}</h1>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card shadow-lg border-0 text-center p-4">
              <h2>🏢</h2>
              <h4>Departments</h4>
              <h1>{stats.departments}</h1>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card shadow-lg border-0 text-center p-4">
              <h2>🛠️</h2>
              <h4>Skills</h4>
              <h1>{stats.skills}</h1>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div className="card shadow-lg border-0 text-center p-4">
              <h2>🖼️</h2>
              <h4>Images</h4>
              <h1>{stats.images}</h1>
            </div>
          </div>
        </div>

        <div className="row g-4">
          <div className="col-lg-3 col-md-6">
            <div
              className="card shadow-lg border-0 h-100 dashboard-card"
              onClick={() => navigate("/departments")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body text-center p-4">
                <h2>🏢</h2>
                <h4>Departments</h4>
                <p>Manage departments</p>
                <button className="btn btn-primary w-100">
                  Open
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div
              className="card shadow-lg border-0 h-100 dashboard-card"
              onClick={() => navigate("/skills")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body text-center p-4">
                <h2>🛠️</h2>
                <h4>Skills</h4>
                <p>Manage skills</p>
                <button className="btn btn-success w-100">
                  Open
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div
              className="card shadow-lg border-0 h-100 dashboard-card"
              onClick={() => navigate("/create-employee")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body text-center p-4">
                <h2>👤</h2>
                <h4>Create Profile</h4>
                <p>Create employee profile</p>
                <button className="btn btn-warning w-100">
                  Open
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div
              className="card shadow-lg border-0 h-100 dashboard-card"
              onClick={() => navigate("/employees")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body text-center p-4">
                <h2>📋</h2>
                <h4>Employee List</h4>
                <p>View all employees</p>
                <button className="btn btn-dark w-100">
                  Open
                </button>
              </div>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <div
              className="card shadow-lg border-0 h-100 dashboard-card"
              onClick={() => navigate("/report")}
              style={{ cursor: "pointer" }}
            >
              <div className="card-body text-center p-4">
                <h2>📊</h2>
                <h4>Reports</h4>
                <p>View employee reports</p>
                <button className="btn btn-secondary w-100">
                  Open
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;