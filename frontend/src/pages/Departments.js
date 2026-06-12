import { useEffect, useState } from "react";
import { FaEdit, FaPlus, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const resetForm = () => {
    setDepartmentName("");
    setEditingDepartment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (editingDepartment) {
        await API.put(`/departments/${editingDepartment.id}`, {
          department_name: departmentName,
        });
        Swal.fire("Success", "Department updated successfully", "success");
      } else {
        await API.post("/departments", {
          department_name: departmentName,
        });
        Swal.fire("Success", "Department added successfully", "success");
      }

      resetForm();
      fetchDepartments();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error saving department",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (department) => {
    setEditingDepartment(department);
    setDepartmentName(department.department_name);
  };

  const deleteDepartment = async (department) => {
    const result = await Swal.fire({
      title: "Delete department?",
      text: `This will remove ${department.department_name} if it is not assigned to employees.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      await API.delete(`/departments/${department.id}`);
      Swal.fire("Deleted", "Department deleted successfully", "success");
      if (editingDepartment?.id === department.id) resetForm();
      fetchDepartments();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error deleting department",
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
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h5 className="fw-bold mb-0">
              {editingDepartment ? "Update Department" : "Add New Department"}
            </h5>
            {editingDepartment && (
              <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                <FaTimes className="me-2" />
                Cancel Edit
              </button>
            )}
          </div>

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
                <button type="submit" className="btn btn-primary btn-lg w-100" disabled={saving}>
                  {editingDepartment ? (
                    <>
                      <FaSave className="me-2" />
                      {saving ? "Updating..." : "Update"}
                    </>
                  ) : (
                    <>
                      <FaPlus className="me-2" />
                      {saving ? "Adding..." : "Add"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h5 className="fw-bold mb-0">Department List</h5>
            <span className="text-muted small">{departments.length} total</span>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "90px" }}>S. No.</th>
                    <th style={{ width: "120px" }}>ID</th>
                    <th>Department Name</th>
                    <th className="text-end" style={{ width: "180px" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {departments.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-5">
                        No departments found
                      </td>
                    </tr>
                  ) : (
                    departments.map((dept, index) => (
                      <tr key={dept.id}>
                        <td>{index + 1}</td>
                        <td className="text-muted">#{dept.id}</td>
                        <td className="fw-semibold">{dept.department_name}</td>
                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => startEdit(dept)}
                              title="Edit department"
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => deleteDepartment(dept)}
                              title="Delete department"
                            >
                              <FaTrash />
                            </button>
                          </div>
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

export default Departments;
