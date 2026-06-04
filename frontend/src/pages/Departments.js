import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

function Departments() {
  const [departments, setDepartments] = useState([]);
  const [departmentName, setDepartmentName] = useState("");

  const fetchDepartments = async () => {
    try {
      const res = await API.get("/departments");
      setDepartments(res.data);
    } catch (error) {
      console.error(error);
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

      alert("Department Added");

      setDepartmentName("");

      fetchDepartments();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error adding department"
      );
    }
  };

  return (
    <>
        <Navbar />  
        <div className="container mt-4">
        <div className="card shadow p-4">
            <h2 className="text-center mb-4">
            Department Master
            </h2>

            <form onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-md-9">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Department Name"
                    value={departmentName}
                    onChange={(e) =>
                    setDepartmentName(
                        e.target.value
                    )
                    }
                    required
                />
                </div>

                <div className="col-md-3">
                <button
                    type="submit"
                    className="btn btn-primary w-100"
                >
                    Add Department
                </button>
                </div>
            </div>
            </form>

            <hr />

            <table className="table table-bordered table-striped">
            <thead>
                <tr>
                <th>ID</th>
                <th>Department Name</th>
                </tr>
            </thead>

            <tbody>
                {departments.map((dept) => (
                <tr key={dept.id}>
                    <td>{dept.id}</td>
                    <td>{dept.department_name}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    </>
  );
}

export default Departments;