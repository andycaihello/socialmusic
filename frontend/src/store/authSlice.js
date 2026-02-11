import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../api';

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      const { access_token, refresh_token, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      return { user, access_token, refresh_token };
    } catch (error) {
      console.error('Login API error:', error);
      // 提取错误信息
      const errorMessage = error.response?.data?.error
        || error.response?.data?.message
        || error.message
        || '登录失败，请检查用户名和密码';
      return rejectWithValue(errorMessage);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      const { access_token, refresh_token, user } = response.data;

      // Store tokens in localStorage
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);

      return { user, access_token, refresh_token };
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();

      // Remove tokens from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      return null;
    } catch (error) {
      // Even if API call fails, clear local storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      return null;
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  'auth/getCurrentUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authAPI.getCurrentUser();
      return response.data.user;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to get user');
    }
  }
);

// Initial state
const initialState = {
  user: null,
  access_token: localStorage.getItem('access_token'),
  refresh_token: localStorage.getItem('refresh_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  loading: false,
  error: null,
};

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (state, action) => {
      const { access_token, refresh_token } = action.payload;
      state.access_token = access_token;
      state.refresh_token = refresh_token;
      state.isAuthenticated = true;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.access_token = action.payload.access_token;
        state.refresh_token = action.payload.refresh_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.access_token = action.payload.access_token;
        state.refresh_token = action.payload.refresh_token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.access_token = null;
        state.refresh_token = null;
        state.isAuthenticated = false;
        state.loading = false;
        state.error = null;
      })

      // Get current user
      .addCase(getCurrentUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.access_token = null;
        state.refresh_token = null;
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      });
  },
});

export const { clearError, setTokens } = authSlice.actions;
export default authSlice.reducer;
