require('dotenv').config();
const express = require('express');
const cors = require('cors');

const userRoutes = require('./routes/users');
const trackRoutes = require('./routes/tracks');
const attemptRoutes = require('./routes/attempts');
const challengeRoutes = require('./routes/challenges');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    name: 'TrackDay Racing API',
    version: '0.1.0',
    endpoints: {
      users: '/api/users',
      tracks: '/api/tracks',
      attempts: '/api/attempts',
      challenges: '/api/challenges',
    },
  });
});

app.use('/api/users', userRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/challenges', challengeRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`🏁 TrackDay Racing API running on http://localhost:${PORT}`);
  console.log(`📊 Database: ${process.env.DB_PATH || './data/trackday.db'}`);
});
