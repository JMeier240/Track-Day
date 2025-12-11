const Challenge = require('../models/Challenge');

exports.createChallenge = (req, res) => {
  try {
    const { trackId, challengerId, challengedId, challengeType, expiresAt } = req.body;

    if (!trackId || !challengerId) {
      return res.status(400).json({
        error: 'Track ID and challenger ID are required',
      });
    }

    const challenge = Challenge.create({
      trackId,
      challengerId,
      challengedId,
      challengeType: challengeType || 'open',
      expiresAt,
    });
    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getChallenge = (req, res) => {
  try {
    const challenge = Challenge.findById(req.params.id);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getActiveChallenges = (req, res) => {
  try {
    const challenges = Challenge.getActive();
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserChallenges = (req, res) => {
  try {
    const challenges = Challenge.getByUser(req.params.userId);
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateChallenge = (req, res) => {
  try {
    const { bestTime, status } = req.body;

    if (bestTime !== undefined) {
      Challenge.updateBestTime(req.params.id, bestTime);
    }

    if (status) {
      Challenge.updateStatus(req.params.id, status);
    }

    const challenge = Challenge.findById(req.params.id);
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
