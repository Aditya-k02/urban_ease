/**
 * CASCADE DELETE UTILITY FOR COMMUNITIES
 * 
 * This automatically deletes all related data when a community is deleted.
 * 
 * HOW TO USE VIA API:
 * 
 * 1. Browser Console (must be logged in as admin):
 *    const token = localStorage.getItem('adminToken');
 *    fetch('http://localhost:5000/api/communities/COMMUNITY_ID_HERE', {
 *      method: 'DELETE',
 *      headers: { 'Authorization': `Bearer ${token}` }
 *    })
 *    .then(r => r.json())
 *    .then(data => console.log(data))
 * 
 * 2. cURL Command:
 *    curl -X DELETE http://localhost:5000/api/communities/COMMUNITY_ID_HERE \
 *      -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
 * 
 * 3. Postman/Thunder Client:
 *    DELETE http://localhost:5000/api/communities/COMMUNITY_ID_HERE
 *    Headers: Authorization: Bearer YOUR_ADMIN_TOKEN
 * 
 * RESPONSE:
 * {
 *   "success": true,
 *   "message": "Community deleted successfully",
 *   "deleted": {
 *     "ads": 3, "amenities": 5, "commonSpaces": 12, "issues": 45,
 *     "payments": 67, "residents": 23, "workers": 8, "securities": 4,
 *     "communityManagers": 1, "subscriptions": 10, "visitors": 15,
 *     "preapprovals": 8, "notifications": 89
 *   }
 * }
 */

import Ad from "../models/Ad.js";
import Amenity from "../models/Amenities.js";
import CommonSpaces from "../models/commonSpaces.js";
import Community from "../models/communities.js";
import CommunityManager from "../models/cManager.js";
import CommunitySubscription from "../models/communitySubscription.js";
import Issue from "../models/issues.js";
import Notifications from "../models/Notifications.js";
import Payment from "../models/payment.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Visitor from "../models/visitors.js";
import VisitorPreApproval from "../models/preapproval.js";
import Worker from "../models/workers.js";

const collectNotificationIds = (docs) => {
  const ids = new Set();
  for (const doc of docs) {
    if (!doc?.notifications?.length) continue;
    for (const id of doc.notifications) {
      ids.add(String(id));
    }
  }
  return ids;
};

export const deleteCommunityCascade = async (communityId) => {
  const communityFilter = communityId;

  const [residents, managers, workers, securities] = await Promise.all([
    Resident.find({ community: communityFilter }, "notifications").lean(),
    CommunityManager.find({ assignedCommunity: communityFilter }, "notifications").lean(),
    Worker.find({ community: communityFilter }, "notifications").lean(),
    Security.find({ community: communityFilter }, "notifications").lean(),
  ]);

  const notificationIds = new Set([
    ...collectNotificationIds(residents),
    ...collectNotificationIds(managers),
    ...collectNotificationIds(workers),
    ...collectNotificationIds(securities),
  ]);

  const [
    adsResult,
    amenitiesResult,
    commonSpacesResult,
    issuesResult,
    paymentsResult,
    visitorsResult,
    preapprovalsResult,
    residentsResult,
    workersResult,
    securitiesResult,
    subscriptionsResult,
    managersResult,
  ] = await Promise.all([
    Ad.deleteMany({ community: communityFilter }),
    Amenity.deleteMany({ community: communityFilter }),
    CommonSpaces.deleteMany({ community: communityFilter }),
    Issue.deleteMany({ community: communityFilter }),
    Payment.deleteMany({ $or: [{ community: communityFilter }, { communityId: communityFilter }] }),
    Visitor.deleteMany({ community: communityFilter }),
    VisitorPreApproval.deleteMany({ community: communityFilter }),
    Resident.deleteMany({ community: communityFilter }),
    Worker.deleteMany({ $or: [{ community: communityFilter }, { communityAssigned: communityFilter }] }),
    Security.deleteMany({ $or: [{ community: communityFilter }, { communityAssigned: communityFilter }] }),
    CommunitySubscription.deleteMany({ communityId: communityFilter }),
    CommunityManager.deleteMany({ $or: [{ assignedCommunity: communityFilter }, { communityAssigned: communityFilter }] }),
  ]);

  let notificationsResult = { deletedCount: 0 };
  if (notificationIds.size > 0) {
    notificationsResult = await Notifications.deleteMany({
      _id: { $in: Array.from(notificationIds) },
    });
  }

  const deletedCommunity = await Community.findByIdAndDelete(communityFilter);

  return {
    deletedCommunityId: deletedCommunity?._id || null,
    deletedCounts: {
      ads: adsResult.deletedCount,
      amenities: amenitiesResult.deletedCount,
      commonSpaces: commonSpacesResult.deletedCount,
      issues: issuesResult.deletedCount,
      payments: paymentsResult.deletedCount,
      visitors: visitorsResult.deletedCount,
      preapprovals: preapprovalsResult.deletedCount,
      residents: residentsResult.deletedCount,
      workers: workersResult.deletedCount,
      securities: securitiesResult.deletedCount,
      subscriptions: subscriptionsResult.deletedCount,
      communityManagers: managersResult.deletedCount,
      notifications: notificationsResult.deletedCount,
    },
  };
};
