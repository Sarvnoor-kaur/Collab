const Meeting = require("../models/Meeting");
const Conversation = require("../models/Conversation");
const { validationResult } = require("express-validator");

// @desc    Create a new meeting (Admin/Creator only)
// @route   POST /api/conversations/:conversationId/meetings
// @access  Private
exports.createMeeting = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if conversation exists
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // Authorization: Only group admin or conversation participant can create meeting
    if (conversation.isGroupChat) {
      // For group chat, only admin can create meeting
      if (conversation.groupAdmin.toString() !== userId) {
        return res.status(403).json({
          success: false,
          message: "Only group admin can create meetings",
        });
      }
    } else {
      // For one-to-one, both participants can create meeting
      if (!conversation.participants.includes(userId)) {
        return res.status(403).json({
          success: false,
          message: "You are not a participant of this conversation",
        });
      }
    }

    // Check if there's already an active meeting
    const activeMeeting = await Meeting.findOne({
      conversation: conversationId,
      isLive: true,
    });

    if (activeMeeting) {
      return res.status(400).json({
        success: false,
        message: "There is already an active meeting for this conversation",
        data: activeMeeting,
      });
    }

    // Create meeting
    const meeting = await Meeting.create({
      conversation: conversationId,
      createdBy: userId,
    });

    // Populate meeting data
    await meeting.populate("createdBy", "name email");
    await meeting.populate("conversation");

    // Create a chat message announcing the meeting and emit to the conversation room
    const Message = require("../models/Message");
    const io = req.app.get("io");

    const meetingLink = `${process.env.CLIENT_URL}/meet/${meeting.meetingId}`;

    // Create message in DB so it appears in the conversation history
    const meetingMessage = await Message.create({
      sender: userId,
      conversation: conversationId,
      content: `Meeting started: ${meetingLink}`,
      messageType: "text",
    });

    // Populate message sender for emission
    await meetingMessage.populate("sender", "name email");

    // Update conversation's last message and timestamp
    conversation.lastMessage = meetingMessage._id;
    conversation.updatedAt = new Date();
    await conversation.save();

    // Emit socket event to notify all conversation participants (conversation room)
    io.to(conversationId).emit("receiveMessage", {
      conversationId,
      message: meetingMessage,
    });

    // Also emit a specific meetingCreated event if listeners need it
    io.to(conversationId).emit("meetingCreated", {
      meeting,
      conversationId,
    });

    res.status(201).json({
      success: true,
      data: meeting,
      meetingLink,
    });
  } catch (error) {
    // If duplicate key error (race condition created two meetings), return the existing active meeting
    if (error && error.code === 11000) {
      try {
        const existing = await Meeting.findOne({
          conversation: conversationId,
          isLive: true,
        });
        if (existing) {
          const meetingLink = `${process.env.CLIENT_URL}/meet/${existing.meetingId}`;
          return res.status(200).json({
            success: true,
            message: "Active meeting already exists",
            data: existing,
            meetingLink,
          });
        }
      } catch (innerErr) {
        // fallthrough to next
      }
    }
    next(error);
  }
};

// @desc    Get meeting by meetingId
// @route   GET /api/meetings/:meetingId
// @access  Private
exports.getMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId })
      .populate("createdBy", "name email")
      .populate("conversation")
      .populate("participants.user", "name email");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Check if user is a participant of the conversation
    if (!meeting.conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to join this meeting",
      });
    }

    // Check if meeting is live
    if (!meeting.isLive) {
      return res.status(400).json({
        success: false,
        message: "This meeting has ended",
      });
    }

    res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End meeting (Admin/Creator only)
// @route   POST /api/meetings/:meetingId/end
// @access  Private
exports.endMeeting = async (req, res, next) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId }).populate(
      "conversation",
    );

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "Meeting not found",
      });
    }

    // Authorization: Only creator or group admin can end meeting
    const isCreator = meeting.createdBy.toString() === userId;
    const isGroupAdmin =
      meeting.conversation.isGroupChat &&
      meeting.conversation.groupAdmin.toString() === userId;

    if (!isCreator && !isGroupAdmin) {
      return res.status(403).json({
        success: false,
        message: "Only meeting creator or group admin can end the meeting",
      });
    }

    // End meeting
    meeting.isLive = false;
    meeting.endedAt = new Date();
    await meeting.save();

    // Emit socket event to notify all participants
    const io = req.app.get("io");
    io.to(`meeting:${meetingId}`).emit("meetingEnded", {
      meetingId,
      endedBy: userId,
    });

    res.status(200).json({
      success: true,
      message: "Meeting ended successfully",
      data: meeting,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active meetings for a conversation
// @route   GET /api/conversations/:conversationId/meetings/active
// @access  Private
exports.getActiveMeetings = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this conversation",
      });
    }

    const meetings = await Meeting.find({
      conversation: conversationId,
      isLive: true,
    })
      .populate("createdBy", "name email")
      .sort({ startedAt: -1 });

    res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get meeting history for a conversation
// @route   GET /api/conversations/:conversationId/meetings/history
// @access  Private
exports.getMeetingHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Check if user is participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    if (!conversation.participants.includes(userId)) {
      return res.status(403).json({
        success: false,
        message: "You are not a participant of this conversation",
      });
    }

    const meetings = await Meeting.find({
      conversation: conversationId,
    })
      .populate("createdBy", "name email")
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Meeting.countDocuments({
      conversation: conversationId,
    });

    res.status(200).json({
      success: true,
      count: meetings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: meetings,
    });
  } catch (error) {
    next(error);
  }
};
