import { useEffect, useState } from "react";
import API from "../services/api";
import Navbar from "../components/Navbar";

function Skills() {
  const [skills, setSkills] = useState([]);
  const [skillName, setSkillName] = useState("");

  const fetchSkills = async () => {
    try {
      const res = await API.get("/skills");
      setSkills(res.data);
    } catch (error) {
      console.error(error);
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

      alert("Skill Added");

      setSkillName("");
      fetchSkills();
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Error adding skill"
      );
    }
  };

  return (
    <>
        <Navbar />   
        <div className="container mt-4">
        <div className="card shadow p-4">
            <h2 className="text-center mb-4">
            Skills Master
            </h2>

            <form onSubmit={handleSubmit}>
            <div className="row">
                <div className="col-md-9">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Skill Name"
                    value={skillName}
                    onChange={(e) =>
                    setSkillName(e.target.value)
                    }
                    required
                />
                </div>

                <div className="col-md-3">
                <button
                    type="submit"
                    className="btn btn-primary w-100"
                >
                    Add Skill
                </button>
                </div>
            </div>
            </form>

            <hr />

            <table className="table table-bordered table-striped">
            <thead>
                <tr>
                <th>ID</th>
                <th>Skill Name</th>
                </tr>
            </thead>

            <tbody>
                {skills.map((skill) => (
                <tr key={skill.id}>
                    <td>{skill.id}</td>
                    <td>{skill.skill_name}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        </div>
    </>
  );
}

export default Skills;