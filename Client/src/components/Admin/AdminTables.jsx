import React from "react";
import { Edit, Trash } from "lucide-react";
import Status from "./Status"; // ✅ imported here

export default function AdminTable({ columns, data, actions }) {
  return (
    <div
      style={{
        overflowX: "auto",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
        fontFamily: "Poppins, sans-serif",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        <thead>
          <tr style={{ background: "#0f172a", color: "white" }}>
            {columns.map((col, idx) => (
              <th
                key={idx}
                style={{
                  padding: "14px 16px",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: "14px",
                }}
              >
                {col.header.toUpperCase()}
              </th>
            ))}
            {actions && actions.length > 0 && (
              <th
                style={{
                  padding: "14px 16px",
                  fontWeight: "600",
                  textAlign: "left",
                  fontSize: "14px",
                }}
              >
                ACTIONS
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={i}
              style={{
                background: i % 2 === 0 ? "#ffffff" : "#f9fafb",
              }}
            >
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #e5e7eb",
                    fontSize: "14px",
                    color: "#374151",
                  }}
                >
                  {col.accessor === "status" ? (
                    <Status status={row[col.accessor]} /> // ✅ new imported component
                  ) : (
                    row[col.accessor]
                  )}
                </td>
              ))}

              {actions && actions.length > 0 && (
                <td
                  style={{
                    padding: "14px 16px",
                    borderBottom: "1px solid #e5e7eb",
                  }}
                >
                  {actions.map((Action, index) => (
                    <span key={index} style={{ marginRight: "10px" }}>
                      <Action.component row={row} />
                    </span>
                  ))}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
