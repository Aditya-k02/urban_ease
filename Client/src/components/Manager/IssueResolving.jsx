
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Building2, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import {
  fetchManagerIssues,
  fetchIssueDetails,
  assignManagerIssue,
  reassignManagerIssue,
  closeManagerIssue,
  clearIssueDetails,
  fetchWorkers,
} from "../../Slices/ManagerIssuesSlice";
import { toast, ToastContainer } from "react-toastify";
import { useSocket } from "../../hooks/useSocket";

export const IssueResolving = () => {
  const dispatch = useDispatch();
  const socket = useSocket("http://localhost:3000");

  // Use manager issues slice instead of mock data
  const managerState = useSelector((s) => s?.managerIssues) || {};
  const {
    issues = [],
    analytics = null,
    loading = false,
    error = null,
    issueDetails = null,
    workers = [],
    workersLoading = false,
  } = managerState;

  // Main tab
  const [activeTab, setActiveTab] = useState("Resident");

  // Filters per tab
  const [residentSearch, setResidentSearch] = useState("");
  const [residentStatus, setResidentStatus] = useState("All");
  const [residentPriority, setResidentPriority] = useState("All");
  const [residentDateFrom, setResidentDateFrom] = useState("");
  const [residentDateTo, setResidentDateTo] = useState("");

  const [communitySearch, setCommunitySearch] = useState("");
  const [communityStatus, setCommunityStatus] = useState("All");
  const [communityPriority, setCommunityPriority] = useState("All");
  const [communityDateFrom, setCommunityDateFrom] = useState("");
  const [communityDateTo, setCommunityDateTo] = useState("");

  // Preview
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIssue, setPreviewIssue] = useState(null);

  const [assignOpen, setAssignOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState("");
  const [selectedNewWorker, setSelectedNewWorker] = useState("");
  const [deadline, setDeadline] = useState("");
  const [remarks, setRemarks] = useState("");

  // Load issues and workers from backend on mount
  useEffect(() => {
    dispatch(fetchManagerIssues());
    dispatch(fetchWorkers());
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;

    const handleIssueUpdate = () => {
      dispatch(fetchManagerIssues());
    };

    socket.on("issue:updated", handleIssueUpdate);
    return () => {
      socket.off("issue:updated", handleIssueUpdate);
    };
  }, [socket, dispatch]);

  // Filter by type
  const residentIssues = useMemo(
    () => issues.filter((i) => i.categoryType === "Resident"),
    [issues]
  );

  const communityIssues = useMemo(
    () => issues.filter((i) => i.categoryType === "Community"),
    [issues]
  );

  // Apply filters
  const applyFilters = (issueList, search, status, priority, dateFrom, dateTo) => {
    return issueList
      .filter((issue) => {
        if (status !== "All" && issue.status !== status) return false;
        if (priority !== "All" && (issue.priority || "Normal") !== priority) return false;

        if (dateFrom) {
          const issueDate = new Date(issue.createdAt);
          if (issueDate < new Date(dateFrom)) return false;
        }
        if (dateTo) {
          const issueDate = new Date(issue.createdAt);
          if (issueDate > new Date(dateTo)) return false;
        }

        if (search.trim()) {
          const searchLower = search.toLowerCase();
          return (
            (issue.title || "").toLowerCase().includes(searchLower) ||
            (issue.category || "").toLowerCase().includes(searchLower) ||
            (issue.issueID || "").toLowerCase().includes(searchLower) ||
            (issue.location || "").toLowerCase().includes(searchLower)
          );
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const filteredResident = applyFilters(
    residentIssues,
    residentSearch,
    residentStatus,
    residentPriority,
    residentDateFrom,
    residentDateTo
  );

  const filteredCommunity = applyFilters(
    communityIssues,
    communitySearch,
    communityStatus,
    communityPriority,
    communityDateFrom,
    communityDateTo
  );

  const activeIssues = activeTab === "Resident" ? filteredResident : filteredCommunity;

  // Stats
  const stats = {
    total: issues.length,
    resident: residentIssues.length,
    community: communityIssues.length,
    pending: issues.filter((i) => i.status === "Pending Assignment").length,
    assigned: issues.filter((i) => i.status === "Assigned").length,
    inProgress: issues.filter((i) => i.status === "In Progress").length,
    paymentPending: issues.filter((i) => i.status === "Payment Pending").length,
  };

  // Check if can assign - for issues that need initial assignment
  const canAssign = (issue) => {
    return (
      issue.status === "Pending Assignment" &&
      !issue.workerAssigned
    );
  };

  // Check if can reassign - for issues that already have a worker but need reassignment
  const canReassign = (issue) => {
    return (
      (issue.status === "Reopened" ||
        issue.status === "Assigned" ||
        issue.status === "In Progress" ||
        (issue.status === "Pending Assignment" && issue.workerAssigned)) &&
      issue.workerAssigned
    );
  };

  // Open modals
  const openAssign = (issue) => {
    setPreviewIssue(issue);
    setSelectedWorker("");
    setDeadline("");
    setRemarks("");
    setAssignOpen(true);
    setPreviewOpen(false);
  };

  const openReassign = (issue) => {
    setPreviewIssue(issue);
    setSelectedNewWorker("");
    setDeadline(issue.deadline ? issue.deadline.split('T')[0] : "");
    setRemarks(issue.remarks || "");
    setReassignOpen(true);
    setPreviewOpen(false);
  };

  const openDetails = async (issue) => {
    setPreviewIssue(issue);
    await dispatch(fetchIssueDetails(issue._id));
    setPreviewOpen(true);
  };

  // Actions
  const doAssign = async () => {
    if (!selectedWorker.trim()) return toast.error("Select a worker");
    try {
      await dispatch(
        assignManagerIssue({
          id: previewIssue._id,
          worker: selectedWorker,
          deadline: deadline || null,
          remarks: remarks || null,
        })
      ).unwrap();
      toast.success("Worker assigned successfully");
      setAssignOpen(false);
      dispatch(fetchManagerIssues()); // Refresh list
    } catch (e) {
      toast.error(String(e));
    }
  };

  const doReassign = async () => {
    if (!selectedNewWorker.trim()) return toast.error("Select a new worker");
    try {
      await dispatch(
        reassignManagerIssue({
          id: previewIssue._id,
          newWorker: selectedNewWorker,
          deadline: deadline || null,
          remarks: remarks || null,
        })
      ).unwrap();
      toast.success("Worker reassigned successfully");
      setReassignOpen(false);
      dispatch(fetchManagerIssues());
    } catch (e) {
      toast.error(String(e));
    }
  };

  const doClose = async (issue) => {
    try {
      await dispatch(closeManagerIssue({ id: issue._id })).unwrap();
      toast.success("Issue closed");
      dispatch(fetchManagerIssues());
    } catch (e) {
      toast.error(String(e));
    }
  };

  const closeDetails = () => {
    setPreviewOpen(false);
    dispatch(clearIssueDetails());

  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />


      <style>{`
        .management-section { margin-bottom: 24px; }
        .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .stat-card h3 { margin: 0; font-size: 14px; font-weight: 600; color: #6b7280; }
        .stat-number { font-size: 28px; font-weight: 700; color: #0b1220; }
        .tab-buttons { display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
        .tab-btn { padding: 10px 16px; background: none; border: none; border-bottom: 3px solid transparent; font-weight: 600; cursor: pointer; color: #6b7280; transition: all 0.2s; }
        .tab-btn.active { color: #0b1220; border-bottom-color: #0b1220; }
        .filters-container { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 20px; }
        .filter-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 12px; margin-bottom: 12px; align-items: end; }
        .filter-input, .filter-select { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; }
        .issues-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .issue-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; cursor: pointer; transition: all 0.2s; }
        .issue-card:hover { border-color: #d1d5db; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .issue-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .issue-id { font-size: 12px; color: #6b7280; font-weight: 600; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
        .status-badge.pending { background: #fef3c7; color: #92400e; }
        .status-badge.assigned { background: #dbeafe; color: #1e40af; }
        .status-badge.in-progress { background: #fed7aa; color: #92400e; }
        .status-badge.payment-pending { background: #fef3c7; color: #92400e; }
        .status-badge.closed { background: #d1fae5; color: #065f46; }
        .status-badge.reopened { background: #fee2e2; color: #991b1b; }
        .status-badge.resolved { background: #d1fae5; color: #065f46; }
        .issue-title { font-weight: 700; font-size: 15px; color: #0b1220; margin: 0 0 10px 0; }
        .issue-detail { font-size: 13px; margin-bottom: 6px; display: flex; justify-content: space-between; }
        .issue-detail .label { color: #6b7280; }
        .issue-detail .value { font-weight: 600; color: #0b1220; }
        .issue-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .action-btn { flex: 1; min-width: 80px; padding: 8px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .action-btn.primary { background: #0b1220; color: #fff; }
        .action-btn.primary:hover { background: #1f2937; }
        .action-btn.secondary { background: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; }
        .action-btn.secondary:hover { background: #e5e7eb; }
        .action-btn.danger { background: #fee2e2; color: #991b1b; }
        .action-btn.danger:hover { background: #fecaca; }
        .action-btn.warning { background: #fef3c7; color: #92400e; }
        .action-btn.warning:hover { background: #fed7aa; }
        .popup { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .popup-content { background: #fff; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
        .popup-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e5e7eb; }
        .popup-header h2 { margin: 0; font-size: 18px; }
        .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
        .popup-body { padding: 20px; }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: 600; }
        .form-group input, .form-group textarea { width: 100%; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-family: inherit; }
        .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; background: #f8f9fa; padding: 16px; border-radius: 8px; margin-bottom: 16px; }
        .detail-item { display: flex; flex-direction: column; gap: 4px; }
        .detail-item.full { grid-column: span 2; }
        .detail-label { font-size: 12px; color: #6b7280; font-weight: 600; }
        .detail-value { font-size: 14px; color: #0b1220; font-weight: 600; }
        .popup-footer { display: flex; gap: 10px; padding: 16px 20px; border-top: 1px solid #e5e7eb; background: #f8f9fa; }
        .popup-footer button { flex: 1; padding: 10px 16px; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; }
        .btn-primary { background: #0b1220; color: #fff; }
        .btn-primary:hover { background: #1f2937; }
        .btn-secondary { background: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; }
        .btn-secondary:hover { background: #e5e7eb; }
        .empty-state { text-align: center; padding: 40px 20px; color: #6b7280; }
        .loading-state { text-align: center; padding: 40px 20px; }
        .error-state { background: #fee2e2; padding: 16px; border-radius: 8px; color: #991b1b; margin-bottom: 20px; }
      `}</style>

      <div className="management-section">
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "rgba(0,0,0,0.7)" }}>Issue Resolution Management</h3>
          <button
            onClick={() => dispatch(fetchManagerIssues())}
            style={{
              background: "#f3f4f6",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              padding: "8px 16px",
              cursor: "pointer",
              fontSize: "14px",
              marginTop: "8px"
            }}
          >
            🔄 Refresh
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-state">
            Error: {error}
          </div>
        )}

        {/* Stats */}
        <div className="stats-container">
          <div className="stat-card">
            <h3><BarChart3 size={16} style={{ display: "inline", marginRight: "8px" }} />Total Issues</h3>
            <div className="stat-number">{stats.total}</div>
          </div>
          <div className="stat-card">
            <h3>📋 Pending</h3>
            <div className="stat-number">{stats.pending}</div>
          </div>
          <div className="stat-card">
            <h3>� Payment Pending</h3>
            <div className="stat-number">{stats.paymentPending}</div>
          </div>
          <div className="stat-card">
            <h3>�👤 Resident</h3>
            <div className="stat-number">{stats.resident}</div>
          </div>
          <div className="stat-card">
            <h3>🏢 Community</h3>
            <div className="stat-number">{stats.community}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === "Resident" ? "active" : ""}`}
            onClick={() => setActiveTab("Resident")}
          >
            👤 Resident Issues ({stats.resident})
          </button>
          <button
            className={`tab-btn ${activeTab === "Community" ? "active" : ""}`}
            onClick={() => setActiveTab("Community")}
          >
            🏢 Community Issues ({stats.community})
          </button>
        </div>

        {/* Filters */}
        <div className="filters-container">
          <div className="filter-row">
            <input
              type="text"
              className="filter-input"
              placeholder="Search title, category, ID, location..."
              value={activeTab === "Resident" ? residentSearch : communitySearch}
              onChange={(e) =>
                activeTab === "Resident"
                  ? setResidentSearch(e.target.value)
                  : setCommunitySearch(e.target.value)
              }
            />
            <select
              className="filter-select"
              value={activeTab === "Resident" ? residentStatus : communityStatus}
              onChange={(e) =>
                activeTab === "Resident"
                  ? setResidentStatus(e.target.value)
                  : setCommunityStatus(e.target.value)
              }
            >
              <option value="All">All Status</option>
              <option value="Pending Assignment">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Reopened">Reopened</option>
              <option value="Resolved (Awaiting Confirmation)">Resolved</option>
              <option value="Payment Pending">Payment Pending</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              className="filter-select"
              value={activeTab === "Resident" ? residentPriority : communityPriority}
              onChange={(e) =>
                activeTab === "Resident"
                  ? setResidentPriority(e.target.value)
                  : setCommunityPriority(e.target.value)
              }
            >
              <option value="All">All Priority</option>
              <option value="Low">Low</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
            <input
              type="date"
              className="filter-input"
              placeholder="From Date"
              value={activeTab === "Resident" ? residentDateFrom : communityDateFrom}
              onChange={(e) =>
                activeTab === "Resident"
                  ? setResidentDateFrom(e.target.value)
                  : setCommunityDateFrom(e.target.value)
              }
            />
            <input
              type="date"
              className="filter-input"
              placeholder="To Date"
              value={activeTab === "Resident" ? residentDateTo : communityDateTo}
              onChange={(e) =>
                activeTab === "Resident"
                  ? setResidentDateTo(e.target.value)
                  : setCommunityDateTo(e.target.value)
              }
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading-state">
            Loading issues...
          </div>
        )}

        {/* Issues Grid */}
        {!loading && activeIssues.length > 0 ? (
          <div className="issues-grid">
            {activeIssues.map((issue) => (
              <motion.div
                key={issue._id}
                className="issue-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openDetails(issue)}
              >
                <div className="issue-card-header">
                  <span className="issue-id">{issue.issueID || issue._id.slice(-6)}</span>
                  <span className={`status-badge ${(issue.status || "").toLowerCase().replace(/[\s()]/g, "-")}`}>
                    {issue.status || "Unknown"}
                  </span>
                </div>
                <h3 className="issue-title">{issue.title || issue.category || "Untitled Issue"}</h3>
                
                <div className="issue-detail">
                  <span className="label">Category:</span>
                  <span className="value">{issue.category || "-"}</span>
                </div>
                <div className="issue-detail">
                  <span className="label">Priority:</span>
                  <span className="value">{issue.priority || "Normal"}</span>
                </div>
                <div className="issue-detail">
                  <span className="label">Location:</span>
                  <span className="value">{issue.location || "-"}</span>
                </div>
                <div className="issue-detail">
                  <span className="label">Worker:</span>
                  <span className="value">
                    {issue.workerAssigned 
                      ? (issue.workerAssigned.name || issue.workerAssigned.email || issue.workerAssigned._id?.slice(-4))
                      : "Unassigned"
                    }
                  </span>
                </div>
                <div className="issue-detail">
                  <span className="label">Auto-Assigned:</span>
                  <span className="value">{issue.autoAssigned ? "✓ Yes" : "✗ No"}</span>
                </div>
                <div className="issue-detail">
                  <span className="label">Created:</span>
                  <span className="value">{new Date(issue.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="issue-actions">
                  {canAssign(issue) && (
                    <button
                      className="action-btn primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        openAssign(issue);
                      }}
                    >
                      Assign
                    </button>
                  )}
                  {canReassign(issue) && (
                    <button
                      className="action-btn warning"
                      onClick={(e) => {
                        e.stopPropagation();
                        openReassign(issue);
                      }}
                    >
                      Reassign
                    </button>
                  )}
                  {issue.status !== "Closed" && (
                    <button
                      className="action-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        doClose(issue);
                      }}
                    >
                      Close
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : !loading ? (
          <div className="empty-state">
            <p>No {activeTab.toLowerCase()} issues found matching your filters.</p>
          </div>
        ) : null}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewOpen && previewIssue && (
          <motion.div
            className="popup"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeDetails}
          >
            <motion.div
              className="popup-content"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="popup-header">
                <h2>{previewIssue.title || previewIssue.category || "Issue Details"}</h2>
                <button className="close-btn" onClick={closeDetails}>✖</button>
              </div>
              <div className="popup-body">
                <div className="details-grid">
                  <div className="detail-item">
                    <span className="detail-label">Status</span>
                    <span className="detail-value">{previewIssue.status || "Unknown"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Priority</span>
                    <span className="detail-value">{previewIssue.priority || "Normal"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Category</span>
                    <span className="detail-value">{previewIssue.category || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Type</span>
                    <span className="detail-value">{previewIssue.categoryType || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Location</span>
                    <span className="detail-value">{previewIssue.location || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Created</span>
                    <span className="detail-value">{new Date(previewIssue.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="detail-item full">
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{previewIssue.description || "-"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Worker</span>
                    <span className="detail-value">
                      {previewIssue.workerAssigned
                        ? previewIssue.workerAssigned.name || previewIssue.workerAssigned.email || previewIssue.workerAssigned._id
                        : "Unassigned"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Resident</span>
                    <span className="detail-value">
                      {previewIssue.resident
                        ? `${previewIssue.resident.residentFirstname || ""} ${previewIssue.resident.residentLastname || ""}`.trim()
                        : "-"}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Auto-Assigned</span>
                    <span className="detail-value">{previewIssue.autoAssigned ? "Yes" : "No"}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Deadline</span>
                    <span className="detail-value">
                      {previewIssue.deadline ? new Date(previewIssue.deadline).toLocaleDateString() : "-"}
                    </span>
                  </div>
                  {previewIssue.remarks && (
                    <div className="detail-item full">
                      <span className="detail-label">Remarks</span>
                      <span className="detail-value">{previewIssue.remarks}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="popup-footer">
                <button className="btn-secondary" onClick={closeDetails}>Close</button>
                {canAssign(previewIssue) && (
                  <button className="btn-primary" onClick={() => openAssign(previewIssue)}>
                    Assign Worker
                  </button>
                )}
                {canReassign(previewIssue) && (
                  <button className="btn-primary" onClick={() => openReassign(previewIssue)}>
                    Reassign Worker
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Modal */}
      <AnimatePresence>
        {assignOpen && previewIssue && (
          <motion.div className="popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="popup-header">
                <h2>Assign Worker</h2>
                <button className="close-btn" onClick={() => setAssignOpen(false)}>✖</button>
              </div>
              <div className="popup-body">
                <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}>
                  <strong>Issue:</strong> {previewIssue.title || previewIssue.category}
                </p>
                {previewIssue.workerAssigned ? (
                  <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "12px" }}>
                    <strong>Previously Assigned:</strong> {previewIssue.workerAssigned.name} - {Array.isArray(previewIssue.workerAssigned.jobRole) ? previewIssue.workerAssigned.jobRole.join(', ') : previewIssue.workerAssigned.jobRole}
                    <br />
                    <em>Please select a different worker for reassignment.</em>
                  </p>
                ) : previewIssue.misassignedBy && previewIssue.misassignedBy.length > 0 ? (
                  <p style={{ marginBottom: "16px", color: "#dc2626", fontSize: "12px" }}>
                    <strong>Misassigned by:</strong> {previewIssue.misassignedBy.map(w => w.name).join(', ')}
                    <br />
                    <em>These workers reported this issue as misassigned. Please assign a different worker.</em>
                  </p>
                ) : (
                  <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "12px" }}>
                    This issue has not been assigned yet. Please manually assign a worker.
                  </p>
                )}
                <div className="form-group">
                  <label>Select Worker</label>
                  <select
                    value={selectedWorker}
                    onChange={(e) => setSelectedWorker(e.target.value)}
                    disabled={workersLoading}
                  >
                    <option value="">Choose a worker...</option>
                    {previewIssue.workerAssigned && (
                      <option value={previewIssue.workerAssigned._id} disabled style={{ color: '#6b7280' }}>
                        {previewIssue.workerAssigned.name} - {Array.isArray(previewIssue.workerAssigned.jobRole) ? previewIssue.workerAssigned.jobRole.join(', ') : previewIssue.workerAssigned.jobRole} (Previously Assigned)
                      </option>
                    )}
                    {previewIssue.misassignedBy && previewIssue.misassignedBy.map((worker) => (
                      <option key={worker._id} value={worker._id} disabled style={{ color: '#dc2626' }}>
                        {worker.name} - {Array.isArray(worker.jobRole) ? worker.jobRole.join(', ') : worker.jobRole} (Reported Misassigned)
                      </option>
                    ))}
                    {workers
                      .filter(worker => 
                        (!previewIssue.workerAssigned || worker._id !== previewIssue.workerAssigned._id) &&
                        (!previewIssue.misassignedBy || !previewIssue.misassignedBy.some(misassignedWorker => misassignedWorker._id === worker._id))
                      )
                      .map((worker) => (
                        <option key={worker._id} value={worker._id}>
                          {worker.name} - {Array.isArray(worker.jobRole) ? worker.jobRole.join(', ') : worker.jobRole}
                        </option>
                      ))}
                  </select>
                  {workersLoading && <small className="text-muted">Loading workers...</small>}
                </div>
                <div className="form-group">
                  <label>Deadline (optional)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Remarks (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Add any special instructions..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="popup-footer">
                <button className="btn-secondary" onClick={() => setAssignOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={doAssign}>Assign</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reassign Modal */}
      <AnimatePresence>
        {reassignOpen && previewIssue && (
          <motion.div className="popup" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="popup-content" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
              <div className="popup-header">
                <h2>Reassign Worker</h2>
                <button className="close-btn" onClick={() => setReassignOpen(false)}>✖</button>
              </div>
              <div className="popup-body">
                <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "14px" }}>
                  <strong>Current Worker:</strong> {
                    previewIssue.workerAssigned?.name || 
                    previewIssue.workerAssigned?.email ||
                    previewIssue.workerAssigned?._id ||
                    "N/A"
                  }
                </p>
                <p style={{ marginBottom: "16px", color: "#6b7280", fontSize: "12px" }}>
                  <strong>Reason:</strong> {previewIssue.autoAssigned ? "Auto-assigned but rejected by resident" : "Manual reassignment"}
                </p>
                <div className="form-group">
                  <label>Select New Worker</label>
                  <select
                    value={selectedNewWorker}
                    onChange={(e) => setSelectedNewWorker(e.target.value)}
                    disabled={workersLoading}
                  >
                    <option value="">Choose a worker...</option>
                    {previewIssue.workerAssigned && (
                      <option value={previewIssue.workerAssigned._id} disabled style={{ color: '#6b7280' }}>
                        {previewIssue.workerAssigned.name} - {Array.isArray(previewIssue.workerAssigned.jobRole) ? previewIssue.workerAssigned.jobRole.join(', ') : previewIssue.workerAssigned.jobRole} (Current)
                      </option>
                    )}
                    {workers
                      .filter(worker => !previewIssue.workerAssigned || worker._id !== previewIssue.workerAssigned._id)
                      .map((worker) => (
                        <option key={worker._id} value={worker._id}>
                          {worker.name} - {Array.isArray(worker.jobRole) ? worker.jobRole.join(', ') : worker.jobRole}
                        </option>
                      ))}
                  </select>
                  {workersLoading && <small className="text-muted">Loading workers...</small>}
                </div>
                <div className="form-group">
                  <label>Deadline (optional)</label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Remarks (optional)</label>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                  />
                </div>
              </div>
              <div className="popup-footer">
                <button className="btn-secondary" onClick={() => setReassignOpen(false)}>Cancel</button>
                <button className="btn-primary" onClick={doReassign}>Reassign</button>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};