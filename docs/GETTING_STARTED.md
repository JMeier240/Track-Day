# Getting Started with TrackDay Racing

## Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)
- Modern web browser with GPS support
- Git

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Track-Day
```

### 2. Set Up the Server
```bash
cd server
cp .env.example .env
npm install
```

### 3. Configure Environment
Edit `server/.env` if needed (defaults work for local development):
```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/trackday.db
CORS_ORIGIN=*
```

### 4. Start the Server
```bash
npm run dev
```

You should see:
```
🏁 TrackDay Racing API running on http://localhost:3000
📊 Database: ./data/trackday.db
```

### 5. Open the Frontend
In a new terminal or just open in browser:
```bash
# Navigate to project root
cd ..

# Open frontend/index.html in your browser
# On Mac:
open frontend/index.html

# On Linux:
xdg-open frontend/index.html

# On Windows:
start frontend/index.html
```

Or use a simple HTTP server:
```bash
cd frontend
python3 -m http.server 8080
# Then visit http://localhost:8080
```

### 6. Run the Simulator (Optional)
To populate the database with test data:
```bash
cd scripts
npm install
npm run sim
```

This will create:
- 3 test users
- 3 sample tracks
- Multiple attempts per track
- Several challenges

---

## Using the Application

### Creating a User Profile
1. Open the app in your browser
2. On the home screen, enter a username and display name
3. Click "Create Profile"
4. Your profile is saved locally

### Creating a Track
1. Click "Create New Track" or navigate to Tracks → + Create Track
2. Enter track details (name, description, activity type)
3. Click "Start Recording"
4. Grant GPS permission when prompted
5. Move around to record waypoints (or stay in one place for testing)
6. Click "Stop Recording" when done
7. Review the waypoint count and distance
8. Click "Save Track"

### Viewing Tracks
- Navigate to the "Tracks" tab
- See all created tracks with metadata
- Click on a track to view details (coming in next phase)

### Challenges
- Navigate to "Challenges" tab
- See all active challenges
- Create new challenges (API ready, UI coming soon)

---

## Development Guide

### Project Structure
```
Track-Day/
├── server/                 # Backend API
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── index.js       # Server entry point
│   ├── data/              # SQLite database (auto-created)
│   └── package.json
│
├── frontend/              # Web client
│   ├── css/
│   │   └── style.css     # Styles
│   ├── js/
│   │   └── app.js        # Application logic
│   └── index.html        # Main page
│
├── scripts/               # Utilities
│   ├── simulator.js      # Data generator
│   └── package.json
│
└── docs/                  # Documentation
    ├── ARCHITECTURE.md
    ├── API.md
    ├── HARDWARE.md
    └── ROADMAP.md
```

### Making Changes

#### Backend Changes
1. Edit files in `server/src/`
2. Nodemon will auto-reload the server
3. Test your changes via the API or frontend

#### Frontend Changes
1. Edit files in `frontend/`
2. Refresh the browser to see changes
3. Check browser console for errors

#### Database Schema Changes
1. Edit `server/src/models/database.js`
2. Delete `server/data/trackday.db` to recreate
3. Restart the server
4. Run simulator to repopulate test data

### API Testing

Using curl:
```bash
# Create a user
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","displayName":"Test User"}'

# Get all tracks
curl http://localhost:3000/api/tracks

# Get leaderboard for a track
curl http://localhost:3000/api/attempts/track/TRACK_ID/leaderboard
```

Using browser console:
```javascript
// Create a user
fetch('http://localhost:3000/api/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'testuser',
    displayName: 'Test User'
  })
}).then(r => r.json()).then(console.log);

// Get all tracks
fetch('http://localhost:3000/api/tracks')
  .then(r => r.json())
  .then(console.log);
```

---

## GPS Testing

### Testing Without Moving
For development, you can test GPS features without actually moving:

1. Use the simulator to create tracks
2. Use browser DevTools to mock GPS coordinates:
   - Open Chrome DevTools (F12)
   - Open Console drawer (Esc)
   - Click "⋮" → More tools → Sensors
   - Override geolocation with custom coordinates

### Testing With Real Movement
1. Open the app on your smartphone
2. Walk/bike/drive while recording
3. Ensure good GPS signal (outdoors works best)
4. Monitor accuracy values (should be <10m)

---

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Verify Node.js version: `node --version`
- Delete `node_modules` and run `npm install` again

### GPS not working
- Ensure you're using HTTPS or localhost
- Check browser GPS permissions
- Try in a different browser
- Test outdoors for better signal

### Database errors
- Delete `server/data/trackday.db` and restart
- Check file permissions
- Verify SQLite installation

### CORS errors
- Ensure server is running
- Check CORS_ORIGIN in .env
- Open frontend from same origin or use http-server

---

## Next Steps

### For Developers
1. Review the [Architecture](ARCHITECTURE.md) document
2. Check the [API Documentation](API.md)
3. Read through the [Roadmap](ROADMAP.md)
4. Look at open issues/features to implement

### For Product Development
1. Test the core user flow
2. Gather feedback from potential users
3. Identify pain points and UX issues
4. Prioritize features from the roadmap

### For Business Planning
1. Review the [Hardware Plan](HARDWARE.md)
2. Validate market assumptions
3. Connect with potential beta users
4. Research competition and positioning

---

## Contributing

We welcome contributions! Here's how:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Follow existing patterns
- Use Prettier for formatting
- Write clear commit messages
- Comment complex logic

---

## Support

- Check documentation in `/docs`
- Review code comments
- Open an issue for bugs
- Reach out for questions

---

## License

See LICENSE file for details.
