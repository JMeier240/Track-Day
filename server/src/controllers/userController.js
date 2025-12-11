const User = require('../models/User');

exports.createUser = (req, res) => {
  try {
    const { username, displayName } = req.body;

    if (!username || !displayName) {
      return res.status(400).json({ error: 'Username and display name are required' });
    }

    const existing = User.findByUsername(username);
    if (existing) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    const user = User.create(username, displayName);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUser = (req, res) => {
  try {
    const user = User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getAllUsers = (req, res) => {
  try {
    const users = User.getAll();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
