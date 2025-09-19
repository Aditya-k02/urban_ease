import AdminAuditLog from '../models/adminAuditLog.js';
import logger from './logger.js';

/**
 * Create an audit log entry for admin actions
 * @param {Object} params - Audit log parameters
 * @param {string} params.adminId - Admin user ID
 * @param {string} params.adminEmail - Admin email
 * @param {string} params.action - Action performed
 * @param {string} params.targetType - Type of target resource
 * @param {string} params.targetId - ID of target resource
 * @param {string} params.targetName - Name of target resource
 * @param {Object} params.changes - Before/after changes
 * @param {Object} params.metadata - Additional metadata
 * @param {string} params.ip - Request IP address
 * @param {string} params.userAgent - User agent string
 * @param {string} params.status - Operation status (success/failed/partial)
 * @param {string} params.errorMessage - Error message if failed
 * @returns {Promise<Object>} Created audit log
 */
export async function createAuditLog({
  adminId,
  adminEmail,
  action,
  targetType = 'Other',
  targetId = null,
  targetName = null,
  changes = null,
  metadata = null,
  ip = null,
  userAgent = null,
  status = 'success',
  errorMessage = null
}) {
  try {
    const auditLog = await AdminAuditLog.create({
      adminId,
      adminEmail,
      action,
      targetType,
      targetId,
      targetName,
      changes,
      metadata,
      ip,
      userAgent,
      status,
      errorMessage
    });

    logger.logAdmin(action, adminEmail, targetType, targetId, { status, metadata });

    return auditLog;
  } catch (error) {
    logger.logError(error, { context: 'createAuditLog', adminEmail, action });
    // Don't throw - audit logging shouldn't break the main operation
    return null;
  }
}

/**
 * Get recent admin actions
 * @param {number} limit - Number of logs to retrieve
 * @param {Object} filter - Additional filters
 * @returns {Promise<Array>} Recent audit logs
 */
export async function getRecentActions(limit = 10, filter = {}) {
  try {
    return await AdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('-changes') // Exclude detailed changes for performance
      .lean();
  } catch (error) {
    logger.logError(error, { context: 'getRecentActions' });
    return [];
  }
}

/**
 * Get admin activity statistics
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 * @returns {Promise<Object>} Activity statistics
 */
export async function getActivityStats(startDate, endDate) {
  try {
    const stats = await AdminAuditLog.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return stats;
  } catch (error) {
    logger.logError(error, { context: 'getActivityStats' });
    return [];
  }
}

/**
 * Get failed login attempts for security monitoring
 * @param {number} hours - Number of hours to look back
 * @returns {Promise<Array>} Failed login attempts
 */
export async function getFailedLogins(hours = 24) {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return await AdminAuditLog.find({
      action: 'failed_login',
      createdAt: { $gte: since }
    })
    .sort({ createdAt: -1 })
    .select('adminEmail ip createdAt metadata')
    .lean();
  } catch (error) {
    logger.logError(error, { context: 'getFailedLogins' });
    return [];
  }
}

export default {
  createAuditLog,
  getRecentActions,
  getActivityStats,
  getFailedLogins
};
