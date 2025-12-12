const db = require('../database/db');

class Attempt {
  /**
   * Create a new attempt
   */
  static async create({ trackId, userId, duration, gpsData }) {
    // Calculate speeds
    const speeds = gpsData.map((point) => point.speed || 0).filter((s) => s > 0);
    const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
    const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;

    const result = await db.query(
      `INSERT INTO attempts (track_id, user_id, duration, gps_data, average_speed, max_speed)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, track_id, user_id, duration, gps_data, average_speed, max_speed, created_at`,
      [trackId, userId, duration, JSON.stringify(gpsData), averageSpeed, maxSpeed]
    );

    const attempt = result.rows[0];
    attempt.gps_data = JSON.parse(attempt.gps_data);

    // Create activity for attempt
    await db.query(
      `INSERT INTO activities (user_id, activity_type, entity_type, entity_id, metadata)
       VALUES ($1, 'run_completed', 'attempt', $2, $3)`,
      [userId, attempt.id, JSON.stringify({ track_id: trackId, duration })]
    );

    // Check if this is a personal best for this track
    const pb = await db.query(
      `SELECT MIN(duration) as best_time
       FROM attempts
       WHERE user_id = $1 AND track_id = $2`,
      [userId, trackId]
    );

    if (pb.rows[0].best_time === duration) {
      // This is a personal best!
      await db.query(
        `INSERT INTO activities (user_id, activity_type, entity_type, entity_id, metadata)
         VALUES ($1, 'personal_best', 'attempt', $2, $3)`,
        [userId, attempt.id, JSON.stringify({ track_id: trackId, duration, is_new: true })]
      );

      // Check for achievements
      await this.checkAchievements(userId);
    }

    return attempt;
  }

  /**
   * Find attempt by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT a.*, u.username, u.display_name, t.name as track_name
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       JOIN tracks t ON a.track_id = t.id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;

    const attempt = result.rows[0];
    attempt.gps_data = JSON.parse(attempt.gps_data);
    return attempt;
  }

  /**
   * Get attempts by track
   */
  static async getByTrack(trackId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT a.*, u.username, u.display_name, u.avatar_url
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       WHERE a.track_id = $1
       ORDER BY a.duration ASC
       LIMIT $2 OFFSET $3`,
      [trackId, limit, offset]
    );

    return result.rows.map((attempt) => ({
      ...attempt,
      gps_data: JSON.parse(attempt.gps_data),
    }));
  }

  /**
   * Get attempts by user
   */
  static async getByUser(userId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT a.*, t.name as track_name, t.distance, t.activity_type
       FROM attempts a
       JOIN tracks t ON a.track_id = t.id
       WHERE a.user_id = $1
       ORDER BY a.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows.map((attempt) => ({
      ...attempt,
      gps_data: JSON.parse(attempt.gps_data),
    }));
  }

  /**
   * Get leaderboard for a track
   */
  static async getLeaderboard(trackId, limit = 10) {
    const result = await db.query(
      `SELECT DISTINCT ON (a.user_id)
              a.*, u.username, u.display_name, u.avatar_url
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       WHERE a.track_id = $1
       ORDER BY a.user_id, a.duration ASC
       LIMIT $2`,
      [trackId, limit]
    );

    // Re-sort by duration after getting best per user
    const sorted = result.rows.sort((a, b) => a.duration - b.duration);

    return sorted.map((attempt) => ({
      ...attempt,
      gps_data: JSON.parse(attempt.gps_data),
    }));
  }

  /**
   * Get user's personal best for a track
   */
  static async getPersonalBest(userId, trackId) {
    const result = await db.query(
      `SELECT * FROM attempts
       WHERE user_id = $1 AND track_id = $2
       ORDER BY duration ASC
       LIMIT 1`,
      [userId, trackId]
    );

    if (result.rows.length === 0) return null;

    const attempt = result.rows[0];
    attempt.gps_data = JSON.parse(attempt.gps_data);
    return attempt;
  }

  /**
   * Get recent attempts (global feed)
   */
  static async getRecent(limit = 20) {
    const result = await db.query(
      `SELECT a.*, u.username, u.display_name, u.avatar_url,
              t.name as track_name, t.distance, t.activity_type
       FROM attempts a
       JOIN users u ON a.user_id = u.id
       JOIN tracks t ON a.track_id = t.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map((attempt) => ({
      ...attempt,
      gps_data: JSON.parse(attempt.gps_data),
    }));
  }

  /**
   * Delete attempt
   */
  static async delete(attemptId) {
    await db.query('DELETE FROM attempts WHERE id = $1', [attemptId]);
    return true;
  }

  /**
   * Check and award achievements
   */
  static async checkAchievements(userId) {
    // Get user's race count
    const countResult = await db.query(
      'SELECT COUNT(*) as count FROM attempts WHERE user_id = $1',
      [userId]
    );
    const raceCount = parseInt(countResult.rows[0].count);

    // Achievement milestones
    const achievements = {
      1: 'first_race',
      10: 'ten_races',
      50: 'fifty_races',
      100: 'hundred_races',
    };

    const achievementCode = achievements[raceCount];

    if (achievementCode) {
      // Award achievement
      const achievement = await db.query(
        'SELECT id FROM achievements WHERE code = $1',
        [achievementCode]
      );

      if (achievement.rows.length > 0) {
        await db.query(
          `INSERT INTO user_achievements (user_id, achievement_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, achievement_id) DO NOTHING`,
          [userId, achievement.rows[0].id]
        );

        // Create activity
        await db.query(
          `INSERT INTO activities (user_id, activity_type, entity_type, metadata)
           VALUES ($1, 'achievement_earned', 'achievement', $2)`,
          [userId, JSON.stringify({ achievement_code: achievementCode, race_count: raceCount })]
        );
      }
    }
  }
}

module.exports = Attempt;
