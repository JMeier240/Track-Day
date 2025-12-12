const db = require('../database/db');

class Challenge {
  /**
   * Create a new challenge
   */
  static async create({ trackId, challengerId, challengedId = null, challengeType = 'open', expiresAt = null }) {
    const result = await db.query(
      `INSERT INTO challenges (track_id, challenger_id, challenged_id, challenge_type, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, track_id, challenger_id, challenged_id, challenge_type, status, best_time, expires_at, created_at`,
      [trackId, challengerId, challengedId, challengeType, expiresAt]
    );

    const challenge = result.rows[0];

    // Create activity for challenge
    await db.query(
      `INSERT INTO activities (user_id, activity_type, entity_type, entity_id, metadata)
       VALUES ($1, 'challenge_issued', 'challenge', $2, $3)`,
      [challengerId, challenge.id, JSON.stringify({ track_id: trackId, challenged_id: challengedId, type: challengeType })]
    );

    // Notify challenged user if direct challenge
    if (challengedId) {
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, link)
         VALUES ($1, 'challenge', 'New Challenge!', $2, $3)`,
        [challengedId, `You've been challenged!`, `/challenges/${challenge.id}`]
      );
    }

    return challenge;
  }

  /**
   * Find challenge by ID
   */
  static async findById(id) {
    const result = await db.query(
      `SELECT c.*,
              t.name as track_name, t.distance, t.activity_type,
              u1.username as challenger_username, u1.display_name as challenger_name,
              u2.username as challenged_username, u2.display_name as challenged_name
       FROM challenges c
       JOIN tracks t ON c.track_id = t.id
       JOIN users u1 ON c.challenger_id = u1.id
       LEFT JOIN users u2 ON c.challenged_id = u2.id
       WHERE c.id = $1`,
      [id]
    );

    return result.rows[0] || null;
  }

  /**
   * Get all active challenges
   */
  static async getActive(limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT c.*,
              t.name as track_name, t.distance, t.activity_type,
              u.username as challenger_username, u.display_name as challenger_name
       FROM challenges c
       JOIN tracks t ON c.track_id = t.id
       JOIN users u ON c.challenger_id = u.id
       WHERE c.status = 'active'
         AND (c.expires_at IS NULL OR c.expires_at > NOW())
       ORDER BY c.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows;
  }

  /**
   * Get challenges by user (as challenger or challenged)
   */
  static async getByUser(userId, limit = 50, offset = 0) {
    const result = await db.query(
      `SELECT c.*,
              t.name as track_name, t.distance, t.activity_type,
              u1.username as challenger_username, u1.display_name as challenger_name,
              u2.username as challenged_username, u2.display_name as challenged_name
       FROM challenges c
       JOIN tracks t ON c.track_id = t.id
       JOIN users u1 ON c.challenger_id = u1.id
       LEFT JOIN users u2 ON c.challenged_id = u2.id
       WHERE c.challenger_id = $1 OR c.challenged_id = $1
       ORDER BY c.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    return result.rows;
  }

  /**
   * Get challenges for a specific track
   */
  static async getByTrack(trackId, limit = 20) {
    const result = await db.query(
      `SELECT c.*,
              u1.username as challenger_username, u1.display_name as challenger_name,
              u2.username as challenged_username, u2.display_name as challenged_name
       FROM challenges c
       JOIN users u1 ON c.challenger_id = u1.id
       LEFT JOIN users u2 ON c.challenged_id = u2.id
       WHERE c.track_id = $1 AND c.status = 'active'
       ORDER BY c.created_at DESC
       LIMIT $2`,
      [trackId, limit]
    );

    return result.rows;
  }

  /**
   * Update challenge best time
   */
  static async updateBestTime(id, bestTime) {
    const result = await db.query(
      'UPDATE challenges SET best_time = $1 WHERE id = $2 RETURNING *',
      [bestTime, id]
    );

    return result.rows[0] || null;
  }

  /**
   * Update challenge status
   */
  static async updateStatus(id, status) {
    const result = await db.query(
      'UPDATE challenges SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length > 0) {
      const challenge = result.rows[0];

      // Create activity for challenge completion
      if (status === 'completed') {
        await db.query(
          `INSERT INTO activities (user_id, activity_type, entity_type, entity_id, metadata)
           VALUES ($1, 'challenge_completed', 'challenge', $2, $3)`,
          [challenge.challenger_id, challenge.id, JSON.stringify({ best_time: challenge.best_time })]
        );
      }
    }

    return result.rows[0] || null;
  }

  /**
   * Accept a challenge (for direct challenges)
   */
  static async accept(challengeId, userId) {
    // Verify user is the challenged party
    const challenge = await this.findById(challengeId);

    if (!challenge || challenge.challenged_id !== userId) {
      throw new Error('Unauthorized');
    }

    const result = await db.query(
      `UPDATE challenges SET status = 'accepted' WHERE id = $1 RETURNING *`,
      [challengeId]
    );

    // Notify challenger
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'challenge', 'Challenge Accepted!', $2, $3)`,
      [challenge.challenger_id, `Your challenge was accepted!`, `/challenges/${challengeId}`]
    );

    return result.rows[0] || null;
  }

  /**
   * Decline a challenge
   */
  static async decline(challengeId, userId) {
    const challenge = await this.findById(challengeId);

    if (!challenge || challenge.challenged_id !== userId) {
      throw new Error('Unauthorized');
    }

    const result = await db.query(
      `UPDATE challenges SET status = 'declined' WHERE id = $1 RETURNING *`,
      [challengeId]
    );

    // Notify challenger
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, link)
       VALUES ($1, 'challenge', 'Challenge Declined', $2, $3)`,
      [challenge.challenger_id, `Your challenge was declined.`, `/challenges/${challengeId}`]
    );

    return result.rows[0] || null;
  }

  /**
   * Delete challenge
   */
  static async delete(challengeId) {
    await db.query('DELETE FROM challenges WHERE id = $1', [challengeId]);
    return true;
  }

  /**
   * Get expired challenges (for cleanup)
   */
  static async getExpired() {
    const result = await db.query(
      `SELECT * FROM challenges
       WHERE status = 'active'
         AND expires_at IS NOT NULL
         AND expires_at < NOW()`
    );

    return result.rows;
  }

  /**
   * Clean up expired challenges
   */
  static async cleanupExpired() {
    const result = await db.query(
      `UPDATE challenges
       SET status = 'expired'
       WHERE status = 'active'
         AND expires_at IS NOT NULL
         AND expires_at < NOW()
       RETURNING id`
    );

    return result.rows.length;
  }
}

module.exports = Challenge;
