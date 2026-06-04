import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

function AssignSkills() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [skills, setSkills] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const skillsRes = await API.get("/skills");
        setSkills(skillsRes.data);

        const assignedRes = await API.get(
          `/employee-skills/${employeeId}`
        );

        setSelectedSkills(
          assignedRes.data.map((skill) => skill.id)
        );
      } catch (error) {
        alert("Error loading skills");
      }
    };

    fetchData();
  }, [employeeId]);

  const handleChange = (e) => {
    const value = Number(e.target.value);

    if (e.target.checked) {
      setSelectedSkills([...selectedSkills, value]);
    } else {
      setSelectedSkills(
        selectedSkills.filter((id) => id !== value)
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await API.post(
        `/employee-skills/${employeeId}`,
        {
          skills: selectedSkills,
        }
      );

      alert(res.data.message);
      navigate("/employees");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error assigning skills"
      );
    }
  };

  return (
    <>
      <Navbar />

      <div className="container mt-4">
        <div
          className="card shadow p-4 mx-auto"
          style={{ maxWidth: "600px" }}
        >
          <h2 className="text-center mb-4">
            Assign Skills
          </h2>

          <form onSubmit={handleSubmit}>
            {skills.map((skill) => (
              <div
                className="form-check mb-2"
                key={skill.id}
              >
                <input
                  className="form-check-input"
                  type="checkbox"
                  value={skill.id}
                  checked={selectedSkills.includes(skill.id)}
                  onChange={handleChange}
                />

                <label className="form-check-label">
                  {skill.skill_name}
                </label>
              </div>
            ))}

            <button
              type="submit"
              className="btn btn-success w-100 mt-3"
            >
              Save Skills
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default AssignSkills;