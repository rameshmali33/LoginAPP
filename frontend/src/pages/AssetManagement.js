/**
 * AssetManagement Page
 * Manage company assets: create, allocate, return, view history
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import FormTable from "../components/FormTable";
import FormInput from "../components/FormInput";
import FormSelect from "../components/FormSelect";
import Modal from "../components/Modal";
import Layout from "../components/Layout";
import Swal from "sweetalert2";

const AssetManagement = () => {
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [currentAsset, setCurrentAsset] = useState(null);
  const [allocation, setAllocation] = useState(null);
  const [history, setHistory] = useState([]);
  const [filters, setFilters] = useState({ status: "", asset_type: "" });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    asset_code: "",
    asset_name: "",
    asset_type: "",
    purchase_date: "",
    purchase_cost: "",
  });

  const [allocateData, setAllocateData] = useState({
    employee_id: "",
    allocated_date: new Date().toISOString().split("T")[0],
    remarks: "",
  });

  useEffect(() => {
    fetchAssets();
    fetchEmployees();
  }, [pagination.page, filters]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };
      const response = await api.get("/assets", { params });
      setAssets(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to fetch assets", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await api.get("/employees");
      // Support both API shapes: either `res.data` is array or `{ data: [...] }`
      setEmployees(response.data?.data ?? response.data ?? []);
    } catch (error) {
      console.error("Failed to fetch employees:", error);
    }
  };

  const handleCreateAsset = async () => {
    try {
      await api.post("/assets", formData);
      Swal.fire("Success", "Asset created successfully", "success");
      setShowCreateModal(false);
      setFormData({
        asset_code: "",
        asset_name: "",
        asset_type: "",
        purchase_date: "",
        purchase_cost: "",
      });
      fetchAssets();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to create asset", "error");
    }
  };

  const handleAllocateAsset = async () => {
    try {
      await api.post(`/assets/${currentAsset.id}/allocate`, allocateData);
      Swal.fire("Success", "Asset allocated successfully", "success");
      setShowAllocateModal(false);
      setAllocateData({ employee_id: "", allocated_date: new Date().toISOString().split("T")[0], remarks: "" });
      fetchAssets();
    } catch (error) {
      Swal.fire("Error", error.response?.data?.message || "Failed to allocate asset", "error");
    }
  };

  const handleReturnAsset = async (allocationId) => {
    const { value: returnDate } = await Swal.fire({
      title: "Return Asset",
      input: "date",
      inputLabel: "Return Date",
      inputValue: new Date().toISOString().split("T")[0],
      showCancelButton: true,
    });

    if (returnDate) {
      try {
        await api.post(`/assets/${allocationId}/return`, { return_date: returnDate });
        Swal.fire("Success", "Asset returned successfully", "success");
        fetchAssets();
      } catch (error) {
        Swal.fire("Error", error.response?.data?.message || "Failed to return asset", "error");
      }
    }
  };

  const handleViewHistory = async (asset) => {
    try {
      const response = await api.get(`/assets/${asset.id}`);
      setCurrentAsset(response.data.asset);
      setAllocation(response.data.allocations[0]);
      setHistory(response.data.history);
      setShowHistoryModal(true);
    } catch (error) {
      Swal.fire("Error", "Failed to fetch asset history", "error");
    }
  };

  const columns = [
    { key: "asset_code", label: "Code", sortable: true },
    { key: "asset_name", label: "Name", sortable: true },
    { key: "asset_type", label: "Type" },
    { key: "purchase_cost", label: "Cost", render: (val) => `$${val}` },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <span className={`badge bg-${val === "available" ? "success" : "warning"}`}>
          {val}
        </span>
      ),
    },
  ];

  const actions = [
    {
      label: "View",
      className: "btn-info",
      onClick: (row) => handleViewHistory(row),
    },
    {
      label: "Allocate",
      className: "btn-primary",
      onClick: (row) => {
        setCurrentAsset(row);
        setShowAllocateModal(true);
      },
    },
    {
      label: "Delete",
      className: "btn-danger",
      onClick: (row) => {
        Swal.fire({
          title: "Delete Asset?",
          text: "This cannot be undone",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Delete",
        }).then((result) => {
          if (result.isConfirmed) {
            api.delete(`/assets/${row.id}`).then(() => {
              Swal.fire("Deleted", "Asset deleted", "success");
              fetchAssets();
            });
          }
        });
      },
    },
  ];

  return (
    <Layout title="Asset Management">
      <div className="container-fluid py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Asset Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Asset
        </button>
      </div>

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-3">
          <FormSelect
            label="Status"
            name="status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: "available", label: "Available" },
              { value: "allocated", label: "Allocated" },
              { value: "returned", label: "Returned" },
              { value: "damaged", label: "Damaged" },
              { value: "lost", label: "Lost" },
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <FormTable
        columns={columns}
        data={assets}
        pagination={pagination}
        onPageChange={(page) => setPagination({ ...pagination, page })}
        actions={actions}
        loading={loading}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        title="Create New Asset"
        onClose={() => setShowCreateModal(false)}
      >
        <FormInput
          label="Asset Code"
          name="asset_code"
          value={formData.asset_code}
          onChange={(e) => setFormData({ ...formData, asset_code: e.target.value })}
          required
        />
        <FormInput
          label="Asset Name"
          name="asset_name"
          value={formData.asset_name}
          onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
          required
        />
        <FormInput
          label="Asset Type"
          name="asset_type"
          value={formData.asset_type}
          onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
          required
        />
        <FormInput
          label="Purchase Date"
          type="date"
          name="purchase_date"
          value={formData.purchase_date}
          onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
          required
        />
        <FormInput
          label="Purchase Cost"
          type="number"
          name="purchase_cost"
          value={formData.purchase_cost}
          onChange={(e) => setFormData({ ...formData, purchase_cost: e.target.value })}
          required
        />
        <button className="btn btn-primary" onClick={handleCreateAsset}>
          Create Asset
        </button>
      </Modal>

      {/* Allocate Modal */}
      <Modal
        isOpen={showAllocateModal}
        title={`Allocate ${currentAsset?.asset_name}`}
        onClose={() => setShowAllocateModal(false)}
      >
        <FormSelect
          label="Employee"
          name="employee_id"
          value={allocateData.employee_id}
          onChange={(e) =>
            setAllocateData({ ...allocateData, employee_id: parseInt(e.target.value) })
          }
          options={employees.map((emp) => ({ value: emp.id, label: emp.name }))}
          required
        />
        <FormInput
          label="Allocation Date"
          type="date"
          name="allocated_date"
          value={allocateData.allocated_date}
          onChange={(e) =>
            setAllocateData({ ...allocateData, allocated_date: e.target.value })
          }
          required
        />
        <FormInput
          label="Remarks"
          name="remarks"
          value={allocateData.remarks}
          onChange={(e) =>
            setAllocateData({ ...allocateData, remarks: e.target.value })
          }
        />
        <button className="btn btn-primary" onClick={handleAllocateAsset}>
          Allocate Asset
        </button>
      </Modal>

      {/* History Modal */}
      <Modal
        isOpen={showHistoryModal}
        title={`Asset History: ${currentAsset?.asset_name}`}
        onClose={() => setShowHistoryModal(false)}
      >
        {allocation && (
          <div className="mb-4">
            <h5>Current Allocation</h5>
            <p><strong>Status:</strong> {allocation.status}</p>
            <p><strong>Allocated Date:</strong> {new Date(allocation.allocated_date).toLocaleDateString()}</p>
            {allocation.status === "allocated" && (
              <button
                className="btn btn-warning btn-sm"
                onClick={() => {
                  setShowHistoryModal(false);
                  handleReturnAsset(allocation.id);
                }}
              >
                Return Asset
              </button>
            )}
          </div>
        )}
        <h5>History</h5>
        <ul className="list-group">
          {history.map((h) => (
            <li key={h.id} className="list-group-item">
              <div className="fw-bold">{h.action}</div>
              <small className="text-muted">{new Date(h.created_at).toLocaleString()}</small>
              <p className="mb-0">{h.remarks}</p>
            </li>
          ))}
        </ul>
      </Modal>
      </div>
    </Layout>
  );
};

export default AssetManagement;
