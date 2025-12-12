const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// Public routes
router.get('/', userController.getAllUsers);
router.get('/search', userController.searchUsers);
router.get('/:id', userController.getUser);
router.get('/:id/stats', userController.getUserWithStats);

// Protected routes (require authentication)
router.post('/', authenticate, userController.createUser);
router.put('/:id', authenticate, userController.updateUser);
router.delete('/:id', authenticate, userController.deleteUser);

module.exports = router;
