# 🚀 Deploy Backend to Render

## Step 1: Push to GitHub

1. **Initialize git (if not done):**
```bash
git init
git add .
git commit -m "Initial commit"
```

2. **Create GitHub repository and push:**
```bash
git remote add origin https://github.com/yourusername/collabsphere.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy on Render

1. **Go to [render.com](https://render.com) and sign up/login**

2. **Click "New +" → "Web Service"**

3. **Connect your GitHub repository**

4. **Configure the service:**
   - **Name:** `collabsphere-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

## Step 3: Set Environment Variables

In Render dashboard, add these environment variables:

```env
NODE_ENV=production
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/collabsphere
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
CLIENT_URL=https://your-frontend-url.vercel.app
```

## Step 4: Get Your Backend URL

After deployment, Render will give you a URL like:
`https://collabsphere-backend.onrender.com`

## Step 5: Update Frontend Configuration

Update your client's API configuration to use the Render URL:

**In `client/src/config/apiRoutes.js`:**
```javascript
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://collabsphere-backend.onrender.com'
  : 'http://localhost:5001';
```

## Step 6: Test Your Deployment

1. **Health check:** Visit `https://your-app.onrender.com/api/health`
2. **Should return:** `{"success": true, "message": "Server is running"}`

## Important Notes

### Free Tier Limitations:
- **Sleeps after 15 minutes** of inactivity
- **750 hours/month** free (about 31 days)
- **Cold starts** when waking up (30-60 seconds)

### MongoDB Setup:
You'll need **MongoDB Atlas** (free tier available):
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster
3. Get connection string
4. Add to Render environment variables

### CORS Configuration:
Your backend already handles CORS correctly with `CLIENT_URL` environment variable.

## Troubleshooting

### Build Fails:
- Check build logs in Render dashboard
- Ensure `package.json` has correct dependencies
- Verify Node.js version compatibility

### App Won't Start:
- Check if `PORT` environment variable is set
- Verify `npm start` script exists
- Check server logs for errors

### Socket.io Issues:
- Ensure `CLIENT_URL` matches your frontend domain
- Check CORS settings
- Verify WebSocket connections are allowed

## Next Steps

After backend is deployed:
1. Deploy frontend to Vercel
2. Update frontend API URLs
3. Test real-time chat functionality
4. Monitor performance and logs

## Cost Optimization

**Free Tier Tips:**
- Use MongoDB Atlas free tier
- Deploy frontend to Vercel (free)
- Monitor usage to stay within limits

**Upgrade When Needed:**
- $7/month removes sleep limitation
- Better for production apps
- Faster cold starts