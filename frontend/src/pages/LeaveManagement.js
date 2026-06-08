import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import {
  FaCalendarPlus,
  FaHistory,
  FaCheckDouble,
  FaChartBar,
  FaClock,
} from "react-icons/fa";
import { Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import useLeave from "../hooks/useLeave";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import Table from "../components/Table";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

function LeaveManagement() {
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : {};
  const role = user.role ? user.role.toLowerCase() : "";
  const isLinked = !!user.employee_profile_id;

  const leaveAPI = useLeave();

  // Active navigation tab for roles with multiple views (Admin/HR/Manager)
  const [activeTab, setActiveTab] = useState("my-leaves");

  // General States
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [balances, setBalances] = useState([]);
  const [history, setHistory] = useState([]);
  const [managerPending, setManagerPending] = useState([]);
  const [hrPending, setHrPending] = useState([]);
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form States (Apply Leave)
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leave_type_id: "",
    from_date: "",
    to_date: "",
    reason: "",
  });
  const [submittingApply, setSubmittingApply] = useState(false);

  // Review Modal States (Manager/HR approvals)
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    id: null,
    level: "", // 'manager' or 'hr'
    status: "", // 'approved' or 'rejected'
    remarks: "",
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    // Default tabs depending on role
    if (role === "manager") {
      setActiveTab("manager-approvals");
    } else if (role === "hr") {
      setActiveTab("hr-approvals");
    } else if (role === "admin") {
      setActiveTab("my-leaves");
    } else {
      setActiveTab("my-leaves");
    }

    loadInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const types = await leaveAPI.getLeaveTypes();
      setLeaveTypes(types);

      if (isLinked) {
        const bal = await leaveAPI.getLeaveBalances();
        setBalances(bal);
        const hist = await leaveAPI.getLeaveHistory();
        setHistory(hist);
      }

      if (role === "manager" || role === "admin") {
        const mPending = await leaveAPI.getPendingForManager();
        setManagerPending(mPending);
      }

      if (role === "hr" || role === "admin") {
        const hPending = await leaveAPI.getPendingForHR();
        setHrPending(hPending);
        const rep = await leaveAPI.getLeaveReports();
        setReportsData(rep);
      }
    } catch (error) {
      console.error("Load Leave Data Error:", error);
      Swal.fire("Error", "Could not load leave records", "error");
    } finally {
      setLoading(false);
    }
  };

  // Handle Apply Leave Submission
  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyForm.leave_type_id || !applyForm.from_date || !applyForm.to_date) {
      return Swal.fire("Validation", "Please fill in all required fields", "warning");
    }

    try {
      setSubmittingApply(true);
      await leaveAPI.applyLeave(applyForm);
      Swal.fire("Success", "Leave request submitted successfully", "success");
      setShowApplyModal(false);
      setApplyForm({ leave_type_id: "", from_date: "", to_date: "", reason: "" });
      loadInitialData();
    } catch (error) {
      console.error("Apply Leave Submit Error:", error);
      Swal.fire("Failed", error.response?.data?.message || "Could not apply for leave", "error");
    } finally {
      setSubmittingApply(false);
    }
  };

  // Open Review Action Dialog
  const openReviewDialog = (id, level, status) => {
    setReviewForm({ id, level, status, remarks: "" });
    setShowReviewModal(true);
  };

  // Handle Review Submission (Manager / HR)
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      if (reviewForm.level === "manager") {
        await leaveAPI.reviewByManager(reviewForm.id, reviewForm.status, reviewForm.remarks);
      } else {
        await leaveAPI.reviewByHR(reviewForm.id, reviewForm.status, reviewForm.remarks);
      }

      Swal.fire("Processed", `Leave request has been ${reviewForm.status}`, "success");
      setShowReviewModal(false);
      loadInitialData();
    } catch (error) {
      console.error("Review Submit Error:", error);
      Swal.fire("Error", error.response?.data?.message || "Failed to process review", "error");
    } finally {
      setSubmittingReview(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "approved":
        return "bg-success";
      case "rejected":
        return "bg-danger";
      case "pending_manager":
        return "bg-warning text-dark";
      case "pending_hr":
        return "bg-info text-white";
      default:
        return "bg-secondary";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      case "pending_manager":
        return "Pending Manager";
      case "pending_hr":
        return "Pending HR";
      default:
        return status;
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Setup Reports Charts Data
  const deptChartData = reportsData
    ? {
      labels: reportsData.departmentLeaves.map((d) => d.department_name),
      datasets: [
        {
          label: "Total Leaves Days Approved",
          data: reportsData.departmentLeaves.map((d) => parseInt(d.total_days || 0)),
          backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"],
          borderWidth: 1,
        },
      ],
    }
    : null;

  const trendChartData = reportsData
    ? {
      labels: reportsData.monthlyTrends.map((t) => t.month_year),
      datasets: [
        {
          label: "Approved Request Count",
          data: reportsData.monthlyTrends.map((t) => parseInt(t.leave_count || 0)),
          backgroundColor: "#4F46E5",
          borderRadius: 6,
        },
      ],
    }
    : null;

  if (loading) {
    return (
      <Layout title="Leave Management">
        <Loader message="Fetching leave configurations and records..." />
      </Layout>
    );
  }

  return (
    <Layout title="Leave Management">
      {/* Role Navigation Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex gap-2">
          {isLinked && (
            <button
              className={`btn ${activeTab === "my-leaves" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveTab("my-leaves")}
            >
              <FaHistory className="me-2" /> My Leaves
            </button>
          )}

          {(role === "manager" || role === "admin") && (
            <button
              className={`btn ${activeTab === "manager-approvals" ? "btn-primary" : "btn-outline-primary"
                }`}
              onClick={() => setActiveTab("manager-approvals")}
            >
              <FaClock className="me-2" /> Manager Reviews ({managerPending.length})
            </button>
          )}

          {(role === "hr" || role === "admin") && (
            <>
              <button
                className={`btn ${activeTab === "hr-approvals" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("hr-approvals")}
              >
                <FaCheckDouble className="me-2" /> HR Final Approvals ({hrPending.length})
              </button>
              <button
                className={`btn ${activeTab === "reports" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("reports")}
              >
                <FaChartBar className="me-2" /> Leave Analytics
              </button>
            </>
          )}
        </div>

        {activeTab === "my-leaves" && isLinked && (
          <Button variant="success" onClick={() => setShowApplyModal(true)}>
            <FaCalendarPlus className="me-2" /> Apply for Leave
          </Button>
        )}
      </div>

      {/* 1. EMPLOYEE TABS: My Leaves */}
      {activeTab === "my-leaves" && (
        <div>
          {!isLinked ? (
            <Card title="Account Unlinked">
              <div className="text-center py-4">
                <h4>No Employee Profile Linked</h4>
                <p className="text-muted">
                  You cannot view leave balances or apply for leaves until an admin links your user
                  account to an employee profile.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {/* Leave Balances Cards */}
              <h5 className="fw-bold mb-3">Available Balances</h5>
              <div className="row g-3 mb-4">
                {balances.map((bal) => (
                  <div className="col-lg-3 col-md-6" key={bal.id}>
                    <div className="p-3 border rounded shadow-sm bg-white d-flex align-items-center justify-content-between">
                      <div>
                        <p className="text-muted mb-1">{bal.leave_name}</p>
                        <h3 className="fw-bold text-primary mb-0">
                          {bal.available_days}{" "}
                          <span className="fs-6 text-muted font-normal">/ {bal.max_days} days</span>
                        </h3>
                      </div>
                      <span className="fs-3 text-info">📅</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* History Table */}
              <Card title="My Leave History">
                <Table
                  headers={["Leave Type", "From Date", "To Date", "Total Days", "Reason", "Status", "Applied On"]}
                  data={history}
                  renderRow={(item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold">{item.leave_name}</td>
                      <td>{formatDate(item.from_date)}</td>
                      <td>{formatDate(item.to_date)}</td>
                      <td>
                        <span className="badge bg-light text-dark fs-6">{item.total_days} days</span>
                      </td>
                      <td style={{ maxWidth: "250px" }} className="text-truncate">
                        {item.reason || <span className="text-muted">No reason provided</span>}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(item.status)}`}>
                          {getStatusText(item.status)}
                        </span>
                      </td>
                      <td>{formatDate(item.created_at)}</td>
                    </tr>
                  )}
                />
              </Card>
            </>
          )}
        </div>
      )}

      {/* 2. MANAGER TABS: Manager Reviews */}
      {activeTab === "manager-approvals" && (
        <Card title="Manager Review Panel">
          <Table
            headers={["Employee", "Designation", "Leave Type", "From", "To", "Total Days", "Reason", "Actions"]}
            data={managerPending}
            renderRow={(item) => (
              <tr key={item.id}>
                <td>
                  <div className="fw-bold">{item.employee_name}</div>
                </td>
                <td>{item.designation || "N/A"}</td>
                <td className="fw-semibold">{item.leave_name}</td>
                <td>{formatDate(item.from_date)}</td>
                <td>{formatDate(item.to_date)}</td>
                <td>{item.total_days} days</td>
                <td style={{ maxWidth: "200px" }} className="text-truncate">
                  {item.reason}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      className="btn-sm"
                      onClick={() => openReviewDialog(item.id, "manager", "approved")}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="btn-sm"
                      onClick={() => openReviewDialog(item.id, "manager", "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* 3. HR TABS: HR Final Approvals */}
      {activeTab === "hr-approvals" && (
        <Card title="HR Final Approval Panel">
          <Table
            headers={["Employee", "Designation", "Leave Type", "From", "To", "Total Days", "Reason", "Actions"]}
            data={hrPending}
            renderRow={(item) => (
              <tr key={item.id}>
                <td>
                  <div className="fw-bold">{item.employee_name}</div>
                </td>
                <td>{item.designation || "N/A"}</td>
                <td className="fw-semibold">{item.leave_name}</td>
                <td>{formatDate(item.from_date)}</td>
                <td>{formatDate(item.to_date)}</td>
                <td>{item.total_days} days</td>
                <td style={{ maxWidth: "200px" }} className="text-truncate">
                  {item.reason}
                </td>
                <td>
                  <div className="d-flex gap-2">
                    <Button
                      variant="success"
                      className="btn-sm"
                      onClick={() => openReviewDialog(item.id, "hr", "approved")}
                    >
                      Final Approve
                    </Button>
                    <Button
                      variant="danger"
                      className="btn-sm"
                      onClick={() => openReviewDialog(item.id, "hr", "rejected")}
                    >
                      Reject
                    </Button>
                  </div>
                </td>
              </tr>
            )}
          />
        </Card>
      )}

      {/* 4. HR/ADMIN TABS: Leave Analytics & Reports */}
      {activeTab === "reports" && reportsData && (
        <div>
          {/* Top Aggregated Summary Metrics */}
          <div className="row g-3 mb-4">
            <div className="col-lg-3 col-6">
              <div className="p-3 border rounded shadow-sm bg-white">
                <p className="text-muted mb-1">Total Leave Requests</p>
                <h3 className="fw-bold mb-0">{reportsData.stats.total}</h3>
              </div>
            </div>
            <div className="col-lg-3 col-6">
              <div className="p-3 border rounded shadow-sm bg-white">
                <p className="text-muted mb-1">Pending Manager Reviews</p>
                <h3 className="fw-bold text-warning mb-0">{reportsData.stats.pendingManager}</h3>
              </div>
            </div>
            <div className="col-lg-3 col-6">
              <div className="p-3 border rounded shadow-sm bg-white">
                <p className="text-muted mb-1">Pending HR Approvals</p>
                <h3 className="fw-bold text-info mb-0">{reportsData.stats.pendingHR}</h3>
              </div>
            </div>
            <div className="col-lg-3 col-6">
              <div className="p-3 border rounded shadow-sm bg-white">
                <p className="text-muted mb-1">Total Approved Requests</p>
                <h3 className="fw-bold text-success mb-0">{reportsData.stats.approved}</h3>
              </div>
            </div>
          </div>

          {/* Analytics Charts */}
          <div className="row g-4 mb-4">
            <div className="col-lg-6">
              <Card title="Leaves by Department">
                {reportsData.departmentLeaves.length === 0 ? (
                  <p className="text-muted">No department data available</p>
                ) : (
                  <div style={{ maxHeight: "300px" }} className="d-flex justify-content-center">
                    <Pie data={deptChartData} options={{ responsive: true }} />
                  </div>
                )}
              </Card>
            </div>
            <div className="col-lg-6">
              <Card title="Monthly Leave Trend">
                {reportsData.monthlyTrends.length === 0 ? (
                  <p className="text-muted">No trend data available</p>
                ) : (
                  <Bar data={trendChartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                )}
              </Card>
            </div>
          </div>

          <div className="row g-4">
            {/* Absence Leaderboard */}
            <div className="col-lg-6">
              <Card title="Most Absent Employees (Top 10)">
                <Table
                  headers={["Rank", "Employee Name", "Approved Absences", "Total Days Absent"]}
                  data={reportsData.mostAbsent}
                  renderRow={(item, idx) => (
                    <tr key={idx}>
                      <td>
                        <span className="fw-bold text-primary">#{item.absence_rank}</span>
                      </td>
                      <td className="fw-bold">{item.employee_name}</td>
                      <td>{item.approved_leaves_count} requests</td>
                      <td>
                        <span className="badge bg-danger text-white fs-6">{item.total_absent_days} days</span>
                      </td>
                    </tr>
                  )}
                />
              </Card>
            </div>

            {/* General Leave Balance Sheet */}
            <div className="col-lg-6">
              <Card title="Employee Leave Balances Report">
                <Table
                  headers={["Employee", "Leave Type", "Available Days", "Allocated Total"]}
                  data={reportsData.balanceReport}
                  renderRow={(item, idx) => (
                    <tr key={idx}>
                      <td className="fw-bold">{item.employee_name}</td>
                      <td>{item.leave_name}</td>
                      <td>
                        <span className={`fw-bold ${item.available_days < 3 ? "text-danger" : "text-success"}`}>
                          {item.available_days}
                        </span>
                      </td>
                      <td>{item.total_allocated} days</td>
                    </tr>
                  )}
                />
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* 5. MODALS */}
      {/* Apply Leave Modal */}
      <Modal show={showApplyModal} onClose={() => setShowApplyModal(false)} title="Apply for Leave">
        <form onSubmit={handleApplySubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Leave Type <span className="text-danger">*</span></label>
            <select
              className="form-select"
              value={applyForm.leave_type_id}
              onChange={(e) => setApplyForm({ ...applyForm, leave_type_id: e.target.value })}
              required
            >
              <option value="">-- Select Leave Type --</option>
              {leaveTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.leave_name} (Max {type.total_days} days)
                </option>
              ))}
            </select>
          </div>

          <div className="row g-2 mb-3">
            <div className="col">
              <label className="form-label fw-semibold">From Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className="form-control"
                value={applyForm.from_date}
                onChange={(e) => setApplyForm({ ...applyForm, from_date: e.target.value })}
                required
              />
            </div>
            <div className="col">
              <label className="form-label fw-semibold">To Date <span className="text-danger">*</span></label>
              <input
                type="date"
                className="form-control"
                value={applyForm.to_date}
                onChange={(e) => setApplyForm({ ...applyForm, to_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Reason for Leave</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Provide context for approval review..."
              value={applyForm.reason}
              onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button variant="success" type="submit" loading={submittingApply}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Review Remarks Modal */}
      <Modal show={showReviewModal} onClose={() => setShowReviewModal(false)} title="Add Review Remarks">
        <form onSubmit={handleReviewSubmit}>
          <div className="mb-3 text-center">
            <p className="mb-1">
              You are about to <strong className={reviewForm.status === "approved" ? "text-success" : "text-danger"}>
                {reviewForm.status.toUpperCase()}
              </strong> this request.
            </p>
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Reviewer Remarks / Feedback</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Provide remarks (optional)..."
              value={reviewForm.remarks}
              onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
            ></textarea>
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              Cancel
            </Button>
            <Button
              variant={reviewForm.status === "approved" ? "success" : "danger"}
              type="submit"
              loading={submittingReview}
            >
              Confirm Action
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

export default LeaveManagement;
