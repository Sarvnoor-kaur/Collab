const express = require('express');
const {
  getAllUsers,
  searchUsers,
  getUserById,
  getOnlineUsers
} = require('../controllers/userController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// Get all registered users (excluding current user)
router.get('/', getAllUsers);

// Search users by name or email
router.get('/search', searchUsers);

// Get online users list
router.get('/online', getOnlineUsers);

// Get user by ID
router.get('/:userId', getUserById);

module.exports = router;
