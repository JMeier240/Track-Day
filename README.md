# 🏁 TrackDay Racing

A community-driven challenge platform that gets kids and friends active outdoors through GPS-tracked competitions. Create tracks anywhere—neighborhood streets, bike paths, skate parks, or race tracks—and challenge others to beat your time!

## 🎯 Vision

**For Kids & Friends:** Get outside, explore your neighborhood, and compete with friends in real-world challenges.

**For Enthusiasts:** Track your performance, analyze your runs, and climb the leaderboards.

**For Professionals:** Advanced telemetry, detailed analytics, and professional-grade hardware (coming soon).

## ✨ Features

- 📍 **GPS Track Creation** - Record any route using your smartphone
- 🏆 **Challenge System** - Create direct challenges or open competitions
- 📊 **Leaderboards** - Compare times and compete for the top spot
- 🚴 **Multi-Sport** - Running, biking, skating, driving, go-karting
- 📱 **Mobile-First** - Optimized for smartphones and tablets
- 🌐 **Community-Driven** - Share tracks and compete with others

## 🚀 Quick Start

### 1. Start the Server
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

### 2. Open the Frontend
```bash
# Open frontend/index.html in your browser
open frontend/index.html
```

### 3. Populate Test Data (Optional)
```bash
cd scripts
npm install
npm run sim
```

For detailed setup instructions, see [Getting Started Guide](docs/GETTING_STARTED.md).

## 📚 Documentation

- **[Getting Started](docs/GETTING_STARTED.md)** - Installation and setup guide
- **[Architecture](docs/ARCHITECTURE.md)** - System design and technical overview
- **[API Documentation](docs/API.md)** - Complete API reference
- **[Hardware Plan](docs/HARDWARE.md)** - Future hardware development roadmap
- **[Product Roadmap](docs/ROADMAP.md)** - Feature planning and milestones

## 🛠️ Tech Stack

**Frontend:**
- HTML5/CSS3 (mobile-first design)
- Vanilla JavaScript
- Geolocation API

**Backend:**
- Node.js + Express
- SQLite (better-sqlite3)
- REST API

**Development:**
- Nodemon, Prettier, EditorConfig

## 🎮 How It Works

1. **Create a Profile** - Simple username and display name
2. **Record a Track** - Use GPS to capture your route
3. **Create a Challenge** - Challenge friends or make it open to all
4. **Complete the Challenge** - Others race your track to beat your time
5. **Climb the Leaderboard** - See where you rank against others

## 🗺️ Roadmap Highlights

- **Phase 1 (Current):** MVP with core features
- **Phase 2:** User authentication, social features, mobile apps
- **Phase 3:** Advanced analytics, video integration
- **Phase 4:** Premium subscriptions, monetization
- **Phase 5:** TrackDay Lite hardware device
- **Phase 6:** Professional telemetry platform

See [ROADMAP.md](docs/ROADMAP.md) for complete details.

## 🤝 Contributing

We welcome contributions! Check out the codebase, test the app, and submit PRs for improvements.

## 📄 License

See [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the racing community**