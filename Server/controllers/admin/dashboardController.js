import cache from './adminCache.js';
import {
  listCommunities,
  listCommunityManagers,
  listInterestForms,
  countResidents,
  listCommunitySubscriptions,
  aggregateCommunitySubscriptions,
  aggregateCommunities,
  countCommunities,
} from '../../crud/index.js';

export const getDashboard = async (req, res) => {
  try {
    const cachedData = cache.get('admin_dashboard');
    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }

    const [communities, residentsCount, pendingApplicationsList, activeManagersList] =
      await Promise.all([
        listCommunities({}, null, {}),
        countResidents(),
        listInterestForms({ status: 'pending' }, null, {}),
        listCommunityManagers({ status: 'active' }, null, {}),
      ]);

    const totalCommunities = communities.length;
    const totalResidents = residentsCount;
    const pendingApplications = pendingApplicationsList.length;
    const activeManagers = activeManagersList.length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyRevenueAgg = await aggregateCommunitySubscriptions([
      {
        $match: {
          status: 'completed',
          paymentDate: { $gte: startOfMonth },
        },
      },
      {
        $group: { _id: null, total: { $sum: '$amount' } },
      },
    ]);

    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    const allPayments = await listCommunitySubscriptions({}, null, { lean: true });

    const labels = Array.from({ length: 12 }, (_, i) =>
      new Date(2000, i, 1).toLocaleString('en', { month: 'short' })
    );
    const revenueTrend = Array(12).fill(0);
    const communityTrend = Array(12).fill(0);

    for (const p of allPayments) {
      if (p.status !== 'completed' || !p.paymentDate) continue;
      const month = new Date(p.paymentDate).getMonth();
      revenueTrend[month] += p.amount || 0;
      communityTrend[month] += 1;
    }

    const allApplications = await listInterestForms({}, 'status', {});
    const appStatus = allApplications.reduce((acc, app) => {
      const key = app.status || 'unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const responseData = {
      kpis: {
        totalCommunities,
        totalResidents,
        pendingApplications,
        activeManagers,
        monthlyRevenue,
      },
      chartData: {
        applicationsStatus: {
          approved: appStatus.approved || 0,
          pending: appStatus.pending || 0,
          rejected: appStatus.rejected || 0,
        },
        growthChart: {
          labels,
          revenue: revenueTrend,
          communities: communityTrend,
        },
      },
    };

    cache.set('admin_dashboard', responseData);
    res.json({ success: true, data: responseData, cached: false });
  } catch (error) {
    console.error('Optimized Dashboard Error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const getCommunitiesOverview = async (req, res) => {
  try {
    const communities = await listCommunities({}, null, {
      sort: { createdAt: -1 },
      populate: [{ path: 'communityManager', select: 'name email' }],
    });

    const totalCommunities = communities.length;
    const activeCommunities = communities.filter(c =>
      /^active$/i.test(c.subscriptionStatus)
    ).length;
    const pendingCommunities = communities.filter(c =>
      /^pending$/i.test(c.subscriptionStatus)
    ).length;

    const topLocationsAgg = await aggregateCommunities([
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const recentCommunities = communities.slice(0, 5);

    const managers = await listCommunityManagers({}, 'name email', {
      sort: { name: 1 },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalCommunities,
          activeCommunities,
          pendingCommunities,
          topLocations: topLocationsAgg,
        },
        recentCommunities,
        allCommunities: communities,
        managers
      }
    });
  } catch (error) {
    console.error('Error fetching communities overview:', error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

export const getCommunityManagers = async (req, res) => {
  try {
    const managers = await listCommunityManagers({}, null, {
      sort: { name: 1 },
      populate: [{ path: 'assignedCommunity', select: 'name location subscriptionStatus' }],
    });

    const communities = await listCommunities(
      { status: 'Active' },
      'name location subscriptionStatus',
      { sort: { name: 1 } }
    );

    const totalManagers = managers.length;
    const assignedManagers = managers.filter(
      (m) => m.assignedCommunity !== null
    ).length;
    const unassignedManagers = totalManagers - assignedManagers;

    res.json({
      success: true,
      data: {
        stats: { totalManagers, assignedManagers, unassignedManagers },
        managers,
        communities,
      },
    });
  } catch (error) {
    console.error('Error fetching community managers:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching community managers', error: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await listCommunitySubscriptions({}, null, {
      populate: [{ path: 'communityId', select: 'name subscriptionPlan' }],
      sort: { paymentDate: -1 },
      lean: true
    });

    const communities = await listCommunities({}, null, {
      populate: [{ path: 'communityManager', select: 'name email' }],
      lean: true
    });

    const communityMap = Object.fromEntries(
      communities.map(c => [c._id.toString(), c])
    );

    let totalRevenue = 0, totalTransactions = 0, pendingPayments = 0, failedPayments = 0;
    const allPayments = [];

    for (const p of payments) {
      const amount = p.amount || 0;
      const status = (p.status || '').toLowerCase();

      // Safely resolve community (some legacy payments might not have communityId populated)
      let community = null;
      if (p.communityId) {
        const key = (p.communityId._id || p.communityId).toString();
        community = communityMap[key] || null;
      }

      if (status === 'completed') {
        totalRevenue += amount;
        totalTransactions++;
      } else if (status === 'pending') {
        pendingPayments++;
      } else if (status === 'failed') {
        failedPayments++;
      }

      allPayments.push({
        transactionId: p.transactionId || 'N/A',
        communityName: p.communityId?.name || 'Unknown',
        communityId: p.communityId?._id || 'N/A',
        plan: p.planType || 'Unknown',
        amount: amount,
        paymentMethod: p.paymentMethod || 'N/A',
        paymentDate: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString('en-IN') : 'N/A',
        status: p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Unknown',
        managerName: community?.communityManager?.name || 'Unassigned',
        planDuration: p.duration || 'monthly',
      });
    }

    const now = new Date();
    const monthlyRevenue = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRevenue = allPayments.reduce((sum, p) => {
        if (
          p.status === 'Completed' &&
          new Date(p.paymentDate) >= start &&
          new Date(p.paymentDate) <= end
        ) {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      monthlyRevenue.push({
        month: start.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
      });
    }

    const planDistribution = {
      basic: communities.filter((c) => c.subscriptionPlan === 'basic').length,
      standard: communities.filter((c) => c.subscriptionPlan === 'standard').length,
      premium: communities.filter((c) => c.subscriptionPlan === 'premium').length,
    };

    res.json({
      success: true,
      data: {
        payments: allPayments,
        statistics: { totalRevenue, totalTransactions, pendingPayments, failedPayments },
        monthlyRevenue,
        planDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching payment data:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error', error: error.message });
  }
};

export const getCommunityStats = async (req, res) => {
  try {
    const totalCommunities = await countCommunities();
    const activeCommunities = await countCommunities({ status: 'active' });
    const totalResidents = await countResidents();
    res.json({
      success: true,
      stats: {
        totalCommunities,
        activeCommunities,
        totalResidents,
      },
    });
  } catch (err) {
    console.error('Get community stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to get community stats' });
  }
};
