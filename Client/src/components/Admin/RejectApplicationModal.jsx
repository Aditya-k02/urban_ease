import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import styles from './Applications.module.css';

export default function RejectApplicationModal({ application, onConfirm, onCancel, isLoading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters');
      return;
    }
    onConfirm(reason);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel();
    }
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div className={`${styles.modal} ${styles.rejectModal}`}>
        <div className={styles.modalHeader}>
          <div className={styles.warningIcon}>
            <AlertTriangle size={24} color="#ef4444" />
          </div>
          <h3>Reject Application</h3>
          <button
            className={styles.closeBtn}
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <p className={styles.rejectWarning}>
            You are about to reject the application from <strong>{application?.name}</strong>. 
            This action requires a reason and will notify the applicant.
          </p>

          <div className={styles.formGroup}>
            <label htmlFor="rejectionReason">
              Reason for Rejection <span className={styles.required}>*</span>
            </label>
            <textarea
              id="rejectionReason"
              className={styles.textarea}
              rows={4}
              placeholder="Please provide a clear reason for rejecting this application..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError('');
              }}
              disabled={isLoading}
            />
            {error && <div className={styles.errorText}>{error}</div>}
            <div className={styles.charCount}>
              {reason.length} / 500 characters
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button
            className={`${styles.btn} ${styles.btnSecondary}`}
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            className={`${styles.btn} ${styles.btnDanger}`}
            onClick={handleSubmit}
            disabled={isLoading || !reason.trim()}
          >
            {isLoading ? (
              <>
                <span className={styles.spinner} />
                Rejecting...
              </>
            ) : (
              'Confirm Rejection'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
