const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');

router.post('/', attemptController.createAttempt);
router.get('/:id', attemptController.getAttempt);
router.get('/track/:trackId', attemptController.getTrackAttempts);
router.get('/track/:trackId/leaderboard', attemptController.getLeaderboard);
router.get('/user/:userId', attemptController.getUserAttempts);

module.exports = router;
