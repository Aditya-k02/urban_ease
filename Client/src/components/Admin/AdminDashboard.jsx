import React, { useState, useEffect } from "react";
import Card from "./Card";
import GraphLine from "./GraphLine";
import GraphPie from "./GraphPie";
import AdminActivityWidget from "./AdminActivityWidget";
import { Building2, Users, FileText, Wallet, RefreshCw } from "lucide-react";
import adminApiClient from "../../services/adminApiClient";
import { Spinner } from "../common/Loader";
import styles from "./AdminDashboard.module.css";

export default function DashboardOverview() {
  const [period, setPeriod] = useState("6M");
  const [loading, setLoading] = useState(false);
  const [kpis, setKpis] = useState({
    fullRevenueData: [],
    totalCommunities: 0,
    totalResidents: 0,
    pendingApplications: 0,
    monthlyRevenue: 0,
  });
  const [chartData, setChartData] = useState({
    revenueData: [],
    applicationsStatus: { approved: 0, pending: 0, rejected: 0 },
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const json = await adminApiClient.getDashboard();

      if (json.success) {
        const { kpis, chartData } = json.data;

        const fullRevenueData = chartData.growthChart.labels.map((label, i) => ({
          x: label,
          y: chartData.growthChart.revenue[i],
        }));

        setKpis(kpis);
        setChartData({
          fullRevenueData,
          revenueData: fullRevenueData,
          applicationsStatus: chartData.applicationsStatus,
        });
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch chart for selected period
  const fetchChartPeriod = (selectedPeriod) => {
    setPeriod(selectedPeriod);

    setChartData((prev) => {
      const full = prev.fullRevenueData;
      let sliced;

      if (selectedPeriod === "6M") {
        sliced = full.slice(-6);
      } else if (selectedPeriod === "1Y") {
        sliced = full.slice(-12);
      } else {
        sliced = full;
      }

      return { ...prev, revenueData: sliced };
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const { totalCommunities, totalResidents, pendingApplications, monthlyRevenue } = kpis;
  const { revenueData, applicationsStatus } = chartData;

  return (
    <>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.headerTitle}>Dashboard Overview</h2>
          <span className={styles.headerSubtitle}>
            Welcome back, Admin! Here's what's happening across all communities.
          </span>
        </div>
        <button className={styles.refreshBtn} onClick={fetchDashboardData} disabled={loading}>
          {loading ? <Spinner size={18} color="#fff" /> : <RefreshCw size={18} />}
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className={styles.cardsRow}>
        <Card
          icon={<Building2 size={22} />}
          value={totalCommunities}
          label="Total Communities"
          borderColor="#3b82f6"
        />
        <Card
          icon={<Users size={22} />}
          value={totalResidents}
          label="Total Residents"
          borderColor="#16a34a"
        />
        <Card
          icon={<FileText size={22} />}
          value={pendingApplications}
          label="Pending Applications"
          borderColor="#f59e0b"
        />
        <Card
          icon={<Wallet size={22} />}
          value={`₹${monthlyRevenue.toLocaleString()}`}
          label="Monthly Revenue"
          borderColor="#8b5cf6"
        />
      </div>

      {/* Charts */}
      <div className={styles.chartRow}>
        {/* Revenue Chart */}
        <div className={styles.chartCard}>
          <div className={styles.chartCardHeader}>
            <h5 className={styles.chartCardTitle}>Portfolio Growth & Revenue</h5>
            <div className={styles.periodButtons}>
              {["6M", "1Y", "All"].map((p) => (
                <button
                  key={p}
                  className={`${styles.periodBtn} ${p === period ? styles.active : styles.inactive}`}
                  onClick={() => fetchChartPeriod(p)}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.graphContainer}>
            <GraphLine
              key={period}
              data={revenueData}
              xKey="x"
              yKey="y"
              color="#10b981"
              showArea
            />
          </div>
        </div>

        {/* Applications Overview */}
        <div className={styles.chartCard}>
          <h5 className={styles.chartCardTitle}>Applications Overview</h5>

          <div className={styles.statsGrid}>
            <div>
              <div className={styles.statValue}>
                {applicationsStatus.pending +
                  applicationsStatus.approved +
                  applicationsStatus.rejected}
              </div>
              <div className={styles.statLabel}>This Month</div>
            </div>
            <div>
              <div className={styles.statValue}>{applicationsStatus.pending}</div>
              <div className={styles.statLabel}>Pending</div>
            </div>
            <div>
              <div className={styles.statValue}>{applicationsStatus.approved}</div>
              <div className={styles.statLabel}>Approved</div>
            </div>
            <div>
              <div className={styles.statValue}>{applicationsStatus.rejected}</div>
              <div className={styles.statLabel}>Rejected</div>
            </div>
          </div>

          <div className={styles.chartWrapper}>
            <GraphPie
              data={[
                { name: "Approved", value: applicationsStatus.approved },
                { name: "Pending", value: applicationsStatus.pending },
                { name: "Rejected", value: applicationsStatus.rejected },
              ]}
              colors={["#22c55e", "#fbbf24", "#ef4444"]}
            />
          </div>
        </div>
      </div>

      {/* Activity Monitoring Widgets */}
      <AdminActivityWidget />
    </>
  );
}
