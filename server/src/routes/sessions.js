const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const sessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const createSessionValidation = [
  body('trackId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid track ID is required'),
];

// All session routes require authentication
router.use(authenticate);

// Routes
router.post('/', createSessionValidation, sessionController.createSession);
router.post('/:id/stop', sessionController.stopSession);
router.get('/', sessionController.getSessions);
router.get('/:id', sessionController.getSession);

module.exports = router;
