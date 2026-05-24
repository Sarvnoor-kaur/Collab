# 🎨 Visual Diagrams for Presentation

## 1. Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USERS (Browser)                                │
│  • Login/Register  • Chat Interface  • Video Calls  • User Discovery    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    HTTP/HTTPS + WebSocket (Socket.io)
                                 │
┌────────────────────────────────┴────────────────────────────────────────┐
│                        AWS CLOUD (Mumbai Region)                         │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  EC2 Instance 1: Jenkins-Docker (m7i.flex.large)                │   │
│  │  • Jenkins CI/CD Server                                          │   │
│  │  • Docker Engine                                                 │   │
│  │  • Builds & Deploys Application                                  │   │
│  │  Port: 8080                                                       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                         │
│                                 │ SSH + kubectl                           │
│                                 ↓                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  EC2 Instance 2: K8s-Server (t3.xlarge)                         │   │
│  │                                                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │  Kubernetes Cluster (K3s)                                │   │   │
│  │  │                                                           │   │   │
│  │  │  ┌──────────────────┐    ┌──────────────────┐          │   │   │
│  │  │  │  Frontend Pods   │    │  Backend Pods    │          │   │   │
│  │  │  │  (2 replicas)    │    │  (2 replicas)    │          │   │   │
│  │  │  │  • React + Nginx │    │  • Node.js       │          │   │   │
│  │  │  │  • Port 80       │    │  • Express       │          │   │   │
│  │  │  │  • NodePort      │    │  • Socket.io     │          │   │   │
│  │  │  │    30300         │    │  • Port 5000     │          │   │   │
│  │  │  └──────────────────┘    │  • NodePort      │          │   │   │
│  │  │                           │    30500         │          │   │   │
│  │  │                           └──────────────────┘          │   │   │
│  │  │                                    │                     │   │   │
│  │  │                                    ↓                     │   │   │
│  │  │                           ┌──────────────────┐          │   │   │
│  │  │                           │  MongoDB Pod     │          │   │   │
│  │  │                           │  (1 replica)     │          │   │   │
│  │  │                           │  • Port 27017    │          │   │   │
│  │  │                           │  • ClusterIP     │          │   │   │
│  │  │                           └──────────────────┘          │   │   │
│  │  └─────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                 │                                         │
│                                 │ Metrics Scraping                        │
│                                 ↓                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  EC2 Instance 3: Monitoring-Server (t2.medium)                  │   │
│  │  • Prometheus (Port 9090) - Metrics Collection                  │   │
│  │  • Grafana (Port 3001) - Visualization                          │   │
│  │  • Node Exporter - System Metrics                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Backend Request Flow (Detailed)

```
USER BROWSER
     │
     │ 1. HTTP Request
     │    POST /api/auth/login
     │    Body: { email, password }
     ↓
┌────────────────────────────────────────┐
│  KUBERNETES SERVICE (Load Balancer)    │
│  • Receives request on NodePort 30500  │
│  • Distributes to backend pods         │
└────────────────┬───────────────────────┘
                 │
                 │ 2. Routes to Pod
                 ↓
┌────────────────────────────────────────┐
│  BACKEND POD (Node.js/Express)         │
│                                         │
│  ┌──────────────────────────────────┐ │
│  │  server.js                        │ │
│  │  • Receives HTTP request          │ │
│  │  • Applies middleware             │ │
│  └──────────┬───────────────────────┘ │
│             │                          │
│             │ 3. Middleware Chain      │
│             ↓                          │
│  ┌──────────────────────────────────┐ │
│  │  Middleware Stack                 │ │
│  │  1. express.json() - Parse body   │ │
│  │  2. cookieParser() - Parse cookies│ │
│  │  3. cors() - CORS headers         │ │
│  └──────────┬───────────────────────┘ │
│             │                          │
│             │ 4. Route Matching        │
│             ↓                          │
│  ┌──────────────────────────────────┐ │