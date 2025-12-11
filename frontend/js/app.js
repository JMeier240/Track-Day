const API_BASE = 'http://localhost:3000/api';

const state = {
  currentUser: null,
  currentView: 'home',
  recording: false,
  waypoints: [],
  watchId: null,
  startTime: null,
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  loadUserFromStorage();
  setupNavigation();
  setupEventListeners();
  loadActiveChallenges();
});

// User Management
function loadUserFromStorage() {
  const user = localStorage.getItem('trackday_user');
  if (user) {
    state.currentUser = JSON.parse(user);
    updateUIForLoggedInUser();
  }
}

function saveUserToStorage(user) {
  localStorage.setItem('trackday_user', JSON.stringify(user));
  state.currentUser = user;
  updateUIForLoggedInUser();
}

function updateUIForLoggedInUser() {
  const userInfo = document.getElementById('user-info');
  const userSetup = document.getElementById('user-setup');
  const quickActions = document.getElementById('quick-actions');

  if (state.currentUser) {
    userInfo.textContent = `👤 ${state.currentUser.display_name}`;
    userSetup.style.display = 'none';
    quickActions.style.display = 'block';
  } else {
    userInfo.textContent = '';
    userSetup.style.display = 'block';
    quickActions.style.display = 'none';
  }
}

// Navigation
function setupNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

function switchView(viewName) {
  document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.remove('active'));

  document.getElementById(`${viewName}-view`).classList.add('active');
  document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

  state.currentView = viewName;

  if (viewName === 'tracks') loadTracks();
  if (viewName === 'challenges') loadChallenges();
  if (viewName === 'profile' && state.currentUser) loadProfile();
}

// Event Listeners
function setupEventListeners() {
  document.getElementById('create-user-btn').addEventListener('click', createUser);
  document.getElementById('create-track-btn').addEventListener('click', openTrackCreator);
  document.getElementById('new-track-btn').addEventListener('click', openTrackCreator);
  document.getElementById('browse-challenges-btn').addEventListener('click', () =>
    switchView('challenges')
  );

  document.getElementById('start-recording-btn').addEventListener('click', startRecording);
  document.getElementById('stop-recording-btn').addEventListener('click', stopRecording);
  document.getElementById('save-track-btn').addEventListener('click', saveTrack);
  document.getElementById('cancel-track-btn').addEventListener('click', closeTrackCreator);
}

// User Creation
async function createUser() {
  const username = document.getElementById('username').value.trim();
  const displayName = document.getElementById('display-name').value.trim();

  if (!username || !displayName) {
    alert('Please enter both username and display name');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, displayName }),
    });

    if (!response.ok) throw new Error('Failed to create user');

    const user = await response.json();
    saveUserToStorage(user);
    document.getElementById('username').value = '';
    document.getElementById('display-name').value = '';
  } catch (error) {
    alert('Error creating user: ' + error.message);
  }
}

// Track Creator
function openTrackCreator() {
  if (!state.currentUser) {
    alert('Please create a profile first');
    return;
  }
  document.getElementById('track-creator').style.display = 'flex';
}

function closeTrackCreator() {
  document.getElementById('track-creator').style.display = 'none';
  resetTrackCreator();
}

function resetTrackCreator() {
  document.getElementById('track-name').value = '';
  document.getElementById('track-description').value = '';
  document.getElementById('activity-type').value = 'running';
  state.waypoints = [];
  updateWaypointsPreview();
}

// GPS Recording
function startRecording() {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser');
    return;
  }

  state.recording = true;
  state.waypoints = [];
  state.startTime = Date.now();

  document.getElementById('start-recording-btn').disabled = true;
  document.getElementById('stop-recording-btn').disabled = false;
  document.getElementById('recording-status').textContent = '🔴 Recording...';

  state.watchId = navigator.geolocation.watchPosition(
    (position) => {
      const waypoint = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: position.timestamp,
        accuracy: position.coords.accuracy,
      };
      state.waypoints.push(waypoint);
      updateWaypointsPreview();
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
}

function stopRecording() {
  if (state.watchId) {
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId = null;
  }

  state.recording = false;
  document.getElementById('start-recording-btn').disabled = false;
  document.getElementById('stop-recording-btn').disabled = true;
  document.getElementById('recording-status').textContent = '⏹️ Recording stopped';
  document.getElementById('save-track-btn').disabled = state.waypoints.length < 2;
}

function updateWaypointsPreview() {
  document.getElementById('waypoint-count').textContent = state.waypoints.length;
  document.getElementById('track-distance').textContent = calculateDistance().toFixed(2);
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

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Save Track
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        creatorId: state.currentUser.id,
        waypoints: state.waypoints,
        distance: calculateDistance(),
        activityType,
      }),
    });

    if (!response.ok) throw new Error('Failed to save track');

    const track = await response.json();
    alert('Track saved successfully!');
    closeTrackCreator();
    switchView('tracks');
  } catch (error) {
    alert('Error saving track: ' + error.message);
  }
}

// Load Tracks
async function loadTracks() {
  try {
    const response = await fetch(`${API_BASE}/tracks`);
    if (!response.ok) throw new Error('Failed to load tracks');

    const tracks = await response.json();
    displayTracks(tracks);
  } catch (error) {
    console.error('Error loading tracks:', error);
    document.getElementById('tracks-list').innerHTML =
      '<div class="empty-state"><p>Error loading tracks</p></div>';
  }
}

function displayTracks(tracks) {
  const container = document.getElementById('tracks-list');

  if (tracks.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><p>No tracks yet. Create the first one!</p></div>';
    return;
  }

  container.innerHTML = tracks
    .map(
      (track) => `
    <div class="track-card" data-id="${track.id}">
      <h3>${track.name}</h3>
      <p>${track.description || 'No description'}</p>
      <div class="track-meta">
        <span class="meta-badge">🏃 ${track.activity_type}</span>
        <span class="meta-badge">📏 ${track.distance.toFixed(2)}m</span>
        <span class="meta-badge">📍 ${track.waypoints.length} waypoints</span>
      </div>
    </div>
  `
    )
    .join('');
}

// Load Challenges
async function loadChallenges() {
  try {
    const response = await fetch(`${API_BASE}/challenges`);
    if (!response.ok) throw new Error('Failed to load challenges');

    const challenges = await response.json();
    displayChallenges(challenges, 'challenges-list');
  } catch (error) {
    console.error('Error loading challenges:', error);
  }
}

async function loadActiveChallenges() {
  try {
    const response = await fetch(`${API_BASE}/challenges`);
    if (!response.ok) return;

    const challenges = await response.json();
    displayChallenges(challenges.slice(0, 3), 'active-challenges-list');
  } catch (error) {
    console.error('Error loading active challenges:', error);
  }
}

function displayChallenges(challenges, containerId) {
  const container = document.getElementById(containerId);

  if (challenges.length === 0) {
    container.innerHTML =
      '<div class="empty-state"><p>No active challenges. Create one!</p></div>';
    return;
  }

  container.innerHTML = challenges
    .map(
      (challenge) => `
    <div class="challenge-card" data-id="${challenge.id}">
      <h3>${challenge.track_name}</h3>
      <p>By: ${challenge.challenger_name}</p>
      <div class="challenge-meta">
        <span class="meta-badge">${challenge.challenge_type}</span>
        <span class="meta-badge ${challenge.status === 'active' ? 'status-active' : ''}">${challenge.status}</span>
        ${challenge.best_time ? `<span class="meta-badge">⏱️ ${challenge.best_time.toFixed(2)}s</span>` : ''}
      </div>
    </div>
  `
    )
    .join('');
}

// Load Profile
async function loadProfile() {
  const profileContent = document.getElementById('profile-content');
  profileContent.innerHTML = `
    <div class="profile-card">
      <h3>${state.currentUser.display_name}</h3>
      <p>@${state.currentUser.username}</p>
      <p>Member since: ${new Date(state.currentUser.created_at * 1000).toLocaleDateString()}</p>
    </div>
  `;

  try {
    const tracksResponse = await fetch(`${API_BASE}/tracks/user/${state.currentUser.id}`);
    const tracks = await tracksResponse.json();
    displayMyTracks(tracks);

    const attemptsResponse = await fetch(`${API_BASE}/attempts/user/${state.currentUser.id}`);
    const attempts = await attemptsResponse.json();
    displayMyAttempts(attempts);
  } catch (error) {
    console.error('Error loading profile data:', error);
  }
}

function displayMyTracks(tracks) {
  const container = document.getElementById('my-tracks-list');
  if (tracks.length === 0) {
    container.innerHTML = '<p class="empty-state">No tracks created yet</p>';
    return;
  }
  displayTracks(tracks);
}

function displayMyAttempts(attempts) {
  const container = document.getElementById('my-attempts-list');
  if (attempts.length === 0) {
    container.innerHTML = '<p class="empty-state">No attempts recorded yet</p>';
    return;
  }

  container.innerHTML = attempts
    .map(
      (attempt) => `
    <div class="track-card">
      <h4>Track: ${attempt.track_id}</h4>
      <p>Duration: ${attempt.duration.toFixed(2)}s</p>
      <p>Date: ${new Date(attempt.timestamp * 1000).toLocaleDateString()}</p>
    </div>
  `
    )
    .join('');
}
