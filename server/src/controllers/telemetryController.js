const db = require('../database/db');

// Lap detection configuration
const LAP_DETECTION_RADIUS = 50; // meters - proximity to finish line to trigger lap
const MIN_LAP_POINTS = 5; // minimum telemetry points to consider valid lap

/**
 * Ingest telemetry data
 * POST /api/ingest
 * Accepts individual or bulk telemetry points and detects lap completion
 */
exports.ingestTelemetry = async (req, res) => {
  try {
    const { sessionId, points } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }

    if (!points || !Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'Points array is required and must not be empty' });
    }

    // Validate session exists and belongs to authenticated user
    const sessionResult = await db.query(
      `SELECT s.id, s.user_id, s.track_id, s.end_time, t.waypoints
       FROM sessions s
       JOIN tracks t ON s.track_id = t.id
       WHERE s.id = $1`,
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const session = sessionResult.rows[0];

    // Verify user owns this session
    if (req.user && session.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You do not have permission to add data to this session' });
    }

    // Check if session is still active
    if (session.end_time) {
      return res.status(400).json({ error: 'Cannot add telemetry to completed session' });
    }

    // Get track waypoints (finish line is first waypoint)
    const trackWaypoints = typeof session.waypoints === 'string'
      ? JSON.parse(session.waypoints)
      : session.waypoints;

    if (!trackWaypoints || trackWaypoints.length === 0) {
      return res.status(400).json({ error: 'Track has no waypoints defined' });
    }

    const finishLine = trackWaypoints[0]; // First waypoint is the finish line

    // Insert telemetry points in bulk
    const insertedPoints = [];
    for (const point of points) {
      if (!point.lat || !point.lng || !point.timestamp) {
        continue; // Skip invalid points
      }

      const result = await db.query(
        `INSERT INTO telemetry_points (session_id, lat, lng, speed, altitude, accuracy, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, session_id, lat, lng, speed, timestamp`,
        [
          sessionId,
          point.lat,
          point.lng,
          point.speed || null,
          point.altitude || null,
          point.accuracy || null,
          point.timestamp
        ]
      );
      insertedPoints.push(result.rows[0]);
    }

    // Check for lap completion
    const lapDetected = await detectLapCompletion(
      sessionId,
      session.user_id,
      session.track_id,
      finishLine,
      insertedPoints
    );

    res.status(201).json({
      message: 'Telemetry ingested successfully',
      pointsIngested: insertedPoints.length,
      lapDetected: lapDetected.detected,
      lap: lapDetected.lap || null
    });
  } catch (error) {
    console.error('Ingest telemetry error:', error);
    res.status(500).json({ error: 'Failed to ingest telemetry' });
  }
};

/**
 * Detect if a lap has been completed
 * Checks if telemetry points cross the finish line
 */
async function detectLapCompletion(sessionId, userId, trackId, finishLine, newPoints) {
  try {
    // Get recent telemetry points for this session (last 100 points)
    const recentPointsResult = await db.query(
      `SELECT lat, lng, speed, timestamp
       FROM telemetry_points
       WHERE session_id = $1
       ORDER BY timestamp DESC
       LIMIT 100`,
      [sessionId]
    );

    const recentPoints = recentPointsResult.rows.reverse(); // Chronological order

    if (recentPoints.length < MIN_LAP_POINTS) {
      return { detected: false };
    }

    // Get current lap number
    const lapCountResult = await db.query(
      'SELECT COALESCE(MAX(lap_number), 0) as max_lap FROM laps WHERE session_id = $1',
      [sessionId]
    );
    const currentLapNumber = lapCountResult.rows[0].max_lap;
    const nextLapNumber = currentLapNumber + 1;

    // Get timestamp of last lap completion (or session start)
    let lastLapTimestamp;
    if (currentLapNumber === 0) {
      // First lap - use session start time
      const sessionResult = await db.query(
        'SELECT EXTRACT(EPOCH FROM start_time) * 1000 as start_ms FROM sessions WHERE id = $1',
        [sessionId]
      );
      lastLapTimestamp = parseInt(sessionResult.rows[0].start_ms);
    } else {
      // Get end timestamp of last lap
      const lastLapResult = await db.query(
        'SELECT end_timestamp FROM laps WHERE session_id = $1 ORDER BY lap_number DESC LIMIT 1',
        [sessionId]
      );
      lastLapTimestamp = lastLapResult.rows[0].end_timestamp;
    }

    // Get points for current lap (since last lap completion)
    const currentLapPoints = recentPoints.filter(p => p.timestamp > lastLapTimestamp);

    if (currentLapPoints.length < MIN_LAP_POINTS) {
      return { detected: false };
    }

    // Check if any recent points are near finish line
    let crossedFinishLine = false;
    let finishLinePoint = null;

    for (const point of currentLapPoints.slice(-10)) { // Check last 10 points
      const distance = calculateDistance(
        point.lat,
        point.lng,
        finishLine.lat,
        finishLine.lng
      );

      if (distance <= LAP_DETECTION_RADIUS) {
        crossedFinishLine = true;
        finishLinePoint = point;
        break;
      }
    }

    if (!crossedFinishLine) {
      return { detected: false };
    }

    // Lap detected! Calculate lap metrics
    const lapStartTimestamp = lastLapTimestamp;
    const lapEndTimestamp = finishLinePoint.timestamp;
    const lapTime = (lapEndTimestamp - lapStartTimestamp) / 1000; // Convert to seconds

    // Calculate speeds
    const speeds = currentLapPoints
      .map(p => p.speed || 0)
      .filter(s => s > 0);

    const topSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
    const avgSpeed = speeds.length > 0
      ? speeds.reduce((sum, s) => sum + s, 0) / speeds.length
      : 0;

    // Create lap record
    const lapResult = await db.query(
      `INSERT INTO laps (session_id, user_id, track_id, lap_number, lap_time, top_speed, avg_speed, start_timestamp, end_timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, lap_number, lap_time, top_speed, avg_speed`,
      [sessionId, userId, trackId, nextLapNumber, lapTime, topSpeed, avgSpeed, lapStartTimestamp, lapEndTimestamp]
    );

    const lap = lapResult.rows[0];

    // Create activity for lap completion
    await db.query(
      `INSERT INTO activities (user_id, activity_type, entity_type, entity_id, metadata)
       VALUES ($1, 'lap_completed', 'lap', $2, $3)`,
      [userId, lap.id, JSON.stringify({
        track_id: trackId,
        lap_number: nextLapNumber,
        lap_time: lapTime
      })]
    );

    console.log(`🏁 Lap ${nextLapNumber} completed! Time: ${lapTime.toFixed(2)}s`);

    return {
      detected: true,
      lap: {
        id: lap.id,
        lapNumber: lap.lap_number,
        lapTime: lap.lap_time,
        topSpeed: lap.top_speed,
        avgSpeed: lap.avg_speed
      }
    };
  } catch (error) {
    console.error('Lap detection error:', error);
    return { detected: false };
  }
}

/**
 * Calculate distance between two GPS coordinates in meters
 * Uses Haversine formula
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Get telemetry points for a session
 * GET /api/telemetry/:sessionId
 */
exports.getSessionTelemetry = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { limit = 1000, offset = 0 } = req.query;

    const result = await db.query(
      `SELECT id, lat, lng, speed, altitude, accuracy, timestamp
       FROM telemetry_points
       WHERE session_id = $1
       ORDER BY timestamp ASC
       LIMIT $2 OFFSET $3`,
      [sessionId, parseInt(limit), parseInt(offset)]
    );

    res.json({
      points: result.rows,
      total: result.rows.length,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Get telemetry error:', error);
    res.status(500).json({ error: 'Failed to get telemetry' });
  }
};
