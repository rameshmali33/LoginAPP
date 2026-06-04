import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    department_id: "",
    phone: "",
    address: "",
    designation: "",
    salary: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const deptRes = await API.get("/departments");
        setDepartments(deptRes.data);

        const empRes = await API.get(`/employees/${id}`);

        setForm({
          department_id: empRes.data.department_id || "",
          phone: empRes.data.phone || "",
          address: empRes.data.address || "",
          designation: empRes.data.designation || "",
          salary: empRes.data.salary || "",
        });
      } catch (error) {
        alert("Error loading employee");
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.put(`/employees/${id}`, form);

      alert(res.data.message);

      navigate("/employees");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error updating employee"
      );
    }
  };

  return (
    <>
      <Navbar />

      <div className="container mt-4">
        <div
          className="card shadow p-4 mx-auto"
          style={{ maxWidth: "700px" }}
        >
          <h2 className="text-center mb-4">
            Edit Employee
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">
                Department
              </label>

              <select
                name="department_id"
                className="form-control"
                value={form.department_id}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Department
                </option>

                {departments.map((dept) => (
                  <option
                    key={dept.id}
                    value={dept.id}
                  >
                    {dept.department_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">
                Phone
              </label>

              <input
                type="text"
                name="phone"
                className="form-control"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Address
              </label>

              <textarea
                name="address"
                className="form-control"
                value={form.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Designation
              </label>

              <input
                type="text"
                name="designation"
                className="form-control"
                value={form.designation}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">
                Salary
              </label>

              <input
                type="number"
                name="salary"
                className="form-control"
                value={form.salary}
                onChange={handleChange}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-success w-100"
            >
              Update Employee
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default EditEmployee;