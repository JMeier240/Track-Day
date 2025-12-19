const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const telemetryController = require('../controllers/telemetryController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Validation rules
const ingestValidation = [
  body('sessionId')
    .notEmpty()
    .isUUID()
    .withMessage('Valid session ID is required'),
  body('points')
    .isArray({ min: 1 })
    .withMessage('Points array is required and must not be empty'),
  body('points.*.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Valid latitude is required'),
  body('points.*.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Valid longitude is required'),
  body('points.*.timestamp')
    .isInt()
    .withMessage('Valid timestamp is required'),
];

// Routes
router.post('/ingest', optionalAuth, ingestValidation, telemetryController.ingestTelemetry);
router.get('/:sessionId', telemetryController.getSessionTelemetry);

module.exports = router;
