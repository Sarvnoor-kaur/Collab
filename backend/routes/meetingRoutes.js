const express = require('express');
const {
  createMeeting,
  getMeeting,
  endMeeting,
  getActiveMeetings,
  getMeetingHistory
} = require('../controllers/meetingController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Create meeting for a conversation
router.post('/conversations/:conversationId/meetings', createMeeting);

// Get active meetings for a conversation
router.get('/conversations/:conversationId/meetings/active', getActiveMeetings);

// Get meeting history for a conversation
router.get('/conversations/:conversationId/meetings/history', getMeetingHistory);

// Get meeting by meetingId
router.get('/:meetingId', getMeeting);

// End meeting
router.post('/:meetingId/end', endMeeting);

module.exports = router;
