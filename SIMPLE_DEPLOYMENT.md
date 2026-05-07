# 🚀 CollabSphere - Simple Deployment Guide

## Overview

Deploy CollabSphere to AWS EC2 with **one command** using our automated PowerShell script.

---

## Prerequisites

### 1. Install Terraform

Download from: https://www.terraform.io/downloads

Verify:
```powershell
terraform --version
```

### 2. AWS Setup

- AWS account
- AWS access key and secret key
- EC2 key pair created and downloaded (.pem file)

### 3. Configure AWS Credentials

Edit `terraform/terraform.tfvars`:

```hcl
aws_access_key = "YOUR_ACCESS_KEY"
aws_secret_key = "YOUR_SECRET_KEY"
aws_region = "us-east-1"
key_name = "collabsphere-key"  # Your EC2 key pair name
```

---

## 🎯 Automated Deployment

### One Command Setup

```powershell
.\setup.ps1
```

**Optional:** Specify custom PEM file location:
```powershell
.\setup.ps1 -PemFile "C:\path\to\your\key.pem"
```

### What It Does

1. ✅ Creates EC2 instance using Terraform
2. ✅ Waits for EC2 to boot
3. ✅ Installs Docker via SSH
4. ✅ Installs Java via SSH
5. ✅ Installs Jenkins via SSH
6. ✅ Installs kubectl via SSH
7. ✅ Installs Minikube via SSH
8. ✅ Starts Minikube
9. ✅ Configures kubectl for Jenkins
10. ✅ Displays access information

**Total Time:** 10-15 minutes

---

## ✅ After Setup Completes

### 1. Access Jenkins

The script will display:
```
Jenkins URL: http://YOUR_EC2_IP:8080
```

### 2. Get Jenkins Password

Run the command shown by the script:
```powershell
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@YOUR_EC2_IP 'sudo cat /var/lib/jenkins/secrets/initialAdminPassword'
```

### 3. Configure Jenkins

1. Open Jenkins URL in browser
2. Enter the initial password
3. Click "Install suggested plugins"
4. Create admin user
5. Click "Save and Continue"

### 4. Add Docker Hub Credentials

1. Go to: **Manage Jenkins** → **Credentials**
2. Click **(global)**
3. Click **Add Credentials**
4. Fill in:
   - Kind: **Username with password**
   - Username: Your Docker Hub username
   - Password: Your Docker Hub password
   - ID: **dockerhub-credentials** (must be exact!)
5. Click **Create**

### 5. Create Jenkins Pipeline

1. Click **New Item**
2. Name: **collabsphere-pipeline**
3. Type: **Pipeline**
4. Click **OK**
5. Scroll to **Pipeline** section:
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: Your GitHub repo URL
   - Branch: ***/main**
   - Script Path: **jenkins/Jenkinsfile**
6. Click **Save**

### 6. Deploy Application

1. Click **Build Now**
2. Wait for pipeline to complete (~8-10 minutes)
3. Check deployment:
   ```bash
   ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@YOUR_EC2_IP
   kubectl get pods
   kubectl get svc
   minikube ip
   ```
4. Access application:
   - Frontend: `http://MINIKUBE_IP:30300`
   - Backend: `http://MINIKUBE_IP:30500`

---

## 🔧 Manual Steps (If Automated Script Fails)

### Step 1: Create EC2

```powershell
cd terraform
terraform init
terraform apply -auto-approve
terraform output instance_public_ip
```

### Step 2: SSH to EC2

```powershell
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@YOUR_EC2_IP
```

### Step 3: Install Everything

```bash
# Wait for apt locks
while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do sleep 5; done

# Update system
sudo apt-get update -y

# Install Docker
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Java
sudo apt-get install -y openjdk-11-jdk

# Install Jenkins
curl -fsSL https://pkg.jenkins.io/debian-stable/jenkins.io-2023.key | sudo tee /usr/share/keyrings/jenkins-keyring.asc > /dev/null
echo "deb [signed-by=/usr/share/keyrings/jenkins-keyring.asc] https://pkg.jenkins.io/debian-stable binary/" | sudo tee /etc/apt/sources.list.d/jenkins.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y jenkins
sudo usermod -aG docker jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64

# Logout and login again
exit
```

### Step 4: Start Minikube

```bash
# SSH back in
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@YOUR_EC2_IP

# Start Minikube
minikube start --driver=docker --cpus=2 --memory=4096
minikube addons enable ingress

# Configure kubectl for Jenkins
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
```

---

## 🐛 Troubleshooting

### Script Hangs or Fails

**Solution:** Run manual steps above

### Can't Connect to EC2

**Check:**
1. Security group allows port 22 (SSH)
2. PEM file path is correct
3. EC2 is running (check AWS console)

### Jenkins Not Accessible

**Check:**
```bash
ssh -i "C:\Users\sarvn\Downloads\collabsphere-key.pem" ubuntu@YOUR_EC2_IP
sudo systemctl status jenkins
```

**Restart:**
```bash
sudo systemctl restart jenkins
```

### Minikube Not Starting

**Solution:**
```bash
minikube delete
minikube start --driver=docker --cpus=2 --memory=4096
```

---

## 🧹 Cleanup

When done testing:

```powershell
cd terraform
terraform destroy -auto-approve
```

This deletes all AWS resources to avoid charges.

---

## 📊 Architecture

```
GitHub → Jenkins (EC2) → Docker Build → Docker Hub → Minikube → Kubernetes
                                                                      ↓
                                                    Frontend (NodePort 30300)
                                                    Backend (NodePort 30500)
                                                    MongoDB (ClusterIP)
```

---

## 🎯 Summary

**To deploy:**
1. Configure `terraform/terraform.tfvars`
2. Run `.\setup.ps1`
3. Wait 10-15 minutes
4. Configure Jenkins
5. Deploy application

**That's it!** 🚀
