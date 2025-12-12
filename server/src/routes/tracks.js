const express = require('express');
const router = express.Router();
const trackController = require('../controllers/trackController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', trackController.getAllTracks);
router.get('/search', trackController.searchTracks);
router.get('/trending', trackController.getTrendingTracks);
router.get('/activity/:activityType', trackController.getTracksByActivity);
router.get('/user/:userId', trackController.getUserTracks);
router.get('/:id', trackController.getTrack);
router.get('/:id/details', trackController.getTrackWithDetails);

// Protected routes (require authentication or use optionalAuth)
router.post('/', optionalAuth, trackController.createTrack);
router.put('/:id', authenticate, trackController.updateTrack);
router.delete('/:id', authenticate, trackController.deleteTrack);

module.exports = router;
