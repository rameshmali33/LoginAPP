
const assetRepository = require("../repositories/assetRepository");
const pool = require("../config/db");
const logger = require("../utils/logger");
const notificationService = require("./notificationService");

class AssetService {
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

  async createAsset(assetCode, assetName, assetType, purchaseDate, purchaseCost) {
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

    await assetRepository.addHistory(asset.id, "CREATED", `Asset created: ${assetName}`);

    logger.info(`Asset created: ${asset.id} (${assetCode})`);
    return asset;
  }

  async updateAsset(id, updates) {
    const existing = await assetRepository.getAssetById(id);
    if (!existing) {
      throw new Error("Asset not found");
    }

    const asset = await assetRepository.updateAsset(id, updates);

    await assetRepository.addHistory(
      id,
      "UPDATED",
      `Fields updated: ${Object.keys(updates).join(", ")}`
    );

    logger.info(`Asset updated: ${id}`);

    if (updates.status && updates.status !== existing.status) {
      await notificationService.notifyRoles(
        ["admin", "hr", "manager"],
        "Asset Status Updated",
        `${asset.asset_name} status changed from ${existing.status} to ${updates.status}.`,
        "asset",
        asset.id
      );
    }

    return asset;
  }

  async deleteAsset(id) {
    const existing = await assetRepository.getAssetById(id);
    if (!existing) {
      throw new Error("Asset not found");
    }

    const current = await assetRepository.getCurrentAllocation(id);
    if (current) {
      throw new Error("Cannot delete an allocated asset. Return it first.");
    }

    await assetRepository.deleteAsset(id);
    logger.info(`Asset deleted: ${id}`);
  }

  async allocateAsset(assetId, employeeId, allocatedBy, allocatedDate, remarks = "") {
    const asset = await assetRepository.getAssetById(assetId);
    if (!asset) {
      throw new Error("Asset not found");
    }

    if (asset.status !== "available") {
      throw new Error(`Asset status is ${asset.status}, cannot allocate`);
    }

    const currentAlloc = await assetRepository.getCurrentAllocation(assetId);
    if (currentAlloc) {
      throw new Error("Asset already allocated to another employee");
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const allocation = await assetRepository.createAllocation(
        assetId,
        employeeId,
        allocatedBy,
        allocatedDate,
        remarks
      );

      await assetRepository.updateAsset(assetId, { status: "allocated" });

      await assetRepository.addHistory(
        assetId,
        "ALLOCATED",
        `Allocated to employee ${employeeId} on ${allocatedDate}`,
        allocatedBy,
        client
      );

      await client.query("COMMIT");

      logger.info(`Asset ${assetId} allocated to employee ${employeeId}`);
      await notificationService.safeNotifyEmployeeByProfileId(
        employeeId,
        "Asset Allocated",
        `${asset.asset_name} has been allocated to you on ${allocatedDate}.`,
        "asset",
        assetId
      );
      return allocation;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async returnAsset(allocationId, returnDate, remarks = "", returnedBy = null) {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const allocQuery = `SELECT * FROM asset_allocations WHERE id = $1`;
      const allocResult = await client.query(allocQuery, [allocationId]);
      const allocation = allocResult.rows[0];

      if (!allocation) {
        throw new Error("Allocation not found");
      }

      if (allocation.status !== "allocated") {
        throw new Error(`Allocation status is ${allocation.status}, cannot return`);
      }

      const returned = await assetRepository.returnAllocation(
        allocationId,
        returnDate,
        remarks,
        client
      );

      await assetRepository.updateAsset(allocation.asset_id, { status: "available" });

      await assetRepository.addHistory(
        allocation.asset_id,
        "RETURNED",
        `Returned by employee ${allocation.employee_id} on ${returnDate}. Remarks: ${remarks}`,
        returnedBy,
        client
      );

      await client.query("COMMIT");

      logger.info(`Asset ${allocation.asset_id} returned from employee ${allocation.employee_id}`);
      await notificationService.safeNotifyEmployeeByProfileId(
        allocation.employee_id,
        "Asset Returned",
        `Your allocated asset has been marked as returned on ${returnDate}.`,
        "asset",
        allocation.asset_id
      );
      return returned;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getEmployeeAssets(employeeId) {
    return await assetRepository.getAssetsByEmployee(employeeId);
  }

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
