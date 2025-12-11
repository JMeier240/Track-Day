const db = require('./database');
const { nanoid } = require('nanoid');

class Challenge {
  static create({ trackId, challengerId, challengedId, challengeType, expiresAt }) {
    const id = nanoid();
    const stmt = db.prepare(
      'INSERT INTO challenges (id, track_id, challenger_id, challenged_id, challenge_type, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, trackId, challengerId, challengedId || null, challengeType, expiresAt || null);
    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM challenges WHERE id = ?');
    return stmt.get(id);
  }

  static getActive() {
    const now = Math.floor(Date.now() / 1000);
    const stmt = db.prepare(`
      SELECT c.*, t.name as track_name, u.username as challenger_name
      FROM challenges c
      JOIN tracks t ON c.track_id = t.id
      JOIN users u ON c.challenger_id = u.id
      WHERE c.status = 'active' AND (c.expires_at IS NULL OR c.expires_at > ?)
      ORDER BY c.created_at DESC
    `);
    return stmt.all(now);
  }

  static getByUser(userId) {
    const stmt = db.prepare(`
      SELECT c.*, t.name as track_name
      FROM challenges c
      JOIN tracks t ON c.track_id = t.id
      WHERE c.challenger_id = ? OR c.challenged_id = ?
      ORDER BY c.created_at DESC
    `);
    return stmt.all(userId, userId);
  }

  static updateBestTime(id, bestTime) {
    const stmt = db.prepare('UPDATE challenges SET best_time = ? WHERE id = ?');
    stmt.run(bestTime, id);
  }

  static updateStatus(id, status) {
    const stmt = db.prepare('UPDATE challenges SET status = ? WHERE id = ?');
    stmt.run(status, id);
  }
}

module.exports = Challenge;
