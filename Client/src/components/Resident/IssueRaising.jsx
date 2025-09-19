import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast, ToastContainer } from "react-toastify";
import { useDispatch, useSelector } from 'react-redux';
import { fetchIssues, raiseIssue, submitFeedback } from '../../Slices/IssueSlice';
import { Loader } from '../Loader';
import { useSocket } from "../../hooks/useSocket";

export const IssueRaising = () => {
  const dispatch = useDispatch();
  const { issues, loading } = useSelector((state) => state.Issue);
  const [isIssueFormOpen, setIsIssueFormOpen] = useState(false);
  const [isDetailsPopupOpen, setIsDetailsPopupOpen] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('Resident');
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const socket = useSocket("http://localhost:3000");

  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      title: '',
      category: '',
      // Priority automatically determined by system based on category and content
      description: '',
      location: '',
      otherCategory: '', // Optional, for custom category
    },
  });

  const category = watch('category');

  const pendingIssuesCount = issues?.filter((i) => i?.status === 'Pending')?.length || 0;
  const resolvedIssuesCount = issues?.filter((i) => i?.status === 'Resolved')?.length || 0;

  // Status flow configuration (add Payment Pending and Payment Completed)
  const statusFlowResident = [
    { key: 'Pending Assignment', label: 'Pending', icon: 'bi-hourglass-split' },
    { key: 'Assigned', label: 'Assigned', icon: 'bi-person-check' },
    { key: 'In Progress', label: 'In Progress', icon: 'bi-gear' },
    { key: 'Resolved (Awaiting Confirmation)', label: 'Awaiting Confirmation', icon: 'bi-check-circle' },
    { key: 'Payment Pending', label: 'Payment Pending', icon: 'bi-cash-coin' },
    { key: 'Closed', label: 'Closed', icon: 'bi-check-circle-fill' },
    { key: 'Payment Completed', label: 'Payment Completed', icon: 'bi-cash-stack' }
  ];

  const statusFlowCommunity = [
    { key: 'Pending Assignment', label: 'Pending', icon: 'bi-hourglass-split' },
    { key: 'Assigned', label: 'Assigned', icon: 'bi-person-check' },
    { key: 'In Progress', label: 'In Progress', icon: 'bi-gear' },
    { key: 'Resolved', label: 'Resolved', icon: 'bi-check-circle' },
    { key: 'Closed', label: 'Closed', icon: 'bi-check-circle-fill' }
  ];

  const getStatusIndex = (status, categoryType) => {
    const flow = categoryType === "Community" ? statusFlowCommunity : statusFlowResident;
    const index = flow.findIndex(s => s.key === status);
    return index !== -1 ? index : 0;
  };

  useEffect(() => {
    dispatch(fetchIssues());
  }, [dispatch]);

  useEffect(() => {
    if (!socket) return;

    const handleIssueUpdate = () => {
      dispatch(fetchIssues());
    };

    socket.on("issue:updated", handleIssueUpdate);
    return () => {
      socket.off("issue:updated", handleIssueUpdate);
    };
  }, [socket, dispatch]);

  useEffect(() => {
    if (formSubmitting && !loading) {
      setFormSubmitting(false);
      setIsIssueFormOpen(false);
      reset();
    }
  }, [loading, formSubmitting, reset]);

  const onSubmit = (data) => {
    setFormSubmitting(true);

    // If category is "Other", send otherCategory
    const payload = {
      ...data,
      categoryType: activeTab, // Set based on selected tab
      otherCategory: data.category === 'Other' ? data.otherCategory : undefined,
    };

    dispatch(raiseIssue(payload))
      .unwrap()
      .then(() => {
        toast.success('Issue raised successfully!');
      })
      .catch((error) => {
        setFormSubmitting(false);
        toast.error(error || 'Failed to raise issue.');
      });
  };

  const showDetails = (issue) => {
    setSelectedIssue(issue);
    setIsDetailsPopupOpen(true);
  };

  const closeIssueForm = () => {
    if (!formSubmitting) {
      setIsIssueFormOpen(false);
      reset();
    }
  };

  const RissueCategories = [
    "Plumbing",
      "Electrical",
      "Security",
      "Maintenance",
      "Pest Control",
      "Waste Management",
  ];
  const CissueCategories=[
    "Streetlight",
      "Elevator",
      "Garden",
      "Common Area"
  ]

  // Priority is now automatically determined by the system
  // Confirm issue resolution
  const handleConfirm = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/resident/issue/confirmIssue/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!data.success) throw new Error(data.message || "Failed to confirm");
      toast.success("Issue confirmed! Payment process initiated.");
      setIsDetailsPopupOpen(false);
      dispatch(fetchIssues());
    } catch (err) {
      toast.error(err.message || "Action not allowed");
    }
  };

  // Reject issue resolution
  const handleReject = async (id) => {
    try {
      const res = await fetch(`http://localhost:3000/resident/issue/rejectIssueResolution/${id}`, {
        method: "POST",
        credentials: "include",
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!data.success) throw new Error(data.message || "Failed to reject");
      toast.success("Issue reopened!");
      setIsDetailsPopupOpen(false);
      dispatch(fetchIssues());
    } catch (err) {
      toast.error(err.message || "Action not allowed");
    }
  };

  const handleFeedbackSubmit = async () => {
    setFeedbackSubmitting(true);
    dispatch(submitFeedback({
      id: selectedIssue._id,
      feedback: feedbackText,
      rating: feedbackRating,
    }))
      .unwrap()
      .then(() => {
        toast.success("Feedback submitted!");
        setIsDetailsPopupOpen(false);
        setFeedbackText("");
        setFeedbackRating(5);
        dispatch(fetchIssues());
      })
      .catch((err) => {
        toast.error(err || "Failed to submit feedback.");
      })
      .finally(() => setFeedbackSubmitting(false));
  };

  // Filter issues by tab
  const filteredIssues = issues?.filter(
    (i) => i?.categoryType === activeTab
  );

  return (
    <div>
      <ToastContainer position="top-center" />
      <style>{`
        .status-tracker {
          padding: 24px 0;
          margin: 24px 0;
          border-top: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
        }

        .tracker-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          max-width: 800px;
          margin: 0 auto;
        }

        .tracker-line {
          position: absolute;
          top: 20px;
          left: 0;
          right: 0;
          height: 3px;
          background: #e5e7eb;
          z-index: 0;
        }

        .tracker-progress {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: linear-gradient(90deg, #10b981, #059669);
          transition: width 0.5s ease;
          border-radius: 2px;
        }

        .tracker-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
          flex: 1;
        }

        .tracker-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 3px solid #e5e7eb;
          transition: all 0.3s ease;
          margin-bottom: 8px;
        }

        .tracker-step.active .tracker-icon-wrapper {
          border-color: #10b981;
          background: #10b981;
          color: white;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .tracker-step.completed .tracker-icon-wrapper {
          border-color: #10b981;
          background: #10b981;
          color: white;
        }

        .tracker-step.pending .tracker-icon-wrapper {
          border-color: #e5e7eb;
          background: white;
          color: #9ca3af;
        }

        .tracker-icon {
          font-size: 16px;
        }

        .tracker-label {
          font-size: 12px;
          font-weight: 500;
          text-align: center;
          color: #6b7280;
          max-width: 80px;
        }

        .tracker-step.active .tracker-label {
          color: #10b981;
          font-weight: 600;
        }

        .tracker-step.completed .tracker-label {
          color: #059669;
        }

        .special-status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          margin-top: 12px;
        }

        .special-status-badge.on-hold {
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fbbf24;
        }

        .special-status-badge.reopened {
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #3b82f6;
        }

        .special-status-badge.rejected {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #ef4444;
        }

        .special-status-badge.auto-closed {
          background: #f3f4f6;
          color: #374151;
          border: 1px solid #9ca3af;
        }/* Add this inside your <style> tag in IssueRaising.jsx */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 32px;
  padding: 24px 18px;
  background: #fafbfc;
  border-radius: 12px;
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 15px;
  line-height: 1.5;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
  min-width: 110px;
  display: inline-block;
}

.detail-value {
  font-weight: 600;
  color: #22223b;
  word-break: break-word;
}

.detail-item.col-span-2 {
  grid-column: span 2;
}

@media (max-width: 700px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 14px 0;
    padding: 14px 6px;
  }
  .detail-item.col-span-2 {
    grid-column: span 1;
  }
}

/* Responsive grid for stats */
.stats-grid {
  display: flex;
  gap: 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1 1 180px;
  min-width: 180px;
  background: #fff;
  border-left: 6px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
@media (max-width: 700px) {
  .stats-grid {
    flex-direction: column;
    gap: 10px;
  }
  .stat-card {
    min-width: 0;
    width: 100%;
  }
}

/* Responsive bookings grid */
.bookings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}
.booking-card {
  flex: 1 1 320px;
  min-width: 280px;
  max-width: 100%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 12px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
@media (max-width: 900px) {
  .bookings-grid {
    flex-direction: column;
    gap: 12px;
  }
  .booking-card {
    min-width: 0;
    width: 100%;
  }
}

/* Responsive popup */
.popup-content {
  max-width: 600px;
  width: 95vw;
  margin: 0 auto;
  border-radius: 12px;
  padding: 18px 10px;
}
@media (max-width: 600px) {
  .popup-content {
    padding: 8px 2vw;
    max-width: 99vw;
  }
  .popup-header h2, .popup-header h3 {
    font-size: 1.1rem;
  }
}

/* Responsive form grid */
.booking-form-grid {
  display: flex;
  flex-direction: row;
  gap: 24px;
}
.form-column {
  flex: 1 1 320px;
}
@media (max-width: 700px) {
  .booking-form-grid {
    flex-direction: column;
    gap: 10px;
  }
  .form-column {
    width: 100%;
  }
}

/* Responsive details grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 32px;
  padding: 24px 18px;
  background: #fafbfc;
  border-radius: 12px;
  margin-bottom: 16px;
}
@media (max-width: 700px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 14px 0;
    padding: 14px 6px;
  }
  .detail-item.col-span-2 {
    grid-column: span 1;
  }
}

/* Responsive buttons */
.form-actions, .popup-footer {
  flex-wrap: wrap;
  gap: 10px;
}
@media (max-width: 500px) {
  .form-actions button, .popup-footer button {
    width: 100%;
    margin-bottom: 6px;
  }
}

/* Responsive section titles */
.section-title, .table-title {
  font-size: 1.2rem;
}
@media (max-width: 500px) {
  .section-title, .table-title {
    font-size: 1rem;
  }
}

/* --- Custom Tabs Styling --- */
.custom-tabs {
  display: flex;
  border-bottom: 2px solid #e5e7eb;
  margin-bottom: 24px;
  background: #f8fafc;
  border-radius: 8px 8px 0 0;
  overflow: hidden;
}
.custom-tab-btn {
  flex: 1 1 0;
  padding: 12px 0;
  background: none;
  border: none;
  outline: none;
  font-size: 1rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
  border-bottom: 3px solid transparent;
}
.custom-tab-btn.active {
  color: #10b981;
  background: #fff;
  border-bottom: 3px solid #10b981;
  font-weight: 700;
}
.custom-tab-btn:not(.active):hover {
  background: #f1f5f9;
  color: #0ea5e9;
}
@media (max-width: 600px) {
  .custom-tabs {
    flex-direction: column;
    border-radius: 8px;
  }
  .custom-tab-btn {
    border-bottom: none;
    border-left: 4px solid transparent;
    border-radius: 8px 8px 0 0;
    text-align: left;
    padding: 10px 12px;
  }
  .custom-tab-btn.active {
    border-left: 4px solid #10b981;
    border-bottom: none;
    background: #fff;
  }
}
  
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="section-title">Issue Management</h4>
        <div className="d-flex gap-2">
          <button 
            id="raiseIssueBtn" 
            className="btn btn-success" 
            onClick={() => setIsIssueFormOpen(true)}
          >
            <i className="bi bi-plus-lg me-2"></i>Raise an Issue
          </button>
        </div>
      </div>

      {/* --- Improved Tabs --- */}
      <div className="custom-tabs">
        <button
          className={`custom-tab-btn${activeTab === 'Resident' ? ' active' : ''}`}
          onClick={() => setActiveTab('Resident')}
          type="button"
        >
          <i className="bi bi-person me-2"></i> Resident Issues
        </button>
        <button
          className={`custom-tab-btn${activeTab === 'Community' ? ' active' : ''}`}
          onClick={() => setActiveTab('Community')}
          type="button"
        >
          <i className="bi bi-people me-2"></i> Community Issues
        </button>
      </div>

      <div className="stats-grid mb-4">
        <div className="stat-card" style={{ borderLeftColor: 'green' }}>
          <p className="card-label">Total Issues (this month)</p>
          <h2 className="card-value text-success">{issues?.length || 0}</h2>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'var(--warning)' }}>
          <p className="card-label">Pending Issues</p>
          <h2 className="card-value text-warning">{pendingIssuesCount}</h2>
        </div>
        <div className="stat-card" style={{ borderLeftColor: 'blue' }}>
          <p className="card-label">Resolved Issues</p>
          <h2 className="card-value text-primary">{resolvedIssuesCount}</h2>
        </div>
      </div>

      <div>
        <h4 className="table-title">{activeTab} Issues</h4>
        <div className="row bookings-grid">
          {loading && (
            <div className="col-12 d-flex justify-content-center py-5">
              <Loader />
            </div>
          )}
          {!loading && filteredIssues?.filter(Boolean).length > 0 ? (
            filteredIssues
              ?.filter(Boolean)
              .map((issue) => (
                <div key={issue?._id} className={`booking-card ${issue?.status || ''}`}>
                  <div className="booking-card-header">
                    <span className="booking-id">#{issue?._id?.slice(-6)}</span>
                    <span className={`status-badge status-${issue?.status || ''}`}>
                      {issue?.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="booking-details">
                    <div className="booking-detail">
                      <span className="detail-label">Title:</span>
                      <span className="detail-value">{issue?.title || '-'}</span>
                    </div>
                    <div className="booking-detail">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{issue?.category || '-'}</span>
                    </div>
                    <div className="booking-detail">
                      <span className="detail-label">Priority:</span>
                      <span className={`detail-value priority-${issue?.priority?.toLowerCase()}`}>
                        {issue?.priority || 'Auto-determined'} 
                        {issue?.priority && <span style={{fontSize: '11px', color: '#666', marginLeft: '4px'}}>(Auto)</span>}
                      </span>
                    </div>
                    <div className="booking-detail">
                      <span className="detail-label">Raised On:</span>
                      <span className="detail-value">
                        {issue?.createdAt 
                          ? new Date(issue.createdAt).toLocaleDateString('en-IN', { 
                              day: '2-digit', 
                              month: '2-digit', 
                              year: 'numeric' 
                            }) 
                          : '-'}
                      </span>
                    </div>
                  </div>
                  <div className="booking-actions">
                    <button className="action-btn view" onClick={() => showDetails(issue)}>
                      <i className="bi bi-eye"></i> View Details
                    </button>
                  </div>
                </div>
              ))
          ) : (
            !loading && (
              <div className="col-12 shadow-sm rounded-2 no-bookings d-flex gap-3 justify-content-center align-items-center text-muted">
                <i className="bi bi-exclamation-triangle fs-3"></i>
                <h4 className="m-0">No issues found</h4>
              </div>
            )
          )}
        </div>
      </div>

      {isIssueFormOpen && (
        <div className="popup">
          <div className="popup-content position-relative">
            {formSubmitting && (
              <div className="popup-loader-overlay">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Submitting...</span>
                </div>
              </div>
            )}
            <div className="popup-header">
              <h3>Raise an Issue</h3>
              <div className="issue-type-indicator" style={{
                background: activeTab === 'Resident' ? '#e8f5e8' : '#fff3e0',
                color: activeTab === 'Resident' ? '#2e7d32' : '#ef6c00',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                marginTop: '8px'
              }}>
                <i className={`bi ${activeTab === 'Resident' ? 'bi-house-door' : 'bi-building'}`} style={{marginRight: '6px'}}></i>
                {activeTab} Issue
              </div>
              <button 
                type="button" 
                className="close-btn" 
                onClick={closeIssueForm}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
            <div className="booking-form-grid">
              <div className="form-column">
                {/* Category Type is automatically set based on selected tab */}

                {/* Title (optional, backend ignores) */}
                <div className="form-group">
                  <label htmlFor="title">Issue Title *</label>
                  <input
                    type="text"
                    id="title"
                    {...register('title', { required: true })}
                    placeholder="Brief title of the issue..."
                    disabled={formSubmitting}
                  />
                </div>


                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    {...register('category', { required: true })}
                    disabled={formSubmitting}
                  >
                    <option value="">Choose a category...</option>
                    {(activeTab === 'Resident' ? RissueCategories : CissueCategories).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>



                {/* Other Category (only if "Other" is selected) */}
                {category === 'Other' && (
                  <div className="form-group">
                    <label htmlFor="otherCategory">Specify Category *</label>
                    <input
                      type="text"
                      id="otherCategory"
                      {...register('otherCategory', { required: true })}
                      placeholder="Enter custom category"
                      disabled={formSubmitting}
                    />
                  </div>
                )}

                {/* Priority is automatically determined by system based on category and description */}
                <div className="info-note" style={{
                  background: '#e3f2fd',
                  padding: '12px',
                  borderRadius: '6px',
                  margin: '16px 0',
                  fontSize: '14px',
                  color: '#1565c0'
                }}>
                  <i className="bi bi-info-circle" style={{marginRight: '8px'}}></i>
                  Priority is automatically determined based on issue type, timing, and urgency keywords
                </div>

                {/* Location (required if Community) */}
                <div className="form-group">
                  <label htmlFor="location">
                    Location {activeTab === 'Community' ? '*' : '(Optional)'}
                  </label>
                  <input
                    type="text"
                    id="location"
                    {...register('location', {
                      required: activeTab === 'Community',
                    })}
                    placeholder="e.g., Block A, Floor 3, Apt 302"
                    disabled={formSubmitting}
                  />
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="description">Description *</label>
                  <textarea
                    id="description"
                    rows="5"
                    {...register('description', { required: true })}
                    placeholder="Detailed description of the issue..."
                    disabled={formSubmitting}
                  ></textarea>
                </div>

                <div className="form-actions mt-3">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={closeIssueForm}
                    disabled={formSubmitting}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary" 
                    onClick={handleSubmit(onSubmit)}
                    disabled={formSubmitting}
                  >
                    <i className="bi bi-check-circle"></i> Submit Issue
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isDetailsPopupOpen && selectedIssue && (
        <div className="popup">
          <div className="popup-content" style={{ maxWidth: '900px' }}>
            <div className="popup-header">
              <h2>Issue Details</h2>
              <button
                className="close-btn"
                onClick={() => setIsDetailsPopupOpen(false)}
              >
                ✖
              </button>
            </div>
            <div className="popup-body">
              {/* Status Tracker */}
              <div className="status-tracker">
                <div className="tracker-container">
                  <div className="tracker-line">
                    <div
                      className="tracker-progress"
                      style={{
                        width: `${
                          (getStatusIndex(selectedIssue.status, selectedIssue.categoryType) /
                            ((selectedIssue.categoryType === "Community"
                              ? statusFlowCommunity.length
                              : statusFlowResident.length) -
                              1)) *
                          100
                        }%`
                      }}
                    />
                  </div>
                  {(selectedIssue.categoryType === "Community"
                    ? statusFlowCommunity
                    : statusFlowResident
                  ).map((step, index) => {
                    const currentIndex = getStatusIndex(selectedIssue.status, selectedIssue.categoryType);
                    const stepState =
                      index < currentIndex
                        ? "completed"
                        : index === currentIndex
                        ? "active"
                        : "pending";

                    return (
                      <div key={step.key} className={`tracker-step ${stepState}`}>
                        <div className="tracker-icon-wrapper">
                          <i className={`bi ${step.icon} tracker-icon`}></i>
                        </div>
                        <span className="tracker-label">{step.label}</span>
                      </div>
                    );
                  })}
                </div>
                
                {/* Special Status Badges */}
                {["On Hold", "Reopened", "Rejected", "Auto-Closed"].includes(selectedIssue.status) && (
                  <div className="text-center">
                    <span
                      className={`special-status-badge ${selectedIssue.status
                        .toLowerCase()
                        .replace(" ", "-")}`}
                    >
                      <i className="bi bi-exclamation-circle"></i>
                      {selectedIssue.status}
                    </span>
                  </div>
                )}
              </div>

              <div className="details-grid shadow-sm">
                <div className="detail-item">
                  <span className="detail-label">Issue ID</span>
                  <span className="detail-value">
                    {selectedIssue.issueID || `#${selectedIssue._id?.slice(-6)}`}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <span className={`status-badge status-${selectedIssue.status}`}>
                    {selectedIssue.status}
                  </span>
                </div>
                <div className="detail-item">
                  <i className="bi bi-card-heading text-primary"></i>
                  <div>
                    <span className="detail-label">Title</span>
                    <span className="detail-value">{selectedIssue.title}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="bi bi-tag text-primary"></i>
                  <div>
                    <span className="detail-label">Category</span>
                    <span className="detail-value">
                      {selectedIssue.category}
                      {selectedIssue.otherCategory && (
                        <span className="text-muted ms-2">({selectedIssue.otherCategory})</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="bi bi-person-badge text-primary"></i>
                  <div>
                    <span className="detail-label">Assigned Worker</span>
                    <span className="detail-value">
                      {selectedIssue.workerAssigned
                        ? `Worker ID: ${selectedIssue.workerAssigned?.toString().slice(-6)}`
                        : <span className="text-muted">Not Assigned</span>}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="bi bi-lightning-charge text-primary"></i>
                  <div>
                    <span className="detail-label">Auto Assigned</span>
                    <span className="detail-value">
                      {selectedIssue.autoAssigned ? (
                        <span className="badge bg-success">Yes</span>
                      ) : (
                        <span className="badge bg-secondary">No</span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="bi bi-exclamation-circle text-primary"></i>
                  <div>
                    <span className="detail-label">Priority</span>
                    <span className={`detail-value priority-${selectedIssue.priority?.toLowerCase()}`}>
                      {selectedIssue.priority} <span style={{fontSize: '11px', color: '#666'}}>(Auto-determined)</span>
                    </span>
                  </div>
                </div>
                <div className="detail-item">
                  <i className="bi bi-calendar text-primary"></i>
                  <div>
                    <span className="detail-label">Raised On</span>
                    <span className="detail-value">
                      {new Date(selectedIssue.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
                {selectedIssue.location && (
                  <div className="detail-item">
                    <i className="bi bi-geo-alt text-primary"></i>
                    <div>
                      <span className="detail-label">Location</span>
                      <span className="detail-value">{selectedIssue.location}</span>
                    </div>
                  </div>
                )}
                <div className="detail-item">
                  <i className="bi bi-cash-coin text-primary"></i>
                  <div>
                    <span className="detail-label">Payment Status</span>
                    <span className="detail-value">
                      {selectedIssue.paymentStatus || <span className="text-muted">N/A</span>}
                    </span>
                  </div>
                </div>
                <div className="detail-item col-span-2">
                  <i className="bi bi-card-text text-primary"></i>
                  <div>
                    <span className="detail-label">Description</span>
                    <span className="detail-value">{selectedIssue.description}</span>
                  </div>
                </div>
                {selectedIssue.resolvedAt && (
                  <div className="detail-item">
                    <i className="bi bi-check-circle text-success"></i>
                    <div>
                      <span className="detail-label">Resolved On</span>
                      <span className="detail-value">
                        {new Date(selectedIssue.resolvedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              
            </div>
            <div className="popup-footer d-flex gap-2">
              {/* Approve/Reject buttons only for Resident issues */}
              {selectedIssue.categoryType === "Resident" &&
                selectedIssue.status &&
                selectedIssue.status.trim().toLowerCase() ===
                  "resolved (awaiting confirmation)".toLowerCase() && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleConfirm(selectedIssue._id)}
                    >
                      <i className="bi bi-check-circle"></i> Approve Resolution
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleReject(selectedIssue._id)}
                    >
                      <i className="bi bi-x-circle"></i> Reject Resolution
                    </button>
                  </>
                )}

              {/* Feedback form for confirmed Resident issues awaiting payment */}
              {selectedIssue.categoryType === "Resident" &&
                selectedIssue.status === "Payment Pending" &&
                !selectedIssue.feedback && (
                <div style={{ width: "100%" }}>
                  <div className="mb-2">
                    <label htmlFor="feedbackText" className="form-label">Feedback</label>
                    <textarea
                      id="feedbackText"
                      className="form-control"
                      rows={3}
                      value={feedbackText}
                      onChange={e => setFeedbackText(e.target.value)}
                      disabled={feedbackSubmitting}
                      placeholder="Share your feedback about this issue resolution..."
                    />
                  </div>
                  <div className="mb-2">
                    <label htmlFor="feedbackRating" className="form-label">Rating</label>
                    <select
                      id="feedbackRating"
                      className="form-select"
                      value={feedbackRating}
                      onChange={e => setFeedbackRating(Number(e.target.value))}
                      disabled={feedbackSubmitting}
                    >
                      {[5,4,3,2,1].map(r => (
                        <option key={r} value={r}>{r} Star{r > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleFeedbackSubmit}
                    disabled={feedbackSubmitting || !feedbackText}
                  >
                    <i className="bi bi-send"></i> Submit Feedback
                  </button>
                </div>
              )}

              <button
                className="btn btn-secondary"
                onClick={() => setIsDetailsPopupOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Add this at the top or bottom of your JSX file, outside the component function
<style>
{`
/* Responsive grid for stats */
.stats-grid {
  display: flex;
  gap: 18px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.stat-card {
  flex: 1 1 180px;
  min-width: 180px;
  background: #fff;
  border-left: 6px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px 18px;
  margin-bottom: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}
@media (max-width: 700px) {
  .stats-grid {
    flex-direction: column;
    gap: 10px;
  }
  .stat-card {
    min-width: 0;
    width: 100%;
  }
}

/* Responsive bookings grid */
.bookings-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 18px;
}
.booking-card {
  flex: 1 1 320px;
  min-width: 280px;
  max-width: 100%;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  margin-bottom: 12px;
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
@media (max-width: 900px) {
  .bookings-grid {
    flex-direction: column;
    gap: 12px;
  }
  .booking-card {
    min-width: 0;
    width: 100%;
  }
}

/* Responsive popup */
.popup-content {
  max-width: 600px;
  width: 95vw;
  margin: 0 auto;
  border-radius: 12px;
  padding: 18px 10px;
}
@media (max-width: 600px) {
  .popup-content {
    padding: 8px 2vw;
    max-width: 99vw;
  }
  .popup-header h2, .popup-header h3 {
    font-size: 1.1rem;
  }
}

/* Responsive form grid */
.booking-form-grid {
  display: flex;
  flex-direction: row;
  gap: 24px;
}
.form-column {
  flex: 1 1 320px;
}
@media (max-width: 700px) {
  .booking-form-grid {
    flex-direction: column;
    gap: 10px;
  }
  .form-column {
    width: 100%;
  }
}

/* Responsive details grid */
.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18px 32px;
  padding: 24px 18px;
  background: #fafbfc;
  border-radius: 12px;
  margin-bottom: 16px;
}
@media (max-width: 700px) {
  .details-grid {
    grid-template-columns: 1fr;
    gap: 14px 0;
    padding: 14px 6px;
  }
  .detail-item.col-span-2 {
    grid-column: span 1;
  }
}

/* Responsive buttons */
.form-actions, .popup-footer {
  flex-wrap: wrap;
  gap: 10px;
}
@media (max-width: 500px) {
  .form-actions button, .popup-footer button {
    width: 100%;
    margin-bottom: 6px;
  }
}

/* Responsive section titles */
.section-title, .table-title {
  font-size: 1.2rem;
}
@media (max-width: 500px) {
  .section-title, .table-title {
    font-size: 1rem;
  }
}
`}
</style>