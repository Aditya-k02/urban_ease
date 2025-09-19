import React from 'react';
import { Eye, CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react';
import Status from './Status';
import styles from './Applications.module.css';

export default function ApplicationsTable({ applications, onViewDetails, onApprove, onReject, actionLoading }) {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle2 size={16} color="#22c55e" />;
      case 'REJECTED':
        return <XCircle size={16} color="#ef4444" />;
      case 'AWAITING PAYMENT':
        return <CreditCard size={16} color="#f59e0b" />;
      case 'COMPLETED':
        return <CheckCircle2 size={16} color="#3b82f6" />;
      default:
        return <Clock size={16} color="#9ca3af" />;
    }
  };

  if (applications.length === 0) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>📋</div>
        <h3>No applications found</h3>
        <p>There are no applications matching your criteria</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Community Name</th>
            <th>Location</th>
            <th>Applied On</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app.id}>
              <td>
                <div className={styles.nameCell}>
                  <div className={styles.avatar}>
                    {app.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{app.name}</span>
                </div>
              </td>
              <td>{app.email}</td>
              <td className={styles.communityName}>{app.communityName}</td>
              <td>{app.location}</td>
              <td>{app.appliedOn}</td>
              <td>
                <div className={styles.statusCell}>
                  {getStatusIcon(app.uiStatus)}
                  <Status status={app.uiStatus} />
                </div>
              </td>
              <td>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.actionBtn} ${styles.viewBtn}`}
                    onClick={() => onViewDetails(app)}
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>

                  {app.status === 'PENDING' && (
                    <>
                      <button
                        className={`${styles.actionBtn} ${styles.approveBtn}`}
                        onClick={() => onApprove(app.id)}
                        disabled={actionLoading === app.id}
                        title="Approve"
                      >
                        {actionLoading === app.id ? (
                          <span className={styles.spinner} />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.rejectBtn}`}
                        onClick={() => onReject(app.id)}
                        disabled={actionLoading === app.id}
                        title="Reject"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
