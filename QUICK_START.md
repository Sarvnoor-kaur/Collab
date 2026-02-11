# 🚀 CollabSphere - Quick Start Guide

## ⚡ Get Started in 5 Minutes

### Step 1: Clone & Install (2 minutes)

```bash
# Backend
cd backend
npm install

# Frontend (new terminal)
cd client
npm install
```

### Step 2: Configure Environment (1 minute)

```bash
# In backend folder
cp .env.example .env

# Edit .env file:
# - Set MONGO_URI (use MongoDB Atlas or local MongoDB)
# - Change JWT_SECRET to a random string
```

### Step 3: Start Servers (1 minute)

```bash
# Terminal 1: Backend
cd backend
npm run server

# Terminal 2: Frontend
cd client
npm start
```

### Step 4: Test the App (1 minute)

1. Open `http://localhost:3000`
2. Register a new account
3. You'll be redirected to User Discovery page
4. Open another browser (incognito mode)
5. Register another account
6. See both users online
7. Click "Start Chat" to begin messaging!

---

## 🎯 What You Get

### ✅ Phase 1: Authentication
- Secure registration & login
- JWT token management
- Protected routes

### ✅ Phase 2: Real-Time Chat
- One-to-one messaging
- Group chat
- Typing indicators
- Read receipts
- Message history

### ✅ Phase 3: User Discovery
- View all users
- Search by name/email
- Real-time online status
- Instant chat initiation

---

## 🧪 Quick Test Scenarios

### Test 1: User Discovery (30 seconds)
1. Register User A
2. Register User B (different browser)
3. Both see each other in discovery page
4. Check online status (green dot)

### Test 2: Start Chat (30 seconds)
1. User A: Click "Start Chat" on User B
2. Send message "Hello!"
3. User B: See message instantly
4. Reply "Hi there!"
5. User A: See reply instantly

### Test 3: Typing Indicator (15 seconds)
1. User A: Start typing
2. User B: See "typing..." indicator
3. User A: Stop typing
4. User B: Indicator disappears

### Test 4: Online/Offline (15 seconds)
1. User B: Logout
2. User A: See User B go offline
3. User B: Login again
4. User A: See User B come online

---

## 📱 User Journey

```
Register → Login → Discover Users → Start Chat → Real-Time Messaging
```

1. **Register** at `/register`
2. **Auto-redirect** to `/discover`
3. **See all users** with online status
4. **Search users** by name or email
5. **Click "Start Chat"** on any user
6. **Navigate to** `/chat`
7. **Send messages** in real-time
8. **See typing** indicators
9. **Track online** status

---

## 🔑 Key URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001
- **Register:** http://localhost:3000/register
- **Login:** http://localhost:3000/login
- **Discover:** http://localhost:3000/discover
- **Chat:** http://localhost:3000/chat

---

## 🛠️ Troubleshooting

### Backend won't start
```bash
# Check if MongoDB is running
mongod

# Or use MongoDB Atlas connection string
```

### Frontend won't start
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install
```

### Socket.io not connecting
```bash
# Check backend is running on port 5001
# Check browser console for errors
# Verify JWT token is being sent
```

### Can't see other users
```bash
# Make sure both users are registered
# Check backend logs for errors
# Verify MongoDB connection
```

---

## 📚 Next Steps

1. Read `README.md` for complete documentation
2. Check `PHASE2_DOCUMENTATION.md` for chat system details
3. Review `USER_DISCOVERY_DOCUMENTATION.md` for architecture
4. Test with `POSTMAN_GUIDE.md`

---

## 💡 Pro Tips

1. **Use different browsers** for testing multiple users
2. **Open DevTools** to see Socket.io events
3. **Check MongoDB** to see data persistence
4. **Monitor backend logs** for debugging
5. **Use Postman** to test APIs directly

---

## 🎉 You're Ready!

Start building amazing real-time collaboration features!

**Happy Coding! 🚀**
