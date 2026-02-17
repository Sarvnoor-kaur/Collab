import axios from 'axios';
import { fullApi, API } from '../config/apiRoutes';

// Get all registered users
export const getAllUsers = async (page = 1, limit = 50) => {
  const response = await axios.get(fullApi(API.USERS.BASE), {
    params: { page, limit }
  });
  return response.data;
};

// Search users by name or email
export const searchUsers = async (query) => {
  const response = await axios.get(fullApi(API.USERS.SEARCH), {
    params: { query }
  });
  return response.data;
};

// Get online users
export const getOnlineUsers = async () => {
  const response = await axios.get(fullApi(`${API.USERS.BASE}/online`));
  return response.data;
};

// Get user by ID
export const getUserById = async (userId) => {
  const response = await axios.get(fullApi(API.USERS.PROFILE(userId)));
  return response.data;
};
