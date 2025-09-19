import React, { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import Tabs from './Tabs';
import ApplicationStats from './ApplicationStats';
import ApplicationsTable from './ApplicationsTable';
import ApplicationDetailsModal from './ApplicationDetailsModal';
import RejectApplicationModal from './RejectApplicationModal';
import { useApplicationsData } from '../../hooks/useApplicationsData';
import { Spinner } from '../common/Loader';
import styles from './Applications.module.css';

export default function AdminApplications() {
  const { applications, loading, error, fetchApplications, handleApprove, handleReject } = useApplicationsData();
  
  const [activeTab, setActiveTab] = useState('All');
  const [selectedApp, setSelectedApp] = useState(null);
  const [rejectingApp, setRejectingApp] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Filter applications by tab
  const filteredApplications = useMemo(() => {
    if (activeTab === 'All') return applications;
    if (activeTab === 'Awaiting Payment') {
      return applications.filter(app => app.uiStatus === 'AWAITING PAYMENT');
    }
    return applications.filter(app => app.status === activeTab.toUpperCase());
  }, [applications, activeTab]);

  // Count for tabs
  const tabCounts = useMemo(() => ({
    All: applications.length,
    Pending: applications.filter(app => app.status === 'PENDING').length,
    Approved: applications.filter(app => app.status === 'APPROVED').length,
    'Awaiting Payment': applications.filter(app => app.uiStatus === 'AWAITING PAYMENT').length,
    Rejected: applications.filter(app => app.status === 'REJECTED').length,
  }), [applications]);

  const tabs = ['All', 'Pending', 'Approved', 'Awaiting Payment', 'Rejected'];

  // Handle approve action
  const onApprove = async (appId) => {
    setActionLoading(appId);
    const result = await handleApprove(appId);
    setActionLoading(null);

    if (result.success) {
      setSuccessMessage('Application approved successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  // Handle reject initiation
  const onRejectInit = (appId) => {
    const app = applications.find(a => a.id === appId);
    setRejectingApp(app);
  };

  // Handle reject confirmation
  const onRejectConfirm = async (reason) => {
    if (!rejectingApp) return;
    
    setActionLoading(rejectingApp.id);
    const result = await handleReject(rejectingApp.id, reason);
    setActionLoading(null);
    setRejectingApp(null);

    if (result.success) {
      setSuccessMessage('Application rejected successfully');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  if (loading && applications.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spinner size={40} color="#3b82f6" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Community Applications</h2>
          <p className={styles.subtitle}>Review and manage community manager applications</p>
        </div>
        <button
          className="btn btn-primary d-flex align-items-center gap-2"
          onClick={fetchApplications}
          disabled={loading}
        >
          {loading ? <Spinner size={18} color="#fff" /> : <RefreshCw size={18} />}
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Stats Cards */}
      <ApplicationStats applications={applications} />

      {/* Tabs */}
      <Tabs
        tabs={tabs.map(tab => ({ label: tab, count: tabCounts[tab] }))}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Applications Table */}
      <ApplicationsTable
        applications={filteredApplications}
        onViewDetails={setSelectedApp}
        onApprove={onApprove}
        onReject={onRejectInit}
        actionLoading={actionLoading}
      />

      {/* Details Modal */}
      {selectedApp && (
        <ApplicationDetailsModal
          application={selectedApp}
          onClose={() => setSelectedApp(null)}
          onApprove={onApprove}
          onReject={onRejectInit}
        />
      )}

      {/* Reject Modal */}
      {rejectingApp && (
        <RejectApplicationModal
          application={rejectingApp}
          onConfirm={onRejectConfirm}
          onCancel={() => setRejectingApp(null)}
          isLoading={actionLoading === rejectingApp.id}
        />
      )}
    </div>
  );
}
