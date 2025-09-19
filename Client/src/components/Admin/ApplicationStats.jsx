import React from 'react';
import { FileText, CheckCircle, XCircle, Clock, CreditCard } from 'lucide-react';
import Card from './Card';
import styles from './Applications.module.css';

export default function ApplicationStats({ applications }) {
  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'PENDING').length,
    approved: applications.filter(app => app.status === 'APPROVED').length,
    rejected: applications.filter(app => app.status === 'REJECTED').length,
    awaitingPayment: applications.filter(app => app.uiStatus === 'AWAITING PAYMENT').length,
  };

  return (
    <div className={styles.statsGrid}>
      <Card
        icon={<FileText size={22} />}
        value={stats.total}
        label="Total Applications"
        borderColor="#3b82f6"
      />
      <Card
        icon={<Clock size={22} />}
        value={stats.pending}
        label="Pending Review"
        borderColor="#f59e0b"
      />
      <Card
        icon={<CheckCircle size={22} />}
        value={stats.approved}
        label="Approved"
        borderColor="#22c55e"
      />
      <Card
        icon={<CreditCard size={22} />}
        value={stats.awaitingPayment}
        label="Awaiting Payment"
        borderColor="#8b5cf6"
      />
      <Card
        icon={<XCircle size={22} />}
        value={stats.rejected}
        label="Rejected"
        borderColor="#ef4444"
      />
    </div>
  );
}
