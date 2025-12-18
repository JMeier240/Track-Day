# 🏁 TrackDay Racing - Complete Setup Guide

## 📋 Prerequisites Checklist

- ✅ PostgreSQL 16.11 installed
- ✅ Node.js (v18+ recommended)
- ⚠️ PostgreSQL server needs to be started
- ⚠️ Database needs to be created
- ⚠️ Environment variables need configuration

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Start PostgreSQL Server

```bash
# Start PostgreSQL service
sudo service postgresql start

# Verify it's running
pg_isready
# Expected output: /var/run/postgresql:5432 - accepting connections
```

### Step 2: Create Database

```bash
# Create the trackday database
sudo -u postgres createdb trackday

# Or manually:
sudo -u postgres psql
CREATE DATABASE trackday;
\q
```

### Step 3: Configure Environment Variables

```bash
cd /home/user/Track-Day/server

# Copy example environment file
cp .env.example .env

# Edit the .env file with your settings
nano .env
```

**Update your `.env` file with these settings:**

```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*

# Database Configuration
# For local development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/trackday

# JWT Secret (CHANGE THIS to a random string!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-$(date +%s)
JWT_EXPIRES_IN=7d

# Session Secret (CHANGE THIS to a random string!)
SESSION_SECRET=your-session-secret-change-this-in-production-$(date +%s)
```

**💡 To generate secure secrets, run:**
```bash
# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate session secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Install Dependencies

```bash
cd /home/user/Track-Day/server
npm install
```

### Step 5: Run Database Migration

```bash
npm run migrate
```

**Expected output:**
```
🔄 Starting database migration...
📝 Creating tables and indexes...
✅ Database schema created successfully!
🏆 Creating default achievements...
   ✓ Created 10 achievements
✅ Migration completed successfully!
🎉 Your database is ready to use!
```

### Step 6: Start the Development Server

```bash
npm run dev
```

**Expected output:**
```
[nodemon] starting `node src/index.js`
🚀 TrackDay Racing API running on http://localhost:3000
✅ Database connected successfully
```

### Step 7: Open the Frontend

```bash
# In a new terminal
cd /home/user/Track-Day

# Open in your default browser (Linux)
xdg-open frontend/index.html

# Or manually open: file:///home/user/Track-Day/frontend/index.html
```

---

## 🧪 Test the Installation

### Test 1: Health Check

```bash
curl http://localhost:3000/api/health
```

**Expected response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-12-18T...",
  "database": "connected"
}
```

### Test 2: Create a Test User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@trackday.com",
    "password": "TestPass123!",
    "displayName": "Test Driver"
  }'
```

**Expected response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "username": "testuser",
    "email": "test@trackday.com",
    "displayName": "Test Driver"
  }
}
```

### Test 3: Get User Profile

```bash
# Save the token from previous response
TOKEN="your-token-here"

curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Database Overview

Your PostgreSQL database has **15 tables** organized as follows:

### Core Tables (Phase 1-2)
- `users` - User accounts with authentication
- `tracks` - GPS routes with metadata
- `attempts` - Race entries with telemetry
- `challenges` - Direct and open challenges

### Social Features (Phase 2)
- `follows` - User relationships
- `track_ratings` - 1-5 star ratings
- `track_comments` - Track feedback
- `track_favorites` - Bookmarked tracks
- `activities` - Activity feed
- `notifications` - User notifications

### Gamification (Phase 2)
- `achievements` - Achievement definitions (10 pre-seeded)
- `user_achievements` - Earned badges

### Future (Phase 3+)
- `groups` - User communities
- `events` - Racing events
- `event_participants` - Event registration

---

## 🛠️ Available NPM Scripts

```bash
npm run dev      # Start development server with auto-reload (nodemon)
npm start        # Start production server
npm run migrate  # Run database migrations
npm test         # Run tests (not implemented yet)
```

---

## 📡 API Endpoints (31 Total)

### Authentication (6 endpoints)
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/refresh` - Refresh JWT token

### Users (7 endpoints)
- `GET /api/users` - List all users
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/:id/stats` - Get user with statistics
- `POST /api/users` - Create user (auth required)
- `PUT /api/users/:id` - Update user (auth required)
- `DELETE /api/users/:id` - Delete user (auth required)

### Tracks (9 endpoints)
- `GET /api/tracks` - List all tracks
- `GET /api/tracks/search` - Search tracks
- `GET /api/tracks/trending` - Get trending tracks
- `GET /api/tracks/activity/:type` - Filter by activity type
- `GET /api/tracks/user/:userId` - Get user's tracks
- `GET /api/tracks/:id` - Get track by ID
- `GET /api/tracks/:id/details` - Get track with ratings/comments
- `POST /api/tracks` - Create track
- `PUT /api/tracks/:id`, `DELETE /api/tracks/:id` - Update/delete

### Attempts (7 endpoints)
- `GET /api/attempts/recent` - Recent attempts
- `GET /api/attempts/track/:trackId` - Track attempts
- `GET /api/attempts/track/:trackId/leaderboard` - Leaderboard
- `GET /api/attempts/track/:trackId/user/:userId/pb` - Personal best
- `GET /api/attempts/user/:userId` - User attempts
- `GET /api/attempts/:id` - Get attempt
- `POST /api/attempts`, `DELETE /api/attempts/:id` - Create/delete

### Challenges (8 endpoints)
- `GET /api/challenges` - Active challenges
- `GET /api/challenges/track/:trackId` - Track challenges
- `GET /api/challenges/user/:userId` - User challenges
- `GET /api/challenges/:id` - Get challenge
- `POST /api/challenges` - Create challenge
- `POST /api/challenges/:id/accept` - Accept challenge
- `POST /api/challenges/:id/decline` - Decline challenge
- `PATCH /api/challenges/:id`, `DELETE /api/challenges/:id` - Update/delete

---

## 🔒 Security Features

✅ **Implemented:**
- JWT token-based authentication
- bcrypt password hashing (10 salt rounds)
- Input validation via express-validator
- SQL injection prevention (parameterized queries)
- CORS configuration
- Password verification before changes

⚠️ **To Be Implemented:**
- Rate limiting
- HTTPS/TLS (production)
- Email verification
- 2FA (future)
- Advanced logging

---

## 🐛 Troubleshooting

### Issue: PostgreSQL connection fails

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# If not, start it
sudo service postgresql start

# Check PostgreSQL status
sudo service postgresql status
```

### Issue: Database doesn't exist

**Error:** `database "trackday" does not exist`

**Solution:**
```bash
sudo -u postgres createdb trackday
```

### Issue: Migration fails with permission error

**Error:** `permission denied for database`

**Solution:**
```bash
# Grant permissions to your user
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE trackday TO postgres;
\q
```

### Issue: Port 3000 already in use

**Error:** `Error: listen EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill the process (replace PID with actual process ID)
kill -9 <PID>

# Or use a different port in .env
PORT=3001
```

### Issue: Frontend can't connect to API

**Error:** Network errors in browser console

**Solution:**
1. Verify server is running: `curl http://localhost:3000/api/health`
2. Check CORS settings in `.env`: `CORS_ORIGIN=*`
3. Update frontend API URL in `frontend/js/app.js` if needed

---

## 📈 What's Next?

### Phase 2 Remaining Tasks (30% left)

1. **Social Features Endpoints** (Not yet implemented)
   - Follow/unfollow users
   - Activity feed API
   - Track comments and ratings endpoints
   - Photo uploads for tracks

2. **Frontend Integration** (Partial)
   - Connect auth UI to backend
   - Implement JWT token storage
   - Add leaderboard filtering
   - Real-time telemetry display

3. **Testing & Quality**
   - Write unit tests
   - Add integration tests
   - Implement rate limiting
   - Enhanced error logging

4. **Documentation**
   - API examples in Postman/Insomnia
   - Video tutorials
   - User onboarding guide

### Phase 3 Planning (Future)

- Real-time telemetry via WebSocket
- Mobile apps (React Native/Flutter)
- Hardware integration (BLE sensors)
- Advanced analytics dashboard
- Race card image generation
- Social sharing features

---

## 📚 Documentation Links

- **[API Documentation](docs/API.md)** - Complete API reference
- **[Architecture](docs/ARCHITECTURE.md)** - System design
- **[Roadmap](docs/ROADMAP.md)** - Feature timeline
- **[Getting Started](docs/GETTING_STARTED.md)** - Detailed setup

---

## 🎯 Success Criteria

Your installation is successful when:

- ✅ PostgreSQL server is running
- ✅ Database `trackday` exists with 15 tables
- ✅ Server starts without errors on port 3000
- ✅ Health check returns `{"status": "healthy"}`
- ✅ You can register a new user
- ✅ Frontend loads in browser
- ✅ No console errors in browser

---

## 🤝 Need Help?

If you encounter issues:

1. Check the troubleshooting section above
2. Review server logs for error messages
3. Verify all prerequisites are met
4. Check the documentation in `/docs`

---

**Built with ❤️ for the racing community**
