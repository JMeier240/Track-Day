const db = require('../database/db');
const { validationResult } = require('express-validator');

/**
 * Create a new session
 * POST /api/sessions
 */
exports.createSession = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { trackId } = req.body;

    // Verify track exists
    const trackResult = await db.query(
      'SELECT id, name, creator_id FROM tracks WHERE id = $1',
      [trackId]
    );

    if (trackResult.rows.length === 0) {
      return res.status(404).json({ error: 'Track not found' });
    }

    const track = trackResult.rows[0];

    // Check if user already has an active session for this track
    const activeSessionResult = await db.query(
      'SELECT id FROM sessions WHERE user_id = $1 AND track_id = $2 AND end_time IS NULL',
      [req.user.id, trackId]
    );

    if (activeSessionResult.rows.length > 0) {
      return res.status(409).json({
        error: 'You already have an active session for this track',
        sessionId: activeSessionResult.rows[0].id
      });
    }

    // Create new session
    const result = await db.query(
      `INSERT INTO sessions (user_id, track_id)
       VALUES ($1, $2)
       RETURNING id, user_id, track_id, start_time, end_time, created_at`,
      [req.user.id, trackId]
    );

    const session = result.rows[0];

    res.status(201).json({
      id: session.id,
      userId: session.user_id,
      trackId: session.track_id,
      trackName: track.name,
      startTime: session.start_time,
      endTime: session.end_time,
      createdAt: session.created_at,
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
};

/**
 * Stop a session
 * POST /api/sessions/:id/stop
 */
exports.stopSession = async (req, res) => {
  try {
    const { id } = req.params;

    // Get session and verify ownership
    const sessionResult = await db.query(
      'SELECT id, user_id, track_id, start_time, end_time FROM sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user owns this session
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to stop this session' });
    }

    // Check if session is already stopped
    if (session.end_time) {
      return res.status(400).json({
        error: 'Session is already stopped',
        endTime: session.end_time
      });
    }

    // Update session with end time
    const result = await db.query(
      `UPDATE sessions
       SET end_time = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, user_id, track_id, start_time, end_time`,
      [id]
    );

    const updatedSession = result.rows[0];

    // Get track info
    const trackResult = await db.query(
      'SELECT name FROM tracks WHERE id = $1',
      [updatedSession.track_id]
    );

    res.json({
      id: updatedSession.id,
      userId: updatedSession.user_id,
      trackId: updatedSession.track_id,
      trackName: trackResult.rows[0]?.name,
      startTime: updatedSession.start_time,
      endTime: updatedSession.end_time,
      duration: calculateDuration(updatedSession.start_time, updatedSession.end_time),
    });
  } catch (error) {
    console.error('Stop session error:', error);
    res.status(500).json({ error: 'Failed to stop session' });
  }
};

/**
 * Get user's sessions
 * GET /api/sessions
 */
exports.getSessions = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        s.id,
        s.user_id,
        s.track_id,
        s.start_time,
        s.end_time,
        s.created_at,
        t.name as track_name,
        t.distance as track_distance,
        t.activity_type as track_activity_type
      FROM sessions s
      JOIN tracks t ON s.track_id = t.id
      WHERE s.user_id = $1
    `;

    const queryParams = [req.user.id];
    let paramCount = 2;

    // Filter by status (active/completed)
    if (status === 'active') {
      query += ' AND s.end_time IS NULL';
    } else if (status === 'completed') {
      query += ' AND s.end_time IS NOT NULL';
    }

    query += ` ORDER BY s.start_time DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    queryParams.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, queryParams);

    const sessions = result.rows.map(session => ({
      id: session.id,
      userId: session.user_id,
      trackId: session.track_id,
      trackName: session.track_name,
      trackDistance: session.track_distance,
      trackActivityType: session.track_activity_type,
      startTime: session.start_time,
      endTime: session.end_time,
      duration: session.end_time ? calculateDuration(session.start_time, session.end_time) : null,
      status: session.end_time ? 'completed' : 'active',
      createdAt: session.created_at,
    }));

    res.json({
      sessions,
      total: sessions.length,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

/**
 * Get a specific session
 * GET /api/sessions/:id
 */
exports.getSession = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `SELECT
        s.id,
        s.user_id,
        s.track_id,
        s.start_time,
        s.end_time,
        s.created_at,
        t.name as track_name,
        t.distance as track_distance,
        t.activity_type as track_activity_type,
        u.username,
        u.display_name
      FROM sessions s
      JOIN tracks t ON s.track_id = t.id
      JOIN users u ON s.user_id = u.id
      WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = result.rows[0];

    // Only allow users to see their own sessions (or make public if needed)
    if (session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to view this session' });
    }

    res.json({
      id: session.id,
      userId: session.user_id,
      username: session.username,
      displayName: session.display_name,
      trackId: session.track_id,
      trackName: session.track_name,
      trackDistance: session.track_distance,
      trackActivityType: session.track_activity_type,
      startTime: session.start_time,
      endTime: session.end_time,
      duration: session.end_time ? calculateDuration(session.start_time, session.end_time) : null,
      status: session.end_time ? 'completed' : 'active',
      createdAt: session.created_at,
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to get session' });
  }
};

/**
 * Helper function to calculate duration in seconds
 */
function calculateDuration(startTime, endTime) {
  if (!endTime) return null;
  const start = new Date(startTime);
  const end = new Date(endTime);
  return (end - start) / 1000; // Duration in seconds
}
