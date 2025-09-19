import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Eye,
  Users,
  ClipboardCheck,
  Clock,
} from "lucide-react";

// Spinner component
const Spinner = ({ size = 16 }) => (
  <div
    style={{
      width: size,
      height: size,
      border: "2px solid #ffffff30",
      borderTop: "2px solid #ffffff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
      display: "inline-block",
    }}
  />
);

// Add CSS animation
const spinAnimation = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
@keyframes slideInDown {
  0% {
    transform: translateX(-50%) translateY(-100%);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
  }
}
`;

// Inject CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinAnimation;
  document.head.appendChild(style);
}
import "bootstrap/dist/css/bootstrap.min.css";
import Card from "./Card";
import Tabs from "./Tabs";
import Status from "./Status";

export default function ManagerApplications() {
  // ===== State Management =====
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [activePhoto, setActivePhoto] = useState(null);
  const [activeTab, setActiveTab] = useState("All");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [actionType, setActionType] = useState(null); // 'approve' or 'reject'
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? window.location.origin
      : "http://localhost:3000";

  // ===== Fetch Applications =====
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE_URL}/admin/api/interests`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("adminToken");
          window.location.href = "/adminLogin";
          return;
        }

        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const formatted = json.data.map((app) => ({
            id: app._id,
            name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || "Unknown",
            email: app.email,
            phone: app.phone,
            communityName: app.communityName || "N/A",
            location: app.location || "Unknown",
            description: app.description || "",
            appliedOn: new Date(app.createdAt).toLocaleDateString("en-IN"),
            status: app.status?.toUpperCase() || "PENDING",
            photos: app.photos || [],
            approvedBy: app.approvedBy?.name || null,
            rejectedBy: app.rejectedBy?.name || null,
            rejectionReason: app.rejectionReason || null,
            approvedAt: app.approvedAt ? new Date(app.approvedAt).toLocaleDateString("en-IN") : null,
            rejectedAt: app.rejectedAt ? new Date(app.rejectedAt).toLocaleDateString("en-IN") : null,
            paymentStatus: app.paymentStatus || 'pending',
            // Computed status for UI
            uiStatus: (app.status?.toUpperCase() === 'APPROVED' && (!app.paymentStatus || app.paymentStatus === 'pending'))
              ? 'AWAITING PAYMENT'
              : ((app.paymentStatus === 'completed') ? 'COMPLETED' : (app.status?.toUpperCase() || "PENDING"))
          }));
          setApplications(formatted);
        } else {
          throw new Error("Invalid response structure");
        }
      } catch (err) {
        console.error("Error fetching manager applications:", err);
        setError("Failed to load applications");
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // ===== Approval Function =====
  const handleApprove = async (appId) => {
    try {
      setActionLoading(appId);
      setActionType('approve');
      const res = await fetch(`${API_BASE_URL}/admin/interests/${appId}/approve`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
      });

      if (res.ok) {
        const updatedApp = { ...selectedApp, status: "APPROVED", uiStatus: "AWAITING PAYMENT", paymentStatus: "pending" };
        setApplications(prev =>
          prev.map(app =>
            app.id === appId
              ? updatedApp
              : app
          )
        );
        // Update the selected app to reflect changes in preview
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp(updatedApp);
        }
        setError("");
        setSuccessMessage("Application approved! Payment link sent to applicant.");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to approve application");
      }
    } catch (err) {
      setError("Error approving application");
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  // ===== Rejection Function =====
  const handleReject = async (appId) => {
    if (!rejectionReason.trim()) {
      setError("Please provide a rejection reason");
      return;
    }

    try {
      setActionLoading(appId);
      setActionType('reject');
      const res = await fetch(`${API_BASE_URL}/admin/interests/${appId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
        },
        body: JSON.stringify({ reason: rejectionReason }),
      });

      if (res.ok) {
        const updatedApp = { ...selectedApp, status: "REJECTED", rejectionReason };
        setApplications(prev =>
          prev.map(app =>
            app.id === appId
              ? updatedApp
              : app
          )
        );
        // Update the selected app to reflect changes in preview
        if (selectedApp && selectedApp.id === appId) {
          setSelectedApp(updatedApp);
        }
        setShowRejectModal(false);
        setRejectionReason("");
        setError("");
        setSuccessMessage("Application rejected successfully! Rejection email sent to applicant.");
        setTimeout(() => setSuccessMessage(""), 5000);
      } else {
        const errorData = await res.json();
        setError(errorData.message || "Failed to reject application");
      }
    } catch (err) {
      setError("Error rejecting application");
      console.error(err);
    } finally {
      setActionLoading(null);
      setActionType(null);
    }
  };

  // ===== Derived Stats =====
  const total = applications.length;
  const approved = applications.filter((a) => a.status === "APPROVED").length;
  const pending = applications.filter((a) => a.status === "PENDING").length;

  // ===== Tab Filtering =====
  const filteredApps = useMemo(() => {
    if (activeTab === "All") return applications;

    return applications.filter((a) => {
      // Map tab names to status checks
      if (activeTab === "Approved") return a.status === "APPROVED" && a.paymentStatus !== "pending"; // Legacy
      if (activeTab === "Completed") return a.paymentStatus === "completed";
      if (activeTab === "Awaiting Payment") return a.uiStatus === "AWAITING PAYMENT";
      return a.uiStatus === activeTab.toUpperCase() || a.status === activeTab.toUpperCase();
    });
  }, [activeTab, applications]);

  // ===== Inline Styles =====
  const styles = {
    container: {
      display: "flex",
      minHeight: "100vh",
      background: "linear-gradient(to bottom right, #f8fafc, #eef2f7)",
      fontFamily: "Poppins, sans-serif",
      padding: "24px",
      gap: "24px",
    },
    listPane: {
      flex: "1 1 100%",
      display: "flex",
      flexDirection: "column",
      gap: "16px",
    },
    previewPane: {
      flex: "1 1 40%",
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: "24px",
      overflowY: "auto",
      transition: "all 0.3s ease",
    },
    cardItem: {
      background: "#fff",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: "20px",
      cursor: "pointer",
      borderLeft: "6px solid transparent",
      transition: "transform 0.2s ease, border 0.2s ease",
    },
    headerRow: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "10px",
    },
    name: { fontWeight: 600, fontSize: "18px", color: "#0f172a" },
  };

  return (
    <div style={styles.container}>
      {/* Success Banner */}
      {successMessage && (
        <div style={{
          position: "fixed",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#10b981",
          border: "1px solid #059669",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          zIndex: 1000,
          maxWidth: "450px",
          width: "90%",
          fontSize: "16px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          animation: "slideInDown 0.3s ease-out",
        }}>
          <div style={{ fontSize: "20px", marginRight: "10px", minWidth: "24px" }}>✅</div>
          <div style={{
            flex: 1,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis"
          }}>
            Application processed successfully!
          </div>
          <button
            onClick={() => setSuccessMessage("")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "18px",
              padding: "4px 8px",
              borderRadius: "4px",
              lineHeight: "1",
              minWidth: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s ease",
              marginLeft: "10px",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.3)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
          >
            ×
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div style={{
          position: "fixed",
          top: successMessage ? "80px" : "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "#ef4444",
          border: "1px solid #dc2626",
          color: "white",
          padding: "12px 16px",
          borderRadius: "8px",
          boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
          zIndex: 1000,
          maxWidth: "450px",
          width: "90%",
          fontSize: "16px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          animation: "slideInDown 0.3s ease-out",
        }}>
          <div style={{ fontSize: "20px", marginRight: "10px", minWidth: "24px" }}>⚠</div>
          <div style={{
            flex: 1,
            overflow: 'hidden',
            lineHeight: '1.2'
          }}>
            {error}
          </div>
          <button
            onClick={() => setError("")}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "white",
              cursor: "pointer",
              fontSize: "18px",
              padding: "4px 8px",
              borderRadius: "4px",
              lineHeight: "1",
              minWidth: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s ease",
              marginLeft: "10px",
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.3)"}
            onMouseLeave={(e) => e.target.style.backgroundColor = "rgba(255,255,255,0.2)"}
          >
            ×
          </button>
        </div>
      )}
      {/* ===== Left Pane ===== */}
      <div style={styles.listPane}>
        <h2 style={{ fontWeight: 700, color: "#0f172a" }}>
          Community Manager Applications
        </h2>

        {/* === Summary Cards === */}
        <div
          className="d-flex flex-wrap"
          style={{ gap: "16px", marginBottom: "16px" }}
        >
          <Card
            icon={<Users />}
            value={total}
            label="Total Applications"
            borderColor="#3b82f6"
          />
          <Card
            icon={<ClipboardCheck />}
            value={approved}
            label="Approved"
            borderColor="#22c55e"
          />
          <Card
            icon={<Clock />}
            value={pending}
            label="Pending"
            borderColor="#fbbf24"
          />
        </div>

        {/* === Tabs === */}
        <Tabs
          options={["All", "Pending", "Awaiting Payment", "Completed", "Rejected"]}
          active={activeTab}
          onChange={setActiveTab}
        />

        {/* === Applications List === */}
        {loading ? (
          <div className="text-center py-5 text-muted fw-semibold">
            Loading applications...
          </div>
        ) : error ? (
          <div className="text-center text-danger py-5">{error}</div>
        ) : (
          filteredApps.map((app) => (
            <div
              key={app.id}
              style={{
                ...styles.cardItem,
                borderLeftColor:
                  app.uiStatus === "COMPLETED" || app.status === "ONBOARDED"
                    ? "#22c55e" // Green
                    : app.uiStatus === "AWAITING PAYMENT"
                      ? "#3b82f6" // Blue
                      : app.status === "PENDING"
                        ? "#fbbf24" // Yellow
                        : "#ef4444", // Red
              }}
              onClick={() => {
                setSelectedApp(app);
                setActivePhoto(app.photos[0]);
              }}
            >
              <div style={styles.headerRow}>
                <div style={styles.name}>{app.name}</div>
                <Status status={app.uiStatus || app.status} />
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                {app.email} · {app.phone}
              </div>
              <div style={{ fontSize: "14px", color: "#475569" }}>
                {app.community} — {app.location}
              </div>
              <div
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                  Applied on {app.appliedOn}
                </div>
                <Eye size={18} color="#3b82f6" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* ===== Right Pane (Preview) ===== */}
      {selectedApp && (
        <div style={styles.previewPane}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "16px",
            }}
          >
            <h4 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>
              {selectedApp.name}
            </h4>
            <X
              size={22}
              style={{ cursor: "pointer", color: "#64748b" }}
              onClick={() => setSelectedApp(null)}
            />
          </div>

          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Email:</strong> {selectedApp.email}
          </div>
          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Phone:</strong> {selectedApp.phone}
          </div>
          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Community:</strong> {selectedApp.communityName}
          </div>
          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Location:</strong> {selectedApp.location}
          </div>
          <div style={{ marginBottom: "8px", color: "#475569" }}>
            <strong>Status:</strong> <Status status={selectedApp.uiStatus || selectedApp.status} />
          </div>
          <div style={{ marginBottom: "16px", color: "#475569" }}>
            <strong>Description:</strong> {selectedApp.description}
          </div>

          {/* Photos Section */}
          {selectedApp.photos && selectedApp.photos.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <div style={{ marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                Photos ({selectedApp.photos.length})
              </div>
              <div style={{
                display: "flex",
                gap: "8px",
                flexWrap: "wrap",
                marginBottom: "12px"
              }}>
                {selectedApp.photos.map((photoUrl, index) => (
                  <div
                    key={index}
                    onClick={() => setActivePhoto(photoUrl)}
                    style={{
                      width: "60px",
                      height: "60px",
                      borderRadius: "8px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: activePhoto === photoUrl ? "3px solid #3b82f6" : "2px solid #e5e7eb",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <img
                      src={photoUrl}
                      alt={`Photo ${index + 1}`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover"
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Large photo preview */}
              {activePhoto && (
                <div style={{
                  width: "100%",
                  maxHeight: "300px",
                  overflow: "hidden",
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  marginBottom: "16px"
                }}>
                  <img
                    src={activePhoto}
                    alt="Preview"
                    style={{
                      width: "100%",
                      height: "auto",
                      display: "block"
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Resend Link Button */}
          {selectedApp.uiStatus === "AWAITING PAYMENT" && (
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                onClick={async () => {
                  try {
                    setActionLoading(selectedApp.id);
                    setActionType('resend');
                    const res = await fetch(`${API_BASE_URL}/admin/interests/${selectedApp.id}/resend-link`, {
                      method: "POST",
                      headers: {
                        Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
                      },
                    });
                    if (res.ok) {
                      setSuccessMessage("Payment link resent successfully!");
                      setTimeout(() => setSuccessMessage(""), 5000);
                    } else {
                      const data = await res.json();
                      setError(data.message || "Failed to resend link");
                    }
                  } catch (err) {
                    setError("Error resending link");
                  } finally {
                    setActionLoading(null);
                  }
                }}
                disabled={actionLoading === selectedApp.id}
                style={{
                  backgroundColor: "#3b82f6",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: actionLoading === selectedApp.id ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: "140px",
                  justifyContent: "center",
                }}
              >
                {actionLoading === selectedApp.id && actionType === 'resend' ? (
                  <>
                    <Spinner size={14} />
                    Sending...
                  </>
                ) : (
                  "Resend Payment Link"
                )}
              </button>
            </div>
          )}



          {/* Action Buttons */}
          {selectedApp.status === "PENDING" && (
            <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
              <button
                onClick={() => handleApprove(selectedApp.id)}
                disabled={actionLoading === selectedApp.id}
                style={{
                  backgroundColor: actionLoading === selectedApp.id && actionType === 'approve' ? "#16a34a" : "#22c55e",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: actionLoading === selectedApp.id ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: "100px",
                  justifyContent: "center",
                }}
              >
                {actionLoading === selectedApp.id && actionType === 'approve' ? (
                  <>
                    <Spinner size={14} />
                    Approving
                  </>
                ) : (
                  "Approve"
                )}
              </button>
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={actionLoading === selectedApp.id}
                style={{
                  backgroundColor: "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: actionLoading === selectedApp.id ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: "100px",
                  justifyContent: "center",
                }}
              >
                Reject
              </button>
            </div>
          )}

          {/* Show approval/rejection details */}
          {selectedApp.status === "APPROVED" && selectedApp.approvedBy && (
            <div style={{ marginTop: "16px", color: "#22c55e", fontSize: "14px" }}>
              ✓ Approved by {selectedApp.approvedBy} on {selectedApp.approvedAt}
            </div>
          )}
          {selectedApp.status === "REJECTED" && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ color: "#ef4444", fontSize: "14px", marginBottom: "4px" }}>
                ✗ Rejected{selectedApp.rejectedBy ? ` by ${selectedApp.rejectedBy}` : ""}{selectedApp.rejectedAt ? ` on ${selectedApp.rejectedAt}` : ""}
              </div>
              {selectedApp.rejectionReason && (
                <div style={{ color: "#475569", fontSize: "13px", backgroundColor: "#fef2f2", padding: "8px", borderRadius: "6px", border: "1px solid #fecaca" }}>
                  <strong>Reason:</strong> {selectedApp.rejectionReason}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedApp && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            width: "500px",
            maxWidth: "90vw",
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#0f172a", fontSize: "18px", fontWeight: "600" }}>
                Reject Application
              </h3>
              <X
                size={20}
                style={{ cursor: "pointer", color: "#64748b" }}
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setError("");
                }}
              />
            </div>

            <div style={{ marginBottom: "16px", color: "#475569" }}>
              <strong>Applicant:</strong> {selectedApp.name}
            </div>
            <div style={{ marginBottom: "16px", color: "#475569" }}>
              <strong>Community:</strong> {selectedApp.communityName}
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "500", color: "#374151" }}>
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                style={{
                  width: "100%",
                  minHeight: "100px",
                  padding: "12px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  resize: "vertical",
                  fontFamily: "inherit",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>

            {error && (
              <div style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "12px",
                borderRadius: "6px",
                marginBottom: "16px",
                fontSize: "14px",
              }}>
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setError("");
                }}
                style={{
                  backgroundColor: "#f3f4f6",
                  color: "#374151",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedApp.id)}
                disabled={actionLoading === selectedApp.id || !rejectionReason.trim()}
                style={{
                  backgroundColor: actionLoading === selectedApp.id || !rejectionReason.trim() ? "#9ca3af" : "#ef4444",
                  color: "white",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  cursor: actionLoading === selectedApp.id || !rejectionReason.trim() ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  minWidth: "140px",
                  justifyContent: "center",
                }}
              >
                {actionLoading === selectedApp.id && actionType === 'reject' ? (
                  <>
                    <Spinner size={14} />
                    Rejecting
                  </>
                ) : (
                  "Reject Application"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}