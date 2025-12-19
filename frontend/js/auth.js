/**
 * Authentication Module for TrackDay Racing
 * Handles user registration, login, magic link verification, and session management
 */

/**
 * Register a new user
 * @param {string} email - User's email address
 * @param {string} name - User's display name
 * @returns {Promise<Object>} Registration response
 */
async function register(email, name) {
  try {
    const response = await api.post('/api/auth/register', { email, name });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Request a magic link to be sent to the user's email
 * @param {string} email - User's email address
 * @returns {Promise<Object>} Request response
 */
async function requestMagicLink(email) {
  try {
    const response = await api.post('/api/auth/request-link', { email });
    return { success: true, data: response };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Verify a magic link token and establish a session
 * @param {string} token - Magic link token from URL
 * @returns {Promise<Object>} Verification response with user data and JWT
 */
async function verifyToken(token) {
  try {
    const response = await api.get(`/api/auth/verify/${token}`);

    if (response.token) {
      // Store JWT token
      localStorage.setItem('auth_token', response.token);

      // Store user information
      if (response.user) {
        localStorage.setItem('current_user', JSON.stringify(response.user));
      }

      return { success: true, data: response };
    }

    return { success: false, error: 'Invalid response from server' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Log out the current user
 */
function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('current_user');

  // Redirect to home or refresh page
  window.location.href = window.location.pathname;
}

/**
 * Get the current authenticated user
 * @returns {Object|null} User object or null if not authenticated
 */
function getCurrentUser() {
  try {
    const userJson = localStorage.getItem('current_user');
    return userJson ? JSON.parse(userJson) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
function isAuthenticated() {
  return !!localStorage.getItem('auth_token');
}

/**
 * Initialize authentication on page load
 * - Checks for token in URL parameters
 * - Updates UI based on auth state
 */
async function initAuth() {
  // Check for token in URL (magic link verification)
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (token) {
    // Show loading state
    showAuthMessage('Verifying your magic link...', 'info');

    // Verify the token
    const result = await verifyToken(token);

    if (result.success) {
      // Remove token from URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // Show success message
      const user = result.data.user;
      showAuthMessage(`Welcome back, ${user.name}!`, 'success');

      // Update UI
      updateAuthUI();

      // Hide message after 3 seconds
      setTimeout(() => hideAuthMessage(), 3000);
    } else {
      showAuthMessage(`Verification failed: ${result.error}`, 'error');
    }
  } else {
    // Just update UI based on current auth state
    updateAuthUI();
  }
}

/**
 * Update the UI based on authentication state
 */
function updateAuthUI() {
  const authenticated = isAuthenticated();
  const user = getCurrentUser();

  // Auth container
  const authContainer = document.getElementById('auth-container');
  const authForms = document.getElementById('auth-forms');
  const userInfo = document.getElementById('user-info');

  if (authenticated && user) {
    // Hide forms, show user info
    if (authForms) authForms.style.display = 'none';
    if (userInfo) {
      userInfo.style.display = 'flex';
      const userNameElement = document.getElementById('auth-user-name');
      if (userNameElement) {
        userNameElement.textContent = user.name;
      }
    }

    // Update welcome message in dashboard
    const displayName = document.getElementById('user-display-name');
    if (displayName) {
      displayName.textContent = user.name;
    }

    // Enable protected actions
    const startRaceBtn = document.getElementById('start-race-btn');
    if (startRaceBtn) {
      startRaceBtn.disabled = false;
      startRaceBtn.title = '';
    }
  } else {
    // Show forms, hide user info
    if (authForms) authForms.style.display = 'block';
    if (userInfo) userInfo.style.display = 'none';

    // Disable protected actions
    const startRaceBtn = document.getElementById('start-race-btn');
    if (startRaceBtn) {
      startRaceBtn.disabled = true;
      startRaceBtn.title = 'Please log in to start racing';
    }
  }
}

/**
 * Show authentication message
 * @param {string} message - Message text
 * @param {string} type - Message type: 'success', 'error', 'info'
 */
function showAuthMessage(message, type = 'info') {
  const messageContainer = document.getElementById('auth-message');
  if (!messageContainer) return;

  messageContainer.textContent = message;
  messageContainer.className = `auth-message auth-message-${type}`;
  messageContainer.style.display = 'block';
}

/**
 * Hide authentication message
 */
function hideAuthMessage() {
  const messageContainer = document.getElementById('auth-message');
  if (messageContainer) {
    messageContainer.style.display = 'none';
  }
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById('login-email').value.trim();

  if (!email) {
    showAuthMessage('Please enter your email address', 'error');
    return;
  }

  // Disable button and show loading
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  const result = await requestMagicLink(email);

  submitBtn.disabled = false;
  submitBtn.textContent = originalText;

  if (result.success) {
    showAuthMessage(`Magic link sent to ${email}! Check your inbox.`, 'success');
    document.getElementById('login-form').reset();
  } else {
    showAuthMessage(result.error, 'error');
  }
}

/**
 * Handle registration form submission
 */
async function handleRegister(event) {
  event.preventDefault();

  const email = document.getElementById('register-email').value.trim();
  const name = document.getElementById('register-name').value.trim();

  if (!email || !name) {
    showAuthMessage('Please fill in all fields', 'error');
    return;
  }

  // Disable button and show loading
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating...';

  const result = await register(email, name);

  submitBtn.disabled = false;
  submitBtn.textContent = originalText;

  if (result.success) {
    showAuthMessage(`Account created! Magic link sent to ${email}.`, 'success');
    document.getElementById('register-form').reset();

    // Switch to login view after 2 seconds
    setTimeout(() => {
      document.getElementById('show-login-btn').click();
    }, 2000);
  } else {
    showAuthMessage(result.error, 'error');
  }
}

/**
 * Toggle between login and register forms
 */
function showLoginForm() {
  document.getElementById('login-form').style.display = 'block';
  document.getElementById('register-form').style.display = 'none';
  document.getElementById('show-login-btn').classList.add('active');
  document.getElementById('show-register-btn').classList.remove('active');
  hideAuthMessage();
}

function showRegisterForm() {
  document.getElementById('login-form').style.display = 'none';
  document.getElementById('register-form').style.display = 'block';
  document.getElementById('show-login-btn').classList.remove('active');
  document.getElementById('show-register-btn').classList.add('active');
  hideAuthMessage();
}

// Export functions
window.auth = {
  register,
  requestMagicLink,
  verifyToken,
  logout,
  getCurrentUser,
  isAuthenticated,
  initAuth,
  updateAuthUI,
  showAuthMessage,
  hideAuthMessage,
  handleLogin,
  handleRegister,
  showLoginForm,
  showRegisterForm,
};

// Initialize auth when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
