import React from "react";

const Card = ({ title, children, className = "", headerActions }) => {
  return (
    <div className={`card border-0 shadow-sm mb-4 ${className}`}>
      {title && (
        <div className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center pt-4 px-4 pb-0">
          <h5 className="fw-bold mb-0 text-primary">{title}</h5>
          {headerActions}
        </div>
      )}
      <div className="card-body p-4">{children}</div>
    </div>
  );
};

export default Card;
