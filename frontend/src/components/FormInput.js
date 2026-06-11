/**
 * FormInput Component
 * Reusable input component for forms
 */

import React from "react";

const FormInput = ({
  type = "text",
  label,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  error = null,
  disabled = false,
  maxLength = null,
  min = null,
  max = null,
  step = null,
}) => {
  return (
    <div className="form-group mb-3">
      {label && (
        <label htmlFor={name} className="form-label">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <input
        type={type}
        className={`form-control ${error ? "is-invalid" : ""}`}
        id={name}
        name={name}
        value={value || ""}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        required={required}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
};

export default FormInput;
