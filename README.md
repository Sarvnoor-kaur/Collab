# CollabSphere - MERN Stack Real-Time Collaboration Platform

## 📋 Complete Feature Set

A production-ready MERN stack application with:
- ✅ **Phase 1:** User Authentication (JWT)
- ✅ **Phase 2:** Real-Time Chat System (Socket.io)
- ✅ **Phase 3:** User Discovery & Online Presence


## 🏗️ Project Structure

```
collabsphere/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── chatController.js     # Chat APIs
│   │   └── userController.js     # User discovery APIs
│   ├── middlewares/
│   │   ├── auth.js               # JWT authentication
│   │   └── errorHandler.js       # Error handling
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Conversation.js       # Conversation schema
│   │   └── Message.js            # Message schema
│   ├── routes/
│   │   ├── authRoutes.js         # Auth endpoints
│   │   ├── chatRoutes.js         # Chat endpoints
│   │   └── userRoutes.js         # User endpoints
│   ├── sockets/
│   │   └── socketHandler.js      # Socket.io logic
│   ├── utils/
│   │   └── socketAuth.js         # Socket authentication
│   ├── .env                      # Environment variables
│   ├── package.json
│   └── server.js                 # Express + Socket.io server
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── ConversationList.js
│   │   │   │   ├── MessageWindow.js
│   │   │   │   ├── MessageInput.js
│   │   │   │   ├── TypingIndicator.js
│   │   │   │   └── NewChatModal.js
│   │   │   └── PrivateRoute.js
│   │   ├── context/
│   │   │   ├── AuthContext.js    # Auth state
│   │   │   └── SocketContext.js  # Socket state
│   │   ├── pages/
│   │   │   ├── Register.js
│   │   │   ├── Login.js
│   │   │   ├── Dashboard.js
│   │   │   ├── UserDiscovery.js  # User discovery page
│   │   │   └── Chat.js
│   │   ├── services/
│   │   │   ├── chatService.js    # Chat API calls
│   │   │   └── userService.js    # User API calls
│   │   ├── styles/
│   │   │   ├── Chat.css
│   │   │   └── UserDiscovery.css
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   └── package.json
│
├── README.md
├── PHASE2_DOCUMENTATION.md
└── USER_DISCOVERY_DOCUMENTATION.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (running locally or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update `MONGO_URI` with your MongoDB connection string
- Change `JWT_SECRET` to a secure random string

4. Start the backend server:
```bash
npm run server
```

Backend will run on `http://localhost:5001`

### Frontend Setup

1. Open a new terminal and navigate to client folder:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

Frontend will run on `http://localhost:3000`

## 🎯 User Flow

### 1. Registration & Login
- Register a new account at `/register`
- Login at `/login`
- JWT token stored in localStorage
- Automatic redirect to User Discovery page

### 2. User Discovery (`/discover`)
- View all registered users
- Search users by name or email
- See real-time online/offline status (🟢 Online / ⚪ Offline)
- Click "Start Chat" to initiate conversation

### 3. Real-Time Chat (`/chat`)
- View all your conversations
- Click conversation to open chat
- Send/receive messages in real-time
- See typing indicators
- Online/offline presence
- One-to-one and group chat support

## 🔐 API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Private |
| GET | `/api/auth/logout` | Logout user | Private |

### User Discovery Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/users` | Get all users | Private |
| GET | `/api/users/search?query=` | Search users | Private |
| GET | `/api/users/online` | Get online users | Private |
| GET | `/api/users/:userId` | Get user by ID | Private |

### Chat Routes

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/chat/conversation` | Create/get conversation | Private |
| GET | `/api/chat/conversations` | Get all conversations | Private |
| GET | `/api/chat/messages/:conversationId` | Get messages | Private |
| PUT | `/api/chat/read/:conversationId` | Mark as read | Private |

## 🔌 Socket.io Events

### Client → Server

- `joinConversation` - Join a conversation room
- `leaveConversation` - Leave a conversation room
- `sendMessage` - Send a message
- `typing` - User is typing
- `stopTyping` - User stopped typing
- `messageRead` - Mark message as read

### Server → Client

- `receiveMessage` - New message received
- `userTyping` - User is typing
- `userStoppedTyping` - User stopped typing
- `userOnline` - User came online
- `userOffline` - User went offline
- `newMessageNotification` - New message notification

## 🧪 Testing

### Test with Multiple Users

1. **Register 2-3 users:**
   - Open Chrome: Register User A
   - Open Firefox: Register User B
   - Open Edge: Register User C

2. **Test User Discovery:**
   - User A: Go to `/discover`
   - Should see User B and User C
   - Check online status badges

3. **Test Chat Initiation:**
   - User A: Click "Start Chat" on User B
   - Should navigate to `/chat`
   - Should open conversation with User B

4. **Test Real-Time Messaging:**
   - User A: Send "Hello!"
   - User B: Should receive instantly
   - User B: Reply "Hi there!"
   - User A: Should receive instantly

5. **Test Typing Indicator:**
   - User A: Start typing (don't send)
   - User B: Should see "typing..." indicator
   - User A: Stop typing
   - User B: Indicator should disappear

6. **Test Online/Offline:**
   - User B: Logout or close browser
   - User A: Should see User B go offline
   - User B: Login again
   - User A: Should see User B come online

## 🔒 Security Features

- **JWT Authentication:** Secure token-based auth
- **Password Hashing:** bcrypt with salt rounds
- **HTTP-Only Cookies:** XSS protection
- **Socket Authentication:** JWT verification on connection
- **Input Validation:** express-validator
- **Authorization Checks:** User permissions verified
- **CORS Protection:** Configured for specific origins
- **Environment Variables:** Sensitive data protection

## 🎨 Key Features

### Phase 1: Authentication
- User registration with validation
- Secure login with JWT
- Protected routes
- Token management
- Logout functionality

### Phase 2: Real-Time Chat
- One-to-one messaging
- Group chat support
- Real-time message delivery
- Typing indicators
- Read receipts
- Message history
- Conversation management

### Phase 3: User Discovery
- View all registered users
- Search by name or email
- Real-time online/offline status
- Instant chat initiation
- Lazy conversation creation
- Duplicate prevention

## 📊 Architecture Highlights

### REST API vs Socket.io

**REST API (HTTP):**
- User authentication
- User search and discovery
- Conversation creation
- Message history loading
- Bulk operations

**Socket.io (WebSocket):**
- Real-time messaging
- Typing indicators
- Online/offline presence
- Live notifications
- Instant updates

### Why Both?

- **REST:** Reliable, stateless, cacheable, perfect for data fetching
- **Socket.io:** Real-time, bidirectional, low latency, perfect for live updates
- **Combined:** Best of both worlds for optimal performance

### Data Storage

| Data Type | Storage | Reason |
|-----------|---------|--------|
| User Profiles | MongoDB | Persistent, searchable |
| Conversations | MongoDB | Persistent history |
| Messages | MongoDB | Permanent record |
| Online Status | Memory (Map) | Temporary, real-time |
| Typing State | Memory | Ephemeral |

## 🚀 Performance Optimizations

1. **Database Indexes:** Fast queries on users, conversations, messages
2. **Pagination:** Limit results per page
3. **Field Selection:** Only return needed fields
4. **Debounced Search:** Reduce API calls
5. **In-Memory Presence:** Fast online status checks
6. **Room-Based Broadcasting:** Targeted message delivery
7. **Optimistic UI Updates:** Instant feedback

## 📈 Scalability Considerations

### Current (Small Scale)
- Single server instance
- In-memory online users
- Works for < 10,000 concurrent users

### Future (Large Scale)
- Multiple server instances
- Redis for shared state
- Load balancer
- Database replication
- CDN for static assets

## 🐛 Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `.env`
- For MongoDB Atlas, whitelist your IP

### Socket.io Not Connecting
- Check token is being sent
- Verify CORS settings
- Check browser console for errors

### Messages Not Appearing
- Verify socket connection
- Check if user joined conversation room
- Inspect network tab for socket events

### Online Status Not Updating
- Check Socket.io connection
- Verify socket event listeners
- Check browser console

## 📝 Environment Variables

```env
NODE_ENV=development
PORT=5001
MONGO_URI=mongodb://localhost:27017/collabsphere
JWT_SECRET=your_super_secret_jwt_key_change_this
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
CLIENT_URL=http://localhost:3000
```

## 📦 Dependencies

### Backend
- express - Web framework
- mongoose - MongoDB ODM
- socket.io - WebSocket library
- bcryptjs - Password hashing
- jsonwebtoken - JWT generation
- express-validator - Input validation
- cors - CORS middleware
- cookie-parser - Cookie parsing
- dotenv - Environment variables

### Frontend
- react - UI library
- react-router-dom - Routing
- socket.io-client - Socket.io client
- axios - HTTP client
- Context API - State management

## 🎯 Next Steps (Future Phases)

- [ ] Video conferencing (WebRTC)
- [ ] File sharing and uploads
- [ ] Voice messages
- [ ] Message reactions
- [ ] Message editing/deletion
- [ ] Push notifications
- [ ] Message search
- [ ] User blocking
- [ ] Admin controls
- [ ] Analytics dashboard

## 📚 Documentation

- `README.md` - This file
- `PHASE2_DOCUMENTATION.md` - Real-time chat system details
- `USER_DISCOVERY_DOCUMENTATION.md` - User discovery architecture
- `POSTMAN_GUIDE.md` - API testing guide

## 👨‍💻 Development

### Running Tests
```bash
# Backend tests (when implemented)
cd backend
npm test

# Frontend tests (when implemented)
cd client
npm test
```

### Building for Production
```bash
# Frontend build
cd client
npm run build

# Backend (use PM2 or similar)
cd backend
pm2 start server.js
```

## 📄 License

MIT

## 🙏 Acknowledgments

Built with modern web technologies and best practices for production-ready applications.

---

**CollabSphere - Where Collaboration Happens in Real-Time! 🚀**
