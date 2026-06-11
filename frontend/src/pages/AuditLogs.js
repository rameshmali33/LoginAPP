/**
 * Audit Logs Page
 * Admin-only view of all data changes in the system
 */

import React, { useState, useEffect } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import FormTable from "../components/FormTable";
import FormSelect from "../components/FormSelect";
import FormInput from "../components/FormInput";
import Modal from "../components/Modal";
import Swal from "sweetalert2";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);
  const [filters, setFilters] = useState({
    table_name: "",
    action_type: "",
    dateFrom: "",
    dateTo: "",
  });

  useEffect(() => {
    fetchAuditLogs();
  }, [pagination.page, filters]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };
      const response = await api.get("/audit-logs", { params });
      setLogs(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to fetch audit logs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const columns = [
    {
      key: "created_at",
      label: "Date",
      sortable: true,
      render: (val) => new Date(val).toLocaleString(),
    },
    { key: "table_name", label: "Table", sortable: true },
    {
      key: "action_type",
      label: "Action",
      render: (val) => (
        <span className={`badge bg-${val === "CREATE" ? "success" : val === "UPDATE" ? "info" : "danger"}`}>
          {val}
        </span>
      ),
    },
    { key: "record_id", label: "Record ID" },
    { key: "performed_by_name", label: "Changed By" },
  ];

  const actions = [
    {
      label: "View",
      className: "btn-info btn-sm",
      onClick: (row) => handleViewDetails(row),
    },
  ];

  return (
    <Layout title="Audit Logs">
      <div className="container-fluid py-4">
      <h2 className="mb-4">Audit Trail</h2>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-2">
          <FormSelect
            label="Table"
            name="table_name"
            value={filters.table_name}
            onChange={(e) => setFilters({ ...filters, table_name: e.target.value })}
            options={[
              { value: "employee_profiles", label: "Employees" },
              { value: "assets", label: "Assets" },
              { value: "leave_applications", label: "Leaves" },
              { value: "users", label: "Users" },
            ]}
          />
        </div>
        <div className="col-md-2">
          <FormSelect
            label="Action"
            name="action_type"
            value={filters.action_type}
            onChange={(e) => setFilters({ ...filters, action_type: e.target.value })}
            options={[
              { value: "CREATE", label: "Create" },
              { value: "UPDATE", label: "Update" },
              { value: "DELETE", label: "Delete" },
            ]}
          />
        </div>
        <div className="col-md-2">
          <FormInput
            label="From Date"
            type="date"
            name="dateFrom"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
        </div>
        <div className="col-md-2">
          <FormInput
            label="To Date"
            type="date"
            name="dateTo"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
        </div>
        <div className="col-md-2 pt-4">
          <button
            className="btn btn-outline-secondary"
            onClick={() =>
              setFilters({
                table_name: "",
                action_type: "",
                dateFrom: "",
                dateTo: "",
              })
            }
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <FormTable
        columns={columns}
        data={logs}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        actions={actions}
        loading={loading}
      />

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        title="Audit Log Details"
        onClose={() => setShowDetailModal(false)}
      >
        {selectedLog && (
          <div>
            <div className="mb-3">
              <h6>Old Data</h6>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify(selectedLog.old_data, null, 2) || "No changes"}
              </pre>
            </div>
            <div className="mb-3">
              <h6>New Data</h6>
              <pre className="bg-light p-3 rounded">
                {JSON.stringify(selectedLog.new_data, null, 2) || "No changes"}
              </pre>
            </div>
            <div>
              <p>
                <strong>IP Address:</strong> {selectedLog.ip_address || "N/A"}
              </p>
              <p>
                <strong>Timestamp:</strong>{" "}
                {new Date(selectedLog.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  </Layout>
  );
};

export default AuditLogs;
