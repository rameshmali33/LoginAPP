import { useCallback, useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";
import { resolveImageUrl } from "../utils/imageUrls";

function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const user = token ? jwtDecode(token) : {};

  const [employee, setEmployee] = useState(null);
  const [skills, setSkills] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageActionLoading, setImageActionLoading] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      const imgRes = await API.get(`/uploads/${id}`);
      setImages(imgRes.data);
    } catch {
      setImages([]);
    }
  }, [id]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);

        const empRes = await API.get(`/employees/${id}`);
        setEmployee(empRes.data);

        try {
          const skillRes = await API.get(`/employee-skills/${id}`);
          setSkills(skillRes.data);
        } catch {
          setSkills([]);
        }

        await fetchImages();
      } catch (error) {
        Swal.fire("Error", "Error loading employee profile", "error");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [fetchImages, id, navigate]);

  const handleReplaceImage = async (image) => {
    const { value: file } = await Swal.fire({
      title: "Replace image",
      input: "file",
      inputAttributes: {
        accept: "image/*",
      },
      showCancelButton: true,
      confirmButtonText: "Replace",
      preConfirm: (selectedFile) => {
        if (!selectedFile) {
          Swal.showValidationMessage("Please select an image");
          return false;
        }

        if (!selectedFile.type.startsWith("image/")) {
          Swal.showValidationMessage("Only image files are allowed");
          return false;
        }

        return selectedFile;
      },
    });

    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      setImageActionLoading(true);
      const res = await API.put(`/uploads/image/${image.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      Swal.fire("Updated", res.data.message, "success");
      fetchImages();
    } catch (error) {
      Swal.fire(
        "Update Failed",
        error.response?.data?.message || "Could not update image",
        "error"
      );
    } finally {
      setImageActionLoading(false);
    }
  };

  const handleDeleteImage = async (image) => {
    const result = await Swal.fire({
      title: "Delete image?",
      text: "This image will be removed from the employee profile.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      confirmButtonText: "Delete",
    });

    if (!result.isConfirmed) return;

    try {
      setImageActionLoading(true);
      const res = await API.delete(`/uploads/image/${image.id}`);
      Swal.fire("Deleted", res.data.message, "success");
      fetchImages();
    } catch (error) {
      Swal.fire(
        "Delete Failed",
        error.response?.data?.message || "Could not delete image",
        "error"
      );
    } finally {
      setImageActionLoading(false);
    }
  };

  const getProfileCompletion = () => {
    if (!employee) return 0;

    const fields = [
      employee.name,
      employee.email,
      employee.phone,
      employee.address,
      employee.designation,
      employee.salary,
      employee.department_name,
    ];

    const filledFields = fields.filter(
      (field) => field !== null && field !== undefined && field !== ""
    ).length;

    return Math.round((filledFields / fields.length) * 100);
  };

  const goBack = () => {
    if (user.role === "admin") {
      navigate("/employees");
    } else {
      navigate("/dashboard");
    }
  };

  if (loading) {
    return (
      <Layout title="Employee Profile">
        <div className="text-center mt-5">
          <div className="spinner-border text-primary"></div>
          <p className="text-muted mt-3">Loading profile...</p>
        </div>
      </Layout>
    );
  }

  if (!employee) return null;

  const profileCompletion = getProfileCompletion();

  return (
    <Layout title="Employee Profile">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">{employee.name}</h2>
          <p className="text-muted mb-0">{employee.email}</p>
        </div>

        <button className="btn btn-outline-secondary" onClick={goBack}>
          Back
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="icon-box">📊</div>
            <p className="text-muted mb-1">Profile Completion</p>
            <h2>{profileCompletion}%</h2>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="icon-box">🛠️</div>
            <p className="text-muted mb-1">Skills</p>
            <h2>{skills.length}</h2>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="icon-box">🖼️</div>
            <p className="text-muted mb-1">Images</p>
            <h2>{images.length}</h2>
          </div>
        </div>

        <div className="col-lg-3 col-md-6">
          <div className="stat-card">
            <div className="icon-box">✅</div>
            <p className="text-muted mb-1">Status</p>
            <h4>
              <span
                className={`badge ${
                  employee.status === "inactive" ? "bg-danger" : "bg-success"
                }`}
              >
                {employee.status === "inactive" ? "Inactive" : "Active"}
              </span>
            </h4>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <h5 className="fw-bold mb-3">Profile Completion</h5>

          <div className="progress" style={{ height: "25px" }}>
            <div
              className="progress-bar"
              style={{ width: `${profileCompletion}%` }}
            >
              {profileCompletion}%
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body text-center p-4">
              <div className="display-1 mb-3">👤</div>

              <h4 className="fw-bold">{employee.name}</h4>
              <p className="text-muted">{employee.designation}</p>

              <span className="badge bg-primary px-3 py-2">
                {employee.department_name || "N/A"}
              </span>

              <div className="mt-3 d-flex justify-content-center gap-2 flex-wrap">
                <span className="badge bg-dark px-3 py-2">
                  {images.length} Images
                </span>

                <span
                  className={`badge px-3 py-2 ${
                    employee.status === "inactive" ? "bg-danger" : "bg-success"
                  }`}
                >
                  {employee.status === "inactive" ? "Inactive" : "Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-4">Employee Details</h5>

              <div className="row g-3">
                <div className="col-md-6">
                  <p className="text-muted mb-1">Email</p>
                  <h6>{employee.email}</h6>
                </div>

                <div className="col-md-6">
                  <p className="text-muted mb-1">Phone</p>
                  <h6>{employee.phone || "N/A"}</h6>
                </div>

                <div className="col-md-6">
                  <p className="text-muted mb-1">Department</p>
                  <h6>{employee.department_name || "N/A"}</h6>
                </div>

                <div className="col-md-6">
                  <p className="text-muted mb-1">Designation</p>
                  <h6>{employee.designation || "N/A"}</h6>
                </div>

                <div className="col-md-6">
                  <p className="text-muted mb-1">Salary</p>
                  <h6>₹{Number(employee.salary || 0).toLocaleString()}</h6>
                </div>

                <div className="col-md-6">
                  <p className="text-muted mb-1">Status</p>
                  <h6>
                    <span
                      className={`badge ${
                        employee.status === "inactive"
                          ? "bg-danger"
                          : "bg-success"
                      }`}
                    >
                      {employee.status === "inactive" ? "Inactive" : "Active"}
                    </span>
                  </h6>
                </div>

                <div className="col-12">
                  <p className="text-muted mb-1">Address</p>
                  <h6>{employee.address || "N/A"}</h6>
                </div>
              </div>
            </div>
          </div>
        </div>

        {user.role === "admin" && (
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3">Admin Actions</h5>

                <div className="d-flex gap-2 flex-wrap">
                  <button
                    className="btn btn-warning"
                    onClick={() => navigate(`/edit-employee/${employee.id}`)}
                  >
                    Edit Employee
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => navigate(`/assign-skills/${employee.id}`)}
                  >
                    Assign Skills
                  </button>

                  <button
                    className="btn btn-info"
                    onClick={() => navigate(`/upload-images/${employee.id}`)}
                  >
                    Upload Images
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3">Skills</h5>

              {skills.length === 0 ? (
                <p className="text-muted mb-0">No skills assigned</p>
              ) : (
                <div className="d-flex gap-2 flex-wrap">
                  {skills.map((skill) => (
                    <span key={skill.id} className="badge bg-success px-3 py-2">
                      {skill.skill_name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0">Uploaded Images</h5>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-primary">{images.length}</span>
                  {user.role === "admin" && (
                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => navigate(`/upload-images/${employee.id}`)}
                    >
                      Manage
                    </button>
                  )}
                </div>
              </div>

              {images.length === 0 ? (
                <p className="text-muted mb-0">No images uploaded</p>
              ) : (
                <div className="row g-3">
                  {images.map((img) => {
                    const imageSrc = resolveImageUrl(img);

                    return (
                      <div className="col-md-4 col-6" key={img.id}>
                        <div
                          className="border rounded shadow-sm overflow-hidden"
                          style={{
                            cursor: "pointer",
                            height: "120px",
                          }}
                          onClick={() => setSelectedImage(imageSrc)}
                        >
                          <img
                            src={imageSrc}
                            alt="Employee"
                            className="w-100 h-100"
                            style={{
                              objectFit: "cover",
                            }}
                          />
                        </div>

                        {user.role === "admin" && (
                          <div className="d-flex gap-1 mt-2 flex-wrap">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm flex-fill"
                              onClick={() => setSelectedImage(imageSrc)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm flex-fill"
                              onClick={() => handleReplaceImage(img)}
                              disabled={imageActionLoading}
                            >
                              Replace
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm flex-fill"
                              onClick={() => handleDeleteImage(img)}
                              disabled={imageActionLoading}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedImage && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.7)",
          }}
          tabIndex="-1"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="modal-dialog modal-dialog-centered modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content border-0">
              <div className="modal-header">
                <h5 className="modal-title">Image Preview</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedImage(null)}
                ></button>
              </div>

              <div className="modal-body text-center">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="img-fluid rounded"
                  style={{
                    maxHeight: "70vh",
                    objectFit: "contain",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default EmployeeProfile;
