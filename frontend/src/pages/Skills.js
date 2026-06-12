import { useEffect, useState } from "react";
import { FaEdit, FaPlus, FaSave, FaTimes, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function Skills() {
  const [skills, setSkills] = useState([]);
  const [skillName, setSkillName] = useState("");
  const [editingSkill, setEditingSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSkills = async () => {
    try {
      setLoading(true);
      const res = await API.get("/skills");
      setSkills(res.data);
    } catch (error) {
      Swal.fire("Error", "Error loading skills", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const resetForm = () => {
    setSkillName("");
    setEditingSkill(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);

      if (editingSkill) {
        await API.put(`/skills/${editingSkill.id}`, {
          skill_name: skillName,
        });
        Swal.fire("Success", "Skill updated successfully", "success");
      } else {
        await API.post("/skills", {
          skill_name: skillName,
        });
        Swal.fire("Success", "Skill added successfully", "success");
      }

      resetForm();
      fetchSkills();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error saving skill",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (skill) => {
    setEditingSkill(skill);
    setSkillName(skill.skill_name);
  };

  const deleteSkill = async (skill) => {
    const result = await Swal.fire({
      title: "Delete skill?",
      text: `This will remove ${skill.skill_name} if it is not assigned to employees.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      await API.delete(`/skills/${skill.id}`);
      Swal.fire("Deleted", "Skill deleted successfully", "success");
      if (editingSkill?.id === skill.id) resetForm();
      fetchSkills();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error deleting skill",
        "error"
      );
    }
  };

  return (
    <Layout title="Skills">
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Skills</h2>
        <p className="text-muted mb-0">
          Manage employee technical and professional skills.
        </p>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h5 className="fw-bold mb-0">
              {editingSkill ? "Update Skill" : "Add New Skill"}
            </h5>
            {editingSkill && (
              <button type="button" className="btn btn-outline-secondary" onClick={resetForm}>
                <FaTimes className="me-2" />
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="row g-3">
              <div className="col-md-9">
                <input
                  type="text"
                  className="form-control form-control-lg"
                  placeholder="Enter skill name"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  required
                />
              </div>

              <div className="col-md-3">
                <button type="submit" className="btn btn-success btn-lg w-100" disabled={saving}>
                  {editingSkill ? (
                    <>
                      <FaSave className="me-2" />
                      {saving ? "Updating..." : "Update"}
                    </>
                  ) : (
                    <>
                      <FaPlus className="me-2" />
                      {saving ? "Adding..." : "Add"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
            <h5 className="fw-bold mb-0">Skill List</h5>
            <span className="text-muted small">{skills.length} total</span>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: "90px" }}>S. No.</th>
                    <th style={{ width: "120px" }}>ID</th>
                    <th>Skill Name</th>
                    <th className="text-end" style={{ width: "180px" }}>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {skills.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center text-muted py-5">
                        No skills found
                      </td>
                    </tr>
                  ) : (
                    skills.map((skill, index) => (
                      <tr key={skill.id}>
                        <td>{index + 1}</td>
                        <td className="text-muted">#{skill.id}</td>
                        <td className="fw-semibold">{skill.skill_name}</td>
                        <td>
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => startEdit(skill)}
                              title="Edit skill"
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => deleteSkill(skill)}
                              title="Delete skill"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Skills;
