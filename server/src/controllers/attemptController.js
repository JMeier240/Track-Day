const Attempt = require('../models/Attempt');

/**
 * Create a new attempt
 */
exports.createAttempt = async (req, res) => {
  try {
    const { trackId, duration, gpsData } = req.body;

    // Use authenticated user if available
    const userId = req.user ? req.user.id : req.body.userId;

    if (!trackId || !userId || !duration || !gpsData) {
      return res.status(400).json({
        error: 'Track ID, user ID, duration, and GPS data are required',
      });
    }

    const attempt = await Attempt.create({ trackId, userId, duration, gpsData });
    res.status(201).json(attempt);
  } catch (error) {
    console.error('Create attempt error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get attempt by ID
 */
exports.getAttempt = async (req, res) => {
  try {
    const attempt = await Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    res.json(attempt);
  } catch (error) {
    console.error('Get attempt error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get attempts for a track
 */
exports.getTrackAttempts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const attempts = await Attempt.getByTrack(req.params.trackId, limit, offset);
    res.json(attempts);
  } catch (error) {
    console.error('Get track attempts error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get attempts by user
 */
exports.getUserAttempts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const attempts = await Attempt.getByUser(req.params.userId, limit, offset);
    res.json(attempts);
  } catch (error) {
    console.error('Get user attempts error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get leaderboard for a track
 */
exports.getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = await Attempt.getLeaderboard(req.params.trackId, limit);
    res.json(leaderboard);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get personal best for a user on a track
 */
exports.getPersonalBest = async (req, res) => {
  try {
    const { trackId, userId } = req.params;
    const pb = await Attempt.getPersonalBest(userId, trackId);
    if (!pb) {
      return res.status(404).json({ error: 'No attempts found for this track' });
    }
    res.json(pb);
  } catch (error) {
    console.error('Get personal best error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get recent attempts across all tracks
 */
exports.getRecentAttempts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const attempts = await Attempt.getRecent(limit);
    res.json(attempts);
  } catch (error) {
    console.error('Get recent attempts error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete attempt
 */
exports.deleteAttempt = async (req, res) => {
  try {
    await Attempt.delete(req.params.id);
    res.json({ message: 'Attempt deleted successfully' });
  } catch (error) {
    console.error('Delete attempt error:', error);
    res.status(500).json({ error: error.message });
  }
};
