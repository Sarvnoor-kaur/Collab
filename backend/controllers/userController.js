const User = require('../models/User');
const { getOnlineUsers: getSocketOnlineUsers } = require('../sockets/socketHandler');

// @desc    Get all registered users (excluding current user)
// @route   GET /api/users
// @access  Private
exports.getAllUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Find all users except current user
    const users = await User.find({ _id: { $ne: currentUserId } })
      .select('name email createdAt')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments({ _id: { $ne: currentUserId } });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search users by name or email
// @route   GET /api/users/search?query=
// @access  Private
exports.searchUsers = async (req, res, next) => {
  try {
    const { query } = req.query;
    const currentUserId = req.user.id;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Search by name or email (case-insensitive)
    // Exclude current user from results
    const users = await User.find({
      _id: { $ne: currentUserId },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    })
      .select('name email createdAt')
      .limit(20)
      .sort({ name: 1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get online users (from socket connection)
// @route   GET /api/users/online
// @access  Private
exports.getOnlineUsers = async (req, res, next) => {
  try {
    // Get online user IDs from socket handler
    const onlineUserIds = getSocketOnlineUsers();

    // Fetch user details for online users
    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds }
    }).select('name email');

    res.status(200).json({
      success: true,
      count: onlineUsers.length,
      data: onlineUsers
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/users/:userId
// @access  Private
exports.getUserById = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('name email createdAt');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};
