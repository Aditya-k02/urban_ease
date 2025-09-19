import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from "recharts";

export default function GraphLine({
  data,
  xKey = "x",
  yKey = "y",
  color = "#0f172a",
  title = "Line Graph",
  showArea = false,
  height = 250,
  grid = true,
  smooth = true,
}) {
  const styles = {
    container: {
      background: "#ffffff",
      borderRadius: "16px",
      padding: "20px 28px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
      flex: 1,
      minWidth: "420px",
    },
    title: {
      fontSize: "16px",
      fontWeight: 600,
      color: "#0f172a",
      marginBottom: "12px",
    },
  };

  return (
    <div style={styles.container}>
      <h4 style={styles.title}>{title}</h4>
      <ResponsiveContainer width="100%" height={height}>
        {showArea ? (
          <AreaChart data={data}>
            {grid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
            <XAxis dataKey={xKey} stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Area
              type={smooth ? "monotone" : "linear"}
              dataKey={yKey}
              stroke={color}
              fill={`${color}33`} // semi-transparent fill
              strokeWidth={2}
            />
          </AreaChart>
        ) : (
          <LineChart data={data}>
            {grid && <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />}
            <XAxis dataKey={xKey} stroke="#64748b" />
            <YAxis stroke="#64748b" />
            <Tooltip />
            <Legend />
            <Line
              type={smooth ? "monotone" : "linear"}
              dataKey={yKey}
              stroke={color}
              strokeWidth={2.5}
              dot={{ fill: color, r: 4 }}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
