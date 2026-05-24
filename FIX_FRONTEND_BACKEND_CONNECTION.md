# 🔧 Fix Frontend-Backend Connection Issue

## 🚨 Problem

Frontend is trying to connect to `localhost:5001` but should connect to Kubernetes backend at `http://<K8S_IP>:30500`

**Error:**
```
POST http://localhost:5001/api/auth/login net::ERR_CONNECTION_REFUSED
```

## ✅ Solution

### Step 1: Update client/.env File

```bash
# Edit the file
nano client/.env

# Change from:
REACT_APP_API_URL=http://localhost:5001

# Change to:
REACT_APP_API_URL=http://<K8S_PUBLIC_IP>:30500
```

**Example:**
```env
REACT_APP_API_URL=http://13.206.129.127:30500
```

### Step 2: Get Your K8s IP

```bash
cd terraform
terraform output k8s_instance_info
```

Or from AWS Console:
```
EC2 → Instances → k8s-server → Public IPv4 address
```

### Step 3: Rebuild Frontend Docker Image

```bash
# Build new image with updated .env
docker build -t sarvnoorkaur/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client

# Push to Docker Hub
docker login
docker push sarvnoorkaur/collabsphere-frontend:latest
```

### Step 4: Restart Frontend Pods in Kubernetes

```bash
# SSH to K8s server
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@<K8S_IP>

# Restart frontend deployment
sudo kubectl rollout restart deployment/frontend -n collabsphere

# Wait for pods to be ready
sudo kubectl wait --for=condition=ready pod -l app=frontend -n collabsphere --timeout=120s

# Check status
sudo kubectl get pods -n collabsphere
```

---

## 🎯 Quick Fix (All Commands)

```bash
# Step 1: Update .env file
cd client
echo "REACT_APP_API_URL=http://13.206.129.127:30500" > .env

# Step 2: Rebuild and push
cd ..
docker build -t sarvnoorkaur/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client
docker login
docker push sarvnoorkaur/collabsphere-frontend:latest

# Step 3: Restart in Kubernetes
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@<K8S_IP>
sudo kubectl rollout restart deployment/frontend -n collabsphere
sudo kubectl get pods -n collabsphere -w
```

---

## 🔍 Why This Happened

### The Problem:
1. Your frontend Docker image was built with `REACT_APP_API_URL=http://localhost:5001`
2. When React builds, it **bakes in** environment variables
3. The built files have `localhost:5001` hardcoded
4. Even though it's running in Kubernetes, the browser tries to connect to localhost

### The Solution:
1. Update `.env` to point to Kubernetes backend
2. Rebuild Docker image (this bakes in the new URL)
3. Push new image to Docker Hub
4. Restart pods to pull new image

---

## 📋 Alternative: Use Environment Variables in Kubernetes

Instead of hardcoding in .env, you can pass it via Kubernetes:

### Update deployment.yaml:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: collabsphere
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: sarvnoorkaur/collabsphere-frontend:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_API_URL
          value: "http://13.206.129.127:30500"  # Add this
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

**But this won't work for React!** React bakes environment variables at **build time**, not runtime.

---

## 🎯 Best Practice: Use Relative URLs

### Option 1: Use Same Domain (Recommended for Production)

If frontend and backend are on same domain:

```javascript
// client/src/config/apiRoutes.js
export const API = {
  BASE: process.env.REACT_APP_API_URL || "/api",  // Relative URL
  // ...
};
```

Then use Nginx reverse proxy to route `/api` to backend.

### Option 2: Use Window Location (Dynamic)

```javascript
// client/src/config/apiRoutes.js
const getApiUrl = () => {
  // In production, use same host but different port
  if (process.env.NODE_ENV === 'production') {
    const host = window.location.hostname;
    return `http://${host}:30500`;
  }
  // In development, use localhost
  return 'http://localhost:5001';
};

export const API = {
  BASE: process.env.REACT_APP_API_URL || getApiUrl(),
  // ...
};
```

---

## 🚀 Immediate Fix for Your Presentation

### Quick Steps:

1. **Update .env:**
```bash
cd client
# Replace with your actual K8s IP
echo "REACT_APP_API_URL=http://13.206.129.127:30500" > .env
```

2. **Commit and push to GitHub:**
```bash
cd ..
git add client/.env
git commit -m "Update API URL for Kubernetes deployment"
git push origin main
```

3. **Run Jenkins pipeline:**
- Go to Jenkins: http://<JENKINS_IP>:8080
- Click on your pipeline
- Click "Build Now"
- Wait for pipeline to complete (3-5 minutes)

4. **Test:**
```
Open: http://13.206.129.127:30300
Try to login
```

---

## 🔍 Verify Backend is Accessible

Before fixing frontend, make sure backend is working:

```bash
# Test backend health
curl http://13.206.129.127:30500/api/health

# Should return: {"status":"ok"}
```

If backend is not accessible:
```bash
# SSH to K8s
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@<K8S_IP>

# Check backend pods
sudo kubectl get pods -n collabsphere -l app=backend

# Check backend logs
sudo kubectl logs -l app=backend -n collabsphere --tail=50

# Restart backend if needed
sudo kubectl rollout restart deployment/backend -n collabsphere
```

---

## 📊 Check Current Configuration

### See what URL frontend is using:

```bash
# SSH to K8s server
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@<K8S_IP>

# Get frontend pod name
POD=$(sudo kubectl get pods -n collabsphere -l app=frontend -o jsonpath='{.items[0].metadata.name}')

# Check environment variables
sudo kubectl exec -n collabsphere $POD -- env | grep REACT_APP

# Check built files (they have the URL baked in)
sudo kubectl exec -n collabsphere $POD -- cat /usr/share/nginx/html/static/js/main.*.js | grep -o 'http://[^"]*' | head -5
```

---

## ⚠️ Important Notes

### React Environment Variables:
- ✅ Must start with `REACT_APP_`
- ✅ Baked in at **build time** (not runtime)
- ✅ Changing .env requires rebuild
- ❌ Can't be changed after build

### Docker Build:
- Frontend Dockerfile copies .env file
- `npm run build` reads .env and bakes values into JS files
- Final image has hardcoded URLs

### Kubernetes:
- Pulling new image requires `imagePullPolicy: Always`
- Or change image tag (e.g., `:v1.0.1` instead of `:latest`)
- Restart deployment to pull new image

---

## 🎯 Summary

**Problem:** Frontend has `localhost:5001` hardcoded

**Solution:**
1. Update `client/.env` to `http://<K8S_IP>:30500`
2. Rebuild Docker image
3. Push to Docker Hub
4. Restart Kubernetes pods

**Time:** 5-10 minutes

**Alternative:** Run Jenkins pipeline (it will do all steps automatically)

