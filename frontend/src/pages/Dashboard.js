import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Pie, Bar } from "react-chartjs-2";
import API from "../services/api";
import Layout from "../components/Layout";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : {};

  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const statsRes = await API.get("/dashboard/stats");
      setStats(statsRes.data);

      if (statsRes.data.dashboardType === "admin") {
        const empRes = await API.get("/employees");
        setEmployees(empRes.data);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);

      if (error.response?.data) {
        setStats(error.response.data);
      }else {
        Swal.fire("Error", "Error loading dashboard data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const departmentCounts = employees.reduce((acc, emp) => {
    const dept = emp.department_name || "N/A";
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  const departmentChartData = {
    labels: Object.keys(departmentCounts),
    datasets: [
      {
        label: "Employees",
        data: Object.values(departmentCounts),
        backgroundColor: [
          "#3B82F6",
          "#10B981",
          "#F59E0B",
          "#EF4444",
          "#8B5CF6",
          "#06B6D4",
          "#EC4899",
          "#84CC16",
        ],
        borderWidth: 2,
        borderColor: "#fff",
      },
    ],
  };

  const salaryChartData = {
    labels: employees.map((emp) => emp.name),
    datasets: [
      {
        label: "Salary",
        data: employees.map((emp) => Number(emp.salary || 0)),
        backgroundColor: "#2563EB",
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  const salaryChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="text-center py-5">
          <div className="spinner-border text-primary"></div>
          <p className="text-muted mt-3">Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout title="Dashboard">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5 text-center">
            <h3 className="fw-bold">No Dashboard Data</h3>
            <p className="text-muted mb-0">Please try refreshing the page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="mb-4">
        <h2 className="fw-bold">Welcome, {user.name} 👋</h2>
        <p className="text-muted">
          {stats.dashboardType === "admin"
            ? "Here is the complete overview of your Employee Profile Management System."
            : stats.dashboardType === "unlinked_employee"
            ? "Your account is active, but your employee profile is not linked yet."
            : "Here is your personal employee dashboard."}
        </p>
      </div>

      {stats.dashboardType === "unlinked_employee" ? (
        <div className="card border-0 shadow-sm">
          <div className="card-body p-5 text-center">
            <div className="display-1 mb-3">🔗</div>
            <h3 className="fw-bold">Profile Not Linked</h3>
            <p className="text-muted mb-0">{stats.message}</p>
            <p className="text-muted mt-2">
              Please send a request to admin to link your user account with an
              employee profile.
            </p>

            <button
              className="btn btn-primary mt-3"
              onClick={() => navigate("/request-profile-link")}
            >
              Request Profile Link
            </button>
          </div>
        </div>
      ) : stats.dashboardType === "employee" ? (
        <>
          <div className="row g-4 mb-5">
            <div className="col-lg-4 col-md-6">
              <div className="stat-card">
                <div className="icon-box">👤</div>
                <p className="text-muted mb-1">My Name</p>
                <h4>{stats.profile?.name}</h4>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="stat-card">
                <div className="icon-box">🏢</div>
                <p className="text-muted mb-1">Department</p>
                <h4>{stats.profile?.department_name || "N/A"}</h4>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="stat-card">
                <div className="icon-box">💼</div>
                <p className="text-muted mb-1">Designation</p>
                <h4>{stats.profile?.designation || "N/A"}</h4>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="stat-card">
                <div className="icon-box">🛠️</div>
                <p className="text-muted mb-1">My Skills</p>
                <h4>{stats.skills?.length || 0}</h4>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="stat-card">
                <div className="icon-box">🖼️</div>
                <p className="text-muted mb-1">My Images</p>
                <h4>{stats.imageCount || 0}</h4>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="stat-card">
                <div className="icon-box">📊</div>
                <p className="text-muted mb-1">Profile Completion</p>
                <h4>{stats.profileCompletion || 0}%</h4>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Profile Completion</h5>

              <div className="progress" style={{ height: "25px" }}>
                <div
                  className="progress-bar"
                  style={{ width: `${stats.profileCompletion || 0}%` }}
                >
                  {stats.profileCompletion || 0}%
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">My Profile Details</h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <p className="text-muted mb-1">Email</p>
                  <h6>{stats.profile?.email}</h6>
                </div>

                <div className="col-md-6">
                  <p className="text-muted mb-1">Phone</p>
                  <h6>{stats.profile?.phone || "N/A"}</h6>
                </div>

                <div className="col-md-6">
                  <p className="text-muted mb-1">Salary</p>
                  <h6>{formatCurrency(stats.profile?.salary)}</h6>
                </div>

                <div className="col-md-6">
                  <p className="text-muted mb-1">Status</p>
                  <span
                    className={`badge ${
                      stats.profile?.status === "inactive"
                        ? "bg-danger"
                        : "bg-success"
                    }`}
                  >
                    {stats.profile?.status === "inactive"
                      ? "Inactive"
                      : "Active"}
                  </span>
                </div>

                <div className="col-12">
                  <p className="text-muted mb-1">Address</p>
                  <h6>{stats.profile?.address || "N/A"}</h6>
                </div>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">My Skills</h5>

              {stats.skills?.length === 0 ? (
                <p className="text-muted mb-0">No skills assigned</p>
              ) : (
                <div className="d-flex gap-2 flex-wrap">
                  {stats.skills.map((skill, index) => (
                    <span key={index} className="badge bg-success px-3 py-2">
                      {skill.skill_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">My Uploaded Images</h5>

              {stats.images?.length === 0 ? (
                <p className="text-muted mb-0">No images uploaded</p>
              ) : (
                <div className="row g-3">
                  {stats.images.map((img) => (
                    <div className="col-md-3 col-6" key={img.id}>
                      <div
                        className="border rounded shadow-sm overflow-hidden"
                        style={{ cursor: "pointer", height: "140px" }}
                        onClick={() => setSelectedImage(img.image_url || img.url)}
                      >
                        <img
                          src={img.image_url || img.url}
                          alt="Employee"
                          className="img-fluid w-100 h-100"
                          style={{ objectFit: "cover" }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="row g-4 mb-5">
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">👥</div>
                <p className="text-muted mb-1">Total Employees</p>
                <h2>{stats.employees}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">✅</div>
                <p className="text-muted mb-1">Active Employees</p>
                <h2>{stats.activeEmployees}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">⛔</div>
                <p className="text-muted mb-1">Inactive Employees</p>
                <h2>{stats.inactiveEmployees}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">🏢</div>
                <p className="text-muted mb-1">Departments</p>
                <h2>{stats.departments}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">🛠️</div>
                <p className="text-muted mb-1">Skills</p>
                <h2>{stats.skills}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">🖼️</div>
                <p className="text-muted mb-1">Images</p>
                <h2>{stats.images}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">💰</div>
                <p className="text-muted mb-1">Average Salary</p>
                <h2>{formatCurrency(stats.averageSalary)}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">🏆</div>
                <p className="text-muted mb-1">Highest Salary</p>
                <h2>{formatCurrency(stats.highestSalary)}</h2>
              </div>
            </div>
          </div>

          <h4 className="fw-bold mb-3">Analytics</h4>

          <div className="row g-4 mb-5">
            <div className="col-lg-5">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Employees by Department</h5>

                  {employees.length === 0 ? (
                    <p className="text-muted">No employee data available.</p>
                  ) : (
                    <Pie data={departmentChartData} options={chartOptions} />
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-7">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Salary Distribution</h5>

                  {employees.length === 0 ? (
                    <p className="text-muted">No salary data available.</p>
                  ) : (
                    <Bar data={salaryChartData} options={salaryChartOptions} />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-5">
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Recent Employees</h5>

                  {stats.recentEmployees?.length === 0 ? (
                    <p className="text-muted">No recent employees.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table align-middle">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Date</th>
                          </tr>
                        </thead>

                        <tbody>
                          {stats.recentEmployees?.map((emp) => (
                            <tr key={emp.id}>
                              <td>
                                <div className="fw-semibold">{emp.name}</div>
                                <small className="text-muted">
                                  {emp.designation || "N/A"}
                                </small>
                              </td>

                              <td>{emp.department_name || "N/A"}</td>

                              <td>
                                <span
                                  className={`badge ${
                                    emp.status === "inactive"
                                      ? "bg-danger"
                                      : "bg-success"
                                  }`}
                                >
                                  {emp.status === "inactive"
                                    ? "Inactive"
                                    : "Active"}
                                </span>
                              </td>

                              <td>{formatDate(emp.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h5 className="fw-bold mb-3">Recent Activity</h5>

                  {stats.activityLogs?.length === 0 ? (
                    <p className="text-muted">No activity logs yet.</p>
                  ) : (
                    <div className="list-group list-group-flush">
                      {stats.activityLogs?.map((log) => (
                        <div
                          key={log.id}
                          className="list-group-item px-0 border-0 border-bottom"
                        >
                          <div className="d-flex justify-content-between">
                            <strong>{log.action}</strong>
                            <small className="text-muted">
                              {formatDate(log.created_at)}
                            </small>
                          </div>

                          <p className="text-muted mb-1">{log.description}</p>

                          <small className="text-muted">
                            By: {log.user_name || "System"}
                          </small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <h4 className="fw-bold mb-3">Quick Actions</h4>

          <div className="row g-4">
            <div className="col-lg-4 col-md-6">
              <div
                className="action-card"
                onClick={() => navigate("/departments")}
              >
                <div className="icon-box">🏢</div>
                <h5>Departments</h5>
                <p className="text-muted">
                  Create, update and manage departments.
                </p>
                <button className="btn btn-primary w-100">Open</button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="action-card" onClick={() => navigate("/skills")}>
                <div className="icon-box">🛠️</div>
                <h5>Skills</h5>
                <p className="text-muted">
                  Manage technical and professional skills.
                </p>
                <button className="btn btn-success w-100">Open</button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div
                className="action-card"
                onClick={() => navigate("/create-employee")}
              >
                <div className="icon-box">👤</div>
                <h5>Create Employee</h5>
                <p className="text-muted">Add a new employee profile.</p>
                <button className="btn btn-warning w-100">Open</button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div
                className="action-card"
                onClick={() => navigate("/employees")}
              >
                <div className="icon-box">📋</div>
                <h5>Employee List</h5>
                <p className="text-muted">
                  View, edit and manage all employees.
                </p>
                <button className="btn btn-dark w-100">Open</button>
              </div>
            </div>

            <div className="col-lg-4 col-md-6">
              <div className="action-card" onClick={() => navigate("/report")}>
                <div className="icon-box">📊</div>
                <h5>Reports</h5>
                <p className="text-muted">
                  View employee reports and export summaries.
                </p>
                <button className="btn btn-secondary w-100">Open</button>
              </div>
            </div>
          </div>
        </>
      )}
      {selectedImage && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
          tabIndex="-1"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title">Image Preview</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedImage(null)}
                ></button>
              </div>

              <div className="modal-body text-center">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="img-fluid rounded"
                  style={{
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default Dashboard;