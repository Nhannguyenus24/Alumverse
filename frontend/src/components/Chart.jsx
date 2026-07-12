import { useId, useMemo } from "react";
import {
  useTheme,
} from "@mui/material";



const AXIS_TICK_MARGIN = 12;
const LEGEND_WRAPPER_STYLE = { paddingTop: 16 };

/**
 * Build an evenly-spaced palette across the HSL hue wheel ("phổ màu hue").
 * Colors are distinct yet harmonious because saturation/lightness stay fixed
 * while only the hue rotates. `baseHue` lets the spectrum start near the brand
 * color so charts feel on-theme.
 */
const buildHuePalette = (count, { baseHue = 210, saturation = 68, lightness = 55 } = {}) => {
  const n = Math.max(count, 1);
  return Array.from({ length: n }, (_, i) => {
    const hue = Math.round((baseHue + (360 / n) * i) % 360);
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  });
};

/**
 * Render the percentage *inside* each pie slice so labels never overflow the
 * container or overlap each other. Tiny slices (<5%) are skipped to avoid
 * cramped text; their values still appear in the tooltip/legend.
 */
const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (!percent || percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      textAnchor="middle"
      dominantBaseline="central"
      fontSize={12}
      fontWeight={700}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

/** Themed tooltip card — replaces recharts' stark default white box. */
const ChartTooltip = ({ active, payload, label }) => {
  const theme = useTheme();
  if (!active || !payload?.length) return null;
  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        boxShadow: theme.shadows[3],
        px: 1.5,
        py: 1,
        minWidth: 130,
      }}
    >
      {label != null && label !== "" && (
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
          {label}
        </Typography>
      )}
      <Stack spacing={0.5} sx={{ mt: label != null ? 0.5 : 0 }}>
        {payload.map((entry, idx) => (
          <Box key={`${entry.dataKey ?? entry.name}-${idx}`} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 10, height: 10, borderRadius: "50%", flexShrink: 0, bgcolor: entry.color }} />
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {entry.name}: {Number(entry.value).toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

const Chart = ({
  type = "line",
  data = [],
  dataKey = "value",
  dataKeys,
  xAxisKey = "name",
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  showTable = false,
  color,
}) => {
  const theme = useTheme();
  const gradientId = useId();
  // Recharts ResponsiveContainer with height="100%" often measures -1 until a parent
  // chain has explicit height (flex/tabs). Use a concrete pixel height instead.
  const chartHeight =
    typeof height === "number" && Number.isFinite(height) && height > 0
      ? height
      : 300;

  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const strokeColor = color || theme.palette.primary.main;

  // Shared axis/grid styling so every chart type looks consistent and clean.
  const axisProps = useMemo(
    () => ({
      tick: { fill: theme.palette.text.secondary, fontSize: 12, fontWeight: 600 },
      axisLine: false,
      tickLine: false,
    }),
    [theme.palette.text.secondary],
  );
  const gridStroke = theme.palette.divider;

  // Hue spectrum sized to the data, seeded near the brand color. Used for
  // pie/bar/multi-series so each slice/series gets a distinct on-theme color.
  const seriesCount = dataKeys?.length || chartData.length || 5;
  const chartColors = useMemo(
    () => buildHuePalette(Math.max(seriesCount, 5), { lightness: theme.palette.mode === "dark" ? 60 : 52 }),
    [seriesCount, theme.palette.mode],
  );

  const renderedChart = useMemo(() => {
    switch (type) {
      case "area":
        return (
          <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id={`area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.45} />
                <stop offset="60%" stopColor={strokeColor} stopOpacity={0.12} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            {showGrid && <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />}
            <XAxis dataKey={xAxisKey} tickMargin={AXIS_TICK_MARGIN} {...axisProps} />
            <YAxis allowDecimals={false} width={36} {...axisProps} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: strokeColor, strokeOpacity: 0.25, strokeWidth: 1.5 }} />
            {showLegend && <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} iconType="circle" />}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={2.5}
              fill={`url(#area-${gradientId})`}
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
            />
          </AreaChart>
        );

      case "line":
        return (
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            {showGrid && <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />}
            <XAxis dataKey={xAxisKey} tickMargin={AXIS_TICK_MARGIN} {...axisProps} />
            <YAxis allowDecimals={false} width={36} {...axisProps} />
            <Tooltip content={<ChartTooltip />} />
            {showLegend && <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} iconType="circle" />}
            {dataKeys && dataKeys.length > 0 ? (
              dataKeys.map((dk, idx) => (
                <Line
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.label || dk.key}
                  stroke={dk.color || chartColors[idx % chartColors.length]}
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, stroke: theme.palette.background.paper }}
              />
            )}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }} barCategoryGap="25%">
            {showGrid && <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} vertical={false} />}
            <XAxis dataKey={xAxisKey} tickMargin={AXIS_TICK_MARGIN} {...axisProps} />
            <YAxis allowDecimals={false} width={36} {...axisProps} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: theme.palette.action.hover }} />
            {showLegend && <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} iconType="circle" />}
            {dataKeys && dataKeys.length > 0 ? (
              dataKeys.map((dk, idx) => (
                <Bar
                  key={dk.key}
                  dataKey={dk.key}
                  name={dk.label || dk.key}
                  fill={dk.color || chartColors[idx % chartColors.length]}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              ))
            ) : (
              <Bar dataKey={dataKey} radius={[6, 6, 0, 0]} maxBarSize={48}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Bar>
            )}
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderPieLabel}
              innerRadius={56}
              outerRadius={90}
              paddingAngle={3}
              cornerRadius={6}
              stroke={theme.palette.background.paper}
              strokeWidth={2}
              dataKey={dataKey}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
            {showLegend && <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} iconType="circle" />}
          </PieChart>
        );

      case "funnel":
        return (
          <FunnelChart>
            <Tooltip content={<ChartTooltip />} />
            <Funnel dataKey={dataKey} data={chartData} isAnimationActive stroke={theme.palette.background.paper} strokeWidth={2}>
              <LabelList position="right" fill={theme.palette.text.primary} stroke="none" dataKey={xAxisKey} />
              <LabelList position="center" fill="#fff" stroke="none" dataKey={dataKey} />
              {chartData.map((entry, index) => (
                <Cell key={`funnel-cell-${index}`} fill={chartColors[index % chartColors.length]} />
              ))}
            </Funnel>
          </FunnelChart>
        );

      default:
        return null;
    }
  }, [type, chartData, dataKey, dataKeys, xAxisKey, showGrid, showLegend, strokeColor, chartColors, axisProps, gridStroke, gradientId, theme.palette.text.primary, theme.palette.background.paper, theme.palette.action.hover]);

  if (chartData.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No data to display
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      {title && (
        <Typography variant="h6" sx={{ pb: 3 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ width: "100%", height: chartHeight, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          {renderedChart}
        </ResponsiveContainer>
      </Box>
      {type === "pie" && showTable && (() => {
        const total = chartData.reduce(
          (acc, row) => acc + (Number(row[dataKey]) || 0),
          0,
        );
        return (
          <Table size="small" sx={{ mt: 1.5 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, py: 0.75 }}>Name</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 0.75 }}>
                  Value
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, py: 0.75 }}>
                  %
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chartData.map((row, index) => {
                const value = Number(row[dataKey]) || 0;
                return (
                  <TableRow key={`${row[xAxisKey]}-${index}`}>
                    <TableCell sx={{ py: 0.5 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "2px",
                            flexShrink: 0,
                            bgcolor: chartColors[index % chartColors.length],
                          }}
                        />
                        {row[xAxisKey]}
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5, fontWeight: 600 }}>
                      {value.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 0.5 }}>
                      {total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        );
      })()}
    </Paper>
  );
};

export default Chart;
