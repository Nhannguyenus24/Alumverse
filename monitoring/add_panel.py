import json
import sys

def add_panel(dashboard_path):
    with open(dashboard_path, 'r') as f:
        dashboard = json.load(f)

    # find max Y to place the new panel below everything
    max_y = 0
    for panel in dashboard.get('panels', []):
        gridPos = panel.get('gridPos', {})
        y_bottom = gridPos.get('y', 0) + gridPos.get('h', 0)
        if y_bottom > max_y:
            max_y = y_bottom

    new_panel = {
      "type": "timeseries",
      "title": "API Errors Count Increase (5m)",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": max_y },
      "targets": [
        {
          "expr": "increase(api_errors_count[5m])",
          "legendFormat": "{{uri}}",
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "short",
          "custom": {
            "lineWidth": 2,
            "fillOpacity": 10
          }
        }
      }
    }

    dashboard['panels'].append(new_panel)

    with open(dashboard_path, 'w') as out:
        json.dump(dashboard, out, indent=2)

if __name__ == '__main__':
    add_panel('grafana/provisioning/dashboards/merged_dashboard.json')
