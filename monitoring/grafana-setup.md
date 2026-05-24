# Grafana Setup Guide

## Installation on EC2

```bash
# Add Grafana repository
sudo apt-get install -y software-properties-common
sudo add-apt-repository "deb https://packages.grafana.com/oss/deb stable main"
wget -q -O - https://packages.grafana.com/gpg.key | sudo apt-key add -

# Install Grafana
sudo apt-get update
sudo apt-get install -y grafana

# Start Grafana
sudo systemctl start grafana-server
sudo systemctl enable grafana-server
```

## Access Grafana

1. Open browser: `http://YOUR_EC2_IP:3001`
2. Default credentials:
   - Username: `admin`
   - Password: `admin`
3. Change password when prompted

## Add Prometheus Data Source

1. Click ⚙️ (Configuration) → Data Sources
2. Click "Add data source"
3. Select "Prometheus"
4. Configure:
   - Name: `Prometheus`
   - URL: `http://localhost:9090`
   - Access: `Server (default)`
5. Click "Save & Test"

## Import Dashboards

### Node.js Application Metrics
1. Click + → Import
2. Enter Dashboard ID: `11159`
3. Select Prometheus data source
4. Click "Import"

### System Metrics
1. Click + → Import
2. Enter Dashboard ID: `1860`
3. Select Prometheus data source
4. Click "Import"

## Create Custom Dashboard

1. Click + → Dashboard
2. Add Panel
3. Query examples:
   - `rate(http_requests_total[5m])` - Request rate
   - `http_request_duration_seconds` - Response time
   - `nodejs_heap_size_used_bytes` - Memory usage
4. Save dashboard

## Setup Alerts

1. Go to Alerting → Alert rules
2. Create new alert rule
3. Configure conditions:
   - High CPU: `cpu_usage > 80`
   - High Memory: `memory_usage > 80`
   - Service Down: `up == 0`
4. Add notification channel (Email, Slack, etc.)
