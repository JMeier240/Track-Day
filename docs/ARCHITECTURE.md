# TrackDay Racing — Architecture

## Overview
TrackDay Racing is a community-driven challenge platform that allows users to create GPS-tracked routes and compete with friends and other racers. The platform is designed to scale from casual smartphone users to professional racers with dedicated telemetry hardware.

## System Architecture

### Three-Tier Architecture

```
┌─────────────────────────────────────┐
│         Frontend (Client)           │
│   - Mobile-optimized Web App        │
│   - GPS tracking via browser API    │
│   - Real-time position tracking     │
└─────────────┬───────────────────────┘
              │ HTTP/REST API
              │
┌─────────────▼───────────────────────┐
│         Backend (Server)            │
│   - Node.js + Express               │
│   - REST API endpoints              │
│   - Business logic                  │
└─────────────┬───────────────────────┘
              │ SQL queries
              │
┌─────────────▼───────────────────────┐
│       Database (SQLite)             │
│   - Users, Tracks, Attempts         │
│   - Challenges, Leaderboards        │
└─────────────────────────────────────┘
```

## Data Model

### Core Entities

1. **Users**
   - Unique ID and username
   - Display name for public presentation
   - Creation timestamp

2. **Tracks**
   - GPS waypoints (lat/lng coordinates)
   - Activity type (running, biking, skating, driving, go-kart)
   - Distance calculation
   - Creator reference

3. **Attempts**
   - User's run on a specific track
   - GPS trail data
   - Duration/time
   - Timestamp for leaderboard sorting

4. **Challenges**
   - Direct challenges (one user to another)
   - Open challenges (anyone can participate)
   - Track reference
   - Status tracking (active, completed, expired)

## Technology Stack

### Frontend
- **HTML5/CSS3** - Mobile-first responsive design
- **Vanilla JavaScript** - No framework dependencies for MVP
- **Geolocation API** - GPS tracking in browser
- **LocalStorage** - Client-side user persistence

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework for REST API
- **better-sqlite3** - Embedded SQL database
- **CORS** - Cross-origin resource sharing

### Development Tools
- **Nodemon** - Hot reload during development
- **Prettier** - Code formatting
- **EditorConfig** - Consistent code style

## API Design

RESTful API with JSON payloads:

- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/tracks` - List all tracks
- `POST /api/tracks` - Create new track
- `GET /api/attempts/track/:trackId` - Get attempts for a track
- `GET /api/attempts/track/:trackId/leaderboard` - Get leaderboard
- `POST /api/attempts` - Submit a new attempt
- `GET /api/challenges` - List active challenges
- `POST /api/challenges` - Create new challenge

## GPS Data Flow

1. User initiates track recording
2. Browser requests geolocation permission
3. `watchPosition()` continuously captures GPS coordinates
4. Waypoints stored in memory with timestamp and accuracy
5. User stops recording
6. Distance calculated using Haversine formula
7. Track data posted to server
8. Server validates and stores in database

## Future Enhancements

### Phase 2: Professional Features
- Hardware integration for high-precision GPS/telemetry
- Additional metrics: speed, acceleration, g-forces
- Video overlay synchronization
- Advanced analytics dashboard

### Phase 3: Community Features
- Social features (following, friends)
- Track ratings and comments
- Community events and tournaments
- Achievement system

### Phase 4: Monetization
- Premium hardware sales
- Pro subscription tier
- Sponsored events
- Partnerships with tracks/venues

## Security Considerations

### Current (MVP)
- Input validation on all endpoints
- SQL injection protection via prepared statements
- CORS configuration

### Future
- User authentication (JWT tokens)
- Rate limiting
- Data encryption at rest
- Privacy controls for track visibility
- GDPR compliance for location data
