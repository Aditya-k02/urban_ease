import React, { useRef } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ placeholder, value, onChange }) {
  const containerRef = useRef(null);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "0 14px",
        height: "48px",
        width: "100%",
        transition: "border-color 0.2s ease",
        outline: "none",           // ✅ ensures parent never shows outline
        boxShadow: "none",         // ✅ ensures no shadow on focus
      }}
    >
      <Search size={18} color="#94a3b8" style={{ marginRight: 10 }} />

      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={(e) => {
          // ✅ remove ALL focus visuals
          e.target.style.outline = "none";
          e.target.style.boxShadow = "none";
          containerRef.current.style.boxShadow = "none";
          containerRef.current.style.outline = "none";
          containerRef.current.style.borderColor = "#0f172a"; // optional subtle dark border
        }}
        onBlur={(e) => {
          e.target.style.outline = "none";
          e.target.style.boxShadow = "none";
          containerRef.current.style.boxShadow = "none";
          containerRef.current.style.borderColor = "#e2e8f0"; // reset border
        }}
        style={{
          border: "none",
          outline: "none",
          boxShadow: "none",        // ✅ ensures Chrome’s glow is gone
          flex: 1,
          fontSize: "14.5px",
          color: "#334155",
          fontWeight: 500,
          backgroundColor: "transparent",
          height: "100%",
          lineHeight: "48px",       // perfect vertical centering
          marginBottom: 0,          // removes default margin
        }}
      />
    </div>
  );
}
