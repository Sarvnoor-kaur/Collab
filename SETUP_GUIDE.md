# 🚀 CollabSphere - Complete Setup Guide

## 📋 Step-by-Step Setup (From Zero to Production)

### Phase 1: Local Development (15 minutes)

#### Step 1: Prerequisites
```bash
# Check installations
node --version  # Should be 18+
npm --version
git --version
docker --version
docker-compose --version
```

#### Step 2: Clone and Setup
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/collabsphere.git
cd collabsphere

# Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env file with your settings
npm start

# Frontend setup (new terminal)
cd client
npm install
npm start
```

**Test:** Open http://localhost:3000

---

### Phase 2: Docker Setup (10 minutes)

#### Step 1: Build Images
```bash
# From project root
docker build -t collabsphere-backend -f docker/backend.Dockerfile ./backend
docker build -t collabsphere-frontend -f docker/frontend.Dockerfile ./client
```

#### Step 2: Run with Docker Compose
```bash
docker-compose -f docker/docker-compose.yml up -d

# Check logs
docker-compose -f docker/docker-compose.yml logs -f

# Check status
docker-compose -f docker/docker-compose.yml ps
```

**Test:** 
- Frontend: http://localhost:3000
- Backend: http://localhost:5000/api/health

---

### Phase 3: AWS EC2 Setup (30 minutes)

#### Step 1: Create EC2 Instance

**Using AWS Console:**
1. Go to EC2 Dashboard
2. Click "Launch Instance"
3. Choose:
   - Name: `CollabSphere-Server`
   - AMI: `Ubuntu Server 22.04 LTS`
   - Instance type: `t2.micro` (free tier)
   - Key pair: Create new → `collabsphere-key.pem`
4. Network settings:
   - Create security group
   - Add rules for ports: 22, 80, 3000, 5000, 8080, 9090, 3001
5. Storage: 30 GB
6. Launch instance

**Using Terraform:**
```bash
cd terraform

# Initialize
terraform init

# Create terraform.tfvars
cat > terraform.tfvars << EOF
aws_region = "us-east-1"
instance_type = "t2.micro"
key_name = "collabsphere-key"
EOF

# Deploy
terraform apply -auto-approve

# Get IP
terraform output instance_public_ip
```

#### Step 2: Connect to EC2
```bash
# SSH to EC2
ssh -i collabsphere-key.pem ubuntu@YOUR_EC2_IP

# Or using PuTTY on Windows
# Convert .pem to .ppk using PuTTYgen
# Then connect using PuTTY
```

#### Step 3: Install Docker on EC2
```bash
# Update system
sudo apt update
sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
ssh -i collabsphere-key.pem ubuntu@YOUR_EC2_IP

# Verify
docker --version
docker-compose --version
```

#### Step 4: Deploy Application on EC2
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/collabsphere.git
cd collabsphere

# Deploy
docker-compose -f docker/docker-compose.yml up -d

# Check logs
docker-compose -f docker/docker-compose.yml logs -f
```

**Test:**
- Frontend: http://YOUR_EC2_IP:3000
- Backend: http://YOUR_EC2_IP:5000/api/health

---

### Phase 4: Jenkins CI/CD Setup (45 minutes)

#### Step 1: Install Jenkins on EC2
```bash
# Install Java
sudo apt install -y openjdk-11-jdk

# Add Jenkins repository
wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'

# Install Jenkins
sudo apt update
sudo apt install -y jenkins

# Start Jenkins
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Get initial password
sudo cat /var/lib/jenkins/secrets/initialAdminPassword
```

#### Step 2: Configure Jenkins
1. Open browser: `http://YOUR_EC2_IP:8080`
2. Enter initial password
3. Install suggested plugins
4. Create admin user
5. Save and finish

#### Step 3: Install Required Plugins
1. Go to: Manage Jenkins → Manage Plugins
2. Install:
   - Docker Pipeline
   - Git plugin
   - Pipeline plugin

#### Step 4: Add Docker Permission to Jenkins
```bash
# On EC2
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

#### Step 5: Create Pipeline
1. Dashboard → New Item
2. Name: `CollabSphere-Pipeline`
3. Type: Pipeline
4. Pipeline:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository URL: `https://github.com/YOUR_USERNAME/collabsphere.git`
   - Branch: `*/main`
   - Script Path: `jenkins/Jenkinsfile`
5. Save

#### Step 6: Run Pipeline
1. Click "Build Now"
2. Watch console output
3. Verify deployment

**Test:** Application should be running on EC2

---

### Phase 5: Kubernetes Setup (Optional - 1 hour)

#### Step 1: Install Minikube (Local Testing)
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Start Minikube
minikube start --cpus=4 --memory=8192
```

#### Step 2: Build and Load Images
```bash
# Build images
docker build -t collabsphere-backend -f docker/backend.Dockerfile ./backend
docker build -t collabsphere-frontend -f docker/frontend.Dockerfile ./client

# Load images to Minikube
minikube image load collabsphere-backend:latest
minikube image load collabsphere-frontend:latest
```

#### Step 3: Deploy to Kubernetes
```bash
# Apply configurations
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml

# Check status
kubectl get pods -n collabsphere
kubectl get services -n collabsphere

# Port forward
kubectl port-forward -n collabsphere svc/frontend-service 3000:80
kubectl port-forward -n collabsphere svc/backend-service 5000:5000
```

**Test:** http://localhost:3000

---

### Phase 6: Monitoring Setup (30 minutes)

#### Step 1: Install Prometheus
```bash
# On EC2
cd ~
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Copy config
cp ~/collabsphere/monitoring/prometheus.yml .

# Start Prometheus (in background)
nohup ./prometheus --config.file=prometheus.yml > prometheus.log 2>&1 &
```

**Test:** http://YOUR_EC2_IP:9090

#### Step 2: Install Grafana
```bash
# Add repository
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# Install
sudo apt-get update
sudo apt-get install -y grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

**Test:** http://YOUR_EC2_IP:3001
- Username: `admin`
- Password: `admin`

#### Step 3: Configure Grafana
1. Login to Grafana
2. Add data source:
   - Type: Prometheus
   - URL: `http://localhost:9090`
   - Save & Test
3. Import dashboards:
   - Dashboard ID: `11159` (Node.js)
   - Dashboard ID: `1860` (System)

---

## 🎯 Complete Workflow

### Development Workflow
```bash
# 1. Make changes locally
git checkout -b feature/new-feature

# 2. Test locally
npm start

# 3. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 4. Create Pull Request
# 5. Merge to main
# 6. Jenkins automatically deploys
```

### Deployment Workflow
```
Code Push → GitHub → Jenkins Webhook → Build → Test → Deploy → Health Check
```

---

## 🔧 Troubleshooting

### Issue: Docker permission denied
```bash
sudo usermod -aG docker $USER
exit
# Login again
```

### Issue: Port already in use
```bash
# Find process
sudo lsof -i :5000

# Kill process
sudo kill -9 <PID>
```

### Issue: Jenkins build fails
```bash
# Check Jenkins logs
sudo journalctl -u jenkins -f

# Check Docker permission
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### Issue: Cannot connect to EC2
```bash
# Check security group
# Ensure port 22 is open for your IP

# Check key permissions
chmod 400 collabsphere-key.pem
```

---

## 📊 Verification Checklist

- [ ] Local development working
- [ ] Docker images building successfully
- [ ] Docker Compose running all services
- [ ] EC2 instance accessible
- [ ] Application deployed on EC2
- [ ] Jenkins installed and accessible
- [ ] Jenkins pipeline running successfully
- [ ] Prometheus collecting metrics
- [ ] Grafana dashboards showing data
- [ ] All services healthy

---

## 🎓 Next Steps

1. **Custom Domain:**
   - Buy domain from GoDaddy/Namecheap
   - Point to EC2 IP
   - Setup SSL with Let's Encrypt

2. **Auto-scaling:**
   - Setup AWS Auto Scaling Group
   - Configure Load Balancer
   - Implement health checks

3. **Database Backup:**
   - Setup MongoDB backup script
   - Store in S3
   - Automate with cron

4. **Advanced Monitoring:**
   - Setup alerts in Grafana
   - Email notifications
   - Slack integration

---

## 📞 Support

If you face any issues:
1. Check logs: `docker-compose logs -f`
2. Verify ports: `sudo netstat -tulpn`
3. Check services: `docker-compose ps`
4. Review security groups in AWS

---

**🎉 Congratulations! Your complete DevOps setup is ready!**
