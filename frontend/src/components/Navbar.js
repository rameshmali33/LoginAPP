import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">

        <Link
          className="navbar-brand fw-bold"
          to="/dashboard"
        >
          EMS
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          className="collapse navbar-collapse"
          id="navbarNav"
        >
          <ul className="navbar-nav me-auto">

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/dashboard"
              >
                Dashboard
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/departments"
              >
                Departments
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/skills"
              >
                Skills
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/create-employee"
              >
                Create Employee
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/employees"
              >
                Employee List
              </Link>
            </li>

            <li className="nav-item">
              <Link
                className="nav-link"
                to="/report"
              >
                Reports
              </Link>
            </li>

          </ul>

          <button
            onClick={handleLogout}
            className="btn btn-danger"
          >
            Logout
          </button>
        </div>

      </div>
    </nav>
  );
}

export default Navbar;