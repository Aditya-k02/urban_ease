import logger from '../../utils/logger.js';

/**
 * GET ADMIN ACTIVITY LOGS
 * Route: GET /api/admin/activity
 */
export const getAdminActivity = async (req, res) => {
  try {
    const { limit = 20, action, startDate, endDate } = req.query;

    const { getRecentActions } = await import('../../utils/auditLogger.js');

    const filter = {};
    if (action) filter.action = action;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const actions = await getRecentActions(parseInt(limit), filter);

    res.json({
      success: true,
      data: actions
    });
  } catch (err) {
    logger.error('Get admin activity error:', err);
    res.status(500).json({ success: false, message: 'Failed to get admin activity' });
  }
};

/**
 * GET FAILED LOGIN ATTEMPTS
 * Route: GET /api/admin/security/failed-logins
 */
export const getFailedLogins = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const { getFailedLogins: getFailedLoginsFn } = await import('../../utils/auditLogger.js');

    const failedLogins = await getFailedLoginsFn(parseInt(hours));

    res.json({
      success: true,
      data: failedLogins,
      count: failedLogins.length
    });
  } catch (err) {
    logger.error('Get failed logins error:', err);
    res.status(500).json({ success: false, message: 'Failed to get failed logins' });
  }
};
