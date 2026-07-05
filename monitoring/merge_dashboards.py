import json
import sys

def merge_dashboards(file1, file2, output_file):
    with open(file1, 'r') as f1, open(file2, 'r') as f2:
        d1 = json.load(f1)
        d2 = json.load(f2)
        if 'dashboard' in d2:
            d2 = d2['dashboard']

    # find max Y in d1 to offset d2's panels
    max_y = 0
    for panel in d1.get('panels', []):
        gridPos = panel.get('gridPos', {})
        y_bottom = gridPos.get('y', 0) + gridPos.get('h', 0)
        if y_bottom > max_y:
            max_y = y_bottom

    # Offset d2 panels
    for panel in d2.get('panels', []):
        if 'gridPos' in panel:
            panel['gridPos']['y'] += max_y

    d1['panels'].extend(d2.get('panels', []))
    d1['title'] = "Alumniverse Backend - Complete Metrics (Merged)"

    with open(output_file, 'w') as out:
        json.dump(d1, out, indent=2)

if __name__ == '__main__':
    merge_dashboards(
        'grafana_dashboard.json',
        'grafana_dashboard_enhanced.json',
        'grafana/provisioning/dashboards/merged_dashboard.json'
    )
