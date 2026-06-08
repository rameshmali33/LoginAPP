import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function ProfileLinkRequestsAdmin() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await API.get("/profile-link-requests");
      setRequests(res.data);
    } catch (error) {
      Swal.fire("Error", "Error loading link requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (id) => {
    const result = await Swal.fire({
      title: "Approve Request?",
      text: "This will link user account with employee profile.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Approve",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await API.put(`/profile-link-requests/${id}/approve`);
      Swal.fire("Approved", res.data.message, "success");
      fetchRequests();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error approving request",
        "error"
      );
    }
  };

  const rejectRequest = async (id) => {
    const result = await Swal.fire({
      title: "Reject Request?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Reject",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await API.put(`/profile-link-requests/${id}/reject`);
      Swal.fire("Rejected", res.data.message, "success");
      fetchRequests();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error rejecting request",
        "error"
      );
    }
  };

  return (
    <Layout title="Profile Link Requests">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Profile Link Requests</h2>
        <p className="text-muted mb-0">
          Approve or reject employee profile linking requests.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-3">Loading requests...</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>User</th>
                    <th>Requested Profile</th>
                    <th>Message</th>
                    <th>Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center text-muted py-5">
                        No link requests found
                      </td>
                    </tr>
                  ) : (
                    requests.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <div className="fw-semibold">{req.user_name}</div>
                          <small className="text-muted">{req.user_email}</small>
                        </td>

                        <td>
                          <div className="fw-semibold">{req.employee_name}</div>
                          <small className="text-muted">
                            {req.employee_email}
                          </small>
                        </td>

                        <td>{req.message || "N/A"}</td>

                        <td>
                          <span
                            className={`badge ${
                              req.status === "approved"
                                ? "bg-success"
                                : req.status === "rejected"
                                ? "bg-danger"
                                : "bg-warning text-dark"
                            }`}
                          >
                            {req.status}
                          </span>
                        </td>

                        <td className="text-center">
                          {req.status === "pending" ? (
                            <div className="d-flex gap-2 justify-content-center">
                              <button
                                className="btn btn-success btn-sm"
                                onClick={() => approveRequest(req.id)}
                              >
                                Approve
                              </button>

                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => rejectRequest(req.id)}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-muted">Completed</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ProfileLinkRequestsAdmin;