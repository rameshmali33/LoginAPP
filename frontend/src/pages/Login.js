import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

function Login() {
  const [form, setForm] = useState({
    email: "",
    password: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        form
      );

      localStorage.setItem("token", res.data.token);

      alert("Login Success");

      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Login Failed");
    }
  };

  return (
    <div className="container">
      <div className="row vh-100 justify-content-center align-items-center">
        <div className="col-md-5">
          <div className="card shadow p-4">

            <h2 className="text-center mb-4">
              Welcome Back
            </h2>

            <form onSubmit={handleSubmit}>

              <input
                type="email"
                name="email"
                placeholder="Email"
                className="form-control mb-3"
                value={form.email}
                onChange={handleChange}
                required
              />

              <input
                type="password"
                name="password"
                placeholder="Password"
                className="form-control mb-3"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button
                type="submit"
                className="btn btn-primary w-100"
              >
                Login
              </button>

            </form>

            <div className="text-center mt-3">
              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            <div className="text-center mt-2">
              Don't have an account?{" "}
              <Link to="/signup">
                Register
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;