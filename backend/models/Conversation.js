const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroupChat: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    trim: true,
    maxlength: [100, 'Group name cannot exceed 100 characters']
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ updatedAt: -1 });

// Update the updatedAt timestamp before saving
ConversationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Validate group chat requirements
ConversationSchema.pre('save', function(next) {
  if (this.isGroupChat) {
    if (this.participants.length < 2) {
      next(new Error('Group chat must have at least 2 participants'));
    }
    if (!this.groupName) {
      next(new Error('Group chat must have a name'));
    }
  } else {
    if (this.participants.length !== 2) {
      next(new Error('One-to-one chat must have exactly 2 participants'));
    }
  }
  next();
});

module.exports = mongoose.model('Conversation', ConversationSchema);
