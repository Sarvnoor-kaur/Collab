const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema({
  meetingId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      leftAt: Date,
    },
  ],
  isLive: {
    type: Boolean,
    default: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  endedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Generate unique meeting ID before validation so required check passes
MeetingSchema.pre("validate", function (next) {
  if (!this.meetingId) {
    // Generate readable meeting ID: ABC-DEF-GHI (12 random chars)
    const randomHex = Math.random().toString(36).substring(2, 14).toUpperCase();
    this.meetingId = randomHex.match(/.{1,3}/g).join("-");
  }
  next();
});

// Index for faster queries
MeetingSchema.index({ conversation: 1, isLive: 1 });
MeetingSchema.index({ createdBy: 1 });

// Ensure only one active meeting (isLive: true) exists per conversation
MeetingSchema.index(
  { conversation: 1 },
  { unique: true, partialFilterExpression: { isLive: true } },
);

module.exports = mongoose.model("Meeting", MeetingSchema);
