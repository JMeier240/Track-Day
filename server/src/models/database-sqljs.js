const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || './data/trackday.db';
const dbDir = path.dirname(dbPath);

let db = null;

// Initialize sql.js
async function initDatabase() {
  const SQL = await initSqlJs();

  // Create directory if needed
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Load existing database or create new one
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  // Create schema
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as int))
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      creator_id TEXT NOT NULL,
      waypoints TEXT NOT NULL,
      distance REAL,
      activity_type TEXT NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as int)),
      FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS attempts (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      duration REAL NOT NULL,
      gps_data TEXT NOT NULL,
      timestamp INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as int)),
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS challenges (
      id TEXT PRIMARY KEY,
      track_id TEXT NOT NULL,
      challenger_id TEXT NOT NULL,
      challenged_id TEXT,
      challenge_type TEXT NOT NULL DEFAULT 'open',
      status TEXT NOT NULL DEFAULT 'active',
      best_time REAL,
      created_at INTEGER NOT NULL DEFAULT (cast(strftime('%s', 'now') as int)),
      expires_at INTEGER,
      FOREIGN KEY (track_id) REFERENCES tracks(id) ON DELETE CASCADE,
      FOREIGN KEY (challenger_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (challenged_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tracks_creator ON tracks(creator_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_track ON attempts(track_id);
    CREATE INDEX IF NOT EXISTS idx_attempts_user ON attempts(user_id);
    CREATE INDEX IF NOT EXISTS idx_challenges_track ON challenges(track_id);
  `);

  // Save database to file
  saveDatabase();

  return db;
}

// Save database to file
function saveDatabase() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

// Helper to run queries
function prepare(sql) {
  return {
    run: (...params) => {
      db.run(sql, params);
      saveDatabase();
    },
    get: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const result = stmt.step() ? stmt.getAsObject() : null;
      stmt.free();
      return result;
    },
    all: (...params) => {
      const stmt = db.prepare(sql);
      stmt.bind(params);
      const results = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject());
      }
      stmt.free();
      return results;
    },
  };
}

// Export a proxy object that matches better-sqlite3 API
module.exports = {
  init: initDatabase,
  prepare,
  saveDatabase,
};
