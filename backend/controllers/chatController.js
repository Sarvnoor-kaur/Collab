const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// @desc    Create or get one-to-one conversation
// @route   POST /api/chat/conversation
// @access  Private
exports.createOrGetConversation = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { participantId, isGroupChat, groupName, participantIds } = req.body;
    const currentUserId = req.user.id;

    // Handle one-to-one conversation
    if (!isGroupChat) {
      if (!participantId) {
        return res.status(400).json({
          success: false,
          message: 'Participant ID is required for one-to-one chat'
        });
      }

      // Check if participant exists
      const participant = await User.findById(participantId);
      if (!participant) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        isGroupChat: false,
        participants: { $all: [currentUserId, participantId], $size: 2 }
      })
        .populate('participants', 'name email')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name email' }
        });

      if (conversation) {
        return res.status(200).json({
          success: true,
          data: conversation
        });
      }

      // Create new conversation
      conversation = await Conversation.create({
        participants: [currentUserId, participantId],
        isGroupChat: false
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email')
        .populate({
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name email' }
        });

      return res.status(201).json({
        success: true,
        data: conversation
      });
    }

    // Handle group conversation
    if (!groupName) {
      return res.status(400).json({
        success: false,
        message: 'Group name is required for group chat'
      });
    }

    if (!participantIds || participantIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'At least one other participant is required for group chat'
      });
    }

    // Verify all participants exist
    const participants = await User.find({ _id: { $in: participantIds } });
    if (participants.length !== participantIds.length) {
      return res.status(404).json({
        success: false,
        message: 'One or more participants not found'
      });
    }

    // Create group conversation
    const allParticipants = [currentUserId, ...participantIds];
    let conversation = await Conversation.create({
      participants: allParticipants,
      isGroupChat: true,
      groupName,
      groupAdmin: currentUserId
    });

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email')
      .populate('groupAdmin', 'name email')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name email' }
      });

    res.status(201).json({
      success: true,
      data: conversation
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all conversations of logged-in user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      participants: userId
    })
      .populate('participants', 'name email')
      .populate('groupAdmin', 'name email')
      .populate({
        path: 'lastMessage',
        populate: { path: 'sender', select: 'name email' }
      })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Conversation.countDocuments({ participants: userId });

    res.status(200).json({
      success: true,
      count: conversations.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: conversations
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get messages of a conversation
// @route   GET /api/chat/messages/:conversationId
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this conversation'
      });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversation: conversationId });

    res.status(200).json({
      success: true,
      count: messages.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: messages.reverse() // Reverse to show oldest first
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark messages as read
// @route   PUT /api/chat/read/:conversationId
// @access  Private
exports.markAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if conversation exists and user is a participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant of this conversation'
      });
    }

    // Find all unread messages in this conversation (not sent by current user)
    const unreadMessages = await Message.find({
      conversation: conversationId,
      sender: { $ne: userId },
      'readBy.user': { $ne: userId }
    });

    // Mark all as read
    for (let message of unreadMessages) {
      message.readBy.push({
        user: userId,
        readAt: new Date()
      });
      await message.save();
    }

    res.status(200).json({
      success: true,
      message: `${unreadMessages.length} messages marked as read`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users for chat
// @route   GET /api/chat/users/search
// @access  Private
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('name email')
      .limit(10);

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a member to a group conversation (group admin only)
// @route   POST /api/chat/conversations/:conversationId/add-member
// @access  Private
exports.addMember = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body; // user to add
    const requesterId = req.user.id;

    // Validate
    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    const conversation = await Conversation.findById(conversationId).populate('groupAdmin', 'name email');
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.isGroupChat) {
      return res.status(400).json({ success: false, message: 'Not a group conversation' });
    }

    // Only group admin can add
    if (!conversation.groupAdmin || conversation.groupAdmin._id.toString() !== requesterId) {
      return res.status(403).json({ success: false, message: 'Only group admin can add members' });
    }

    // Check user exists
    const userToAdd = await require('../models/User').findById(userId).select('name email');
    if (!userToAdd) {
      return res.status(404).json({ success: false, message: 'User to add not found' });
    }

    // Already a participant?
    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ success: false, message: 'User is already a participant' });
    }

    // Add to participants
    conversation.participants.push(userId);
    conversation.updatedAt = new Date();
    await conversation.save();

    // Create a system message announcing the new member
    const Message = require('../models/Message');
    const admin = req.user;
    const msgContent = `${userToAdd.name} was added to the group by ${admin.name}`;
    const systemMessage = await Message.create({
      sender: requesterId,
      conversation: conversationId,
      content: msgContent,
      messageType: 'text'
    });

    await systemMessage.populate('sender', 'name email');

    // Update conversation last message
    conversation.lastMessage = systemMessage._id;
    await conversation.save();

    // Emit socket events to conversation room
    const io = req.app.get('io');
    io.to(conversationId).emit('participantAdded', { conversationId, user: userToAdd });
    io.to(conversationId).emit('receiveMessage', { conversationId, message: systemMessage });

    res.status(200).json({ success: true, message: 'User added to group', data: conversation });
  } catch (error) {
    next(error);
  }
};
