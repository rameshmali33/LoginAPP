import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import Navbar from "../components/Navbar";

function UploadImages() {
  const { employeeId } = useParams();
  const navigate = useNavigate();

  const [images, setImages] = useState([]);

  const handleChange = (e) => {
    setImages(e.target.files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length === 0) {
      alert("Please select images");
      return;
    }

    if (images.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }

    const formData = new FormData();

    for (let i = 0; i < images.length; i++) {
      formData.append("images", images[i]);
    }

    try {
      const res = await API.post(
        `/uploads/${employeeId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      alert(res.data.message);
      navigate("/employees");
    } catch (error) {
      alert(
        error.response?.data?.message ||
          "Image upload failed"
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
            Upload Employee Images
          </h2>

          <form onSubmit={handleSubmit}>
            <input
              type="file"
              className="form-control mb-3"
              multiple
              accept="image/*"
              onChange={handleChange}
            />

            <button
              type="submit"
              className="btn btn-primary w-100"
            >
              Upload Images
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default UploadImages;