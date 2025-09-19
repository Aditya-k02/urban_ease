import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function GraphPie({
  data,
  dataKey = "value",
  nameKey = "name",
  colors = ["#22c55e", "#facc15", "#ef4444"],
  title = "Pie Chart",
  innerRadius = 70,
  outerRadius = 100,
  height = 250,
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
        <PieChart>
          <Pie
            data={data}
            dataKey={dataKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
          >
            {data.map((_, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend verticalAlign="bottom" height={36} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
