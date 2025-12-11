const db = require('./database');
const { nanoid } = require('nanoid');

class Attempt {
  static create({ trackId, userId, duration, gpsData }) {
    const id = nanoid();
    const stmt = db.prepare(
      'INSERT INTO attempts (id, track_id, user_id, duration, gps_data) VALUES (?, ?, ?, ?, ?)'
    );
    stmt.run(id, trackId, userId, duration, JSON.stringify(gpsData));
    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM attempts WHERE id = ?');
    const attempt = stmt.get(id);
    if (attempt) {
      attempt.gps_data = JSON.parse(attempt.gps_data);
    }
    return attempt;
  }

  static getByTrack(trackId) {
    const stmt = db.prepare(
      'SELECT * FROM attempts WHERE track_id = ? ORDER BY duration ASC'
    );
    const attempts = stmt.all(trackId);
    return attempts.map((attempt) => ({
      ...attempt,
      gps_data: JSON.parse(attempt.gps_data),
    }));
  }

  static getByUser(userId) {
    const stmt = db.prepare('SELECT * FROM attempts WHERE user_id = ? ORDER BY timestamp DESC');
    const attempts = stmt.all(userId);
    return attempts.map((attempt) => ({
      ...attempt,
      gps_data: JSON.parse(attempt.gps_data),
    }));
  }

  static getLeaderboard(trackId, limit = 10) {
    const stmt = db.prepare(`
      SELECT a.*, u.username, u.display_name
      FROM attempts a
      JOIN users u ON a.user_id = u.id
      WHERE a.track_id = ?
      ORDER BY a.duration ASC
      LIMIT ?
    `);
    const attempts = stmt.all(trackId, limit);
    return attempts.map((attempt) => ({
      ...attempt,
      gps_data: JSON.parse(attempt.gps_data),
    }));
  }
}

module.exports = Attempt;
