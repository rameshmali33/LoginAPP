import React from "react";

// Modal supports both `show` and `isOpen` prop names for compatibility
const Modal = ({ show, isOpen, onClose, title, children }) => {
  const visible = typeof isOpen !== "undefined" ? isOpen : show;
  if (!visible) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-0 pb-0">
            <h5 className="modal-title fw-bold text-primary">{title}</h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body p-4">{children}</div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
