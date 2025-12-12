const db = require('../database/db');

class User {
  /**
   * Create a new user (legacy method for backward compatibility)
   * Note: For new code, use authController.register instead
   */
  static async create(username, displayName, email = null) {
    const result = await db.query(
      `INSERT INTO users (username, display_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, display_name, email, created_at`,
      [username, displayName, email || `${username}@temp.local`, 'legacy']
    );
    return result.rows[0];
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT id, username, email, display_name, bio, avatar_url,
              is_verified, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by username
   */
  static async findByUsername(username) {
    const result = await db.query(
      `SELECT id, username, email, display_name, bio, avatar_url,
              is_verified, is_active, created_at
       FROM users WHERE username = $1`,
      [username]
    );
    return result.rows[0] || null;
  }

  /**
   * Find user by email
   */
  static async findByEmail(email) {
    const result = await db.query(
      `SELECT id, username, email, display_name, bio, avatar_url,
              is_verified, is_active, created_at
       FROM users WHERE email = $1`,
      [email]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all users
   */
  static async getAll(limit = 100, offset = 0) {
    const result = await db.query(
      `SELECT id, username, display_name, bio, avatar_url,
              is_verified, created_at
       FROM users
       WHERE is_active = TRUE
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Get user with full stats
   */
  static async getWithStats(userId) {
    const result = await db.query(
      `SELECT
        u.id, u.username, u.email, u.display_name, u.bio, u.avatar_url,
        u.is_verified, u.created_at,
        (SELECT COUNT(*) FROM attempts WHERE user_id = u.id) as total_races,
        (SELECT COUNT(*) FROM tracks WHERE creator_id = u.id) as total_tracks,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COALESCE(MIN(duration), 0) FROM attempts WHERE user_id = u.id) as personal_best
       FROM users u
       WHERE u.id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  }

  /**
   * Update user profile
   */
  static async update(userId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['display_name', 'bio', 'avatar_url'];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);

    const result = await db.query(
      `UPDATE users
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, username, email, display_name, bio, avatar_url`,
      values
    );

    return result.rows[0] || null;
  }

  /**
   * Delete user
   */
  static async delete(userId) {
    await db.query('UPDATE users SET is_active = FALSE WHERE id = $1', [userId]);
    return true;
  }

  /**
   * Search users by username or display name
   */
  static async search(query, limit = 20) {
    const result = await db.query(
      `SELECT id, username, display_name, avatar_url, bio
       FROM users
       WHERE is_active = TRUE
         AND (username ILIKE $1 OR display_name ILIKE $1)
       ORDER BY username
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }
}

module.exports = User;
