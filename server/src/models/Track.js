const db = require('../database/db');

/**
 * Helper function to safely parse waypoints
 * PostgreSQL JSONB fields are already parsed by node-postgres
 */
function parseWaypoints(waypoints) {
  if (typeof waypoints === 'string') {
    return JSON.parse(waypoints);
  }
  return waypoints; // Already parsed by PostgreSQL
}

class Track {
  /**
   * Create a new track
   */
  static async create({ name, description, creatorId, waypoints, distance, activityType, difficulty = null, isPublic = true }) {
    const result = await db.query(
      `INSERT INTO tracks (name, description, creator_id, waypoints, distance, activity_type, difficulty, is_public)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, name, description, creator_id, waypoints, distance, activity_type, difficulty, is_public, is_verified, created_at`,
      [name, description, creatorId, JSON.stringify(waypoints), distance, activityType, difficulty, isPublic]
    );

    const track = result.rows[0];
    track.waypoints = parseWaypoints(track.waypoints);

    // Create activity for track creation
    await db.query(
      `INSERT INTO activities (user_id, activity_type, entity_type, entity_id, metadata)
       VALUES ($1, 'track_created', 'track', $2, $3)`,
      [creatorId, track.id, JSON.stringify({ track_name: name, distance, activity_type: activityType })]
    );

    return track;
  }

  /**
   * Find track by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT t.*, u.username as creator_username, u.display_name as creator_name
       FROM tracks t
       JOIN users u ON t.creator_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const track = result.rows[0];
    track.waypoints = parseWaypoints(track.waypoints);
    return track;
  }

  /**
   * Get all public tracks
   */
  static async getAll(limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT t.*, u.username as creator_username, u.display_name as creator_name,
              (SELECT AVG(rating) FROM track_ratings WHERE track_id = t.id) as average_rating,
              (SELECT COUNT(*) FROM track_ratings WHERE track_id = t.id) as rating_count
       FROM tracks t
       JOIN users u ON t.creator_id = u.id
       WHERE t.is_public = TRUE
       ORDER BY t.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map((track) => ({
      ...track,
      waypoints: parseWaypoints(track.waypoints),
      average_rating: track.average_rating ? parseFloat(track.average_rating) : null,
      rating_count: parseInt(track.rating_count),
    }));
  }

  /**
   * Get tracks by creator
   */
  static async getByCreator(creatorId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT t.*,
              (SELECT AVG(rating) FROM track_ratings WHERE track_id = t.id) as average_rating,
              (SELECT COUNT(*) FROM track_ratings WHERE track_id = t.id) as rating_count
       FROM tracks t
       WHERE t.creator_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [creatorId, limit, offset]
    );

    return result.rows.map((track) => ({
      ...track,
      waypoints: parseWaypoints(track.waypoints),
      average_rating: track.average_rating ? parseFloat(track.average_rating) : null,
      rating_count: parseInt(track.rating_count),
    }));
  }

  /**
   * Search tracks by name or description
   */
  static async search(query, activityType = null, limit = 50) {
    let sql = `
      SELECT t.*, u.username as creator_username, u.display_name as creator_name,
             (SELECT AVG(rating) FROM track_ratings WHERE track_id = t.id) as average_rating,
             (SELECT COUNT(*) FROM track_ratings WHERE track_id = t.id) as rating_count
      FROM tracks t
      JOIN users u ON t.creator_id = u.id
      WHERE t.is_public = TRUE
        AND (t.name ILIKE $1 OR t.description ILIKE $1)
    `;

    const params = [`%${query}%`];

    if (activityType) {
      sql += ` AND t.activity_type = $2`;
      params.push(activityType);
    }

    sql += ` ORDER BY t.created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);

    const result = await db.query(sql, params);

    return result.rows.map((track) => ({
      ...track,
      waypoints: parseWaypoints(track.waypoints),
      average_rating: track.average_rating ? parseFloat(track.average_rating) : null,
      rating_count: parseInt(track.rating_count),
    }));
  }

  /**
   * Get tracks by activity type
   */
  static async getByActivityType(activityType, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT t.*, u.username as creator_username, u.display_name as creator_name,
              (SELECT AVG(rating) FROM track_ratings WHERE track_id = t.id) as average_rating
       FROM tracks t
       JOIN users u ON t.creator_id = u.id
       WHERE t.activity_type = $1 AND t.is_public = TRUE
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [activityType, limit, offset]
    );

    return result.rows.map((track) => ({
      ...track,
      waypoints: parseWaypoints(track.waypoints),
      average_rating: track.average_rating ? parseFloat(track.average_rating) : null,
    }));
  }

  /**
   * Get trending tracks (most attempts in last 7 days)
   */
  static async getTrending(limit = 10) {
    const result = await db.query(
      `SELECT t.*, u.username as creator_username, u.display_name as creator_name,
              COUNT(a.id) as recent_attempts,
              (SELECT AVG(rating) FROM track_ratings WHERE track_id = t.id) as average_rating
       FROM tracks t
       JOIN users u ON t.creator_id = u.id
       LEFT JOIN attempts a ON t.id = a.track_id
         AND a.created_at > NOW() - INTERVAL '7 days'
       WHERE t.is_public = TRUE
       GROUP BY t.id, u.username, u.display_name
       ORDER BY recent_attempts DESC, t.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((track) => ({
      ...track,
      waypoints: parseWaypoints(track.waypoints),
      recent_attempts: parseInt(track.recent_attempts),
      average_rating: track.average_rating ? parseFloat(track.average_rating) : null,
    }));
  }

  /**
   * Update track
   */
  static async update(trackId, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const allowedFields = ['name', 'description', 'difficulty', 'is_public'];

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${paramCount++}`);
        values.push(updates[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(trackId);

    const result = await db.query(
      `UPDATE tracks
       SET ${fields.join(', ')}
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) return null;

    const track = result.rows[0];
    track.waypoints = parseWaypoints(track.waypoints);
    return track;
  }

  /**
   * Delete track
   */
  static async delete(trackId) {
    await db.query('DELETE FROM tracks WHERE id = $1', [trackId]);
    return true;
  }

  /**
   * Get track with full details (including stats)
   */
  static async getWithDetails(trackId) {
    const result = await db.query(
      `SELECT t.*, u.username as creator_username, u.display_name as creator_name,
              u.avatar_url as creator_avatar,
              (SELECT COUNT(*) FROM attempts WHERE track_id = t.id) as total_attempts,
              (SELECT MIN(duration) FROM attempts WHERE track_id = t.id) as best_time,
              (SELECT AVG(rating) FROM track_ratings WHERE track_id = t.id) as average_rating,
              (SELECT COUNT(*) FROM track_ratings WHERE track_id = t.id) as rating_count,
              (SELECT COUNT(*) FROM track_favorites WHERE track_id = t.id) as favorites_count
       FROM tracks t
       JOIN users u ON t.creator_id = u.id
       WHERE t.id = $1`,
      [trackId]
    );

    if (result.rows.length === 0) return null;

    const track = result.rows[0];
    track.waypoints = parseWaypoints(track.waypoints);
    track.total_attempts = parseInt(track.total_attempts);
    track.rating_count = parseInt(track.rating_count);
    track.favorites_count = parseInt(track.favorites_count);
    track.average_rating = track.average_rating ? parseFloat(track.average_rating) : null;

    return track;
  }
}

module.exports = Track;
