# Prometheus Queries for CollabSphere Monitoring

## System Metrics

### CPU Usage
```promql
# CPU usage percentage per pod
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)

# CPU usage by container
rate(container_cpu_usage_seconds_total[5m]) * 100

# CPU usage for specific pod
rate(container_cpu_usage_seconds_total{pod=~"backend.*"}[5m]) * 100
```

### Memory Usage
```promql
# Memory usage percentage
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100

# Memory usage by container
container_memory_usage_bytes{pod=~"backend.*|frontend.*|mongo.*"}

# Memory usage in MB
container_memory_usage_bytes / 1024 / 1024

# Memory limit vs usage
container_memory_usage_bytes / container_spec_memory_limit_bytes * 100
```

### Disk Usage
```promql
# Disk usage percentage
(node_filesystem_size_bytes - node_filesystem_free_bytes) / node_filesystem_size_bytes * 100

# Available disk space in GB
node_filesystem_avail_bytes / 1024 / 1024 / 1024
```

### Network Traffic
```promql
# Network receive rate (bytes/sec)
rate(node_network_receive_bytes_total[5m])

# Network transmit rate (bytes/sec)
rate(node_network_transmit_bytes_total[5m])

# Total network traffic
rate(node_network_receive_bytes_total[5m]) + rate(node_network_transmit_bytes_total[5m])
```

## Kubernetes Metrics

### Pod Status
```promql
# Number of running pods
count(kube_pod_status_phase{phase="Running", namespace="collabsphere"})

# Pod restart count
kube_pod_container_status_restarts_total{namespace="collabsphere"}

# Pods not ready
kube_pod_status_ready{condition="false", namespace="collabsphere"}

# Pod status by phase
kube_pod_status_phase{namespace="collabsphere"}
```

### Container Metrics
```promql
# Container restart count in last 1 hour
increase(kube_pod_container_status_restarts_total{namespace="collabsphere"}[1h])

# Container CPU throttling
rate(container_cpu_cfs_throttled_seconds_total{namespace="collabsphere"}[5m])

# Container OOM kills
container_memory_failures_total{scope="container", type="oom_kill"}
```

### Deployment Status
```promql
# Available replicas vs desired replicas
kube_deployment_status_replicas_available{namespace="collabsphere"} / kube_deployment_spec_replicas{namespace="collabsphere"}

# Unavailable replicas
kube_deployment_status_replicas_unavailable{namespace="collabsphere"}
```

## Application Metrics (Node.js Backend)

### HTTP Request Metrics
```promql
# Request rate (requests per second)
rate(http_requests_total[5m])

# Request rate by status code
rate(http_requests_total{status=~"2.."}[5m])  # Success
rate(http_requests_total{status=~"4.."}[5m])  # Client errors
rate(http_requests_total{status=~"5.."}[5m])  # Server errors

# Total requests in last 5 minutes
increase(http_requests_total[5m])

# Request rate by endpoint
sum(rate(http_requests_total[5m])) by (path)
```

### Response Time
```promql
# Average response time
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

# 95th percentile response time
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# 99th percentile response time
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Response time by endpoint
histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (path, le))
```

### Error Rate
```promql
# Error rate percentage
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# 4xx error rate
sum(rate(http_requests_total{status=~"4.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Error count in last hour
increase(http_requests_total{status=~"5.."}[1h])
```

### Node.js Process Metrics
```promql
# Heap memory used
nodejs_heap_size_used_bytes

# Heap memory total
nodejs_heap_size_total_bytes

# Heap usage percentage
nodejs_heap_size_used_bytes / nodejs_heap_size_total_bytes * 100

# Event loop lag
nodejs_eventloop_lag_seconds

# Active handles
nodejs_active_handles_total

# Active requests
nodejs_active_requests_total

# Garbage collection duration
rate(nodejs_gc_duration_seconds_sum[5m])
```

## MongoDB Metrics

### Connection Metrics
```promql
# Active connections
mongodb_connections{state="current"}

# Available connections
mongodb_connections{state="available"}

# Connection usage percentage
mongodb_connections{state="current"} / (mongodb_connections{state="current"} + mongodb_connections{state="available"}) * 100
```

### Operation Metrics
```promql
# Operations per second
rate(mongodb_op_counters_total[5m])

# Query operations
rate(mongodb_op_counters_total{type="query"}[5m])

# Insert operations
rate(mongodb_op_counters_total{type="insert"}[5m])

# Update operations
rate(mongodb_op_counters_total{type="update"}[5m])

# Delete operations
rate(mongodb_op_counters_total{type="delete"}[5m])
```

### Database Size
```promql
# Database size in MB
mongodb_dbstats_dataSize / 1024 / 1024

# Index size in MB
mongodb_dbstats_indexSize / 1024 / 1024

# Total storage size
mongodb_dbstats_storageSize / 1024 / 1024
```

## Socket.IO Metrics (WebSocket)

### Connection Metrics
```promql
# Active WebSocket connections
socketio_connected_clients

# Connection rate
rate(socketio_connections_total[5m])

# Disconnection rate
rate(socketio_disconnections_total[5m])
```

### Message Metrics
```promql
# Messages sent per second
rate(socketio_messages_sent_total[5m])

# Messages received per second
rate(socketio_messages_received_total[5m])

# Message rate by event type
rate(socketio_messages_sent_total[5m]) by (event)
```

## Alerting Queries

### Critical Alerts
```promql
# High CPU usage (>80%)
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80

# High memory usage (>80%)
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 80

# Disk space low (<10% free)
(node_filesystem_avail_bytes / node_filesystem_size_bytes * 100) < 10

# Pod not running
kube_pod_status_phase{phase!="Running", namespace="collabsphere"} == 1

# High error rate (>5%)
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 5

# Pod restart in last 5 minutes
increase(kube_pod_container_status_restarts_total{namespace="collabsphere"}[5m]) > 0
```

### Warning Alerts
```promql
# Moderate CPU usage (>60%)
100 - (avg by (instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 60

# Moderate memory usage (>60%)
(node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 60

# Slow response time (>1s at 95th percentile)
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 1

# High event loop lag (>100ms)
nodejs_eventloop_lag_seconds > 0.1
```

## Dashboard Queries

### Overview Dashboard
```promql
# Total requests per minute
sum(rate(http_requests_total[1m])) * 60

# Success rate
sum(rate(http_requests_total{status=~"2.."}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Average response time
avg(rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m]))

# Active users (WebSocket connections)
socketio_connected_clients

# Pod health
count(kube_pod_status_phase{phase="Running", namespace="collabsphere"})
```

### Performance Dashboard
```promql
# Request latency by percentile
histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))  # p50
histogram_quantile(0.90, rate(http_request_duration_seconds_bucket[5m]))  # p90
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))  # p95
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))  # p99

# Throughput by endpoint
topk(10, sum(rate(http_requests_total[5m])) by (path))

# Error rate by endpoint
topk(10, sum(rate(http_requests_total{status=~"5.."}[5m])) by (path))
```

### Resource Usage Dashboard
```promql
# CPU usage by pod
sum(rate(container_cpu_usage_seconds_total{namespace="collabsphere"}[5m])) by (pod) * 100

# Memory usage by pod
sum(container_memory_usage_bytes{namespace="collabsphere"}) by (pod) / 1024 / 1024

# Network I/O by pod
sum(rate(container_network_receive_bytes_total{namespace="collabsphere"}[5m])) by (pod)
sum(rate(container_network_transmit_bytes_total{namespace="collabsphere"}[5m])) by (pod)
```

## How to Use These Queries

### In Prometheus UI
1. Access Prometheus: `http://3.109.46.217:9090`
2. Go to "Graph" tab
3. Paste any query from above
4. Click "Execute"
5. View results in Table or Graph format

### In Grafana
1. Access Grafana: `http://3.109.46.217:3000`
2. Create new dashboard or panel
3. Select Prometheus as data source
4. Paste query in "Metrics browser"
5. Customize visualization (Graph, Gauge, Stat, etc.)
6. Set refresh interval and time range

### For Alerts
1. In Prometheus: Create alert rules in `prometheus.yml`
2. In Grafana: Go to Alerting → Alert rules
3. Use queries with threshold conditions
4. Configure notification channels

## Common Time Ranges

- `[5m]` - Last 5 minutes
- `[1h]` - Last 1 hour
- `[1d]` - Last 1 day
- `[7d]` - Last 7 days

## Common Functions

- `rate()` - Per-second rate over time range
- `increase()` - Total increase over time range
- `avg()` - Average value
- `sum()` - Sum of values
- `max()` - Maximum value
- `min()` - Minimum value
- `topk(n, query)` - Top N results
- `histogram_quantile()` - Calculate percentiles
- `by (label)` - Group by label
