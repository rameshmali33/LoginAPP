
const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assetController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

router.use(authMiddleware);

router.get("/", assetController.getAssets);

router.get("/summary", assetController.getAssetSummary);

router.get("/:id", assetController.getAsset);

router.post(
  "/",
  roleMiddleware("admin"),
  assetController.createAsset
);

router.put(
  "/:id",
  roleMiddleware("admin"),
  assetController.updateAsset
);

router.delete(
  "/:id",
  roleMiddleware("admin"),
  assetController.deleteAsset
);

router.post(
  "/:id/allocate",
  roleMiddleware("admin", "manager", "hr"),
  assetController.allocateAsset
);

router.post(
  "/:id/return",
  assetController.returnAsset
);

module.exports = router;
