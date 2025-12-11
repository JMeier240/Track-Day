const Attempt = require('../models/Attempt');

exports.createAttempt = (req, res) => {
  try {
    const { trackId, userId, duration, gpsData } = req.body;

    if (!trackId || !userId || !duration || !gpsData) {
      return res.status(400).json({
        error: 'Track ID, user ID, duration, and GPS data are required',
      });
    }

    const attempt = Attempt.create({ trackId, userId, duration, gpsData });
    res.status(201).json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAttempt = (req, res) => {
  try {
    const attempt = Attempt.findById(req.params.id);
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    res.json(attempt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrackAttempts = (req, res) => {
  try {
    const attempts = Attempt.getByTrack(req.params.trackId);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserAttempts = (req, res) => {
  try {
    const attempts = Attempt.getByUser(req.params.userId);
    res.json(attempts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getLeaderboard = (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const leaderboard = Attempt.getLeaderboard(req.params.trackId, limit);
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
