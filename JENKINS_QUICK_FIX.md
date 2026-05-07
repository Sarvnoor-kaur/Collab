# 🚀 Jenkins Quick Fix - 2 Minutes

## The Error
```
fatal: not in a git directory
```

## The Fix (Super Simple)

### 1. Open Jenkins
```
http://13.233.75.163:8080
```

### 2. Click Your Pipeline Job
Click on `collabsphere-pipeline` (or whatever you named it)

### 3. Click "Configure"
Left sidebar → Configure

### 4. Scroll to "Pipeline" Section
Scroll down until you see "Pipeline" section

### 5. Change Definition
**Change this dropdown:**
```
FROM: Pipeline script from SCM
TO:   Pipeline script
```

### 6. Copy the Script
Open `JENKINS_PIPELINE_SCRIPT.txt` and copy everything (Ctrl+A, Ctrl+C)

### 7. Paste in Jenkins
Paste into the big text box that appears

### 8. Save
Click "Save" button at bottom

### 9. Build
Click "Build Now"

## Done! ✅

Your pipeline should now work.

## What Changed?

**Before:** Jenkins tried to fetch Jenkinsfile from Git (failed)
**After:** Jenkins uses the script directly (works)

## Watch the Build

Click on the build number (e.g., #2) → Console Output

You should see:
```
📥 Cloning repository...
🔨 Building Docker images...
📤 Pushing images to Docker Hub...
📦 Loading images to Minikube...
☸️ Deploying to Kubernetes...
✅ Verifying deployment...
```

## If Build Fails

### Error: "dockerhub-credentials not found"
**Fix:** Add Docker Hub credentials in Jenkins
- Manage Jenkins → Manage Credentials → Add Credentials
- ID: `dockerhub-credentials`
- Username: Your Docker Hub username
- Password: Your Docker Hub password

### Error: "minikube: command not found"
**Fix:** Start Minikube on EC2
```bash
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@13.233.75.163
minikube start --driver=docker --cpus=2 --memory=4096
```

### Error: "kubectl: command not found"
**Fix:** Configure kubectl for Jenkins
```bash
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

## Summary

1. Jenkins → Configure
2. Change to "Pipeline script"
3. Paste script from `JENKINS_PIPELINE_SCRIPT.txt`
4. Save
5. Build Now

That's it!
