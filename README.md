# 🚀 CollabSphere - DevOps CI/CD Setup

A complete DevOps setup for CollabSphere (MERN stack) with Jenkins CI/CD, Kubernetes deployment, and monitoring.

## 📋 Architecture

```
┌─────────────────────┐         ┌──────────────────────────┐
│  Jenkins EC2        │         │  Kubernetes EC2          │
│  (Existing)         │────────▶│  (New)                   │
│                     │   SSH   │                          │
│  - Jenkins          │         │  - Minikube              │
│  - Docker           │         │  - Prometheus            │
│  - kubectl          │         │  - Grafana               │
└─────────────────────┘         │  - Your App              │
                                └──────────────────────────┘
```

## 🎯 What This Setup Does

1. **Jenkins Server** (Your existing EC2)
   - Builds Docker images
   - Pushes to Docker Hub
   - Deploys to remote Kubernetes

2. **Kubernetes Server** (New EC2)
   - Runs your application in Minikube
   - Prometheus for monitoring
   - Grafana for dashboards
   - Auto-scaling and health checks

## 🚀 Quick Start (15 minutes)

### Method 1: Automated with Ansible (Recommended) ⚡

**Prerequisites:**
- Ansible installed (WSL/Linux/Mac)
- AWS credentials
- SSH key pair

**Steps:**
```powershell
# 1. Create infrastructure
cd terraform
terraform apply

# 2. Update Ansible inventory with K8s IP
# Edit ansible/inventory.ini

# 3. Run Ansible (automates everything!)
cd ../ansible
ansible-playbook playbooks/site.yml

# Done! Everything configured automatically
```

**Time:** 12-15 minutes
**Read:** [ANSIBLE_INTEGRATION.md](ANSIBLE_INTEGRATION.md)

### Method 2: Manual Setup

**Prerequisites:**

- ✅ Existing Jenkins EC2 running
- ✅ AWS credentials
- ✅ Docker Hub account
- ✅ SSH key pair (collabsphere-key.pem)
- ✅ Terraform installed

### Step 1: Create Kubernetes EC2

```powershell
cd terraform
terraform apply
```

**Output:**
```
existing_jenkins_ip = "13.233.75.163"  # Your existing Jenkins
k8s_public_ip = "X.X.X.X"              # New K8s server
k8s_private_ip = "Y.Y.Y.Y"             # Use this in Jenkins
```

**Wait:** 5-7 minutes for setup to complete

### Step 2: Setup SSH Connection

#### On Kubernetes Server:

```bash
# Connect to K8s server
ssh -i C:\Users\sarvn\Downloads\collabsphere-key.pem ubuntu@<K8S_PUBLIC_IP>

# Generate SSH key
ssh-keygen -t rsa -b 4096 -f ~/.ssh/jenkins_key -N ""

# Add to authorized_keys
cat ~/.ssh/jenkins_key.pub >> ~/.ssh/authorized_keys

# Copy private key (copy entire output)
cat ~/.ssh/jenkins_key
```

#### On Jenkins Server:

```bash
# Connect to Jenkins server
ssh -i C:\Users\sarvn\Downloads\collabsphere-key.pem ubuntu@13.233.75.163

# Switch to jenkins user
sudo su - jenkins

# Create SSH key file
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/k8s_key
# Paste the private key, save with Ctrl+O, Enter, Ctrl+X

# Set permissions
chmod 600 ~/.ssh/k8s_key

# Test connection (use K8s PRIVATE IP)
ssh -i ~/.ssh/k8s_key ubuntu@<K8S_PRIVATE_IP> "echo 'Success'"
```

### Step 3: Configure Jenkins

#### 3.1: Install SSH Agent Plugin

1. Open Jenkins: `http://13.233.75.163:8080`
2. Manage Jenkins → Manage Plugins
3. Available → Search "SSH Agent"
4. Install without restart

#### 3.2: Add Credentials

**Credential 1: K8s SSH Key**
- Manage Jenkins → Manage Credentials → Add
- Kind: `SSH Username with private key`
- ID: `k8s-ssh-key`
- Username: `ubuntu`
- Private Key: Paste the key from Step 2
- Click Create

**Credential 2: K8s Server IP**
- Manage Jenkins → Manage Credentials → Add
- Kind: `Secret text`
- ID: `k8s-server-ip`
- Secret: `<K8S_PRIVATE_IP>` (from terraform output)
- Click Create

**Credential 3: Docker Hub** (if not already added)
- Kind: `Username with password`
- ID: `dockerhub-credentials`
- Username: Your Docker Hub username
- Password: Your Docker Hub password

### Step 4: Create/Update Pipeline

#### Option A: Update Existing Pipeline

1. Go to your existing pipeline job
2. Click Configure
3. Replace script with content from `jenkins/Jenkinsfile`
4. Save

#### Option B: Create New Pipeline

1. New Item → Pipeline
2. Name: `collabsphere-k8s-deploy`
3. Definition: `Pipeline script`
4. Copy script from `jenkins/Jenkinsfile`
5. Save

### Step 5: Deploy

1. Click **Build Now**
2. Watch Console Output
3. Pipeline will:
   - ✅ Clone repository
   - ✅ Build Docker images
   - ✅ Push to Docker Hub
   - ✅ Deploy to Kubernetes
   - ✅ Verify deployment

## 🌐 Access Your Application

After successful deployment:

```
Jenkins:    http://13.233.75.163:8080
Frontend:   http://<K8S_PUBLIC_IP>:30300
Backend:    http://<K8S_PUBLIC_IP>:30500
Prometheus: http://<K8S_PUBLIC_IP>:9090
Grafana:    http://<K8S_PUBLIC_IP>:3001
```

## 📊 Monitoring Setup

### Start Prometheus (One-time)

```bash
# SSH to K8s server
ssh -i C:\Users\sarvn\Downloads\collabsphere-key.pem ubuntu@<K8S_PUBLIC_IP>

# Start Prometheus
cd ~/prometheus
nohup ./prometheus --config.file=prometheus.yml > prometheus.log 2>&1 &

# Verify
curl http://localhost:9090
```

### Configure Grafana

1. Open: `http://<K8S_PUBLIC_IP>:3001`
2. Login: `admin` / `admin`
3. Add Prometheus data source:
   - URL: `http://localhost:9090`
   - Save & Test
4. Import dashboards:
   - Node.js: Dashboard ID `11159`
   - System: Dashboard ID `1860`

## 🔧 Project Structure

```
.
├── backend/                 # Node.js backend
├── client/                  # React frontend
├── docker/                  # Dockerfiles
│   ├── backend.Dockerfile
│   ├── frontend.Dockerfile
│   └── docker-compose.yml
├── jenkins/                 # CI/CD
│   └── Jenkinsfile
├── kubernetes/              # K8s manifests
│   ├── deployment.yaml
│   └── service.yaml
├── terraform/               # Infrastructure
│   ├── ec2.tf
│   ├── terraform.tfvars
│   └── .gitignore
└── monitoring/              # Monitoring configs
    ├── prometheus.yml
    └── grafana-setup.md
```

## 🛠️ Troubleshooting

### Issue: Jenkins can't SSH to K8s

**Test connection:**
```bash
# On Jenkins server
sudo su - jenkins
ssh -i ~/.ssh/k8s_key ubuntu@<K8S_PRIVATE_IP>
```

**If fails, check:**
- Private key is correct
- Using PRIVATE IP (not public)
- Permissions: `chmod 600 ~/.ssh/k8s_key`
- Security groups allow traffic

### Issue: Minikube not running

```bash
# On K8s server
minikube status

# If not running
minikube start --driver=docker --cpus=2 --memory=4096
```

### Issue: Pipeline fails

**Check:**
1. All 3 credentials added in Jenkins?
   - `k8s-ssh-key`
   - `k8s-server-ip`
   - `dockerhub-credentials`
2. Using K8s PRIVATE IP in credentials?
3. SSH test successful?
4. Minikube running on K8s server?
5. Docker Hub credentials correct?

### Issue: Pods not starting

```bash
# Check pod status
kubectl get pods -n collabsphere

# Check pod logs
kubectl logs -f deployment/backend -n collabsphere
kubectl logs -f deployment/frontend -n collabsphere

# Describe pod for events
kubectl describe pod <POD_NAME> -n collabsphere
```

## 💰 Cost Breakdown

- **Jenkins EC2**: Already running (no new cost)
- **Kubernetes EC2** (t2.medium): ~₹2,500/month (~$30/month)

**Total NEW cost: ₹2,500/month**

### Cost Optimization

Stop K8s instance when not in use:

```bash
# Stop instance
aws ec2 stop-instances --instance-ids <K8S_INSTANCE_ID>

# Start when needed
aws ec2 start-instances --instance-ids <K8S_INSTANCE_ID>
```

**Savings:** ~66% if running 8 hours/day

## 🔐 Security Best Practices

1. **Never commit secrets**
   - `terraform.tfvars` is gitignored
   - Use Jenkins credentials for sensitive data

2. **Use private IPs**
   - Jenkins → K8s communication uses private IP
   - Faster and more secure

3. **Regular updates**
   ```bash
   # Update K8s server
   sudo apt update && sudo apt upgrade -y
   ```

4. **Backup important data**
   ```bash
   # Backup MongoDB
   kubectl exec -n collabsphere deployment/mongo -- \
     mongodump --out /backup/$(date +%Y%m%d)
   ```

## 📚 Additional Resources

### Useful Commands

```bash
# Check all pods
kubectl get pods -n collabsphere

# Check services
kubectl get svc -n collabsphere

# Check deployments
kubectl get deployments -n collabsphere

# Scale deployment
kubectl scale deployment/backend --replicas=3 -n collabsphere

# Restart deployment
kubectl rollout restart deployment/backend -n collabsphere

# View logs
kubectl logs -f deployment/backend -n collabsphere

# Execute command in pod
kubectl exec -it deployment/backend -n collabsphere -- bash
```

### Jenkins Pipeline Stages

1. **Clone Repository** - Fetches code from GitHub
2. **Build Docker Images** - Builds backend and frontend
3. **Push to Docker Hub** - Uploads images
4. **Deploy to Remote Kubernetes** - SSH to K8s and deploy
5. **Verify Deployment** - Checks pod status
6. **Cleanup** - Removes unused Docker images

## 🎯 Benefits of This Setup

✅ **Existing Jenkins Safe** - No changes to your current setup
✅ **Fast Deployments** - Direct pull from Docker Hub
✅ **Dedicated Resources** - K8s has its own server
✅ **Professional Setup** - Industry-standard CI/CD
✅ **Monitoring Included** - Prometheus + Grafana
✅ **Easy to Scale** - Add more K8s nodes easily
✅ **Cost Effective** - Jenkins is free, K8s is optimized

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👥 Support

For issues or questions:
- Check the Troubleshooting section above
- Review Jenkins console output
- Check K8s pod logs: `kubectl logs -f deployment/<name> -n collabsphere`
- Verify all credentials are added correctly

## 🎉 Success Checklist

After setup, verify:

- [ ] Terraform created K8s EC2
- [ ] SSH connection works (Jenkins → K8s)
- [ ] All 3 credentials added in Jenkins
- [ ] Pipeline builds successfully
- [ ] Pods are running: `kubectl get pods -n collabsphere`
- [ ] Frontend accessible at port 30300
- [ ] Backend accessible at port 30500
- [ ] Prometheus running at port 9090
- [ ] Grafana accessible at port 3001

---

**Made with ❤️ for DevOps Learning**

**Total Setup Time:** 15-20 minutes
**Difficulty:** Intermediate
**Prerequisites:** Basic AWS, Docker, and Kubernetes knowledge
