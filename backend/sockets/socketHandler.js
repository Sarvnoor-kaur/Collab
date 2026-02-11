const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

// Store online users: { userId: socketId }
const onlineUsers = new Map();

// Store typing users: { conversationId: Set of userIds }
const typingUsers = new Map();

// Authenticate socket connection
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

// Initialize socket handlers
const initializeSocket = (io) => {
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(socket.userId);

    // Add user to online users
    onlineUsers.set(socket.userId, socket.id);

    // Broadcast user online status
    socket.broadcast.emit('userOnline', {
      userId: socket.userId,
      timestamp: new Date()
    });

    // Handle joining conversation rooms
    socket.on('joinConversation', async (data) => {
      try {
        const { conversationId } = data;

        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized to join this conversation' });
        }

        socket.join(conversationId);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      } catch (error) {
        console.error('Error joining conversation:', error);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Handle leaving conversation rooms
    socket.on('leaveConversation', (data) => {
      const { conversationId } = data;
      socket.leave(conversationId);
      console.log(`User ${socket.userId} left conversation ${conversationId}`);
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, content, messageType = 'text', fileUrl, fileName } = data;

        // Validate input
        if (!conversationId || !content) {
          return socket.emit('error', { message: 'Conversation ID and content are required' });
        }

        // Verify conversation exists and user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        if (!conversation.participants.includes(socket.userId)) {
          return socket.emit('error', { message: 'Not authorized to send messages in this conversation' });
        }

        // Create message
        const message = await Message.create({
          sender: socket.userId,
          conversation: conversationId,
          content,
          messageType,
          fileUrl,
          fileName,
          readBy: [{ user: socket.userId, readAt: new Date() }]
        });

        // Populate sender info
        await message.populate('sender', 'name email');

        // Update conversation's last message
        conversation.lastMessage = message._id;
        conversation.updatedAt = new Date();
        await conversation.save();

        // Emit to all participants in the conversation room
        io.to(conversationId).emit('receiveMessage', {
          message,
          conversationId
        });

        // Also emit to each participant's personal room (for notifications)
        conversation.participants.forEach(participantId => {
          if (participantId.toString() !== socket.userId) {
            io.to(participantId.toString()).emit('newMessageNotification', {
              message,
              conversationId,
              conversation: {
                isGroupChat: conversation.isGroupChat,
                groupName: conversation.groupName
              }
            });
          }
        });

        console.log(`Message sent in conversation ${conversationId} by user ${socket.userId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing', async (data) => {
      try {
        const { conversationId } = data;

        // Verify user is participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation || !conversation.participants.includes(socket.userId)) {
          return;
        }

        // Add user to typing users for this conversation
        if (!typingUsers.has(conversationId)) {
          typingUsers.set(conversationId, new Set());
        }
        typingUsers.get(conversationId).add(socket.userId);

        // Broadcast to other participants
        socket.to(conversationId).emit('userTyping', {
          conversationId,
          userId: socket.userId,
          userName: socket.user.name
        });
      } catch (error) {
        console.error('Error handling typing:', error);
      }
    });

    // Handle stop typing
    socket.on('stopTyping', async (data) => {
      try {
        const { conversationId } = data;

        // Remove user from typing users
        if (typingUsers.has(conversationId)) {
          typingUsers.get(conversationId).delete(socket.userId);
          if (typingUsers.get(conversationId).size === 0) {
            typingUsers.delete(conversationId);
          }
        }

        // Broadcast to other participants
        socket.to(conversationId).emit('userStoppedTyping', {
          conversationId,
          userId: socket.userId
        });
      } catch (error) {
        console.error('Error handling stop typing:', error);
      }
    });

    // Handle message read receipt
    socket.on('messageRead', async (data) => {
      try {
        const { messageId, conversationId } = data;

        const message = await Message.findById(messageId);
        if (!message) {
          return socket.emit('error', { message: 'Message not found' });
        }

        // Check if already read by this user
        if (!message.isReadBy(socket.userId)) {
          message.readBy.push({
            user: socket.userId,
            readAt: new Date()
          });
          await message.save();

          // Notify sender
          io.to(message.sender.toString()).emit('messageReadReceipt', {
            messageId,
            conversationId,
            readBy: socket.userId,
            readAt: new Date()
          });
        }
      } catch (error) {
        console.error('Error handling message read:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);

      // Remove from online users
      onlineUsers.delete(socket.userId);

      // Remove from all typing indicators
      typingUsers.forEach((users, conversationId) => {
        if (users.has(socket.userId)) {
          users.delete(socket.userId);
          socket.to(conversationId).emit('userStoppedTyping', {
            conversationId,
            userId: socket.userId
          });
        }
      });

      // Broadcast user offline status
      socket.broadcast.emit('userOffline', {
        userId: socket.userId,
        timestamp: new Date()
      });
    });
  });
};

// Get online users
const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys());
};

// Check if user is online
const isUserOnline = (userId) => {
  return onlineUsers.has(userId);
};

module.exports = {
  initializeSocket,
  getOnlineUsers,
  isUserOnline
};
