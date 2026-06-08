import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await API.get("/departments");
      setDepartments(res.data);
    } catch (error) {
      Swal.fire("Error", "Error loading departments", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/departments", {
        department_name: departmentName,
      });

      Swal.fire("Success", "Department added successfully", "success");

      setDepartmentName("");
      fetchDepartments();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error adding department",
        "error"
      );
    }
  };

  return (
    <Layout title="Departments">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Departments</h2>
        <p className="text-muted mb-0">Create and manage company departments.</p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Add New Department</h5>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-9">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter department name"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <button type="submit" className="btn btn-primary btn-lg w-100">
                  Add Department
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Department List</h5>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : (
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Department Name</th>
                </tr>
              </thead>

              <tbody>
                {departments.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="text-center text-muted py-5">
                      No departments found
                    </td>
                  </tr>
                ) : (
                  departments.map((dept) => (
                    <tr key={dept.id}>
                      <td>{dept.id}</td>
                      <td>
                        <span className="badge bg-primary px-3 py-2">
                          {dept.department_name}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Departments;