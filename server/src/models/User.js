const db = require('./database');
const { nanoid } = require('nanoid');

class User {
  static create(username, displayName) {
    const id = nanoid();
    const stmt = db.prepare('INSERT INTO users (id, username, display_name) VALUES (?, ?, ?)');
    stmt.run(id, username, displayName);
    return this.findById(id);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static getAll() {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  }
}

module.exports = User;
