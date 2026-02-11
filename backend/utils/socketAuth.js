const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to authenticate socket connections
 * Extracts JWT token from handshake and verifies it
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    // Get token from auth object or headers
    const token = socket.handshake.auth.token || 
                  socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }

    // Attach user to socket
    socket.userId = user._id.toString();
    socket.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    console.error('Socket authentication error:', error.message);
    next(new Error('Authentication error: Invalid token'));
  }
};

module.exports = socketAuthMiddleware;
