import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Create meeting for a conversation
export const createMeeting = async (conversationId) => {
  const response = await axios.post(
    `${API_URL}/api/meetings/conversations/${conversationId}/meetings`,
  );
  // Normalize return value for easier consumption by callers
  return {
    success: response.data.success,
    meeting: response.data.data,
    meetingId: response.data.data?.meetingId,
    meetingLink: response.data.meetingLink,
  };
};

// Get meeting by meetingId
export const getMeeting = async (meetingId) => {
  const response = await axios.get(`${API_URL}/api/meetings/${meetingId}`);
  return response.data;
};

// End meeting
export const endMeeting = async (meetingId) => {
  const response = await axios.post(`${API_URL}/api/meetings/${meetingId}/end`);
  return response.data;
};

// Get active meetings for a conversation
export const getActiveMeetings = async (conversationId) => {
  const response = await axios.get(
    `${API_URL}/api/meetings/conversations/${conversationId}/meetings/active`,
  );
  return response.data;
};

// Get meeting history
export const getMeetingHistory = async (
  conversationId,
  page = 1,
  limit = 20,
) => {
  const response = await axios.get(
    `${API_URL}/api/meetings/conversations/${conversationId}/meetings/history`,
    { params: { page, limit } },
  );
  return response.data;
};
