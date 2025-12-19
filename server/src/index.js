require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const trackRoutes = require('./routes/tracks');
const attemptRoutes = require('./routes/attempts');
const challengeRoutes = require('./routes/challenges');
const sessionRoutes = require('./routes/sessions');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.json({
    name: 'TrackDay Racing API',
    version: '0.2.0',
    phase: 'Phase 2 - Social & Authentication',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      tracks: '/api/tracks',
      attempts: '/api/attempts',
      challenges: '/api/challenges',
      sessions: '/api/sessions',
    },
    documentation: 'See /docs for API documentation',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/sessions', sessionRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🏁 TrackDay Racing API running on http://localhost:${PORT}`);
  console.log(`🔐 Phase 2: Authentication & Social Features`);
  console.log(`📊 Database: PostgreSQL`);
  console.log(`📝 Docs: Check /docs for setup instructions`);
});
