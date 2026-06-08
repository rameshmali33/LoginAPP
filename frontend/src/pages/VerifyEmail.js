import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../services/api";

function VerifyEmail() {
  const { token } = useParams();

  const [message, setMessage] = useState("Verifying your email...");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setLoading(true);

        const res = await API.get(`/auth/verify-email/${token}`);

        setMessage(res.data.message);
        setSuccess(true);
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Email verification failed"
        );
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="container">
      <div className="row vh-100 justify-content-center align-items-center">
        <div className="col-md-5">
          <div className="card shadow border-0 p-4 text-center">
            {loading ? (
              <>
                <div className="spinner-border text-primary mx-auto mb-3"></div>
                <h3 className="fw-bold">Verifying Email</h3>
                <p className="text-muted mb-0">
                  Please wait while we verify your account.
                </p>
              </>
            ) : (
              <>
                <div className="display-3 mb-3">
                  {success ? "✅" : "❌"}
                </div>

                <h2 className="fw-bold">
                  {success ? "Email Verified" : "Verification Failed"}
                </h2>

                <p className="text-muted mt-3">{message}</p>

                <Link to="/login" className="btn btn-primary btn-lg mt-3">
                  Go to Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;