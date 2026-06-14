import { useEffect, useMemo, useState } from "react";
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
import { Bar, Doughnut } from "react-chartjs-2";
import {
  FaBriefcase,
  FaBuilding,
  FaChartLine,
  FaCheckCircle,
  FaFileAlt,
  FaMoneyBillWave,
  FaPlus,
  FaTools,
  FaUserClock,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";
import API from "../services/api";
import Layout from "../components/Layout";
import { resolveImageUrl } from "../utils/imageUrls";
import "./Dashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

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
        setEmployees(empRes.data?.data ?? empRes.data ?? []);
      }
    } catch (error) {
      console.error("Dashboard Error:", error);
      if (error.response?.data) {
        setStats(error.response.data);
      } else {
        Swal.fire("Error", "Error loading dashboard data", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    Number(amount || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "-";

  const adminAnalytics = useMemo(() => {
    const departmentCounts = employees.reduce((acc, emp) => {
      const dept = emp.department_name || "Unassigned";
      acc[dept] = (acc[dept] || 0) + 1;
      return acc;
    }, {});

    const salaryBands = {
      "0-25k": 0,
      "25k-50k": 0,
      "50k-75k": 0,
      "75k-100k": 0,
      "100k+": 0,
    };

    employees.forEach((emp) => {
      const salary = Number(emp.salary || 0);
      if (salary < 25000) salaryBands["0-25k"] += 1;
      else if (salary < 50000) salaryBands["25k-50k"] += 1;
      else if (salary < 75000) salaryBands["50k-75k"] += 1;
      else if (salary < 100000) salaryBands["75k-100k"] += 1;
      else salaryBands["100k+"] += 1;
    });

    const topPaidEmployees = [...employees]
      .sort((a, b) => Number(b.salary || 0) - Number(a.salary || 0))
      .slice(0, 8);

    const employeeTotal = employees.length || Number(stats?.employees || 0);
    const activeTotal = employees.length
      ? employees.filter((emp) => emp.status === "active").length
      : Number(stats?.activeEmployees || 0);
    const inactiveTotal = employees.length
      ? employees.filter((emp) => emp.status === "inactive").length
      : Number(stats?.inactiveEmployees || 0);
    const salaries = employees.map((emp) => Number(emp.salary || 0));
    const averageSalary = salaries.length
      ? Math.round(salaries.reduce((total, salary) => total + salary, 0) / salaries.length)
      : Number(stats?.averageSalary || 0);
    const highestSalary = salaries.length
      ? Math.max(...salaries)
      : Number(stats?.highestSalary || 0);
    const statusCounts = {
      Active: activeTotal,
      Inactive: inactiveTotal,
    };

    return {
      departmentCounts,
      salaryBands,
      statusCounts,
      topPaidEmployees,
      employeeTotal,
      activeTotal,
      inactiveTotal,
      averageSalary,
      highestSalary,
    };
  }, [employees, stats]);

  const chartPalette = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#7c3aed", "#0891b2", "#db2777"];

  const baseChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          boxWidth: 10,
          usePointStyle: true,
        },
      },
    },
  };

  const axisChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      x: {
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        grid: { color: "#eef2f7" },
      },
    },
  };

  if (loading) {
    return (
      <Layout title="Dashboard">
        <div className="dashboard-loading">
          <div className="spinner-border text-primary"></div>
          <p>Loading dashboard...</p>
        </div>
      </Layout>
    );
  }

  if (!stats) {
    return (
      <Layout title="Dashboard">
        <div className="empty-state-panel">
          <h3>No Dashboard Data</h3>
          <p>Please try refreshing the page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <div className="dashboard-shell">
        <div className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">Overview</p>
            <h2>Welcome, {user.name || "User"}</h2>
            <p>
              {stats.dashboardType === "admin"
                ? "Monitor workforce, payroll signals, profile coverage, and operational activity from one place."
                : stats.dashboardType === "unlinked_employee"
                ? "Your account is active, but your employee profile is not linked yet."
                : "Track your profile, skills, uploaded records, and employment details."}
            </p>
          </div>

          {stats.dashboardType === "admin" && (
            <div className="dashboard-header-actions">
              <button className="btn btn-primary" onClick={() => navigate("/create-employee")}>
                <FaUserPlus className="me-2" /> Add Employee
              </button>
              <button className="btn btn-outline-primary" onClick={() => navigate("/report")}>
                <FaFileAlt className="me-2" /> Reports
              </button>
            </div>
          )}
        </div>

        {stats.dashboardType === "unlinked_employee" ? (
          <div className="empty-state-panel">
            <FaUsers className="empty-state-icon" />
            <h3>Profile Not Linked</h3>
            <p>{stats.message}</p>
            <button className="btn btn-primary mt-2" onClick={() => navigate("/request-profile-link")}>
              Request Profile Link
            </button>
          </div>
        ) : stats.dashboardType === "employee" ? (
          <EmployeeDashboard
            stats={stats}
            formatCurrency={formatCurrency}
            setSelectedImage={setSelectedImage}
          />
        ) : (
          <>
            <div className="metric-grid">
              <MetricCard icon={<FaUsers />} label="Total Employees" value={adminAnalytics.employeeTotal} tone="blue" />
              <MetricCard icon={<FaCheckCircle />} label="Active Employees" value={adminAnalytics.activeTotal} tone="green" />
              <MetricCard icon={<FaBuilding />} label="Departments" value={stats.departments} tone="amber" />
              <MetricCard icon={<FaTools />} label="Skills Catalog" value={stats.skills} tone="violet" />
              <MetricCard icon={<FaMoneyBillWave />} label="Average Salary" value={formatCurrency(adminAnalytics.averageSalary)} tone="cyan" />
              <MetricCard icon={<FaChartLine />} label="Highest Salary" value={formatCurrency(adminAnalytics.highestSalary)} tone="rose" />
              <MetricCard icon={<FaBriefcase />} label="With Skills" value={stats.employeesWithSkills} tone="slate" />
              <MetricCard icon={<FaFileAlt />} label="Profile Images" value={stats.images} tone="indigo" />
            </div>

            <div className="row g-4">
              <div className="col-xl-4">
                <DashboardPanel title="Workforce Status">
                  <div className="chart-box">
                    <Doughnut
                      data={{
                        labels: Object.keys(adminAnalytics.statusCounts),
                        datasets: [
                          {
                            data: Object.values(adminAnalytics.statusCounts),
                            backgroundColor: ["#10b981", "#ef4444"],
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={baseChartOptions}
                    />
                  </div>
                </DashboardPanel>
              </div>

              <div className="col-xl-4">
                <DashboardPanel title="Employees by Department">
                  <div className="chart-box">
                    <Doughnut
                      data={{
                        labels: Object.keys(adminAnalytics.departmentCounts),
                        datasets: [
                          {
                            data: Object.values(adminAnalytics.departmentCounts),
                            backgroundColor: chartPalette,
                            borderWidth: 0,
                          },
                        ],
                      }}
                      options={baseChartOptions}
                    />
                  </div>
                </DashboardPanel>
              </div>

              <div className="col-xl-4">
                <DashboardPanel title="Salary Bands">
                  <div className="chart-box">
                    <Bar
                      data={{
                        labels: Object.keys(adminAnalytics.salaryBands),
                        datasets: [
                          {
                            data: Object.values(adminAnalytics.salaryBands),
                            backgroundColor: "#2563eb",
                            borderRadius: 8,
                          },
                        ],
                      }}
                      options={axisChartOptions}
                    />
                  </div>
                </DashboardPanel>
              </div>
            </div>

            <div className="row g-4 mt-1">
              <div className="col-xl-7">
                <DashboardPanel title="Top Compensation">
                  <div className="chart-box chart-box-wide">
                    <Bar
                      data={{
                        labels: adminAnalytics.topPaidEmployees.map((emp) => emp.name),
                        datasets: [
                          {
                            label: "Salary",
                            data: adminAnalytics.topPaidEmployees.map((emp) => Number(emp.salary || 0)),
                            backgroundColor: "#10b981",
                            borderRadius: 8,
                          },
                        ],
                      }}
                      options={axisChartOptions}
                    />
                  </div>
                </DashboardPanel>
              </div>

              <div className="col-xl-5">
                <DashboardPanel title="Quick Actions">
                  <div className="quick-action-grid">
                    <QuickAction icon={<FaPlus />} title="Create Employee" to="/create-employee" navigate={navigate} />
                    <QuickAction icon={<FaUsers />} title="Employees" to="/employees" navigate={navigate} />
                    <QuickAction icon={<FaUserClock />} title="Attendance" to="/attendance" navigate={navigate} />
                    <QuickAction icon={<FaMoneyBillWave />} title="Payroll" to="/payroll" navigate={navigate} />
                    <QuickAction icon={<FaBuilding />} title="Departments" to="/departments" navigate={navigate} />
                    <QuickAction icon={<FaFileAlt />} title="Reports" to="/report" navigate={navigate} />
                  </div>
                </DashboardPanel>
              </div>
            </div>

            <div className="row g-4 mt-1">
              <div className="col-xl-6">
                <DashboardPanel title="Recent Employees">
                  <div className="table-responsive">
                    <table className="table dashboard-table align-middle">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th>Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentEmployees?.map((emp) => (
                          <tr key={emp.id}>
                            <td>
                              <div className="fw-semibold">{emp.name}</div>
                              <small className="text-muted">{emp.designation || "N/A"}</small>
                            </td>
                            <td>{emp.department_name || "N/A"}</td>
                            <td>
                              <span className={`badge ${emp.status === "inactive" ? "bg-danger" : "bg-success"}`}>
                                {emp.status === "inactive" ? "Inactive" : "Active"}
                              </span>
                            </td>
                            <td>{formatDate(emp.created_at)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </DashboardPanel>
              </div>

              <div className="col-xl-6">
                <DashboardPanel title="Recent Activity">
                  <div className="activity-list">
                    {stats.activityLogs?.length ? (
                      stats.activityLogs.map((log) => (
                        <div className="activity-item" key={log.id}>
                          <div>
                            <strong>{log.action}</strong>
                            <p>{log.description}</p>
                            <span>By {log.user_name || "System"}</span>
                          </div>
                          <small>{formatDate(log.created_at)}</small>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted mb-0">No activity logs yet.</p>
                    )}
                  </div>
                </DashboardPanel>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedImage && (
        <div
          className="modal fade show"
          style={{ display: "block", backgroundColor: "rgba(0,0,0,0.7)" }}
          tabIndex="-1"
          onClick={() => setSelectedImage(null)}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title">Image Preview</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedImage(null)}></button>
              </div>
              <div className="modal-body text-center">
                <img src={selectedImage} alt="Preview" className="img-fluid rounded" style={{ maxHeight: "70vh", objectFit: "contain" }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function MetricCard({ icon, label, value, tone }) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <div className="metric-icon">{icon}</div>
      <div>
        <p>{label}</p>
        <h3>{value}</h3>
      </div>
    </div>
  );
}

function DashboardPanel({ title, children }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-panel-header">
        <h5>{title}</h5>
      </div>
      <div className="dashboard-panel-body">{children}</div>
    </section>
  );
}

function QuickAction({ icon, title, to, navigate }) {
  return (
    <button type="button" className="quick-action" onClick={() => navigate(to)}>
      <span>{icon}</span>
      <strong>{title}</strong>
    </button>
  );
}

function EmployeeDashboard({ stats, formatCurrency, setSelectedImage }) {
  return (
    <>
      <div className="metric-grid employee-metric-grid">
        <MetricCard icon={<FaUsers />} label="Name" value={stats.profile?.name || "-"} tone="blue" />
        <MetricCard icon={<FaBuilding />} label="Department" value={stats.profile?.department_name || "N/A"} tone="green" />
        <MetricCard icon={<FaBriefcase />} label="Designation" value={stats.profile?.designation || "N/A"} tone="amber" />
        <MetricCard icon={<FaChartLine />} label="Profile Completion" value={`${stats.profileCompletion || 0}%`} tone="violet" />
      </div>

      <DashboardPanel title="Profile Completion">
        <div className="progress professional-progress">
          <div className="progress-bar" style={{ width: `${stats.profileCompletion || 0}%` }}>
            {stats.profileCompletion || 0}%
          </div>
        </div>
      </DashboardPanel>

      <div className="row g-4">
        <div className="col-lg-7">
          <DashboardPanel title="Profile Details">
            <div className="profile-detail-grid">
              <div><span>Email</span><strong>{stats.profile?.email}</strong></div>
              <div><span>Phone</span><strong>{stats.profile?.phone || "N/A"}</strong></div>
              <div><span>Salary</span><strong>{formatCurrency(stats.profile?.salary)}</strong></div>
              <div><span>Status</span><strong>{stats.profile?.status === "inactive" ? "Inactive" : "Active"}</strong></div>
              <div className="profile-detail-wide"><span>Address</span><strong>{stats.profile?.address || "N/A"}</strong></div>
            </div>
          </DashboardPanel>
        </div>

        <div className="col-lg-5">
          <DashboardPanel title="Skills">
            {stats.skills?.length === 0 ? (
              <p className="text-muted mb-0">No skills assigned</p>
            ) : (
              <div className="skill-chip-list">
                {stats.skills.map((skill, index) => (
                  <span key={index}>{skill.skill_name}</span>
                ))}
              </div>
            )}
          </DashboardPanel>
        </div>
      </div>

      <DashboardPanel title="Uploaded Images">
        {stats.images?.length === 0 ? (
          <p className="text-muted mb-0">No images uploaded</p>
        ) : (
          <div className="employee-image-grid">
            {stats.images.map((img) => (
              <button type="button" key={img.id} onClick={() => setSelectedImage(resolveImageUrl(img))}>
                <img src={resolveImageUrl(img)} alt="Employee" />
              </button>
            ))}
          </div>
        )}
      </DashboardPanel>
    </>
  );
}

export default Dashboard;
