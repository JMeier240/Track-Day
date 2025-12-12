const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', challengeController.getActiveChallenges);
router.get('/track/:trackId', challengeController.getTrackChallenges);
router.get('/user/:userId', challengeController.getUserChallenges);
router.get('/:id', challengeController.getChallenge);

// Protected routes
router.post('/', optionalAuth, challengeController.createChallenge);
router.post('/:id/accept', optionalAuth, challengeController.acceptChallenge);
router.post('/:id/decline', optionalAuth, challengeController.declineChallenge);
router.patch('/:id', authenticate, challengeController.updateChallenge);
router.delete('/:id', authenticate, challengeController.deleteChallenge);

module.exports = router;
