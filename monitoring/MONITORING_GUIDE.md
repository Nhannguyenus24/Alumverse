# 📊 Backend Latency Monitoring Guide

## Overview

This document describes the endpoint latency monitoring system for the Alumniverse backend. All HTTP endpoints are automatically monitored for:
- **Latency** (p50, p95, p99)
- **Request Rate** (RPS)
- **Error Rate**
- **Performance Trends**

---

## Architecture

### Components

```
┌──────────────────┐
│  Spring Boot     │
│  Application     │
└────────┬─────────┘
         │
    ┌────▼──────────────┐
    │  MetricsFilter    │  ← Intercepts ALL requests
    │  (New)            │
    └────┬──────────────┘
         │
    ┌────▼──────────────────────┐
    │  MeterRegistry            │
    │  (Micrometer)             │
    └────┬───────────────────────┘
         │
    ┌────▼──────────────┐
    │  Prometheus       │
    │  /actuator/prometheus
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │  Grafana          │
    │  Dashboards       │
    └───────────────────┘
```

### Metrics Collected

#### 1. **http.endpoint.latency** (Histogram)
```
Tags: method, path, status
Values: p50, p95, p99 percentiles
Unit: milliseconds
```

**Usage:**
```promql
# Average latency for GET /api/news
sum(rate(http_endpoint_latency_seconds_sum[5m])) 
  / sum(rate(http_endpoint_latency_seconds_count[5m])) * 1000

# P99 latency for specific endpoint
histogram_quantile(0.99, sum(rate(http_endpoint_latency_seconds_bucket[5m])) by (le, path))
```

#### 2. **http.endpoint.requests** (Counter)
```
Tags: method, path, status
Unit: count
```

**Usage:**
```promql
# Total requests per second
sum(rate(http_endpoint_requests_total[1m]))

# RPS by endpoint
sum by (path) (rate(http_endpoint_requests_total[1m]))
```

#### 3. **http.endpoint.errors** (Counter)
```
Tags: method, path, status
Unit: count
Recorded only for status >= 400
```

**Usage:**
```promql
# Error rate (%)
(sum(http_endpoint_errors_total) / sum(http_endpoint_requests_total)) * 100

# Errors by endpoint
sum by (path) (rate(http_endpoint_errors_total[5m]))
```

---

## Grafana Dashboards

### Available Dashboards

#### 1. **Original Dashboard** (grafana_dashboard.json)
Basic metrics:
- Total API Requests
- API Errors
- Average Latency (by URI)
- Requests per Second
- P99 Latency
- System metrics (CPU, Memory)

#### 2. **Enhanced Dashboard** (grafana_dashboard_enhanced.json) ⭐ NEW
Comprehensive endpoint latency analysis:
- Overview statistics
- Average latency by endpoint
- P99, P95, P50 latencies
- Request rates by endpoint
- Error rates by endpoint
- **Top 10 slowest endpoints**
- **Endpoints with highest error rates**
- System resource metrics

### Accessing Dashboards

```bash
# Grafana URL
http://localhost:3000

# Default credentials
Username: admin
Password: admin

# Import Enhanced Dashboard
1. Go to Dashboards → Import
2. Upload grafana_dashboard_enhanced.json
3. Select Prometheus as data source
```

---

## Prometheus Queries

### Common Queries

#### Average Latency by Endpoint
```promql
sum by (path) (rate(http_endpoint_latency_seconds_sum[5m])) 
  / sum by (path) (rate(http_endpoint_latency_seconds_count[5m])) * 1000
```

#### P99 Latency (99th Percentile)
```promql
histogram_quantile(0.99, sum(rate(http_endpoint_latency_seconds_bucket[5m])) by (le, path)) * 1000
```

#### P95 Latency (95th Percentile)
```promql
histogram_quantile(0.95, sum(rate(http_endpoint_latency_seconds_bucket[5m])) by (le, path)) * 1000
```

#### Top 10 Slowest Endpoints
```promql
topk(10, sum by (path) (rate(http_endpoint_latency_seconds_sum[5m])) 
  / sum by (path) (rate(http_endpoint_latency_seconds_count[5m])))
```

#### Request Rate by Endpoint
```promql
sum by (path, method) (rate(http_endpoint_requests_total[1m]))
```

#### Error Rate (Percentage)
```promql
(sum(http_endpoint_errors_total) / sum(http_endpoint_requests_total)) * 100
```

#### Errors by Endpoint
```promql
sum by (path, status) (rate(http_endpoint_errors_total[5m]))
```

#### 4xx vs 5xx Errors
```promql
# 4xx errors
sum(http_endpoint_errors_total{status=~"4.*"})

# 5xx errors
sum(http_endpoint_errors_total{status=~"5.*"})
```

---

## How It Works

### MetricsFilter (Spring Filter)

The `MetricsFilter` class intercepts all HTTP requests and:

1. **Records request start time**
2. **Processes the request through the filter chain**
3. **Calculates elapsed time**
4. **Records metrics** to MeterRegistry:
   - Latency histogram
   - Request counter
   - Error counter (if status >= 400)
5. **Logs slow requests** (> 1000ms)

### Path Normalization

To prevent metric cardinality explosion, the filter normalizes paths:

```
/users/123    → /users/{id}
/news/456     → /news/{id}
/events/789   → /events/{id}
/chat/groups/999/avatar → /chat/groups/{id}/avatar
```

### Excluded Endpoints

The following endpoints are NOT monitored (to reduce noise):
- `/actuator/*` (health checks, metrics)
- `/swagger*` (API documentation)
- `/v3/api-docs` (OpenAPI spec)
- `/static/*` (static files)
- CSS, JS, image files

---

## Metrics Interpretation

### Latency SLOs (Service Level Objectives)

```
✅ GOOD:      P99 < 100ms  (Fast endpoint)
⚠️  WARNING:   P99 100-500ms (Acceptable)
🔴 BAD:       P99 > 500ms  (Slow endpoint)
🚨 CRITICAL:  P99 > 1000ms (Very slow)
```

### Error Rate SLOs

```
✅ GOOD:      Error rate < 0.1% (Very reliable)
⚠️  WARNING:   Error rate 0.1-1%  (Acceptable)
🔴 BAD:       Error rate > 1%    (High failure rate)
```

### Request Rate Patterns

```
Normal:       100-1000 req/sec
High traffic: 1000-5000 req/sec
Load test:    > 5000 req/sec
```

---

## Troubleshooting

### Slow Endpoint Investigation

1. **Find slow endpoints in Grafana**
   - Dashboard: "Top 10 Slowest Endpoints"
   - Note the endpoint path and method

2. **Check error rate**
   - Are errors increasing? Check error logs
   - If errors < 1%, performance issue is primary

3. **Identify bottleneck**
   ```promql
   # Is DB query slow?
   sum by (path) (rate(db_query_time_seconds_sum[5m]))
   
   # Is cache missing?
   sum by (path) (rate(cache_miss_total[5m]))
   
   # Is external API slow?
   sum by (path) (rate(external_api_time_seconds_sum[5m]))
   ```

4. **Check resource utilization**
   - CPU usage > 80% → optimize code
   - Memory usage > 90% → check for leaks
   - Disk I/O high → optimize DB queries

### High Error Rate Investigation

1. **Identify affected endpoint**
   - Dashboard: "Endpoints with Highest Error Rates"

2. **Check error types**
   ```promql
   # 4xx errors (client issue)
   sum by (path, status) (rate(http_endpoint_errors_total{status=~"4.*"}[5m]))
   
   # 5xx errors (server issue)
   sum by (path, status) (rate(http_endpoint_errors_total{status=~"5.*"}[5m]))
   ```

3. **Check logs**
   ```bash
   # View logs for specific service
   docker logs backend | grep ERROR
   ```

### Missing Metrics

**Issue:** Metrics not appearing in Prometheus

**Solutions:**
1. Verify MetricsFilter is running:
   ```bash
   curl http://localhost:8080/actuator/metrics
   ```

2. Check Prometheus scrape config:
   ```bash
   curl http://localhost:9090/config
   ```

3. Make some API calls:
   ```bash
   curl http://localhost:8080/api/news
   ```

4. Check Prometheus targets:
   ```
   http://localhost:9090/targets
   ```

---

## Setup Instructions

### 1. Backend Configuration

The metrics are automatically enabled if:
- Spring Boot Actuator is in classpath ✅
- Micrometer Prometheus registry is in classpath ✅
- MetricsFilter is deployed ✅

### 2. Prometheus Configuration

Verify `prometheus.yml`:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['host.docker.internal:8080']
```

### 3. Grafana Setup

Import dashboards:
```bash
# Copy JSON files to Grafana provisioning directory
cp grafana_dashboard_enhanced.json /path/to/grafana/provisioning/dashboards/

# Restart Grafana
docker restart grafana
```

---

## Performance Impact

### Overhead of MetricsFilter

- **CPU:** < 1% additional per request
- **Memory:** ~1KB per unique endpoint path
- **Latency:** < 5ms added per request (negligible)

### Recommended Retention

```
Prometheus:
  - Short-term (1 week):   15s scrape interval
  - Long-term (1 year):    1h aggregation

Grafana:
  - Default refresh: 5s
  - Slow dashboards: 30s
```

---

## Alerts (Future)

### Recommended Alert Rules

```promql
# Alert if P99 latency > 1 second
alert: HighLatencyAlert
expr: histogram_quantile(0.99, http_endpoint_latency_seconds_bucket) > 1
for: 5m
labels:
  severity: critical

# Alert if error rate > 1%
alert: HighErrorRateAlert
expr: (sum(http_endpoint_errors_total) / sum(http_endpoint_requests_total)) > 0.01
for: 5m
labels:
  severity: warning
```

---

## Best Practices

### 1. Regular Monitoring
- Check Grafana dashboards daily
- Review slow endpoints weekly
- Analyze trends monthly

### 2. Performance Optimization
- Target P99 < 200ms for user-facing endpoints
- Cache frequently accessed data
- Optimize slow database queries
- Use pagination for large datasets

### 3. Error Handling
- Investigate 5xx errors immediately
- Implement proper error logging
- Set up alerts for anomalies
- Track error trends over time

### 4. Load Testing
- Use these metrics during load testing
- Identify bottlenecks early
- Plan capacity before high-traffic events

---

## File Locations

```
monitoring/
├── prometheus.yml                 # Prometheus config
├── grafana_dashboard.json        # Original dashboard
├── grafana_dashboard_enhanced.json # New enhanced dashboard
├── MONITORING_GUIDE.md           # This file
└── grafana/provisioning/
    └── datasources/
        └── datasource.yml        # Grafana data source config

backend/
└── src/main/java/.../config/
    └── MetricsFilter.java        # Request interceptor (NEW)
```

---

## Summary

| Metric | Purpose | Query | SLO |
|--------|---------|-------|-----|
| **Latency** | Response time | `rate(latency_sum[5m]) / rate(latency_count[5m])` | p99 < 500ms |
| **P99 Latency** | 99th percentile | `histogram_quantile(0.99, latency_bucket)` | < 1000ms |
| **Request Rate** | Throughput | `rate(requests_total[1m])` | > 100 req/s |
| **Error Rate** | Reliability | `errors_total / requests_total` | < 1% |
| **CPU Usage** | Resource | `system_cpu_usage` | < 80% |
| **Memory Usage** | Resource | `jvm_memory_used / max` | < 90% |

---

## Next Steps

1. ✅ Deploy MetricsFilter
2. ✅ Import Enhanced Dashboard
3. ⏳ Monitor for 1 week to establish baseline
4. ⏳ Set up alert rules
5. ⏳ Implement performance optimizations
6. ⏳ Review metrics monthly

