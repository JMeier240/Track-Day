# TrackDay Racing — API Documentation

## Base URL
```
http://localhost:3000/api
```

## Endpoints

### Users

#### Create User
```http
POST /users
Content-Type: application/json

{
  "username": "speedster",
  "displayName": "Speed Racer"
}
```

**Response (201):**
```json
{
  "id": "abc123",
  "username": "speedster",
  "display_name": "Speed Racer",
  "created_at": 1702512000
}
```

#### Get User
```http
GET /users/:id
```

**Response (200):**
```json
{
  "id": "abc123",
  "username": "speedster",
  "display_name": "Speed Racer",
  "created_at": 1702512000
}
```

#### List All Users
```http
GET /users
```

**Response (200):**
```json
[
  {
    "id": "abc123",
    "username": "speedster",
    "display_name": "Speed Racer",
    "created_at": 1702512000
  }
]
```

---

### Tracks

#### Create Track
```http
POST /tracks
Content-Type: application/json

{
  "name": "Neighborhood Loop",
  "description": "Quick lap around the block",
  "creatorId": "abc123",
  "waypoints": [
    {
      "lat": 40.7589,
      "lng": -73.9851,
      "timestamp": 1702512000000,
      "accuracy": 5
    }
  ],
  "distance": 1520.5,
  "activityType": "biking"
}
```

**Activity Types:**
- `running`
- `biking`
- `skating`
- `driving`
- `go-kart`

**Response (201):**
```json
{
  "id": "track789",
  "name": "Neighborhood Loop",
  "description": "Quick lap around the block",
  "creator_id": "abc123",
  "waypoints": [...],
  "distance": 1520.5,
  "activity_type": "biking",
  "created_at": 1702512000
}
```

#### Get Track
```http
GET /tracks/:id
```

#### List All Tracks
```http
GET /tracks
```

#### Get User's Tracks
```http
GET /tracks/user/:userId
```

---

### Attempts

#### Submit Attempt
```http
POST /attempts
Content-Type: application/json

{
  "trackId": "track789",
  "userId": "abc123",
  "duration": 245.67,
  "gpsData": [
    {
      "lat": 40.7589,
      "lng": -73.9851,
      "timestamp": 1702512000000,
      "speed": 5.2
    }
  ]
}
```

**Response (201):**
```json
{
  "id": "attempt456",
  "track_id": "track789",
  "user_id": "abc123",
  "duration": 245.67,
  "gps_data": [...],
  "timestamp": 1702512000
}
```

#### Get Attempt
```http
GET /attempts/:id
```

#### Get Track Attempts
```http
GET /attempts/track/:trackId
```

#### Get User Attempts
```http
GET /attempts/user/:userId
```

#### Get Leaderboard
```http
GET /attempts/track/:trackId/leaderboard?limit=10
```

**Response (200):**
```json
[
  {
    "id": "attempt456",
    "track_id": "track789",
    "user_id": "abc123",
    "duration": 245.67,
    "username": "speedster",
    "display_name": "Speed Racer",
    "timestamp": 1702512000
  }
]
```

---

### Challenges

#### Create Challenge
```http
POST /challenges
Content-Type: application/json

{
  "trackId": "track789",
  "challengerId": "abc123",
  "challengedId": "def456",
  "challengeType": "direct",
  "expiresAt": 1702598400
}
```

**Challenge Types:**
- `direct` - One user challenges another
- `open` - Anyone can participate

**Response (201):**
```json
{
  "id": "challenge999",
  "track_id": "track789",
  "challenger_id": "abc123",
  "challenged_id": "def456",
  "challenge_type": "direct",
  "status": "active",
  "best_time": null,
  "created_at": 1702512000,
  "expires_at": 1702598400
}
```

#### Get Challenge
```http
GET /challenges/:id
```

#### List Active Challenges
```http
GET /challenges
```

#### Get User's Challenges
```http
GET /challenges/user/:userId
```

#### Update Challenge
```http
PATCH /challenges/:id
Content-Type: application/json

{
  "bestTime": 240.5,
  "status": "completed"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Username and display name are required"
}
```

### 404 Not Found
```json
{
  "error": "User not found"
}
```

### 409 Conflict
```json
{
  "error": "Username already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Something went wrong!"
}
```

---

## Data Formats

### Timestamps
- All timestamps are Unix epoch time in seconds (for database)
- GPS timestamps are in milliseconds (for precision)

### GPS Coordinates
- Latitude/Longitude in decimal degrees
- Accuracy in meters

### Distance
- Always in meters
- Client should convert to preferred units (km, mi)

### Duration
- Always in seconds with decimal precision
- Example: 245.67 seconds = 4 minutes 5.67 seconds
