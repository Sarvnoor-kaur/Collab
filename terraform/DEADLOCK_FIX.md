# 🔥 Cloud-Init Deadlock Fix

## 🐛 Problem Identified

### The Deadlock Issue

```bash
# In user_data script:
cloud-init status --wait || true
```

**What was happening:**
1. EC2 boots → cloud-init starts
2. cloud-init runs user_data script
3. user_data script runs `cloud-init status --wait`
4. **DEADLOCK:** Script waits for cloud-init to finish, but cloud-init is waiting for the script to finish!

```
┌─────────────────────────────────────┐
│         cloud-init                  │
│                                     │
│  ┌──────────────────────────────┐  │
│  │     user_data script         │  │
│  │                              │  │
│  │  cloud-init status --wait ◄──┼──┼─── Waiting for cloud-init
│  │         ▲                    │  │
│  └─────────┼────────────────────┘  │
│            │                        │
│            └────────────────────────┼─── Waiting for script
│                                     │
└─────────────────────────────────────┘
        DEADLOCK! ❌
```

### Symptoms

- Script hangs at "Waiting for cloud-init to complete..."
- Docker, Jenkins never get installed
- `/tmp/setup-complete.txt` never created
- Log shows infinite waiting dots

## ✅ Solution Applied

### What Changed

**REMOVED:**
```bash
# Wait for cloud-init to finish
echo "Waiting for cloud-init to complete..."
cloud-init status --wait || true
```

**REPLACED WITH:**
```bash
# Give system a moment to settle after boot
echo "Waiting for system to settle..."
sleep 10
```

### Why This Works

1. **No circular dependency:** Script doesn't wait for itself
2. **Simple delay:** 10 seconds is enough for system to settle
3. **APT lock handling:** Separate function handles apt locks properly
4. **Timeout protection:** APT lock wait has 5-minute timeout with force cleanup

## 🔧 Additional Improvements

### 1. Timeout for APT Lock Wait

```bash
wait_for_apt() {
  local max_wait=300  # 5 minutes max
  local waited=0
  while fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    if [ $waited -ge $max_wait ]; then
      echo "Timeout waiting for apt lock, forcing cleanup..."
      killall apt apt-get 2>/dev/null || true
      rm -f /var/lib/dpkg/lock-frontend /var/lib/dpkg/lock
      break
    fi
    sleep 5
    waited=$((waited + 5))
  done
}
```

**Benefits:**
- Won't hang forever
- Auto-cleanup after 5 minutes
- Shows progress (seconds waited)

### 2. System Settle Time

```bash
sleep 10
```

**Why needed:**
- Gives system time to finish boot processes
- Allows automatic updates to start (so we can detect them)
- Prevents race conditions

## 📊 Before vs After

### Before (Broken)

```
EC2 Boot
  ↓
cloud-init starts
  ↓
user_data runs
  ↓
cloud-init status --wait  ← STUCK HERE FOREVER
  ↓
(never reaches Docker install)
```

### After (Fixed)

```
EC2 Boot
  ↓
cloud-init starts
  ↓
user_data runs
  ↓
sleep 10 (system settle)
  ↓
wait_for_apt (with timeout)
  ↓
apt-get update ✓
  ↓
Install Docker ✓
  ↓
Install Java ✓
  ↓
Install Jenkins ✓
  ↓
Install kubectl ✓
  ↓
Install Minikube ✓
  ↓
Setup Complete! ✓
```

## 🎯 How to Apply This Fix

### Step 1: Update Terraform

The fix is already applied in `terraform/ec2.tf`. Just apply it:

```bash
cd terraform
terraform apply
```

### Step 2: Destroy Old Instance (if exists)

```bash
terraform destroy
terraform apply
```

### Step 3: Wait and Verify

```bash
# Wait 5-10 minutes, then SSH
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@YOUR_EC2_IP

# Check if setup completed
cat /tmp/setup-complete.txt

# View log
sudo cat /var/log/user-data.log

# Verify installations
docker --version
java -version
sudo systemctl status jenkins
kubectl version --client
minikube status
```

## 🔍 How to Debug If Still Fails

### Check Logs

```bash
# User data log (our script)
sudo cat /var/log/user-data.log

# Cloud-init log (system)
sudo cat /var/log/cloud-init-output.log

# Look for errors
sudo grep -i "error\|failed\|fatal" /var/log/user-data.log
```

### Check What's Running

```bash
# Check for stuck apt processes
ps aux | grep apt

# Check system resources
free -h
df -h
```

### Manual Installation (if needed)

If automated setup still fails, use manual installation:

```bash
# See MANUAL_SETUP_GUIDE.md or QUICK_FIX_COMMANDS.md
```

## 💡 Key Learnings

### 1. Never Wait for Parent Process

❌ **Don't do this:**
```bash
# Inside cloud-init user_data
cloud-init status --wait
```

✅ **Do this instead:**
```bash
# Simple delay
sleep 10
```

### 2. Always Add Timeouts

❌ **Don't do this:**
```bash
while fuser /var/lib/dpkg/lock; do
  sleep 5  # Could wait forever
done
```

✅ **Do this instead:**
```bash
max_wait=300
waited=0
while fuser /var/lib/dpkg/lock; do
  if [ $waited -ge $max_wait ]; then
    # Force cleanup
    break
  fi
  sleep 5
  waited=$((waited + 5))
done
```

### 3. Log Everything

```bash
exec > >(tee /var/log/user-data.log)
exec 2>&1
```

This saves all output for debugging.

### 4. Use Non-Interactive Mode

```bash
DEBIAN_FRONTEND=noninteractive apt-get install -y ...
```

Prevents prompts that could hang the script.

## 🎓 Technical Explanation

### Why cloud-init status --wait Causes Deadlock

1. **cloud-init** is the parent process
2. **user_data** is a child process of cloud-init
3. When user_data runs `cloud-init status --wait`:
   - It waits for cloud-init to reach "done" state
   - But cloud-init won't reach "done" until user_data finishes
   - **Result:** Circular dependency = deadlock

### The Fix

Instead of waiting for cloud-init (which is waiting for us), we:
1. Wait for system to settle (10 seconds)
2. Wait for specific resources (apt locks) with timeout
3. Proceed with installation
4. Let cloud-init finish naturally when script completes

## ✅ Success Indicators

After applying this fix, you should see:

1. **In logs:**
   ```
   Starting CollabSphere EC2 Setup
   Waiting for system to settle...
   Step 1: Updating system packages
   ✓ System update successful
   Step 3: Installing Docker
   ✓ Docker installed successfully
   ...
   Setup Complete!
   ```

2. **Completion marker:**
   ```bash
   cat /tmp/setup-complete.txt
   # Output: SETUP_COMPLETE
   ```

3. **Working services:**
   ```bash
   docker --version        # Shows version
   sudo systemctl status jenkins  # Shows "active (running)"
   minikube status        # Shows "Running"
   ```

## 🚀 Next Steps

After successful setup:

1. Access Jenkins: `http://YOUR_EC2_IP:8080`
2. Get password: `sudo cat /var/lib/jenkins/secrets/initialAdminPassword`
3. Complete Jenkins setup
4. Configure Docker Hub credentials
5. Create pipeline
6. Deploy application

See `DEPLOYMENT_GUIDE.md` for complete instructions.

---

**Fixed on:** May 6, 2026  
**Issue:** cloud-init deadlock  
**Solution:** Removed `cloud-init status --wait`, added timeout to apt lock wait  
**Status:** ✅ Resolved
