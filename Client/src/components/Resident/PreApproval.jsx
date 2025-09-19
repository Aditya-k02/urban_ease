import React, { useEffect, useState } from "react";
import "../../assets/css/Resident/preapproval.css";

export function PreApproval() {
  const [visitors, setVisitors] = useState([]);
  const [ads, setAds] = useState([]);
  const [counts, setCounts] = useState({ Approved: 0, Pending: 0, Rejected: 0 });
  const [showForm, setShowForm] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrImage, setQrImage] = useState("");
  const [loading, setLoading] = useState(true);

  // --------------------------
  // Fetch Pre-Approvals
  // --------------------------
  async function loadVisitors() {
    try {
      const res = await fetch("http://localhost:3000/resident/preApprovals", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      console.log("PreApproval Data:", data);

      if (!data.success) return;

      setVisitors(data.visitors || []);
      setAds(data.ads || []);
      setCounts(data.counts || { Approved: 0, Pending: 0, Rejected: 0 });

    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVisitors();
  }, []);

  // --------------------------
  // Cancel Request
  // --------------------------
  async function cancelRequest(id) {
    if (!window.confirm("Cancel this visitor request?")) return;

    try {
      const res = await fetch(
        `http://localhost:3000/resident/preapproval/cancel/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await res.json();

      if (data.ok) loadVisitors();
    } catch (err) {
      console.error("Cancel error:", err);
    }
  }

  // --------------------------
  // View QR
  // --------------------------
  async function viewQR(id) {
    try {
      const res = await fetch(
        `http://localhost:3000/resident/preapproval/qr/${id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await res.json();

      setQrImage(data.qrCodeBase64);
      setShowQR(true);
    } catch (err) {
      console.error("QR Fetch error:", err);
    }
  }

  // --------------------------
  // Submit Pre-Approval Form
  // --------------------------
  async function handleSubmit(e) {
    e.preventDefault();

    const form = new FormData(e.target);

    const payload = {
      visitorName: form.get("visitorName"),
      contactNumber: form.get("contactNumber"),
      purpose: form.get("purpose"),
      dateOfVisit: form.get("dateOfVisit"),
      timeOfVisit: form.get("timeOfVisit"),
    };

    try {
      const res = await fetch("http://localhost:3000/resident/preapproval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setShowForm(false);
        loadVisitors();
      }
    } catch (err) {
      console.error("Form submit error:", err);
    }
  }

  return (
    <div>

      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="section-title">Pre Approvals</h4>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <i className="bi bi-plus-lg me-2"></i> Pre Approve
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid mb-4">
        <div className="stat-card" style={{ borderLeft: "6px solid var(--success)" }}>
          <p className="card-label">Approved Requests</p>
          <h2 className="card-value text-success">{counts.Approved}</h2>
        </div>
        <div className="stat-card" style={{ borderLeft: "6px solid var(--warning)" }}>
          <p className="card-label">Pending Requests</p>
          <h2 className="card-value text-warning">{counts.Pending}</h2>
        </div>
        <div className="stat-card" style={{ borderLeft: "6px solid var(--danger)" }}>
          <p className="card-label">Rejected Requests</p>
          <h2 className="card-value text-danger">{counts.Rejected}</h2>
        </div>
      </div>

      {/* Visitors */}
      <div className="table-container">
        <div className="section-header">Your Visitor Requests</div>

        <div className="requests-container">
          {loading ? (
            <div className="no-bookings">Loading...</div>
          ) : visitors.length === 0 ? (
            <div className="no-bookings">No bookings found</div>
          ) : (
            visitors.map((v) => (
              <div key={v._id} className="request-card">
                <div className="request-card-header">
                  <div className="visitor-info">
                    <div className="visitor-avatar">
                      <i className="bi bi-person-circle"></i>
                    </div>
                    <div>
                      <h5 className="visitor-name">{v.ID}</h5>
                      <p className="visitor-phone">
                        <i className="bi bi-telephone"></i> {v.contactNumber}
                      </p>
                    </div>
                  </div>

                  <span className={`status-badge status-${v.status}`}>
                    {v.status}
                  </span>
                </div>

                <div className="request-card-body">
                  <div className="request-detail">
                    <i className="bi bi-person"></i>
                    <div>
                      <span className="detail-label">Visitor Name: </span>
                      <span className="detail-value">{v.name}</span>
                    </div>
                  </div>

                  <div className="request-detail">
                    <i className="bi bi-calendar"></i>
                    <div>
                      <span className="detail-label">Visit Date: </span>
                      <span className="detail-value">
                        {v.scheduledAt
                          ? new Date(v.scheduledAt).toLocaleDateString("en-IN")
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="request-detail">
                    <i className="bi bi-clock"></i>
                    <div>
                      <span className="detail-label">Visit Time: </span>
                      <span className="detail-value">
                        {v.scheduledAt
                          ? new Date(v.scheduledAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="request-detail">
                    <i className="bi bi-card-text"></i>
                    <div>
                      <span className="detail-label">Purpose</span>
                      <span className="detail-value">{v.purpose}</span>
                    </div>
                  </div>
                </div>

                {v.status === "Pending" && (
                  <div className="request-card-footer">
                    <button
                      className="btn btn-sm btn-outline-danger cancel-btn"
                      onClick={() => cancelRequest(v._id)}
                    >
                      <i className="bi bi-x-circle"></i> Cancel
                    </button>

                    <button
                      className="btn btn-sm btn-outline-primary view-qr-btn"
                      onClick={() => viewQR(v._id)}
                    >
                      <i className="bi bi-qr-code"></i>  View QR
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* FORM POPUP */}
      {showForm && (
        <div className="popup" onClick={() => setShowForm(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setShowForm(false)}>&times;</span>
            <h3 className="form-title">Pre Approve Visitor</h3>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Visitor Name:</label>
                <input type="text" name="visitorName" required />
              </div>

              <div className="form-group">
                <label>Phone Number:</label>
                <input type="text" name="contactNumber" required maxLength="10" />
              </div>

              <div className="form-group">
                <label>Visitor Type:</label>
                <select name="purpose" required>
                  <option value="">Select type</option>
                  <option value="guest">Guest</option>
                  <option value="delivery">Delivery</option>
                  <option value="service">Service</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div className="form-group">
                <label>Date of Visit:</label>
                <input type="date" name="dateOfVisit" required />
              </div>

              <div className="form-group">
                <label>Time of Visit:</label>
                <input type="time" name="timeOfVisit" required />
              </div>

              <button type="submit" className="form-button">
                <i className="bi bi-check-circle"></i> Submit Request
              </button>
            </form>
          </div>
        </div>
      )}

      {/* QR POPUP */}
      {showQR && (
        <div className="popup" onClick={() => setShowQR(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <span className="close-btn" onClick={() => setShowQR(false)}>&times;</span>
            <h3 className="form-title">Pre-Approval QR Code</h3>

            <div className="qr-code-container">
              <img src={qrImage} alt="QR Code" style={{ width: "200px" }} />
            </div>

            <button
              className="btn btn-primary"
              onClick={() => {
                const a = document.createElement("a");
                a.href = qrImage;
                a.download = "QR-Code.png";
                a.click();
              }}
            >
              <i className="bi bi-download"></i> Download QR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
