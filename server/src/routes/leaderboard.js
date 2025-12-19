const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');

// Leaderboard routes
router.get('/', leaderboardController.getLeaderboard); // ?trackId=xxx
router.get('/global', leaderboardController.getGlobalLeaderboard);

// Lap routes
router.get('/laps/session/:sessionId', leaderboardController.getSessionLaps);
router.get('/laps/user/:userId', leaderboardController.getUserLaps);

module.exports = router;
