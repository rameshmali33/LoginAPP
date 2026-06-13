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
  FaMoneyCheckAlt,
  FaBox,
  FaHistory,
  FaBell,
  FaTimes,
} from "react-icons/fa";
import GlobalSearch from "./GlobalSearch";
import api from "../services/api";
import "./Layout.css";

function Layout({ children, title }) {
  const navigate = useNavigate();

  const [role, setRole] = useState("");
  const [employeeProfileId, setEmployeeProfileId] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

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

  const fetchNotifications = async () => {
    try {
      setNotificationsLoading(true);
      const response = await api.get("/notifications", {
        params: {
          page: 1,
          limit: 10,
          unread_only: false,
        },
      });
      setNotifications(response.data.data || []);
      setUnreadNotifications(response.data.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  const openNotificationDrawer = async () => {
    setNotificationDrawerOpen(true);
    await fetchNotifications();
  };

  const closeNotificationDrawer = () => {
    setNotificationDrawerOpen(false);
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      await fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const formatNotificationTime = (value) => {
    if (!value) return "";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
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
          <h3>EP</h3>
          <p>Management System</p>
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

          {role && (
            <NavLink to="/payroll">
              <FaMoneyCheckAlt /> Payroll
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

            {role && (
              <button
                type="button"
                className="topbar-icon-btn position-relative"
                onClick={openNotificationDrawer}
                aria-label="Notifications"
                title="Notifications"
              >
                <FaBell />
                {unreadNotifications > 0 && (
                  <span className="notification-badge">
                    {unreadNotifications > 99 ? "99+" : unreadNotifications}
                  </span>
                )}
              </button>
            )}

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

      {role && (
        <>
          <div
            className={`notification-backdrop ${notificationDrawerOpen ? "show" : ""}`}
            onClick={closeNotificationDrawer}
          />

          <aside className={`notification-drawer ${notificationDrawerOpen ? "open" : ""}`}>
            <div className="notification-drawer-header">
              <div>
                <h5>Notifications</h5>
                <span>{unreadNotifications} unread</span>
              </div>

              <button
                type="button"
                className="notification-close-btn"
                onClick={closeNotificationDrawer}
                aria-label="Close notifications"
              >
                <FaTimes />
              </button>
            </div>

            <div className="notification-drawer-actions">
              <button
                type="button"
                className="btn btn-sm btn-outline-primary"
                onClick={markAllNotificationsAsRead}
                disabled={unreadNotifications === 0}
              >
                Mark all read
              </button>

              <button
                type="button"
                className="btn btn-sm btn-link text-decoration-none"
                onClick={() => {
                  closeNotificationDrawer();
                  navigate("/notifications");
                }}
              >
                View all
              </button>
            </div>

            <div className="notification-list">
              {notificationsLoading ? (
                <div className="notification-empty">Loading notifications...</div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">No notifications</div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.is_read ? "" : "unread"}`}
                  >
                    <div className="notification-item-main">
                      <div className="notification-item-title">
                        {notification.title}
                      </div>
                      <p>{notification.message}</p>
                      <span>{formatNotificationTime(notification.created_at)}</span>
                    </div>

                    {!notification.is_read && (
                      <button
                        type="button"
                        className="notification-read-btn"
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

export default Layout;
