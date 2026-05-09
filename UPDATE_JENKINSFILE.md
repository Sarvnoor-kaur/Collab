# 🔧 Update Jenkinsfile with K8s IP

## Step 1: Get K8s Private IP

```powershell
cd terraform
terraform output k8s_private_ip
```

**Example Output:**
```
172.31.44.103
```

Copy this IP! ✅

## Step 2: Update Jenkinsfile

Open `jenkins/Jenkinsfile` and find this line:

```groovy
K8S_SERVER = "REPLACE_WITH_PRIVATE_IP"
```

Replace with your actual private IP:

```groovy
K8S_SERVER = "172.31.44.103"  // Your private IP here
```

## Complete Example

```groovy
environment {
    DOCKER_HUB_REPO = "sarvnoorkaur"
    BACKEND_IMAGE = "collabsphere-backend"
    FRONTEND_IMAGE = "collabsphere-frontend"
    K8S_SERVER = "172.31.44.103"  // ← Your K8s private IP
}
```

## ⚠️ Important

**Use PRIVATE IP, not PUBLIC IP!**

❌ Wrong:
```groovy
K8S_SERVER = "3.108.195.150"  // Public IP - DON'T USE
```

✅ Correct:
```groovy
K8S_SERVER = "172.31.44.103"  // Private IP - USE THIS
```

## Why Private IP?

- 🚀 Faster (same AWS network)
- 💰 Free (no data transfer charges)
- 🔒 More secure (internal network)

## After Update

1. Save `jenkins/Jenkinsfile`
2. Commit to Git:
   ```bash
   git add jenkins/Jenkinsfile
   git commit -m "Update K8s server IP"
   git push
   ```
3. Run pipeline in Jenkins
4. Done! ✅

## Verification

Pipeline should show:
```
Connecting to ubuntu@172.31.44.103
Connection successful
```

If you see public IP (3.108.195.150), update it to private IP!
