const Challenge = require('../models/Challenge');

/**
 * Create a new challenge
 */
exports.createChallenge = async (req, res) => {
  try {
    const { trackId, challengedId, challengeType, expiresAt } = req.body;

    // Use authenticated user as challenger if available
    const challengerId = req.user ? req.user.id : req.body.challengerId;

    if (!trackId || !challengerId) {
      return res.status(400).json({
        error: 'Track ID and challenger ID are required',
      });
    }

    const challenge = await Challenge.create({
      trackId,
      challengerId,
      challengedId,
      challengeType: challengeType || 'open',
      expiresAt,
    });
    res.status(201).json(challenge);
  } catch (error) {
    console.error('Create challenge error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get challenge by ID
 */
exports.getChallenge = async (req, res) => {
  try {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all active challenges
 */
exports.getActiveChallenges = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const challenges = await Challenge.getActive(limit, offset);
    res.json(challenges);
  } catch (error) {
    console.error('Get active challenges error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get challenges by user
 */
exports.getUserChallenges = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const challenges = await Challenge.getByUser(req.params.userId, limit, offset);
    res.json(challenges);
  } catch (error) {
    console.error('Get user challenges error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get challenges for a track
 */
exports.getTrackChallenges = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const challenges = await Challenge.getByTrack(req.params.trackId, limit);
    res.json(challenges);
  } catch (error) {
    console.error('Get track challenges error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update challenge
 */
exports.updateChallenge = async (req, res) => {
  try {
    const { bestTime, status } = req.body;
    let challenge;

    if (bestTime !== undefined) {
      challenge = await Challenge.updateBestTime(req.params.id, bestTime);
    }

    if (status) {
      challenge = await Challenge.updateStatus(req.params.id, status);
    }

    if (!challenge) {
      challenge = await Challenge.findById(req.params.id);
    }

    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    res.json(challenge);
  } catch (error) {
    console.error('Update challenge error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Accept a challenge
 */
exports.acceptChallenge = async (req, res) => {
  try {
    // Use authenticated user if available
    const userId = req.user ? req.user.id : req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const challenge = await Challenge.accept(req.params.id, userId);
    res.json(challenge);
  } catch (error) {
    console.error('Accept challenge error:', error);
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'You are not authorized to accept this challenge' });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * Decline a challenge
 */
exports.declineChallenge = async (req, res) => {
  try {
    // Use authenticated user if available
    const userId = req.user ? req.user.id : req.body.userId;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const challenge = await Challenge.decline(req.params.id, userId);
    res.json(challenge);
  } catch (error) {
    console.error('Decline challenge error:', error);
    if (error.message === 'Unauthorized') {
      return res.status(403).json({ error: 'You are not authorized to decline this challenge' });
    }
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete challenge
 */
exports.deleteChallenge = async (req, res) => {
  try {
    await Challenge.delete(req.params.id);
    res.json({ message: 'Challenge deleted successfully' });
  } catch (error) {
    console.error('Delete challenge error:', error);
    res.status(500).json({ error: error.message });
  }
};
