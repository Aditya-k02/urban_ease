import React, { useState, useMemo, useEffect } from "react";
import Header from "./Header";
import Tabs from "./Tabs";
import SearchBar from "./SearchBar";
import Dropdown from "./Dropdown";
import AdminTable from "./AdminTables";
import GraphLine from "./GraphLine";
import GraphPie from "./GraphPie";
import Card from "./Card";
import { DollarSign, Grid2x2, Clock, XCircle } from "lucide-react";

export default function Payments() {
  // ===== States =====
  const [data, setData] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalTransactions: 0,
    pendingPayments: 0,
    failedPayments: 0,
  });
  const [graphData, setGraphData] = useState([]);
  const [planDistribution, setPlanDistribution] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [statusTab, setStatusTab] = useState("All");
  const [dateRange, setDateRange] = useState("All Time");
  const [search, setSearch] = useState("");
  const [planType, setPlanType] = useState("All Plans");
  const [graphRange, setGraphRange] = useState("Monthly");

  // ===== Constants =====
  const StatusTabs = ["All", "Completed", "Pending", "Failed"];
  const DateRangeTabs = ["All Time", "Today", "This Week", "This Month", "This Year"];
  const planOptions = ["All Plans", "Basic", "Standard", "Premium"];
  const API_BASE_URL =
    process.env.NODE_ENV === "production"
      ? `${window.location.origin}/admin/api`
      : "http://localhost:3000/admin/api";

  // ===== Fetch Payments =====
  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE_URL}/payments`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("adminToken") || ""}`,
          },
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (json.success) {
          const { payments, statistics, monthlyRevenue, planDistribution } = json.data;

          setData(
            payments.map((p) => ({
              name: p.communityName,
              transactionId: p.transactionId,
              plan: p.plan,
              amount: `₹${p.amount}`,
              paymentMethod: p.paymentMethod,
              date: p.paymentDate,
              status: p.status,
            }))
          );

          setStats(statistics);
          setGraphData(monthlyRevenue.map((m) => ({ x: m.month, y: m.revenue })));
          setPlanDistribution(planDistribution);
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        console.error("Error fetching payments:", err);
        setError("Failed to load payment data");
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  // ===== Columns =====
  const columns = [
    { header: "Community", accessor: "name" },
    { header: "Transaction ID", accessor: "transactionId" },
    { header: "Plan", accessor: "plan" },
    { header: "Amount", accessor: "amount" },
    { header: "Payment Method", accessor: "paymentMethod" },
    { header: "Date", accessor: "date" },
    { header: "Status", accessor: "status" },
  ];

  // ===== Filtering Logic =====
  const filteredData = useMemo(() => {
    const normalize = (v) => (v || "").toString().trim().toLowerCase();

    // Helper to check date within selected range
    const isWithinRange = (dateStr) => {
      if (!dateStr || dateRange === "All Time") return true;

      // Handle dd-mm-yyyy or dd/mm/yyyy
      const [day, month, year] = dateStr.split(/[-/]/).map(Number);
      const date = new Date(year, month - 1, day);

      const now = new Date();

      switch (dateRange) {
        case "Today":
          return (
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );

        case "This Week": {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          weekStart.setHours(0, 0, 0, 0);

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          return date >= weekStart && date < weekEnd;
        }

        case "This Month":
          return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
          );

        case "This Year":
          return date.getFullYear() === now.getFullYear();

        default:
          return true;
      }
    };

    // Main filtering logic
    return data.filter((row) => {
      const rowStatus = normalize(row.status);
      const tabStatus = normalize(statusTab);
      const rowPlan = normalize(row.plan);
      const selPlan = normalize(planType);

      const matchesStatus = tabStatus === "all" || rowStatus === tabStatus;
      const matchesPlan = selPlan === "all plans" || rowPlan === selPlan;

      const q = normalize(search);
      const matchesSearch =
        (row.name || "").toLowerCase().includes(q) ||
        (row.transactionId || "").toLowerCase().includes(q);

      const matchesDate = isWithinRange(row.date);

      return matchesStatus && matchesPlan && matchesSearch && matchesDate;
    });
  }, [statusTab, planType, search, data, dateRange]);

  // ===== Filtered Graph Data Based on Graph Range =====
  // ===== Filtered Graph Data Based on Graph Range =====
const filteredGraphData = useMemo(() => {
  if (!data || data.length === 0) return [];

  const now = new Date();
  const revenueByPeriod = {};

  // Generate expected labels for the selected range
  let expectedLabels = [];
  if (graphRange === "Weekly") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      expectedLabels.push(`${d.getDate()}/${d.getMonth() + 1}`);
      revenueByPeriod[`${d.getDate()}/${d.getMonth() + 1}`] = 0;
    }
  } else if (graphRange === "Monthly") {
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalWeeks = Math.ceil(daysInMonth / 7);
    for (let i = 1; i <= totalWeeks; i++) {
      expectedLabels.push(`Week ${i}`);
      revenueByPeriod[`Week ${i}`] = 0;
    }
  } else if (graphRange === "Yearly") {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    expectedLabels = [...monthNames];
    monthNames.forEach((m) => (revenueByPeriod[m] = 0));
  }

  // Filter completed payments within selected range
  const filteredPayments = data.filter((payment) => {
    if (payment.status.toLowerCase() !== "completed") return false;
    if (!payment.date || payment.date === "N/A") return false;

    const [day, month, year] = payment.date.split(/[-/]/).map(Number);
    if (!day || !month || !year) return false;
    const paymentDate = new Date(year, month - 1, day);
    if (Number.isNaN(paymentDate.getTime())) return false;

    switch (graphRange) {
      case "Weekly": {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return paymentDate >= weekAgo;
      }
      case "Monthly": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return paymentDate >= startOfMonth && paymentDate <= endOfMonth;
      }
      case "Yearly": {
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return paymentDate >= yearAgo;
      }
      default:
        return false;
    }
  });

  // Fill in existing revenue
  filteredPayments.forEach((payment) => {
    const [day, month, year] = payment.date.split(/[-/]/).map(Number);
    if (!day || !month || !year) return;
    const paymentDate = new Date(year, month - 1, day);
    if (Number.isNaN(paymentDate.getTime())) return;

    let key;
    if (graphRange === "Weekly") {
      key = `${paymentDate.getDate()}/${paymentDate.getMonth() + 1}`;
    } else if (graphRange === "Monthly") {
      const weekNum = Math.ceil(paymentDate.getDate() / 7);
      key = `Week ${weekNum}`;
    } else {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      key = monthNames[paymentDate.getMonth()];
    }

    const amount = parseFloat(payment.amount.replace(/[₹,]/g, "")) || 0;
    if (revenueByPeriod[key] !== undefined) {
      revenueByPeriod[key] += amount;
    }
  });

  // Always show all labels (with 0 if no data)
  return expectedLabels.map((label) => ({
    x: label,
    y: revenueByPeriod[label] || 0,
  }));
}, [data, graphRange]);


  // ===== Pie Chart (Payment Distribution) =====
  const paymentStatusData = useMemo(() => {
    const { totalTransactions, pendingPayments, failedPayments } = stats;
    const completed = totalTransactions || 0;
    const total = completed + pendingPayments + failedPayments || 1;

    return [
      { name: "Completed", value: (completed / total) * 100 },
      { name: "Pending", value: (pendingPayments / total) * 100 },
      { name: "Failed", value: (failedPayments / total) * 100 },
    ];
  }, [stats]);

  // ===== Styles =====
  const styles = {
    cardsRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "20px",
      marginBottom: "20px",
    },
    chartRow: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
      gap: "20px",
      marginBottom: "24px",
    },
    graphCard: {
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      padding: "1.5rem",
      border: "1px solid #f1f5f9",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },
    graphHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: "16px",
    },
    filterBar: {
      background: "#ffffff",
      border: "1px solid #f1f5f9",
      borderRadius: "16px",
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
      padding: "1rem 1.5rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "1rem",
    },
    tableSection: {
      background: "#ffffff",
      border: "1px solid rgba(0,0,0,0.05)",
      borderRadius: "16px",
      boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
      padding: "1.5rem",
    },
  };

  // ===== Render =====
  return (
    <>
      <div
        className="sticky-top border-bottom bg-white rounded-3 shadow-sm px-4 py-3 mb-4 d-flex justify-content-between align-items-center"
        style={{ zIndex: 100 }}
      >
        <Header title="Payment Dashboard" />
      </div>

      {/* ===== Stats Cards ===== */}
      <div style={styles.cardsRow}>
        <Card
          icon={<DollarSign size={22} />}
          value={`₹${stats.totalRevenue.toLocaleString()}`}
          label="Total Revenue"
          borderColor="#22c55e"
        />
        <Card
          icon={<Grid2x2 size={22} />}
          value={stats.totalTransactions}
          label="Total Transactions"
          borderColor="#3b82f6"
        />
        <Card
          icon={<Clock size={22} />}
          value={stats.pendingPayments}
          label="Pending Payments"
          borderColor="#f59e0b"
        />
        <Card
          icon={<XCircle size={22} />}
          value={stats.failedPayments}
          label="Failed Payments"
          borderColor="#ef4444"
        />
      </div>

      {/* ===== Graph Section ===== */}
      <div style={styles.chartRow}>
        <div style={styles.graphCard}>
          <div style={styles.graphHeader}>
            <h5 style={{ fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Revenue Trend
            </h5>
            <Tabs
              options={["Weekly", "Monthly", "Yearly"]}
              active={graphRange}
              onChange={setGraphRange}
            />
          </div>
          <GraphLine data={filteredGraphData} xKey="x" yKey="y" color="#0f172a" showArea />
        </div>

        <div style={styles.graphCard}>
          <h5 style={{ fontWeight: 700, color: "#0f172a", marginBottom: "16px" }}>
            Payment Status Distribution
          </h5>
          <GraphPie data={paymentStatusData} colors={["#22c55e", "#facc15", "#ef4444"]} />
        </div>
      </div>

      {/* ===== Filters ===== */}
      <div style={styles.filterBar}>
        <div style={{ flex: "1 1 auto", minWidth: "260px" }}>
          <SearchBar
            placeholder="Search by community or transaction ID..."
            value={search}
            onChange={setSearch}
          />
        </div>
        <div style={{ flex: "1 1 auto", minWidth: "400px" }}>
          <Tabs options={DateRangeTabs} active={dateRange} onChange={setDateRange} />
        </div>
        <div style={{ flex: "0 0 300px" }}>
          <Tabs options={StatusTabs} active={statusTab} onChange={setStatusTab} />
        </div>
        <div style={{ flex: "0 0 200px", minWidth: "160px" }}>
          <Dropdown options={planOptions} selected={planType} onChange={setPlanType} />
        </div>
      </div>

      {/* ===== Data Table ===== */}
      <div style={styles.tableSection}>
        {loading ? (
          <div className="text-center py-4 text-muted">Loading payments...</div>
        ) : error ? (
          <div className="text-center text-danger py-4">{error}</div>
        ) : (
          <AdminTable columns={columns} data={filteredData} actions={[]} />
        )}
      </div>
    </>
  );
}