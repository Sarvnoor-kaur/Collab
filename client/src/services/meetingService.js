import axios from "axios";
import { fullApi, API } from "../config/apiRoutes";

// Create meeting for a conversation
export const createMeeting = async (conversationId) => {
  const response = await axios.post(
    fullApi(API.MEETINGS.CREATE_FOR_CONVERSATION(conversationId)),
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
  const response = await axios.get(
    fullApi(API.MEETINGS.GET_BY_MEETING_ID(meetingId)),
  );
  return response.data;
};

// End meeting
export const endMeeting = async (meetingId) => {
  const response = await axios.post(
    fullApi(API.MEETINGS.END_MEETING(meetingId)),
  );
  return response.data;
};

// Get active meetings for a conversation
export const getActiveMeetings = async (conversationId) => {
  const response = await axios.get(
    fullApi(API.MEETINGS.ACTIVE_FOR_CONVERSATION(conversationId)),
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
    fullApi(API.MEETINGS.HISTORY_FOR_CONVERSATION(conversationId)),
    { params: { page, limit } },
  );
  return response.data;
};
