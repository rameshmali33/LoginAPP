import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function ProfileLinkRequest() {
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : {};

  const [employees, setEmployees] = useState([]);
  const [employeeProfileId, setEmployeeProfileId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);

      const res = await API.get("/employees");

      const matchedProfiles = res.data.filter(
        (emp) =>
          emp.email?.toLowerCase().trim() === user.email?.toLowerCase().trim()
      );

      setEmployees(matchedProfiles);

      if (matchedProfiles.length === 1) {
        setEmployeeProfileId(matchedProfiles[0].id);
      }
    } catch (error) {
      Swal.fire("Error", "Error loading employee profiles", "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();

    if (!employeeProfileId) {
      Swal.fire("Required", "Employee profile not found", "warning");
      return;
    }

    try {
      setSending(true);

      const res = await API.post("/profile-link-requests", {
        employee_profile_id: employeeProfileId,
        message:
          message.trim() ||
          `Please link my user account (${user.email}) with my employee profile.`,
      });

      await Swal.fire("Submitted", res.data.message, "success");
      setMessage("");
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error submitting request",
        "error"
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <Layout title="Request Profile Link">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Request Profile Link</h2>
        <p className="text-muted mb-0">
          Your account email will be matched with an employee profile.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-3">Checking your employee profile...</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-5">
              <div className="display-1 mb-3">🔍</div>
              <h3 className="fw-bold">No Employee Profile Found</h3>

              <p className="text-muted mb-1">
                We could not find an employee profile for:
              </p>

              <h5 className="fw-bold mb-3">{user.email}</h5>

              <p className="text-muted mb-0">
                Please contact admin to create your employee profile first.
              </p>
            </div>
          ) : (
            <form onSubmit={submitRequest}>
              <div className="alert alert-success">
                Matching employee profile found for your email.
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Matched Employee Profile
                </label>

                <select
                  className="form-select form-select-lg"
                  value={employeeProfileId}
                  onChange={(e) => setEmployeeProfileId(e.target.value)}
                  disabled={employees.length === 1}
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} - {emp.email} - {emp.department_name || "N/A"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Message to Admin
                </label>

                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="Optional message to admin"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-lg px-5"
                disabled={sending}
              >
                {sending ? "Sending..." : "Submit Request"}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ProfileLinkRequest;