# CollabSphere Windows Setup Script
param(
    [string]$PemFile = "C:\Users\sarvn\Downloads\collabsphere-key.pem"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "CollabSphere Windows Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check Terraform
if (!(Get-Command terraform -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Terraform not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Creating EC2 Instance with Terraform" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Set-Location terraform

terraform init
terraform apply -auto-approve

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Terraform failed!" -ForegroundColor Red
    exit 1
}

$EC2_IP = terraform output -raw instance_public_ip
Write-Host "EC2 Created: $EC2_IP" -ForegroundColor Green
Write-Host ""

Set-Location ..

# Wait for EC2
Write-Host "Step 2: Waiting for EC2 to boot..." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "Waiting 60 seconds..."
Start-Sleep -Seconds 60

# Create installation script
$INSTALL_SCRIPT = @'
#!/bin/bash
set -x
echo "Starting installation..."

wait_for_apt() {
  while sudo fuser /var/lib/dpkg/lock-frontend >/dev/null 2>&1; do
    echo "Waiting for apt lock..."
    sleep 5
  done
}

wait_for_apt
sudo apt-get update -y

echo "Installing Docker..."
wait_for_apt
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ubuntu

echo "Installing Java 11..."
wait_for_apt
sudo apt-get install -y openjdk-11-jdk

echo "Installing Jenkins (Java 11 compatible version)..."
# Create Jenkins user and directories
sudo useradd -m -s /bin/bash jenkins || true
sudo mkdir -p /opt/jenkins
sudo mkdir -p /var/lib/jenkins

# Download Jenkins 2.440.3 (last LTS supporting Java 11)
sudo wget -O /opt/jenkins/jenkins.war https://get.jenkins.io/war-stable/2.440.3/jenkins.war

# Set permissions
sudo chown -R jenkins:jenkins /opt/jenkins
sudo chown -R jenkins:jenkins /var/lib/jenkins
sudo chmod 644 /opt/jenkins/jenkins.war

# Create systemd service
sudo tee /etc/systemd/system/jenkins.service > /dev/null <<'JENKINS_SERVICE'
[Unit]
Description=Jenkins
After=network.target

[Service]
Type=simple
User=jenkins
Environment="JENKINS_HOME=/var/lib/jenkins"
ExecStart=/usr/bin/java -jar /opt/jenkins/jenkins.war --httpPort=8080
Restart=on-failure

[Install]
WantedBy=multi-user.target
JENKINS_SERVICE

# Add jenkins to docker group
sudo usermod -aG docker jenkins

# Start Jenkins
sudo systemctl daemon-reload
sudo systemctl enable jenkins
sudo systemctl start jenkins

echo "Installing kubectl..."
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
rm kubectl

echo "Installing Minikube..."
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube
rm minikube-linux-amd64

echo "SETUP_COMPLETE" | sudo tee /tmp/setup-complete.txt
echo "Installation complete!"
'@

Write-Host "Step 3: Installing Docker, Jenkins, etc." -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow
Write-Host "This will take 5-10 minutes..." -ForegroundColor Cyan
Write-Host ""

# Save script with Unix line endings
$INSTALL_SCRIPT | Out-File -FilePath "install-temp.sh" -Encoding UTF8

# Convert to Unix line endings
$content = Get-Content "install-temp.sh" -Raw
$content = $content -replace "`r`n", "`n"
[System.IO.File]::WriteAllText("install-temp.sh", $content)

# Copy to EC2
Write-Host "Copying installation script to EC2..."
& scp -i $PemFile -o StrictHostKeyChecking=no install-temp.sh "ubuntu@${EC2_IP}:/tmp/install.sh"

# Run on EC2
Write-Host "Running installation on EC2..."
& ssh -i $PemFile -o StrictHostKeyChecking=no "ubuntu@$EC2_IP" "chmod +x /tmp/install.sh; /tmp/install.sh"

# Clean up
Remove-Item install-temp.sh -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "Step 4: Starting Minikube" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

$MinikubeCommands = @"
minikube start --driver=docker --cpus=2 --memory=4096
minikube addons enable ingress
sudo mkdir -p /var/lib/jenkins/.kube
sudo cp ~/.kube/config /var/lib/jenkins/.kube/config
sudo chown -R jenkins:jenkins /var/lib/jenkins/.kube
sudo systemctl restart jenkins
"@

& ssh -i $PemFile "ubuntu@$EC2_IP" $MinikubeCommands

Write-Host ""
Write-Host "Step 5: Verification" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Yellow

$VerifyCommands = "docker --version; java -version 2>&1 | head -n 1; sudo systemctl is-active jenkins; kubectl version --client 2>&1 | head -n 1; minikube status | head -n 1"
& ssh -i $PemFile "ubuntu@$EC2_IP" $VerifyCommands

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "EC2 IP: $EC2_IP" -ForegroundColor Cyan
Write-Host "Jenkins URL: http://${EC2_IP}:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Get Jenkins password:" -ForegroundColor Yellow
Write-Host "  ssh -i `"$PemFile`" ubuntu@$EC2_IP 'sudo cat /var/lib/jenkins/secrets/initialAdminPassword'" -ForegroundColor White
Write-Host ""
Write-Host "Connect to EC2:" -ForegroundColor Yellow
Write-Host "  ssh -i `"$PemFile`" ubuntu@$EC2_IP" -ForegroundColor White
Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
