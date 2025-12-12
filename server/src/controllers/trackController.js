const Track = require('../models/Track');

/**
 * Create a new track
 */
exports.createTrack = async (req, res) => {
  try {
    const { name, description, waypoints, distance, activityType } = req.body;

    // Use authenticated user as creator
    const creatorId = req.user ? req.user.id : req.body.creatorId;

    if (!name || !creatorId || !waypoints || !activityType) {
      return res.status(400).json({
        error: 'Name, creator ID, waypoints, and activity type are required',
      });
    }

    const track = await Track.create({
      name,
      description,
      creatorId,
      waypoints,
      distance,
      activityType,
    });
    res.status(201).json(track);
  } catch (error) {
    console.error('Create track error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get track by ID
 */
exports.getTrack = async (req, res) => {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(track);
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get track with full details (ratings, comments, etc.)
 */
exports.getTrackWithDetails = async (req, res) => {
  try {
    const track = await Track.getWithDetails(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(track);
  } catch (error) {
    console.error('Get track with details error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all tracks
 */
exports.getAllTracks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const tracks = await Track.getAll(limit, offset);
    res.json(tracks);
  } catch (error) {
    console.error('Get all tracks error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get tracks by creator
 */
exports.getUserTracks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const tracks = await Track.getByCreator(req.params.userId, limit, offset);
    res.json(tracks);
  } catch (error) {
    console.error('Get user tracks error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get tracks by activity type
 */
exports.getTracksByActivity = async (req, res) => {
  try {
    const { activityType } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const tracks = await Track.getByActivityType(activityType, limit, offset);
    res.json(tracks);
  } catch (error) {
    console.error('Get tracks by activity error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get trending tracks
 */
exports.getTrendingTracks = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const tracks = await Track.getTrending(limit);
    res.json(tracks);
  } catch (error) {
    console.error('Get trending tracks error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Search tracks
 */
exports.searchTracks = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const limit = parseInt(req.query.limit) || 20;
    const tracks = await Track.search(q, limit);
    res.json(tracks);
  } catch (error) {
    console.error('Search tracks error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update track
 */
exports.updateTrack = async (req, res) => {
  try {
    const { name, description, waypoints, distance } = req.body;

    const track = await Track.update(req.params.id, { name, description, waypoints, distance });
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json(track);
  } catch (error) {
    console.error('Update track error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete track
 */
exports.deleteTrack = async (req, res) => {
  try {
    await Track.delete(req.params.id);
    res.json({ message: 'Track deleted successfully' });
  } catch (error) {
    console.error('Delete track error:', error);
    res.status(500).json({ error: error.message });
  }
};
