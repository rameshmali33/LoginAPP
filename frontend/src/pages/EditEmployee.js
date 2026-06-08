import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function EditEmployee() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    department_id: "",
    phone: "",
    address: "",
    designation: "",
    salary: "",
    status: "active",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const deptRes = await API.get("/departments");
        setDepartments(deptRes.data);

        const empRes = await API.get(`/employees/${id}`);

        setForm({
          name: empRes.data.name || "",
          email: empRes.data.email || "",
          department_id: empRes.data.department_id || "",
          phone: empRes.data.phone || "",
          address: empRes.data.address || "",
          designation: empRes.data.designation || "",
          salary: empRes.data.salary || "",
          status: empRes.data.status || "active",
        });
      } catch (error) {
        Swal.fire("Error", "Error loading employee", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const numbersOnly = value.replace(/\D/g, "");

      if (numbersOnly.length <= 10) {
        setForm({
          ...form,
          phone: numbersOnly,
        });
      }

      return;
    }

    setForm({
      ...form,
      [name]: value,
    });
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!form.name.trim()) {
      Swal.fire("Invalid Name", "Employee name is required", "warning");
      return false;
    }

    if (!emailRegex.test(form.email.trim())) {
      Swal.fire("Invalid Email", "Please enter a valid email address", "warning");
      return false;
    }

    if (!form.department_id) {
      Swal.fire("Invalid Department", "Please select a department", "warning");
      return false;
    }

    if (!phoneRegex.test(form.phone)) {
      Swal.fire("Invalid Phone", "Phone number must be exactly 10 digits", "warning");
      return false;
    }

    if (!form.designation.trim()) {
      Swal.fire("Invalid Designation", "Designation is required", "warning");
      return false;
    }

    if (Number(form.salary) <= 0) {
      Swal.fire("Invalid Salary", "Salary must be greater than 0", "warning");
      return false;
    }

    if (!form.address.trim()) {
      Swal.fire("Invalid Address", "Address is required", "warning");
      return false;
    }

    if (!["active", "inactive"].includes(form.status)) {
      Swal.fire("Invalid Status", "Please select valid status", "warning");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setSaving(true);

      const res = await API.put(`/employees/${id}`, {
        name: form.name.trim(),
        email: form.email.trim(),
        department_id: form.department_id,
        phone: form.phone,
        address: form.address.trim(),
        designation: form.designation.trim(),
        salary: form.salary,
        status: form.status,
      });

      await Swal.fire("Updated", res.data.message, "success");
      navigate("/employees");
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error updating employee",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Edit Employee">
        <div className="text-center mt-5">
          <div className="spinner-border text-primary"></div>
          <p className="text-muted mt-3">Loading employee details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Edit Employee">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Edit Employee</h2>
        <p className="text-muted mb-0">
          Update employee personal, department, contact, salary and status details.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label fw-semibold">Employee Name</label>
                <input
                  type="text"
                  name="name"
                  className="form-control form-control-lg"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Employee Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-control form-control-lg"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Department</label>
                <select
                  name="department_id"
                  className="form-select form-select-lg"
                  value={form.department_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>

                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.department_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Status</label>
                <select
                  name="status"
                  className="form-select form-select-lg"
                  value={form.status}
                  onChange={handleChange}
                  required
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control form-control-lg"
                  value={form.phone}
                  onChange={handleChange}
                  maxLength="10"
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Designation</label>
                <input
                  type="text"
                  name="designation"
                  className="form-control form-control-lg"
                  value={form.designation}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-md-6">
                <label className="form-label fw-semibold">Salary</label>
                <input
                  type="number"
                  name="salary"
                  className="form-control form-control-lg"
                  value={form.salary}
                  onChange={handleChange}
                  min="1"
                  required
                />
              </div>

              <div className="col-12">
                <label className="form-label fw-semibold">Address</label>
                <textarea
                  rows="4"
                  name="address"
                  className="form-control"
                  value={form.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="col-12 d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-success btn-lg px-5"
                  disabled={saving}
                >
                  {saving ? "Updating..." : "Update Employee"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-lg px-4"
                  onClick={() => navigate("/employees")}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default EditEmployee;