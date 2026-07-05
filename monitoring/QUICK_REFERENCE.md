# 🚀 Monitoring Quick Reference

## Access URLs

```
Prometheus:  http://localhost:9090
Grafana:     http://localhost:3000
Backend:     http://localhost:8080
```

## Grafana Login

```
Username: admin
Password: admin
```

## Common Grafana Queries

### 📊 Dashboard Panels

#### Panel 1: Average Latency by Endpoint
```promql
sum by (path) (rate(http_endpoint_latency_seconds_sum[5m])) 
  / sum by (path) (rate(http_endpoint_latency_seconds_count[5m])) * 1000
```
- Unit: `ms`
- Thresholds: Green (<100ms), Orange (100-500ms), Red (>500ms)

#### Panel 2: P99 Latency (99th Percentile)
```promql
histogram_quantile(0.99, sum(rate(http_endpoint_latency_seconds_bucket[5m])) by (le, path)) * 1000
```
- Unit: `ms`
- Thresholds: Green (<200ms), Orange (200-500ms), Red (>500ms)

#### Panel 3: Request Rate
```promql
sum by (path, method, status) (rate(http_endpoint_requests_total[1m])) > 0
```
- Unit: `reqps`
- Show: Table with top 10

#### Panel 4: Error Rate
```promql
sum by (path) (rate(http_endpoint_errors_total[5m])) > 0
```
- Unit: `ops`
- Color: Red when > 0

#### Panel 5: Top 10 Slowest Endpoints
```promql
topk(10, sum by (path, method) (rate(http_endpoint_latency_seconds_sum[5m])) 
  / sum by (path, method) (rate(http_endpoint_latency_seconds_count[5m])) * 1000)
```
- Type: Table
- Sort: Value descending
- Unit: `ms`

#### Panel 6: Error Rate by Endpoint (%)
```promql
(sum by (path) (rate(http_endpoint_errors_total[5m])) /
 sum by (path) (rate(http_endpoint_requests_total[5m]))) * 100
```
- Unit: `percent`
- Thresholds: Green (<1%), Orange (1-5%), Red (>5%)

---

## Prometheus Query Examples

### Performance Analysis

```promql
# Endpoints slower than 500ms
sum by (path) (rate(http_endpoint_latency_seconds_sum[5m])) 
  / sum by (path) (rate(http_endpoint_latency_seconds_count[5m])) > 0.5

# RPS by endpoint (traffic distribution)
sum by (path) (rate(http_endpoint_requests_total[5m]))

# 5xx errors only
sum by (path) (rate(http_endpoint_errors_total{status=~"5.*"}[5m]))
```

### Resource Analysis

```promql
# CPU usage trend
system_cpu_usage * 100

# Heap memory usage %
(sum(jvm_memory_used_bytes{area="heap"}) / 
 sum(jvm_memory_max_bytes{area="heap"})) * 100

# GC pause time
rate(jvm_gc_pause_seconds_sum[5m])
```

---

## Quick Troubleshooting

### Issue: Grafana shows "No data"
```bash
# 1. Check Prometheus is scraping backend
curl http://localhost:9090/targets

# 2. Make API calls to generate metrics
curl http://localhost:8080/api/news

# 3. Check Prometheus has data
curl http://localhost:9090/api/v1/query?query=http_endpoint_requests_total
```

### Issue: Latency metrics missing
```bash
# 1. Verify MetricsFilter is loaded
curl http://localhost:8080/actuator/metrics

# 2. Look for http.endpoint.latency
curl http://localhost:8080/actuator/prometheus | grep http_endpoint

# 3. Check filter order in logs
docker logs backend | grep MetricsFilter
```

### Issue: High error rate spike
```bash
# Check what endpoints are failing
sum by (path, status) (rate(http_endpoint_errors_total[5m]))

# Check error logs
docker logs backend | grep -i error | tail -20
```

---

## Performance Benchmarks

### Expected Baseline (No Load)

| Metric | Value |
|--------|-------|
| Avg Latency (P50) | 10-50ms |
| P99 Latency | 50-200ms |
| RPS | < 100 |
| Error Rate | < 0.1% |
| CPU Usage | 5-10% |
| Heap Memory | 20-30% |

### High Traffic Baseline

| Metric | Value |
|--------|-------|
| Avg Latency (P50) | 50-200ms |
| P99 Latency | 200-500ms |
| RPS | 1000-5000 |
| Error Rate | < 1% |
| CPU Usage | 50-80% |
| Heap Memory | 60-85% |

---

## Import Enhanced Dashboard

### Option 1: Web UI
```
1. Go to http://localhost:3000
2. Click "+" → Import Dashboard
3. Upload grafana_dashboard_enhanced.json
4. Select Prometheus as data source
5. Click Import
```

### Option 2: Command Line
```bash
curl -X POST http://localhost:3000/api/dashboards/db \
  -H "Content-Type: application/json" \
  -d @grafana_dashboard_enhanced.json
```

### Option 3: Docker Volume
```bash
# Copy to provisioning directory
docker cp grafana_dashboard_enhanced.json \
  <grafana-container>:/etc/grafana/provisioning/dashboards/

# Restart container
docker restart <grafana-container>
```

---

## Useful Commands

### Docker Commands

```bash
# View container logs
docker logs -f <container_name>

# View specific metric in Prometheus
docker exec <prometheus> \
  curl http://localhost:9090/api/v1/query?query=http_endpoint_requests_total

# Restart services
docker-compose restart backend prometheus grafana
```

### Prometheus API

```bash
# Query instant value
curl 'http://localhost:9090/api/v1/query?query=http_endpoint_requests_total'

# Query range
curl 'http://localhost:9090/api/v1/query_range?query=http_endpoint_requests_total&start=1h&end=now&step=5m'

# List available metrics
curl 'http://localhost:9090/api/v1/label/__name__/values'

# Export metrics
curl http://localhost:9090/metrics
```

### Backend Actuator

```bash
# List all metrics
curl http://localhost:8080/actuator/metrics

# Get specific metric
curl http://localhost:8080/actuator/metrics/http.endpoint.latency

# Export to Prometheus format
curl http://localhost:8080/actuator/prometheus
```

---

## Alert Examples

### Alert: Slow Endpoint
```promql
histogram_quantile(0.99, http_endpoint_latency_seconds_bucket{path="/api/admin/news"}) > 1
```

### Alert: High Error Rate
```promql
(sum(http_endpoint_errors_total) / sum(http_endpoint_requests_total)) > 0.01
```

### Alert: Memory Pressure
```promql
(jvm_memory_used_bytes{area="heap"} / jvm_memory_max_bytes{area="heap"}) > 0.9
```

### Alert: No Traffic
```promql
sum(rate(http_endpoint_requests_total[5m])) == 0
```

---

## File Locations

```
monitoring/
├── QUICK_REFERENCE.md          ← You are here
├── MONITORING_GUIDE.md         ← Full documentation
├── prometheus.yml              ← Config
├── prometheus_rules.yml        ← Alert rules
├── grafana_dashboard.json      ← Original dashboard
└── grafana_dashboard_enhanced.json ← New dashboard

backend/config/
└── MetricsFilter.java          ← Request interceptor
```

---

## Key Metrics to Watch

1. **P99 Latency** - Most important for user experience
   - Alert if > 1 second
   - Target: < 200ms

2. **Error Rate** - Reliability indicator
   - Alert if > 1%
   - Target: < 0.1%

3. **CPU Usage** - Resource pressure
   - Alert if > 80%
   - Target: < 60%

4. **Heap Memory** - Memory pressure
   - Alert if > 90%
   - Target: < 80%

5. **GC Pause Time** - Performance impact
   - Alert if > 500ms
   - Target: < 100ms

---

## Next Steps

1. ✅ Open Grafana dashboard
2. ✅ Review current endpoint performance
3. ✅ Identify slowest endpoints
4. ✅ Check error rates
5. ✅ Monitor for anomalies
6. ✅ Plan optimizations

