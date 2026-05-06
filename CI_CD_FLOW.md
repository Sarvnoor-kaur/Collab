# 🔄 CollabSphere CI/CD Pipeline Flow

## Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DEVELOPER WORKFLOW                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Code Changes    │
                    │  (Local Machine) │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Git Commit     │
                    │   Git Push       │
                    └────────┬─────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         GITHUB                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Repository: collabsphere                                 │  │
│  │  Branch: main                                             │  │
│  └────────────────────────┬─────────────────────────────────┘  │
└────────────────────────────┼────────────────────────────────────┘
                             │
                             │ Webhook Trigger
                             │ (http://EC2_IP:8080/github-webhook/)
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    JENKINS CI/CD PIPELINE                        │
│                    (Running on EC2)                              │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Stage 1: Clone Repository                              │    │
│  │ ✓ git clone https://github.com/user/collabsphere.git  │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Stage 2: Build Backend Docker Image                    │    │
│  │ ✓ docker build -t user/collabsphere-backend:latest    │    │
│  │ ✓ docker tag user/collabsphere-backend:BUILD_NUMBER   │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Stage 3: Build Frontend Docker Image                   │    │
│  │ ✓ docker build -t user/collabsphere-frontend:latest   │    │
│  │ ✓ docker tag user/collabsphere-frontend:BUILD_NUMBER  │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Stage 4: Push to Docker Hub                            │    │
│  │ ✓ docker login (using credentials)                    │    │
│  │ ✓ docker push user/collabsphere-backend:latest        │    │
│  │ ✓ docker push user/collabsphere-backend:BUILD_NUMBER  │    │
│  │ ✓ docker push user/collabsphere-frontend:latest       │    │
│  │ ✓ docker push user/collabsphere-frontend:BUILD_NUMBER │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Stage 5: Load Images to Minikube                       │    │
│  │ ✓ minikube image load user/collabsphere-backend       │    │
│  │ ✓ minikube image load user/collabsphere-frontend      │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Stage 6: Deploy to Kubernetes                          │    │
│  │ ✓ sed -i "s|DOCKERHUB_USERNAME|user|g" deployment.yaml│    │
│  │ ✓ kubectl apply -f kubernetes/deployment.yaml         │    │
│  │ ✓ kubectl apply -f kubernetes/service.yaml            │    │
│  │ ✓ kubectl rollout status deployment/backend           │    │
│  │ ✓ kubectl rollout status deployment/frontend          │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Stage 7: Verify Deployment                             │    │
│  │ ✓ kubectl get pods                                     │    │
│  │ ✓ kubectl get svc                                      │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
│                       ▼                                          │
│  ┌────────────────────────────────────────────────────────┐    │
│  │ Stage 8: Cleanup                                       │    │
│  │ ✓ docker logout                                        │    │
│  └────────────────────┬───────────────────────────────────┘    │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        ▼
              ┌──────────────────┐
              │  ✅ SUCCESS or   │
              │  ❌ FAILURE      │
              └────────┬─────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DEPLOYED APPLICATION                          │
│                  (Running on Kubernetes/Minikube)                │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐ │
│  │    Frontend      │  │     Backend      │  │   MongoDB    │ │
│  │  (React+Nginx)   │◄─┤   (Node.js)      │◄─┤  (Database)  │ │
│  │ NodePort: 30300  │  │ NodePort: 30500  │  │ Port: 27017  │ │
│  └──────────────────┘  └──────────────────┘  └──────────────┘ │
│                                                                  │
│  Access via: http://MINIKUBE_IP:30300 (Frontend)                │
│              http://MINIKUBE_IP:30500 (Backend)                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    MONITORING STACK                              │
│                                                                  │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │   Prometheus     │◄─────────────┤     Grafana      │        │
│  │  (Metrics)       │  Queries     │   (Dashboards)   │        │
│  │  Port: 9090      │              │   Port: 3001     │        │
│  └────────┬─────────┘              └──────────────────┘        │
│           │                                                      │
│           │ Scrapes metrics from                                │
│           │ /metrics endpoint                                   │
│           │                                                      │
│           ▼                                                      │
│  ┌──────────────────┐                                          │
│  │     Backend      │                                          │
│  │  /metrics        │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Stage Breakdown

### Stage 1: Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/collabsphere.git
cd collabsphere
```
**Purpose:** Get latest code from GitHub
**Duration:** ~10 seconds

### Stage 2: Build Backend Image
```bash
docker build -t johndoe/collabsphere-backend:latest \
  -f docker/backend.Dockerfile ./backend
docker tag johndoe/collabsphere-backend:latest \
  johndoe/collabsphere-backend:42
```
**Purpose:** Create Docker image for Node.js backend
**Duration:** ~2-3 minutes (first build), ~30 seconds (cached)

### Stage 3: Build Frontend Image
```bash
docker build -t johndoe/collabsphere-frontend:latest \
  -f docker/frontend.Dockerfile ./client
docker tag johndoe/collabsphere-frontend:latest \
  johndoe/collabsphere-frontend:42
```
**Purpose:** Create Docker image for React frontend with Nginx
**Duration:** ~3-4 minutes (first build), ~1 minute (cached)

### Stage 4: Push to Docker Hub
```bash
echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin
docker push johndoe/collabsphere-backend:latest
docker push johndoe/collabsphere-backend:42
docker push johndoe/collabsphere-frontend:latest
docker push johndoe/collabsphere-frontend:42
```
**Purpose:** Store images in Docker Hub registry
**Duration:** ~2-3 minutes

### Stage 5: Load Images to Minikube
```bash
minikube image load johndoe/collabsphere-backend:latest
minikube image load johndoe/collabsphere-frontend:latest
```
**Purpose:** Load Docker images into Minikube's Docker daemon
**Duration:** ~30 seconds

### Stage 6: Deploy to Kubernetes
```bash
sed -i "s|DOCKERHUB_USERNAME|${DOCKERHUB_USERNAME}|g" kubernetes/deployment.yaml
kubectl apply -f kubernetes/deployment.yaml
kubectl apply -f kubernetes/service.yaml
kubectl rollout status deployment/backend
kubectl rollout status deployment/frontend
```
**Purpose:** Deploy application to Kubernetes cluster
**Duration:** ~1-2 minutes

### Stage 7: Verify Deployment
```bash
kubectl get pods
kubectl get svc
```
**Purpose:** Verify all pods and services are running
**Duration:** ~5 seconds

### Stage 8: Cleanup
```bash
docker logout
```
**Purpose:** Logout from Docker Hub
**Duration:** ~2 seconds

## Total Pipeline Duration

- **First Build:** ~8-10 minutes
- **Subsequent Builds:** ~4-6 minutes (with Docker cache)

## Trigger Methods

### 1. Automatic (GitHub Webhook)
```
Developer pushes code → GitHub webhook → Jenkins builds automatically
```

### 2. Manual (Jenkins UI)
```
Jenkins Dashboard → collabsphere-pipeline → Build Now
```

### 3. Scheduled (Optional)
```
Configure in Jenkins: Build periodically
Example: H 2 * * * (Every day at 2 AM)
```

## Success Indicators

✅ All 8 stages show green checkmarks
✅ Console output shows "✅ CollabSphere deployed successfully on Kubernetes!"
✅ Pods are running: `kubectl get pods`
✅ Services are active: `kubectl get svc`
✅ Application accessible at http://MINIKUBE_IP:30300 (Frontend)
✅ Backend accessible at http://MINIKUBE_IP:30500 (Backend)

## Failure Handling

If any stage fails:
1. Pipeline stops immediately
2. Console output shows error details
3. Previous deployment remains running
4. Fix the issue and rebuild

## Monitoring Integration

```
Application → /metrics endpoint → Prometheus → Grafana Dashboards
```

**Metrics Collected:**
- HTTP request duration
- Request count
- Memory usage
- CPU usage
- Active connections

---

**This flow ensures:**
- ✅ Automated testing and deployment
- ✅ Zero-downtime deployments
- ✅ Rollback capability
- ✅ Continuous monitoring
- ✅ Production-ready infrastructure
