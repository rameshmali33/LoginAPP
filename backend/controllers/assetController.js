
const assetService = require("../services/assetService");
const { assetCreateSchema, assetUpdateSchema, assetAllocationSchema, assetReturnSchema } = require("../validators/validators");
const logger = require("../utils/logger");

class AssetController {
  getAssets = async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status, asset_type, sortBy = "created_at", order = "DESC" } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (asset_type) filters.asset_type = asset_type;

      const result = await assetService.getAssets(
        parseInt(page, 10),
        parseInt(limit, 10),
        filters,
        sortBy,
        order
      );

      res.json({
        success: true,
        message: "Assets retrieved successfully",
        ...result,
      });
    } catch (error) {
      logger.error("Get Assets Error:", error);
      next(error);
    }
  };

  getAsset = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await assetService.getAssetById(parseInt(id, 10));

      res.json({
        success: true,
        message: "Asset retrieved successfully",
        ...result,
      });
    } catch (error) {
      if (error.message.includes("not found")) {
        error.statusCode = 404;
      }
      logger.error("Get Asset Error:", error);
      next(error);
    }
  };

  createAsset = async (req, res, next) => {
    try {
      const { error, value } = assetCreateSchema.validate(req.body);
      if (error) {
        const err = new Error("Validation Error");
        err.isJoi = true;
        err.details = error.details;
        err.statusCode = 400;
        return next(err);
      }

      const asset = await assetService.createAsset(
        value.asset_code,
        value.asset_name,
        value.asset_type,
        value.purchase_date,
        value.purchase_cost
      );

      res.status(201).json({
        success: true,
        message: "Asset created successfully",
        asset,
      });
    } catch (error) {
      logger.error("Create Asset Error:", error);
      error.statusCode = 400;
      next(error);
    }
  };

  updateAsset = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { error, value } = assetUpdateSchema.validate(req.body);
      if (error) {
        const err = new Error("Validation Error");
        err.isJoi = true;
        err.details = error.details;
        err.statusCode = 400;
        return next(err);
      }

      const asset = await assetService.updateAsset(parseInt(id, 10), value);

      res.json({
        success: true,
        message: "Asset updated successfully",
        asset,
      });
    } catch (error) {
      if (error.message.includes("not found")) {
        error.statusCode = 404;
      } else {
        error.statusCode = 400;
      }
      logger.error("Update Asset Error:", error);
      next(error);
    }
  };

  deleteAsset = async (req, res, next) => {
    try {
      const { id } = req.params;
      await assetService.deleteAsset(parseInt(id, 10));

      res.json({
        success: true,
        message: "Asset deleted successfully",
      });
    } catch (error) {
      if (error.message.includes("not found")) {
        error.statusCode = 404;
      } else {
        error.statusCode = 400;
      }
      logger.error("Delete Asset Error:", error);
      next(error);
    }
  };

  allocateAsset = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { error, value } = assetAllocationSchema.validate(req.body);
      if (error) {
        const err = new Error("Validation Error");
        err.isJoi = true;
        err.details = error.details;
        err.statusCode = 400;
        return next(err);
      }

      const allocation = await assetService.allocateAsset(
        parseInt(id, 10),
        value.employee_id,
        req.user.id,
        value.allocated_date,
        value.remarks || ""
      );

      res.status(201).json({
        success: true,
        message: "Asset allocated successfully",
        allocation,
      });
    } catch (error) {
      error.statusCode = error.message.includes("not found") ? 404 : 400;
      logger.error("Allocate Asset Error:", error);
      next(error);
    }
  };

  returnAsset = async (req, res, next) => {
    try {
      const { id } = req.params; // allocation_id
      const { error, value } = assetReturnSchema.validate(req.body);
      if (error) {
        const err = new Error("Validation Error");
        err.isJoi = true;
        err.details = error.details;
        err.statusCode = 400;
        return next(err);
      }

      const returned = await assetService.returnAsset(
        parseInt(id, 10),
        value.return_date,
        value.remarks || "",
        req.user.id
      );

      res.json({
        success: true,
        message: "Asset returned successfully",
        allocation: returned,
      });
    } catch (error) {
      error.statusCode = error.message.includes("not found") ? 404 : 400;
      logger.error("Return Asset Error:", error);
      next(error);
    }
  };

  getAssetSummary = async (req, res, next) => {
    try {
      const summary = await assetService.getAssetSummary();
      res.json({
        success: true,
        message: "Asset summary retrieved successfully",
        ...summary,
      });
    } catch (error) {
      logger.error("Get Asset Summary Error:", error);
      next(error);
    }
  };
}

module.exports = new AssetController();
