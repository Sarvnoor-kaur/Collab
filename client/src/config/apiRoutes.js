// Centralized API and client route constants
// Usage: import { API, ROUTES } from '../config/apiRoutes';

export const API = {
  BASE: process.env.REACT_APP_API_URL || "http://localhost:5001",

  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
  },

  CHAT: {
    BASE: "/api/chat", // base for chat-related endpoints
    CONVERSATION: "/api/chat/conversation", // POST create or get
    CONVERSATIONS: "/api/chat/conversations", // GET list
    MESSAGES: (conversationId = ":conversationId") =>
      `/api/chat/messages/${conversationId}`,
    READ: (conversationId = ":conversationId") =>
      `/api/chat/read/${conversationId}`,
    ADD_MEMBER: (conversationId = ":conversationId") =>
      `/api/chat/conversations/${conversationId}/add-member`,
    SEARCH_USERS: "/api/chat/users/search",
  },

  MEETINGS: {
    CREATE_FOR_CONVERSATION: (conversationId = ":conversationId") =>
      `/api/meetings/conversations/${conversationId}/meetings`,
    GET_BY_MEETING_ID: (meetingId = ":meetingId") =>
      `/api/meetings/${meetingId}`,
    END_MEETING: (meetingId = ":meetingId") => `/api/meetings/${meetingId}/end`,
    ACTIVE_FOR_CONVERSATION: (conversationId = ":conversationId") =>
      `/api/meetings/conversations/${conversationId}/meetings/active`,
    HISTORY_FOR_CONVERSATION: (conversationId = ":conversationId") =>
      `/api/meetings/conversations/${conversationId}/meetings/history`,
  },

  USERS: {
    BASE: "/api/users",
    PROFILE: (userId = ":userId") => `/api/users/${userId}`,
    SEARCH: "/api/users/search",
  },
};

// Client-side route paths (used for react-router links)
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
  CHAT: (conversationId = ":conversationId") => `/chat/${conversationId}`,
  MEETING: (meetingId = ":meetingId") => `/meet/${meetingId}`,
  USER_DISCOVERY: "/discover",
};

// Helper to build full API URL
export const fullApi = (path) => `${API.BASE}${path}`;

export default { API, ROUTES, fullApi };
