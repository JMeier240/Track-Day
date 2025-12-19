const API_BASE = 'http://localhost:3001/api';

// Helper function to get auth headers
function getAuthHeaders() {
  const token = localStorage.getItem('trackday_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const state = {
  currentUser: null,
  recording: false,
  waypoints: [],
  watchId: null,
  startTime: null,
  recordingStartTime: null,
  theme: 'light',
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadTheme();
  checkMagicLinkAuth(); // Check if user clicked magic link
  loadUserFromStorage();
  setupEventListeners();
  loadDashboardData();
});

// ========== MAGIC LINK AUTHENTICATION ==========

function checkMagicLinkAuth() {
  const hash = window.location.hash;

  // Check if URL contains magic link authentication data
  if (hash.includes('auth-success')) {
    try {
      // Extract token and user data from hash
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('token');
      const userDataEncoded = params.get('user');

      if (token && userDataEncoded) {
        const user = JSON.parse(decodeURIComponent(userDataEncoded));

        // Save to localStorage
        localStorage.setItem('trackday_token', token);
        localStorage.setItem('trackday_user', JSON.stringify(user));

        state.currentUser = user;

        // Clear the hash from URL
        window.location.hash = '';

        // Show success message
        alert(`Welcome, ${user.displayName}! You're now logged in.`);

        // Reload the page to update UI
        window.location.reload();
      }
    } catch (error) {
      console.error('Error processing magic link:', error);
      alert('Authentication failed. Please try again.');
    }
  }
}

// ========== THEME MANAGEMENT ==========

function loadTheme() {
  const savedTheme = localStorage.getItem('trackday_theme') || 'light';
  state.theme = savedTheme;
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButton();
}

function toggleTheme() {
  state.theme = state.theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('trackday_theme', state.theme);
  updateThemeButton();
}

function updateThemeButton() {
  const btn = document.getElementById('theme-toggle');
  btn.textContent = state.theme === 'light' ? 'Dark Mode' : 'Light Mode';
}

// ========== USER MANAGEMENT ==========

function loadUserFromStorage() {
  const user = localStorage.getItem('trackday_user');
  if (user) {
    state.currentUser = JSON.parse(user);
    updateUserDisplay();
  }
}

function saveUserToStorage(user) {
  localStorage.setItem('trackday_user', JSON.stringify(user));
  state.currentUser = user;
  updateUserDisplay();
  loadDashboardData();
}

function updateUserDisplay() {
  const displayNameEl = document.getElementById('user-display-name');
  if (state.currentUser) {
    displayNameEl.textContent = state.currentUser.display_name;
  } else {
    displayNameEl.textContent = 'Driver';
  }
}

async function createUser() {
  const email = document.getElementById('email').value.trim();
  const displayName = document.getElementById('display-name').value.trim();

  if (!email || !displayName) {
    alert('Please enter email and display name');
    return;
  }

  try {
    // Use passwordless registration endpoint
    const response = await fetch(`${API_BASE}/auth/register-passwordless`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, displayName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create account');
    }

    const result = await response.json();

    // Show success message and instructions
    alert(
      `${result.message}\n\n` +
      `A magic link has been generated and printed to the server console.\n` +
      `Click the link in the console to complete authentication.`
    );

    closeModal('profile-modal');
    document.getElementById('email').value = '';
    document.getElementById('display-name').value = '';
  } catch (error) {
    alert('Error creating account: ' + error.message);
  }
}

// ========== DASHBOARD DATA ==========

async function loadDashboardData() {
  await Promise.all([loadLeaderboard(), loadRecentRaces(), loadUserStats()]);
}

async function loadUserStats() {
  if (!state.currentUser) {
    document.getElementById('personal-best').textContent = '--:--:---';
    document.getElementById('avg-speed').textContent = '-- mph';
    document.getElementById('total-laps').textContent = '0';
    document.getElementById('week-races').textContent = '0';
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/attempts/user/${state.currentUser.id}`);
    if (!response.ok) return;

    const attempts = await response.json();

    if (attempts.length > 0) {
      const bestTime = Math.min(...attempts.map((a) => a.duration));
      document.getElementById('personal-best').textContent = formatTime(bestTime);

      const avgSpeed = calculateAverageSpeed(attempts);
      document.getElementById('avg-speed').textContent = avgSpeed.toFixed(1) + ' mph';

      document.getElementById('total-laps').textContent = attempts.length.toString();

      const weekAgo = Math.floor(Date.now() / 1000) - 7 * 24 * 60 * 60;
      const weekRaces = attempts.filter((a) => a.timestamp > weekAgo).length;
      document.getElementById('week-races').textContent = weekRaces.toString();
    }
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
}

function calculateAverageSpeed(attempts) {
  if (attempts.length === 0) return 0;
  let totalSpeed = 0;
  let count = 0;

  attempts.forEach((attempt) => {
    if (attempt.gps_data && attempt.gps_data.length > 0) {
      attempt.gps_data.forEach((point) => {
        if (point.speed) {
          totalSpeed += point.speed * 2.23694; // m/s to mph
          count++;
        }
      });
    }
  });

  return count > 0 ? totalSpeed / count : 0;
}

async function loadLeaderboard() {
  try {
    const tracksResponse = await fetch(`${API_BASE}/tracks`);
    if (!tracksResponse.ok) return;

    const tracks = await tracksResponse.json();
    if (tracks.length === 0) {
      showEmptyLeaderboard();
      return;
    }

    const firstTrack = tracks[0];
    const leaderboardResponse = await fetch(`${API_BASE}/attempts/track/${firstTrack.id}/leaderboard?limit=5`);
    if (!leaderboardResponse.ok) return;

    const leaderboard = await leaderboardResponse.json();
    displayLeaderboard(leaderboard);
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    showEmptyLeaderboard();
  }
}

function showEmptyLeaderboard() {
  document.getElementById('leaderboard').innerHTML = `
    <div class="empty-state">
      <p>No leaderboard data yet. Create a track and start racing!</p>
    </div>
  `;
}

function displayLeaderboard(entries) {
  const container = document.getElementById('leaderboard');

  if (entries.length === 0) {
    showEmptyLeaderboard();
    return;
  }

  container.innerHTML = entries
    .map(
      (entry, index) => `
    <div class="leaderboard-row">
      <div class="leaderboard-rank">${index + 1}</div>
      <div class="leaderboard-name">${entry.display_name || entry.username}</div>
      <div class="leaderboard-time">${formatTime(entry.duration)}</div>
      <div class="leaderboard-speed">${calculateEntrySpeed(entry)} mph</div>
      <div class="leaderboard-car">#${(index + 21).toString()}</div>
    </div>
  `
    )
    .join('');
}

function calculateEntrySpeed(entry) {
  if (!entry.gps_data || entry.gps_data.length === 0) return '--';
  const avgSpeed = entry.gps_data.reduce((sum, point) => sum + (point.speed || 0), 0) / entry.gps_data.length;
  return (avgSpeed * 2.23694).toFixed(1); // m/s to mph
}

async function loadRecentRaces() {
  try {
    const tracksResponse = await fetch(`${API_BASE}/tracks`);
    if (!tracksResponse.ok) return;

    const tracks = await tracksResponse.json();

    if (tracks.length === 0) {
      showEmptyRaces();
      return;
    }

    displayRecentRaces(tracks.slice(0, 3));
  } catch (error) {
    console.error('Error loading recent races:', error);
    showEmptyRaces();
  }
}

function showEmptyRaces() {
  document.getElementById('recent-races').innerHTML = `
    <div class="empty-state">
      <p>No recent races. Start your first race!</p>
    </div>
  `;
}

function displayRecentRaces(tracks) {
  const container = document.getElementById('recent-races');

  container.innerHTML = tracks
    .map(
      (track) => `
    <div class="race-item">
      <div class="race-info">
        <h3>${track.name}</h3>
        <div class="race-details">
          ${new Date(track.created_at * 1000).toLocaleDateString()} • ${track.waypoints.length} laps • Best ${formatTime(Math.random() * 60 + 40)} • Avg ${(Math.random() * 20 + 50).toFixed(1)} mph
        </div>
      </div>
      <button class="race-share" onclick="shareRace('${track.id}')">Share</button>
    </div>
  `
    )
    .join('');
}

function shareRace(trackId) {
  alert('Share functionality coming soon! Track ID: ' + trackId);
}

// ========== TRACK CREATION ==========

function openTrackCreator() {
  if (!state.currentUser) {
    openModal('profile-modal');
    return;
  }
  resetTrackForm();
  openModal('track-modal');
}

function resetTrackForm() {
  document.getElementById('track-name').value = '';
  document.getElementById('track-description').value = '';
  document.getElementById('activity-type').value = 'driving';
  state.waypoints = [];
  state.recordingStartTime = null;
  updateRecorderUI();
}

function startRecording() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  state.recording = true;
  state.waypoints = [];
  state.recordingStartTime = Date.now();

  document.getElementById('start-recording-btn').disabled = true;
  document.getElementById('stop-recording-btn').disabled = false;
  document.getElementById('recorder-status').textContent = '● Recording...';
  document.getElementById('recorder-status').classList.add('recording');

  state.watchId = navigator.geolocation.watchPosition(
    (position) => {
      const waypoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy,
        speed: position.coords.speed || 0,
      };
      state.waypoints.push(waypoint);
      updateRecorderUI();
    },
    (error) => {
      console.error('GPS Error:', error);
      alert('GPS Error: ' + error.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );

  updateRecorderDuration();
}

function stopRecording() {
  if (state.watchId) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }

  state.recording = false;
  document.getElementById('start-recording-btn').disabled = false;
  document.getElementById('stop-recording-btn').disabled = true;
  document.getElementById('recorder-status').textContent = 'Recording stopped';
  document.getElementById('recorder-status').classList.remove('recording');
  document.getElementById('save-track-btn').disabled = state.waypoints.length < 2;
}

function updateRecorderUI() {
  document.getElementById('waypoint-count').textContent = state.waypoints.length;
  document.getElementById('track-distance').textContent = calculateDistance().toFixed(0) + ' m';
}

function updateRecorderDuration() {
  if (!state.recording || !state.recordingStartTime) return;

  const elapsed = Math.floor((Date.now() - state.recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  document.getElementById('recording-duration').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (state.recording) {
    setTimeout(updateRecorderDuration, 1000);
  }
}

function calculateDistance() {
  if (state.waypoints.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < state.waypoints.length; i++) {
    total += getDistanceBetweenPoints(state.waypoints[i - 1], state.waypoints[i]);
  }
  return total;
}

function getDistanceBetweenPoints(p1, p2) {
  const R = 6371e3;
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

async function saveTrack() {
  const name = document.getElementById('track-name').value.trim();
  const description = document.getElementById('track-description').value.trim();
  const activityType = document.getElementById('activity-type').value;

  if (!name) {
    alert('Please enter a track name');
    return;
  }

  if (state.waypoints.length < 2) {
    alert('Please record at least 2 waypoints');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/tracks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        name,
        description,
        waypoints: state.waypoints,
        distance: calculateDistance(),
        activityType,
      }),
    });

    if (!response.ok) throw new Error('Failed to save track');

    const track = await response.json();
    alert('Track saved successfully!');
    closeModal('track-modal');
    loadDashboardData();
  } catch (error) {
    alert('Error saving track: ' + error.message);
  }
}

// ========== RACING ==========

async function startRace() {
  if (!state.currentUser) {
    openModal('profile-modal');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/tracks`);
    if (!response.ok) throw new Error('Failed to load tracks');

    const tracks = await response.json();

    if (tracks.length === 0) {
      alert('No tracks available. Create a track first!');
      return;
    }

    displayTrackList(tracks);
    openModal('race-modal');
  } catch (error) {
    alert('Error loading tracks: ' + error.message);
  }
}

function displayTrackList(tracks) {
  const container = document.getElementById('track-list');

  container.innerHTML = tracks
    .map(
      (track) => `
    <div class="track-list-item" onclick="selectTrack('${track.id}')">
      <h4>${track.name}</h4>
      <p>${track.activity_type} • ${track.distance.toFixed(0)}m • ${track.waypoints.length} waypoints</p>
    </div>
  `
    )
    .join('');
}

function selectTrack(trackId) {
  alert(`Racing on track ${trackId}! Full racing implementation coming soon.`);
  closeModal('race-modal');
}

// ========== MODAL MANAGEMENT ==========

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
  }
}

// ========== EVENT LISTENERS ==========

function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Quick actions
  document.getElementById('create-profile-btn').addEventListener('click', () => openModal('profile-modal'));
  document.getElementById('create-track-btn').addEventListener('click', openTrackCreator);
  document.getElementById('start-race-btn').addEventListener('click', startRace);

  // Share race card
  document.getElementById('share-race-card-btn').addEventListener('click', () => {
    alert('Race card sharing coming soon!');
  });

  // Profile modal
  document.getElementById('save-profile-btn').addEventListener('click', createUser);

  // Track modal
  document.getElementById('start-recording-btn').addEventListener('click', startRecording);
  document.getElementById('stop-recording-btn').addEventListener('click', stopRecording);
  document.getElementById('save-track-btn').addEventListener('click', saveTrack);

  // Modal close buttons
  document.querySelectorAll('.modal-close, .btn-secondary[data-modal]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const modalId = e.target.getAttribute('data-modal');
      if (modalId) closeModal(modalId);
    });
  });

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        modal.classList.remove('active');
      }
    });
  });
}

// ========== UTILITIES ==========

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

// Make functions global for onclick handlers
window.shareRace = shareRace;
window.selectTrack = selectTrack;
