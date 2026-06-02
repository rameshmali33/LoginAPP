import { useState } from "react";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email) {
      alert("Please enter your email");
      return;
    }

    alert(`Password reset link sent to ${email}`);
  };

  return (
    <div className="container">
      <div className="row vh-100 justify-content-center align-items-center">
        <div className="col-md-5">
          <div className="card shadow p-4">

            <h2 className="text-center mb-4">
              Forgot Password
            </h2>

            <p className="text-center text-muted">
              Enter your email address and we'll send you a reset link.
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="email"
                className="form-control mb-3"
                placeholder="Enter Email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
              />

              <button
                type="submit"
                className="btn btn-warning w-100"
              >
                Send Reset Link
              </button>
            </form>

            <div className="text-center mt-3">
              <Link to="/login">
                Back to Login
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;