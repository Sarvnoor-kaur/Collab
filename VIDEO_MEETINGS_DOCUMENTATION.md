# 🎥 Phase 4: Video Meetings - Complete Documentation

## 📋 Overview

Production-ready video conferencing system similar to Zoom/Google Meet, fully integrated with CollabSphere's chat system.

---

## 🏗️ Architecture Overview

### Three-Layer Communication

```
1. REST API (HTTP)
   └─> Meeting lifecycle management
   └─> Authorization & authentication
   └─> Meeting metadata

2. Socket.io (WebSocket)
   └─> Signaling server
   └─> Peer discovery
   └─> Meeting events

3. WebRTC (Peer-to-Peer)
   └─> Actual video/audio streaming
   └─> Direct browser-to-browser
   └─> No server involvement in media
```

---

## 🔐 Authorization & Security

### Role-Based Access Control

**Group Admin Powers:**
- Create meetings
- End meetings for everyone
- Full control over meeting lifecycle

**Group Members:**
- Join meetings (if they're conversation participants)
- Leave meetings
- Control their own media (mute/unmute, camera on/off)

**Implementation:**

```javascript
// Backend authorization check
if (conversation.isGroupChat) {
  // Only admin can create meeting
  if (conversation.groupAdmin.toString() !== userId) {
    return res.status(403).json({
      message: 'Only group admin can create meetings'
    });
  }
}

// For one-to-one chats, both participants can create meetings
if (!conversation.participants.includes(userId)) {
  return res.status(403).json({
    message: 'You are not a participant'
  });
}
```

---

## 📅 Meeting Model Explained

### Schema Structure

```javascript
Meeting {
  _id: ObjectId,              // MongoDB internal ID
  meetingId: String,          // Human-readable: "A1B-C2D-E3F"
  conversation: ObjectId,     // Reference to conversation
  createdBy: ObjectId,        // Admin who created it
  participants: [{
    user: ObjectId,
    joinedAt: Date,
    leftAt: Date
  }],
  isLive: Boolean,           // Meeting status
  startedAt: Date,
  endedAt: Date
}
```

### Why meetingId is Separate from _id

**_id (MongoDB ObjectId):**
- Internal database identifier
- Long: `507f1f77bcf86cd799439011`
- Not user-friendly
- Used for database queries

**meetingId (Human-readable):**
- User-facing identifier
- Short: `A1B-C2D-E3F`
- Easy to share: "Join meeting A1B-C2D-E3F"
- Used in URLs: `/meet/A1B-C2D-E3F`
- Easy to communicate verbally

**Example:**
```
Meeting Link: https://collabsphere.com/meet/A1B-C2D-E3F
                                              ↑
                                         meetingId
```

### Why Meetings Belong to Conversations

**Design Decision:**
```
Conversation (Group/One-to-One)
    ↓
  Meeting
```

**Reasons:**

1. **Authorization Inheritance**
   - Meeting participants = Conversation participants
   - No need to manage separate member lists
   - Automatic access control

2. **Context Preservation**
   - Meeting is an extension of conversation
   - Chat history provides context
   - Seamless transition: Chat → Video → Chat

3. **Notification System**
   - Notify all conversation members
   - Use existing conversation rooms
   - Leverage chat infrastructure

4. **Data Organization**
   - Meetings grouped by conversation
   - Easy to find meeting history
   - Clear relationship in database

---

## 🔌 Socket.io Signaling Server

### Why Socket.io for Signaling?

**WebRTC Needs:**
- Peers must exchange connection information
- Cannot connect directly without introduction
- Need a "matchmaker" server

**Socket.io Provides:**
- Real-time bidirectional communication
- Room-based messaging
- Reliable message delivery
- Automatic reconnection

### Socket Rooms Architecture

**Meeting Rooms:**
```
meeting:<meetingId>
```

**Why Separate from Conversation Rooms?**

```
Conversation Room: conversation:<conversationId>
    └─> For chat messages
    └─> Persistent
    └─> All conversation members

Meeting Room: meeting:<meetingId>
    └─> For WebRTC signaling
    └─> Temporary (only during meeting)
    └─> Only active participants
```

**Benefits:**
1. **Isolation**: Meeting events don't interfere with chat
2. **Performance**: Only active participants receive signals
3. **Cleanup**: Easy to clean up when meeting ends
4. **Scalability**: Can have multiple meetings per conversation

---

## 📡 WebRTC Signaling Flow

### Complete Connection Process

```
User A (Initiator)                    Server                    User B (Receiver)
      |                                  |                              |
      |------ joinMeeting -------------->|                              |
      |                                  |------ userJoinedMeeting ---->|
      |                                  |                              |
      |                                  |<----- joinMeeting -----------|
      |<----- meetingJoined -------------|                              |
      |                                  |                              |
      |------ offer -------------------->|                              |
      |                                  |------ offer ---------------->|
      |                                  |                              |
      |                                  |<----- answer ----------------|
      |<----- answer --------------------|                              |
      |                                  |                              |
      |------ iceCandidate ------------->|                              |
      |                                  |------ iceCandidate --------->|
      |                                  |                              |
      |                                  |<----- iceCandidate ----------|
      |<----- iceCandidate ---------------|                              |
      |                                  |                              |
      |<=============== WebRTC P2P Connection Established =============>|
```

### Signaling Events Explained

**1. joinMeeting**
```javascript
// Client sends
socket.emit('joinMeeting', { meetingId });

// Server:
// - Verifies user authorization
// - Adds user to meeting room
// - Notifies existing participants
// - Returns list of current participants
```

**2. offer (SDP Offer)**
```javascript
// Initiator creates offer
const offer = await peerConnection.createOffer();
await peerConnection.setLocalDescription(offer);

// Send to peer via server
socket.emit('offer', { targetSocketId, offer });

// Contains:
// - Supported codecs
// - Media capabilities
// - Network information
```

**3. answer (SDP Answer)**
```javascript
// Receiver creates answer
await peerConnection.setRemoteDescription(offer);
const answer = await peerConnection.createAnswer();
await peerConnection.setLocalDescription(answer);

// Send back to initiator
socket.emit('answer', { targetSocketId, answer });
```

**4. iceCandidate**
```javascript
// Both peers exchange ICE candidates
peerConnection.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('iceCandidate', {
      targetSocketId,
      candidate: event.candidate
    });
  }
};

// ICE Candidate contains:
// - IP addresses
// - Ports
// - Network protocols
// - Connection priorities
```

---

## 🎥 WebRTC Media Flow

### Why Socket.io is NOT Used for Video

**Socket.io (WebSocket):**
- Good for: Small messages, signaling
- Bad for: Large data streams
- Latency: Higher (goes through server)
- Bandwidth: Limited by server

**WebRTC (Peer-to-Peer):**
- Direct browser-to-browser connection
- No server in the middle
- Low latency
- High bandwidth
- Encrypted (DTLS-SRTP)

**Analogy:**
```
Socket.io = Phone call to arrange meeting
WebRTC = Face-to-face meeting

You use phone to coordinate, but actual meeting is direct.
```

### Peer Discovery Process

**Problem:** How do peers find each other on the internet?

**Solution:** ICE (Interactive Connectivity Establishment)

```
1. Gather Candidates:
   - Host candidate (local IP)
   - Server reflexive (public IP via STUN)
   - Relay candidate (via TURN if needed)

2. Exchange Candidates:
   - Via signaling server (Socket.io)
   - Both peers collect all candidates

3. Connectivity Checks:
   - Try all candidate pairs
   - Find best working path
   - Establish connection

4. Media Flows:
   - Direct P2P if possible
   - Through TURN relay if necessary
```

### STUN Servers

**What is STUN?**
- Session Traversal Utilities for NAT
- Helps discover public IP address
- Free public servers available

**Configuration:**
```javascript
const iceServers = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};
```

**What STUN Does:**
```
Your Browser                STUN Server
     |                           |
     |---- "What's my IP?" ----->|
     |                           |
     |<--- "203.0.113.5" --------|
     |                           |
```

### One-to-Many Connection Flow

**Mesh Topology (Current Implementation):**

```
User A ←→ User B
  ↓  ↘    ↗  ↓
  ↓    ↘↗    ↓
User C ←→ User D

Each peer connects to every other peer
```

**For 4 participants:**
- 6 peer connections total
- Each user maintains 3 connections

**Pros:**
- Low latency
- No server processing
- High quality

**Cons:**
- Scales poorly (N² connections)
- High bandwidth per client
- Recommended: < 6 participants

**Alternative for Large Meetings:**
- SFU (Selective Forwarding Unit)
- MCU (Multipoint Control Unit)
- Requires media server

---

## 🖥️ Screen Sharing

### How Track Replacement Works

**Concept:**
```
Normal Video: Camera → Video Track → Peer Connection
Screen Share: Screen → Video Track → Peer Connection
                ↑
         Replace track dynamically
```

**Implementation:**
```javascript
// 1. Get screen stream
const screenStream = await navigator.mediaDevices.getDisplayMedia({
  video: true
});

// 2. Get screen video track
const screenTrack = screenStream.getVideoTracks()[0];

// 3. Replace in all peer connections
peerConnections.forEach(pc => {
  const sender = pc.getSenders().find(s => s.track?.kind === 'video');
  sender.replaceTrack(screenTrack);
});

// 4. When done, restore camera
const cameraTrack = localStream.getVideoTracks()[0];
sender.replaceTrack(cameraTrack);
```

**Why This Works:**
- Peer connection stays alive
- Only video track changes
- No need to renegotiate
- Seamless for remote peers

**User Experience:**
```
1. User clicks "Share Screen"
2. Browser shows screen picker
3. User selects screen/window
4. Video track replaced
5. Remote peers see screen
6. User clicks "Stop Sharing"
7. Camera track restored
8. Remote peers see camera again
```

---

## 🎨 Frontend Architecture

### Component Structure

```
MeetingRoom
├── Meeting Header
│   ├── Meeting ID
│   └── Participant Count
├── Video Grid
│   ├── Local Video (You)
│   └── Remote Videos (Others)
└── Meeting Controls
    ├── Mute/Unmute
    ├── Camera On/Off
    ├── Screen Share
    ├── Leave Meeting
    └── End Meeting (Admin only)
```

### State Management

```javascript
// Meeting data
const [meeting, setMeeting] = useState(null);

// Media streams
const [localStream, setLocalStream] = useState(null);
const [peers, setPeers] = useState(new Map());

// Media states
const [audioEnabled, setAudioEnabled] = useState(true);
const [videoEnabled, setVideoEnabled] = useState(true);
const [isScreenSharing, setIsScreenSharing] = useState(false);

// WebRTC connections
const peerConnections = useRef(new Map());
```

### Meeting Join Flow

```
1. User clicks meeting link
   └─> Navigate to /meet/:meetingId

2. Load meeting data (REST API)
   └─> GET /api/meetings/:meetingId
   └─> Verify authorization
   └─> Check if meeting is live

3. Request media permissions
   └─> navigator.mediaDevices.getUserMedia()
   └─> Get camera and microphone

4. Connect to Socket.io
   └─> Emit 'joinMeeting'
   └─> Receive list of participants

5. Create peer connections
   └─> For each existing participant
   └─> Create RTCPeerConnection
   └─> Exchange offers/answers

6. Render video grid
   └─> Show local video
   └─> Show remote videos as they connect

7. Enable controls
   └─> Mute/unmute
   └─> Camera on/off
   └─> Screen share
```

---

## 🧪 Testing Guide

### Test 1: Meeting Creation (Postman)

**Create Meeting:**
```
POST http://localhost:5001/api/meetings/conversations/:conversationId/meetings
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN

Expected Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "meetingId": "A1B-C2D-E3F",
    "conversation": "...",
    "createdBy": {...},
    "isLive": true,
    "startedAt": "2024-01-15T10:30:00.000Z"
  },
  "meetingLink": "http://localhost:3000/meet/A1B-C2D-E3F"
}
```

### Test 2: Multi-Tab Meeting

**Setup:**
1. Open Chrome: Login as User A
2. Open Firefox: Login as User B
3. User A: Create meeting in a conversation
4. Copy meeting link

**Test Steps:**
1. User A: Click meeting link
2. Allow camera/microphone
3. See your own video
4. User B: Open meeting link
5. Allow camera/microphone
6. **Expected:** Both users see each other's video
7. User A: Click mute
8. **Expected:** User B sees mute icon on User A
9. User A: Click screen share
10. **Expected:** User B sees User A's screen
11. User A: Click "End Meeting"
12. **Expected:** User B gets kicked out

### Test 3: WebRTC Debugging

**Browser DevTools:**

**Chrome:**
```
chrome://webrtc-internals/
```

**Firefox:**
```
about:webrtc
```

**What to Check:**
- ICE connection state
- Candidate pairs
- Bytes sent/received
- Packet loss
- Codec information

**Common Issues:**

**1. No Video/Audio**
```
Check:
- Browser permissions granted?
- getUserMedia() successful?
- Tracks added to peer connection?
- Remote stream received?
```

**2. Connection Fails**
```
Check:
- STUN servers reachable?
- ICE candidates exchanged?
- Firewall blocking UDP?
- Need TURN server?
```

**3. One-Way Video**
```
Check:
- Both peers added tracks?
- Offer/answer exchange complete?
- ICE candidates from both sides?
```

---

## 📊 Complete End-to-End Flow

### Scenario: Admin Creates Meeting → Users Join → Video Starts → Meeting Ends

```
STEP 1: Admin Creates Meeting
─────────────────────────────
Admin (Browser)              Backend                    Database
      |                         |                           |
      |-- POST /meetings ------>|                           |
      |                         |-- Verify admin ---------->|
      |                         |<-- Admin confirmed -------|
      |                         |-- Create meeting -------->|
      |                         |<-- Meeting created -------|
      |<-- Meeting link --------|                           |
      |                         |                           |
      |                    Socket.io                        |
      |<-- meetingCreated --|                               |
      |   notification      |                               |


STEP 2: Users Join Meeting
───────────────────────────
User (Browser)               Backend                    Socket.io
      |                         |                           |
      |-- GET /meet/:id ------->|                           |
      |<-- Meeting data --------|                           |
      |                         |                           |
      |-- getUserMedia() ------>|                           |
      |<-- Camera/Mic stream ---|                           |
      |                         |                           |
      |-- joinMeeting ----------------------->|             |
      |                         |<-- Verify auth ---------->|
      |<-- meetingJoined ----------------------|             |
      |<-- Participant list -------------------|             |


STEP 3: WebRTC Connection
──────────────────────────
User A                    Socket.io                    User B
  |                          |                           |
  |-- Create offer --------->|                           |
  |                          |-- Forward offer --------->|
  |                          |                           |
  |                          |<-- Create answer ---------|
  |<-- Forward answer -------|                           |
  |                          |                           |
  |-- ICE candidates ------->|                           |
  |                          |-- Forward ICE ----------->|
  |                          |                           |
  |<=============== P2P Connection Established =========>|
  |                                                       |
  |<=============== Video/Audio Streaming ==============>|


STEP 4: Meeting Controls
─────────────────────────
User                      Socket.io                  Other Users
  |                          |                           |
  |-- Toggle mute ---------->|                           |
  |                          |-- mediaStateChange ------>|
  |                          |                           |
  |-- Share screen --------->|                           |
  |                          |-- screenShareChange ----->|
  |                          |                           |


STEP 5: Meeting Ends
─────────────────────
Admin                     Backend                    All Users
  |                          |                           |
  |-- POST /end ------------>|                           |
  |                          |-- Update DB ------------->|
  |                          |                           |
  |                          |-- meetingEnded ---------->|
  |                          |                           |
  |                          |                           |-- Cleanup
  |                          |                           |-- Disconnect
  |                          |                           |-- Navigate away
```

---

## 🔒 Security Considerations

### 1. Authorization Layers

**Layer 1: REST API**
- JWT verification
- Role checking (admin/member)
- Conversation membership

**Layer 2: Socket.io**
- JWT verification on connection
- Meeting room authorization
- Participant verification

**Layer 3: WebRTC**
- Encrypted by default (DTLS-SRTP)
- Peer-to-peer (no server access)
- Browser security model

### 2. Meeting Access Control

```javascript
// Only conversation participants can join
if (!meeting.conversation.participants.includes(userId)) {
  return res.status(403).json({
    message: 'Not authorized'
  });
}

// Only live meetings can be joined
if (!meeting.isLive) {
  return res.status(400).json({
    message: 'Meeting has ended'
  });
}
```

### 3. Admin Controls

```javascript
// Only admin can end meeting
const isAdmin = meeting.createdBy.toString() === userId ||
                meeting.conversation.groupAdmin.toString() === userId;

if (!isAdmin) {
  return res.status(403).json({
    message: 'Only admin can end meeting'
  });
}
```

---

## 📈 Scalability Considerations

### Current Implementation (Mesh)

**Good for:**
- Small meetings (2-6 participants)
- High quality requirements
- Low latency needs

**Limitations:**
- Bandwidth: Each user uploads N-1 streams
- CPU: Each user encodes N-1 times
- Scales: O(N²) connections

### Future Scaling (SFU)

**Selective Forwarding Unit:**
```
User A ──┐
User B ──┼──> SFU Server ──┬──> User A
User C ──┘                  ├──> User B
                            └──> User C
```

**Benefits:**
- Each user uploads once
- Server forwards to others
- Scales to 100+ participants
- Lower client bandwidth

**Implementation:**
- Use Janus, Mediasoup, or Jitsi
- Requires media server
- More complex infrastructure

---

## 🎯 Key Takeaways

1. **REST API**: Meeting lifecycle and authorization
2. **Socket.io**: Signaling and coordination
3. **WebRTC**: Actual video/audio streaming
4. **Separation of Concerns**: Each layer has specific purpose
5. **Security**: Multiple authorization layers
6. **Scalability**: Mesh for small, SFU for large

---

**Video Meetings System Complete! 🎉**

You now have a production-ready video conferencing system integrated with your chat platform.
