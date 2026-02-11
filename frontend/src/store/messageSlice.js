/**
 * Message Redux slice for private messaging
 */
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageAPI } from '../api';

// Async thunks
export const fetchConversations = createAsyncThunk(
  'message/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getConversations();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || '获取会话列表失败');
    }
  }
);

export const fetchConversation = createAsyncThunk(
  'message/fetchConversation',
  async ({ userId, page = 1, per_page = 20 }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getConversation(userId, { page, per_page });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || '获取对话历史失败');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'message/sendMessage',
  async ({ receiver_id, content }, { rejectWithValue }) => {
    try {
      const response = await messageAPI.sendMessage({ receiver_id, content });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || '发送消息失败');
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'message/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await messageAPI.getUnreadCount();
      return response.data.count;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || '获取未读消息数失败');
    }
  }
);

export const markConversationAsRead = createAsyncThunk(
  'message/markConversationAsRead',
  async (userId, { rejectWithValue }) => {
    try {
      await messageAPI.markConversationAsRead(userId);
      return userId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || '标记已读失败');
    }
  }
);

const messageSlice = createSlice({
  name: 'message',
  initialState: {
    conversations: [],
    currentConversation: null,
    messages: [],
    unreadCount: 0,
    loading: false,
    error: null,
    pagination: {
      page: 1,
      per_page: 20,
      total: 0,
      has_next: false,
    },
  },
  reducers: {
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
      state.messages = [];
      state.pagination = {
        page: 1,
        per_page: 20,
        total: 0,
        has_next: false,
      };
    },
    clearMessages: (state) => {
      state.messages = [];
      state.currentConversation = null;
    },
    addMessageToConversation: (state, action) => {
      state.messages.unshift(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch conversation
      .addCase(fetchConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.loading = false;
        const { messages, page, per_page, total, has_next } = action.payload;

        if (page === 1) {
          state.messages = messages.reverse();
        } else {
          state.messages = [...messages.reverse(), ...state.messages];
        }

        state.pagination = { page, per_page, total, has_next };
      })
      .addCase(fetchConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload);
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action) => {
        state.unreadCount = action.payload;
      })
      // Mark conversation as read
      .addCase(markConversationAsRead.fulfilled, (state, action) => {
        const userId = action.payload;
        // Update unread count in conversations
        const conversation = state.conversations.find(c => c.user.id === userId);
        if (conversation) {
          state.unreadCount -= conversation.unread_count;
          conversation.unread_count = 0;
        }
        // Mark messages as read
        state.messages.forEach(msg => {
          if (msg.sender_id === userId) {
            msg.is_read = true;
          }
        });
      });
  },
});

export const {
  setCurrentConversation,
  clearMessages,
  addMessageToConversation,
  clearError,
} = messageSlice.actions;

export default messageSlice.reducer;
