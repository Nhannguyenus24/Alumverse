import { useMemo } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AXIS_TICK_MARGIN = 12;
const CARTESIAN_CHART_MARGIN = { top: 8, right: 16, left: 0, bottom: 24 };
const LEGEND_WRAPPER_STYLE = { paddingTop: 12 };

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
  color,
}) => {
  const theme = useTheme();
  // Recharts ResponsiveContainer with height="100%" often measures -1 until a parent
  // chain has explicit height (flex/tabs). Use a concrete pixel height instead.
  const chartHeight =
    typeof height === "number" && Number.isFinite(height) && height > 0
      ? height
      : 300;

  const chartData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const strokeColor = color || theme.palette.primary.main;

  const chartColors = useMemo(
    () => [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
    ],
    [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.secondary.main,
      theme.palette.error.main,
    ],
  );

  const renderedChart = useMemo(() => {
    switch (type) {
      case "area":
        return (
          <AreaChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} tickMargin={AXIS_TICK_MARGIN} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />}
            <defs>
              <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={strokeColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={strokeColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={strokeColor}
              strokeWidth={2}
              fill="url(#areaGradient)"
              dot={false}
            />
          </AreaChart>
        );

      case "line":
        return (
          <LineChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} tickMargin={AXIS_TICK_MARGIN} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />}
            {dataKeys && dataKeys.length > 0 ? (
              dataKeys.map((dk, idx) => (
                <Line
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.label || dk.key}
                  stroke={dk.color || chartColors[idx % chartColors.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={2}
              />
            )}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={chartData}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} tickMargin={AXIS_TICK_MARGIN} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />}
            {dataKeys && dataKeys.length > 0 ? (
              dataKeys.map((dk, idx) => (
                <Bar
                  key={dk.key}
                  dataKey={dk.key}
                  name={dk.label || dk.key}
                  fill={dk.color || chartColors[idx % chartColors.length]}
                />
              ))
            ) : (
              <Bar dataKey={dataKey} fill={strokeColor} />
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
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill={strokeColor}
              dataKey={dataKey}
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend wrapperStyle={LEGEND_WRAPPER_STYLE} />}
          </PieChart>
        );

      default:
        return null;
    }
  }, [type, chartData, dataKey, dataKeys, xAxisKey, showGrid, showLegend, strokeColor, chartColors]);

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
    </Paper>
  );
};

export default Chart;
