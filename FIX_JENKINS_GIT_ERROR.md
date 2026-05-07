# Fix Jenkins Git Error

## Error You're Seeing
```
fatal: not in a git directory
hudson.plugins.git.GitException: Command "git config remote.origin.url https://github.com/Sarvnoor-kaur/Collab" returned status code 128
```

## Root Cause
Jenkins is configured to use "Pipeline script from SCM" which tries to fetch the Jenkinsfile from Git before the workspace is initialized. This creates a chicken-and-egg problem.

## Solution: Change to Inline Pipeline Script

### Step-by-Step Fix:

1. **Go to Jenkins Dashboard**
   - URL: `http://13.233.75.163:8080`

2. **Click on your pipeline job**
   - Example: `collabsphere-pipeline`

3. **Click "Configure"** (left sidebar)

4. **Scroll down to "Pipeline" section**

5. **Change the Definition:**
   
   **FROM:**
   ```
   Definition: Pipeline script from SCM
   SCM: Git
   Repository URL: https://github.com/Sarvnoor-kaur/Collab
   Script Path: jenkins/Jenkinsfile
   ```
   
   **TO:**
   ```
   Definition: Pipeline script
   ```

6. **Copy the script:**
   - Open file: `JENKINS_PIPELINE_SCRIPT.txt`
   - Copy ALL the content (Ctrl+A, Ctrl+C)

7. **Paste in Jenkins:**
   - Paste into the "Script" text box in Jenkins

8. **Click "Save"** at the bottom

9. **Click "Build Now"**

## Alternative: Fix SCM Configuration (Advanced)

If you prefer to keep using SCM:

1. **Install Git Plugin** (if not already):
   - Manage Jenkins → Manage Plugins → Available
   - Search "Git plugin"
   - Install and restart

2. **Configure Git in Jenkins:**
   - Manage Jenkins → Global Tool Configuration
   - Git → Add Git
   - Name: `Default`
   - Path to Git executable: `/usr/bin/git`
   - Save

3. **Update Pipeline Configuration:**
   - Change Repository URL to: `https://github.com/Sarvnoor-kaur/Collab.git` (add .git)
   - Branch: `*/main`
   - Script Path: `jenkins/Jenkinsfile`

4. **Try building again**

## Recommended Approach

**Use "Pipeline script" (inline)** for now because:
- ✅ Simpler setup
- ✅ No Git configuration needed
- ✅ Works immediately
- ✅ Easy to debug

You can switch to SCM later once everything is working.

## After Fixing

1. Click "Build Now"
2. Watch the Console Output
3. Pipeline should now:
   - Clone repository ✅
   - Build Docker images ✅
   - Push to Docker Hub ✅
   - Deploy to Kubernetes ✅

## Next Potential Issues

After fixing this, you might encounter:

### 1. Docker Hub Credentials Error
**Fix:** Make sure you added Docker Hub credentials with ID: `dockerhub-credentials`

### 2. Minikube Not Running
**Fix:** SSH into EC2 and run:
```bash
minikube start --driver=docker --cpus=2 --memory=4096
```

### 3. Kubectl Not Configured
**Fix:** SSH into EC2 and run:
```bash
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

## Files Created

- `JENKINS_PIPELINE_SCRIPT.txt` - Copy this into Jenkins
- `FIX_JENKINS_GIT_ERROR.md` - This guide

## Summary

**Problem:** Jenkins can't access Git before workspace is initialized
**Solution:** Use inline "Pipeline script" instead of "Pipeline script from SCM"
**Time:** 2 minutes
**Steps:** Configure → Change Definition → Paste Script → Save → Build
