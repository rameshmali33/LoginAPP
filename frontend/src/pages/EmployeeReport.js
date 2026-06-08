import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import API from "../services/api";
import Layout from "../components/Layout";

function EmployeeReport() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
    fetchDepartments();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const res = await API.get("/reports/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Error loading report", "error");
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
      Swal.fire("Error", "Error loading departments", "error");
    }
  };

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

  const exportToExcel = () => {
    if (filteredEmployees.length === 0) {
      Swal.fire("No Data", "No employee data available to export", "warning");
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

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const file = new Blob([excelBuffer], {
      type: "application/octet-stream",
    });

    saveAs(file, "Employee_Report.xlsx");

    Swal.fire("Exported", "Employee report downloaded successfully", "success");
  };

  return (
    <Layout title="Employee Report">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Employee Report</h2>
          <p className="text-muted mb-0">
            Search, filter, sort and export complete employee report details.
          </p>
        </div>

        <button className="btn btn-success btn-lg" onClick={exportToExcel}>
          Export Excel
        </button>
      </div>

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

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3 mb-4">
            <div className="col-lg-4">
              <input
                type="text"
                className="form-control form-control-lg"
                placeholder="Search by name, email, designation, department, or skill"
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

          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <p className="text-muted mb-0">
              Showing <strong>{filteredEmployees.length}</strong> of{" "}
              <strong>{employees.length}</strong> employees
            </p>

            {(search || department || statusFilter || sortBy) && (
              <button
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setSearch("");
                  setDepartment("");
                  setStatusFilter("");
                  setSortBy("");
                }}
              >
                Clear Filters
              </button>
            )}
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
                        No matching employees found
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
    </Layout>
  );
}

export default EmployeeReport;