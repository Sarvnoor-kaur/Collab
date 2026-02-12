const express = require('express');
const { body } = require('express-validator');
const {
  createOrGetConversation,
  getConversations,
  getMessages,
  markAsRead,
  searchUsers
  , addMember
} = require('../controllers/chatController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// Validation rules
const conversationValidation = [
  body('participantId')
    .optional()
    .isMongoId()
    .withMessage('Invalid participant ID'),
  body('isGroupChat')
    .optional()
    .isBoolean()
    .withMessage('isGroupChat must be a boolean'),
  body('groupName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Group name must be between 1 and 100 characters'),
  body('participantIds')
    .optional()
    .isArray()
    .withMessage('participantIds must be an array')
];

// All routes are protected
router.use(protect);

// Conversation routes
router.post('/conversation', conversationValidation, createOrGetConversation);
router.get('/conversations', getConversations);

// Message routes
router.get('/messages/:conversationId', getMessages);
router.put('/read/:conversationId', markAsRead);

// Group admin can add a member
router.post('/conversations/:conversationId/add-member', [
  body('userId').isMongoId().withMessage('Invalid userId')
], addMember);

// User search
router.get('/users/search', searchUsers);

module.exports = router;
