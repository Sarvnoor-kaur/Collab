import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import { getMeeting, endMeeting } from "../services/meetingService";
import "../styles/MeetingRoom.css";

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);

  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const queuedCandidates = useRef(new Map());
  const pendingOffers = useRef(new Set());
  const screenStream = useRef(null);

  // ICE servers configuration (STUN servers)
  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Load meeting data
  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  // When localStream becomes available, ensure existing peer connections have our tracks
  useEffect(() => {
    if (!localStream) return;
    peerConnections.current.forEach(async (pc, socketId) => {
      try {
        // Replace existing senders' tracks (camera/mic) if present
        const videoTrack = localStream.getVideoTracks()[0];
        const audioTrack = localStream.getAudioTracks()[0];

        const senders = pc.getSenders();

        const videoSender = senders.find((s) => s.track?.kind === "video");
        const audioSender = senders.find((s) => s.track?.kind === "audio");

        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
        } else if (videoTrack) {
          // Add track but do not force renegotiation here to avoid offer collisions
          pc.addTrack(videoTrack, localStream);
        }

        if (audioSender && audioTrack) {
          await audioSender.replaceTrack(audioTrack);
        } else if (audioTrack) {
          // Add track but do not force renegotiation here
          pc.addTrack(audioTrack, localStream);
        }
      } catch (err) {
        console.error("Error adding local tracks to peer:", err);
      }
    });

    // After attaching tracks, send pending offers for peers that were created before media
    pendingOffers.current.forEach(async (socketId) => {
      try {
        const pc = peerConnections.current.get(socketId);
        if (!pc) return;
        // Only create offer if signalingState is stable
        if (pc.signalingState === "stable") {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log(
            `Sending pending offer to ${socketId} after localStream ready`,
          );
          socket.emit("offer", { meetingId, targetSocketId: socketId, offer });
          pendingOffers.current.delete(socketId);
        }
      } catch (e) {
        console.warn(`Failed to send pending offer to ${socketId}:`, e);
      }
    });
  }, [localStream]);

  // Initialize media and socket
  useEffect(() => {
    if (meeting && socket) {
      // Register listeners first, then initialize media (so we don't miss server emits)
      setupSocketListeners();
      initializeMedia();
    }

    return () => {
      // remove socket listeners and cleanup resources
      removeSocketListeners();
      cleanup();
    };
  }, [meeting, socket]);

  const loadMeeting = async () => {
    try {
      setLoading(true);
      const response = await getMeeting(meetingId);
      setMeeting(response.data);
    } catch (err) {
      console.error("Failed to load meeting:", err);
      setError(err.response?.data?.message || "Failed to load meeting");
    } finally {
      setLoading(false);
    }
  };

  const logSdpInfo = (sdp, label) => {
    try {
      if (!sdp || !sdp.sdp) return;
      const sdpText = sdp.sdp || sdp;
      const mlines = sdpText
        .split(/\r?\n/)
        .filter((l) => l.startsWith("m="))
        .map((l) => l.trim());
      console.log(`[SDP ${label}] m-lines:`, mlines);
    } catch (e) {
      console.warn("Failed to parse SDP for logging", e);
    }
  };

  const initializeMedia = async () => {
    if (localStream) return; // Guard to prevent multiple getUserMedia calls
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join meeting via socket (listeners already registered)
      socket.emit("joinMeeting", { meetingId });
    } catch (err) {
      console.error("Failed to get media:", err);
      setError("Failed to access camera/microphone");
    }
  };

  const setupSocketListeners = () => {
    // Ensure we don't attach duplicate listeners
    const removeSocketListeners = () => {
      if (!socket) return;
      socket.off("meetingJoined");
      socket.off("userJoinedMeeting");
      socket.off("userLeftMeeting");
      socket.off("offer");
      socket.off("answer");
      socket.off("iceCandidate");
      socket.off("meetingEnded");
      socket.off("meetingError");
      socket.off("participantMediaStateChanged");
    };

    // Remove any existing listeners before adding new ones
    removeSocketListeners();
    // Meeting joined successfully
    socket.on("meetingJoined", ({ participants }) => {
      console.log("Joined meeting, existing participants:", participants);
      // Create peer connections for existing participants (participants may be strings or metadata objects)
      participants.forEach((p) => {
        if (!p) return;
        const socketId = typeof p === "string" ? p : p.socketId;
        const userName = typeof p === "string" ? undefined : p.userName;
        if (socketId) createPeerConnection(socketId, true, userName);
      });
    });

    // New user joined
    socket.on("userJoinedMeeting", ({ socketId, userName }) => {
      console.log("User joined:", userName);
      createPeerConnection(socketId, false, userName);
    });

    // User left
    socket.on("userLeftMeeting", ({ socketId }) => {
      console.log("User left:", socketId);
      removePeer(socketId);
    });

    // WebRTC signaling
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("iceCandidate", handleIceCandidate);

    // Media state changes
    socket.on(
      "participantMediaStateChanged",
      ({ socketId, audioEnabled, videoEnabled }) => {
        setPeers((prev) => {
          const newPeers = new Map(prev);
          const peer = newPeers.get(socketId);
          if (peer) {
            newPeers.set(socketId, { ...peer, audioEnabled, videoEnabled });
          }
          return newPeers;
        });
      },
    );

    // Meeting ended
    socket.on("meetingEnded", () => {
      alert("Meeting has been ended by the host");
      leaveMeeting();
    });

    socket.on("meetingError", ({ message }) => {
      setError(message);
    });
  };

  const removeSocketListeners = () => {
    if (!socket) return;
    socket.off("meetingJoined");
    socket.off("userJoinedMeeting");
    socket.off("userLeftMeeting");
    socket.off("offer");
    socket.off("answer");
    socket.off("iceCandidate");
    socket.off("meetingEnded");
    socket.off("meetingError");
    socket.off("participantMediaStateChanged");
  };

  const createPeerConnection = async (socketId, isInitiator, userName) => {
    try {
      // Avoid creating duplicate peer connections
      if (peerConnections.current.has(socketId)) {
        return peerConnections.current.get(socketId);
      }

      const peerConnection = new RTCPeerConnection(iceServers);

      // Add local stream tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Handle incoming stream
      peerConnection.ontrack = (event) => {
        console.log("Received remote track from:", socketId);
        setPeers((prev) => {
          const newPeers = new Map(prev);
          newPeers.set(socketId, {
            stream: event.streams[0],
            audioEnabled: true,
            videoEnabled: true,
            userName: userName || "Participant",
          });
          return newPeers;
        });
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log(
            `Emitting ICE candidate to ${socketId}:`,
            event.candidate,
          );
          socket.emit("iceCandidate", {
            meetingId,
            targetSocketId: socketId,
            candidate: event.candidate,
          });
        }
      };

      peerConnections.current.set(socketId, peerConnection);

      // Ensure peers map has an entry for UI even before tracks arrive
      setPeers((prev) => {
        const newPeers = new Map(prev);
        if (!newPeers.has(socketId)) {
          newPeers.set(socketId, {
            stream: null,
            audioEnabled: true,
            videoEnabled: true,
            userName: userName || "Participant",
          });
        }
        return newPeers;
      });

      // If initiator, create and send offer (only when localStream exists)
      if (isInitiator) {
        if (localStream) {
          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);

          // Log SDP m-lines to help debug m-line ordering issues
          logSdpInfo(offer, `offer->${socketId}`);
          console.log(
            `Sending offer to ${socketId}, signalingState=${peerConnection.signalingState}`,
          );

          socket.emit("offer", {
            meetingId,
            targetSocketId: socketId,
            offer,
          });
        } else {
          // Defer offer until localStream is ready
          console.log(`Deferring offer to ${socketId} until localStream is ready`);
          pendingOffers.current.add(socketId);
        }
      }

      return peerConnection;
    } catch (err) {
      console.error("Error creating peer connection:", err);
    }
  };

  const handleOffer = async ({ offer, senderSocketId, senderUserName }) => {
    try {
      console.log(`Received offer from ${senderSocketId}`);
      logSdpInfo(offer, `recv-offer<-${senderSocketId}`);
      const peerConnection =
        peerConnections.current.get(senderSocketId) ||
        (await createPeerConnection(senderSocketId, false, senderUserName));

      // Set remote description for incoming offer
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer),
      );

      // Now create and set answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // Log SDP info for answer
      logSdpInfo(answer, `answer->${senderSocketId}`);
      console.log(
        `Sending answer to ${senderSocketId}, signalingState=${peerConnection.signalingState}`,
      );

      socket.emit("answer", {
        meetingId,
        targetSocketId: senderSocketId,
        answer,
      });
    } catch (err) {
      console.error("Error handling offer:", err);
    }
  };

  const handleAnswer = async ({ answer, senderSocketId }) => {
    try {
      console.log(`Received answer from ${senderSocketId}`);
      console.log("Answer payload:", answer);
      logSdpInfo(answer, `recv-answer<-${senderSocketId}`);

      const peerConnection = peerConnections.current.get(senderSocketId);
      if (!peerConnection) {
        console.warn(
          `No RTCPeerConnection found for ${senderSocketId}, ignoring answer`,
        );
        return;
      }

      // Defensive check: only set remote answer when we are in have-local-offer
      // Setting an answer in `stable` state causes InvalidStateError.
      console.log(
        `Peer ${senderSocketId} signalingState before setRemoteDescription:`,
        peerConnection.signalingState,
      );

      if (!answer || !answer.sdp) {
        console.warn(
          `Received empty or malformed answer from ${senderSocketId}, skipping setRemoteDescription`,
        );
        return;
      }

      if (peerConnection.signalingState !== "have-local-offer") {
        // We received an answer but we don't have a pending local offer.
        // This commonly happens due to duplicate listeners or out-of-order messages.
        // Skip applying the answer to avoid InvalidStateError.
        console.warn(
          `Ignoring answer for ${senderSocketId} because signalingState is ${peerConnection.signalingState}`,
        );
        return;
      }

      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answer),
      );

      // If there are queued ICE candidates for this socket, add them now
      const pending = queuedCandidates.current.get(senderSocketId) || [];
      for (const c of pending) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(c));
        } catch (iceErr) {
          console.warn(
            `Failed to add queued ICE for ${senderSocketId}:`,
            iceErr,
          );
        }
      }
      queuedCandidates.current.delete(senderSocketId);
    } catch (err) {
      console.error("Error handling answer:", err);
    }
  };

  const handleIceCandidate = async ({ candidate, senderSocketId }) => {
    try {
      console.log(`Received ICE candidate from ${senderSocketId}:`, candidate);
      const peerConnection = peerConnections.current.get(senderSocketId);
      if (peerConnection) {
        // Only add candidate if remote description is set, otherwise queue it
        const remoteDesc = peerConnection.remoteDescription;
        if (remoteDesc && remoteDesc.type) {
          try {
            await peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate),
            );
          } catch (addErr) {
            console.warn(
              `addIceCandidate failed for ${senderSocketId}:`,
              addErr,
            );
            // Queue as fallback
            const arr = queuedCandidates.current.get(senderSocketId) || [];
            arr.push(candidate);
            queuedCandidates.current.set(senderSocketId, arr);
          }
        } else {
          // Queue candidate until remote description is available
          const arr = queuedCandidates.current.get(senderSocketId) || [];
          arr.push(candidate);
          queuedCandidates.current.set(senderSocketId, arr);
          console.log(
            `Queued ICE candidate for ${senderSocketId} (remoteDescription missing)`,
          );
        }
      } else {
        // No peer connection yet — queue candidate and it will be applied when peer is created/remote set
        const arr = queuedCandidates.current.get(senderSocketId) || [];
        arr.push(candidate);
        queuedCandidates.current.set(senderSocketId, arr);
        console.log(
          `Queued ICE candidate for ${senderSocketId} (no PeerConnection yet)`,
        );
      }
    } catch (err) {
      console.error("Error handling ICE candidate:", err);
    }
  };

  const removePeer = (socketId) => {
    const peerConnection = peerConnections.current.get(socketId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.current.delete(socketId);
    }

    setPeers((prev) => {
      const newPeers = new Map(prev);
      newPeers.delete(socketId);
      return newPeers;
    });
  };

  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);

        socket.emit("mediaStateChange", {
          meetingId,
          audioEnabled: audioTrack.enabled,
          videoEnabled,
        });
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);

        socket.emit("mediaStateChange", {
          meetingId,
          audioEnabled,
          videoEnabled: videoTrack.enabled,
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
        });

        screenStream.current = stream;
        const videoTrack = stream.getVideoTracks()[0];

        // Replace video track in all peer connections
        peerConnections.current.forEach((peerConnection) => {
          const sender = peerConnection
            .getSenders()
            .find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(videoTrack);
          }
        });

        // Update local video
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Handle screen share stop
        videoTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
        socket.emit("screenShareStateChange", { meetingId, isSharing: true });
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Error toggling screen share:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
      screenStream.current = null;
    }

    // Restore camera video
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      peerConnections.current.forEach((peerConnection) => {
        const sender = peerConnection
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }

    setIsScreenSharing(false);
    socket.emit("screenShareStateChange", { meetingId, isSharing: false });
  };

  const leaveMeeting = () => {
    cleanup();
    navigate("/chat");
  };

  const handleEndMeeting = async () => {
    if (
      window.confirm("Are you sure you want to end this meeting for everyone?")
    ) {
      try {
        await endMeeting(meetingId);
        navigate("/chat");
      } catch (err) {
        console.error("Failed to end meeting:", err);
        alert("Failed to end meeting");
      }
    }
  };

  const cleanup = () => {
    // Leave meeting via socket
    if (socket) {
      socket.emit("leaveMeeting", { meetingId });
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    // Stop screen share
    if (screenStream.current) {
      screenStream.current.getTracks().forEach((track) => track.stop());
    }

    // Close all peer connections
    peerConnections.current.forEach((pc) => pc.close());
    peerConnections.current.clear();
  };

  const isAdmin =
    meeting?.createdBy?._id === user?.id || meeting?.createdBy === user?.id;

  if (loading) {
    return (
      <div className="meeting-loading">
        <div className="loading-spinner"></div>
        <p>Loading meeting...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="meeting-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/chat")} className="btn-primary">
          Back to Chat
        </button>
      </div>
    );
  }

  return (
    <div className="meeting-room">
      {/* Meeting Header */}
      <div className="meeting-header">
        <div className="meeting-info">
          <h2>Meeting: {meetingId}</h2>
          <span className="participant-count">
            {peers.size + 1} participant{peers.size !== 0 ? "s" : ""}
          </span>
          <button
            className="btn-show-participants"
            onClick={() => setShowParticipants(true)}
          >
            Participants
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className="video-grid">
        {/* Local Video */}
        <div className="video-container">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="video-element"
          />
          <div className="video-overlay">
            <span className="participant-name">{user?.name} (You)</span>
            {!audioEnabled && <span className="muted-icon">🔇</span>}
            {!videoEnabled && <span className="camera-off-icon">📷</span>}
          </div>
        </div>

        {/* Remote Videos */}
        {Array.from(peers.entries()).map(([socketId, peer]) => (
          <RemoteVideo
            key={socketId}
            socketId={socketId}
            stream={peer.stream}
            audioEnabled={peer.audioEnabled}
            videoEnabled={peer.videoEnabled}
            userName={peer.userName}
          />
        ))}
      </div>

      {/* Meeting Controls */}
      <div className="meeting-controls">
        <button
          onClick={toggleAudio}
          className={`control-btn ${!audioEnabled ? "disabled" : ""}`}
          title={audioEnabled ? "Mute" : "Unmute"}
        >
          {audioEnabled ? "🎤" : "🔇"}
        </button>

        <button
          onClick={toggleVideo}
          className={`control-btn ${!videoEnabled ? "disabled" : ""}`}
          title={videoEnabled ? "Turn off camera" : "Turn on camera"}
        >
          {videoEnabled ? "📹" : "📷"}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`control-btn ${isScreenSharing ? "active" : ""}`}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          🖥️
        </button>

        <button
          onClick={leaveMeeting}
          className="control-btn leave-btn"
          title="Leave meeting"
        >
          📞
        </button>

        {isAdmin && (
          <button
            onClick={handleEndMeeting}
            className="control-btn end-btn"
            title="End meeting for everyone"
          >
            ⏹️ End Meeting
          </button>
        )}
        {/* Participants Modal */}
        {showParticipants && (
          <div className="participants-modal">
            <div className="participants-content">
              <h3>Participants ({peers.size + 1})</h3>
              <ul>
                <li>{user?.name} (You)</li>
                {Array.from(peers.entries()).map(([socketId, peer]) => (
                  <li key={socketId}>{peer.userName || "Participant"}</li>
                ))}
              </ul>
              <button onClick={() => setShowParticipants(false)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Remote Video Component
const RemoteVideo = ({
  socketId,
  stream,
  audioEnabled,
  videoEnabled,
  userName,
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container">
      <video ref={videoRef} autoPlay playsInline className="video-element" />
      <div className="video-overlay">
        <span className="participant-name">{userName || "Participant"}</span>
        {!audioEnabled && <span className="muted-icon">🔇</span>}
        {!videoEnabled && <span className="camera-off-icon">📷</span>}
      </div>
    </div>
  );
};

export default MeetingRoom;
