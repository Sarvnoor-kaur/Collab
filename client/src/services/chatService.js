import axios from 'axios';
import { fullApi, API } from '../config/apiRoutes';

// Create or get conversation
export const createConversation = async (participantId) => {
  const response = await axios.post(fullApi(API.CHAT.CONVERSATION), {
    participantId
  });
  return response.data;
};

// Create group conversation
export const createGroupConversation = async (participantIds, groupName) => {
  const response = await axios.post(fullApi(API.CHAT.CONVERSATION), {
    participantIds,
    groupName,
    isGroupChat: true
  });
  return response.data;
};

// Get all conversations
export const getConversations = async (page = 1, limit = 20) => {
  const response = await axios.get(fullApi(API.CHAT.CONVERSATIONS), {
    params: { page, limit }
  });
  return response.data;
};

// Get messages for a conversation
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const response = await axios.get(fullApi(API.CHAT.MESSAGES(conversationId)), {
    params: { page, limit }
  });
  return response.data;
};

// Mark messages as read
export const markAsRead = async (conversationId) => {
  const response = await axios.put(fullApi(API.CHAT.READ(conversationId)));
  return response.data;
};

// Search users
export const searchUsers = async (query) => {
  const response = await axios.get(fullApi(API.CHAT.SEARCH_USERS), {
    params: { query }
  });
  return response.data;
};

// Add a member to an existing conversation (group admin only)
export const addMember = async (conversationId, userId) => {
  const response = await axios.post(
    fullApi(API.CHAT.ADD_MEMBER(conversationId)),
    { userId }
  );
  return response.data;
};
