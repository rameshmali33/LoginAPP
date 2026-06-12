import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import {
  FaClock,
  FaSignInAlt,
  FaSignOutAlt,
  FaHistory,
  FaClipboardList,
  FaEdit,
} from "react-icons/fa";
import api from "../services/api";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";
import Table from "../components/Table";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

function AttendanceManagement() {
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : {};
  const role = (user.role || "").toLowerCase();
  const isLinked = !!user.employee_profile_id;
  const canManage = ["admin", "hr", "manager"].includes(role);
  const canEdit = ["admin", "hr"].includes(role);

  const today = new Date().toISOString().split("T")[0];
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const [activeTab, setActiveTab] = useState("my-attendance");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [myRecords, setMyRecords] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [summary, setSummary] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filters, setFilters] = useState({
    from: monthStart,
    to: today,
    employee_id: "",
    status: "",
  });
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    employee_id: "",
    attendance_date: today,
    clock_in: "",
    clock_out: "",
    break_minutes: 0,
    status: "present",
    notes: "",
  });

  useEffect(() => {
    if (!isLinked && canManage) {
      setActiveTab("team-attendance");
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const requests = [];

      if (isLinked) {
        requests.push(api.get("/attendance/today"));
        requests.push(api.get("/attendance/my", { params: filters }));
      }

      if (canManage) {
        requests.push(api.get("/attendance", { params: filters }));
        requests.push(api.get("/attendance/summary", { params: filters }));
        requests.push(api.get("/employees"));
      }

      const responses = await Promise.all(requests);
      let index = 0;

      if (isLinked) {
        setTodayRecord(responses[index].data.record);
        index += 1;
        setMyRecords(responses[index].data.records || []);
        index += 1;
      }

      if (canManage) {
        setAllRecords(responses[index].data.records || []);
        index += 1;
        setSummary(responses[index].data.summary || []);
        index += 1;
        setEmployees(responses[index].data?.data ?? responses[index].data ?? []);
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not load attendance data", "error");
    } finally {
      setLoading(false);
    }
  };

  const refreshWithFilters = async () => {
    await loadData();
  };

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      await api.post("/attendance/clock-in", {});
      Swal.fire("Success", "Clocked in successfully", "success");
      loadData();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not clock in", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    const { value: breakMinutes } = await Swal.fire({
      title: "Clock Out",
      input: "number",
      inputLabel: "Break minutes",
      inputValue: 0,
      inputAttributes: { min: "0" },
      showCancelButton: true,
    });

    if (breakMinutes === undefined) return;

    try {
      setActionLoading(true);
      await api.post("/attendance/clock-out", {
        break_minutes: parseInt(breakMinutes || 0, 10),
      });
      Swal.fire("Success", "Clocked out successfully", "success");
      loadData();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not clock out", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("/attendance/manual", {
        ...manualForm,
        employee_id: parseInt(manualForm.employee_id, 10),
        break_minutes: parseInt(manualForm.break_minutes || 0, 10),
      });
      Swal.fire("Saved", "Attendance record saved successfully", "success");
      setShowManualModal(false);
      setManualForm({
        employee_id: "",
        attendance_date: today,
        clock_in: "",
        clock_out: "",
        break_minutes: 0,
        status: "present",
        notes: "",
      });
      loadData();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not save attendance", "error");
    }
  };

  const openEditModal = (record = null) => {
    if (record) {
      setManualForm({
        employee_id: record.employee_id,
        attendance_date: toDateInput(record.attendance_date),
        clock_in: toDateTimeInput(record.clock_in),
        clock_out: toDateTimeInput(record.clock_out),
        break_minutes: record.break_minutes || 0,
        status: record.status || "present",
        notes: record.notes || "",
      });
    }
    setShowManualModal(true);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatMinutes = (minutes) => {
    const total = parseInt(minutes || 0, 10);
    const hours = Math.floor(total / 60);
    const mins = total % 60;
    return `${hours}h ${mins}m`;
  };

  const toDateInput = (value) => {
    if (!value) return today;
    return new Date(value).toISOString().split("T")[0];
  };

  const toDateTimeInput = (value) => {
    if (!value) return "";
    const date = new Date(value);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  const statusBadge = (status) => {
    const variants = {
      present: "success",
      late: "warning text-dark",
      half_day: "info",
      absent: "danger",
      leave: "primary",
      holiday: "secondary",
    };
    return <span className={`badge bg-${variants[status] || "secondary"}`}>{status || "not marked"}</span>;
  };

  const renderAttendanceRow = (item) => (
    <tr key={item.id}>
      <td className="fw-semibold">{item.employee_name || "Me"}</td>
      <td>{formatDate(item.attendance_date)}</td>
      <td>{formatTime(item.clock_in)}</td>
      <td>{formatTime(item.clock_out)}</td>
      <td>{formatMinutes(item.work_minutes)}</td>
      <td>{formatMinutes(item.overtime_minutes)}</td>
      <td>{statusBadge(item.status)}</td>
      {canEdit && (
        <td>
          <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(item)}>
            <FaEdit className="me-1" /> Edit
          </button>
        </td>
      )}
    </tr>
  );

  if (loading) {
    return (
      <Layout title="Attendance">
        <Loader message="Loading attendance records..." />
      </Layout>
    );
  }

  return (
    <Layout title="Attendance">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          {isLinked && (
            <button
              className={`btn ${activeTab === "my-attendance" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveTab("my-attendance")}
            >
              <FaHistory className="me-2" /> My Attendance
            </button>
          )}

          {canManage && (
            <>
              <button
                className={`btn ${activeTab === "team-attendance" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("team-attendance")}
              >
                <FaClipboardList className="me-2" /> Team Records
              </button>
              <button
                className={`btn ${activeTab === "summary" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("summary")}
              >
                <FaClock className="me-2" /> Summary
              </button>
            </>
          )}
        </div>

        {canEdit && (
          <Button variant="success" onClick={() => openEditModal()}>
            <FaEdit className="me-2" /> Add Manual Record
          </Button>
        )}
      </div>

      {activeTab === "my-attendance" && (
        <>
          {!isLinked ? (
            <Card title="Account Unlinked">
              <p className="text-muted mb-0">Your account must be linked to an employee profile to use attendance.</p>
            </Card>
          ) : (
            <>
              <Card title="Today">
                <div className="row g-3 align-items-center">
                  <div className="col-lg-8">
                    <div className="d-flex gap-4 flex-wrap">
                      <div>
                        <p className="text-muted mb-1">Status</p>
                        <div>{statusBadge(todayRecord?.status)}</div>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Clock In</p>
                        <h5 className="mb-0">{formatTime(todayRecord?.clock_in)}</h5>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Clock Out</p>
                        <h5 className="mb-0">{formatTime(todayRecord?.clock_out)}</h5>
                      </div>
                      <div>
                        <p className="text-muted mb-1">Worked</p>
                        <h5 className="mb-0">{formatMinutes(todayRecord?.work_minutes)}</h5>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4 text-lg-end">
                    {!todayRecord?.clock_in ? (
                      <Button variant="success" onClick={handleClockIn} loading={actionLoading}>
                        <FaSignInAlt className="me-2" /> Clock In
                      </Button>
                    ) : !todayRecord?.clock_out ? (
                      <Button variant="danger" onClick={handleClockOut} loading={actionLoading}>
                        <FaSignOutAlt className="me-2" /> Clock Out
                      </Button>
                    ) : (
                      <span className="badge bg-success fs-6">Completed for today</span>
                    )}
                  </div>
                </div>
              </Card>

              <Card title="My Attendance History">
                <Table
                  headers={["Employee", "Date", "Clock In", "Clock Out", "Worked", "Overtime", "Status"]}
                  data={myRecords}
                  renderRow={renderAttendanceRow}
                />
              </Card>
            </>
          )}
        </>
      )}

      {activeTab === "team-attendance" && canManage && (
        <>
          <Card title="Filters">
            <div className="row g-3 align-items-end">
              <div className="col-md-3">
                <label className="form-label fw-semibold">From</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.from}
                  onChange={(e) => setFilters({ ...filters, from: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">To</label>
                <input
                  type="date"
                  className="form-control"
                  value={filters.to}
                  onChange={(e) => setFilters({ ...filters, to: e.target.value })}
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fw-semibold">Employee</label>
                <select
                  className="form-select"
                  value={filters.employee_id}
                  onChange={(e) => setFilters({ ...filters, employee_id: e.target.value })}
                >
                  <option value="">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All</option>
                  <option value="present">Present</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="absent">Absent</option>
                  <option value="leave">Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div className="col-md-1">
                <Button className="w-100" onClick={refreshWithFilters}>
                  Go
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Team Attendance Records">
            <Table
              headers={canEdit
                ? ["Employee", "Date", "Clock In", "Clock Out", "Worked", "Overtime", "Status", "Actions"]
                : ["Employee", "Date", "Clock In", "Clock Out", "Worked", "Overtime", "Status"]}
              data={allRecords}
              renderRow={renderAttendanceRow}
            />
          </Card>
        </>
      )}

      {activeTab === "summary" && canManage && (
        <Card title="Attendance Summary">
          <Table
            headers={[
              "Employee",
              "Department",
              "Records",
              "Present",
              "Half Days",
              "Absent",
              "Late",
              "Worked",
              "Overtime",
            ]}
            data={summary}
            renderRow={(item) => (
              <tr key={item.employee_id}>
                <td className="fw-semibold">{item.employee_name}</td>
                <td>{item.department_name || "-"}</td>
                <td>{item.total_records}</td>
                <td>{item.present_days}</td>
                <td>{item.half_days}</td>
                <td>{item.absent_days}</td>
                <td>{item.late_days}</td>
                <td>{formatMinutes(item.total_work_minutes)}</td>
                <td>{formatMinutes(item.total_overtime_minutes)}</td>
              </tr>
            )}
          />
        </Card>
      )}

      <Modal show={showManualModal} onClose={() => setShowManualModal(false)} title="Manual Attendance Record">
        <form onSubmit={handleManualSubmit}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Employee</label>
            <select
              className="form-select"
              value={manualForm.employee_id}
              onChange={(e) => setManualForm({ ...manualForm, employee_id: e.target.value })}
              required
            >
              <option value="">Select Employee</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Date</label>
              <input
                type="date"
                className="form-control"
                value={manualForm.attendance_date}
                onChange={(e) => setManualForm({ ...manualForm, attendance_date: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Status</label>
              <select
                className="form-select"
                value={manualForm.status}
                onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                required
              >
                <option value="present">Present</option>
                <option value="late">Late</option>
                <option value="half_day">Half Day</option>
                <option value="absent">Absent</option>
                <option value="leave">Leave</option>
                <option value="holiday">Holiday</option>
              </select>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Clock In</label>
              <input
                type="datetime-local"
                className="form-control"
                value={manualForm.clock_in}
                onChange={(e) => setManualForm({ ...manualForm, clock_in: e.target.value })}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Clock Out</label>
              <input
                type="datetime-local"
                className="form-control"
                value={manualForm.clock_out}
                onChange={(e) => setManualForm({ ...manualForm, clock_out: e.target.value })}
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label fw-semibold">Break Minutes</label>
            <input
              type="number"
              min="0"
              className="form-control"
              value={manualForm.break_minutes}
              onChange={(e) => setManualForm({ ...manualForm, break_minutes: e.target.value })}
            />
          </div>

          <div className="mb-4">
            <label className="form-label fw-semibold">Notes</label>
            <textarea
              className="form-control"
              rows="3"
              value={manualForm.notes}
              onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => setShowManualModal(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success">
              Save Record
            </Button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}

export default AttendanceManagement;
