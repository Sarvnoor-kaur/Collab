# 🔧 Complete Fix - All Backend URLs

## ✅ Files Fixed

I've updated **3 files** to hardcode the backend URL:

### 1. client/src/config/apiRoutes.js
```javascript
BASE: "http://13.206.129.127:30500",  // Hardcoded
```

### 2. client/src/context/AuthContext.js
```javascript
axios.defaults.baseURL = "http://13.206.129.127:30500";  // Hardcoded
```

### 3. client/src/context/SocketContext.js
```javascript
const newSocket = io("http://13.206.129.127:30500", {  // Hardcoded
```

## 🚀 Deploy the Fix

### Step 1: Commit and Push

```powershell
git add client/src/config/apiRoutes.js
git add client/src/context/AuthContext.js
git add client/src/context/SocketContext.js
git commit -m "Fix: Hardcode all backend URLs for Kubernetes deployment"
git push origin main
```

### Step 2: Rebuild and Deploy

**Option A: Use Jenkins (Recommended)**
```
1. Go to Jenkins: http://<JENKINS_IP>:8080
2. Click on your pipeline
3. Click "Build Now"
4. Wait 3-5 minutes
```

**Option B: Manual Build**
```powershell
# Build
docker build --no-cache -t sarvnoorkaur/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client

# Push
docker login
docker push sarvnoorkaur/collabsphere-frontend:latest

# Deploy
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@13.206.129.127 "sudo kubectl delete pods -l app=frontend -n collabsphere"
```

### Step 3: Clear Browser Cache

```
1. Close browser completely
2. Reopen browser
3. Press Ctrl + Shift + Delete
4. Select "All time"
5. Check "Cached images and files"
6. Click "Clear data"
```

### Step 4: Test

```
1. Open in incognito: http://13.206.129.127:30300
2. Try to register
3. Try to login
```

## 🔍 Verify the Fix

After deploying, check in browser DevTools:

```
1. Open: http://13.206.129.127:30300
2. Press F12 (DevTools)
3. Go to Network tab
4. Try to register/login
5. Check the request URL - should be:
   http://13.206.129.127:30500/api/auth/register
   http://13.206.129.127:30500/api/auth/login
```

## ✅ What Should Work Now

- ✅ Registration
- ✅ Login
- ✅ Chat (Socket.io connection)
- ✅ All API calls

## 🎯 Why This Happened

The issue was that **3 different places** in the code were setting the backend URL:

1. `apiRoutes.js` - Used by some components
2. `AuthContext.js` - Used by axios (login/register)
3. `SocketContext.js` - Used by Socket.io (real-time chat)

All three needed to be updated to point to the Kubernetes backend.

## 📋 Quick Commands

```powershell
# Commit
git add client/src/config/apiRoutes.js client/src/context/AuthContext.js client/src/context/SocketContext.js
git commit -m "Fix: Hardcode all backend URLs"
git push origin main

# Build
docker build --no-cache -t sarvnoorkaur/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client
docker push sarvnoorkaur/collabsphere-frontend:latest

# Deploy
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@13.206.129.127 "sudo kubectl delete pods -l app=frontend -n collabsphere"

# Wait 30 seconds, then test
```

## 🆘 If Still Not Working

1. **Check if you committed and pushed:**
   ```powershell
   git log --oneline -1
   # Should show: "Fix: Hardcode all backend URLs"
   ```

2. **Check if Jenkins pulled latest code:**
   - Go to Jenkins console output
   - Look for "Cloning repository"
   - Check the commit hash

3. **Check if pods are using new image:**
   ```bash
   ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@13.206.129.127
   sudo kubectl describe pod -l app=frontend -n collabsphere | grep Image:
   ```

4. **Clear browser cache COMPLETELY:**
   - Close ALL browser windows
   - Reopen
   - Ctrl+Shift+Delete → All time → Clear

5. **Test in different browser:**
   - Try Firefox if using Chrome
   - Or vice versa

