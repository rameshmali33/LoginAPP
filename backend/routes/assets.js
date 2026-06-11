/**
 * Asset Routes
 * API endpoints for asset management
 */

const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assetController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// All asset routes require authentication
router.use(authMiddleware);

/**
 * GET /api/assets
 * List all assets (accessible to all authenticated users)
 * Query: page, limit, status, asset_type, sortBy, order
 */
router.get("/", assetController.getAssets);

/**
 * GET /api/assets/summary
 * Get asset status summary
 */
router.get("/summary", assetController.getAssetSummary);

/**
 * GET /api/assets/:id
 * Get single asset with allocation history
 */
router.get("/:id", assetController.getAsset);

/**
 * POST /api/assets
 * Create new asset (admin only)
 */
router.post(
  "/",
  roleMiddleware("admin"),
  assetController.createAsset
);

/**
 * PUT /api/assets/:id
 * Update asset (admin only)
 */
router.put(
  "/:id",
  roleMiddleware("admin"),
  assetController.updateAsset
);

/**
 * DELETE /api/assets/:id
 * Delete asset (admin only)
 */
router.delete(
  "/:id",
  roleMiddleware("admin"),
  assetController.deleteAsset
);

/**
 * POST /api/assets/:id/allocate
 * Allocate asset to employee (admin, manager, hr)
 */
router.post(
  "/:id/allocate",
  roleMiddleware("admin", "manager", "hr"),
  assetController.allocateAsset
);

/**
 * POST /api/assets/:id/return
 * Return asset from employee (anyone)
 */
router.post(
  "/:id/return",
  assetController.returnAsset
);

module.exports = router;
