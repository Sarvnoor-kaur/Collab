# ☸️ Kubernetes Deployment Guide with Minikube

## Overview

This guide covers deploying CollabSphere to Kubernetes using Minikube on EC2. The Jenkins pipeline automatically handles the deployment.

## Architecture

```
Jenkins Pipeline
      ↓
Build Docker Images
      ↓
Push to Docker Hub
      ↓
Load Images to Minikube
      ↓
Deploy to Kubernetes
      ↓
Verify with Health Checks
```

## Prerequisites

- EC2 instance with Minikube installed (done by Terraform)
- Jenkins configured
- Docker Hub account
- kubectl configured

---

## 1. Verify Minikube Setup

### Step 1.1: Check Minikube Status

```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Check Minikube status
minikube status
```

**Expected Output:**
```
minikube
type: Control Plane
host: Running
kubelet: Running
apiserver: Running
kubeconfig: Configured
```

### Step 1.2: Verify kubectl

```bash
# Check kubectl
kubectl version --client

# Check cluster info
kubectl cluster-info

# Check nodes
kubectl get nodes
```

**Expected Output:**
```
NAME       STATUS   ROLES           AGE   VERSION
minikube   Ready    control-plane   10m   v1.28.3
```

---

## 2. Understanding the Deployment

### Kubernetes Resources Created

1. **Namespace**: `collabsphere`
2. **Deployments**:
   - `mongo` (1 replica)
   - `backend` (2 replicas)
   - `frontend` (2 replicas)
3. **Services**:
   - `mongo-service` (ClusterIP)
   - `backend-service` (NodePort 30500)
   - `frontend-service` (NodePort 30300)
4. **ConfigMaps**: Backend configuration
5. **Secrets**: MongoDB credentials, JWT secret

### Service Types

- **ClusterIP** (MongoDB): Internal only, not accessible from outside
- **NodePort** (Backend/Frontend): Accessible via Minikube IP + NodePort

---

## 3. Manual Kubernetes Deployment

If you want to deploy manually (without Jenkins):

### Step 3.1: Build and Load Images

```bash
# Build images
docker build -t johndoe/collabsphere-backend:latest -f docker/backend.Dockerfile ./backend
docker build -t johndoe/collabsphere-frontend:latest -f docker/frontend.Dockerfile ./client

# Load images to Minikube
minikube image load johndoe/collabsphere-backend:latest
minikube image load johndoe/collabsphere-frontend:latest

# Verify images are loaded
minikube image ls | grep collabsphere
```

### Step 3.2: Update Deployment Files

```bash
# Update image names in deployment.yaml
sed -i 's/YOUR_DOCKERHUB_USERNAME/johndoe/g' kubernetes/deployment.yaml
```

### Step 3.3: Deploy to Kubernetes

```bash
# Apply deployments
kubectl apply -f kubernetes/deployment.yaml

# Apply services
kubectl apply -f kubernetes/service.yaml

# Check deployment status
kubectl get all -n collabsphere
```

### Step 3.4: Wait for Pods to be Ready

```bash
# Watch pods
kubectl get pods -n collabsphere -w

# Wait for all pods to be Running
kubectl wait --for=condition=ready pod -l app=backend -n collabsphere --timeout=300s
kubectl wait --for=condition=ready pod -l app=frontend -n collabsphere --timeout=300s
```

---

## 4. Accessing the Application

### Step 4.1: Get Minikube IP

```bash
# Get Minikube IP
minikube ip
```

**Example Output:** `192.168.49.2`

### Step 4.2: Get Service Ports

```bash
# Get all services
kubectl get svc -n collabsphere

# Get specific NodePorts
kubectl get svc frontend-service -n collabsphere -o jsonpath='{.spec.ports[0].nodePort}'
kubectl get svc backend-service -n collabsphere -o jsonpath='{.spec.ports[0].nodePort}'
```

**Expected Output:**
```
NAME                TYPE        CLUSTER-IP       EXTERNAL-IP   PORT(S)          AGE
mongo-service       ClusterIP   10.96.100.1      <none>        27017/TCP        2m
backend-service     NodePort    10.96.100.2      <none>        5000:30500/TCP   2m
frontend-service    NodePort    10.96.100.3      <none>        80:30300/TCP     2m
```

### Step 4.3: Access Application

**From EC2 Instance:**
```bash
# Frontend
curl http://$(minikube ip):30300

# Backend health check
curl http://$(minikube ip):30500/api/health
```

**From Your Local Machine:**

You need to setup port forwarding or use `minikube tunnel`.

**Option A: Port Forwarding (Recommended)**
```bash
# On EC2, forward ports
kubectl port-forward -n collabsphere svc/frontend-service 3000:80 --address 0.0.0.0
kubectl port-forward -n collabsphere svc/backend-service 5000:5000 --address 0.0.0.0
```

Then access:
- Frontend: `http://YOUR_EC2_IP:3000`
- Backend: `http://YOUR_EC2_IP:5000`

**Option B: Minikube Tunnel**
```bash
# On EC2 (requires sudo)
minikube tunnel
```

---

## 5. Jenkins Pipeline with Kubernetes

### Step 5.1: Configure Deployment Mode

In `jenkins/Jenkinsfile`, set:
```groovy
DEPLOYMENT_MODE = 'kubernetes'
```

### Step 5.2: Pipeline Stages for Kubernetes

The pipeline includes these Kubernetes-specific stages:

1. **Load Images to Minikube**
   ```bash
   minikube image load ${DOCKER_IMAGE_BACKEND}:latest
   minikube image load ${DOCKER_IMAGE_FRONTEND}:latest
   ```

2. **Deploy to Kubernetes**
   ```bash
   kubectl apply -f kubernetes/deployment.yaml
   kubectl apply -f kubernetes/service.yaml
   kubectl wait --for=condition=available deployment/backend -n collabsphere
   kubectl wait --for=condition=available deployment/frontend -n collabsphere
   ```

3. **Health Check**
   ```bash
   MINIKUBE_IP=$(minikube ip)
   BACKEND_PORT=$(kubectl get svc backend-service -n collabsphere -o jsonpath='{.spec.ports[0].nodePort}')
   curl -f http://${MINIKUBE_IP}:${BACKEND_PORT}/api/health
   ```

### Step 5.3: Run Pipeline

1. Go to Jenkins: `http://YOUR_EC2_IP:8080`
2. Click on `collabsphere-pipeline`
3. Click **Build Now**
4. Watch the console output

**Expected Output:**
```
✅ Pipeline completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☸️  Kubernetes Deployment
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 Frontend: http://192.168.49.2:30300
🔧 Backend: http://192.168.49.2:30500
📊 Pods Status:
NAME                        READY   STATUS    RESTARTS   AGE
backend-5d7f8c9b4d-abc12    1/1     Running   0          2m
backend-5d7f8c9b4d-def34    1/1     Running   0          2m
frontend-6c8d9e7f5g-ghi56   1/1     Running   0          2m
frontend-6c8d9e7f5g-jkl78   1/1     Running   0          2m
mongo-7f9g8h6i5j-mno90      1/1     Running   0          2m
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 6. Kubernetes Management Commands

### View Resources

```bash
# Get all resources
kubectl get all -n collabsphere

# Get pods
kubectl get pods -n collabsphere

# Get services
kubectl get svc -n collabsphere

# Get deployments
kubectl get deployments -n collabsphere

# Describe a pod
kubectl describe pod <pod-name> -n collabsphere
```

### View Logs

```bash
# Backend logs
kubectl logs -f deployment/backend -n collabsphere

# Frontend logs
kubectl logs -f deployment/frontend -n collabsphere

# MongoDB logs
kubectl logs -f deployment/mongo -n collabsphere

# Logs from specific pod
kubectl logs <pod-name> -n collabsphere
```

### Scale Deployments

```bash
# Scale backend
kubectl scale deployment backend -n collabsphere --replicas=5

# Scale frontend
kubectl scale deployment frontend -n collabsphere --replicas=3

# Verify
kubectl get pods -n collabsphere
```

### Update Deployment

```bash
# Update image
kubectl set image deployment/backend backend=johndoe/collabsphere-backend:v2 -n collabsphere

# Rollout status
kubectl rollout status deployment/backend -n collabsphere

# Rollout history
kubectl rollout history deployment/backend -n collabsphere

# Rollback
kubectl rollout undo deployment/backend -n collabsphere
```

### Delete Resources

```bash
# Delete specific deployment
kubectl delete deployment backend -n collabsphere

# Delete all resources in namespace
kubectl delete all --all -n collabsphere

# Delete namespace (deletes everything)
kubectl delete namespace collabsphere
```

---

## 7. Troubleshooting

### Issue: Pods Not Starting

```bash
# Check pod status
kubectl get pods -n collabsphere

# Describe pod to see events
kubectl describe pod <pod-name> -n collabsphere

# Check logs
kubectl logs <pod-name> -n collabsphere
```

**Common Issues:**
- Image not found: Ensure image is loaded to Minikube
- CrashLoopBackOff: Check logs for application errors
- ImagePullBackOff: Check image name and availability

### Issue: Cannot Access Application

```bash
# Check services
kubectl get svc -n collabsphere

# Check if pods are running
kubectl get pods -n collabsphere

# Test from within cluster
kubectl run test --image=busybox -it --rm -- wget -O- http://backend-service.collabsphere:5000/api/health
```

### Issue: Minikube Not Running

```bash
# Check status
minikube status

# Start Minikube
minikube start --driver=docker

# If issues persist, delete and recreate
minikube delete
minikube start --driver=docker --cpus=2 --memory=4096
```

### Issue: Jenkins Cannot Access kubectl

```bash
# On EC2, configure kubectl for jenkins user
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube

# Restart Jenkins
sudo systemctl restart jenkins
```

---

## 8. Kubernetes vs Docker Compose

### When to Use Kubernetes (Minikube)

✅ Learning Kubernetes
✅ Need auto-scaling
✅ Want rolling updates
✅ Need service discovery
✅ Production-like environment

### When to Use Docker Compose

✅ Simpler setup
✅ Faster deployment
✅ Local development
✅ Less resource intensive
✅ Easier debugging

### Switching Between Modes

In `jenkins/Jenkinsfile`, change:
```groovy
DEPLOYMENT_MODE = 'kubernetes'  // or 'docker-compose'
```

Then rebuild the pipeline.

---

## 9. Production Considerations

### For Real Production (Not Minikube)

1. **Use Managed Kubernetes**:
   - AWS EKS
   - Google GKE
   - Azure AKS

2. **Use LoadBalancer Services**:
   ```yaml
   type: LoadBalancer  # Instead of NodePort
   ```

3. **Add Ingress Controller**:
   ```bash
   kubectl apply -f kubernetes/ingress.yaml
   ```

4. **Use Persistent Volumes**:
   ```yaml
   volumeMounts:
     - name: mongo-storage
       mountPath: /data/db
   volumes:
     - name: mongo-storage
       persistentVolumeClaim:
         claimName: mongo-pvc
   ```

5. **Add Resource Limits**:
   ```yaml
   resources:
     requests:
       memory: "256Mi"
       cpu: "250m"
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

6. **Configure Auto-scaling**:
   ```yaml
   apiVersion: autoscaling/v2
   kind: HorizontalPodAutoscaler
   metadata:
     name: backend-hpa
   spec:
     scaleTargetRef:
       apiVersion: apps/v1
       kind: Deployment
       name: backend
     minReplicas: 2
     maxReplicas: 10
     metrics:
     - type: Resource
       resource:
         name: cpu
         target:
           type: Utilization
           averageUtilization: 70
   ```

---

## 10. Quick Reference

### Essential Commands

```bash
# Deploy
kubectl apply -f kubernetes/

# Check status
kubectl get all -n collabsphere

# View logs
kubectl logs -f deployment/backend -n collabsphere

# Scale
kubectl scale deployment backend --replicas=5 -n collabsphere

# Delete
kubectl delete namespace collabsphere

# Port forward
kubectl port-forward svc/frontend-service 3000:80 -n collabsphere --address 0.0.0.0

# Get Minikube IP
minikube ip

# Access dashboard
minikube dashboard
```

### Access URLs

- **Frontend**: `http://$(minikube ip):30300`
- **Backend**: `http://$(minikube ip):30500`
- **Dashboard**: `minikube dashboard`

---

## 🎉 Congratulations!

You've successfully deployed CollabSphere to Kubernetes using Minikube!

**What You've Learned:**
- ✅ Kubernetes deployments and services
- ✅ Minikube for local Kubernetes
- ✅ Jenkins integration with Kubernetes
- ✅ kubectl commands
- ✅ Scaling and management
- ✅ Troubleshooting Kubernetes issues

**Next Steps:**
- Try scaling deployments
- Experiment with rolling updates
- Setup monitoring with Prometheus
- Deploy to a managed Kubernetes service (EKS/GKE/AKS)
