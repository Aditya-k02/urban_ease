import { useState, useEffect } from 'react';

export function useApplicationsData() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE_URL =
    process.env.NODE_ENV === 'production'
      ? window.location.origin
      : 'http://localhost:3000';

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`${API_BASE_URL}/admin/api/interests`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem('adminToken');
        window.location.href = '/adminLogin';
        return;
      }

      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const formatted = json.data.map((app) => ({
          id: app._id,
          name: `${app.firstName || ''} ${app.lastName || ''}`.trim() || 'Unknown',
          email: app.email,
          phone: app.phone,
          communityName: app.communityName || 'N/A',
          location: app.location || 'Unknown',
          description: app.description || '',
          appliedOn: new Date(app.createdAt).toLocaleDateString('en-IN'),
          status: app.status?.toUpperCase() || 'PENDING',
          photos: app.photos || [],
          approvedBy: app.approvedBy?.name || null,
          rejectedBy: app.rejectedBy?.name || null,
          rejectionReason: app.rejectionReason || null,
          approvedAt: app.approvedAt
            ? new Date(app.approvedAt).toLocaleDateString('en-IN')
            : null,
          rejectedAt: app.rejectedAt
            ? new Date(app.rejectedAt).toLocaleDateString('en-IN')
            : null,
          paymentStatus: app.paymentStatus || 'pending',
          // Computed status for UI
          uiStatus:
            app.status?.toUpperCase() === 'APPROVED' &&
            (!app.paymentStatus || app.paymentStatus === 'pending')
              ? 'AWAITING PAYMENT'
              : app.paymentStatus === 'completed'
              ? 'COMPLETED'
              : app.status?.toUpperCase() || 'PENDING',
        }));
        setApplications(formatted);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Error fetching manager applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (appId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/interests/${appId}/approve`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === appId
              ? { ...app, status: 'APPROVED', uiStatus: 'AWAITING PAYMENT', paymentStatus: 'pending' }
              : app
          )
        );
        return { success: true };
      } else {
        const json = await res.json();
        throw new Error(json.message || 'Failed to approve application');
      }
    } catch (err) {
      console.error('Approval error:', err);
      return { success: false, error: err.message };
    }
  };

  const handleReject = async (appId, reason) => {
    try {
      const res = await fetch(`${API_BASE_URL}/admin/interests/${appId}/reject`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('adminToken') || ''}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (res.ok) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === appId
              ? { ...app, status: 'REJECTED', uiStatus: 'REJECTED', rejectionReason: reason }
              : app
          )
        );
        return { success: true };
      } else {
        const json = await res.json();
        throw new Error(json.message || 'Failed to reject application');
      }
    } catch (err) {
      console.error('Rejection error:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  return {
    applications,
    loading,
    error,
    fetchApplications,
    handleApprove,
    handleReject,
  };
}
