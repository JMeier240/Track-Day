const db = require('../database/db');

/**
 * Get leaderboard for a track (based on laps)
 * GET /api/leaderboard?trackId=xxx
 * Returns best lap times per user for a specific track
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const { trackId, limit = 50 } = req.query;

    if (!trackId) {
      return res.status(400).json({ error: 'Track ID is required' });
    }

    // Verify track exists
    const trackResult = await db.query(
      'SELECT id, name, distance, activity_type FROM tracks WHERE id = $1',
      [trackId]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = trackResult.rows[0];

    // Get best lap per user for this track
    const leaderboardResult = await db.query(
      `SELECT DISTINCT ON (l.user_id)
              l.id,
              l.user_id,
              l.track_id,
              l.lap_number,
              l.lap_time,
              l.top_speed,
              l.avg_speed,
              l.created_at,
              u.username,
              u.display_name,
              u.avatar_url,
              s.id as session_id
       FROM laps l
       JOIN users u ON l.user_id = u.id
       JOIN sessions s ON l.session_id = s.id
       WHERE l.track_id = $1
       ORDER BY l.user_id, l.lap_time ASC`,
      [trackId]
    );

    // Sort by lap time (best times first)
    const sorted = leaderboardResult.rows
      .sort((a, b) => a.lap_time - b.lap_time)
      .slice(0, parseInt(limit));

    // Add rank
    const leaderboard = sorted.map((entry, index) => ({
      rank: index + 1,
      lapId: entry.id,
      userId: entry.user_id,
      username: entry.username,
      displayName: entry.display_name,
      avatarUrl: entry.avatar_url,
      sessionId: entry.session_id,
      lapNumber: entry.lap_number,
      lapTime: entry.lap_time,
      topSpeed: entry.top_speed,
      avgSpeed: entry.avg_speed,
      completedAt: entry.created_at
    }));

    res.json({
      track: {
        id: track.id,
        name: track.name,
        distance: track.distance,
        activityType: track.activity_type
      },
      leaderboard,
      total: leaderboard.length
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

/**
 * Get global leaderboard (best laps across all tracks)
 * GET /api/leaderboard/global
 */
exports.getGlobalLeaderboard = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const result = await db.query(
      `SELECT
              l.id,
              l.user_id,
              l.track_id,
              l.lap_number,
              l.lap_time,
              l.top_speed,
              l.avg_speed,
              l.created_at,
              u.username,
              u.display_name,
              u.avatar_url,
              t.name as track_name,
              t.distance as track_distance,
              t.activity_type,
              s.id as session_id
       FROM laps l
       JOIN users u ON l.user_id = u.id
       JOIN tracks t ON l.track_id = t.id
       JOIN sessions s ON l.session_id = s.id
       ORDER BY l.created_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );

    const laps = result.rows.map((entry) => ({
      lapId: entry.id,
      userId: entry.user_id,
      username: entry.username,
      displayName: entry.display_name,
      avatarUrl: entry.avatar_url,
      trackId: entry.track_id,
      trackName: entry.track_name,
      trackDistance: entry.track_distance,
      activityType: entry.activity_type,
      sessionId: entry.session_id,
      lapNumber: entry.lap_number,
      lapTime: entry.lap_time,
      topSpeed: entry.top_speed,
      avgSpeed: entry.avg_speed,
      completedAt: entry.created_at
    }));

    res.json({
      laps,
      total: laps.length
    });
  } catch (error) {
    console.error('Get global leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get global leaderboard' });
  }
};

/**
 * Get laps for a specific session
 * GET /api/laps/session/:sessionId
 */
exports.getSessionLaps = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const result = await db.query(
      `SELECT
              l.id,
              l.lap_number,
              l.lap_time,
              l.top_speed,
              l.avg_speed,
              l.start_timestamp,
              l.end_timestamp,
              l.created_at
       FROM laps l
       WHERE l.session_id = $1
       ORDER BY l.lap_number ASC`,
      [sessionId]
    );

    const laps = result.rows.map((lap) => ({
      id: lap.id,
      lapNumber: lap.lap_number,
      lapTime: lap.lap_time,
      topSpeed: lap.top_speed,
      avgSpeed: lap.avg_speed,
      startTimestamp: lap.start_timestamp,
      endTimestamp: lap.end_timestamp,
      completedAt: lap.created_at
    }));

    res.json({
      sessionId,
      laps,
      total: laps.length,
      bestLap: laps.length > 0
        ? laps.reduce((best, lap) => lap.lapTime < best.lapTime ? lap : best)
        : null
    });
  } catch (error) {
    console.error('Get session laps error:', error);
    res.status(500).json({ error: 'Failed to get session laps' });
  }
};

/**
 * Get user's laps
 * GET /api/laps/user/:userId
 */
exports.getUserLaps = async (req, res) => {
  try {
    const { userId } = req.params;
    const { trackId, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
              l.id,
              l.session_id,
              l.track_id,
              l.lap_number,
              l.lap_time,
              l.top_speed,
              l.avg_speed,
              l.created_at,
              t.name as track_name,
              t.distance as track_distance,
              t.activity_type
       FROM laps l
       JOIN tracks t ON l.track_id = t.id
       WHERE l.user_id = $1
    `;

    const params = [userId];
    let paramCount = 2;

    if (trackId) {
      query += ` AND l.track_id = $${paramCount}`;
      params.push(trackId);
      paramCount++;
    }

    query += ` ORDER BY l.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    const laps = result.rows.map((lap) => ({
      id: lap.id,
      sessionId: lap.session_id,
      trackId: lap.track_id,
      trackName: lap.track_name,
      trackDistance: lap.track_distance,
      activityType: lap.activity_type,
      lapNumber: lap.lap_number,
      lapTime: lap.lap_time,
      topSpeed: lap.top_speed,
      avgSpeed: lap.avg_speed,
      completedAt: lap.created_at
    }));

    res.json({
      userId,
      laps,
      total: laps.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get user laps error:', error);
    res.status(500).json({ error: 'Failed to get user laps' });
  }
};
