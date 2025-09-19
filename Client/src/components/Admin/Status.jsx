import React from "react";

export default function StatusBadge({ status }) {
  const key = (status || "").toString().toUpperCase();

  const statusStyles = {
    // ==== General Statuses ====
    ACTIVE: { bg: "#dcfce7", color: "#166534", label: "Active" },
    INACTIVE: { bg: "#fee2e2", color: "#991b1b", label: "Inactive" },
    PENDING: { bg: "#fef9c3", color: "#854d0e", label: "Pending" },
    SUSPENDED: { bg: "#e0f2fe", color: "#0369a1", label: "Suspended" },
    DISABLED: { bg: "#f3f4f6", color: "#374151", label: "Disabled" },
    DELETED: { bg: "#fee2e2", color: "#991b1b", label: "Deleted" },

    // ==== Payment / Financial ====
    COMPLETED: { bg: "#dcfce7", color: "#166534", label: "Completed" },
    SUCCESS: { bg: "#dcfce7", color: "#166534", label: "Success" },
    APPROVED: { bg: "#dcfce7", color: "#166534", label: "Approved" },
    FAILED: { bg: "#fee2e2", color: "#b91c1c", label: "Failed" },
    DECLINED: { bg: "#fee2e2", color: "#b91c1c", label: "Declined" },
    CANCELLED: { bg: "#f3f4f6", color: "#52525b", label: "Cancelled" },
    REFUNDED: { bg: "#e0f2fe", color: "#0369a1", label: "Refunded" },
    PROCESSING: { bg: "#fef9c3", color: "#854d0e", label: "Processing" },
    ON_HOLD: { bg: "#fef9c3", color: "#854d0e", label: "On Hold" },

    // ==== Access / Verification ====
    VERIFIED: { bg: "#dcfce7", color: "#15803d", label: "Verified" },
    UNVERIFIED: { bg: "#fef9c3", color: "#854d0e", label: "Unverified" },
    REJECTED: { bg: "#fee2e2", color: "#b91c1c", label: "Rejected" },
    UNDER_REVIEW: { bg: "#e0f2fe", color: "#0369a1", label: "Under Review" },

    // ==== System / Server ====
    ONLINE: { bg: "#dcfce7", color: "#166534", label: "Online" },
    OFFLINE: { bg: "#f3f4f6", color: "#52525b", label: "Offline" },
    ERROR: { bg: "#fee2e2", color: "#991b1b", label: "Error" },
    WARNING: { bg: "#fef9c3", color: "#854d0e", label: "Warning" },
  };

  const style = statusStyles[key] || {
    bg: "#e5e7eb",
    color: "#374151",
    label: status || "Unknown",
  };

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: "5px 12px",
        borderRadius: "20px",
        fontWeight: 600,
        fontSize: "12px",
        letterSpacing: "0.3px",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {style.label}
    </span>
  );
}
