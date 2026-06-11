/**
 * FormSelect Component
 * Reusable dropdown component
 */

import React from "react";

const FormSelect = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options = [],
  placeholder = "Select an option",
  required = false,
  error = null,
  disabled = false,
  multiple = false,
}) => {
  return (
    <div className="form-group mb-3">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <select
        className={`form-select ${error ? "is-invalid" : ""}`}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        disabled={disabled}
        required={required}
        multiple={multiple}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
};

export default FormSelect;
