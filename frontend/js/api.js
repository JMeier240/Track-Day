/**
 * API Utility for TrackDay Racing
 * Handles all HTTP requests to the backend with automatic authentication
 */

const API_BASE_URL = 'http://localhost:3001';

/**
 * Makes an authenticated API request
 * @param {string} endpoint - API endpoint (e.g., '/api/auth/register')
 * @param {Object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization token if available
  const token = localStorage.getItem('auth_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Merge options
  const config = {
    ...options,
    headers,
  };

  // Add body as JSON if provided
  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(url, config);

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { message: await response.text() };
    }

    // Handle errors
    if (!response.ok) {
      const error = new Error(data.message || data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // Network errors or parsing errors
    if (error.name === 'TypeError' || error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection and ensure the server is running.');
    }
    throw error;
  }
}

/**
 * GET request helper
 */
async function get(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'GET' });
}

/**
 * POST request helper
 */
async function post(endpoint, body = {}, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'POST', body });
}

/**
 * PUT request helper
 */
async function put(endpoint, body = {}, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'PUT', body });
}

/**
 * DELETE request helper
 */
async function del(endpoint, options = {}) {
  return apiRequest(endpoint, { ...options, method: 'DELETE' });
}

// Export for use in other modules
window.api = {
  request: apiRequest,
  get,
  post,
  put,
  delete: del,
};
