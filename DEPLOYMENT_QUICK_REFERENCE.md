# 🚀 Quick Deployment Reference

## 📋 Pre-Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] MongoDB Atlas cluster created
- [ ] Database user and network access configured
- [ ] Connection string ready

## 🔗 Important URLs to Save

| Service | URL Template | Your URL |
|---------|--------------|----------|
| **MongoDB Atlas** | `mongodb+srv://user:pass@cluster.mongodb.net/db` | `_________________` |
| **Render Backend** | `https://your-app.onrender.com` | `_________________` |
| **Vercel Frontend** | `https://your-app.vercel.app` | `_________________` |

## ⚡ Quick Deploy Commands

### Deploy Frontend to Vercel:
```bash
cd client
npm install -g vercel
vercel login
vercel --prod
```

### Test Backend Health:
```bash
curl https://your-backend.onrender.com/api/health
```

## 🔧 Environment Variables

### Render Backend:
```env
NODE_ENV=production
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
CLIENT_URL=https://your-frontend.vercel.app
```

### Vercel Frontend:
```env
REACT_APP_API_URL=https://your-backend.onrender.com
REACT_APP_SOCKET_URL=https://your-backend.onrender.com
```

## 🚨 Common Issues

| Problem | Solution |
|---------|----------|
| **Backend 500 error** | Check MongoDB connection string |
| **CORS error** | Verify CLIENT_URL in backend env |
| **Socket.io fails** | Check REACT_APP_SOCKET_URL |
| **Build fails** | Run `npm run build` locally first |

## 📞 Support Links

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Vercel Docs:** [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas:** [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

## ⏱️ Deployment Time Estimate

- **MongoDB Atlas:** 5-10 minutes
- **Render Backend:** 10-15 minutes
- **Vercel Frontend:** 5-10 minutes
- **Testing & Fixes:** 15-30 minutes

**Total: 35-65 minutes** ⏰