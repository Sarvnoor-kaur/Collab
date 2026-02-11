import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Get all registered users
export const getAllUsers = async (page = 1, limit = 50) => {
  const response = await axios.get(`${API_URL}/api/users`, {
    params: { page, limit }
  });
  return response.data;
};

// Search users by name or email
export const searchUsers = async (query) => {
  const response = await axios.get(`${API_URL}/api/users/search`, {
    params: { query }
  });
  return response.data;
};

// Get online users
export const getOnlineUsers = async () => {
  const response = await axios.get(`${API_URL}/api/users/online`);
  return response.data;
};

// Get user by ID
export const getUserById = async (userId) => {
  const response = await axios.get(`${API_URL}/api/users/${userId}`);
  return response.data;
};
