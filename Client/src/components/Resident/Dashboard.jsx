import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../../assets/css/Resident/Dashboard.css";

export const ResidentDashboard = () => {

  const [ads, setAds] = useState([]);
  const [recents, setRecents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // Fetch Dashboard Data
  // -------------------------
  useEffect(() => {
  async function load() {
    try {
      const res = await fetch("http://localhost:3000/resident/api/dashboard", {
        method: "GET",
        credentials: "include",
      });

      const data = await res.json();
      console.log("Dashboard Data:", data);

      if (data.success) {
        setAds(data.ads || []);
        setRecents(data.recents || []);
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);   
    }
  }

  load();
}, []);


  // -------------------------
  // Emergency Contacts
  // -------------------------
  function EmergencySection() {
    const Contact = ({ icon, title, phone }) => (
      <div className="col-md-4 mb-3 text-center">
        <div className="emergency-icon mx-auto mb-2">
          <i className={`bi ${icon}`}></i>
        </div>

        <strong>{title}</strong>
        <p className="text-muted m-0">{phone}</p>
      </div>
    );

    return (
      <div className="dashboard-card animate-card emergency-container">
        <div className="emergency-header">Emergency Contacts</div>

        <div className="row text-center py-4">
          <Contact icon="bi-shield-lock-fill" title="Security" phone="+91 9876543210" />
          <Contact icon="bi-truck-front-fill" title="Ambulance" phone="112" />
          <Contact icon="bi-heart-fill" title="Police" phone="100" />
        </div>
      </div>
    );
  }

  // Animation
  useEffect(() => {
    const cards = document.querySelectorAll(".animate-card");
    cards.forEach((card, i) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(20px)";
      setTimeout(() => {
        card.style.transition = "opacity .5s ease, transform .5s ease";
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      }, 150 + i * 100);
    });
  }, [recents, notifications]);

  return (
    <div className="container-fluid  dashboard-wrapper">
      <h2 className=" mb-4">Community Dashboard</h2>

      <div className="row g-4">

        {/* Recent Activity */}
        <div className="col-lg-7">
          <div className="dashboard-card animate-card">
            <div className="d-flex align-items-center section-title mb-3">
              <i className="bi bi-clock-history fs-1 text-info me-2"></i>
              Recent Activity
            </div>

            <div className="scroll-area">
              {loading ? (
                <p className="text-center text-muted">Loading...</p>
              ) : recents.length > 0 ? (
                recents.map((r, i) => (
                  <div key={i} className="recent-entry animate-card">
                    <span
                      className={
                        r.type === "Payment"
                          ? "badge badge-payment float-end"
                          : r.type === "Issue"
                          ? "badge badge-issue float-end"
                          : r.type === "PreApproval"
                          ? "badge badge-pre float-end"
                          : "badge badge-default float-end"
                      }
                    >
                      {r.type}
                    </span>

                    <p className="fw-bold mb-1">{r.title}</p>
                    <div className="text-muted small">
                      {new Date(r.date).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="col-lg-5">
          <div className="dashboard-card animate-card">
            <h5 className="notification-header">
              <i className="bi bi-bell-fill me-2"></i> Notifications
            </h5>

            <div className="scroll-area">
              {loading ? (
                <p className="text-center text-muted">Loading...</p>
              ) : notifications.length > 0 ? (
                notifications.map((n, i) => (
                  <div key={i} className="notification-card animate-card">
                    <div className="d-flex align-items-start gap-3">
                      {n.belongs === "Issue" && <i className="bi bi-tools fs-3 text-danger"></i>}
                      {n.belongs === "CS" && <i className="bi bi-calendar-check-fill fs-3 text-danger"></i>}
                      {n.belongs === "Payment" && <i className="bi bi-credit-card-fill fs-3 text-danger"></i>}
                      {n.belongs === "PA" && <i className="bi bi-clipboard-check-fill fs-3 text-danger"></i>}

                      <div>
                        <p className="fw-semibold small mb-1">{n.n}</p>
                        <p className="small text-muted m-0">🕐 {n.timeAgo}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-bell-slash fs-1"></i>
                  <p>No notifications yet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {EmergencySection()}
    </div>
  );
};
