import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function Skills() {
  const [skills, setSkills] = useState([]);
  const [skillName, setSkillName] = useState("");
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/skills", {
        skill_name: skillName,
      });

      Swal.fire("Success", "Skill added successfully", "success");

      setSkillName("");
      fetchSkills();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Error adding skill",
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
          <h5 className="fw-bold mb-3">Add New Skill</h5>

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
                <button type="submit" className="btn btn-success btn-lg w-100">
                  Add Skill
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Skill List</h5>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-success"></div>
            </div>
          ) : (
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>ID</th>
                  <th>Skill Name</th>
                </tr>
              </thead>

              <tbody>
                {skills.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="text-center text-muted py-5">
                      No skills found
                    </td>
                  </tr>
                ) : (
                  skills.map((skill) => (
                    <tr key={skill.id}>
                      <td>{skill.id}</td>
                      <td>
                        <span className="badge bg-success px-3 py-2">
                          {skill.skill_name}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default Skills;