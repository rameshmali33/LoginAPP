const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const logger = require("../utils/logger");

const uploadsDir = path.join(__dirname, "../uploads");

// Create enterprise directories
const subdirectories = ["employees", "documents", "certificates", "assets"];
subdirectories.forEach((subdir) => {
  const dirPath = path.join(uploadsDir, subdir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

const addActivityLog = async (action, description, userId) => {
  try {
    await pool.query(
      `
      INSERT INTO activity_logs(action, description, user_id)
      VALUES($1, $2, $3)
      `,
      [action, description, userId || null]
    );
  } catch (error) {
    logger.error("Activity Log Error:", error);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine the directory based on type parameter
    const type = req.query.type || "employees";
    const folder = subdirectories.includes(type) ? type : "employees";
    cb(null, path.join(uploadsDir, folder));
  },

  filename: (req, file, cb) => {
    const safeOriginalName = file.originalname.replace(/\s+/g, "-");
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}-${safeOriginalName}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  const allowedExtensions = [".jpeg", ".jpg", ".png", ".webp", ".pdf"];
  const extension = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, JPEG, PNG, WEBP and PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 5,
  },
});

router.post(
  "/:employeeId",
  authMiddleware,
  roleMiddleware("admin"),
  upload.array("images", 5),
  async (req, res, next) => {
    try {
      const { employeeId } = req.params;
      const type = req.query.type || "employees";
      const folder = subdirectories.includes(type) ? type : "employees";

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "No files uploaded",
        });
      }

      const employee = await pool.query(
        "SELECT id, name FROM employee_profiles WHERE id = $1",
        [employeeId]
      );

      if (employee.rows.length === 0) {
        return res.status(404).json({
          message: "Employee not found",
        });
      }

      const uploadedImages = [];
      const backendUrl = process.env.BACKEND_URL || "http://localhost:5000";

      for (const file of req.files) {
        const imageUrl = `${backendUrl}/uploads/${folder}/${file.filename}`;

        const result = await pool.query(
          `
          INSERT INTO employee_images(employee_id, image_url)
          VALUES($1, $2)
          RETURNING *
          `,
          [employeeId, imageUrl]
        );

        uploadedImages.push(result.rows[0]);
      }

      await addActivityLog(
        "Images Uploaded",
        `${req.files.length} image(s) uploaded for ${employee.rows[0].name}`,
        req.user.id
      );

      res.status(201).json({
        message: "Images uploaded successfully",
        images: uploadedImages,
      });
    } catch (error) {
      logger.error("Upload Error:", error);
      next(error);
    }
  }
);

router.get(
  "/:employeeId",
  authMiddleware,
  roleMiddleware("admin", "employee"),
  async (req, res, next) => {
    try {
      const { employeeId } = req.params;

      if (
        req.user.role === "employee" &&
        Number(req.user.employee_profile_id) !== Number(employeeId)
      ) {
        return res.status(403).json({
          message: "Access denied",
        });
      }

      const images = await pool.query(
        `
        SELECT *
        FROM employee_images
        WHERE employee_id = $1
        ORDER BY id DESC
        `,
        [employeeId]
      );

      res.json(images.rows);
    } catch (error) {
      logger.error("Get Images Error:", error);
      next(error);
    }
  }
);

router.delete(
  "/image/:imageId",
  authMiddleware,
  roleMiddleware("admin"),
  async (req, res, next) => {
    try {
      const { imageId } = req.params;

      const image = await pool.query(
        `
        SELECT ei.*, ep.name AS employee_name
        FROM employee_images ei
        LEFT JOIN employee_profiles ep
          ON ei.employee_id = ep.id
        WHERE ei.id = $1
        `,
        [imageId]
      );

      if (image.rows.length === 0) {
        return res.status(404).json({
          message: "Image not found",
        });
      }

      const imageUrl = image.rows[0].image_url;
      const parts = imageUrl.split("/");
      const filename = parts.pop();
      const folder = parts.pop(); // e.g. employees, documents, etc.
      const filePath = path.join(uploadsDir, folder, filename);

      await pool.query("DELETE FROM employee_images WHERE id = $1", [imageId]);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      await addActivityLog(
        "Image Deleted",
        `Image deleted for ${image.rows[0].employee_name || "employee"}`,
        req.user.id
      );

      res.json({
        message: "Image deleted successfully",
      });
    } catch (error) {
      logger.error("Delete Image Error:", error);
      next(error);
    }
  }
);

module.exports = router;