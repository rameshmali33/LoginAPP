import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployee();
  }, []);

  const fetchEmployee = async () => {
    try {
      const res = await API.get(`/employees/${id}`);
      setEmployee(res.data);
    } catch (error) {
      Swal.fire("Error", "Employee not found", "error");
      navigate("/employees");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Employee Details">
        <div className="text-center mt-5">
          <div className="spinner-border text-primary"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Employee Details">
      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">

          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Employee Details</h2>

            <button
              className="btn btn-secondary"
              onClick={() => navigate("/employees")}
            >
              Back
            </button>
          </div>

          <div className="row g-4">

            <div className="col-md-6">
              <label className="text-muted">Name</label>
              <h5>{employee.name}</h5>
            </div>

            <div className="col-md-6">
              <label className="text-muted">Email</label>
              <h5>{employee.email}</h5>
            </div>

            <div className="col-md-6">
              <label className="text-muted">Department</label>
              <h5>{employee.department_name}</h5>
            </div>

            <div className="col-md-6">
              <label className="text-muted">Phone</label>
              <h5>{employee.phone}</h5>
            </div>

            <div className="col-md-6">
              <label className="text-muted">Designation</label>
              <h5>{employee.designation}</h5>
            </div>

            <div className="col-md-6">
              <label className="text-muted">Salary</label>
              <h5>
                ₹{Number(employee.salary || 0).toLocaleString()}
              </h5>
            </div>

            <div className="col-12">
              <label className="text-muted">Address</label>
              <p className="mt-2">{employee.address}</p>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}

export default EmployeeDetails;