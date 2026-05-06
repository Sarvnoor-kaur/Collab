# Quick Start

## 1. Start MongoDB
```bash
mongod
```

## 2. Install
```bash
cd backend && npm install
cd ../client && npm install
```

## 3. Configure

**backend/.env:**
```env
MONGO_URI=mongodb://localhost:27017/collabsphere
JWT_SECRET=your_secret
PORT=5001
CLIENT_URL=http://localhost:3000
```

**client/.env:**
```env
REACT_APP_API_URL=http://localhost:5001
```

## 4. Run
```bash
# Terminal 1
cd backend && npm start

# Terminal 2
cd client && npm start
```

Open http://localhost:3000
