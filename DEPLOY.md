# Deployment Guide

## Railway (Recommended)

### 1. Deploy MongoDB
- Go to railway.app
- New Project → Add MongoDB
- Copy MONGO_URL

### 2. Deploy Backend
- New Service → GitHub Repo
- Root Directory: `backend`
- Environment Variables:
  - `MONGO_URI`: (from step 1)
  - `JWT_SECRET`: random_string
  - `PORT`: 5000
  - `CLIENT_URL`: (add after frontend)

### 3. Deploy Frontend
- New Service → GitHub Repo
- Root Directory: `client`
- Environment Variables:
  - `REACT_APP_API_URL`: (backend URL)

### 4. Update Backend
- Add `CLIENT_URL`: (frontend URL)
- Redeploy

## Render + Vercel

### Backend (Render)
- New Web Service
- Root: `backend`
- Build: `npm install`
- Start: `npm start`
- Add environment variables

### Frontend (Vercel)
- Import project
- Root: `client`
- Framework: Create React App
- Add `REACT_APP_API_URL`

## Environment Variables

**Backend:**
```
MONGO_URI=your_mongodb_url
JWT_SECRET=your_secret
PORT=5000
NODE_ENV=production
CLIENT_URL=your_frontend_url
```

**Frontend:**
```
REACT_APP_API_URL=your_backend_url
```
