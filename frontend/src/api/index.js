/**
 * API client configuration with Axios interceptors
 */
import axios from 'axios';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30秒超时
  withCredentials: false, // 微信浏览器兼容性
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle 401 errors and refresh token
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.error('API Error:', error.response?.status, error.config?.url, error.message);
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');

        if (!refreshToken) {
          // No refresh token, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // Try to refresh the token
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/auth/refresh-token`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { access_token, refresh_token } = response.data;

        // Store new tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// User API
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (data) => api.put('/users/me', data),
  changePassword: (data) => api.put('/users/me/password', data),
  uploadAvatar: (formData) => api.post('/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getFollowers: (userId) => api.get(`/users/${userId}/followers`),
  getFollowing: (userId) => api.get(`/users/${userId}/following`),
  searchUsers: (query) => api.get('/users/search', { params: { q: query } }),
};

// Social API
export const socialAPI = {
  followUser: (userId) => api.post(`/social/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/social/follow/${userId}`),
  isFollowing: (userId) => api.get(`/social/is-following/${userId}`),
  getFollowers: (userId) => api.get(`/social/followers/${userId}`),
  getFollowing: (userId) => api.get(`/social/following/${userId}`),
};

// Music API
export const musicAPI = {
  getSongs: (params) => api.get('/songs', { params }),
  getSongDetail: (songId) => api.get(`/songs/${songId}`),
  getTrendingSongs: () => api.get('/songs/trending'),
  getLatestSongs: () => api.get('/songs/latest'),
  getArtists: () => api.get('/artists'),
  getArtist: (artistId) => api.get(`/artists/${artistId}`),
  getArtistSongs: (artistId) => api.get(`/artists/${artistId}/songs`),
  search: (query, type = 'all') => api.get('/search', { params: { q: query, type } }),
};

// Interaction API
export const interactionAPI = {
  likeSong: (songId) => api.post(`/songs/${songId}/like`),
  unlikeSong: (songId) => api.delete(`/songs/${songId}/like`),
  getLikeStatus: (songId) => api.get(`/songs/${songId}/like/status`),
  playSong: (songId, data) => api.post(`/songs/${songId}/play`, data),
  addComment: (songId, data) => api.post(`/songs/${songId}/comments`, data),
  getComments: (songId, params) => api.get(`/songs/${songId}/comments`, { params }),
  deleteComment: (commentId) => api.delete(`/comments/${commentId}`),
  likeComment: (commentId) => api.post(`/comments/${commentId}/like`),
  unlikeComment: (commentId) => api.delete(`/comments/${commentId}/like`),
};

// Feed API
export const feedAPI = {
  getRecommended: (params) => api.get('/feed/recommended', { params }),
  getFriendsFeed: (params) => api.get('/feed/friends', { params }),
  getFriendsActivity: (params) => api.get('/feed/friends-activity', { params }),
  getTrending: (params) => api.get('/feed/trending', { params }),
  getNewReleases: (params) => api.get('/feed/new-releases', { params }),
  getArtistsHot: (params) => api.get('/feed/artists-hot', { params }),
};

// Message API
export const messageAPI = {
  sendMessage: (data) => api.post('/messages', data),
  getConversations: () => api.get('/messages/conversations'),
  getConversation: (userId, params) => api.get(`/messages/conversation/${userId}`, { params }),
  markAsRead: (messageId) => api.put(`/messages/${messageId}/read`),
  markConversationAsRead: (userId) => api.put(`/messages/conversation/${userId}/read`),
  getUnreadCount: () => api.get('/messages/unread-count'),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

export default api;
