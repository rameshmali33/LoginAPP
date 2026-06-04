import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import API from "../services/api";

function EmployeeReport() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");

  useEffect(() => {
    fetchReport();
    fetchDepartments();
  }, []);

  const fetchReport = async () => {
    try {
      const res = await API.get("/reports/employees");
      setEmployees(res.data);
    } catch (error) {
      console.error(error);
      alert("Error loading report");
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

  const filteredEmployees = employees.filter((emp) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      emp.name?.toLowerCase().includes(searchText) ||
      emp.email?.toLowerCase().includes(searchText) ||
      emp.designation?.toLowerCase().includes(searchText) ||
      emp.skills?.toLowerCase().includes(searchText);

    const matchesDepartment =
      department === "" ||
      emp.department_name === department;

    return matchesSearch && matchesDepartment;
  });

  return (
    <>
      <Navbar />

      <div className="container-fluid mt-4 px-4">
        <div className="card shadow p-4">
          <h2 className="text-center mb-4">
            Employee Report
          </h2>

          <div className="row mb-4">
            <div className="col-md-8 mb-2">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, email, designation, or skill"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />
            </div>

            <div className="col-md-4 mb-2">
              <select
                className="form-control"
                value={department}
                onChange={(e) =>
                  setDepartment(e.target.value)
                }
              >
                <option value="">
                  All Departments
                </option>

                {departments.map((dept) => (
                  <option
                    key={dept.id}
                    value={dept.department_name}
                  >
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered table-hover text-center align-middle">
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Phone</th>
                  <th>Designation</th>
                  <th>Salary</th>
                  <th>Skills</th>
                  <th>Images</th>
                </tr>
              </thead>

              <tbody>
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="9">
                      No matching employees found
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map((emp) => (
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
                      <td>{emp.skills}</td>
                      <td>{emp.image_count}</td>
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

export default EmployeeReport;