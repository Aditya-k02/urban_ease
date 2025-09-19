import React, { useState, useEffect, memo } from "react";
import { toast } from "react-toastify";
import {
    Building2,
    LogOut,
    Users,
    Briefcase,
    AlertCircle,
    UserCheck,
    Calendar,
    DollarSign,
    TrendingUp,
    Bell,
    Wrench,
    Package,
    Clock,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import {
    Line,
    LineChart as RechartsLine,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../assets/css/Manager/Dashboard.css";
import { useSocket } from "../../hooks/useSocket";


const SummaryCards = memo(function SummaryCards({ data, loading }) {
    const summaryData = [
        {
            title: "Total Residents",
            value: loading ? "-" : data?.summary?.totalResidents || "0",
            change: "",
            icon: Users,
            color: "text-primary",
            bg: "bg-light"
        },
        {
            title: "Total Workers",
            value: loading ? "-" : data?.summary?.totalWorkers || "0",
            change: "",
            icon: Briefcase,
            color: "text-purple",
            bg: "bg-light"
        },
        {
            title: "Active Issues",
            value: loading ? "-" : data?.issues?.pending || "0",
            change: "",
            icon: AlertCircle,
            color: "text-danger",
            bg: "bg-light"
        },
        {
            title: "Today's Visitors",
            value: loading ? "-" : data?.visitors?.today || "0",
            change: "",
            icon: UserCheck,
            color: "text-success",
            bg: "bg-light"
        },
        {
            title: "Active Bookings",
            value: loading ? "-" : data?.bookings?.approved || "0",
            change: "",
            icon: Calendar,
            color: "text-warning",
            bg: "bg-light"
        },
        {
            title: "Revenue Collected",
            value: loading ? "-" : `₹${data?.payments?.amounts?.paid || 0}`,
            change: "",
            icon: DollarSign,
            color: "text-info",
            bg: "bg-light"
        },
    ];

    return (
        <div className="container-fluid p-0">
            <div className="summaryGrid">
                {summaryData.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <div key={i} className="m-1">
                            <div className="card text-center p-3 shadow-sm summary-card">
                                <div className="d-flex flex-column align-items-center">
                                    <div className={`rounded-circle mb-2 p-2 ${item.bg}`}>
                                        <Icon className={`${item.color}`} size={24} />
                                    </div>
                                    <p className="text-muted small mb-0">{item.title}</p>
                                    <h5 className="fw-bold">{item.value}</h5>
                                    {item.change && <small className="text-muted">{item.change}</small>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const PaymentsRevenue = memo(function PaymentsRevenue({ data, loading }) {
    // Build payment data from backend with proper structure
    const stats = data?.payments || {};
    const paymentData = [
        { name: "Paid", value: stats.amounts?.paid || stats.paidAmount || 0, color: "#10b981", gradient: "url(#colorPaid)" },
        { name: "Pending", value: stats.amounts?.pending || stats.pendingAmount || 0, color: "#f59e0b", gradient: "url(#colorPending)" },
        { name: "Overdue", value: stats.amounts?.overdue || stats.overdueAmount || 0, color: "#ef4444", gradient: "url(#colorOverdue)" },
    ].filter(item => item.value > 0); // Only show non-zero values

    const totalAmount = paymentData.reduce((sum, item) => sum + item.value, 0);
    const hasPaymentData = totalAmount > 0 && paymentData.length > 0;

    // Custom label renderer for better visibility
    const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }) => {
        const RADIAN = Math.PI / 180;
        const radius = outerRadius + 30;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        if (percent < 0.05) return null; // Don't show label for very small slices

        return (
            <text
                x={x}
                y={y}
                fill="#374151"
                textAnchor={x > cx ? 'start' : 'end'}
                dominantBaseline="central"
                style={{ fontSize: '14px', fontWeight: '600' }}
            >
                {`${name} ${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    // Custom tooltip with better formatting
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0];
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '12px 16px',
                    border: `2px solid ${data.payload.color}`,
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    <p style={{ margin: 0, fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                        {data.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: data.payload.color }}>
                        ₹{(data.value / 1000).toFixed(1)}K
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
                        {((data.value / totalAmount) * 100).toFixed(1)}% of total
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container-fluid mt-2 p-0">
            <div className="card shadow-lg border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-header bg-gradient fw-semibold d-flex align-items-center justify-content-between px-4 py-3"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <div className="d-flex align-items-center gap-2">
                        <DollarSign size={24} />
                        <span style={{ fontSize: '16px' }}>Revenue Summary</span>
                    </div>
                    <span style={{ fontSize: '13px', opacity: 0.9 }}>This Month</span>
                </div>
                <div className="card-body p-4" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: "360px" }}>
                            <Loader2 className="text-primary" size={40} style={{ animation: "spin 1s linear infinite" }} />
                        </div>
                    ) : !hasPaymentData ? (
                        <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "360px" }}>
                            <DollarSign size={64} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                            <h5 className="text-muted mb-2" style={{ fontWeight: '600' }}>No Payment Data</h5>
                            <p className="text-muted mb-0" style={{ fontSize: '14px' }}>No revenue data available for this month yet.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-3 text-center">
                                <h3 className="mb-1" style={{ color: '#1f2937', fontWeight: '700' }}>
                                    ₹{(totalAmount / 1000).toFixed(1)}K
                                </h3>
                                <p className="text-muted mb-0" style={{ fontSize: '14px' }}>Total Revenue</p>
                            </div>
                            <div className="chart-container">
                                <ResponsiveContainer width="100%" height={340}>
                                    <PieChart>
                                        <defs>
                                            <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#059669" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="colorPending" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#d97706" stopOpacity={1} />
                                            </linearGradient>
                                            <linearGradient id="colorOverdue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
                                                <stop offset="100%" stopColor="#dc2626" stopOpacity={1} />
                                            </linearGradient>
                                        </defs>
                                        <Pie
                                            data={paymentData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={{
                                                stroke: '#9ca3af',
                                                strokeWidth: 1.5
                                            }}
                                            label={renderCustomLabel}
                                            outerRadius={110}
                                            innerRadius={60}
                                            paddingAngle={3}
                                            dataKey="value"
                                            animationBegin={0}
                                            animationDuration={800}
                                        >
                                            {paymentData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={entry.gradient}
                                                    stroke="#ffffff"
                                                    strokeWidth={3}
                                                    style={{
                                                        filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.1))',
                                                        cursor: 'pointer'
                                                    }}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend
                                            verticalAlign="bottom"
                                            height={36}
                                            iconType="circle"
                                            formatter={(value, entry) => (
                                                <span style={{ color: '#374151', fontWeight: '500', fontSize: '14px' }}>
                                                    {value}: ₹{(entry.payload.value / 1000).toFixed(1)}K
                                                </span>
                                            )}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
});
const defaultIssueData = [
    { week: "Week 1", resolved: 12, pending: 5, new: 8 },
    { week: "Week 2", resolved: 15, pending: 8, new: 10 },
    { week: "Week 3", resolved: 18, pending: 6, new: 7 },
    { week: "Week 4", resolved: 20, pending: 4, new: 5 },
];

const ReportsAnalytics = memo(function ReportsAnalytics({ data, loading }) {
    // Check if we have actual issue data from backend
    const issueData = data?.issues || {};
    const hasIssueData = (issueData.pending > 0 || issueData.resolved > 0 || issueData.new > 0);

    // Custom tooltip with better formatting
    const CustomLineTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '12px 16px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                    <p style={{ margin: 0, fontWeight: '700', color: '#1f2937', marginBottom: '8px' }}>
                        {label}
                    </p>
                    {payload.map((entry, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <div style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                backgroundColor: entry.color
                            }} />
                            <span style={{
                                fontSize: '14px',
                                color: '#374151',
                                fontWeight: '500'
                            }}>
                                {entry.name}: <strong style={{ color: entry.color }}>{entry.value}</strong>
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="container-fluid mt-2 p-0">
            <div className="card shadow-lg border-0" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-header bg-gradient fw-semibold d-flex align-items-center justify-content-between px-4 py-3"
                    style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <div className="d-flex align-items-center gap-2">
                        <TrendingUp size={24} />
                        <span style={{ fontSize: '16px' }}>Issue Resolution Trends</span>
                    </div>
                    <span style={{ fontSize: '13px', opacity: 0.9 }}>Last 4 Weeks</span>
                </div>
                <div className="card-body p-4" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)' }}>
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center" style={{ height: "340px" }}>
                            <Loader2 className="text-primary" size={40} style={{ animation: "spin 1s linear infinite" }} />
                        </div>
                    ) : !hasIssueData ? (
                        <div className="d-flex flex-column justify-content-center align-items-center" style={{ height: "340px" }}>
                            <AlertCircle size={64} className="text-muted mb-3" style={{ opacity: 0.3 }} />
                            <h5 className="text-muted mb-2" style={{ fontWeight: '600' }}>No Issue Data</h5>
                            <p className="text-muted mb-0" style={{ fontSize: '14px' }}>No issue tracking data available yet.</p>
                        </div>
                    ) : (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={340}>
                                <RechartsLine data={defaultIssueData}>
                                    <defs>
                                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="colorPendingLine" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                                        </linearGradient>
                                        <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#e5e7eb"
                                        strokeOpacity={0.5}
                                    />
                                    <XAxis
                                        dataKey="week"
                                        stroke="#6b7280"
                                        style={{ fontSize: '13px', fontWeight: '500' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#6b7280"
                                        style={{ fontSize: '13px', fontWeight: '500' }}
                                        tickLine={false}
                                    />
                                    <Tooltip content={<CustomLineTooltip />} />
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                        iconType="circle"
                                        wrapperStyle={{
                                            paddingBottom: '20px'
                                        }}
                                        formatter={(value) => (
                                            <span style={{ color: '#374151', fontWeight: '500', fontSize: '14px' }}>
                                                {value}
                                            </span>
                                        )}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="resolved"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={{
                                            r: 6,
                                            fill: "#10b981",
                                            strokeWidth: 2,
                                            stroke: "#fff"
                                        }}
                                        activeDot={{
                                            r: 8,
                                            strokeWidth: 2,
                                            stroke: "#fff"
                                        }}
                                        fill="url(#colorResolved)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="pending"
                                        stroke="#f59e0b"
                                        strokeWidth={3}
                                        dot={{
                                            r: 6,
                                            fill: "#f59e0b",
                                            strokeWidth: 2,
                                            stroke: "#fff"
                                        }}
                                        activeDot={{
                                            r: 8,
                                            strokeWidth: 2,
                                            stroke: "#fff"
                                        }}
                                        fill="url(#colorPendingLine)"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="new"
                                        stroke="#3b82f6"
                                        strokeWidth={3}
                                        dot={{
                                            r: 6,
                                            fill: "#3b82f6",
                                            strokeWidth: 2,
                                            stroke: "#fff"
                                        }}
                                        activeDot={{
                                            r: 8,
                                            strokeWidth: 2,
                                            stroke: "#fff"
                                        }}
                                        fill="url(#colorNew)"
                                    />
                                </RechartsLine>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

function NotificationsPanel({ data, loading, bookings = [] }) {

    const notifications = data?.notifications || [];

    console.log("notifications : ", notifications);

    const getIcon = (referenceType) => {
        switch (referenceType) {
            case "CommonSpaces":
                return Calendar;
            case "Issues":
                return AlertTriangle;
            default:
                return Bell;
        }
    };

    const getColor = (referenceType) => {
        switch (referenceType) {
            case "CommonSpaces":
                return "text-primary";
            case "Issues":
                return "text-warning";
            default:
                return "text-info";
        }
    };

    const getBgColor = (referenceType) => {
        switch (referenceType) {
            case "CommonSpaces":
                return "#dbeafe";
            case "Issues":
                return "#fef3c7";
            default:
                return "#e0f2fe";
        }
    };

    return (
        <aside className="h-100">
            <div className="card shadow-lg border-0 h-100" style={{ borderRadius: '12px', overflow: 'hidden' }}>
                <div className="card-header fw-semibold d-flex align-items-center justify-content-between px-4 py-3"
                    style={{ background: 'white', color: 'rgba(55, 55, 55, 1)' }}>
                    <div className="d-flex align-items-center gap-2">
                        <Bell size={24} />
                        <span style={{ fontSize: '16px' }}>Recent Activity</span>
                    </div>
                    <span className="badge bg-white text-dark" style={{ fontSize: '11px', fontWeight: '600' }}>
                        {notifications.length}
                    </span>
                </div>
                <div className="card-body p-0" style={{
                    maxHeight: '600px',
                    overflowY: 'auto',
                    background: 'linear-gradient(to bottom, #ffffff 0%, #f9fafb 100%)'
                }}>
                    {loading ? (
                        <div className="d-flex justify-content-center align-items-center p-5">
                            <Loader2 className="text-primary" size={32} style={{ animation: "spin 1s linear infinite" }} />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center p-5">
                            <Bell className="text-muted mb-3" size={48} style={{ opacity: 0.3 }} />
                            <p className="text-muted mb-0">No notifications yet</p>
                        </div>
                    ) : (
                        <div className="p-3">
                            {notifications.map((n, i) => {
                                const Icon = getIcon(n.referenceType);
                                const color = getColor(n.referenceType);
                                const bgColor = getBgColor(n.referenceType);
                                return (
                                    <div
                                        key={i}
                                        className="d-flex align-items-start p-3 mb-2"
                                        style={{
                                            backgroundColor: 'white',
                                            borderRadius: '10px',
                                            border: '1px solid #e5e7eb',
                                            transition: 'all 0.2s ease',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateX(3px)';
                                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateX(0)';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }}
                                    >
                                        <div
                                            className="d-flex align-items-center justify-content-center me-3"
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '10px',
                                                backgroundColor: bgColor,
                                                flexShrink: 0
                                            }}
                                        >
                                            <Icon className={color} size={20} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p className="mb-1 fw-semibold" style={{
                                                fontSize: '14px',
                                                color: '#1f2937',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {n.title}
                                            </p>
                                            <small className="d-block text-muted mb-1" style={{
                                                fontSize: '12px',
                                                lineHeight: '1.4'
                                            }}>
                                                {n.message}
                                            </small>
                                            <small className="text-secondary" style={{ fontSize: '11px' }}>
                                                {n.createdAt}
                                            </small>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                .card-body::-webkit-scrollbar {
                    width: 6px;
                }
                .card-body::-webkit-scrollbar-track {
                    background: #f1f1f1;
                    border-radius: 10px;
                }
                .card-body::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 10px;
                }
                .card-body::-webkit-scrollbar-thumb:hover {
                    background: #94a3b8;
                }
            `}</style>
        </aside>
    );
}

const MemoizedNotificationsPanel = memo(NotificationsPanel);

export function ManagerDashboard() {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookingNotifications, setBookingNotifications] = useState([]);

    // Initialize socket connection
    const socket = useSocket("http://localhost:3000");

    useEffect(() => {
        if (socket) {
            console.log("got socket in dashboard");

            socket.on("booking:new", (data) => {
                console.log("📦 New booking received:", data);
                setBookingNotifications((prev) => [data, ...prev.slice(0, 9)]);
                toast.success(`✅ ${data.message}`);
            });

            return () => {
                socket.off("booking:new");
            };
        }
    }, [socket]);
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("http://localhost:3000/manager/api/dashboard", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.status === 401) {
                    setError("Unauthorized: Please log in again");
                    setLoading(false);
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || `Failed to fetch dashboard data: ${response.status}`);
                }

                const contentType = response.headers.get("content-type");
                if (!contentType || !contentType.includes("application/json")) {
                    throw new Error("Invalid response format. Expected JSON.");
                }

                const result = await response.json();
                console.log("dashboard data : ", result);

                if (result.success) {
                    setDashboardData(result.data);
                    setBookingNotifications(result.data.notifications);
                } else {
                    throw new Error(result.message || "Failed to fetch dashboard data");
                }
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError(err.message || "An error occurred while fetching dashboard data. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        // Fetch data immediately
        fetchDashboardData();
    }, []);

    if (error) {
        return (
            <div className="alert alert-danger alert-dismissible fade show m-3" role="alert">
                <AlertCircle size={20} className="me-2" />
                {error}
                <button
                    type="button"
                    className="btn-close"
                    onClick={() => setError(null)}
                    aria-label="Close"
                ></button>
            </div>
        );
    }

    console.log(bookingNotifications);


    return (
        <>
            <main className="pb-5" style={{ background: 'linear-gradient(to bottom, #f8f9fa 0%, #e9ecef 100%)', minHeight: '100vh' }}>
                <div className="container-fluid px-4 pt-4">
                    {/* Header */}
                    <div className="mb-4">
                        <h2 style={{ color: '#1f2937', fontWeight: '700', fontSize: '28px' }}>
                            Dashboard Overview
                        </h2>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: 0 }}>
                            Welcome back! Here's what's happening in your community today.
                        </p>
                    </div>

                    {/* Summary Cards Component - Original Design */}
                    <div className="mb-4">
                        <SummaryCards data={dashboardData} loading={loading} />
                    </div>

                    {/* Main Content Grid - Charts and Notifications Side by Side */}
                    <div className="row g-4 mb-4">
                        {/* Left Column - Charts (70%) */}
                        <div className="col-12 col-lg-8">
                            {/* Revenue Chart */}
                            <div className="mb-4">
                                <PaymentsRevenue data={dashboardData} loading={loading} />
                            </div>

                            {/* Issue Trends Chart */}
                            <div>
                                <ReportsAnalytics data={dashboardData} loading={loading} />
                            </div>
                        </div>

                        {/* Right Column - Notifications (30%) */}
                        <div className="col-12 col-lg-4">
                            <div className="sticky-top" style={{ top: '70px' }}>
                                <MemoizedNotificationsPanel data={dashboardData} loading={loading} bookings={bookingNotifications} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
