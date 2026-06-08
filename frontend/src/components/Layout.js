import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaBuilding,
  FaTools,
  FaUserPlus,
  FaUsers,
  FaFileAlt,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaUserCircle,
} from "react-icons/fa";
import "./Layout.css";

function Layout({ children, title }) {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [employeeProfileId, setEmployeeProfileId] = useState(null);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setRole(decoded.role || "");
        setEmployeeProfileId(decoded.employee_profile_id || null);
      } catch (error) {
        console.error("Token Decode Error:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div className={`app-layout ${darkMode ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h3>EPMS</h3>
          <p>Employee System</p>
        </div>

        <nav className="sidebar-menu">
          <NavLink to="/dashboard">
            <FaChartLine /> Dashboard
          </NavLink>

          {role === "employee" && employeeProfileId && (
            <NavLink to={`/employees/${employeeProfileId}`}>
              <FaUserCircle /> My Profile
            </NavLink>
          )}

          {role === "admin" && (
            <>
              <NavLink to="/departments">
                <FaBuilding /> Departments
              </NavLink>

              <NavLink to="/skills">
                <FaTools /> Skills
              </NavLink>

              <NavLink to="/create-employee">
                <FaUserPlus /> Create Employee
              </NavLink>

              <NavLink to="/employees">
                <FaUsers /> Employees
              </NavLink>

              <NavLink to="/report">
                <FaFileAlt /> Reports
              </NavLink>
            </>
          )}
        </nav>

        <button className="logout-btn" onClick={logout}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div>
            <h4>{title}</h4>
            <span>
              Employee Profile Management System
              {role && (
                <>
                  {" "}
                  | Role:{" "}
                  <strong className="text-capitalize">{role}</strong>
                </>
              )}
            </span>
          </div>

          <button
            className="theme-toggle-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? <FaSun /> : <FaMoon />}
            {darkMode ? " Light Mode" : " Dark Mode"}
          </button>
        </div>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default Layout;