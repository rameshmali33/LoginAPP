const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const pool = require("../config/db");
const authMiddleware = require("../middleware/authMiddleware");

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() + "-" + file.originalname;

    cb(null, uniqueName);
  },
});

// File type validation
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP files are allowed"
      ),
      false
    );
  }
};

// Multer upload config
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 5,
  },
});

// Upload multiple images
router.post(
  "/:employeeId",
  authMiddleware,
  upload.array("images", 5),
  async (req, res) => {
    try {
      const { employeeId } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          message: "No images uploaded",
        });
      }

      const uploadedImages = [];

      for (const file of req.files) {
        const imageUrl =
          `http://localhost:5000/uploads/${file.filename}`;

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

      res.status(201).json({
        message: "Images uploaded successfully",
        images: uploadedImages,
      });
    } catch (error) {
      console.error("Upload Error:", error);

      res.status(500).json({
        message: error.message || "Server Error",
      });
    }
  }
);

// Get images by employee
router.get("/:employeeId", authMiddleware, async (req, res) => {
  try {
    const { employeeId } = req.params;

    const images = await pool.query(
      `
      SELECT *
      FROM employee_images
      WHERE employee_id = $1
      ORDER BY id ASC
      `,
      [employeeId]
    );

    res.json(images.rows);
  } catch (error) {
    console.error("Get Images Error:", error);

    res.status(500).json({
      message: "Server Error",
    });
  }
});

module.exports = router;