import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function AssignSkills() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const empRes = await API.get(`/employees/${employeeId}`);
        setEmployee(empRes.data);

        const skillsRes = await API.get("/skills");
        setSkills(skillsRes.data);

        const assignedRes = await API.get(`/employee-skills/${employeeId}`);
        setSelectedSkills(assignedRes.data.map((skill) => skill.id));
      } catch (error) {
        Swal.fire("Error", "Error loading skills", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [employeeId]);

  const handleChange = (e) => {
    const value = Number(e.target.value);

    if (e.target.checked) {
      setSelectedSkills([...selectedSkills, value]);
    } else {
      setSelectedSkills(selectedSkills.filter((id) => id !== value));
    }
  };

  const selectAllSkills = () => {
    setSelectedSkills(skills.map((skill) => skill.id));
  };

  const clearAllSkills = () => {
    setSelectedSkills([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      const res = await API.post(`/employee-skills/${employeeId}`, {
        skills: selectedSkills,
      });

      await Swal.fire("Saved", res.data.message, "success");
      navigate(`/employees/${employeeId}`);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error assigning skills",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredSkills = skills.filter((skill) =>
    skill.skill_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout title="Assign Skills">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Assign Skills</h2>
          <p className="text-muted mb-0">
            Select skills for {employee?.name || "this employee"}.
          </p>
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/employees/${employeeId}`)}
        >
          Back
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-4 col-md-6">
          <div className="stat-card">
            <div className="icon-box">👤</div>
            <p className="text-muted mb-1">Employee</p>
            <h5>{employee?.name || "N/A"}</h5>
          </div>
        </div>

        <div className="col-lg-4 col-md-6">
          <div className="stat-card">
            <div className="icon-box">🛠️</div>
            <p className="text-muted mb-1">Selected Skills</p>
            <h2>{selectedSkills.length}</h2>
          </div>
        </div>

        <div className="col-lg-4 col-md-6">
          <div className="stat-card">
            <div className="icon-box">📚</div>
            <p className="text-muted mb-1">Available Skills</p>
            <h2>{skills.length}</h2>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary"></div>
              <p className="text-muted mt-3">Loading skills...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    placeholder="Search skills..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                <div className="col-md-6 d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary"
                    onClick={selectAllSkills}
                    disabled={skills.length === 0}
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={clearAllSkills}
                    disabled={selectedSkills.length === 0}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {skills.length === 0 ? (
                <div className="alert alert-warning">
                  No skills available. Please add skills first.
                </div>
              ) : filteredSkills.length === 0 ? (
                <div className="alert alert-info">No matching skills found.</div>
              ) : (
                <div className="row g-3">
                  {filteredSkills.map((skill) => (
                    <div className="col-md-4" key={skill.id}>
                      <label className="skill-option w-100">
                        <input
                          className="form-check-input me-2"
                          type="checkbox"
                          value={skill.id}
                          checked={selectedSkills.includes(skill.id)}
                          onChange={handleChange}
                        />

                        <span>{skill.skill_name}</span>
                      </label>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <h6 className="fw-bold">Selected Skills Preview</h6>

                {selectedSkills.length === 0 ? (
                  <p className="text-muted mb-0">No skills selected</p>
                ) : (
                  <div className="d-flex gap-2 flex-wrap">
                    {skills
                      .filter((skill) => selectedSkills.includes(skill.id))
                      .map((skill) => (
                        <span
                          key={skill.id}
                          className="badge bg-success px-3 py-2"
                        >
                          {skill.skill_name}
                        </span>
                      ))}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2 mt-4">
                <button
                  type="submit"
                  className="btn btn-success btn-lg px-5"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Skills"}
                </button>

                <button
                  type="button"
                  className="btn btn-outline-secondary btn-lg px-4"
                  onClick={() => navigate(`/employees/${employeeId}`)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AssignSkills;