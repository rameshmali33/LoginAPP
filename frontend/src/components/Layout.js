import { jwtDecode } from "jwt-decode";
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaChartLine,
  FaLink,
  FaBuilding,
  FaTools,
  FaUserPlus,
  FaUsers,
  FaFileAlt,
  FaSignOutAlt,
  FaMoon,
  FaSun,
  FaUserCircle,
  FaCalendarCheck,
  FaUserClock,
  FaBox,
  FaHistory,
  FaBell,
} from "react-icons/fa";
import GlobalSearch from "./GlobalSearch";
import api from "../services/api";
import "./Layout.css";

function Layout({ children, title }) {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [employeeProfileId, setEmployeeProfileId] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

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
        
        // Fetch unread notification count
        fetchUnreadCount();
      } catch (error) {
        console.error("Token Decode Error:", error);
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  }, [navigate]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadNotifications(response.data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

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

          {role && (
            <NavLink to="/leaves">
              <FaCalendarCheck /> Leaves
            </NavLink>
          )}

          {role && (
            <NavLink to="/attendance">
              <FaUserClock /> Attendance
            </NavLink>
          )}

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

              <NavLink to="/assets">
                <FaBox /> Assets
              </NavLink>

              <NavLink to="/report">
                <FaFileAlt /> Reports
              </NavLink>

              <NavLink to="/audit-logs">
                <FaHistory /> Audit Logs
              </NavLink>

              <NavLink to="/profile-link-requests">
                <FaLink /> Link Requests
              </NavLink>
            </>
          )}

          <NavLink to="/notifications">
            <FaBell /> Notifications
            {unreadNotifications > 0 && (
              <span className="badge bg-danger ms-2">{unreadNotifications}</span>
            )}
          </NavLink>
          {role ? (
            <button className="logout-btn" onClick={logout}>
              <FaSignOutAlt /> Logout
            </button>
          ) : (
            <NavLink to="/login" className="logout-btn">
              <FaSignOutAlt /> Login
            </NavLink>
          )}
        </nav>
      </aside>

      <main className="main-content">
        <div className="topbar">
          <div className="flex-grow-1">
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

          <div className="d-flex align-items-center gap-3">
            <GlobalSearch />

            <button
              className="theme-toggle-btn"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <FaSun /> : <FaMoon />}
              {darkMode ? " Light Mode" : " Dark Mode"}
            </button>
          </div>
        </div>

        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}

export default Layout;
