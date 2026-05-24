# 🔧 Rebuild Frontend Correctly - Step by Step

## 🚨 The Problem

The Docker build command you're using:
```bash
docker build -t sarvnoorkaur/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client
```

This builds from `./client` directory, which means:
- It copies files from `./client`
- The `.env` file in `./client` should be used
- But React might not be picking it up

## ✅ Solution: Verify and Rebuild

### Step 1: Verify .env File Exists and is Correct

```bash
# Check if .env exists in client folder
cat client/.env

# Should show:
# REACT_APP_API_URL=http://13.206.129.127:30500
```

### Step 2: Clean Build (Remove Cache)

```bash
# Remove old images
docker rmi sarvnoorkaur/collabsphere-frontend:latest

# Build with no cache
docker build --no-cache -t sarvnoorkaur/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client

# Push to Docker Hub
docker login
docker push sarvnoorkaur/collabsphere-frontend:latest
```

### Step 3: Verify the Built Image

```bash
# Check if the new image has the correct URL
docker run --rm sarvnoorkaur/collabsphere-frontend:latest sh -c "find /usr/share/nginx/html -name '*.js' -exec grep -l '13.206.129.127:30500' {} \;"

# Should show some .js files
# If it shows nothing, the .env wasn't used
```

### Step 4: Force Kubernetes to Use New Image

```bash
# SSH to K8s
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@13.206.129.127

# Delete all frontend pods
sudo kubectl delete pods -l app=frontend -n collabsphere

# Wait for new pods
sudo kubectl get pods -n collabsphere -w
```

### Step 5: Clear Browser Cache Completely

```
1. Open browser
2. Press Ctrl+Shift+Delete
3. Select "All time"
4. Check "Cached images and files"
5. Click "Clear data"
6. Close browser completely
7. Reopen and try again
```

---

## 🎯 Alternative: Build from Client Directory

Try building from inside the client directory:

```bash
# Go to client directory
cd client

# Build from here
docker build --no-cache -t sarvnoorkaur/collabsphere-frontend:latest -f ../docker/frontend.Dockerfile .

# Push
docker login
docker push sarvnoorkaur/collabsphere-frontend:latest
```

---

## 🔍 Debug: Check if .env is Being Used

### Test 1: Check .env Content
```bash
cat client/.env
```

### Test 2: Build and Check Immediately
```bash
# Build
docker build --no-cache -t test-frontend -f docker/frontend.Dockerfile ./client

# Check the built files
docker run --rm test-frontend sh -c "cat /usr/share/nginx/html/static/js/main.*.js" | grep -o "http://[^\"]*" | head -10

# Should show: http://13.206.129.127:30500
# If shows localhost:5001, .env is not being used
```

---

## ⚠️ Common Issue: .env.production Overriding .env

React uses `.env.production` in production builds. Check if it exists:

```bash
# Check if .env.production exists
ls -la client/.env*

# If .env.production exists, update it too
echo "REACT_APP_API_URL=http://13.206.129.127:30500" > client/.env.production
```

---

## 🚀 Nuclear Option: Hardcode the URL

If .env is not working, temporarily hardcode it:

### Edit client/src/config/apiRoutes.js:

```javascript
export const API = {
  // Hardcode for now
  BASE: "http://13.206.129.127:30500",
  // BASE: process.env.REACT_APP_API_URL || "http://localhost:5001",
  
  // ... rest of the code
};
```

Then rebuild:
```bash
docker build --no-cache -t sarvnoorkaur/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client
docker push sarvnoorkaur/collabsphere-frontend:latest
```

---

## 📋 Complete Rebuild Process

```bash
# 1. Verify .env
cat client/.env

# 2. Clean build
docker rmi sarvnoorkaur/collabsphere-frontend:latest
docker build --no-cache -t sarvnoorkaur/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client

# 3. Verify build
docker run --rm sarvnoorkaur/collabsphere-frontend:latest sh -c "cat /usr/share/nginx/html/static/js/main.*.js" | grep "13.206.129.127:30500"

# 4. If step 3 shows the URL, push
docker login
docker push sarvnoorkaur/collabsphere-frontend:latest

# 5. Deploy to K8s
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@13.206.129.127
sudo kubectl delete pods -l app=frontend -n collabsphere
sudo kubectl get pods -n collabsphere -w

# 6. Clear browser cache completely
# Ctrl+Shift+Delete → All time → Clear

# 7. Test in incognito window
# http://13.206.129.127:30300
```

---

## 🔍 Check What URL is Actually in the Image

Run this to see what's in your current Docker image:

```bash
docker run --rm sarvnoorkaur/collabsphere-frontend:latest sh -c "cat /usr/share/nginx/html/static/js/main.*.js" | grep -o "localhost:5001"

# If this shows "localhost:5001", your build didn't use the new .env
# If this shows nothing, the new .env was used
```

---

## 🎯 Most Likely Issues

### Issue 1: .env.production Exists
```bash
# Check
ls client/.env*

# If .env.production exists, update it
echo "REACT_APP_API_URL=http://13.206.129.127:30500" > client/.env.production
```

### Issue 2: Browser Cache
```
- Close browser completely
- Clear all cache
- Open in incognito
```

### Issue 3: Old Image Cached in Docker
```bash
# Remove local image
docker rmi sarvnoorkaur/collabsphere-frontend:latest

# Pull from Docker Hub to verify
docker pull sarvnoorkaur/collabsphere-frontend:latest

# Check it
docker run --rm sarvnoorkaur/collabsphere-frontend:latest sh -c "cat /usr/share/nginx/html/static/js/main.*.js" | grep "13.206.129.127"
```

---

## 🆘 If Nothing Works

Share the output of these commands:

```bash
# 1. Check .env
cat client/.env

# 2. Check if .env.production exists
ls -la client/.env*

# 3. Check what's in the Docker image
docker run --rm sarvnoorkaur/collabsphere-frontend:latest sh -c "cat /usr/share/nginx/html/static/js/main.*.js" | grep -o "http://[^\"]*:500[0-9]" | head -5

# 4. Check browser console
# Open DevTools (F12) → Console tab
# Share any errors
```

