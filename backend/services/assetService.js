/**
 * Asset Service
 * Business logic for asset management: create, allocate, return, history
 */

const assetRepository = require("../repositories/assetRepository");
const pool = require("../config/db");
const logger = require("../utils/logger");

class AssetService {
  /**
   * Get all assets with pagination
   */
  async getAssets(page = 1, limit = 10, filters = {}, sortBy = "created_at", order = "DESC") {
    const offset = (page - 1) * limit;
    const assets = await assetRepository.getAssets(
      limit,
      offset,
      filters,
      sortBy,
      order
    );
    const total = await assetRepository.getAssetCount(filters);

    return {
      data: assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get single asset with allocation history
   */
  async getAssetById(id) {
    const asset = await assetRepository.getAssetById(id);
    if (!asset) {
      throw new Error("Asset not found");
    }

    const allocations = await assetRepository.getAllocationHistory(id);
    const history = await assetRepository.getHistory(id);

    return {
      asset,
      allocations,
      history,
    };
  }

  /**
   * Create new asset
   */
  async createAsset(assetCode, assetName, assetType, purchaseDate, purchaseCost) {
    // Check for duplicate asset code
    const existing = await assetRepository.getAssetByCode(assetCode);
    if (existing) {
      throw new Error(`Asset code ${assetCode} already exists`);
    }

    const asset = await assetRepository.createAsset(
      assetCode,
      assetName,
      assetType,
      purchaseDate,
      purchaseCost,
      "available"
    );

    // Log creation
    await assetRepository.addHistory(asset.id, "CREATED", `Asset created: ${assetName}`);

    logger.info(`Asset created: ${asset.id} (${assetCode})`);
    return asset;
  }

  /**
   * Update asset
   */
  async updateAsset(id, updates) {
    const existing = await assetRepository.getAssetById(id);
    if (!existing) {
      throw new Error("Asset not found");
    }

    const asset = await assetRepository.updateAsset(id, updates);

    // Log update
    await assetRepository.addHistory(
      id,
      "UPDATED",
      `Fields updated: ${Object.keys(updates).join(", ")}`
    );

    logger.info(`Asset updated: ${id}`);
    return asset;
  }

  /**
   * Delete asset
   */
  async deleteAsset(id) {
    const existing = await assetRepository.getAssetById(id);
    if (!existing) {
      throw new Error("Asset not found");
    }

    // Check if asset is currently allocated
    const current = await assetRepository.getCurrentAllocation(id);
    if (current) {
      throw new Error("Cannot delete an allocated asset. Return it first.");
    }

    await assetRepository.deleteAsset(id);
    logger.info(`Asset deleted: ${id}`);
  }

  /**
   * Allocate asset to employee
   */
  async allocateAsset(assetId, employeeId, allocatedBy, allocatedDate, remarks = "") {
    const asset = await assetRepository.getAssetById(assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }

    if (asset.status !== "available") {
      throw new Error(`Asset status is ${asset.status}, cannot allocate`);
    }

    // Check for current allocation
    const currentAlloc = await assetRepository.getCurrentAllocation(assetId);
    if (currentAlloc) {
      throw new Error("Asset already allocated to another employee");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Create allocation
      const allocation = await assetRepository.createAllocation(
        assetId,
        employeeId,
        allocatedBy,
        allocatedDate,
        remarks
      );

      // Update asset status
      await assetRepository.updateAsset(assetId, { status: "allocated" });

      // Log to history
      await assetRepository.addHistory(
        assetId,
        "ALLOCATED",
        `Allocated to employee ${employeeId} on ${allocatedDate}`,
        allocatedBy,
        client
      );

      await client.query("COMMIT");

      logger.info(`Asset ${assetId} allocated to employee ${employeeId}`);
      return allocation;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Return asset from employee
   */
  async returnAsset(allocationId, returnDate, remarks = "", returnedBy = null) {
    // Get allocation
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Query allocation and asset details
      const allocQuery = `SELECT * FROM asset_allocations WHERE id = $1`;
      const allocResult = await client.query(allocQuery, [allocationId]);
      const allocation = allocResult.rows[0];

      if (!allocation) {
        throw new Error("Allocation not found");
      }

      if (allocation.status !== "allocated") {
        throw new Error(`Allocation status is ${allocation.status}, cannot return`);
      }

      // Return the allocation
      const returned = await assetRepository.returnAllocation(
        allocationId,
        returnDate,
        remarks,
        client
      );

      // Update asset status
      await assetRepository.updateAsset(allocation.asset_id, { status: "available" });

      // Log to history
      await assetRepository.addHistory(
        allocation.asset_id,
        "RETURNED",
        `Returned by employee ${allocation.employee_id} on ${returnDate}. Remarks: ${remarks}`,
        returnedBy,
        client
      );

      await client.query("COMMIT");

      logger.info(`Asset ${allocation.asset_id} returned from employee ${allocation.employee_id}`);
      return returned;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get assets allocated to an employee
   */
  async getEmployeeAssets(employeeId) {
    return await assetRepository.getAssetsByEmployee(employeeId);
  }

  /**
   * Get asset status summary
   */
  async getAssetSummary() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM assets
      GROUP BY status
    `;
    const result = await pool.query(query);
    const summary = {};
    result.rows.forEach((row) => {
      summary[row.status] = parseInt(row.count, 10);
    });

    return {
      total: result.rows.reduce((sum, row) => sum + parseInt(row.count, 10), 0),
      byStatus: summary,
    };
  }
}

module.exports = new AssetService();
