import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const employeesPerPage = 10;

  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await API.get("/employees");
      setEmployees(res.data);
    } catch (error) {
      Swal.fire("Error", "Error loading employees", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, departmentFilter, statusFilter, sortBy]);

  const departments = [
    ...new Set(employees.map((emp) => emp.department_name).filter(Boolean)),
  ];

  const filteredEmployees = employees
    .filter((emp) => {
      const keyword = search.toLowerCase();

      const matchesSearch =
        emp.name?.toLowerCase().includes(keyword) ||
        emp.email?.toLowerCase().includes(keyword) ||
        emp.department_name?.toLowerCase().includes(keyword) ||
        emp.designation?.toLowerCase().includes(keyword);

      const matchesDepartment =
        departmentFilter === "" || emp.department_name === departmentFilter;

      const matchesStatus = statusFilter === "" || emp.status === statusFilter;

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

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter((emp) => emp.status === "active").length;
  const inactiveEmployees = employees.filter(
    (emp) => emp.status === "inactive"
  ).length;

  const averageSalary =
    employees.length > 0
      ? Math.round(
          employees.reduce((total, emp) => total + Number(emp.salary || 0), 0) /
            employees.length
        )
      : 0;

  const handleStatusChange = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";

    try {
      const result = await Swal.fire({
        title: "Change Status?",
        text: `Do you want to mark this employee as ${newStatus}?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, Update",
      });

      if (!result.isConfirmed) return;

      await API.patch(`/employees/${id}/status`, {
        status: newStatus,
      });

      Swal.fire("Updated", "Employee status updated successfully", "success");
      fetchEmployees();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error updating status",
        "error"
      );
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Employee?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await API.delete(`/employees/${id}`);
      Swal.fire("Deleted", res.data.message, "success");
      fetchEmployees();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error deleting employee",
        "error"
      );
    }
  };

  const totalPages = Math.ceil(filteredEmployees.length / employeesPerPage);

  const indexOfLastEmployee = currentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;

  const currentEmployees = filteredEmployees.slice(
    indexOfFirstEmployee,
    indexOfLastEmployee
  );

  return (
    <Layout title="Employee List">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Employees</h2>
          <p className="text-muted mb-0">
            Search, filter, sort and manage employee profiles.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => navigate("/create-employee")}
        >
          + Add Employee
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="icon-box">👥</div>
            <p className="text-muted mb-1">Total Employees</p>
            <h2>{totalEmployees}</h2>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="icon-box">✅</div>
            <p className="text-muted mb-1">Active</p>
            <h2>{activeEmployees}</h2>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="icon-box">⛔</div>
            <p className="text-muted mb-1">Inactive</p>
            <h2>{inactiveEmployees}</h2>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="icon-box">💰</div>
            <p className="text-muted mb-1">Average Salary</p>
            <h2>₹{averageSalary.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="row g-3 mb-4">
            <div className="col-lg-4">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, department, designation..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-lg-3">
              <select
                className="form-select"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
              >
                <option value="">All Departments</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-lg-2">
              <select
                className="form-select"
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
                className="form-select"
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
              <p className="text-muted mt-3">Loading employees...</p>
            </div>
          ) : (
            <>
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
                      <th className="text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {currentEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="text-center text-muted py-5">
                          No employees found
                        </td>
                      </tr>
                    ) : (
                      currentEmployees.map((emp) => (
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

                          <td className="text-center">
                            <div className="dropdown">
                              <button
                                className="btn btn-light btn-sm border shadow-sm dropdown-toggle"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                Actions
                              </button>

                              <ul className="dropdown-menu dropdown-menu-end shadow border-0">
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => navigate(`/employees/${emp.id}`)}
                                  >
                                    👁️ View Profile
                                  </button>
                                </li>

                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() =>
                                      navigate(`/assign-skills/${emp.id}`)
                                    }
                                  >
                                    🛠️ Assign Skills
                                  </button>
                                </li>

                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() =>
                                      navigate(`/upload-images/${emp.id}`)
                                    }
                                  >
                                    🖼️ Upload Images
                                  </button>
                                </li>

                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() =>
                                      navigate(`/edit-employee/${emp.id}`)
                                    }
                                  >
                                    ✏️ Edit Employee
                                  </button>
                                </li>

                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() =>
                                      handleStatusChange(emp.id, emp.status)
                                    }
                                  >
                                    {emp.status === "inactive"
                                      ? "✅ Activate"
                                      : "⛔ Deactivate"}
                                  </button>
                                </li>

                                <li>
                                  <hr className="dropdown-divider" />
                                </li>

                                <li>
                                  <button
                                    className="dropdown-item text-danger"
                                    onClick={() => handleDelete(emp.id)}
                                  >
                                    🗑️ Delete Employee
                                  </button>
                                </li>
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {filteredEmployees.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4 flex-wrap gap-3">
                  <p className="text-muted mb-0">
                    Showing {indexOfFirstEmployee + 1} to{" "}
                    {Math.min(indexOfLastEmployee, filteredEmployees.length)} of{" "}
                    {filteredEmployees.length} employees
                  </p>

                  <nav>
                    <ul className="pagination mb-0">
                      <li
                        className={`page-item ${
                          currentPage === 1 ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                        >
                          Previous
                        </button>
                      </li>

                      {[...Array(totalPages)].map((_, index) => (
                        <li
                          key={index + 1}
                          className={`page-item ${
                            currentPage === index + 1 ? "active" : ""
                          }`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setCurrentPage(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}

                      <li
                        className={`page-item ${
                          currentPage === totalPages ? "disabled" : ""
                        }`}
                      >
                        <button
                          className="page-link"
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default EmployeeList;