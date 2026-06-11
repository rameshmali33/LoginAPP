/**
 * Asset Repository
 * Direct SQL queries for asset operations
 */

const pool = require("../config/db");

class AssetRepository {
  /**
   * Get all assets with pagination, filtering, sorting
   */
  async getAssets(
    limit = 10,
    offset = 0,
    filters = {},
    sortBy = "created_at",
    order = "DESC"
  ) {
    let query = "SELECT * FROM assets WHERE 1=1";
    const params = [];

    // Filter by status
    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    // Filter by asset type
    if (filters.asset_type) {
      params.push(filters.asset_type);
      query += ` AND asset_type ILIKE $${params.length}`;
    }

    // Safe sorting (whitelist known columns)
    const validColumns = [
      "id",
      "asset_code",
      "asset_name",
      "status",
      "purchase_date",
      "purchase_cost",
      "created_at",
    ];
    const sortColumn = validColumns.includes(sortBy) ? sortBy : "created_at";
    const orderDir = order.toUpperCase() === "ASC" ? "ASC" : "DESC";
    query += ` ORDER BY ${sortColumn} ${orderDir}`;

    // Pagination
    params.push(limit);
    params.push(offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get total asset count
   */
  async getAssetCount(filters = {}) {
    let query = "SELECT COUNT(*) as count FROM assets WHERE 1=1";
    const params = [];

    if (filters.status) {
      params.push(filters.status);
      query += ` AND status = $${params.length}`;
    }

    if (filters.asset_type) {
      params.push(filters.asset_type);
      query += ` AND asset_type ILIKE $${params.length}`;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get single asset by ID
   */
  async getAssetById(id) {
    const query = "SELECT * FROM assets WHERE id = $1";
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Get asset by code
   */
  async getAssetByCode(code) {
    const query = "SELECT * FROM assets WHERE asset_code = $1";
    const result = await pool.query(query, [code]);
    return result.rows[0] || null;
  }

  /**
   * Create asset
   */
  async createAsset(assetCode, assetName, assetType, purchaseDate, purchaseCost, status = "available") {
    const query = `
      INSERT INTO assets (asset_code, asset_name, asset_type, purchase_date, purchase_cost, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const result = await pool.query(query, [
      assetCode,
      assetName,
      assetType,
      purchaseDate,
      purchaseCost,
      status,
    ]);
    return result.rows[0];
  }

  /**
   * Update asset
   */
  async updateAsset(id, updates) {
    const allowedFields = [
      "asset_code",
      "asset_name",
      "asset_type",
      "purchase_date",
      "purchase_cost",
      "status",
    ];
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return this.getAssetById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `UPDATE assets SET ${fields.join(", ")} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete asset
   */
  async deleteAsset(id) {
    const query = "DELETE FROM assets WHERE id = $1";
    await pool.query(query, [id]);
  }

  /**
   * Get asset allocation history
   */
  async getAllocationHistory(assetId) {
    const query = `
      SELECT 
        aa.id,
        aa.asset_id,
        aa.employee_id,
        ep.user_id,
        u.name as employee_name,
        aa.allocated_by,
        ub.name as allocated_by_name,
        aa.allocated_date,
        aa.return_date,
        aa.status,
        aa.remarks,
        aa.created_at
      FROM asset_allocations aa
      JOIN employee_profiles ep ON aa.employee_id = ep.id
      JOIN users u ON ep.user_id = u.id
      LEFT JOIN users ub ON aa.allocated_by = ub.id
      WHERE aa.asset_id = $1
      ORDER BY aa.created_at DESC
    `;
    const result = await pool.query(query, [assetId]);
    return result.rows;
  }

  /**
   * Create asset allocation
   */
  async createAllocation(
    assetId,
    employeeId,
    allocatedBy,
    allocatedDate,
    remarks = ""
  ) {
    const query = `
      INSERT INTO asset_allocations (asset_id, employee_id, allocated_by, allocated_date, remarks, status)
      VALUES ($1, $2, $3, $4, $5, 'allocated')
      RETURNING *
    `;
    const result = await pool.query(query, [
      assetId,
      employeeId,
      allocatedBy,
      allocatedDate,
      remarks,
    ]);
    return result.rows[0];
  }

  /**
   * Return asset allocation
   */
  async returnAllocation(allocationId, returnDate, remarks = "", client = null) {
    const db = client || pool;
    const query = `
      UPDATE asset_allocations 
      SET return_date = $1, status = 'returned', remarks = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await db.query(query, [returnDate, remarks, allocationId]);
    return result.rows[0];
  }

  /**
   * Get current allocation for asset
   */
  async getCurrentAllocation(assetId) {
    const query = `
      SELECT * FROM asset_allocations 
      WHERE asset_id = $1 AND status = 'allocated'
      LIMIT 1
    `;
    const result = await pool.query(query, [assetId]);
    return result.rows[0] || null;
  }

  /**
   * Add asset history record
   */
  async addHistory(assetId, action, remarks = "", createdBy = null, client = null) {
    const db = client || pool;
    const query = `
      INSERT INTO asset_history (asset_id, action, remarks, created_by)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const result = await db.query(query, [assetId, action, remarks, createdBy]);
    return result.rows[0];
  }

  /**
   * Get asset history
   */
  async getHistory(assetId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        ah.*,
        u.name as created_by_name
      FROM asset_history ah
      LEFT JOIN users u ON ah.created_by = u.id
      WHERE ah.asset_id = $1
      ORDER BY ah.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const result = await pool.query(query, [assetId, limit, offset]);
    return result.rows;
  }

  /**
   * Get assets by employee
   */
  async getAssetsByEmployee(employeeId) {
    const query = `
      SELECT 
        a.*,
        aa.id as allocation_id,
        aa.allocated_date,
        aa.return_date,
        aa.status as allocation_status
      FROM assets a
      JOIN asset_allocations aa ON a.id = aa.asset_id
      WHERE aa.employee_id = $1 AND aa.status = 'allocated'
      ORDER BY aa.allocated_date DESC
    `;
    const result = await pool.query(query, [employeeId]);
    return result.rows;
  }
}

module.exports = new AssetRepository();
