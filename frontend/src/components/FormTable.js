/**
 * FormTable Component
 * Reusable sortable table with pagination
 */

import React, { useState } from "react";

const FormTable = ({
  columns,
  data,
  onSort,
  sortBy,
  sortOrder,
  pagination,
  onPageChange,
  loading = false,
  actions = [],
}) => {
  const handleColumnSort = (columnKey) => {
    if (onSort) {
      const newOrder =
        sortBy === columnKey && sortOrder === "ASC" ? "DESC" : "ASC";
      onSort(columnKey, newOrder);
    }
  };

  const renderSortIcon = (columnKey) => {
    if (!onSort || sortBy !== columnKey) return null;
    return sortOrder === "ASC" ? " ▲" : " ▼";
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover table-striped">
        <thead className="table-dark">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable && handleColumnSort(col.key)}
                style={{ cursor: col.sortable ? "pointer" : "default" }}
              >
                {col.label}
                {col.sortable && renderSortIcon(col.key)}
              </th>
            ))}
            {actions.length > 0 && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className="text-center py-4">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (actions.length > 0 ? 1 : 0)}
                className="text-center py-4 text-muted"
              >
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={idx}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td>
                    {actions.map((action, idx) => (
                      <button
                        key={idx}
                        className={`btn btn-sm ${action.className || "btn-primary"} me-2`}
                        onClick={() => action.onClick(row)}
                        title={action.title}
                      >
                        {action.label}
                      </button>
                    ))}
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && (
        <nav aria-label="Table pagination" className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${pagination.page === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              >
                Previous
              </button>
            </li>

            {Array.from({ length: pagination.pages || 1 }, (_, i) => i + 1).map(
              (page) => (
                <li
                  key={page}
                  className={`page-item ${pagination.page === page ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </button>
                </li>
              )
            )}

            <li
              className={`page-item ${
                pagination.page === pagination.pages ? "disabled" : ""
              }`}
            >
              <button
                className="page-link"
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

export default FormTable;
