import React, { useEffect, useState } from "react";
import "bootstrap-icons/font/bootstrap-icons.css";

export const SecurityDashboard = () => {
  const [stats, setStats] = useState({ Visitor: 0, Pending: 0, Active: 0 });
  const [visitors, setVisitors] = useState([]);
  const [ads, setAds] = useState([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:3000/security/dashboard/api", {
          method : "GET",
          credentials: "include"
        });

        const data = await res.json();

        if (!data.success) return;

        setStats(data.stats || {});
        setVisitors(data.visitors || []);
        setAds(data.ads || []);
      } catch (err) {
        console.error("Error loading dashboard: ", err);
      }
    };
    fetchData();
  }, []);

  return (
    <>
      <div className="contentCon"> 
        <h4 className="section-title">Dashboard</h4>

        <div className="stats-grid">
          <div className="card info-card">
            <div className="card-body text-center">
              <div className="card-label">Total Visitors</div>
              <div className="card-value text-success">{stats.Visitor}</div>
              <i className="bi bi-people-fill fs-2 text-success"></i>
            </div>
          </div>

          <div className="card info-card">
            <div className="card-body text-center">
              <div className="card-label">Pending Approvals</div>
              <div className="card-value text-warning">{stats.Pending}</div>
              <i className="bi bi-hourglass-split fs-2 text-warning"></i>
            </div>
          </div>

          <div className="card info-card">
            <div className="card-body text-center">
              <div className="card-label">Active Visitors</div>
              <div className="card-value text-primary">{stats.Active}</div>
              <i className="bi bi-person-check fs-2 text-primary"></i>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

