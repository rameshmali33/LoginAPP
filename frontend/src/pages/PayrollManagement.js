import React, { useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import Swal from "sweetalert2";
import {
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaPlus,
  FaSyncAlt,
  FaEdit,
} from "react-icons/fa";
import api from "../services/api";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Table from "../components/Table";
import Button from "../components/Button";
import Modal from "../components/Modal";
import Loader from "../components/Loader";

function PayrollManagement() {
  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : {};
  const role = (user.role || "").toLowerCase();
  const isLinked = !!user.employee_profile_id;
  const canManage = ["admin", "hr"].includes(role);
  const today = new Date();
  const currentMonth = today.getMonth() + 1;
  const currentYear = today.getFullYear();

  const [activeTab, setActiveTab] = useState(canManage ? "process" : "my-payslips");
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState("");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [payslips, setPayslips] = useState([]);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [periodForm, setPeriodForm] = useState({
    period_name: `${today.toLocaleString("default", { month: "long" })} ${currentYear}`,
    payroll_month: currentMonth,
    payroll_year: currentYear,
    start_date: `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
    end_date: new Date(currentYear, currentMonth, 0).toISOString().split("T")[0],
    working_days: "",
    notes: "",
  });
  const [generateForm, setGenerateForm] = useState({
    pf_rate: 12,
    esi_rate: 0,
    tds_rate: 0,
    professional_tax: 0,
    overtime_multiplier: 1.5,
    bonus: 0,
    reimbursements: 0,
    loan_deduction: 0,
    other_deductions: 0,
  });

  const loadRecords = useCallback(async (periodId) => {
    if (!periodId) return;
    const response = await api.get(`/payroll/periods/${periodId}/records`);
    setRecords(response.data.records || []);
    setSummary(response.data.summary || null);
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const requests = [];

      if (isLinked) requests.push(api.get("/payroll/my-payslips"));
      if (canManage) requests.push(api.get("/payroll/periods"));

      const responses = await Promise.all(requests);
      let index = 0;

      if (isLinked) {
        setPayslips(responses[index].data.payslips || []);
        index += 1;
      }

      if (canManage) {
        const loadedPeriods = responses[index].data.periods || [];
        setPeriods(loadedPeriods);
        if (loadedPeriods.length > 0) {
          setSelectedPeriodId(loadedPeriods[0].id);
          await loadRecords(loadedPeriods[0].id);
        }
      }
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not load payroll data", "error");
    } finally {
      setLoading(false);
    }
  }, [canManage, isLinked, loadRecords]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const handleCreatePeriod = async (e) => {
    e.preventDefault();
    try {
      await api.post("/payroll/periods", {
        ...periodForm,
        payroll_month: parseInt(periodForm.payroll_month, 10),
        payroll_year: parseInt(periodForm.payroll_year, 10),
        working_days: periodForm.working_days === "" ? undefined : Number(periodForm.working_days),
      });
      Swal.fire("Created", "Payroll period created successfully", "success");
      setShowPeriodModal(false);
      loadInitialData();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not create payroll period", "error");
    }
  };

  const handleGeneratePayroll = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/payroll/periods/${selectedPeriodId}/generate`, toNumberPayload(generateForm));
      Swal.fire("Generated", "Payroll generated from salary and attendance records", "success");
      setShowGenerateModal(false);
      await loadRecords(selectedPeriodId);
      loadInitialData();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not generate payroll", "error");
    }
  };

  const handleUpdateRecord = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/payroll/records/${editingRecord.id}`, toNumberPayload(editingRecord));
      Swal.fire("Updated", "Payroll record updated successfully", "success");
      setShowEditModal(false);
      await loadRecords(selectedPeriodId);
      loadInitialData();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Could not update payroll record", "error");
    }
  };

  const openEditModal = (record) => {
    setEditingRecord({ ...record });
    setShowEditModal(true);
  };

  const toNumberPayload = (data) => {
    const payload = { ...data };
    [
      "pf_rate",
      "esi_rate",
      "tds_rate",
      "professional_tax",
      "overtime_multiplier",
      "bonus",
      "reimbursements",
      "loan_deduction",
      "other_deductions",
      "basic_pay",
      "hra",
      "conveyance_allowance",
      "medical_allowance",
      "special_allowance",
      "overtime_pay",
      "loss_of_pay",
      "provident_fund",
      "esi",
      "tds",
    ].forEach((key) => {
      if (payload[key] !== undefined && payload[key] !== "") payload[key] = Number(payload[key]);
    });
    return payload;
  };

  const money = (value) =>
    Number(value || 0).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    });

  const date = (value) => (value ? new Date(value).toLocaleDateString("en-IN") : "-");

  const badge = (status) => {
    const map = {
      draft: "secondary",
      processed: "info",
      approved: "success",
      paid: "success",
      hold: "warning text-dark",
      locked: "dark",
    };
    return <span className={`badge bg-${map[status] || "secondary"}`}>{status}</span>;
  };

  const numericInput = (label, key, prefix = "") => (
    <div className="col-md-4">
      <label className="form-label fw-semibold">{label}</label>
      <div className="input-group">
        {prefix && <span className="input-group-text">{prefix}</span>}
        <input
          type="number"
          min="0"
          step="0.01"
          className="form-control"
          value={editingRecord?.[key] ?? ""}
          onChange={(e) => setEditingRecord({ ...editingRecord, [key]: e.target.value })}
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout title="Payroll">
        <Loader message="Loading payroll records..." />
      </Layout>
    );
  }

  return (
    <Layout title="Payroll">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex gap-2 flex-wrap">
          {canManage && (
            <button
              className={`btn ${activeTab === "process" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveTab("process")}
            >
              <FaMoneyCheckAlt className="me-2" /> Process Payroll
            </button>
          )}
          {isLinked && (
            <button
              className={`btn ${activeTab === "my-payslips" ? "btn-primary" : "btn-outline-primary"}`}
              onClick={() => setActiveTab("my-payslips")}
            >
              <FaFileInvoiceDollar className="me-2" /> My Payslips
            </button>
          )}
        </div>

        {canManage && activeTab === "process" && (
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={() => setShowPeriodModal(true)}>
              <FaPlus className="me-2" /> New Period
            </Button>
            <Button
              variant="success"
              disabled={!selectedPeriodId}
              onClick={() => setShowGenerateModal(true)}
            >
              <FaSyncAlt className="me-2" /> Generate
            </Button>
          </div>
        )}
      </div>

      {activeTab === "process" && canManage && (
        <>
          <Card title="Payroll Period">
            <div className="row g-3 align-items-end">
              <div className="col-md-5">
                <label className="form-label fw-semibold">Select Period</label>
                <select
                  className="form-select"
                  value={selectedPeriodId}
                  onChange={async (e) => {
                    setSelectedPeriodId(e.target.value);
                    await loadRecords(e.target.value);
                  }}
                >
                  <option value="">Select payroll period</option>
                  {periods.map((period) => (
                    <option key={period.id} value={period.id}>
                      {period.period_name} ({period.payroll_month}/{period.payroll_year})
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-7">
                <div className="d-flex gap-3 flex-wrap">
                  <div>
                    <p className="text-muted mb-1">Employees</p>
                    <h5 className="mb-0">{summary?.employee_count || 0}</h5>
                  </div>
                  <div>
                    <p className="text-muted mb-1">Gross</p>
                    <h5 className="mb-0">{money(summary?.gross_total)}</h5>
                  </div>
                  <div>
                    <p className="text-muted mb-1">Deductions</p>
                    <h5 className="mb-0 text-danger">{money(summary?.deduction_total)}</h5>
                  </div>
                  <div>
                    <p className="text-muted mb-1">TDS</p>
                    <h5 className="mb-0 text-warning">{money(summary?.tds_total)}</h5>
                  </div>
                  <div>
                    <p className="text-muted mb-1">Net Payable</p>
                    <h5 className="mb-0 text-success">{money(summary?.net_total)}</h5>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Payroll Records">
            <Table
              headers={[
                "Employee",
                "Paid Days",
                "Gross",
                "LOP",
                "PF",
                "ESI",
                "PT",
                "TDS",
                "Net Pay",
                "Status",
                "Actions",
              ]}
              data={records}
              renderRow={(record) => (
                <tr key={record.id}>
                  <td>
                    <div className="fw-semibold">{record.employee_name}</div>
                    <small className="text-muted">{record.designation || "-"}</small>
                  </td>
                  <td>{record.paid_days}</td>
                  <td>{money(record.gross_earnings)}</td>
                  <td className="text-danger">{money(record.loss_of_pay)}</td>
                  <td>{money(record.provident_fund)}</td>
                  <td>{money(record.esi)}</td>
                  <td>{money(record.professional_tax)}</td>
                  <td className="text-warning">{money(record.tds)}</td>
                  <td className="fw-bold text-success">{money(record.net_pay)}</td>
                  <td>{badge(record.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(record)}>
                      <FaEdit className="me-1" /> Edit
                    </button>
                  </td>
                </tr>
              )}
            />
          </Card>
        </>
      )}

      {activeTab === "my-payslips" && (
        <Card title="My Payslips">
          {!isLinked ? (
            <p className="text-muted mb-0">Your account must be linked to an employee profile to view payslips.</p>
          ) : (
            <Table
              headers={["Period", "Dates", "Gross", "Deductions", "TDS", "Net Pay", "Status"]}
              data={payslips}
              renderRow={(record) => (
                <tr key={record.id}>
                  <td className="fw-semibold">{record.period_name}</td>
                  <td>
                    {date(record.start_date)} - {date(record.end_date)}
                  </td>
                  <td>{money(record.gross_earnings)}</td>
                  <td className="text-danger">{money(record.total_deductions)}</td>
                  <td className="text-warning">{money(record.tds)}</td>
                  <td className="fw-bold text-success">{money(record.net_pay)}</td>
                  <td>{badge(record.status)}</td>
                </tr>
              )}
            />
          )}
        </Card>
      )}

      <Modal show={showPeriodModal} onClose={() => setShowPeriodModal(false)} title="Create Payroll Period">
        <form onSubmit={handleCreatePeriod}>
          <div className="mb-3">
            <label className="form-label fw-semibold">Period Name</label>
            <input
              className="form-control"
              value={periodForm.period_name}
              onChange={(e) => setPeriodForm({ ...periodForm, period_name: e.target.value })}
              required
            />
          </div>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Month</label>
              <input
                type="number"
                min="1"
                max="12"
                className="form-control"
                value={periodForm.payroll_month}
                onChange={(e) => setPeriodForm({ ...periodForm, payroll_month: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Year</label>
              <input
                type="number"
                min="2000"
                className="form-control"
                value={periodForm.payroll_year}
                onChange={(e) => setPeriodForm({ ...periodForm, payroll_year: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={periodForm.start_date}
                onChange={(e) => setPeriodForm({ ...periodForm, start_date: e.target.value })}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">End Date</label>
              <input
                type="date"
                className="form-control"
                value={periodForm.end_date}
                onChange={(e) => setPeriodForm({ ...periodForm, end_date: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label fw-semibold">Working Days</label>
            <input
              type="number"
              min="0"
              step="0.5"
              className="form-control"
              placeholder="Leave blank to calculate weekdays"
              value={periodForm.working_days}
              onChange={(e) => setPeriodForm({ ...periodForm, working_days: e.target.value })}
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => setShowPeriodModal(false)}>Cancel</Button>
            <Button type="submit" variant="success">Create Period</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showGenerateModal} onClose={() => setShowGenerateModal(false)} title="Generate Payroll">
        <form onSubmit={handleGeneratePayroll}>
          <div className="row g-3 mb-3">
            {[
              ["PF Rate", "pf_rate", "%"],
              ["ESI Rate", "esi_rate", "%"],
              ["TDS Rate", "tds_rate", "%"],
              ["Professional Tax", "professional_tax", "Rs"],
              ["Overtime Multiplier", "overtime_multiplier", "x"],
              ["Bonus", "bonus", "Rs"],
              ["Reimbursements", "reimbursements", "Rs"],
              ["Loan Deduction", "loan_deduction", "Rs"],
              ["Other Deductions", "other_deductions", "Rs"],
            ].map(([label, key, suffix]) => (
              <div className="col-md-4" key={key}>
                <label className="form-label fw-semibold">{label}</label>
                <div className="input-group">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={generateForm[key]}
                    onChange={(e) => setGenerateForm({ ...generateForm, [key]: e.target.value })}
                  />
                  <span className="input-group-text">{suffix}</span>
                </div>
              </div>
            ))}
          </div>
          <p className="small text-muted">
            TDS and statutory deductions should be reviewed by HR/accounts before approving payroll.
          </p>
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={() => setShowGenerateModal(false)}>Cancel</Button>
            <Button type="submit" variant="success">Generate Payroll</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Payroll Record">
        {editingRecord && (
          <form onSubmit={handleUpdateRecord}>
            <h6 className="fw-bold mb-3">Earnings</h6>
            <div className="row g-3 mb-4">
              {numericInput("Basic Pay", "basic_pay", "Rs")}
              {numericInput("HRA", "hra", "Rs")}
              {numericInput("Conveyance", "conveyance_allowance", "Rs")}
              {numericInput("Medical", "medical_allowance", "Rs")}
              {numericInput("Special Allowance", "special_allowance", "Rs")}
              {numericInput("Overtime Pay", "overtime_pay", "Rs")}
              {numericInput("Bonus", "bonus", "Rs")}
              {numericInput("Reimbursements", "reimbursements", "Rs")}
            </div>

            <h6 className="fw-bold mb-3">Deductions</h6>
            <div className="row g-3 mb-4">
              {numericInput("Loss of Pay", "loss_of_pay", "Rs")}
              {numericInput("Provident Fund", "provident_fund", "Rs")}
              {numericInput("ESI", "esi", "Rs")}
              {numericInput("Professional Tax", "professional_tax", "Rs")}
              {numericInput("TDS", "tds", "Rs")}
              {numericInput("Loan Deduction", "loan_deduction", "Rs")}
              {numericInput("Other Deductions", "other_deductions", "Rs")}
            </div>

            <div className="row g-3 mb-4">
              <div className="col-md-4">
                <label className="form-label fw-semibold">Status</label>
                <select
                  className="form-select"
                  value={editingRecord.status}
                  onChange={(e) => setEditingRecord({ ...editingRecord, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                  <option value="paid">Paid</option>
                  <option value="hold">Hold</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Payment Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={editingRecord.payment_date ? editingRecord.payment_date.slice(0, 10) : ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, payment_date: e.target.value })}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label fw-semibold">Reference</label>
                <input
                  className="form-control"
                  value={editingRecord.payment_reference || ""}
                  onChange={(e) => setEditingRecord({ ...editingRecord, payment_reference: e.target.value })}
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Remarks</label>
              <textarea
                className="form-control"
                rows="2"
                value={editingRecord.remarks || ""}
                onChange={(e) => setEditingRecord({ ...editingRecord, remarks: e.target.value })}
              />
            </div>

            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit" variant="success">Save Payroll</Button>
            </div>
          </form>
        )}
      </Modal>
    </Layout>
  );
}

export default PayrollManagement;
