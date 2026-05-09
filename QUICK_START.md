# ⚡ Quick Start Guide

## 3 Simple Steps

### 1️⃣ Create K8s EC2 (5 min)

```powershell
cd terraform
terraform apply
```

Copy the IPs from output.

### 2️⃣ Setup SSH (5 min)

**On K8s Server:**
```bash
ssh -i <PEM_FILE> ubuntu@<K8S_PUBLIC_IP>
ssh-keygen -t rsa -b 4096 -f ~/.ssh/jenkins_key -N ""
cat ~/.ssh/jenkins_key.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/jenkins_key  # Copy this
```

**On Jenkins Server:**
```bash
ssh -i <PEM_FILE> ubuntu@13.233.75.163
sudo su - jenkins
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/k8s_key  # Paste key, save
chmod 600 ~/.ssh/k8s_key
```

### 3️⃣ Configure Jenkins (5 min)

1. Open: `http://13.233.75.163:8080`
2. Install "SSH Agent" plugin
3. Add 3 credentials:
   - `k8s-ssh-key` (SSH private key)
   - `k8s-server-ip` (K8s private IP)
   - `dockerhub-credentials` (Docker Hub login)
4. Create/update pipeline with `jenkins/Jenkinsfile`
5. Build Now!

## Done! 🎉

Access your app:
- Frontend: `http://<K8S_IP>:30300`
- Backend: `http://<K8S_IP>:30500`
- Prometheus: `http://<K8S_IP>:9090`
- Grafana: `http://<K8S_IP>:3001`

## Need Help?

Read the full [README.md](README.md) for detailed instructions and troubleshooting.
