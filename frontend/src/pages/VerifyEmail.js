import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";

function VerifyEmail() {
  const { token } = useParams();
  const [message, setMessage] = useState("Verifying your email...");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const res = await API.get(`/auth/verify-email/${token}`);
        setMessage(res.data.message);
        setSuccess(true);
      } catch (error) {
        setMessage(
          error.response?.data?.message ||
          "Email verification failed"
        );
        setSuccess(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="container mt-5">
      <div
        className="card shadow-lg p-4 mx-auto text-center"
        style={{ maxWidth: "500px" }}
      >
        <h2>{success ? "❌ Verification Failed" : "✅ Email Verified"}</h2>

        <p className="mt-3">{message}</p>

        {success && (
          <Link to="/login" className="btn btn-primary mt-3">
            Go to Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;