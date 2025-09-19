
import React, { useEffect, useState, useMemo } from "react";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../hooks/useSocket";

const STATUS_ASSIGNED = "Assigned";
const STATUS_IN_PROGRESS = "In Progress";
const STATUS_RESOLVED = "Resolved (Awaiting Confirmation)";

export const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [estimatedCost, setEstimatedCost] = useState("");
  const socket = useSocket("http://localhost:3000");
  
  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [sortBy, setSortBy] = useState("priority"); // priority, date, status
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // grid or list

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/worker/api/tasks", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (err) {
      toast.error(err.message || "Error loading tasks");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handleIssueUpdate = () => {
      fetchTasks();
    };
    socket.on("issue:updated", handleIssueUpdate);
    return () => {
      socket.off("issue:updated", handleIssueUpdate);
    };
  }, [socket]);

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter(task => {
      const matchesStatus = statusFilter === "All" || task.status === statusFilter;
      const matchesPriority = priorityFilter === "All" || task.priority === priorityFilter;
      const matchesSearch = searchTerm === "" || 
        task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.category?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesStatus && matchesPriority && matchesSearch;
    });

    // Sort tasks
    filtered.sort((a, b) => {
      if (sortBy === "priority") {
        const priorityOrder = { "Urgent": 3, "High": 2, "Normal": 1 };
        return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
      } else if (sortBy === "date") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === "status") {
        return a.status.localeCompare(b.status);
      }
      return 0;
    });

    return filtered;
  }, [tasks, statusFilter, priorityFilter, searchTerm, sortBy]);

  // Get task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const assigned = tasks.filter(t => t.status === "Assigned").length;
    const inProgress = tasks.filter(t => t.status === "In Progress").length;
    const urgent = tasks.filter(t => t.priority === "Urgent").length;
    const high = tasks.filter(t => t.priority === "High").length;

    return { total, assigned, inProgress, urgent, high };
  }, [tasks]);

  // Start issue
  const handleStart = (id) => updateTaskStatus(id, STATUS_IN_PROGRESS);

  // Resolve issue (kept for compatibility with older UI triggers)
  const handleResolve = (id, costValue = estimatedCost) => updateTaskStatus(id, STATUS_RESOLVED, costValue);

  // Flag as misassigned
  const handleMisassigned = async (id) => {
    setActionLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/worker/issue/misassigned/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      toast.success("Flagged as misassigned");
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (err) {
      toast.error(err.message || "Failed to flag as misassigned");
    }
    setActionLoading(false);
  };

  // Open task details modal
  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setEstimatedCost(task?.estimatedCost ?? "");
    setIsDetailModalOpen(true);
  };

  // Close task details modal
  const closeTaskDetails = () => {
    setIsDetailModalOpen(false);
    setSelectedTask(null);
    setEstimatedCost("");
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Urgent": return "#dc3545";
      case "High": return "#fd7e14";
      case "Normal": return "#28a745";
      default: return "#6c757d";
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "Assigned": return "#007bff";
      case "In Progress": return "#ffc107";
      case "Resolved (Awaiting Confirmation)": return "#28a745";
      default: return "#6c757d";
    }
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "Urgent": return "🚨";
      case "High": return "⚠️";
      case "Normal": return "📋";
      default: return "📝";
    }
  };

  // Get category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case "Plumbing": return "🔧";
      case "Electrical": return "⚡";
      case "Security": return "🔒";
      case "Maintenance": return "🛠️";
      case "Pest Control": return "🐛";
      case "Waste Management": return "🗑️";
      default: return "📋";
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  // Open task modal
  const openTaskModal = (task) => {
    setSelectedTask(task);
    setEstimatedCost(task?.estimatedCost ?? "");
    setIsDetailModalOpen(true);
  };

  // Update task status
  const updateTaskStatus = async (taskId, newStatus, costValue = estimatedCost) => {
    setActionLoading(true);
    try {
      const endpoint = newStatus === STATUS_IN_PROGRESS ? "start" : "resolve";
      const payload = newStatus === STATUS_RESOLVED
        ? { estimatedCost: Number(costValue) }
        : null;

      if (payload && (!Number.isFinite(payload.estimatedCost) || payload.estimatedCost <= 0)) {
        setActionLoading(false);
        toast.error("Enter a positive estimated cost before completing.");
        return;
      }

      const res = await fetch(`http://localhost:3000/worker/issue/${endpoint}/${taskId}`, {
        method: "POST",
        credentials: "include",
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);

      const statusMessage = newStatus === STATUS_IN_PROGRESS ? "Started" : "Completed";
      toast.success(`Task ${statusMessage}`);

      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, status: newStatus, estimatedCost: payload?.estimatedCost ?? t.estimatedCost }
            : t
        )
      );
    } catch (err) {
      toast.error(err.message || `Failed to update task`);
    }
    setActionLoading(false);
  };

  return (
    <>
      <ToastContainer position="top-center" autoClose={1500} />

      <style>{`
        .management-section { margin-bottom: 24px; }
        .priority-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        
        .status-badge {
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: white;
        }
        
        .task-details {
          padding: 15px 20px;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
          font-size: 14px;
        }
        
        .detail-label {
          color: #718096;
          font-weight: 500;
        }
        
        .detail-value {
          color: #2d3748;
          font-weight: 600;
        }
        
        .task-actions {
          padding: 15px 20px;
          border-top: 1px solid #f0f0f0;
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        
        .action-btn {
          flex: 1;
          min-width: 120px;
          padding: 10px 16px;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 14px;
        }
        
        .btn-start {
          background: #28a745;
          color: white;
        }
        
        .btn-start:hover {
          background: #218838;
          transform: translateY(-2px);
        }
        
        .btn-resolve {
          background: #007bff;
          color: white;
        }
        
        .btn-resolve:hover {
          background: #0056b3;
          transform: translateY(-2px);
        }
        
        .btn-misassign {
          background: #dc3545;
          color: white;
        }
        
        .btn-misassign:hover {
          background: #c82333;
          transform: translateY(-2px);
        }
        
        .btn-details {
          background: #f8f9fa;
          color: #495057;
          border: 2px solid #e9ecef;
        }
        
        .btn-details:hover {
          background: #e9ecef;
          transform: translateY(-2px);
        }
        
        .loading-spinner {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 200px;
          font-size: 18px;
          color: white;
        }
        
        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: white;
        }
        
        .empty-icon {
          font-size: 4rem;
          margin-bottom: 20px;
          opacity: 0.7;
        }
        
        .empty-title {
          font-size: 1.5rem;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .empty-description {
          font-size: 1rem;
          opacity: 0.8;
        }
        
        .task-list-item {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          padding: 20px;
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 20px;
          align-items: center;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          transition: all 0.2s ease;
        }
        
        .task-list-item:hover {
          transform: translateX(5px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .modal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(5px);
        }
        
        .modal-content {
          background: white;
          border-radius: 20px;
          padding: 30px;
          max-width: 600px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f0f0f0;
        }
        
        .modal-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #2d3748;
        }
        
        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #718096;
          cursor: pointer;
          padding: 5px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }
        .management-section { margin-bottom: 24px; }
        .stats-container { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: #fff; border-radius: 12px; padding: 20px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
        .stat-card h3 { margin: 0; font-size: 14px; font-weight: 600; color: #6b7280; }
        .stat-number { font-size: 28px; font-weight: 700; color: #0b1220; }
        .filters-container { background: #fff; border-radius: 12px; border: 1px solid #e5e7eb; padding: 20px; margin-bottom: 20px; }
        .filter-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; margin-bottom: 12px; align-items: end; }
        .filter-input, .filter-select { padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 6px; font-size: 14px; }
        .view-toggle { display: flex; background: #f3f4f6; border-radius: 6px; padding: 2px; }
        .view-btn { padding: 6px 12px; border: none; background: transparent; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
        .view-btn.active { background: #0b1220; color: #fff; }
        .tasks-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .task-card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; cursor: pointer; transition: all 0.2s; }
        .task-card:hover { border-color: #d1d5db; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
        .task-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .task-id { font-size: 12px; color: #6b7280; font-weight: 600; }
        .status-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; text-transform: capitalize; }
        .status-badge.assigned { background: #dbeafe; color: #1e40af; }
        .status-badge.in-progress { background: #fed7aa; color: #92400e; }
        .status-badge.resolved { background: #d1fae5; color: #065f46; }
        .priority-badge { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; margin-left: 8px; }
        .priority-badge.urgent { background: #fee2e2; color: #991b1b; }
        .priority-badge.high { background: #fed7aa; color: #92400e; }
        .priority-badge.normal { background: #e5e7eb; color: #374151; }
        .task-title { font-weight: 700; font-size: 15px; color: #0b1220; margin: 0 0 10px 0; }
        .task-detail { font-size: 13px; margin-bottom: 6px; display: flex; justify-content: space-between; }
        .task-detail .label { color: #6b7280; }
        .task-detail .value { font-weight: 600; color: #0b1220; }
        .task-actions { display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap; }
        .action-btn { flex: 1; min-width: 80px; padding: 8px 12px; border: none; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .action-btn.primary { background: #0b1220; color: #fff; }
        .action-btn.primary:hover { background: #1f2937; }
        .action-btn.success { background: #10b981; color: #fff; }
        .action-btn.success:hover { background: #059669; }
        .action-btn.danger { background: #ef4444; color: #fff; }
        .action-btn.danger:hover { background: #dc2626; }
        .action-btn.secondary { background: #f3f4f6; color: #111827; border: 1px solid #e5e7eb; }
        .action-btn.secondary:hover { background: #e5e7eb; }
        .popup { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .popup-content { background: #fff; border-radius: 12px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
        .popup-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e5e7eb; }
        .popup-header h2 { margin: 0; font-size: 18px; }
        .close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #6b7280; }
        .popup-body { padding: 20px; }
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
        .btn-success { background: #10b981; color: #fff; }
        .btn-success:hover { background: #059669; }
        .btn-danger { background: #ef4444; color: #fff; }
        .btn-danger:hover { background: #dc2626; }
        .empty-state { text-align: center; padding: 40px 20px; color: #6b7280; }
        .loading-state { text-align: center; padding: 40px 20px; }
        .tasks-list { display: flex; flex-direction: column; gap: 12px; }
        .task-list-item { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; display: grid; grid-template-columns: auto 1fr auto auto; gap: 16px; align-items: center; transition: all 0.2s; }
        .task-list-item:hover { border-color: #d1d5db; box-shadow: 0 2px 8px rgba(0,0,0,0.06); }
      `}</style>

      <div className="management-section">
        <div style={{ marginBottom: "24px" }}>
          <h3 style={{ color: "rgba(0,0,0,0.7)", margin: 0 }}>My Assigned Tasks</h3>
          <p style={{ color: "#6b7280", margin: "8px 0 0 0", fontSize: "14px" }}>
            Manage and complete your assigned maintenance tasks
          </p>
        </div>

        {/* Statistics Section */}
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Tasks</h3>
            <div className="stat-number">{taskStats.total}</div>
          </div>
          <div className="stat-card">
            <h3>Assigned</h3>
            <div className="stat-number" style={{ color: '#1e40af' }}>{taskStats.assigned}</div>
          </div>
          <div className="stat-card">
            <h3>In Progress</h3>
            <div className="stat-number" style={{ color: '#dc2626' }}>{taskStats.inProgress}</div>
          </div>
          <div className="stat-card">
            <h3>Urgent</h3>
            <div className="stat-number" style={{ color: '#dc2626' }}>{taskStats.urgent}</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="filters-container">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Search tasks by title, location, or category..."
              className="filter-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved (Awaiting Confirmation)">Resolved</option>
            </select>
            
            <select
              className="filter-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="All">All Priority</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Normal">Normal</option>
            </select>
            
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="priority">Sort by Priority</option>
              <option value="date">Sort by Date</option>
              <option value="status">Sort by Status</option>
            </select>
            
            <div className="view-toggle">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                ⊞
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                ☰
              </button>
            </div>
          </div>
        </div>
        {/* Tasks Content */}
        {loading ? (
          <div className="loading-spinner">
            <div>⏳ Loading your tasks...</div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <div className="empty-title">No Tasks Found</div>
            <div className="empty-description">
              {tasks.length === 0 
                ? "You don't have any assigned tasks yet."
                : "No tasks match your current filters."
              }
            </div>
          </div>
        ) : viewMode === 'grid' ? (

          <div className="tasks-grid">
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="task-card"
                  onClick={() => openTaskModal(task)}
                >
                  <div className="task-card-header">
                    <span className="task-id">#{task._id.slice(-6)}</span>
                    <div>
                      <span className={`status-badge ${task.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {task.status}
                      </span>
                      <span className={`priority-badge ${task.priority?.toLowerCase()}`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="task-title">{task.title || 'Untitled Task'}</h3>
                  
                  <div className="task-detail">
                    <span className="label">Category:</span>
                    <span className="value">{task.category}</span>
                  </div>
                  <div className="task-detail">
                    <span className="label">Location:</span>
                    <span className="value">{task.location || 'N/A'}</span>
                  </div>
                  <div className="task-detail">
                    <span className="label">Deadline:</span>
                    <span className="value">{formatDate(task.deadline) || 'No deadline'}</span>
                  </div>
                  
                  <div className="task-actions">
                    {task.status === STATUS_ASSIGNED && (
                      <button 
                        className="action-btn primary"
                        onClick={(e) => { e.stopPropagation(); updateTaskStatus(task._id, STATUS_IN_PROGRESS); }}
                      >
                        Start
                      </button>
                    )}
                    {task.status === STATUS_IN_PROGRESS && (
                      <button 
                        className="action-btn success"
                        onClick={(e) => { e.stopPropagation(); openTaskModal(task); }}
                      >
                        Complete
                      </button>
                    )}
                    <button 
                      className="action-btn secondary"
                      onClick={(e) => { e.stopPropagation(); openTaskModal(task); }}
                    >
                      Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="tasks-list">
            <AnimatePresence>
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="task-list-item"
                  onClick={() => openTaskModal(task)}
                >
                  <div>
                    <span className={`priority-badge ${task.priority?.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '15px', marginBottom: '6px', color: '#0b1220' }}>
                      {task.title || 'Untitled Task'}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: '13px' }}>
                      {task.location} • {task.resident?.residentFirstname ? 
                        `${task.resident.residentFirstname} ${task.resident.residentLastname}` : 
                        task.resident?.name || 'Unknown'
                      } • {task.category}
                    </div>
                  </div>
                  
                  <div>
                    <span className={`status-badge ${task.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.status}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {task.status === STATUS_ASSIGNED && (
                      <button
                        className="action-btn primary"
                        style={{ minWidth: '70px', padding: '6px 12px', fontSize: '12px' }}
                        onClick={(e) => { e.stopPropagation(); updateTaskStatus(task._id, STATUS_IN_PROGRESS); }}
                      >
                        Start
                      </button>
                    )}
                    {task.status === STATUS_IN_PROGRESS && (
                      <button
                        className="action-btn success"
                        style={{ minWidth: '70px', padding: '6px 12px', fontSize: '12px' }}
                        onClick={(e) => { e.stopPropagation(); openTaskModal(task); }}
                      >
                        Complete
                      </button>
                    )}
                    <button
                      className="action-btn secondary"
                      style={{ minWidth: '70px', padding: '6px 12px', fontSize: '12px' }}
                      onClick={(e) => { e.stopPropagation(); openTaskModal(task); }}
                    >
                      Details
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Task Details Modal */}
        <AnimatePresence>
          {isDetailModalOpen && selectedTask && (
            <motion.div
              className="popup"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeTaskDetails}
            >
              <motion.div
                className="popup-content"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="popup-header">
                  <h2>Task Details</h2>
                  <button className="close-btn" onClick={closeTaskDetails}>✕</button>
                </div>
                
                <div className="popup-body">
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">Title</span>
                      <span className="detail-value">{selectedTask.title || 'Untitled Task'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status</span>
                      <span className={`status-badge ${selectedTask.status?.toLowerCase().replace(/\s+/g, '-')}`}>
                        {selectedTask.status}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Priority</span>
                      <span className={`priority-badge ${selectedTask.priority?.toLowerCase()}`}>
                        {selectedTask.priority}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Category</span>
                      <span className="detail-value">{selectedTask.category}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Location</span>
                      <span className="detail-value">{selectedTask.location || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created</span>
                      <span className="detail-value">
                        {selectedTask.createdAt ? new Date(selectedTask.createdAt).toLocaleString() : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item full">
                      <span className="detail-label">Description</span>
                      <span className="detail-value">{selectedTask.description || 'No description provided.'}</span>
                    </div>
                    <div className="detail-item full">
                      <span className="detail-label">Resident</span>
                      <span className="detail-value">
                        {selectedTask.resident?.residentFirstname && selectedTask.resident?.residentLastname
                          ? `${selectedTask.resident.residentFirstname} ${selectedTask.resident.residentLastname}`
                          : selectedTask.resident?.name || 'Unknown'
                        } {selectedTask.resident?.uCode ? `(${selectedTask.resident.uCode})` : ''}
                      </span>
                    </div>
                    {selectedTask.remarks && (
                      <div className="detail-item full">
                        <span className="detail-label">Remarks</span>
                        <span className="detail-value">{selectedTask.remarks}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="popup-footer">
                  <button className="btn-secondary" onClick={closeTaskDetails}>
                    Close
                  </button>
                  
                  {selectedTask.status === STATUS_ASSIGNED && (
                    <>
                      <button
                        className="btn-primary"
                        disabled={actionLoading}
                        onClick={() => {
                          updateTaskStatus(selectedTask._id, STATUS_IN_PROGRESS);
                          closeTaskDetails();
                        }}
                      >
                        Start Task
                      </button>
                      <button
                        className="btn-danger"
                        disabled={actionLoading}
                        onClick={() => {
                          handleMisassigned(selectedTask._id);
                          closeTaskDetails();
                        }}
                      >
                        Mark Misassigned
                      </button>
                    </>
                  )}
                  
                  {selectedTask.status === STATUS_IN_PROGRESS && (
                    <>
                      <div className="cost-input-container" style={{ marginBottom: '10px', width: '100%' }}>
                        <label htmlFor="estimatedCost" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          Estimated Cost ($):
                        </label>
                        <input
                          type="number"
                          id="estimatedCost"
                          value={estimatedCost}
                          onChange={(e) => setEstimatedCost(e.target.value)}
                          min="0"
                          step="0.01"
                          placeholder="Enter estimated cost"
                          style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #ccc',
                            borderRadius: '4px',
                            fontSize: '14px'
                          }}
                        />
                      </div>
                      <button
                        className="btn-success"
                        disabled={actionLoading}
                        onClick={() => {
                          updateTaskStatus(selectedTask._id, STATUS_RESOLVED, estimatedCost);
                          closeTaskDetails();
                        }}
                      >
                        Mark Complete
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>

  );
};