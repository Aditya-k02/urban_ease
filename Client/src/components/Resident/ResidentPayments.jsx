import React, { useState, useEffect } from "react";
import {
    DollarSign,
    Clock,
    AlertCircle,
    BarChart3
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../../assets/css/Manager/Payments.css";
import { Loader } from '../Loader.jsx'

/* -------------------------------
   Payments Overview Cards
-------------------------------- */
const PaymentsOverview = ({ stats }) => {
    const cards = [
        {
            icon: <DollarSign size={22} className="text-success" />,
            title: "Total Transactions",
            value: stats?.totalTransactions ?? "-",
            color: "text-success"
        },
        {
            icon: <Clock size={22} className="text-warning" />,
            title: "Pending Payments",
            value: stats?.pendingAmount ? `₹${stats.pendingAmount}` : "-",
            color: "text-warning"
        },
        {
            icon: <AlertCircle size={22} className="text-danger" />,
            title: "Overdue Payments",
            value: stats?.overdueAmount ? `₹${stats.overdueAmount}` : "-",
            color: "text-danger"
        },
        {
            icon: <BarChart3 size={22} className="text-primary" />,
            title: "Total Amount Paid",
            value: stats?.paidAmount ? `₹${stats.paidAmount}` : "-",
            color: "text-primary"
        }
    ];

    return (
        <div className="py-4">
            <div className="row g-4">
                {cards.map((card, i) => (
                    <motion.div
                        key={i}
                        className="col-md-6 col-lg-3"
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <div className="payment-card p-3 bg-white rounded-4 shadow-sm">
                            <div className="icon-box" style={{ width: 'fit-content' }}>{card.icon}</div>
                            <h6 className="mt-2 text-secondary">{card.title}</h6>
                            <h4 className={`fw-semibold ${card.color}`}>{card.value}</h4>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

/* -------------------------------
   Receipt Popup
-------------------------------- */
const formatDate = (iso) => {
    if (!iso) return "-";
    try {
        const d = new Date(iso);
        return d.toLocaleString();
    } catch (e) {
        return iso;
    }
};

const PaymentsDetailsPopUp = ({ show, close, details }) => {
    if (!details) return null;

    const receiver = details.receiver || details.reciever || details.to || "-";
    const sender = details.sender || details.from || "-";
    const txnId = details.ID || details.transactionId || details._id || "-";
    const amount = details.amount ?? details.amt ?? "-";
    const penalty = details.penalty || {};

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="popup"
                    onClick={close}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="popup-content bg-white rounded-4 p-4 shadow"
                        onClick={(e) => e.stopPropagation()}
                        initial={{ scale: 0.85 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.85 }}
                    >
                        <div className="d-flex justify-content-between">
                            <h5 className="fw-semibold">Payment Receipt</h5>
                            <button className="btn btn-sm btn-outline-secondary" onClick={close}>
                                ✕
                            </button>
                        </div>

                        <hr />

                        <p><strong>Title:</strong> {details.title || "-"}</p>
                        <p><strong>Payment ID:</strong> {txnId}</p>
                        <p><strong>Amount:</strong> {amount !== "-" ? `₹${amount}` : "-"}</p>
                        <p><strong>Payment Date:</strong> {formatDate(details.paymentDate)}</p>
                        <p><strong>Deadline:</strong> {formatDate(details.paymentDeadline)}</p>
                        <p><strong>Payment Method:</strong> {details.paymentMethod || "-"}</p>
                        <p><strong>Status:</strong> {details.status || "-"}</p>
                        <p><strong>Penalty:</strong> {penalty.p ?? 0} {penalty.changedOn ? `(changed: ${formatDate(penalty.changedOn)})` : ""}</p>
                        <p><strong>Payment Type:</strong> {details.paymentType || details.type || "-"}</p>
                        <p><strong>Remarks:</strong> {details.remarks || "-"}</p>

                        <div className="text-end">
                            <button className="btn btn-dark mt-2" onClick={close}>Close</button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

/* -------------------------------
   Payment Cards List
-------------------------------- */
const PaymentsHistory = ({ onStats, filters = {} }) => {
    const [payments, setPayments] = useState([]);
    const [showPopup, setShowPopup] = useState(false);
    const [selected, setSelected] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showPayModal, setShowPayModal] = useState(false);
    const [paying, setPaying] = useState(false);
    const [payMethod, setPayMethod] = useState("UPI");

    const computeStats = (list) => {
        const overduePayments = list.filter(p => (p.status || "").toLowerCase() === "overdue");
        const pendingPayments = list.filter(p => (p.status || "").toLowerCase() === "pending");
        const completedPayments = list.filter(p => (p.status || "").toLowerCase() === "completed");

        return {
            overdueCount: overduePayments.length,
            pendingCount: pendingPayments.length,
            completedCount: completedPayments.length,
            totalBills: list.length,
            overdueAmount: overduePayments.reduce((s, p) => s + (p.amount || 0), 0),
            pendingAmount: pendingPayments.reduce((s, p) => s + (p.amount || 0), 0),
            paidAmount: completedPayments.reduce((s, p) => s + (p.amount || 0), 0),
            totalTransactions: list.length,
        };
    };

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch("http://localhost:3000/resident/payments", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
        })
            .then(async (res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((data) => {
                console.log("Resident payments data received:", data);
                const list = data.payments || [];
                setPayments(list);
                if (onStats) onStats(data.stats || computeStats(list));
            })
            .catch((err) => {
                console.error("Failed to load resident payments", err);
                setError("Failed to load payments.");
                setPayments([]);
            })
            .finally(() => setLoading(false));
    }, [onStats]);

    const openPayModal = (payment) => {
        setSelected(payment);
        setPayMethod(payment?.paymentMethod || "UPI");
        setShowPayModal(true);
    };

    const closePayModal = () => {
        setShowPayModal(false);
        setSelected(null);
    };

    const handlePayNow = async () => {
        if (!selected?._id) return;
        setPaying(true);
        try {
            const res = await fetch(`http://localhost:3000/resident/payment/${selected._id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status: "Completed", paymentMethod: payMethod })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message || "Payment failed");

            const updated = payments.map((p) =>
                p._id === selected._id
                    ? { ...p, status: "Completed", paymentMethod: payMethod, paymentDate: new Date().toISOString() }
                    : p
            );
            setPayments(updated);
            if (onStats) onStats(computeStats(updated));
            setShowPayModal(false);
        } catch (err) {
            console.error("Payment update failed", err);
            setError(err.message || "Payment update failed");
        } finally {
            setPaying(false);
        }
    };

    // apply client-side filters
    const { search = "", status = "all", type = "all" } = filters;

    const filteredPayments = payments.filter((p) => {
        // Search text match against common fields
        const s = search.trim().toLowerCase();
        if (s) {
            const matchesSearch = [
                p.title,
                p.paymentType,
                p.type,
                p.transactionId,
                p.ID,
                p._id,
                p.paymentMethod,
            ]
                .filter(Boolean)
                .some((val) => String(val).toLowerCase().includes(s));
            if (!matchesSearch) return false;
        }

        // Status filter
        if (status && status !== "all") {
            const st = (p.status || "").toString().toLowerCase();
            if (st !== status.toLowerCase()) return false;
        }

        // Type filter
        if (type && type !== "all") {
            const tp = (p.paymentType || p.type || "").toString().toLowerCase();
            if (tp !== type.toLowerCase()) return false;
        }

        return true;
    });

    return (
        <div className="p-0">

            {loading ? (
                <div className="text-center p-4"><Loader /></div>
            ) : error ? (
                <div className="text-center text-danger p-4">{error}</div>
            ) : payments.length === 0 ? (
                <div className="shadow-sm text-center text-muted p-4">
                    <i className="bi bi-wallet2 me-1"></i>  No payments found.
                </div>
            ) : (
                <div className="row g-4 payments-grid mt-2">
                    {filteredPayments.map((p, i) => (
                        <motion.div
                            className="col-md-6 col-lg-4"
                            key={p.ID || p.transactionId || p._id || i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className="card p-3 rounded-4 shadow-sm">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <h6 className="fw-semibold">{p.title || p.paymentType || "Payment"}</h6>
                                        <small className="text-muted">{p.paymentMethod || "Online"}</small>
                                    </div>
                                    <span className={`badge ${p.status && p.status.toLowerCase() === 'completed' ? 'bg-success' : p.status && p.status.toLowerCase() === 'pending' ? 'bg-warning' : 'bg-secondary'}`}>
                                        {p.status || "Unknown"}
                                    </span>
                                </div>

                                <hr />

                                <p><strong>Amount:</strong> ₹{p.amount || 0}</p>
                                <p><strong>Date:</strong> {formatDate(p.paymentDate)}</p>
                                <p><strong>Type:</strong> {p.paymentType || p.type || "-"}</p>
                                <p><strong>Payment ID:</strong> {p.ID || p.transactionId || p._id || "-"}</p>

                                <div className="d-flex gap-2 mt-2">
                                    {['pending', 'overdue'].includes((p.status || '').toLowerCase()) && (
                                        <button
                                            className="btn btn-success w-100"
                                            onClick={() => openPayModal(p)}
                                        >
                                            Pay Now
                                        </button>
                                    )}
                                    <button
                                        className="reciept-btn w-100"
                                        onClick={() => {
                                            setSelected(p);
                                            setShowPopup(true);
                                        }}
                                    >
                                        View Receipt
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <PaymentsDetailsPopUp
                show={showPopup}
                close={() => setShowPopup(false)}
                details={selected}
            />

            <AnimatePresence>
                {showPayModal && selected && (
                    <motion.div
                        className="popup"
                        onClick={closePayModal}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="popup-content bg-white rounded-4 p-4 shadow"
                            onClick={(e) => e.stopPropagation()}
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <h5 className="fw-semibold">Complete Payment</h5>
                                <button className="btn btn-sm btn-outline-secondary" onClick={closePayModal}>✕</button>
                            </div>
                            <hr />
                            <p className="mb-2"><strong>Title:</strong> {selected.title || "Payment"}</p>
                            <p className="mb-2"><strong>Amount:</strong> ₹{selected.amount || 0}</p>
                            <div className="mb-3">
                                <label className="form-label">Payment Method</label>
                                <select className="form-select" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                                    <option value="UPI">UPI</option>
                                    <option value="Debit">Debit Card</option>
                                    <option value="Credit">Credit Card</option>
                                    <option value="Netbanking">Net Banking</option>
                                    <option value="Cash">Cash</option>
                                </select>
                            </div>
                            <div className="d-flex gap-2">
                                <button className="btn btn-secondary w-100" onClick={closePayModal} disabled={paying}>Cancel</button>
                                <button className="btn btn-success w-100" onClick={handlePayNow} disabled={paying}>
                                    {paying ? "Processing..." : "Pay Now"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* -------------------------------
   Main Component
-------------------------------- */
export const ResidentPayments = () => {
    const [stats, setStats] = useState(null);
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [type, setType] = useState("all");

    return (
        <div>
            <PaymentsOverview stats={stats} />

            {/* Filters: search + dropdowns below overview */}
            <div className="py-3">
                <div className="d-flex gap-2 flex-wrap align-items-center">
                    <input
                        type="text"
                        className="form-control shadow-sm"
                        placeholder="Search by title or payment ID..."
                        style={{ maxWidth: '60%' }}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />

                    <select className="form-select" style={{ maxWidth: 180 }} value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                    </select>

                    <select className="form-select" style={{ maxWidth: 180 }} value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="all">All Types</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="subscription">Subscription</option>
                        <option value="booking">Booking</option>
                    </select>

                </div>
            </div>

            <PaymentsHistory onStats={setStats} filters={{ search, status, type }} />
        </div>
    );
};