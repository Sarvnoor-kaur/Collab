# EC2 Setup Fixes Applied

## 🎯 Problems Fixed

### ❌ Problem 1: `set -e` Causing Script to Stop on Any Error
**Before:** Script would stop completely if any single command failed
**After:** Removed `set -e`, added proper error handling for each step

### ❌ Problem 2: APT Lock Issues
**Before:** Script would hang waiting for apt locks
**After:** Added `wait_for_apt()` function that:
- Checks for multiple lock files
- Waits with retry logic
- Continues when locks are released

### ❌ Problem 3: Deprecated `apt-key` Command
**Before:** Using `apt-key add` which fails on Ubuntu 22.04
**After:** Using modern GPG key method:
```bash
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | \
  tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
```

### ❌ Problem 4: No Logging or Debugging
**Before:** No way to see what went wrong
**After:** 
- All output logged to `/var/log/user-data.log`
- Detailed step-by-step progress messages
- Error checking and reporting

### ❌ Problem 5: Race Conditions with cloud-init
**Before:** Script could run before cloud-init finished
**After:** Added `cloud-init status --wait` to ensure proper sequencing

### ❌ Problem 6: No Completion Marker
**Before:** No way to know if setup finished
**After:** Creates `/tmp/setup-complete.txt` when done

### ❌ Problem 7: Missing Kubernetes NodePort Security Rules
**Before:** Ports 30300 and 30500 not accessible
**After:** Added security group rules for NodePort services

## ✅ Improvements Made

### 1. Robust Error Handling
```bash
# Retry logic for apt operations
for i in {1..3}; do
  wait_for_apt
  if apt-get update -y; then
    break
  else
    sleep 10
  fi
done
```

### 2. Non-Interactive Mode
```bash
DEBIAN_FRONTEND=noninteractive apt-get install -y ...
```
Prevents prompts that could hang the script

### 3. Detailed Logging
```bash
exec > >(tee /var/log/user-data.log)
exec 2>&1
```
All output (stdout and stderr) saved to log file

### 4. Step-by-Step Progress
Each major step clearly marked:
```
==========================================
Step 1: Updating system packages
==========================================
```

### 5. Version Verification
After each installation, verify it worked:
```bash
docker --version
java -version
kubectl version --client
```

### 6. Graceful Degradation
If optional steps fail, script continues:
```bash
su - ubuntu -c "minikube addons enable ingress" || true
```

### 7. Summary Report
At the end, prints complete summary of what was installed

## 📋 New Files Created

### 1. `check-setup.sh`
Verification script to check if everything installed correctly
- Checks all services
- Verifies versions
- Shows errors if any
- Provides troubleshooting hints

### 2. `TROUBLESHOOTING.md`
Complete troubleshooting guide with:
- Common issues and solutions
- Manual installation steps
- Verification commands
- Log checking methods

### 3. `SETUP_FIXES.md` (this file)
Documents all the fixes applied

## 🔧 Updated Files

### `terraform/ec2.tf`
- Completely rewrote `user_data` script
- Added apt lock handling
- Fixed Jenkins installation method
- Added detailed logging
- Added error handling
- Added Kubernetes NodePort security rules

## 🚀 How to Use

### 1. Apply Terraform Changes
```bash
cd terraform
terraform init
terraform apply
```

### 2. Wait for Setup (5-10 minutes)
The script will:
- Update system
- Install Docker
- Install Java
- Install Jenkins (with new method)
- Install kubectl
- Install Minikube
- Start Minikube
- Configure everything

### 3. Verify Setup
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check if setup completed
cat /tmp/setup-complete.txt

# View full log
sudo cat /var/log/user-data.log

# Run verification script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/collabsphere/main/terraform/check-setup.sh
chmod +x check-setup.sh
./check-setup.sh
```

### 4. Access Services
- **Jenkins:** http://YOUR_EC2_IP:8080
- **Frontend (K8s):** http://MINIKUBE_IP:30300
- **Backend (K8s):** http://MINIKUBE_IP:30500

## 📊 What Changed in user_data

### Before (Problematic):
```bash
#!/bin/bash
set -e  # ❌ Stops on any error

apt-get update -y  # ❌ No lock handling
apt-get install -y ...  # ❌ Could hang

# ❌ Deprecated method
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | apt-key add -

# ❌ No logging
# ❌ No error checking
# ❌ No completion marker
```

### After (Fixed):
```bash
#!/bin/bash
# ✅ Detailed logging
exec > >(tee /var/log/user-data.log)
exec 2>&1

# ✅ Wait for apt locks
wait_for_apt() {
  while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    sleep 5
  done
}

# ✅ Wait for cloud-init
cloud-init status --wait

# ✅ Retry logic
for i in {1..3}; do
  wait_for_apt
  if apt-get update -y; then
    break
  fi
done

# ✅ Modern Jenkins installation
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | \
  tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null

# ✅ Non-interactive mode
DEBIAN_FRONTEND=noninteractive apt-get install -y ...

# ✅ Completion marker
echo "SETUP_COMPLETE" > /tmp/setup-complete.txt
```

## 🎓 Key Learnings

1. **Never use `set -e` in user_data scripts**
   - One failure shouldn't stop everything
   - Handle errors per-step instead

2. **Always handle apt locks**
   - cloud-init and user_data can conflict
   - Wait for locks to be released

3. **Use modern package management**
   - `apt-key` is deprecated
   - Use `/usr/share/keyrings/` method

4. **Log everything**
   - Essential for debugging
   - Save to `/var/log/user-data.log`

5. **Add completion markers**
   - Know when script finished
   - Distinguish "running" from "failed"

6. **Use non-interactive mode**
   - Prevent prompts that hang scripts
   - `DEBIAN_FRONTEND=noninteractive`

7. **Verify each step**
   - Check versions after install
   - Confirm services are running

## 🔍 Debugging Commands

If something goes wrong:

```bash
# 1. Check if setup completed
cat /tmp/setup-complete.txt

# 2. View full setup log
sudo cat /var/log/user-data.log

# 3. Check for errors
sudo grep -i "error\|failed\|fatal" /var/log/user-data.log

# 4. Check cloud-init status
cloud-init status

# 5. Check services
sudo systemctl status docker
sudo systemctl status jenkins

# 6. Check Minikube
su - ubuntu -c "minikube status"

# 7. Run verification script
./check-setup.sh
```

## ✅ Success Indicators

Setup is successful when:
- ✅ `/tmp/setup-complete.txt` exists
- ✅ No errors in `/var/log/user-data.log`
- ✅ Docker is running: `docker --version`
- ✅ Jenkins is running: `sudo systemctl status jenkins`
- ✅ Minikube is running: `minikube status`
- ✅ Can access Jenkins at http://EC2_IP:8080

## 🎯 Next Steps

After successful setup:
1. Access Jenkins and complete initial setup
2. Add Docker Hub credentials
3. Create Jenkins pipeline
4. Deploy application to Kubernetes
5. Verify at http://MINIKUBE_IP:30300

See `DEPLOYMENT_GUIDE.md` for complete deployment instructions.
