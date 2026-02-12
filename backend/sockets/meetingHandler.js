const Meeting = require("../models/Meeting");
const Conversation = require("../models/Conversation");

// Store active meeting participants: { meetingId: Set of socketIds }
const meetingParticipants = new Map();

// Initialize meeting socket handlers
const initializeMeetingSocket = (io) => {
  io.on("connection", (socket) => {
    const parseMlines = (sdp) => {
      try {
        const sdpText = sdp && sdp.sdp ? sdp.sdp : sdp || "";
        return sdpText
          .split(/\r?\n/)
          .filter((l) => l.startsWith("m="))
          .map((l) => l.trim());
      } catch (e) {
        return [];
      }
    };
    // Join meeting room
    socket.on("joinMeeting", async (data) => {
      try {
        const { meetingId } = data;
        const userId = socket.userId;

        // Verify meeting exists and is live
        const meeting = await Meeting.findOne({ meetingId }).populate(
          "conversation",
        );

        if (!meeting) {
          return socket.emit("meetingError", { message: "Meeting not found" });
        }

        if (!meeting.isLive) {
          return socket.emit("meetingError", { message: "Meeting has ended" });
        }

        // Verify user is a participant of the conversation
        if (!meeting.conversation.participants.includes(userId)) {
          return socket.emit("meetingError", {
            message: "You are not authorized to join this meeting",
          });
        }

        // Join meeting room
        socket.join(`meeting:${meetingId}`);

        // Track participant
        if (!meetingParticipants.has(meetingId)) {
          meetingParticipants.set(meetingId, new Set());
        }
        meetingParticipants.get(meetingId).add(socket.id);

        // Add participant to meeting
        const existingParticipant = meeting.participants.find(
          (p) => p.user.toString() === userId,
        );

        if (!existingParticipant) {
          meeting.participants.push({
            user: userId,
            joinedAt: new Date(),
          });
          await meeting.save();
        }

        // Get all participants in the meeting room
        const participantsInRoom = Array.from(
          meetingParticipants.get(meetingId) || [],
        );

        // Build participant metadata (socketId, userId, userName)
        const participantMeta = participantsInRoom
          .map((sockId) => {
            const s = io.sockets.sockets.get(sockId);
            if (!s) return null;
            return {
              socketId: sockId,
              userId: s.userId,
              userName: s.user?.name || null,
            };
          })
          .filter((p) => p !== null && p.socketId !== socket.id);

        // Notify others that a new user joined
        socket.to(`meeting:${meetingId}`).emit("userJoinedMeeting", {
          userId,
          userName: socket.user.name,
          socketId: socket.id,
        });

        // Send current participants (with metadata) to the new joiner
        socket.emit("meetingJoined", {
          meetingId,
          participants: participantMeta,
        });

        console.log(`User ${userId} joined meeting ${meetingId}`);
      } catch (error) {
        console.error("Error joining meeting:", error);
        socket.emit("meetingError", { message: "Failed to join meeting" });
      }
    });

    // WebRTC Signaling: Offer
    socket.on("offer", (data) => {
      const { meetingId, targetSocketId, offer } = data;

      // Log SDP m-lines for debugging ordering mismatch
      const mlines = parseMlines(offer);
      console.log(
        `Forwarding offer from ${socket.id} to ${targetSocketId}, m-lines:`,
        mlines,
      );

      // Forward offer to target peer
      io.to(targetSocketId).emit("offer", {
        offer,
        senderSocketId: socket.id,
        senderUserId: socket.userId,
        senderUserName: socket.user.name,
      });

      console.log(`Offer sent from ${socket.id} to ${targetSocketId}`);
    });

    // WebRTC Signaling: Answer
    socket.on("answer", (data) => {
      const { meetingId, targetSocketId, answer } = data;

      const mlines = parseMlines(answer);
      console.log(
        `Forwarding answer from ${socket.id} to ${targetSocketId}, m-lines:`,
        mlines,
      );

      // Forward answer to target peer
      io.to(targetSocketId).emit("answer", {
        answer,
        senderSocketId: socket.id,
      });

      console.log(`Answer sent from ${socket.id} to ${targetSocketId}`);
    });

    // WebRTC Signaling: ICE Candidate
    socket.on("iceCandidate", (data) => {
      const { meetingId, targetSocketId, candidate } = data;

      console.log(
        `Forwarding ICE candidate from ${socket.id} to ${targetSocketId}:`,
        candidate,
      );

      // Forward ICE candidate to target peer
      io.to(targetSocketId).emit("iceCandidate", {
        candidate,
        senderSocketId: socket.id,
      });
    });

    // Leave meeting
    socket.on("leaveMeeting", async (data) => {
      try {
        const { meetingId } = data;
        const userId = socket.userId;

        // Leave meeting room
        socket.leave(`meeting:${meetingId}`);

        // Remove from participants tracking
        if (meetingParticipants.has(meetingId)) {
          meetingParticipants.get(meetingId).delete(socket.id);

          if (meetingParticipants.get(meetingId).size === 0) {
            meetingParticipants.delete(meetingId);
          }
        }

        // Update meeting participant left time
        const meeting = await Meeting.findOne({ meetingId });
        if (meeting) {
          const participant = meeting.participants.find(
            (p) => p.user.toString() === userId && !p.leftAt,
          );
          if (participant) {
            participant.leftAt = new Date();
            await meeting.save();
          }
        }

        // Notify others
        socket.to(`meeting:${meetingId}`).emit("userLeftMeeting", {
          userId,
          socketId: socket.id,
        });

        console.log(`User ${userId} left meeting ${meetingId}`);
      } catch (error) {
        console.error("Error leaving meeting:", error);
      }
    });

    // Media state changes (mute/unmute, camera on/off)
    socket.on("mediaStateChange", (data) => {
      const { meetingId, audioEnabled, videoEnabled } = data;

      // Broadcast media state to all participants
      socket.to(`meeting:${meetingId}`).emit("participantMediaStateChanged", {
        userId: socket.userId,
        socketId: socket.id,
        audioEnabled,
        videoEnabled,
      });
    });

    // Screen sharing state change
    socket.on("screenShareStateChange", (data) => {
      const { meetingId, isSharing } = data;

      // Broadcast screen share state
      socket.to(`meeting:${meetingId}`).emit("participantScreenShareChanged", {
        userId: socket.userId,
        socketId: socket.id,
        isSharing,
      });
    });

    // Handle disconnect
    socket.on("disconnect", async () => {
      // Clean up all meetings this socket was part of
      for (const [meetingId, participants] of meetingParticipants.entries()) {
        if (participants.has(socket.id)) {
          participants.delete(socket.id);

          // Notify others
          socket.to(`meeting:${meetingId}`).emit("userLeftMeeting", {
            userId: socket.userId,
            socketId: socket.id,
          });

          // Update database
          try {
            const meeting = await Meeting.findOne({ meetingId });
            if (meeting) {
              const participant = meeting.participants.find(
                (p) => p.user.toString() === socket.userId && !p.leftAt,
              );
              if (participant) {
                participant.leftAt = new Date();
                await meeting.save();
              }
            }
          } catch (error) {
            console.error("Error updating participant on disconnect:", error);
          }

          if (participants.size === 0) {
            meetingParticipants.delete(meetingId);
          }
        }
      }
    });
  });
};

// Get active participants in a meeting
const getMeetingParticipants = (meetingId) => {
  return Array.from(meetingParticipants.get(meetingId) || []);
};

module.exports = {
  initializeMeetingSocket,
  getMeetingParticipants,
};
