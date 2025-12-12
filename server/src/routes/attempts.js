const express = require('express');
const router = express.Router();
const attemptController = require('../controllers/attemptController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/recent', attemptController.getRecentAttempts);
router.get('/track/:trackId', attemptController.getTrackAttempts);
router.get('/track/:trackId/leaderboard', attemptController.getLeaderboard);
router.get('/track/:trackId/user/:userId/pb', attemptController.getPersonalBest);
router.get('/user/:userId', attemptController.getUserAttempts);
router.get('/:id', attemptController.getAttempt);

// Protected routes
router.post('/', optionalAuth, attemptController.createAttempt);
router.delete('/:id', authenticate, attemptController.deleteAttempt);

module.exports = router;
