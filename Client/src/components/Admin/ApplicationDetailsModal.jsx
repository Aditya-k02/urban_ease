import React, { useState } from 'react';
import { X, Mail, Phone, MapPin, Calendar, Building2, FileText, Image, CheckCircle, XCircle } from 'lucide-react';
import Status from './Status';
import styles from './Applications.module.css';

export default function ApplicationDetailsModal({ application, onClose, onApprove, onReject }) {
  const [activePhoto, setActivePhoto] = useState(null);

  if (!application) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>Application Details</h3>
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
              <X size={20} />
            </button>
          </div>

          <div className={styles.modalBody}>
            {/* Header Section */}
            <div className={styles.detailsHeader}>
              <div className={styles.detailsAvatar}>
                {application.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h4>{application.name}</h4>
                <div className={styles.statusBadge}>
                  <Status status={application.uiStatus} />
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className={styles.detailsSection}>
              <h5>Contact Information</h5>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <Mail size={16} />
                  <span>{application.email}</span>
                </div>
                <div className={styles.detailItem}>
                  <Phone size={16} />
                  <span>{application.phone}</span>
                </div>
              </div>
            </div>

            {/* Community Information */}
            <div className={styles.detailsSection}>
              <h5>Community Information</h5>
              <div className={styles.detailsGrid}>
                <div className={styles.detailItem}>
                  <Building2 size={16} />
                  <span>{application.communityName}</span>
                </div>
                <div className={styles.detailItem}>
                  <MapPin size={16} />
                  <span>{application.location}</span>
                </div>
                <div className={styles.detailItem}>
                  <Calendar size={16} />
                  <span>Applied on {application.appliedOn}</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {application.description && (
              <div className={styles.detailsSection}>
                <h5>Description</h5>
                <div className={styles.detailItem}>
                  <FileText size={16} />
                  <p>{application.description}</p>
                </div>
              </div>
            )}

            {/* Photos */}
            {application.photos && application.photos.length > 0 && (
              <div className={styles.detailsSection}>
                <h5>Attached Photos ({application.photos.length})</h5>
                <div className={styles.photoGrid}>
                  {application.photos.map((photo, idx) => (
                    <div
                      key={idx}
                      className={styles.photoThumbnail}
                      onClick={() => setActivePhoto(photo)}
                    >
                      <img src={photo} alt={`Community ${idx + 1}`} />
                      <div className={styles.photoOverlay}>
                        <Image size={20} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Decision Details */}
            {(application.status === 'APPROVED' || application.status === 'REJECTED') && (
              <div className={styles.detailsSection}>
                <h5>Decision Details</h5>
                <div className={styles.decisionBox}>
                  {application.status === 'APPROVED' && (
                    <>
                      <CheckCircle size={20} color="#22c55e" />
                      <div>
                        <p><strong>Approved by:</strong> {application.approvedBy || 'Unknown'}</p>
                        <p><strong>Approved on:</strong> {application.approvedAt || 'N/A'}</p>
                      </div>
                    </>
                  )}
                  {application.status === 'REJECTED' && (
                    <>
                      <XCircle size={20} color="#ef4444" />
                      <div>
                        <p><strong>Rejected by:</strong> {application.rejectedBy || 'Unknown'}</p>
                        <p><strong>Rejected on:</strong> {application.rejectedAt || 'N/A'}</p>
                        {application.rejectionReason && (
                          <p><strong>Reason:</strong> {application.rejectionReason}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {application.status === 'PENDING' && (
            <div className={styles.modalFooter}>
              <button
                className={`${styles.btn} ${styles.btnReject}`}
                onClick={() => {
                  onClose();
                  onReject(application.id);
                }}
              >
                <XCircle size={18} />
                Reject Application
              </button>
              <button
                className={`${styles.btn} ${styles.btnApprove}`}
                onClick={() => {
                  onClose();
                  onApprove(application.id);
                }}
              >
                <CheckCircle size={18} />
                Approve Application
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {activePhoto && (
        <div className={styles.photoViewerBackdrop} onClick={() => setActivePhoto(null)}>
          <div className={styles.photoViewer}>
            <button
              className={styles.photoCloseBtn}
              onClick={() => setActivePhoto(null)}
              aria-label="Close photo"
            >
              <X size={24} />
            </button>
            <img src={activePhoto} alt="Full size view" />
          </div>
        </div>
      )}
    </>
  );
}
