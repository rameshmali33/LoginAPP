import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import API from "../services/api";
import Layout from "../components/Layout";

function UploadImages() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [images, setImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();

    return () => {
      previewImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const empRes = await API.get(`/employees/${employeeId}`);
      setEmployee(empRes.data);

      try {
        const imgRes = await API.get(`/uploads/${employeeId}`);
        setExistingImages(imgRes.data);
      } catch {
        setExistingImages([]);
      }
    } catch (error) {
      Swal.fire("Error", "Error loading employee image details", "error");
      navigate("/employees");
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (img) => {
    return img.image_url || img.url || img.image_path || img.path;
  };

  const handleChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length > 5) {
      Swal.fire("Limit Exceeded", "Maximum 5 images allowed", "warning");
      return;
    }

    const invalidFiles = selectedFiles.filter(
      (file) => !file.type.startsWith("image/")
    );

    if (invalidFiles.length > 0) {
      Swal.fire("Invalid File", "Only image files are allowed", "warning");
      return;
    }

    previewImages.forEach((img) => URL.revokeObjectURL(img.preview));

    setImages(selectedFiles);
    setPreviewImages(
      selectedFiles.map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }))
    );
  };

  const clearSelectedImages = () => {
    previewImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setPreviewImages([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      Swal.fire("No Images", "Please select images", "warning");
      return;
    }

    if (images.length > 5) {
      Swal.fire("Limit Exceeded", "Maximum 5 images allowed", "warning");
      return;
    }

    const formData = new FormData();

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      setUploading(true);

      const res = await API.post(`/uploads/${employeeId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      await Swal.fire("Uploaded", res.data.message, "success");

      clearSelectedImages();
      fetchData();
    } catch (error) {
      Swal.fire(
        "Upload Failed",
        error.response?.data?.message || "Image upload failed",
        "error"
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Upload Images">
        <div className="text-center mt-5">
          <div className="spinner-border text-primary"></div>
          <p className="text-muted mt-3">Loading image details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Upload Images">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Upload Employee Images</h2>
          <p className="text-muted mb-0">
            Upload up to 5 images for {employee?.name || "this employee"}.
          </p>
        </div>

        <button
          className="btn btn-outline-secondary"
          onClick={() => navigate(`/employees/${employeeId}`)}
        >
          Back
        </button>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-lg-4 col-md-6">
          <div className="stat-card">
            <div className="icon-box">👤</div>
            <p className="text-muted mb-1">Employee</p>
            <h5>{employee?.name || "N/A"}</h5>
          </div>
        </div>

        <div className="col-lg-4 col-md-6">
          <div className="stat-card">
            <div className="icon-box">🖼️</div>
            <p className="text-muted mb-1">Existing Images</p>
            <h2>{existingImages.length}</h2>
          </div>
        </div>

        <div className="col-lg-4 col-md-6">
          <div className="stat-card">
            <div className="icon-box">⬆️</div>
            <p className="text-muted mb-1">Selected Images</p>
            <h2>{images.length}</h2>
          </div>
        </div>
      </div>

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-semibold">Select Images</label>

              <input
                type="file"
                className="form-control form-control-lg"
                multiple
                accept="image/*"
                onChange={handleChange}
              />

              <small className="text-muted">
                Allowed: image files only. Maximum 5 images per upload.
              </small>
            </div>

            {previewImages.length > 0 && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0">Selected Preview</h5>

                  <button
                    type="button"
                    className="btn btn-outline-danger btn-sm"
                    onClick={clearSelectedImages}
                  >
                    Clear Selected
                  </button>
                </div>

                <div className="row g-3 mb-4">
                  {previewImages.map((img, index) => (
                    <div className="col-md-3 col-6" key={index}>
                      <div
                        className="border rounded shadow-sm overflow-hidden"
                        style={{ height: "150px", cursor: "pointer" }}
                        onClick={() => setSelectedImage(img.preview)}
                      >
                        <img
                          src={img.preview}
                          alt="Preview"
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                        />
                      </div>

                      <small className="text-muted d-block mt-1 text-truncate">
                        {img.file.name}
                      </small>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="d-flex gap-2">
              <button
                type="submit"
                className="btn btn-primary btn-lg px-5"
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Upload Images"}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-lg px-4"
                onClick={() => navigate(`/employees/${employeeId}`)}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="card border-0 shadow-sm">
        <div className="card-body p-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold mb-0">Existing Uploaded Images</h5>
            <span className="badge bg-primary">{existingImages.length}</span>
          </div>

          {existingImages.length === 0 ? (
            <p className="text-muted mb-0">No images uploaded yet.</p>
          ) : (
            <div className="row g-3">
              {existingImages.map((img) => {
                const imageSrc = getImageSrc(img);

                return (
                  <div className="col-md-3 col-6" key={img.id}>
                    <div
                      className="border rounded shadow-sm overflow-hidden"
                      style={{ height: "150px", cursor: "pointer" }}
                      onClick={() => setSelectedImage(imageSrc)}
                    >
                      <img
                        src={imageSrc}
                        alt="Employee"
                        className="w-100 h-100"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

export default UploadImages;