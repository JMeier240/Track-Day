const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Sample track patterns (lat/lng coordinates)
const TRACK_PATTERNS = {
  neighborhood_loop: [
    { lat: 40.7589, lng: -73.9851 },
    { lat: 40.759, lng: -73.984 },
    { lat: 40.758, lng: -73.9835 },
    { lat: 40.757, lng: -73.9845 },
    { lat: 40.7575, lng: -73.9855 },
    { lat: 40.7589, lng: -73.9851 },
  ],
  street_race: [
    { lat: 34.0522, lng: -118.2437 },
    { lat: 34.0525, lng: -118.243 },
    { lat: 34.053, lng: -118.242 },
    { lat: 34.0535, lng: -118.241 },
    { lat: 34.054, lng: -118.24 },
  ],
  park_run: [
    { lat: 51.5074, lng: -0.1278 },
    { lat: 51.508, lng: -0.127 },
    { lat: 51.5085, lng: -0.126 },
    { lat: 51.509, lng: -0.1255 },
    { lat: 51.5095, lng: -0.125 },
    { lat: 51.51, lng: -0.1245 },
  ],
};

class TrackDaySimulator {
  constructor() {
    this.users = [];
    this.tracks = [];
  }

  async init() {
    console.log('🏁 TrackDay Racing Simulator');
    console.log('================================\n');

    try {
      await this.createTestUsers();
      await this.createTestTracks();
      await this.createTestAttempts();
      await this.createTestChallenges();
      console.log('\n✅ Simulation complete!');
      console.log('🌐 Open frontend/index.html to see the results');
    } catch (error) {
      console.error('❌ Simulation error:', error.message);
    }
  }

  async createTestUsers() {
    console.log('👤 Creating test users...');
    const testUsers = [
      { username: 'speedster', displayName: 'Speed Racer' },
      { username: 'bikeking', displayName: 'Bike King' },
      { username: 'runner42', displayName: 'Marathon Mike' },
    ];

    for (const userData of testUsers) {
      try {
        const response = await axios.post(`${API_BASE}/users`, userData);
        this.users.push(response.data);
        console.log(`  ✓ Created user: ${response.data.display_name}`);
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`  ℹ User ${userData.username} already exists`);
        } else {
          throw error;
        }
      }
    }
  }

  async createTestTracks() {
    console.log('\n🗺️  Creating test tracks...');

    const trackConfigs = [
      {
        name: 'Neighborhood Speed Loop',
        description: 'Quick loop around the neighborhood - perfect for a quick challenge',
        pattern: 'neighborhood_loop',
        activityType: 'biking',
      },
      {
        name: 'Downtown Street Circuit',
        description: 'Urban street racing circuit in the heart of the city',
        pattern: 'street_race',
        activityType: 'driving',
      },
      {
        name: 'Central Park Morning Run',
        description: 'Beautiful morning running track through the park',
        pattern: 'park_run',
        activityType: 'running',
      },
    ];

    for (const config of trackConfigs) {
      const creator = this.users[Math.floor(Math.random() * this.users.length)];
      const waypoints = this.generateWaypoints(TRACK_PATTERNS[config.pattern]);
      const distance = this.calculateDistance(waypoints);

      try {
        const response = await axios.post(`${API_BASE}/tracks`, {
          name: config.name,
          description: config.description,
          creatorId: creator.id,
          waypoints: waypoints,
          distance: distance,
          activityType: config.activityType,
        });
        this.tracks.push(response.data);
        console.log(`  ✓ Created track: ${response.data.name} (${distance.toFixed(2)}m)`);
      } catch (error) {
        console.error(`  ✗ Failed to create track: ${config.name}`);
      }
    }
  }

  async createTestAttempts() {
    console.log('\n⏱️  Creating test attempts...');

    for (const track of this.tracks) {
      for (let i = 0; i < 3; i++) {
        const user = this.users[i % this.users.length];
        const duration = this.generateDuration(track.distance);
        const gpsData = this.simulateGPSRun(track.waypoints, duration);

        try {
          const response = await axios.post(`${API_BASE}/attempts`, {
            trackId: track.id,
            userId: user.id,
            duration: duration,
            gpsData: gpsData,
          });
          console.log(
            `  ✓ ${user.display_name} completed ${track.name} in ${duration.toFixed(2)}s`
          );
        } catch (error) {
          console.error(`  ✗ Failed to create attempt`);
        }
      }
    }
  }

  async createTestChallenges() {
    console.log('\n🏆 Creating test challenges...');

    for (const track of this.tracks) {
      const challenger = this.users[0];
      const challenged = this.users[1];

      try {
        const response = await axios.post(`${API_BASE}/challenges`, {
          trackId: track.id,
          challengerId: challenger.id,
          challengedId: challenged.id,
          challengeType: 'direct',
          expiresAt: Math.floor(Date.now() / 1000) + 86400 * 7,
        });
        console.log(`  ✓ ${challenger.display_name} challenged ${challenged.display_name} on ${track.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to create challenge`);
      }
    }

    const openChallenge = this.tracks[0];
    const openChallenger = this.users[2];

    try {
      await axios.post(`${API_BASE}/challenges`, {
        trackId: openChallenge.id,
        challengerId: openChallenger.id,
        challengeType: 'open',
      });
      console.log(`  ✓ ${openChallenger.display_name} created an open challenge on ${openChallenge.name}`);
    } catch (error) {
      console.error(`  ✗ Failed to create open challenge`);
    }
  }

  generateWaypoints(pattern) {
    const startTime = Date.now();
    return pattern.map((point, index) => ({
      lat: point.lat + (Math.random() - 0.5) * 0.0001,
      lng: point.lng + (Math.random() - 0.5) * 0.0001,
      timestamp: startTime + index * 2000,
      accuracy: 5 + Math.random() * 5,
    }));
  }

  calculateDistance(waypoints) {
    if (waypoints.length < 2) return 0;

    let total = 0;
    for (let i = 1; i < waypoints.length; i++) {
      total += this.getDistanceBetweenPoints(waypoints[i - 1], waypoints[i]);
    }
    return total;
  }

  getDistanceBetweenPoints(p1, p2) {
    const R = 6371e3;
    const φ1 = (p1.lat * Math.PI) / 180;
    const φ2 = (p2.lat * Math.PI) / 180;
    const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
    const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  generateDuration(distance) {
    const avgSpeed = 3 + Math.random() * 4;
    return distance / avgSpeed;
  }

  simulateGPSRun(waypoints, duration) {
    const pointsCount = Math.min(waypoints.length, 20);
    const timePerPoint = duration / pointsCount;
    const startTime = Date.now();

    return Array.from({ length: pointsCount }, (_, i) => {
      const waypointIndex = Math.floor((i * waypoints.length) / pointsCount);
      const waypoint = waypoints[waypointIndex];

      return {
        lat: waypoint.lat + (Math.random() - 0.5) * 0.00005,
        lng: waypoint.lng + (Math.random() - 0.5) * 0.00005,
        timestamp: startTime + i * timePerPoint * 1000,
        speed: 2 + Math.random() * 6,
      };
    });
  }
}

const simulator = new TrackDaySimulator();
simulator.init();
