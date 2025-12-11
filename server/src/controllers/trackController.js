const Track = require('../models/Track');

exports.createTrack = (req, res) => {
  try {
    const { name, description, creatorId, waypoints, distance, activityType } = req.body;

    if (!name || !creatorId || !waypoints || !activityType) {
      return res.status(400).json({
        error: 'Name, creator ID, waypoints, and activity type are required',
      });
    }

    const track = Track.create({
      name,
      description,
      creatorId,
      waypoints,
      distance,
      activityType,
    });
    res.status(201).json(track);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getTrack = (req, res) => {
  try {
    const track = Track.findById(req.params.id);
    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }
    res.json(track);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllTracks = (req, res) => {
  try {
    const tracks = Track.getAll();
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserTracks = (req, res) => {
  try {
    const tracks = Track.getByCreator(req.params.userId);
    res.json(tracks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
