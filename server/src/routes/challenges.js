const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');

router.post('/', challengeController.createChallenge);
router.get('/', challengeController.getActiveChallenges);
router.get('/:id', challengeController.getChallenge);
router.get('/user/:userId', challengeController.getUserChallenges);
router.patch('/:id', challengeController.updateChallenge);

module.exports = router;
