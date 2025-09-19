// middleware/subscriptionCheck.js
import Community from '../models/communities.js';

const checkSubscriptionStatus = async (req, res, next) => {
  try {
    const excludedRoutes = [
      '/login', 
      '/logout', 
      '/subscription-expired',
      '/communityStatus',
      '/css/',
      '/js/',
      '/images/',
      // Add other static assets and excluded routes
    ];

    // Skip for excluded routes
    if (excludedRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    // Skip for unauthenticated users
    if (!req.user) {
      return next();
    }

    // 🚨 Skip check for admin & community manager
    if (['Admin', 'CommunityManager'].includes(req.user.userType)) {
      return next();
    }

    // Only check subscription for users tied to a community
    if (!req.user.community) {
      return next();
    }

    const community = await Community.findById(req.user.community);

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Treat anything other than an active subscription as blocked
    const isSubscriptionInactive = community.subscriptionStatus !== "active";

    if (isSubscriptionInactive) {
      console.log("Community subscription inactive or expired:", community.subscriptionStatus);
      return res.status(402).json({
        success: false,
        code: "SUBSCRIPTION_EXPIRED",
        message:
          "Community subscription is inactive or expired. Please contact your Community Manager.",
        subscriptionStatus: community.subscriptionStatus,
      });
    }

    res.locals.communityStatus = community.subscriptionStatus;
    res.locals.community = community;

    next();
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while checking subscription',
    });
  }
};

export default checkSubscriptionStatus;
