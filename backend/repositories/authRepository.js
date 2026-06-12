/**
 * Auth Repository
 * Database access layer for authentication and user management
 */

const pool = require("../config/db");

class AuthRepository {
  async getUserByEmail(email) {
    const query = "SELECT * FROM users WHERE email = $1";
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  async getUserByVerificationToken(token) {
    const query = "SELECT * FROM users WHERE verification_token = $1";
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  async getUserByResetToken(token) {
    const query = `
      SELECT * 
      FROM users 
      WHERE reset_token = $1 
      AND reset_token_expiry > NOW()
    `;
    const result = await pool.query(query, [token]);
    return result.rows[0] || null;
  }

  async createUser(name, email, hashedPassword, verificationToken) {
    const query = `
      INSERT INTO users (name, email, password, verification_token, role)
      VALUES ($1, $2, $3, $4, 'employee')
      RETURNING *
    `;
    const result = await pool.query(query, [name, email, hashedPassword, verificationToken]);
    return result.rows[0];
  }

  async updateUserVerification(userId) {
    const query = `
      UPDATE users 
      SET is_verified = TRUE, verification_token = NULL 
      WHERE id = $1 
      RETURNING *
    `;
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  async updateUserResetToken(email, resetToken, expiry) {
    const query = `
      UPDATE users 
      SET reset_token = $1, reset_token_expiry = $2 
      WHERE email = $3 
      RETURNING *
    `;
    const result = await pool.query(query, [resetToken, expiry, email]);
    return result.rows[0];
  }

  async updateUserPassword(userId, hashedPassword) {
    const query = `
      UPDATE users 
      SET password = $1, reset_token = NULL, reset_token_expiry = NULL 
      WHERE id = $2 
      RETURNING *
    `;
    const result = await pool.query(query, [hashedPassword, userId]);
    return result.rows[0];
  }
}

module.exports = new AuthRepository();
