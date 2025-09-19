import React from "react";

export default function Tabs({ options, active, onChange }) {
  return (
    <div
      className="d-flex justify-content-center align-items-center w-100"
      style={{
        gap: "8px",
        background: "#f8fafc",
        borderRadius: "12px",
        padding: "6px",
        height: "52px",
      }}
    >
      {options.map((option) => {
        const isActive = active === option;

        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className="btn"
            style={{
              flex: 1,
              border: "none",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "14px",
              padding: "10px 0",
              height: "40px",
              color: isActive ? "#ffffff" : "#475569",
              backgroundColor: isActive ? "#0f172a" : "transparent",
              boxShadow: isActive
                ? "0 2px 6px rgba(0,0,0,0.15)"
                : "0 0 0 rgba(0,0,0,0)",
              transition: "all 0.25s ease",
            }}
            onMouseEnter={(e) => {
              if (!isActive)
                e.currentTarget.style.backgroundColor = "#e2e8f0";
            }}
            onMouseLeave={(e) => {
              if (!isActive)
                e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
