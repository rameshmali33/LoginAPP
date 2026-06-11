/**
 * GlobalSearch Component
 * Search bar with debounced search and dropdown results
 */

import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

const GlobalSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length >= 2) {
        setLoading(true);
        try {
          const response = await api.get("/search", { params: { q: query } });
          setResults(response.data.results);
          setShowResults(true);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleClickOutside = (e) => {
    if (searchRef.current && !searchRef.current.contains(e.target)) {
      setShowResults(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectEmployee = (employee) => {
    navigate(`/employees/${employee.id}`);
    setQuery("");
    setShowResults(false);
  };

  return (
    <div className="position-relative" ref={searchRef} style={{ width: "300px" }}>
      <input
        type="text"
        className="form-control"
        placeholder="🔍 Search employees, departments..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.length >= 2 && setShowResults(true)}
      />

      {showResults && (
        <div
          className="position-absolute bg-white border rounded shadow-lg mt-1 w-100 z-3"
          style={{ maxHeight: "400px", overflowY: "auto", zIndex: 1000 }}
        >
          {loading ? (
            <div className="p-3 text-center">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : results &&
            (results.employees.length > 0 ||
              results.departments.length > 0 ||
              results.skills.length > 0) ? (
            <>
              {results.employees.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-light border-bottom fw-bold">
                    Employees
                  </div>
                  {results.employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-3 border-bottom cursor-pointer hover"
                      onClick={() => handleSelectEmployee(emp)}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f0f0f0"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                    >
                      <div className="fw-bold">{emp.name}</div>
                      <small className="text-muted">{emp.designation}</small>
                      <br />
                      <small className="text-muted">{emp.email}</small>
                    </div>
                  ))}
                </>
              )}

              {results.departments.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-light border-bottom fw-bold">
                    Departments
                  </div>
                  {results.departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="p-3 border-bottom"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f0f0f0"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                    >
                      <div className="fw-bold">{dept.name}</div>
                    </div>
                  ))}
                </>
              )}

              {results.skills.length > 0 && (
                <>
                  <div className="px-3 py-2 bg-light border-bottom fw-bold">
                    Skills
                  </div>
                  {results.skills.map((skill) => (
                    <div
                      key={skill.id}
                      className="p-3 border-bottom"
                      style={{ cursor: "pointer" }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "#f0f0f0"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "white"}
                    >
                      <div className="fw-bold">{skill.name}</div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div className="p-3 text-center text-muted">No results found</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
