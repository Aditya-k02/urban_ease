import { useState, useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import styles from './DeleteCommunityModal.module.css';

const DeleteCommunityModal = ({ isOpen, onClose, community, deletionCounts, onConfirm, isDeleting }) => {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef(null);
  const inputRef = useRef(null);

  // Enable focus trap when modal is open
  useFocusTrap(modalRef, isOpen);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      // Delay to ensure modal is rendered
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // Escape key to close (if not deleting)
      if (e.key === 'Escape' && !isDeleting) {
        e.preventDefault();
        handleClose();
      }
      
      // Enter key to confirm (if input matches and not deleting)
      if (e.key === 'Enter' && confirmText === community.name && !isDeleting) {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmText, community.name, isDeleting]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (confirmText !== community.name) {
      setError('Community name does not match');
      return;
    }
    onConfirm();
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      setError('');
      onClose();
    }
  };

  return (
    <div 
      className={styles.overlay} 
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      aria-describedby="delete-modal-description"
    >
      <div 
        ref={modalRef}
        className={styles.modal} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <AlertTriangle 
            className={styles.warningIcon} 
            size={32}
            aria-hidden="true"
          />
          <h2 id="delete-modal-title">Delete Community</h2>
          <button 
            className={styles.closeBtn} 
            onClick={handleClose} 
            disabled={isDeleting}
            aria-label="Close modal (Esc)"
            title="Close (Esc)"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.info} id="delete-modal-description">
            <strong>{community.name}</strong>
            <span>{community.location}</span>
          </div>

          <div className={styles.warning} role="alert" aria-live="polite">
            <p><strong>Warning:</strong> This will permanently delete all related data:</p>
          </div>

          <div className={styles.counts} aria-label="Deletion impact summary">
            {deletionCounts.residents > 0 && (
              <div>
                <span>Residents:</span> 
                <strong aria-label={`${deletionCounts.residents} residents will be deleted`}>
                  {deletionCounts.residents}
                </strong>
              </div>
            )}
            {deletionCounts.issues > 0 && (
              <div>
                <span>Issues:</span> 
                <strong aria-label={`${deletionCounts.issues} issues will be deleted`}>
                  {deletionCounts.issues}
                </strong>
              </div>
            )}
            {deletionCounts.workers > 0 && (
              <div>
                <span>Workers:</span> 
                <strong aria-label={`${deletionCounts.workers} workers will be deleted`}>
                  {deletionCounts.workers}
                </strong>
              </div>
            )}
            {deletionCounts.securities > 0 && (
              <div>
                <span>Security:</span> 
                <strong aria-label={`${deletionCounts.securities} security personnel will be deleted`}>
                  {deletionCounts.securities}
                </strong>
              </div>
            )}
            {deletionCounts.managers > 0 && (
              <div>
                <span>Managers:</span> 
                <strong aria-label={`${deletionCounts.managers} managers will be deleted`}>
                  {deletionCounts.managers}
                </strong>
              </div>
            )}
            {deletionCounts.commonSpaces > 0 && (
              <div>
                <span>Bookings:</span> 
                <strong aria-label={`${deletionCounts.commonSpaces} bookings will be deleted`}>
                  {deletionCounts.commonSpaces}
                </strong>
              </div>
            )}
            {deletionCounts.payments > 0 && (
              <div>
                <span>Payments:</span> 
                <strong aria-label={`${deletionCounts.payments} payment records will be deleted`}>
                  {deletionCounts.payments}
                </strong>
              </div>
            )}
          </div>

          <div className={styles.confirm}>
            <label htmlFor="confirm-input">
              Type <code>{community.name}</code> to confirm:
            </label>
            <input
              id="confirm-input"
              ref={inputRef}
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              placeholder="Community name"
              disabled={isDeleting}
              autoComplete="off"
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'confirm-error' : undefined}
            />
            {error && (
              <span 
                id="confirm-error"
                className={styles.error} 
                role="alert"
                aria-live="polite"
              >
                {error}
              </span>
            )}
            <div className={styles.keyboardHints}>
              <kbd>Esc</kbd> to cancel · <kbd>Enter</kbd> to confirm
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button 
            onClick={handleClose} 
            disabled={isDeleting}
            aria-label="Cancel deletion (Esc)"
            aria-keyshortcuts="Escape"
          >
            Cancel <kbd aria-hidden="true">Esc</kbd>
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDeleting || confirmText !== community.name}
            className={styles.deleteBtn}
            aria-label={isDeleting ? 'Deleting community...' : 'Confirm deletion (Enter)'}
            aria-keyshortcuts="Enter"
          >
            {isDeleting ? 'Deleting...' : (
              <>Delete <kbd aria-hidden="true">↵</kbd></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCommunityModal;
