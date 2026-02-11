import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { getMeeting, endMeeting } from '../services/meetingService';
import '../styles/MeetingRoom.css';

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState(new Map());
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const localVideoRef = useRef(null);
  const peerConnections = useRef(new Map());
  const screenStream = useRef(null);

  // ICE servers configuration (STUN servers)
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  // Load meeting data
  useEffect(() => {
    loadMeeting();
  }, [meetingId]);

  // Initialize media and socket
  useEffect(() => {
    if (meeting && socket) {
      initializeMedia();
      setupSocketListeners();
    }

    return () => {
      cleanup();
    };
  }, [meeting, socket]);

  const loadMeeting = async () => {
    try {
      setLoading(true);
      const response = await getMeeting(meetingId);
      setMeeting(response.data);
    } catch (err) {
      console.error('Failed to load meeting:', err);
      setError(err.response?.data?.message || 'Failed to load meeting');
    } finally {
      setLoading(false);
    }
  };

  const initializeMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Join meeting via socket
      socket.emit('joinMeeting', { meetingId });
    } catch (err) {
      console.error('Failed to get media:', err);
      setError('Failed to access camera/microphone');
    }
  };

  const setupSocketListeners = () => {
    // Meeting joined successfully
    socket.on('meetingJoined', ({ participants }) => {
      console.log('Joined meeting, existing participants:', participants);
      // Create peer connections for existing participants
      participants.forEach(socketId => {
        createPeerConnection(socketId, true);
      });
    });

    // New user joined
    socket.on('userJoinedMeeting', ({ socketId, userName }) => {
      console.log('User joined:', userName);
      createPeerConnection(socketId, false);
    });

    // User left
    socket.on('userLeftMeeting', ({ socketId }) => {
      console.log('User left:', socketId);
      removePeer(socketId);
    });

    // WebRTC signaling
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('iceCandidate', handleIceCandidate);

    // Media state changes
    socket.on('participantMediaStateChanged', ({ socketId, audioEnabled, videoEnabled }) => {
      setPeers(prev => {
        const newPeers = new Map(prev);
        const peer = newPeers.get(socketId);
        if (peer) {
          newPeers.set(socketId, { ...peer, audioEnabled, videoEnabled });
        }
        return newPeers;
      });
    });

    // Meeting ended
    socket.on('meetingEnded', () => {
      alert('Meeting has been ended by the host');
      leaveMeeting();
    });

    socket.on('meetingError', ({ message }) => {
      setError(message);
    });
  };

  const createPeerConnection = async (socketId, isInitiator) => {
    try {
      const peerConnection = new RTCPeerConnection(iceServers);

      // Add local stream tracks
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });
      }

      // Handle incoming stream
      peerConnection.ontrack = (event) => {
        console.log('Received remote track from:', socketId);
        setPeers(prev => {
          const newPeers = new Map(prev);
          newPeers.set(socketId, {
            stream: event.streams[0],
            audioEnabled: true,
            videoEnabled: true
          });
          return newPeers;
        });
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('iceCandidate', {
            meetingId,
            targetSocketId: socketId,
            candidate: event.candidate
          });
        }
      };

      peerConnections.current.set(socketId, peerConnection);

      // If initiator, create and send offer
      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('offer', {
          meetingId,
          targetSocketId: socketId,
          offer
        });
      }
    } catch (err) {
      console.error('Error creating peer connection:', err);
    }
  };

  const handleOffer = async ({ offer, senderSocketId, senderUserName }) => {
    try {
      const peerConnection = peerConnections.current.get(senderSocketId) || 
                            await createPeerConnection(senderSocketId, false);

      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socket.emit('answer', {
        meetingId,
        targetSocketId: senderSocketId,
        answer
      });
    } catch (err) {
      console.error('Error handling offer:', err);
    }
  };

  const handleAnswer = async ({ answer, senderSocketId }) => {
    try {
      const peerConnection = peerConnections.current.get(senderSocketId);
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      }
    } catch (err) {
      console.error('Error handling answer:', err);
    }
  };

  const handleIceCandidate = async ({ candidate, senderSocketId }) => {
    try {
      const peerConnection = peerConnections.current.get(senderSocketId);
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (err) {
      console.error('Error handling ICE candidate:', err);
    }
  };

  const removePeer = (socketId) => {
    const peerConnection = peerConnections.current.get(socketId);
    if (peerConnection) {
      peerConnection.close();
      peerConnections.current.delete(socketId);
    }

    setPeers(prev => {
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
        
        socket.emit('mediaStateChange', {
          meetingId,
          audioEnabled: audioTrack.enabled,
          videoEnabled
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
        
        socket.emit('mediaStateChange', {
          meetingId,
          audioEnabled,
          videoEnabled: videoTrack.enabled
        });
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });

        screenStream.current = stream;
        const videoTrack = stream.getVideoTracks()[0];

        // Replace video track in all peer connections
        peerConnections.current.forEach(peerConnection => {
          const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
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
        socket.emit('screenShareStateChange', { meetingId, isSharing: true });
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error('Error toggling screen share:', err);
    }
  };

  const stopScreenShare = () => {
    if (screenStream.current) {
      screenStream.current.getTracks().forEach(track => track.stop());
      screenStream.current = null;
    }

    // Restore camera video
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      peerConnections.current.forEach(peerConnection => {
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
    }

    setIsScreenSharing(false);
    socket.emit('screenShareStateChange', { meetingId, isSharing: false });
  };

  const leaveMeeting = () => {
    cleanup();
    navigate('/chat');
  };

  const handleEndMeeting = async () => {
    if (window.confirm('Are you sure you want to end this meeting for everyone?')) {
      try {
        await endMeeting(meetingId);
        navigate('/chat');
      } catch (err) {
        console.error('Failed to end meeting:', err);
        alert('Failed to end meeting');
      }
    }
  };

  const cleanup = () => {
    // Leave meeting via socket
    if (socket) {
      socket.emit('leaveMeeting', { meetingId });
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    // Stop screen share
    if (screenStream.current) {
      screenStream.current.getTracks().forEach(track => track.stop());
    }

    // Close all peer connections
    peerConnections.current.forEach(pc => pc.close());
    peerConnections.current.clear();
  };

  const isAdmin = meeting?.createdBy?._id === user?.id || 
                  meeting?.createdBy === user?.id;

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
        <button onClick={() => navigate('/chat')} className="btn-primary">
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
            {peers.size + 1} participant{peers.size !== 0 ? 's' : ''}
          </span>
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
            stream={peer.stream}
            audioEnabled={peer.audioEnabled}
            videoEnabled={peer.videoEnabled}
          />
        ))}
      </div>

      {/* Meeting Controls */}
      <div className="meeting-controls">
        <button
          onClick={toggleAudio}
          className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
          title={audioEnabled ? 'Mute' : 'Unmute'}
        >
          {audioEnabled ? '🎤' : '🔇'}
        </button>

        <button
          onClick={toggleVideo}
          className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? '📹' : '📷'}
        </button>

        <button
          onClick={toggleScreenShare}
          className={`control-btn ${isScreenSharing ? 'active' : ''}`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
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
      </div>
    </div>
  );
};

// Remote Video Component
const RemoteVideo = ({ stream, audioEnabled, videoEnabled }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="video-element"
      />
      <div className="video-overlay">
        <span className="participant-name">Participant</span>
        {!audioEnabled && <span className="muted-icon">🔇</span>}
        {!videoEnabled && <span className="camera-off-icon">📷</span>}
      </div>
    </div>
  );
};

export default MeetingRoom;
