import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import API from "../services/api";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";

function CreateEmployee() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : null;

  const [departments, setDepartments] = useState([]);

  const [form, setForm] = useState({
    department_id: "",
    phone: "",
    address: "",
    designation: "",
    salary: "",
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await API.get("/departments");
        setDepartments(res.data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please login first");
      navigate("/login");
      return;
    }

    try {
      const res = await API.post("/employees", {
        user_id: user.id,
        ...form,
      });

      alert(res.data.message);
      navigate("/employees");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error creating employee profile"
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
            Create Employee Profile
            </h2>

            <form onSubmit={handleSubmit}>
            <div className="mb-3">
                <label className="form-label">
                Employee Name
                </label>
                <input
                className="form-control"
                value={user?.name || ""}
                disabled
                />
            </div>

            <div className="mb-3">
                <label className="form-label">
                Email
                </label>
                <input
                className="form-control"
                value={user?.email || ""}
                disabled
                />
            </div>

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
                Create Profile
            </button>
            </form>
        </div>
        </div>
    </>
  );
}

export default CreateEmployee;