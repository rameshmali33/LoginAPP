import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import API from "../services/api";
import Layout from "../components/Layout";

function EmployeeReport() {
  // Tab state
  const [activeTab, setActiveTab] = useState("employees");

  // Employee tab state
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("");

  // Leave and Asset tab states
  const [leaves, setLeaves] = useState([]);
  const [assets, setAssets] = useState([]);
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("");
  const [assetStatusFilter, setAssetStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);

  // Fetch data based on active tab
  useEffect(() => {
    setLoading(true);
    if (activeTab === "employees") {
      fetchEmployees();
      fetchDepartments();
    } else if (activeTab === "leaves") {
      fetchLeaves();
    } else if (activeTab === "assets") {
      fetchAssets();
    }
  }, [activeTab]);

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/reports/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load employees", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      setDepartments(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchLeaves = async () => {
    try {
      const res = await API.get("/reports/leaves");
      setLeaves(res.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load leaves report", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const res = await API.get("/reports/assets");
      setAssets(res.data || []);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load assets report", "error");
    } finally {
      setLoading(false);
    }
  };

  // ========== EMPLOYEE TAB LOGIC ==========
  const filteredEmployees = employees
    .filter((emp) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        emp.name?.toLowerCase().includes(searchText) ||
        emp.email?.toLowerCase().includes(searchText) ||
        emp.designation?.toLowerCase().includes(searchText) ||
        emp.skills?.toLowerCase().includes(searchText) ||
        emp.department_name?.toLowerCase().includes(searchText);

      const matchesDepartment =
        department === "" || emp.department_name === department;

      const matchesStatus =
        statusFilter === "" || emp.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "nameAsc":
          return a.name.localeCompare(b.name);
        case "nameDesc":
          return b.name.localeCompare(a.name);
        case "salaryAsc":
          return Number(a.salary || 0) - Number(b.salary || 0);
        case "salaryDesc":
          return Number(b.salary || 0) - Number(a.salary || 0);
        default:
          return 0;
      }
    });

  const totalImages = employees.reduce(
    (total, emp) => total + Number(emp.image_count || 0),
    0
  );

  const activeEmployees = employees.filter(
    (emp) => emp.status === "active"
  ).length;

  const inactiveEmployees = employees.filter(
    (emp) => emp.status === "inactive"
  ).length;

  // ========== LEAVE TAB LOGIC ==========
  const filteredLeaves = leaves
    .filter((leave) => {
      if (leaveStatusFilter === "") return true;
      return leave.status === leaveStatusFilter;
    });

  const leaveStats = {
    total: leaves.length,
    pending: leaves.filter((l) => l.status === "pending").length,
    approved: leaves.filter((l) => l.status === "approved").length,
    rejected: leaves.filter((l) => l.status === "rejected").length,
  };

  // ========== ASSET TAB LOGIC ==========
  const filteredAssets = assets
    .filter((asset) => {
      if (assetStatusFilter === "") return true;
      return asset.status === assetStatusFilter;
    });

  const assetStats = {
    total: assets.length,
    available: assets.filter((a) => a.status === "available").length,
    allocated: assets.filter((a) => a.status === "allocated").length,
    inactive: assets.filter((a) => a.status === "inactive").length,
  };

  // ========== EXPORT FUNCTIONS ==========
  const exportEmployeesToExcel = () => {
    if (filteredEmployees.length === 0) {
      Swal.fire("No Data", "No employee data to export", "warning");
      return;
    }

    const exportData = filteredEmployees.map((emp) => ({
      ID: emp.id,
      Name: emp.name,
      Email: emp.email,
      Department: emp.department_name || "N/A",
      Phone: emp.phone || "N/A",
      Designation: emp.designation || "N/A",
      Salary: Number(emp.salary || 0),
      Status: emp.status === "inactive" ? "Inactive" : "Active",
      Skills: emp.skills || "No skills",
      Images: emp.image_count || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    worksheet["!cols"] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 30 },
      { wch: 20 },
      { wch: 15 },
      { wch: 22 },
      { wch: 12 },
      { wch: 12 },
      { wch: 35 },
      { wch: 10 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "Employee_Report.xlsx");
    Swal.fire("Exported", "Employee report downloaded successfully", "success");
  };

  const exportEmployeesToCSV = () => {
    if (filteredEmployees.length === 0) {
      Swal.fire("No Data", "No employee data to export", "warning");
      return;
    }

    const exportData = filteredEmployees.map((emp) => ({
      ID: emp.id,
      Name: emp.name,
      Email: emp.email,
      Department: emp.department_name || "N/A",
      Phone: emp.phone || "N/A",
      Designation: emp.designation || "N/A",
      Salary: Number(emp.salary || 0),
      Status: emp.status === "inactive" ? "Inactive" : "Active",
      Skills: emp.skills || "No skills",
      Images: emp.image_count || 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Report");
    const csvBuffer = XLSX.write(workbook, { bookType: "csv", type: "array" });
    const file = new Blob([csvBuffer], { type: "text/csv" });
    saveAs(file, "Employee_Report.csv");
    Swal.fire("Exported", "Employee report downloaded as CSV", "success");
  };

  const exportLeavesToExcel = () => {
    if (filteredLeaves.length === 0) {
      Swal.fire("No Data", "No leave data to export", "warning");
      return;
    }

    const exportData = filteredLeaves.map((leave) => ({
      "Employee Name": leave.employee_name || leave.name || "N/A",
      Department: leave.department_name || "N/A",
      "Leave Type": leave.leave_name || "N/A",
      "From Date": leave.from_date || "N/A",
      "To Date": leave.to_date || "N/A",
      "Total Days": leave.total_days || 0,
      Status: leave.status || "N/A",
      Reason: leave.reason || "N/A",
      "Applied On": leave.created_at ? new Date(leave.created_at).toLocaleDateString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    worksheet["!cols"] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 15 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "Leave_Report.xlsx");
    Swal.fire("Exported", "Leave report downloaded successfully", "success");
  };

  const exportLeavesToCSV = () => {
    if (filteredLeaves.length === 0) {
      Swal.fire("No Data", "No leave data to export", "warning");
      return;
    }

    const exportData = filteredLeaves.map((leave) => ({
      "Employee Name": leave.employee_name || leave.name || "N/A",
      Department: leave.department_name || "N/A",
      "Leave Type": leave.leave_name || "N/A",
      "From Date": leave.from_date || "N/A",
      "To Date": leave.to_date || "N/A",
      "Total Days": leave.total_days || 0,
      Status: leave.status || "N/A",
      Reason: leave.reason || "N/A",
      "Applied On": leave.created_at ? new Date(leave.created_at).toLocaleDateString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Leave Report");
    const csvBuffer = XLSX.write(workbook, { bookType: "csv", type: "array" });
    const file = new Blob([csvBuffer], { type: "text/csv" });
    saveAs(file, "Leave_Report.csv");
    Swal.fire("Exported", "Leave report downloaded as CSV", "success");
  };

  const exportAssetesToExcel = () => {
    if (filteredAssets.length === 0) {
      Swal.fire("No Data", "No asset data to export", "warning");
      return;
    }

    const exportData = filteredAssets.map((asset) => ({
      Code: asset.asset_code || "N/A",
      Name: asset.asset_name || "N/A",
      Type: asset.asset_type || "N/A",
      "Purchase Cost": asset.purchase_cost ? `₹${Number(asset.purchase_cost).toLocaleString()}` : "N/A",
      Status: asset.status || "N/A",
      "Allocated To": asset.allocated_to_name || asset.employee_name || "N/A",
      "Allocated Date": asset.allocated_date ? new Date(asset.allocated_date).toLocaleDateString() : "N/A",
      "Return Date": asset.returned_date ? new Date(asset.returned_date).toLocaleDateString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    worksheet["!cols"] = [
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 25 },
      { wch: 15 },
      { wch: 15 },
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asset Report");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, "Asset_Report.xlsx");
    Swal.fire("Exported", "Asset report downloaded successfully", "success");
  };

  const exportAssetsToCSV = () => {
    if (filteredAssets.length === 0) {
      Swal.fire("No Data", "No asset data to export", "warning");
      return;
    }

    const exportData = filteredAssets.map((asset) => ({
      Code: asset.asset_code || "N/A",
      Name: asset.asset_name || "N/A",
      Type: asset.asset_type || "N/A",
      "Purchase Cost": asset.purchase_cost ? `₹${Number(asset.purchase_cost).toLocaleString()}` : "N/A",
      Status: asset.status || "N/A",
      "Allocated To": asset.allocated_to_name || asset.employee_name || "N/A",
      "Allocated Date": asset.allocated_date ? new Date(asset.allocated_date).toLocaleDateString() : "N/A",
      "Return Date": asset.returned_date ? new Date(asset.returned_date).toLocaleDateString() : "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asset Report");
    const csvBuffer = XLSX.write(workbook, { bookType: "csv", type: "array" });
    const file = new Blob([csvBuffer], { type: "text/csv" });
    saveAs(file, "Asset_Report.csv");
    Swal.fire("Exported", "Asset report downloaded as CSV", "success");
  };

  const handlePrintTab = () => {
    window.print();
  };

  return (
    <Layout title="Reports">
      <style>{`
        @media print {
          .export-buttons { display: none !important; }
          .filter-section { display: none !important; }
          .nav-tabs { display: none !important; }
          .stat-card { page-break-inside: avoid; }
        }
      `}</style>

      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h2 className="fw-bold mb-1">Reports</h2>
            <p className="text-muted mb-0">
              View and export employee, leave, and asset reports.
            </p>
          </div>
        </div>

        {/* Tabs Navigation */}
        <ul className="nav nav-tabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "employees" ? "active" : ""}`}
              onClick={() => setActiveTab("employees")}
              type="button"
            >
              👥 Employees
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "leaves" ? "active" : ""}`}
              onClick={() => setActiveTab("leaves")}
              type="button"
            >
              📋 Leaves
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link ${activeTab === "assets" ? "active" : ""}`}
              onClick={() => setActiveTab("assets")}
              type="button"
            >
              📦 Assets
            </button>
          </li>
        </ul>
      </div>

      {/* ========== EMPLOYEES TAB ========== */}
      {activeTab === "employees" && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">👥</div>
                <p className="text-muted mb-1">Total Employees</p>
                <h2>{employees.length}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">✅</div>
                <p className="text-muted mb-1">Active Employees</p>
                <h2>{activeEmployees}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">⛔</div>
                <p className="text-muted mb-1">Inactive Employees</p>
                <h2>{inactiveEmployees}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">🖼️</div>
                <p className="text-muted mb-1">Total Images</p>
                <h2>{totalImages}</h2>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
              <div className="d-flex gap-2 mb-4 flex-wrap export-buttons">
                <button
                  className="btn btn-success"
                  onClick={exportEmployeesToExcel}
                >
                  📊 Export Excel
                </button>
                <button
                  className="btn btn-info text-white"
                  onClick={exportEmployeesToCSV}
                >
                  📄 Export CSV
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrintTab}
                >
                  🖨️ Print
                </button>
              </div>

              <div className="row g-3 mb-4 filter-section">
                <div className="col-lg-4">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Search by name, email, designation..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="col-lg-3">
                  <select
                    className="form-select form-select-lg"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                  >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.department_name}>
                        {dept.department_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-lg-2">
                  <select
                    className="form-select form-select-lg"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="col-lg-3">
                  <select
                    className="form-select form-select-lg"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="">Default Sorting</option>
                    <option value="nameAsc">Name A-Z</option>
                    <option value="nameDesc">Name Z-A</option>
                    <option value="salaryAsc">Salary Low-High</option>
                    <option value="salaryDesc">Salary High-Low</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <p className="text-muted mt-3">Loading report...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>ID</th>
                        <th>Employee</th>
                        <th>Email</th>
                        <th>Department</th>
                        <th>Phone</th>
                        <th>Designation</th>
                        <th>Salary</th>
                        <th>Status</th>
                        <th>Skills</th>
                        <th>Images</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredEmployees.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="text-center text-muted py-5">
                            No employees found
                          </td>
                        </tr>
                      ) : (
                        filteredEmployees.map((emp) => (
                          <tr key={emp.id}>
                            <td>{emp.id}</td>
                            <td>
                              <div className="fw-semibold">{emp.name}</div>
                              <small className="text-muted">
                                Employee ID: {emp.id}
                              </small>
                            </td>
                            <td>{emp.email}</td>
                            <td>
                              <span className="badge bg-primary">
                                {emp.department_name || "N/A"}
                              </span>
                            </td>
                            <td>{emp.phone}</td>
                            <td>{emp.designation}</td>
                            <td className="fw-semibold">
                              ₹{Number(emp.salary || 0).toLocaleString()}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  emp.status === "inactive"
                                    ? "bg-danger"
                                    : "bg-success"
                                }`}
                              >
                                {emp.status === "inactive" ? "Inactive" : "Active"}
                              </span>
                            </td>
                            <td>
                              {emp.skills ? (
                                <span className="badge bg-success">
                                  {emp.skills}
                                </span>
                              ) : (
                                <span className="text-muted">No skills</span>
                              )}
                            </td>
                            <td>
                              <span className="badge bg-dark">
                                {emp.image_count || 0}
                              </span>
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
        </>
      )}

      {/* ========== LEAVES TAB ========== */}
      {activeTab === "leaves" && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">📋</div>
                <p className="text-muted mb-1">Total Applications</p>
                <h2>{leaveStats.total}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">⏳</div>
                <p className="text-muted mb-1">Pending</p>
                <h2>{leaveStats.pending}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">✅</div>
                <p className="text-muted mb-1">Approved</p>
                <h2>{leaveStats.approved}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">❌</div>
                <p className="text-muted mb-1">Rejected</p>
                <h2>{leaveStats.rejected}</h2>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex gap-2 mb-4 flex-wrap export-buttons">
                <button
                  className="btn btn-success"
                  onClick={exportLeavesToExcel}
                >
                  📊 Export Excel
                </button>
                <button
                  className="btn btn-info text-white"
                  onClick={exportLeavesToCSV}
                >
                  📄 Export CSV
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrintTab}
                >
                  🖨️ Print
                </button>
              </div>

              <div className="mb-4 filter-section">
                <select
                  className="form-select form-select-lg"
                  value={leaveStatusFilter}
                  onChange={(e) => setLeaveStatusFilter(e.target.value)}
                  style={{ maxWidth: "300px" }}
                >
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <p className="text-muted mt-3">Loading leaves...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Employee Name</th>
                        <th>Department</th>
                        <th>Leave Type</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Total Days</th>
                        <th>Status</th>
                        <th>Reason</th>
                        <th>Applied On</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredLeaves.length === 0 ? (
                        <tr>
                          <td colSpan="9" className="text-center text-muted py-5">
                            No leave applications found
                          </td>
                        </tr>
                      ) : (
                        filteredLeaves.map((leave, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">
                              {leave.employee_name || leave.name || "N/A"}
                            </td>
                            <td>
                              <span className="badge bg-primary">
                                {leave.department_name || "N/A"}
                              </span>
                            </td>
                            <td>{leave.leave_name || "N/A"}</td>
                            <td>{leave.from_date || "N/A"}</td>
                            <td>{leave.to_date || "N/A"}</td>
                            <td className="text-center">
                              <strong>{leave.total_days || 0}</strong>
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  leave.status === "pending"
                                    ? "bg-warning"
                                    : leave.status === "approved"
                                    ? "bg-success"
                                    : "bg-danger"
                                }`}
                              >
                                {leave.status || "N/A"}
                              </span>
                            </td>
                            <td>
                              <small>{leave.reason || "N/A"}</small>
                            </td>
                            <td>
                              <small>
                                {leave.created_at
                                  ? new Date(leave.created_at).toLocaleDateString()
                                  : "N/A"}
                              </small>
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
        </>
      )}

      {/* ========== ASSETS TAB ========== */}
      {activeTab === "assets" && (
        <>
          <div className="row g-4 mb-4">
            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">📦</div>
                <p className="text-muted mb-1">Total Assets</p>
                <h2>{assetStats.total}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">✅</div>
                <p className="text-muted mb-1">Available</p>
                <h2>{assetStats.available}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">✋</div>
                <p className="text-muted mb-1">Allocated</p>
                <h2>{assetStats.allocated}</h2>
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <div className="stat-card">
                <div className="icon-box">⛔</div>
                <p className="text-muted mb-1">Inactive</p>
                <h2>{assetStats.inactive}</h2>
              </div>
            </div>
          </div>

          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex gap-2 mb-4 flex-wrap export-buttons">
                <button
                  className="btn btn-success"
                  onClick={exportAssetesToExcel}
                >
                  📊 Export Excel
                </button>
                <button
                  className="btn btn-info text-white"
                  onClick={exportAssetsToCSV}
                >
                  📄 Export CSV
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handlePrintTab}
                >
                  🖨️ Print
                </button>
              </div>

              <div className="mb-4 filter-section">
                <select
                  className="form-select form-select-lg"
                  value={assetStatusFilter}
                  onChange={(e) => setAssetStatusFilter(e.target.value)}
                  style={{ maxWidth: "300px" }}
                >
                  <option value="">All Status</option>
                  <option value="available">Available</option>
                  <option value="allocated">Allocated</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary"></div>
                  <p className="text-muted mt-3">Loading assets...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Asset Code</th>
                        <th>Asset Name</th>
                        <th>Type</th>
                        <th>Purchase Cost</th>
                        <th>Status</th>
                        <th>Allocated To</th>
                        <th>Allocated Date</th>
                        <th>Return Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredAssets.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-5">
                            No assets found
                          </td>
                        </tr>
                      ) : (
                        filteredAssets.map((asset, idx) => (
                          <tr key={idx}>
                            <td className="fw-semibold">
                              {asset.asset_code || "N/A"}
                            </td>
                            <td>{asset.asset_name || "N/A"}</td>
                            <td>
                              <span className="badge bg-info">
                                {asset.asset_type || "N/A"}
                              </span>
                            </td>
                            <td>
                              {asset.purchase_cost
                                ? `₹${Number(asset.purchase_cost).toLocaleString()}`
                                : "N/A"}
                            </td>
                            <td>
                              <span
                                className={`badge ${
                                  asset.status === "available"
                                    ? "bg-success"
                                    : asset.status === "allocated"
                                    ? "bg-warning"
                                    : "bg-danger"
                                }`}
                              >
                                {asset.status || "N/A"}
                              </span>
                            </td>
                            <td>
                              {asset.allocated_to_name ||
                                asset.employee_name ||
                                "Unallocated"}
                            </td>
                            <td>
                              <small>
                                {asset.allocated_date
                                  ? new Date(asset.allocated_date).toLocaleDateString()
                                  : "N/A"}
                              </small>
                            </td>
                            <td>
                              <small>
                                {asset.returned_date
                                  ? new Date(asset.returned_date).toLocaleDateString()
                                  : "N/A"}
                              </small>
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
        </>
      )}
    </Layout>
  );
}

export default EmployeeReport;
