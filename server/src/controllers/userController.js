const User = require('../models/User');

/**
 * Create a new user (deprecated - use auth/register instead)
 */
exports.createUser = async (req, res) => {
  try {
    const { username, email, displayName, passwordHash } = req.body;

    if (!username || !email || !displayName) {
      return res.status(400).json({ error: 'Username, email, and display name are required' });
    }

    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const user = await User.create({ username, email, displayName, passwordHash });
    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user by ID
 */
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get user with stats
 */
exports.getUserWithStats = async (req, res) => {
  try {
    const user = await User.getWithStats(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user with stats error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const users = await User.getAll(limit, offset);
    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Search users
 */
exports.searchUsers = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const limit = parseInt(req.query.limit) || 20;
    const users = await User.search(q, limit);
    res.json(users);
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update user
 */
exports.updateUser = async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;

    const user = await User.update(req.params.id, { displayName, bio, avatarUrl });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete user
 */
exports.deleteUser = async (req, res) => {
  try {
    await User.delete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: error.message });
  }
};
