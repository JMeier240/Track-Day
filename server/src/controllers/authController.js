const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const db = require('../database/db');

/**
 * Generate JWT token
 */
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Register new user
 */
exports.register = async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, displayName } = req.body;

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, created_at`,
      [username, email, passwordHash, displayName]
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user.id);

    // Create "First Track" achievement activity
    await db.query(
      `INSERT INTO activities (user_id, activity_type, entity_type, metadata)
       VALUES ($1, 'user_joined', 'user', $2)`,
      [user.id, JSON.stringify({ username: user.username })]
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Find user (allow login with username or email)
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate token
    const token = generateToken(user.id);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        isVerified: user.is_verified,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, display_name, bio, avatar_url, is_verified, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Get user stats
    const statsResult = await db.query(
      `SELECT
        (SELECT COUNT(*) FROM attempts WHERE user_id = $1) as total_races,
        (SELECT COUNT(*) FROM tracks WHERE creator_id = $1) as total_tracks,
        (SELECT COUNT(*) FROM follows WHERE follower_id = $1) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = $1) as followers_count,
        (SELECT COALESCE(SUM(points), 0) FROM user_achievements ua
         JOIN achievements a ON ua.achievement_id = a.id
         WHERE ua.user_id = $1) as total_points
      `,
      [req.user.id]
    );

    const stats = statsResult.rows[0];

    res.json({
      ...user,
      stats: {
        totalRaces: parseInt(stats.total_races),
        totalTracks: parseInt(stats.total_tracks),
        followingCount: parseInt(stats.following_count),
        followersCount: parseInt(stats.followers_count),
        totalPoints: parseInt(stats.total_points),
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { displayName, bio, avatarUrl } = req.body;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (displayName !== undefined) {
      updates.push(`display_name = $${paramCount++}`);
      values.push(displayName);
    }

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`);
      values.push(bio);
    }

    if (avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramCount++}`);
      values.push(avatarUrl);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(req.user.id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, username, email, display_name, bio, avatar_url`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Get current password hash
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      newPasswordHash,
      req.user.id,
    ]);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res) => {
  try {
    // User is already authenticated via middleware
    const token = generateToken(req.user.id);
    res.json({ token });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
};

/**
 * Request magic link
 * Generates a magic link token and logs it to console (dev mode)
 */
exports.requestMagicLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find user by email
    const result = await db.query(
      'SELECT id, username, email, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      // For security, don't reveal if email exists or not
      return res.json({
        message: 'If this email is registered, you will receive a magic link shortly'
      });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Generate magic link token (15 minutes expiration)
    const magicToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'magic-link' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // In development mode, log the magic link to console
    const magicLink = `http://localhost:3001/api/auth/verify/${magicToken}`;
    console.log('\n🔐 Magic Link Authentication');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${user.email}`);
    console.log(`Magic Link: ${magicLink}`);
    console.log(`Expires: 15 minutes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // TODO: In production, send email using nodemailer
    // const nodemailer = require('nodemailer');
    // Send email with magic link

    res.json({
      message: 'If this email is registered, you will receive a magic link shortly'
    });
  } catch (error) {
    console.error('Request magic link error:', error);
    res.status(500).json({ error: 'Failed to send magic link' });
  }
};

/**
 * Verify magic link token
 * Validates the magic link token and issues a 30-day session JWT
 */
exports.verifyMagicLink = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Verify magic link token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Magic link has expired. Please request a new one.' });
      }
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Invalid magic link token' });
      }
      throw error;
    }

    // Verify it's a magic link token
    if (decoded.type !== 'magic-link') {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    // Get user from database
    const result = await db.query(
      'SELECT id, username, email, display_name, avatar_url, bio, is_verified, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    // Update last login
    await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate session token (30 days)
    const sessionToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      message: 'Authentication successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        bio: user.bio,
        isVerified: user.is_verified,
      },
      token: sessionToken,
    });
  } catch (error) {
    console.error('Verify magic link error:', error);
    res.status(500).json({ error: 'Failed to verify magic link' });
  }
};

/**
 * Passwordless registration - creates account and sends magic link
 * Used for frontend auth UI that only collects email and display name
 */
exports.registerPasswordless = async (req, res) => {
  try {
    const { email, displayName } = req.body;

    if (!email || !displayName) {
      return res.status(400).json({ error: 'Email and display name are required' });
    }

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Auto-generate username from email
    const username = email.split('@')[0] + '_' + Math.random().toString(36).substring(2, 7);

    // Generate random password (user won't use it, only magic links)
    const randomPassword = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const passwordHash = await bcrypt.hash(randomPassword, 10);

    // Create user
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, display_name, created_at`,
      [username, email, passwordHash, displayName]
    );

    const user = result.rows[0];

    // Create "user joined" activity
    await db.query(
      `INSERT INTO activities (user_id, activity_type, entity_type, metadata)
       VALUES ($1, 'user_joined', 'user', $2)`,
      [user.id, JSON.stringify({ username: user.username })]
    );

    // Generate magic link token (15 minutes expiration)
    const magicToken = jwt.sign(
      { userId: user.id, email: user.email, type: 'magic-link' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // In development mode, log the magic link to console
    const magicLink = `http://localhost:3001/api/auth/verify/${magicToken}`;
    console.log('\n🔐 Magic Link Authentication (New Account)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email: ${user.email}`);
    console.log(`Display Name: ${user.display_name}`);
    console.log(`Magic Link: ${magicLink}`);
    console.log(`Expires: 15 minutes`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    res.status(201).json({
      message: 'Account created! Check the console for your magic link.',
      email: user.email,
    });
  } catch (error) {
    console.error('Passwordless registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};
