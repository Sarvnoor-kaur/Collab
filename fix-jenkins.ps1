# Quick Fix for Jenkins Java Version Issue
# Run this from Windows PowerShell

param(
    [string]$PemFile = "C:\Users\sarvn\Downloads\collabsphere-key.pem",
    [string]$EC2_IP = "13.127.104.70"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Fixing Jenkins Java Version Issue" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Copying fix script to EC2..." -ForegroundColor Yellow
& scp -i $PemFile -o StrictHostKeyChecking=no fix-jenkins-java.sh "ubuntu@${EC2_IP}:/tmp/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to copy script!" -ForegroundColor Red
    exit 1
}

Write-Host "Running fix on EC2..." -ForegroundColor Yellow
Write-Host "This will take about 60 seconds..." -ForegroundColor Cyan
Write-Host ""

& ssh -i $PemFile -o StrictHostKeyChecking=no "ubuntu@$EC2_IP" "chmod +x /tmp/fix-jenkins-java.sh && /tmp/fix-jenkins-java.sh"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Fix script failed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Jenkins URL: http://${EC2_IP}:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Get Jenkins password:" -ForegroundColor Yellow
Write-Host "  ssh -i `"$PemFile`" ubuntu@$EC2_IP 'sudo cat /var/lib/jenkins/secrets/initialAdminPassword'" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Open http://${EC2_IP}:8080 in browser" -ForegroundColor White
Write-Host "2. Get password using command above" -ForegroundColor White
Write-Host "3. Install suggested plugins" -ForegroundColor White
Write-Host "4. Create admin user" -ForegroundColor White
Write-Host "5. Configure Docker Hub credentials" -ForegroundColor White
Write-Host "6. Create pipeline job" -ForegroundColor White
Write-Host ""
