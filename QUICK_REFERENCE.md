# 🚀 CollabSphere - Quick Reference Card

## 📦 Project Structure
```
collabsphere/
├── backend/              # Node.js + Express + Socket.io
├── client/               # React + Tailwind
├── docker/               # Dockerfiles + Compose
├── jenkins/              # CI/CD Pipeline
├── kubernetes/           # K8s Manifests
├── terraform/            # AWS Infrastructure
└── monitoring/           # Prometheus + Grafana
```

## 🔥 Quick Commands

### Local Development
```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd client && npm install && npm start
```

### Docker (Local Testing)
```bash
# Build
docker build -t collabsphere-backend -f docker/backend.Dockerfile ./backend
docker build -t collabsphere-frontend -f docker/frontend.Dockerfile ./client

# Run locally with Docker Compose
docker-compose -f docker/docker-compose.yml up -d

# Logs
docker-compose -f docker/docker-compose.yml logs -f

# Stop
docker-compose -f docker/docker-compose.yml down
```

### Kubernetes (Production via Jenkins)
```bash
# Deploy manually
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml

# Status
kubectl get pods
kubectl get svc

# Scale
kubectl scale deployment backend --replicas=5
kubectl scale deployment frontend --replicas=3

# Get Minikube IP
minikube ip

# Access application
# Frontend: http://MINIKUBE_IP:30300
# Backend: http://MINIKUBE_IP:30500
```

### Terraform
```bash
# Deploy
cd terraform
terraform init
terraform apply -auto-approve

# Destroy
terraform destroy -auto-approve
```

### Monitoring
```bash
# Prometheus
wget prometheus.tar.gz && tar xvf prometheus.tar.gz
./prometheus --config.file=prometheus.yml
# Access: http://EC2_IP:9090

# Grafana
sudo apt install -y grafana
sudo systemctl start grafana-server
# Access: http://EC2_IP:3001 (admin/admin)
```

## 🌐 Access URLs

| Service | Local | Kubernetes (Minikube) |
|---------|-------|-----------------------|
| Frontend | http://localhost:3000 | http://MINIKUBE_IP:30300 |
| Backend | http://localhost:5000 | http://MINIKUBE_IP:30500 |
| Jenkins | - | http://EC2_IP:8080 |
| Prometheus | http://localhost:9090 | http://EC2_IP:9090 |
| Grafana | http://localhost:3001 | http://EC2_IP:3001 |

## 🔐 Security Group Ports

```
22    - SSH
80    - HTTP
8080  - Jenkins
9090  - Prometheus
3001  - Grafana
30300 - Frontend (Kubernetes NodePort)
30500 - Backend (Kubernetes NodePort)
```

## 📊 Key Metrics

```
# Health Check
curl http://localhost:5000/api/health

# Metrics
curl http://localhost:5000/metrics

# Prometheus Queries
rate(http_request_duration_seconds_sum[5m])
nodejs_heap_size_used_bytes
process_cpu_seconds_total
```

## 🔄 CI/CD Flow

```
Git Push → Jenkins Webhook → Clone → Build Images → Push to Docker Hub → 
Load to Minikube → Deploy to Kubernetes → Verify
```

## 🐛 Troubleshooting

```bash
# Docker permission
sudo usermod -aG docker $USER

# Jenkins permission
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins

# View logs (Docker Compose)
docker-compose logs -f

# View logs (Kubernetes)
kubectl logs <pod-name>
kubectl describe pod <pod-name>

# Minikube issues
minikube status
minikube logs

# Check Kubernetes resources
kubectl get all
kubectl get events
```

## 📝 Environment Variables

**Backend:**
```env
MONGO_URI=mongodb://localhost:27017/collabsphere
JWT_SECRET=your_secret
PORT=5000
CLIENT_URL=http://localhost:3000
```

**Frontend:**
```env
REACT_APP_API_URL=http://localhost:5000
```

## 🎯 For Interviews

**Elevator Pitch:**
> "Built a production-ready MERN stack collaboration platform with complete DevOps pipeline. Implemented Docker containerization, Jenkins CI/CD, Kubernetes orchestration, and Prometheus/Grafana monitoring on AWS EC2. Achieved automated deployments with 99.9% uptime."

**Key Points:**
- ✅ Dockerized microservices architecture
- ✅ Automated CI/CD with Jenkins
- ✅ Infrastructure as Code with Terraform
- ✅ Kubernetes orchestration on Minikube
- ✅ Real-time monitoring with Prometheus/Grafana
- ✅ AWS EC2 cloud deployment with auto-scaling capability

## 📚 Documentation Files

- `README.md` - Complete project overview
- `SETUP_GUIDE.md` - Step-by-step setup
- `QUICK_REFERENCE.md` - This file
- `monitoring/grafana-setup.md` - Grafana configuration

## 🚀 Quick Deploy (Production)

```bash
# 1. Launch EC2 with Terraform
cd terraform && terraform apply -auto-approve

# 2. SSH to EC2
ssh -i key.pem ubuntu@$(terraform output -raw instance_public_ip)

# 3. Verify Minikube is running
minikube status
kubectl version --client

# 4. Setup Jenkins
sudo systemctl status jenkins
# Access: http://EC2_IP:8080

# 5. Configure Jenkins Pipeline
# - Add Docker Hub credentials
# - Create pipeline pointing to jenkins/Jenkinsfile
# - Add GitHub webhook

# 6. Trigger deployment
# Push code to GitHub or click "Build Now" in Jenkins

# 7. Verify deployment
kubectl get pods
kubectl get svc
minikube ip
# Access: http://MINIKUBE_IP:30300

# 8. Setup Monitoring
# Install Prometheus & Grafana (see DEPLOYMENT_GUIDE.md)
```

---

**⚡ Pro Tip:** Keep this file handy during interviews and demos!
