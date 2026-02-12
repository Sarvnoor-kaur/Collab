import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create or get conversation
export const createConversation = async (participantId) => {
  const response = await axios.post(`${API_URL}/api/chat/conversation`, {
    participantId
  });
  return response.data;
};

// Create group conversation
export const createGroupConversation = async (participantIds, groupName) => {
  const response = await axios.post(`${API_URL}/api/chat/conversation`, {
    participantIds,
    groupName,
    isGroupChat: true
  });
  return response.data;
};

// Get all conversations
export const getConversations = async (page = 1, limit = 20) => {
  const response = await axios.get(`${API_URL}/api/chat/conversations`, {
    params: { page, limit }
  });
  return response.data;
};

// Get messages for a conversation
export const getMessages = async (conversationId, page = 1, limit = 50) => {
  const response = await axios.get(`${API_URL}/api/chat/messages/${conversationId}`, {
    params: { page, limit }
  });
  return response.data;
};

// Mark messages as read
export const markAsRead = async (conversationId) => {
  const response = await axios.put(`${API_URL}/api/chat/read/${conversationId}`);
  return response.data;
};

// Search users
export const searchUsers = async (query) => {
  const response = await axios.get(`${API_URL}/api/chat/users/search`, {
    params: { query }
  });
  return response.data;
};

// Add a member to an existing conversation (group admin only)
export const addMember = async (conversationId, userId) => {
  const response = await axios.post(
    `${API_URL}/api/chat/conversations/${conversationId}/add-member`,
    { userId }
  );
  return response.data;
};
