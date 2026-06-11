/**
 * Notifications Page
 * View and manage user notifications
 */

import React, { useState, useEffect } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import Swal from "sweetalert2";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filter, setFilter] = useState("all"); // all, unread

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [pagination.page, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get("/notifications", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          unread_only: filter === "unread",
        },
      });
      setNotifications(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      Swal.fire("Error", "Failed to fetch notifications", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      Swal.fire("Error", "Failed to mark notification as read", "error");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put("/notifications/read-all");
      fetchNotifications();
      fetchUnreadCount();
      Swal.fire("Success", "All notifications marked as read", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to mark all as read", "error");
    }
  };

  return (
    <Layout title="Notifications">
      <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Notifications {unreadCount > 0 && <span className="badge bg-danger">{unreadCount}</span>}</h2>
        {unreadCount > 0 && (
          <button className="btn btn-outline-primary btn-sm" onClick={handleMarkAllAsRead}>
            Mark All as Read
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="mb-4">
        <button
          className={`btn me-2 ${filter === "all" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setFilter("all");
            setPagination({ ...pagination, page: 1 });
          }}
        >
          All
        </button>
        <button
          className={`btn ${filter === "unread" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => {
            setFilter("unread");
            setPagination({ ...pagination, page: 1 });
          }}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      <div className="row">
        <div className="col-lg-8">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="alert alert-info">No notifications</div>
          ) : (
            <div>
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`card mb-3 ${!notif.is_read ? "border-primary" : ""}`}
                >
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <h5 className="card-title mb-1">{notif.title}</h5>
                        <p className="card-text text-muted mb-2">{notif.message}</p>
                        <small className="text-muted">
                          {new Date(notif.created_at).toLocaleString()}
                        </small>
                      </div>
                      <div>
                        {!notif.is_read && (
                          <span className="badge bg-primary me-2">New</span>
                        )}
                        {!notif.is_read && (
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => handleMarkAsRead(notif.id)}
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <nav aria-label="Notifications pagination">
                  <ul className="pagination justify-content-center">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                      (page) => (
                        <li
                          key={page}
                          className={`page-item ${
                            pagination.page === page ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() =>
                              setPagination({ ...pagination, page })
                            }
                          >
                            {page}
                          </button>
                        </li>
                      )
                    )}
                  </ul>
                </nav>
              )}
            </div>
          )}
        </div>
      </div>
      </div>
    </Layout>
  );
};

export default Notifications;
