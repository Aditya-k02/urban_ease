import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export default function Dropdown({ options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={dropdownRef}
      style={{
        position: "relative",
        minWidth: 160,
        width: "100%",
        flexShrink: 0,
      }}
    >
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          padding: "10px 16px",
          border: "1px solid #e2e8f0",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          color: "#1e293b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: "14px",
          boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
          transition: "border-color 0.2s ease, background-color 0.2s ease",
          outline: "none",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#0f172a";
          e.target.style.boxShadow = "none";
          e.target.style.outline = "none";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#e2e8f0";
          e.target.style.boxShadow = "none";
        }}
      >
        <span>{selected}</span>
        <ChevronDown
          size={16}
          color="#475569"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
          }}
        />
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "110%",
            left: 0,
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
            width: "100%",
            zIndex: 100,
            overflow: "hidden",
            animation: "fadeIn 0.15s ease-out",
          }}
        >
          {options.map((option) => (
            <div
              key={option}
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              style={{
                padding: "10px 16px",
                cursor: "pointer",
                color:
                  option === selected ? "#0f172a" : "#334155",
                fontWeight: option === selected ? 600 : 500,
                backgroundColor:
                  option === selected ? "#f1f5f9" : "white",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "#f8fafc")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background =
                  option === selected ? "#f1f5f9" : "white")
              }
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
