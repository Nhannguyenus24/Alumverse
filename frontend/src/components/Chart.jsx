import { Box, Paper, Typography } from "@mui/material";
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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const MULTI_LINE_COLORS = ["#1976d2", "#2e7d32", "#ed6c02", "#9c27b0", "#d32f2f"];

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
  // Recharts ResponsiveContainer with height="100%" often measures -1 until a parent
  // chain has explicit height (flex/tabs). Use a concrete pixel height instead.
  const chartHeight =
    typeof height === "number" && Number.isFinite(height) && height > 0
      ? height
      : 300;

  if (!data || data.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No data to display
        </Typography>
      </Paper>
    );
  }

  const strokeColor = color || "#1976d2";

  const renderChart = () => {
    switch (type) {
      case "area":
        return (
          <AreaChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
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
          <LineChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {dataKeys && dataKeys.length > 0 ? (
              dataKeys.map((dk, idx) => (
                <Line
                  key={dk.key}
                  type="monotone"
                  dataKey={dk.key}
                  name={dk.label || dk.key}
                  stroke={dk.color || MULTI_LINE_COLORS[idx % MULTI_LINE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                />
              ))
            ) : (
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke="#1976d2"
                strokeWidth={2}
              />
            )}
          </LineChart>
        );

      case "bar":
        return (
          <BarChart data={data}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            {dataKeys && dataKeys.length > 0 ? (
              dataKeys.map((dk, idx) => (
                <Bar
                  key={dk.key}
                  dataKey={dk.key}
                  name={dk.label || dk.key}
                  fill={dk.color || MULTI_LINE_COLORS[idx % MULTI_LINE_COLORS.length]}
                />
              ))
            ) : (
              <Bar dataKey={dataKey} fill="#1976d2" />
            )}
          </BarChart>
        );

      case "pie":
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name}: ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      {title && (
        <Typography variant="h6" sx={{ pb: 3 }}>
          {title}
        </Typography>
      )}
      <Box sx={{ width: "100%", height: chartHeight, minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          {renderChart()}
        </ResponsiveContainer>
      </Box>
    </Paper>
  );
};

export default Chart;
