# 🚀 CollabSphere - Complete Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Project Overview](#2-project-overview)
3. [Local Code Adjustments](#3-local-code-adjustments)
4. [Provision Infrastructure](#4-provision-infrastructure-using-terraform)
5. [Access EC2 Instance](#5-accessing-the-ec2-instance)
6. [Configure Jenkins](#6-configuring-jenkins)
7. [Setup Jenkins Credentials](#7-setting-up-jenkins-credentials)
8. [Create Jenkins Pipeline](#8-creating-the-jenkins-pipeline)
9. [Configure GitHub Webhook](#9-configuring-github-webhook)
10. [Run CI/CD Pipeline](#10-running-the-cicd-pipeline)
11. [Verify Deployment](#11-verifying-the-deployment)
12. [Setup Monitoring](#12-setting-up-monitoring)
13. [Troubleshooting](#13-troubleshooting)
14. [Cleanup](#14-cleanup)

---

## 1. Prerequisites

Before starting, ensure you have:

### Required Accounts
- ✅ **AWS Account** (Free tier eligible)
- ✅ **Docker Hub Account** (Free)
- ✅ **GitHub Account** (Free)

### Required Software on Local Machine
- ✅ **Terraform** (v1.0+)
- ✅ **Git**
- ✅ **SSH Client** (PuTTY for Windows or native SSH)

**Note:** AWS CLI is NOT required! You'll provide credentials directly in Terraform.

### Installation Commands

**Windows:**
```powershell
# Install Chocolatey first (if not installed)
# Then install tools
choco install terraform git

# Verify installations
terraform --version
git --version
```

**Mac/Linux:**
```bash
# Install Terraform
brew install terraform

# Verify installations
terraform --version
git --version
```

---

## 2. Project Overview

### Architecture
```
GitHub → Jenkins → Docker Build → Docker Hub → Load to Minikube → Deploy to Kubernetes
                                                                            ↓
                                                                    Prometheus + Grafana
```

### What Gets Deployed
- **Frontend**: React app on Nginx (NodePort 30300)
- **Backend**: Node.js API (NodePort 30500)
- **MongoDB**: Database (ClusterIP - internal only)
- **Jenkins**: CI/CD (Port 8080)
- **Prometheus**: Metrics (Port 9090)
- **Grafana**: Dashboards (Port 3001)

### Deployment Method
**Kubernetes (Minikube)** - Production-like environment with:
- Auto-scaling capabilities
- Rolling updates
- Service discovery
- Health checks
- Resource management

---

## 3. Local Code Adjustments

Before provisioning anything, update the necessary files with your own details.

### Step 3.1: Update Terraform Variables

1. Open `terraform/ec2.tf`
2. Find line with `key_name` variable
3. Change `"collabsphere-key"` to your actual AWS key pair name

**Example:**
```hcl
variable "key_name" {
  description = "SSH key pair name"
  type        = string
  default     = "your-key-pair-name"  # ← Change this
}
```

### Step 3.2: Update Jenkinsfile

1. Open `jenkins/Jenkinsfile`
2. Find line 6: `DOCKERHUB_USERNAME = 'YOUR_DOCKERHUB_USERNAME'`
3. Change to your actual Docker Hub username
4. Find line 11: `url: 'https://github.com/YOUR_USERNAME/collabsphere.git'`
5. Change to your actual GitHub repository URL

**Example:**
```groovy
environment {
    DOCKERHUB_USERNAME = 'johndoe'  # ← Change this
    BACKEND_IMAGE = "${DOCKERHUB_USERNAME}/collabsphere-backend"
    FRONTEND_IMAGE = "${DOCKERHUB_USERNAME}/collabsphere-frontend"
}

stages {
    stage('Clone Repository') {
        steps {
            git branch: 'main', url: 'https://github.com/johndoe/collabsphere.git'  # ← Change this
        }
    }
}
```

### Step 3.3: Update Kubernetes Deployment

The Jenkinsfile automatically updates the Docker Hub username in `kubernetes/deployment.yaml`, but you can verify it:

1. Open `kubernetes/deployment.yaml`
2. Look for `image: DOCKERHUB_USERNAME/collabsphere-backend:latest`
3. This will be automatically replaced during Jenkins build

**No manual changes needed** - Jenkins handles this automatically!

### Step 3.4: Commit and Push Changes

```bash
git add .
git commit -m "Update configuration with personal details"
git push origin main
```

---

## 4. Provision Infrastructure using Terraform

### Step 4.1: Get AWS Credentials

1. **Login to AWS Console**: https://console.aws.amazon.com/
2. Click on your username (top right) → **Security credentials**
3. Scroll down to **Access keys**
4. Click **Create access key**
5. Select **Use case**: Command Line Interface (CLI)
6. Check the confirmation box
7. Click **Next** → **Create access key**
8. **IMPORTANT**: Copy both:
   - **Access key ID** (e.g., `AKIAIOSFODNN7EXAMPLE`)
   - **Secret access key** (e.g., `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`)
9. Click **Done**

⚠️ **Save these credentials securely! You won't be able to see the secret key again.**

### Step 4.2: Create EC2 Key Pair

**Option A: Using AWS Console**
1. Go to EC2 Dashboard → Key Pairs
2. Click "Create key pair"
3. Name: `collabsphere-key`
4. Type: RSA
5. Format: `.pem` (for Mac/Linux) or `.ppk` (for Windows/PuTTY)
6. Download and save securely

**Option B: Using AWS CLI**
```bash
aws ec2 create-key-pair \
  --key-name collabsphere-key \
  --query 'KeyMaterial' \
  --output text > collabsphere-key.pem

# Set permissions (Mac/Linux)
chmod 400 collabsphere-key.pem
```

### Step 4.3: Create Terraform Variables File

```bash
# Navigate to terraform directory
cd terraform

# Create terraform.tfvars file
cat > terraform.tfvars << 'EOF'
# AWS Credentials (Replace with your actual credentials)
aws_access_key = "AKIAIOSFODNN7EXAMPLE"
aws_secret_key = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"

# AWS Configuration
aws_region = "us-east-1"

# EC2 Configuration
instance_type = "t2.medium"
key_name      = "collabsphere-key"
EOF
```

**⚠️ IMPORTANT:**
- Replace `AKIAIOSFODNN7EXAMPLE` with your actual AWS Access Key ID
- Replace `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` with your actual AWS Secret Access Key
- Replace `collabsphere-key` with your actual key pair name (from Step 4.2)

**Security Note:**
- Never commit `terraform.tfvars` to Git (it's already in `.gitignore`)
- Keep your credentials secure and private

### Step 4.4: Initialize Terraform

```bash
# Navigate to terraform directory
cd terraform

# Initialize Terraform (downloads AWS provider)
terraform init
```

### Step 4.4: Initialize Terraform

```bash
# Initialize Terraform (downloads AWS provider)
terraform init
```

**Expected Output:**
```
Terraform has been successfully initialized!
```

### Step 4.5: Preview Changes

```bash
# Preview what will be created
terraform plan
```

### Step 4.5: Preview Changes

```bash
# Preview what will be created
terraform plan
```

**Review the output** - You should see:
- 1 EC2 instance
- 1 Security group
- Various ingress/egress rules

### Step 4.6: Apply Infrastructure

```bash
# Create the infrastructure
terraform apply -auto-approve
```

### Step 4.6: Apply Infrastructure

```bash
# Create the infrastructure
terraform apply -auto-approve
```

**Wait for completion** (2-3 minutes)

### Step 4.7: Get EC2 Public IP

```bash
# Get the public IP
terraform output instance_public_ip
```

### Step 4.7: Get EC2 Public IP

```bash
# Get the public IP
terraform output instance_public_ip
```

**Example Output:**
```
instance_public_ip = "3.111.22.33"
```

**📝 IMPORTANT:** Copy this IP address - you'll need it throughout the setup!

**⏰ Note:** It takes about 3-5 minutes for the EC2 instance to fully initialize and install Docker, Jenkins, Minikube, and other tools in the background via user-data script.

---

## 5. Accessing the EC2 Instance

### Step 5.1: Connect via SSH

**Mac/Linux:**
```bash
ssh -i /path/to/collabsphere-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Windows (PowerShell):**
```powershell
ssh -i C:\path\to\collabsphere-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

**Windows (PuTTY):**
1. Open PuTTYgen
2. Load `.pem` file
3. Save as `.ppk` file
4. Open PuTTY
5. Host: `ubuntu@YOUR_EC2_PUBLIC_IP`
6. Connection → SSH → Auth → Browse for `.ppk` file
7. Click "Open"

### Step 5.2: Verify Installations

Once connected, verify everything is installed:

```bash
# Check Docker
docker --version
# Expected: Docker version 20.10.x

# Check Docker Compose
docker-compose --version
# Expected: docker-compose version 1.29.x

# Check Jenkins
sudo systemctl status jenkins
# Expected: active (running)

# Check kubectl
kubectl version --client
# Expected: Client Version: v1.28.x

# Check Minikube
minikube status
# Expected: host: Running, kubelet: Running, apiserver: Running

# Check Git
git --version
# Expected: git version 2.x.x
```

**If Minikube is not running:**
```bash
# Start Minikube
minikube start --driver=docker --cpus=2 --memory=4096

# Verify

minikube status
```

**If any service is not ready**, wait a few more minutes and check again.

---

## 6. Configuring Jenkins

### Step 6.1: Fix Jenkins Java Version (If Needed)

**⚠️ IMPORTANT:** If Jenkins is not starting or you see Java version errors, run this fix:

**From Windows PowerShell:**
```powershell
# Run the fix script
.\fix-jenkins.ps1
```

**Or manually via SSH:**
```bash
# SSH into EC2
ssh -i C:\Users\sarvn\Downloads\collabsphere-key.pem ubuntu@YOUR_EC2_IP

# Run these commands
sudo systemctl stop jenkins
sudo wget -O /opt/jenkins/jenkins.war https://get.jenkins.io/war-stable/2.440.3/jenkins.war
sudo chown jenkins:jenkins /opt/jenkins/jenkins.war
sudo systemctl start jenkins

# Wait 60 seconds
sleep 60

# Check status
sudo systemctl status jenkins
```

**Why this is needed:** The latest Jenkins requires Java 21, but EC2 has Java 11. Version 2.440.3 is the last LTS that supports Java 11.

### Step 6.2: Access Jenkins

1. Open your web browser
2. Navigate to: `http://YOUR_EC2_PUBLIC_IP:8080`

**If page doesn't load:**
- Wait 2-3 more minutes (Jenkins takes time to start)
- Run the fix from Step 6.1
- Check security group allows port 8080
- Verify Jenkins is running: `sudo systemctl status jenkins`

### Step 6.3: Get Initial Admin Password

In your EC2 SSH terminal, run:

```bash
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

**Example Output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

Copy this password.

### Step 6.4: Complete Jenkins Setup Wizard

1. Paste the password in Jenkins UI
2. Click **Continue**
3. Click **Install suggested plugins**
4. Wait for plugins to install (5-10 minutes)
   - **If plugins fail to install:** This is likely due to Jenkins version mismatch. Run the fix from Step 6.1.
5. Create First Admin User:
   - Username: `admin`
   - Password: `YourStrongPassword`
   - Full name: `Admin`
   - Email: `your-email@example.com`
6. Click **Save and Continue**
7. Jenkins URL: Keep default `http://YOUR_EC2_IP:8080/`
8. Click **Save and Finish**
9. Click **Start using Jenkins**

### Step 6.5: Install Additional Plugins

1. Go to **Manage Jenkins** → **Manage Plugins**
2. Click **Available** tab
3. Search and select:
   - ✅ Docker Pipeline
   - ✅ Docker plugin
   - ✅ Kubernetes
   - ✅ Kubernetes CLI
   - ✅ Git plugin (usually pre-installed)
   - ✅ Pipeline plugin (usually pre-installed)
4. Click **Install without restart**
5. Wait for installation to complete

**Note:** If "Pipeline" option is not showing up in Jenkins, it means plugins didn't install properly. This is usually due to Jenkins version mismatch - run the fix from Step 6.1.

### Step 6.6: Configure Docker Permission for Jenkins

In your EC2 SSH terminal:

```bash
# Add jenkins user to docker group
sudo usermod -aG docker jenkins

# Restart Jenkins
sudo systemctl restart jenkins

# Verify
sudo -u jenkins docker ps
```

**Expected:** Docker command should work without errors.

---

## 7. Setting Up Jenkins Credentials

Jenkins needs permission to push your built images to Docker Hub.

### Step 7.1: Create Docker Hub Credentials

1. In Jenkins, go to **Dashboard** → **Manage Jenkins** → **Manage Credentials**
2. Click on **(global)** domain
3. Click **Add Credentials** (left sidebar)
4. Fill in the details:
   - **Kind**: `Username with password`
   - **Scope**: `Global`
   - **Username**: Your Docker Hub username (e.g., `johndoe`)
   - **Password**: Your Docker Hub password
   - **ID**: `dockerhub-credentials` ⚠️ **Must match exactly!**
   - **Description**: `Docker Hub Login`
5. Click **Create**

**⚠️ CRITICAL:** The ID must be exactly `dockerhub-credentials` as this is referenced in the Jenkinsfile.

---

## 8. Creating the Jenkins Pipeline

### Step 8.1: Create New Pipeline Job

1. Go to Jenkins **Dashboard**
2. Click **New Item** (top left)
3. Enter name: `collabsphere-pipeline`
4. Select **Pipeline**
5. Click **OK**

### Step 8.2: Configure Pipeline

**General Section:**
- Description: `CollabSphere CI/CD Pipeline`
- ✅ Check **GitHub project**
- Project url: `https://github.com/YOUR_USERNAME/collabsphere`

**Build Triggers:**
- ✅ Check **GitHub hook trigger for GITScm polling**

**Pipeline Section:**
- **Definition**: `Pipeline script from SCM`
- **SCM**: `Git`
- **Repository URL**: `https://github.com/YOUR_USERNAME/collabsphere.git`
- **Credentials**: Leave as `- none -` (for public repos)
- **Branch Specifier**: `*/main` (or `*/master` if that's your default)
- **Script Path**: `jenkins/Jenkinsfile`

### Step 8.3: Save Configuration

Click **Save** at the bottom.

---

## 9. Configuring GitHub Webhook

This will automatically trigger Jenkins whenever you push code to GitHub.

### Step 9.1: Add Webhook in GitHub

1. Go to your `collabsphere` repository on GitHub
2. Click **Settings** (repository settings, not account)
3. Click **Webhooks** (left sidebar)
4. Click **Add webhook**
5. Fill in details:
   - **Payload URL**: `http://YOUR_EC2_PUBLIC_IP:8080/github-webhook/`
     - ⚠️ **Don't forget the trailing slash `/`**
   - **Content type**: `application/json`
   - **Which events**: `Just the push event`
   - ✅ **Active**: Checked
6. Click **Add webhook**

### Step 9.2: Verify Webhook

After adding, you should see a green checkmark ✅ next to the webhook after a few seconds.

If you see a red X ❌:
- Check that port 8080 is open in EC2 security group
- Verify Jenkins is accessible at `http://YOUR_EC2_IP:8080`
- Check the webhook URL has trailing slash

---

## 10. Running the CI/CD Pipeline

### Step 10.1: Trigger First Build Manually

1. Go to Jenkins Dashboard
2. Click on `collabsphere-pipeline`
3. Click **Build Now** (left sidebar)

### Step 10.2: Monitor Build Progress

1. You'll see a new build appear in **Build History**
2. Click on the build number (e.g., `#1`)
3. Click **Console Output** to see live logs

### Step 10.3: Pipeline Stages

Watch the pipeline progress through these stages:

```
1. Clone Repository         ✅
2. Build Docker Images       ✅
3. Push to Docker Hub        ✅
4. Load Images to Minikube   ✅
5. Deploy to Kubernetes      ✅
6. Verify Deployment         ✅
7. Cleanup                   ✅
```

**Expected Duration:** 5-10 minutes for first build

### Step 10.4: Verify Success

If all stages pass, you'll see:
```
✅ Pipeline completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☸️  CollabSphere deployed to Kubernetes!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Frontend: http://192.168.49.2:30300
🔧 Backend: http://192.168.49.2:30500
```

---

## 11. Verifying the Kubernetes Deployment

### Step 11.1: Check Kubernetes Pods

In your EC2 SSH terminal:

```bash
# Check all pods in collabsphere namespace
kubectl get pods -n collabsphere

# Expected output: All pods should be Running
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-xxx-yyy             1/1     Running   0          2m
# backend-xxx-zzz             1/1     Running   0          2m
# frontend-aaa-bbb            1/1     Running   0          2m
# frontend-aaa-ccc            1/1     Running   0          2m
# mongo-ddd-eee               1/1     Running   0          2m
```

### Step 11.2: Check Kubernetes Services

```bash
# Check services
kubectl get svc -n collabsphere

# Expected output:
# NAME                TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
# mongo-service       ClusterIP   10.96.100.1      <none>        27017/TCP        2m
# backend-service     NodePort    10.96.100.2      <none>        5000:30500/TCP   2m
# frontend-service    NodePort    10.96.100.3      <none>        80:30300/TCP     2m
```

### Step 11.3: Get Minikube IP

```bash
# Get Minikube IP address
minikube ip

# Example output: 192.168.49.2
```

### Step 11.4: Check Pod Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n collabsphere

# Frontend logs
kubectl logs -f deployment/frontend -n collabsphere

# MongoDB logs
kubectl logs -f deployment/mongo -n collabsphere

# Press Ctrl+C to exit logs
```

### Step 11.5: Test Application

**Backend Health Check:**
```bash
# Get Minikube IP and backend port
MINIKUBE_IP=$(minikube ip)
BACKEND_PORT=$(kubectl get svc backend-service -n collabsphere -o jsonpath='{.spec.ports[0].nodePort}')

# Test health endpoint
curl http://${MINIKUBE_IP}:${BACKEND_PORT}/api/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Server is running",
  "uptime": 123.45,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

**Frontend:**
```bash
# Get frontend URL
MINIKUBE_IP=$(minikube ip)
FRONTEND_PORT=$(kubectl get svc frontend-service -n collabsphere -o jsonpath='{.spec.ports[0].nodePort}')

echo "Frontend URL: http://${MINIKUBE_IP}:${FRONTEND_PORT}"
```

### Step 11.6: Access from Local Machine

Since Minikube runs inside EC2, you need to setup port forwarding to access from your local machine:

**Option A: Port Forwarding (Recommended)**
```bash
# On EC2, forward frontend port
kubectl port-forward -n collabsphere svc/frontend-service 3000:80 --address 0.0.0.0 &

# Forward backend port
kubectl port-forward -n collabsphere svc/backend-service 5000:5000 --address 0.0.0.0 &
```

Then access from your local machine:
- Frontend: `http://YOUR_EC2_IP:3000`
- Backend: `http://YOUR_EC2_IP:5000`

**Option B: Direct Access (From EC2)**
```bash
# Test from EC2 terminal
curl http://$(minikube ip):30300  # Frontend
curl http://$(minikube ip):30500/api/health  # Backend
```

### Step 11.7: Test Full Workflow

1. Access frontend: `http://YOUR_EC2_IP:3000` (with port forwarding)
2. Register a new user
3. Login
4. Create a conversation
5. Send messages
6. Verify real-time updates

---

## 12. Setting Up Monitoring

### Step 12.1: Install Prometheus

In your EC2 SSH terminal:

```bash
# Download Prometheus
cd ~
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz

# Extract
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Copy config from repository
cp ~/collabsphere/monitoring/prometheus.yml .

# Start Prometheus in background
nohup ./prometheus --config.file=prometheus.yml > prometheus.log 2>&1 &

# Verify
curl http://localhost:9090
```

**Access Prometheus:**
Open browser: `http://YOUR_EC2_IP:9090`

### Step 12.2: Install Grafana

```bash
# Add Grafana repository
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# Install Grafana
sudo apt-get update
sudo apt-get install -y grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server

# Verify
sudo systemctl status grafana-server
```

**Access Grafana:**
Open browser: `http://YOUR_EC2_IP:3001`

### Step 12.3: Configure Grafana

1. Login with:
   - Username: `admin`
   - Password: `admin`
2. Change password when prompted
3. Click **Add data source**
4. Select **Prometheus**
5. Configure:
   - Name: `Prometheus`
   - URL: `http://localhost:9090`
   - Access: `Server (default)`
6. Click **Save & Test**
7. You should see: ✅ "Data source is working"

### Step 12.4: Import Dashboards

**Node.js Application Metrics:**
1. Click **+** → **Import**
2. Enter Dashboard ID: `11159`
3. Click **Load**
4. Select Prometheus data source
5. Click **Import**

**System Metrics:**
1. Click **+** → **Import**
2. Enter Dashboard ID: `1860`
3. Click **Load**
4. Select Prometheus data source
5. Click **Import**

---

## 13. Troubleshooting

### Issue: Jenkins Docker Permission Denied

**Symptom:** Build fails at "Build Docker Image" stage with permission error.

**Solution:**
```bash
# On EC2
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# Verify
sudo -u jenkins docker ps

# Rebuild in Jenkins
```

### Issue: Terraform Authentication Error

**Symptom:** `terraform apply` fails with authentication error.

**Solution:**
```bash
# Reconfigure AWS CLI
aws configure

# Verify credentials
aws sts get-caller-identity

# Try again
terraform apply
```

### Issue: Webhook Not Triggering

**Symptom:** Pushing to GitHub doesn't trigger Jenkins build.

**Solution:**
1. Check EC2 Security Group allows port 8080 from `0.0.0.0/0`
2. Verify webhook URL has trailing slash: `/github-webhook/`
3. Check webhook delivery in GitHub (Settings → Webhooks → Recent Deliveries)
4. Ensure Jenkins is accessible: `http://YOUR_EC2_IP:8080`

### Issue: Application Not Accessible

**Symptom:** Cannot access frontend/backend from browser.

**Solution:**
```bash
# Check containers are running
docker ps

# Check logs
docker logs collabsphere-backend
docker logs collabsphere-frontend

# Restart containers
docker-compose -f docker/docker-compose.yml restart

# Check security group allows ports 3000, 5000
```

### Issue: MongoDB Connection Failed

**Symptom:** Backend logs show MongoDB connection error.

**Solution:**
```bash
# Check MongoDB container
docker logs collabsphere-mongo

# Restart MongoDB
docker restart collabsphere-mongo

# Check connection string in docker-compose.yml
```

---

## 14. Cleanup

**⚠️ VERY IMPORTANT:** To avoid AWS charges, destroy resources when done testing.

### Step 14.1: Destroy Infrastructure

On your local machine:

```bash
# Navigate to terraform directory
cd terraform

# Destroy all resources
terraform destroy -auto-approve
```

**Wait for completion** (2-3 minutes)

### Step 14.2: Verify in AWS Console

1. Go to AWS EC2 Console
2. Check **Instances** - should show "terminated"
3. Check **Security Groups** - should be deleted
4. Check **Volumes** - should be deleted

### Step 14.3: Delete Docker Hub Images (Optional)

1. Go to Docker Hub
2. Navigate to your repositories
3. Delete `collabsphere-backend` and `collabsphere-frontend` if desired

---

## 🎉 Congratulations!

You've successfully deployed CollabSphere with a complete CI/CD pipeline!

### What You've Accomplished:

✅ Provisioned AWS infrastructure with Terraform
✅ Configured Jenkins CI/CD pipeline
✅ Automated Docker builds and deployments
✅ Set up GitHub webhooks for auto-deployment
✅ Implemented monitoring with Prometheus & Grafana
✅ Deployed a production-ready MERN application

### Next Steps:

1. **Custom Domain**: Point a domain to your EC2 IP
2. **SSL Certificate**: Setup HTTPS with Let's Encrypt
3. **Auto-scaling**: Configure AWS Auto Scaling Group
4. **Database Backup**: Implement automated MongoDB backups
5. **Advanced Monitoring**: Setup alerts and notifications

---

## 📞 Support

If you encounter issues:
- Check the [Troubleshooting](#13-troubleshooting) section
- Review Jenkins console output
- Check Docker logs: `docker logs <container-name>`
- Verify security group settings in AWS

---

**Made with ❤️ for DevOps learning**
