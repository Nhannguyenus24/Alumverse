const fs = require('fs');
const path = '/Users/nhan/Workspace/Refactoring-and-Enhancing-the-Student-Alumni-System-for-HCMUS/frontend/src/pages/admin/AdminSystemMonitoringPage.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. replace formatString
content = content.replace(
  "const formatString = rangeSeconds > 86400 ? 'MM/DD HH:mm' : (step < 60 ? 'HH:mm:ss' : 'HH:mm');",
  "const formatString = rangeSeconds > 86400 ? 'MM/DD HH:mm' : 'HH:mm';"
);

// 2. Replace COLORS with buildHuePalette
content = content.replace(
  "const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#d32f2f', '#1976d2', '#388e3c', '#fbc02d', '#7b1fa2', '#c2185b'];",
  `const buildHuePalette = (count, { baseHue = 210, saturation = 68, lightness = 55 } = {}) => {
  const n = Math.max(count, 1);
  return Array.from({ length: n }, (_, i) => {
    const hue = Math.round((baseHue + (360 / n) * i) % 360);
    return \`hsl(\${hue}, \${saturation}%, \${lightness}%)\`;
  });
};`
);

// 3. Inject hooks and defs
content = content.replace(
  "const { enqueueSnackbar } = useSnackbar();",
  `const { enqueueSnackbar } = useSnackbar();

  const chartColors = useMemo(() => buildHuePalette(20, { lightness: theme.palette.mode === 'dark' ? 60 : 52 }), [theme.palette.mode]);
  const axisProps = useMemo(() => ({ tick: { fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 600 }, axisLine: false, tickLine: false, tickMargin: 12 }), [theme.palette.text.secondary]);
  const gridProps = useMemo(() => ({ strokeDasharray: "4 4", stroke: theme.palette.divider, vertical: false }), [theme.palette.divider]);

  const renderDefs = () => (
    <defs>
      <linearGradient id="area-primary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.primary.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0} /></linearGradient>
      <linearGradient id="area-error" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.error.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.error.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.error.main} stopOpacity={0} /></linearGradient>
      <linearGradient id="area-success" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.success.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0} /></linearGradient>
      <linearGradient id="area-info" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.info.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0} /></linearGradient>
      <linearGradient id="area-secondary" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.secondary.main} stopOpacity={0.45} /><stop offset="60%" stopColor={theme.palette.secondary.main} stopOpacity={0.12} /><stop offset="95%" stopColor={theme.palette.secondary.main} stopOpacity={0} /></linearGradient>
    </defs>
  );`
);

// 4. Replace COLORS occurrences
content = content.replaceAll("COLORS[idx % COLORS.length]", "chartColors[idx % chartColors.length]");

// 5. Update Grids and Axes
content = content.replaceAll('<CartesianGrid strokeDasharray="3 3" vertical={false} />', "<CartesianGrid {...gridProps} />");
content = content.replaceAll('<XAxis dataKey="timeFormatted" minTickGap={30} />', '<XAxis dataKey="timeFormatted" minTickGap={30} {...axisProps} />');
content = content.replaceAll('<YAxis />', '<YAxis {...axisProps} width={45} />');
content = content.replaceAll('<YAxis domain={[0, 100]} />', '<YAxis domain={[0, 100]} {...axisProps} width={45} />');
content = content.replaceAll('<YAxis allowDecimals={false} />', '<YAxis allowDecimals={false} {...axisProps} width={45} />');

// 6. Add renderDefs to AreaChart
content = content.replaceAll("<AreaChart data={chartData}>", "<AreaChart data={chartData}>{renderDefs()}");

// 7. Replace static fill Opacities with gradients and bump strokeWidth
content = content.replaceAll('fill={theme.palette.primary.light} fillOpacity={0.3}', 'fill="url(#area-primary)" strokeWidth={2.5}');
content = content.replaceAll('fill={theme.palette.primary.light} fillOpacity={0.4}', 'fill="url(#area-primary)" strokeWidth={2.5}');
content = content.replaceAll('fill={theme.palette.error.light} fillOpacity={0.3}', 'fill="url(#area-error)" strokeWidth={2.5}');
content = content.replaceAll('fill={theme.palette.error.light} fillOpacity={0.4}', 'fill="url(#area-error)" strokeWidth={2.5}');
content = content.replaceAll('fill={theme.palette.success.light} fillOpacity={0.3}', 'fill="url(#area-success)" strokeWidth={2.5}');
content = content.replaceAll('fill={theme.palette.success.light} fillOpacity={0.4}', 'fill="url(#area-success)" strokeWidth={2.5}');
content = content.replaceAll('fill={theme.palette.info.light} fillOpacity={0.4}', 'fill="url(#area-info)" strokeWidth={2.5}');
content = content.replaceAll('fill={theme.palette.secondary.light} fillOpacity={0.4}', 'fill="url(#area-secondary)" strokeWidth={2.5}');

// 8. Update Line charts
content = content.replaceAll('strokeWidth={2}', 'strokeWidth={2.5}');
content = content.replaceAll('stroke="#8884d8"', 'stroke={chartColors[0]}');
content = content.replaceAll('stroke="#82ca9d"', 'stroke={chartColors[1]}');
content = content.replaceAll('stroke="#ffc658"', 'stroke={chartColors[2]}');
content = content.replaceAll('stroke="#ff7300"', 'stroke={chartColors[3]}');
content = content.replaceAll('stroke="#0288d1"', 'stroke={chartColors[4]}');
content = content.replaceAll('stroke="#9c27b0"', 'stroke={chartColors[5]}');
content = content.replaceAll('stroke="#7b1fa2"', 'stroke={chartColors[6]}');

fs.writeFileSync(path, content);
