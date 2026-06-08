import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function ProfileLinkRequest() {
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
      setEmployees(res.data);
    } catch (error) {
      Swal.fire("Error", "Error loading employee profiles", "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();

    if (!employeeProfileId) {
      Swal.fire("Required", "Please select your employee profile", "warning");
      return;
    }

    try {
      setSending(true);

      const res = await API.post("/profile-link-requests", {
        employee_profile_id: employeeProfileId,
        message,
      });

      await Swal.fire("Submitted", res.data.message, "success");
      setEmployeeProfileId("");
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
          Select your employee profile and send a link request to admin.
        </p>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-3">Loading profiles...</p>
            </div>
          ) : (
            <form onSubmit={submitRequest}>
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Select Employee Profile
                </label>

                <select
                  className="form-select form-select-lg"
                  value={employeeProfileId}
                  onChange={(e) => setEmployeeProfileId(e.target.value)}
                >
                  <option value="">Select your profile</option>

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
                  placeholder="Example: I am Rahul from IT department. Please link my profile."
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