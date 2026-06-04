import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const navigate = useNavigate();

  const fetchEmployees = async () => {
    try {
      const res = await API.get("/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error("Employee List Error:", error);
      alert("Error loading employees");
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmDelete) return;

    try {
      const res = await API.delete(`/employees/${id}`);

      alert(res.data.message);

      fetchEmployees();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error deleting employee"
      );
    }
  };

  return (
    <>
      <Navbar />

      <div className="container-fluid mt-4 px-4">
        <div className="card shadow p-4">
          <h2 className="text-center mb-4">
            Employee List
          </h2>

          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle text-center">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      No employees found
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>{emp.id}</td>
                      <td>{emp.name}</td>
                      <td>{emp.email}</td>
                      <td>{emp.department_name}</td>
                      <td>{emp.phone}</td>
                      <td>{emp.designation}</td>
                      <td>
                        ₹{Number(emp.salary).toLocaleString()}
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm me-2"
                          onClick={() =>
                            navigate(`/assign-skills/${emp.id}`)
                          }
                        >
                          Skills
                        </button>

                        <button
                          className="btn btn-info btn-sm me-2"
                          onClick={() =>
                            navigate(`/upload-images/${emp.id}`)
                          }
                        >
                          Upload
                        </button>
                        
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() =>
                            navigate(`/edit-employee/${emp.id}`)
                          }
                        >
                          Edit
                        </button>

                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleDelete(emp.id)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </>
  );
}

export default EmployeeList;