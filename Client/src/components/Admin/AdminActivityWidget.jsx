import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Clock, TrendingUp } from 'lucide-react';
import adminApiClient from '../../services/adminApiClient.js';     

import styles from './AdminActivityWidget.module.css';

export default function AdminActivityWidget() {
  const [recentActions, setRecentActions] = useState([]);
  const [failedLogins, setFailedLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchActivityData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchActivityData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const [activityRes, failedLoginsRes] = await Promise.all([
        adminApiClient.getAdminActivity({ limit: 5 }),
        adminApiClient.getFailedLogins(24)
      ]);

      if (activityRes.success) {
        setRecentActions(activityRes.data || []);
      }

      if (failedLoginsRes.success) {
        setFailedLogins(failedLoginsRes.data || []);
      }

      setError(null);
    } catch (err) {
      console.error('Error fetching activity data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('delete')) return '🗑️';
    if (action.includes('create')) return '➕';
    if (action.includes('update')) return '✏️';
    if (action.includes('login')) return '🔐';
    if (action.includes('restore')) return '♻️';
    return '📋';
  };

  const getActionColor = (action) => {
    if (action.includes('delete')) return '#dc2626';
    if (action.includes('create')) return '#16a34a';
    if (action.includes('failed')) return '#f59e0b';
    return '#3b82f6';
  };

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading && recentActions.length === 0) {
    return (
      <div className={styles.widget}>
        <div className={styles.header}>
          <Activity size={20} />
          <h3>Recent Activity</h3>
        </div>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.widgetContainer}>
      {/* Recent Actions */}
      <div className={styles.widget}>
        <div className={styles.header}>
          <Activity size={20} />
          <h3>Recent Actions</h3>
          <span className={styles.badge}>{recentActions.length}</span>
        </div>

        {error && (
          <div className={styles.error}>
            <AlertTriangle size={16} />
            <span>Failed to load activity</span>
          </div>
        )}

        <div className={styles.actionsList}>
          {recentActions.length === 0 ? (
            <div className={styles.empty}>No recent activity</div>
          ) : (
            recentActions.map((action, index) => (
              <div key={index} className={styles.actionItem}>
                <div className={styles.actionIcon} style={{ color: getActionColor(action.action) }}>
                  {getActionIcon(action.action)}
                </div>
                <div className={styles.actionDetails}>
                  <div className={styles.actionTitle}>
                    {action.adminEmail} 
                    <span className={styles.actionType}>
                      {action.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                  {action.targetName && (
                    <div className={styles.actionTarget}>{action.targetName}</div>
                  )}
                  <div className={styles.actionTime}>
                    <Clock size={12} />
                    {formatTimeAgo(action.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {recentActions.length > 0 && (
          <button className={styles.viewAllBtn} onClick={() => window.location.href = '/admin/activity-logs'}>
            View All Activity
          </button>
        )}
      </div>

      {/* Failed Logins */}
      <div className={styles.widget}>
        <div className={styles.header}>
          <AlertTriangle size={20} />
          <h3>Security Alerts</h3>
          {failedLogins.length > 0 && (
            <span className={`${styles.badge} ${styles.badgeWarning}`}>{failedLogins.length}</span>
          )}
        </div>

        <div className={styles.alertsList}>
          {failedLogins.length === 0 ? (
            <div className={styles.success}>
              <TrendingUp size={16} />
              <span>No failed login attempts in last 24h</span>
            </div>
          ) : (
            <>
              <div className={styles.alertSummary}>
                <AlertTriangle size={16} color="#f59e0b" />
                <span>{failedLogins.length} failed login attempts detected</span>
              </div>
              {failedLogins.slice(0, 3).map((login, index) => (
                <div key={index} className={styles.alertItem}>
                  <div className={styles.alertEmail}>{login.adminEmail || 'Unknown'}</div>
                  <div className={styles.alertMeta}>
                    <span className={styles.alertIp}>{login.ip}</span>
                    <span className={styles.alertTime}>{formatTimeAgo(login.createdAt)}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
