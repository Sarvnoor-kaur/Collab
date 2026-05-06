# 📋 CollabSphere Deployment Checklist

Use this checklist to ensure you complete all steps for successful deployment.

## ✅ Pre-Deployment Checklist

### 1. AWS Prerequisites
- [ ] AWS account created
- [ ] AWS access key obtained
- [ ] AWS secret key obtained
- [ ] EC2 key pair created and downloaded (.pem file)
- [ ] Key pair name noted (e.g., `collabsphere-key`)

### 2. Docker Hub Prerequisites
- [ ] Docker Hub account created
- [ ] Docker Hub username noted
- [ ] Docker Hub password/token ready

### 3. GitHub Prerequisites
- [ ] GitHub account created
- [ ] Repository created (e.g., `collabsphere`)
- [ ] Code pushed to `main` branch
- [ ] Repository URL noted

### 4. Local Machine Setup
- [ ] Git installed
- [ ] Terraform installed (`terraform --version`)
- [ ] SSH client available

## ✅ Configuration Checklist

### 1. Terraform Configuration
- [ ] Navigate to `terraform/` directory
- [ ] Copy `terraform.tfvars.example` to `terraform.tfvars`
- [ ] Edit `terraform.tfvars`:
  - [ ] Add `aws_access_key`
  - [ ] Add `aws_secret_key`
  - [ ] Set `aws_region` (default: us-east-1)
  - [ ] Set `key_name` to your EC2 key pair name
- [ ] Verify `.gitignore` includes `terraform.tfvars`

### 2. Jenkins Configuration
- [ ] Open `jenkins/Jenkinsfile`
- [ ] Update `DOCKERHUB_USERNAME` (line 6)
- [ ] Update GitHub repository URL (line 14)
- [ ] Verify branch name is `main` (or change to `master` if needed)

### 3. Kubernetes Configuration
- [ ] Open `kubernetes/deployment.yaml`
- [ ] Verify it uses `DOCKERHUB_USERNAME` placeholder (not YOUR_DOCKERHUB_USERNAME)
- [ ] Update `JWT_SECRET` in Secret section (line 21)
- [ ] Verify MongoDB URI is correct

### 4. Backend Configuration
- [ ] Open `backend/.env`
- [ ] Update `MONGO_URI` if needed
- [ ] Update `JWT_SECRET` (should match Kubernetes secret)
- [ ] Update `CLIENT_URL` if needed

### 5. Git Commit
- [ ] All changes committed to Git
- [ ] Changes pushed to GitHub
- [ ] Verify push was successful

## ✅ Deployment Checklist

### Phase 1: Infrastructure Provisioning
- [ ] Open terminal
- [ ] Navigate to `terraform/` directory
- [ ] Run `terraform init`
- [ ] Run `terraform plan` (review changes)
- [ ] Run `terraform apply -auto-approve`
- [ ] Note the EC2 public IP from output
- [ ] Wait 3-5 minutes for EC2 initialization

### Phase 2: EC2 Verification
- [ ] SSH to EC2: `ssh -i your-key.pem ubuntu@EC2_IP`
- [ ] Verify Docker: `docker --version`
- [ ] Verify Jenkins: `sudo systemctl status jenkins`
- [ ] Verify Minikube: `minikube status`
- [ ] Verify kubectl: `kubectl version --client`
- [ ] Exit SSH session

### Phase 3: Jenkins Setup
- [ ] Open browser to `http://EC2_IP:8080`
- [ ] SSH to EC2 and get initial password:
  ```bash
  sudo cat /var/lib/jenkins/secrets/initialAdminPassword
  ```
- [ ] Copy password and paste in Jenkins
- [ ] Click "Install suggested plugins"
- [ ] Wait for plugins to install
- [ ] Create admin user:
  - [ ] Username: _______________
  - [ ] Password: _______________
  - [ ] Email: _______________
- [ ] Click "Save and Continue"
- [ ] Click "Save and Finish"
- [ ] Click "Start using Jenkins"

### Phase 4: Docker Hub Credentials
- [ ] In Jenkins, go to "Manage Jenkins"
- [ ] Click "Credentials"
- [ ] Click "(global)" under "Stores scoped to Jenkins"
- [ ] Click "Add Credentials"
- [ ] Fill in:
  - [ ] Kind: Username with password
  - [ ] Username: Your Docker Hub username
  - [ ] Password: Your Docker Hub password
  - [ ] ID: `dockerhub-credentials` (MUST be exact)
  - [ ] Description: Docker Hub login
- [ ] Click "Create"

### Phase 5: Create Jenkins Pipeline
- [ ] Go to Jenkins Dashboard
- [ ] Click "New Item"
- [ ] Enter name: `collabsphere-pipeline`
- [ ] Select "Pipeline"
- [ ] Click "OK"
- [ ] Scroll to "Build Triggers"
- [ ] Check "GitHub hook trigger for GITScm polling"
- [ ] Scroll to "Pipeline" section
- [ ] Select "Pipeline script from SCM"
- [ ] SCM: Git
- [ ] Repository URL: Your GitHub repo URL
- [ ] Branch Specifier: `*/main`
- [ ] Script Path: `jenkins/Jenkinsfile`
- [ ] Click "Save"

### Phase 6: GitHub Webhook (Optional)
- [ ] Go to GitHub repository
- [ ] Click "Settings"
- [ ] Click "Webhooks"
- [ ] Click "Add webhook"
- [ ] Payload URL: `http://EC2_IP:8080/github-webhook/`
- [ ] Content type: application/json
- [ ] Click "Add webhook"
- [ ] Verify green checkmark appears

### Phase 7: First Deployment
- [ ] In Jenkins, go to `collabsphere-pipeline`
- [ ] Click "Build Now"
- [ ] Click on build number (e.g., #1)
- [ ] Click "Console Output"
- [ ] Monitor the build progress
- [ ] Wait for all stages to complete (~8-10 minutes)
- [ ] Verify success message

### Phase 8: Verify Deployment
- [ ] SSH to EC2
- [ ] Check pods: `kubectl get pods -n collabsphere`
- [ ] Verify all pods are "Running"
- [ ] Check services: `kubectl get svc -n collabsphere`
- [ ] Get Minikube IP: `minikube ip`
- [ ] Note the IP: _______________
- [ ] Test frontend: `curl http://MINIKUBE_IP:30300`
- [ ] Test backend: `curl http://MINIKUBE_IP:30500/api/health`

### Phase 9: Access Application
- [ ] Open browser
- [ ] Go to `http://MINIKUBE_IP:30300`
- [ ] Verify frontend loads
- [ ] Test registration
- [ ] Test login
- [ ] Test chat functionality

### Phase 10: Monitoring Setup (Optional)
- [ ] Follow instructions in `monitoring/grafana-setup.md`
- [ ] Install Prometheus
- [ ] Install Grafana
- [ ] Configure data sources
- [ ] Import dashboards

## ✅ Post-Deployment Checklist

### Verification
- [ ] Application is accessible
- [ ] User registration works
- [ ] User login works
- [ ] Chat functionality works
- [ ] Video meeting works (if applicable)
- [ ] No errors in browser console
- [ ] No errors in pod logs

### Documentation
- [ ] Document EC2 IP address
- [ ] Document Minikube IP address
- [ ] Document Jenkins admin credentials
- [ ] Document Docker Hub username
- [ ] Save all credentials securely

### Testing
- [ ] Test automatic deployment (push code to GitHub)
- [ ] Verify webhook triggers Jenkins
- [ ] Verify pipeline completes successfully
- [ ] Verify application updates

## ✅ Troubleshooting Checklist

### If Jenkins Build Fails

#### Stage: Clone Repository
- [ ] Verify GitHub repository URL is correct
- [ ] Verify branch name is correct
- [ ] Check Jenkins has internet access

#### Stage: Build Docker Images
- [ ] Verify Dockerfiles exist in `docker/` directory
- [ ] Check Docker is running: `docker ps`
- [ ] Verify Jenkins user has Docker permissions:
  ```bash
  sudo usermod -aG docker jenkins
  sudo systemctl restart jenkins
  ```

#### Stage: Push to Docker Hub
- [ ] Verify Docker Hub credentials are correct
- [ ] Verify credential ID is `dockerhub-credentials`
- [ ] Test Docker login manually:
  ```bash
  docker login -u YOUR_USERNAME
  ```

#### Stage: Load Images to Minikube
- [ ] Verify Minikube is running: `minikube status`
- [ ] Restart Minikube if needed:
  ```bash
  minikube stop
  minikube start
  ```

#### Stage: Deploy to Kubernetes
- [ ] Verify kubectl is configured: `kubectl cluster-info`
- [ ] Check deployment.yaml syntax
- [ ] Verify namespace exists: `kubectl get ns`

#### Stage: Verify Deployment
- [ ] Check pod status: `kubectl get pods -n collabsphere`
- [ ] Check pod logs: `kubectl logs <pod-name> -n collabsphere`
- [ ] Describe pod: `kubectl describe pod <pod-name> -n collabsphere`

### If Application Not Accessible
- [ ] Verify Minikube IP: `minikube ip`
- [ ] Verify services: `kubectl get svc -n collabsphere`
- [ ] Verify NodePort is 30300 for frontend
- [ ] Verify NodePort is 30500 for backend
- [ ] Check security group allows ports 30300 and 30500
- [ ] Test from EC2 instance first: `curl http://MINIKUBE_IP:30300`

### If Pods Not Starting
- [ ] Check pod status: `kubectl get pods -n collabsphere`
- [ ] Check pod events: `kubectl describe pod <pod-name> -n collabsphere`
- [ ] Check pod logs: `kubectl logs <pod-name> -n collabsphere`
- [ ] Verify images are loaded: `minikube image ls | grep collabsphere`
- [ ] Check resource limits in deployment.yaml

## ✅ Cleanup Checklist

### When Done Testing
- [ ] Delete Kubernetes resources:
  ```bash
  kubectl delete -f kubernetes/deployment.yaml
  kubectl delete -f kubernetes/service.yaml
  ```
- [ ] Stop Minikube: `minikube stop`
- [ ] Destroy AWS infrastructure:
  ```bash
  cd terraform
  terraform destroy -auto-approve
  ```
- [ ] Verify EC2 instance is terminated in AWS Console
- [ ] Remove local Docker images (optional):
  ```bash
  docker rmi collabsphere-backend collabsphere-frontend
  ```

## 📊 Success Criteria

Your deployment is successful when:
- ✅ All Jenkins pipeline stages pass
- ✅ All Kubernetes pods are in "Running" state
- ✅ Frontend is accessible at `http://MINIKUBE_IP:30300`
- ✅ Backend is accessible at `http://MINIKUBE_IP:30500`
- ✅ User can register and login
- ✅ Chat functionality works
- ✅ No errors in browser console
- ✅ No errors in pod logs

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Review `DEPLOYMENT_GUIDE.md` for detailed instructions
3. Check Jenkins console output for error messages
4. Check pod logs: `kubectl logs <pod-name> -n collabsphere`
5. Review `KUBERNETES_GUIDE.md` for Kubernetes-specific issues

## 🎯 Quick Reference

**Important URLs:**
- Jenkins: `http://EC2_IP:8080`
- Frontend: `http://MINIKUBE_IP:30300`
- Backend: `http://MINIKUBE_IP:30500`
- Prometheus: `http://EC2_IP:9090`
- Grafana: `http://EC2_IP:3001`

**Important Commands:**
```bash
# Check pods
kubectl get pods -n collabsphere

# Check services
kubectl get svc -n collabsphere

# Get Minikube IP
minikube ip

# View logs
kubectl logs <pod-name> -n collabsphere

# Restart deployment
kubectl rollout restart deployment/backend -n collabsphere
kubectl rollout restart deployment/frontend -n collabsphere
```

---

**Print this checklist and check off items as you complete them!**

**Estimated Total Time:** 45-60 minutes (first time)
