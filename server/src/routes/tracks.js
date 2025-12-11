const express = require('express');
const router = express.Router();
const trackController = require('../controllers/trackController');

router.post('/', trackController.createTrack);
router.get('/', trackController.getAllTracks);
router.get('/:id', trackController.getTrack);
router.get('/user/:userId', trackController.getUserTracks);

module.exports = router;
