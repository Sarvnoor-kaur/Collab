# EC2 Setup Troubleshooting Guide

## 🔍 How to Check if Setup Completed Successfully

### Method 1: Run the Verification Script

```bash
# SSH to your EC2 instance
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Download and run the check script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/collabsphere/main/terraform/check-setup.sh
chmod +x check-setup.sh
./check-setup.sh
```

### Method 2: Check Manually

```bash
# 1. Check if setup completed
cat /tmp/setup-complete.txt
# Should show: SETUP_COMPLETE

# 2. View the full setup log
sudo cat /var/log/user-data.log

# 3. Check cloud-init status
cloud-init status

# 4. Check individual services
sudo systemctl status docker
sudo systemctl status jenkins
docker --version
java -version
kubectl version --client
minikube version
```

## 🚨 Common Issues and Solutions

### Issue 1: Setup Script Still Running

**Symptoms:**
- `/tmp/setup-complete.txt` doesn't exist
- Services not installed yet

**Solution:**
```bash
# Check if cloud-init is still running
cloud-init status

# View real-time log
sudo tail -f /var/log/user-data.log

# Wait 5-10 minutes for completion
```

### Issue 2: APT Lock Error

**Symptoms:**
- Log shows: "Waiting for cache lock"
- Installations hanging

**Solution:**
```bash
# Check for lock processes
sudo lsof /var/lib/dpkg/lock-frontend

# Wait for automatic unlock (script handles this)
# Or manually kill if stuck:
sudo killall apt apt-get
sudo rm /var/lib/dpkg/lock-frontend
sudo dpkg --configure -a
```

### Issue 3: Jenkins Not Starting

**Symptoms:**
- Jenkins service inactive
- Can't access port 8080

**Solution:**
```bash
# Check Jenkins status
sudo systemctl status jenkins

# View Jenkins logs
sudo journalctl -u jenkins -n 50

# Restart Jenkins
sudo systemctl restart jenkins

# Check if port is open
sudo netstat -tuln | grep 8080

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### Issue 4: Docker Permission Denied

**Symptoms:**
- "permission denied while trying to connect to Docker daemon"

**Solution:**
```bash
# Add users to docker group (already done in script)
sudo usermod -aG docker ubuntu
sudo usermod -aG docker jenkins

# Restart services
sudo systemctl restart docker
sudo systemctl restart jenkins

# Re-login for group changes to take effect
exit
# SSH back in
```

### Issue 5: Minikube Not Starting

**Symptoms:**
- Minikube status shows "Stopped" or errors

**Solution:**
```bash
# Check Minikube status
su - ubuntu -c "minikube status"

# Delete and restart Minikube
su - ubuntu -c "minikube delete"
su - ubuntu -c "minikube start --driver=docker --cpus=2 --memory=4096"

# Check Docker is running first
sudo systemctl status docker

# Verify ubuntu user is in docker group
groups ubuntu | grep docker
```

### Issue 6: kubectl Not Configured for Jenkins

**Symptoms:**
- Jenkins pipeline fails at kubectl commands

**Solution:**
```bash
# Copy kubectl config to Jenkins
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp /home/ubuntu/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube

# Restart Jenkins
sudo systemctl restart jenkins

# Test as jenkins user
sudo -u jenkins kubectl get nodes
```

### Issue 7: Out of Memory / Instance Too Small

**Symptoms:**
- Services crashing
- Slow performance
- OOM errors in logs

**Solution:**
```bash
# Check memory usage
free -h
top

# If using t2.micro, upgrade to t2.medium or t2.large
# Update terraform/terraform.tfvars:
instance_type = "t2.medium"  # or "t2.large"

# Then:
terraform apply
```

## 📋 Complete Verification Checklist

Run these commands to verify everything:

```bash
# 1. Check setup completion
[ -f /tmp/setup-complete.txt ] && echo "✓ Setup complete" || echo "✗ Setup incomplete"

# 2. Check Docker
docker --version && echo "✓ Docker installed" || echo "✗ Docker missing"
sudo systemctl is-active docker && echo "✓ Docker running" || echo "✗ Docker not running"

# 3. Check Java
java -version && echo "✓ Java installed" || echo "✗ Java missing"

# 4. Check Jenkins
sudo systemctl is-active jenkins && echo "✓ Jenkins running" || echo "✗ Jenkins not running"

# 5. Check kubectl
kubectl version --client && echo "✓ kubectl installed" || echo "✗ kubectl missing"

# 6. Check Minikube
minikube version && echo "✓ Minikube installed" || echo "✗ Minikube missing"
su - ubuntu -c "minikube status"

# 7. Check user groups
groups ubuntu | grep docker && echo "✓ ubuntu in docker group" || echo "✗ ubuntu not in docker group"
groups jenkins | grep docker && echo "✓ jenkins in docker group" || echo "✗ jenkins not in docker group"

# 8. Check ports
sudo netstat -tuln | grep -E ':(8080|30300|30500)'
```

## 🔧 Manual Installation (If Automated Setup Fails)

If the user_data script fails completely, install manually:

### 1. Install Docker
```bash
sudo apt-get update -y
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu
```

### 2. Install Java
```bash
sudo apt-get install -y openjdk-11-jdk
java -version
```

### 3. Install Jenkins
```bash
# Add Jenkins GPG key
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | \
  sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null

# Add Jenkins repository
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | \
  sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null

# Install Jenkins
sudo apt-get update -y
sudo apt-get install -y jenkins

# Add jenkins to docker group
sudo usermod -aG docker jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

### 4. Install kubectl
```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl
kubectl version --client
```

### 5. Install Minikube
```bash
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64
minikube version
```

### 6. Start Minikube
```bash
# As ubuntu user
minikube start --driver=docker --cpus=2 --memory=4096
minikube addons enable ingress
minikube status
```

### 7. Configure kubectl for Jenkins
```bash
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
```

## 📊 Monitoring Setup Progress

### Real-time Log Monitoring
```bash
# Watch user-data log in real-time
sudo tail -f /var/log/user-data.log

# Watch cloud-init log
sudo tail -f /var/log/cloud-init-output.log

# Watch system log
sudo tail -f /var/log/syslog
```

### Check Specific Installation Steps
```bash
# Check if Docker installed
grep "Docker installed successfully" /var/log/user-data.log

# Check if Jenkins installed
grep "Jenkins installed successfully" /var/log/user-data.log

# Check if Minikube started
grep "Minikube started successfully" /var/log/user-data.log

# Check for any errors
grep -i "error\|failed\|fatal" /var/log/user-data.log
```

## 🆘 Getting Help

If you're still stuck:

1. **Collect logs:**
   ```bash
   sudo cat /var/log/user-data.log > setup-log.txt
   sudo cat /var/log/cloud-init-output.log > cloud-init-log.txt
   ```

2. **Check system resources:**
   ```bash
   free -h
   df -h
   top -bn1 | head -20
   ```

3. **Provide information:**
   - EC2 instance type
   - Region
   - Error messages from logs
   - Output of verification script

## 💡 Pro Tips

1. **Always check logs first:**
   ```bash
   sudo cat /var/log/user-data.log
   ```

2. **Wait patiently:**
   - First boot can take 5-10 minutes
   - Don't interrupt the process

3. **Use the right instance type:**
   - Minimum: t2.medium (2 vCPU, 4GB RAM)
   - Recommended: t2.large (2 vCPU, 8GB RAM)

4. **Reboot if needed:**
   ```bash
   sudo reboot
   ```
   Then wait 2-3 minutes and SSH back in.

5. **Check security groups:**
   - Ensure ports 8080, 30300, 30500 are open
   - Verify in AWS Console → EC2 → Security Groups
