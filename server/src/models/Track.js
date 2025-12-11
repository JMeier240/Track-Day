const db = require('./database');
const { nanoid } = require('nanoid');

class Track {
  static create({ name, description, creatorId, waypoints, distance, activityType }) {
    const id = nanoid();
    const stmt = db.prepare(
      'INSERT INTO tracks (id, name, description, creator_id, waypoints, distance, activity_type) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(id, name, description, creatorId, JSON.stringify(waypoints), distance, activityType);
    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM tracks WHERE id = ?');
    const track = stmt.get(id);
    if (track) {
      track.waypoints = JSON.parse(track.waypoints);
    }
    return track;
  }

  static getAll() {
    const stmt = db.prepare('SELECT * FROM tracks ORDER BY created_at DESC');
    const tracks = stmt.all();
    return tracks.map((track) => ({
      ...track,
      waypoints: JSON.parse(track.waypoints),
    }));
  }

  static getByCreator(creatorId) {
    const stmt = db.prepare('SELECT * FROM tracks WHERE creator_id = ? ORDER BY created_at DESC');
    const tracks = stmt.all(creatorId);
    return tracks.map((track) => ({
      ...track,
      waypoints: JSON.parse(track.waypoints),
    }));
  }
}

module.exports = Track;
