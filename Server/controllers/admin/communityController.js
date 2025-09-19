import logger from '../../utils/logger.js';
import { createAuditLog } from '../../utils/auditLogger.js';
import DeletedCommunityBackup from '../../models/deletedCommunityBackup.js';
import cache from './adminCache.js';
import {
  listCommunities,
  listCommunityManagers,
  listInterestForms,
  countResidents,
  listCommunitySubscriptions,
  aggregateCommunities,
  createCommunity as createCommunityCrud,
  updateCommunityById,
  updateManyCommunities,
  getCommunityById as getCommunityByIdCrud,
} from '../../crud/index.js';
import { deleteCommunityCascade } from '../../utils/communityCascadeDelete.js';

export const getAllCommunities = async (req, res) => {
  try {
    const communities = await listCommunities({}, null, {});
    res.json({ success: true, communities });
  } catch (err) {
    console.error('Get all communities error:', err);
    res.status(500).json({ success: false, message: 'Failed to get communities' });
  }
};

export const getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await getCommunityByIdCrud(id, null, {});
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.json({ success: true, community });
  } catch (err) {
    console.error('Get community by id error:', err);
    res.status(500).json({ success: false, message: 'Failed to get community' });
  }
};

export const createCommunity = async (req, res) => {
  try {
    const communityData = req.body;
    const newCommunity = await createCommunityCrud(communityData);

    // Invalidate cache
    cache.del('admin_dashboard');

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'create_community',
      targetType: 'Community',
      targetId: newCommunity._id,
      targetName: newCommunity.name,
      changes: { after: { name: newCommunity.name, location: newCommunity.location } },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Community created: ${newCommunity.name}`, { adminEmail: req.user.email });

    res.json({ success: true, message: 'Community created successfully', community: newCommunity });
  } catch (err) {
    logger.error('Create community error:', err);
    res.status(500).json({ success: false, message: 'Failed to create community' });
  }
};

export const updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedCommunity = await updateCommunityById(id, updates);
    if (!updatedCommunity) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.json({ success: true, message: 'Community updated successfully', community: updatedCommunity });
  } catch (err) {
    console.error('Update community error:', err);
    res.status(500).json({ success: false, message: 'Failed to update community' });
  }
};

export const getDeletePreview = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await getCommunityByIdCrud(id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    const [residents, issues, workers, securities, amenities, commonSpaces, payments, subscriptions] = await Promise.all([
      countResidents({ community: id }),
      listInterestForms({}, null, {}).then(forms => forms.length),
      listCommunityManagers({ assignedCommunity: id }, null, {}).then(managers => managers.length),
      aggregateCommunities([{ $match: { _id: community._id } }]).then(() => 0),
      aggregateCommunities([{ $match: { _id: community._id } }]).then(() => 0),
      aggregateCommunities([{ $match: { _id: community._id } }]).then(() => 0),
      aggregateCommunities([{ $match: { _id: community._id } }]).then(() => 0),
      listCommunitySubscriptions({ communityId: id }, null, {}).then(subs => subs.length),
    ]);

    res.json({
      success: true,
      community: { _id: community._id, name: community.name, location: community.location },
      willDelete: {
        residents,
        issues,
        workers,
        securities,
        managers: await listCommunityManagers({ assignedCommunity: id }, null, {}).then(m => m.length),
        amenities,
        commonSpaces,
        payments,
        subscriptions,
      },
    });
  } catch (err) {
    console.error('Get delete preview error:', err);
    res.status(500).json({ success: false, message: 'Failed to get delete preview' });
  }
};

/**
 * DELETE COMMUNITY WITH CASCADE AND BACKUP
 * Route: DELETE /api/communities/:id
 */
export const deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await getCommunityByIdCrud(id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }

    logger.info(`Starting community deletion: ${community.name}`, {
      adminEmail: req.user.email,
      communityId: id
    });

    // Get all related data before deletion for backup
    const Resident = (await import('../../models/resident.js')).default;
    const Issue = (await import('../../models/issues.js')).default;
    const Worker = (await import('../../models/workers.js')).default;
    const Security = (await import('../../models/security.js')).default;
    const CommunityManager = (await import('../../models/cManager.js')).default;
    const Amenity = (await import('../../models/Amenities.js')).default;
    const CommonSpace = (await import('../../models/commonSpaces.js')).default;
    const Payment = (await import('../../models/payment.js')).default;
    const CommunitySubscription = (await import('../../models/communitySubscription.js')).default;
    const Visitor = (await import('../../models/visitors.js')).default;
    const PreApproval = (await import('../../models/preapproval.js')).default;
    const Notification = (await import('../../models/Notifications.js')).default;
    const Ad = (await import('../../models/Ad.js')).default;

    // Fetch all related data
    const [residents, issues, workers, securities, managers, amenities, commonSpaces,
      payments, subscriptions, visitors, preapprovals, notifications, ads] = await Promise.all([
      Resident.find({ community: id }).lean(),
      Issue.find({ community: id }).lean(),
      Worker.find({ community: id }).lean(),
      Security.find({ community: id }).lean(),
      CommunityManager.find({ assignedCommunity: id }).lean(),
      Amenity.find({ community: id }).lean(),
      CommonSpace.find({ community: id }).lean(),
      Payment.find({ community: id }).lean(),
      CommunitySubscription.find({ community: id }).lean(),
      Visitor.find({ community: id }).lean(),
      PreApproval.find({ community: id }).lean(),
      Notification.find({ community: id }).lean(),
      Ad.find({ community: id }).lean()
    ]);

    // Create backup before deletion
    const backup = await DeletedCommunityBackup.create({
      originalCommunityId: id,
      communityData: {
        community: community.toObject(),
        residents,
        issues,
        workers,
        securities,
        managers,
        amenities,
        commonSpaces,
        payments,
        subscriptions,
        visitors,
        preapprovals,
        notifications,
        ads
      },
      deletionMetadata: {
        deletedBy: req.user.id,
        deletedByEmail: req.user.email,
        reason: req.body.reason || 'No reason provided',
        counts: {
          residents: residents.length,
          issues: issues.length,
          workers: workers.length,
          securities: securities.length,
          managers: managers.length,
          amenities: amenities.length,
          commonSpaces: commonSpaces.length,
          payments: payments.length,
          subscriptions: subscriptions.length,
          visitors: visitors.length,
          preapprovals: preapprovals.length,
          notifications: notifications.length,
          ads: ads.length
        }
      }
    });

    logger.info(`Created deletion backup for community: ${community.name}`, { backupId: backup._id });

    // Perform cascade deletion
    const result = await deleteCommunityCascade(id);

    // Invalidate cache
    cache.del('admin_dashboard');

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'delete_community',
      targetType: 'Community',
      targetId: id,
      targetName: community.name,
      changes: { before: { name: community.name, location: community.location }, after: null },
      metadata: {
        backupId: backup._id,
        deletedCounts: result.deletedCounts,
        reason: req.body.reason,
        canRestoreUntil: backup.permanentDeleteAt
      },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Community deleted successfully: ${community.name}`, {
      deletedCounts: result.deletedCounts,
      backupId: backup._id
    });

    res.json({
      success: true,
      message: 'Community deleted successfully. Can be restored within 30 days.',
      deleted: result.deletedCounts,
      backup: {
        id: backup._id,
        canRestoreUntil: backup.permanentDeleteAt
      }
    });
  } catch (err) {
    logger.error('Delete community error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete community', error: err.message });
  }
};

export const getManagersList = async (req, res) => {
  try {
    const managers = await listCommunityManagers({}, null, {});
    res.json({ success: true, managers });
  } catch (err) {
    console.error('Get managers list error:', err);
    res.status(500).json({ success: false, message: 'Failed to get managers list' });
  }
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ success: false, message: 'IDs array and status are required' });
    }
    const result = await updateManyCommunities({ _id: { $in: ids } }, { status });

    // Invalidate cache
    cache.del('admin_dashboard');

    res.json({ success: true, message: `${result.modifiedCount} communities updated successfully` });
  } catch (err) {
    logger.error('Bulk update status error:', err);
    res.status(500).json({ success: false, message: 'Failed to bulk update status' });
  }
};

/**
 * RESTORE DELETED COMMUNITY FROM BACKUP
 * Route: POST /api/communities/:backupId/restore
 */
export const restoreCommunity = async (req, res) => {
  try {
    const { backupId } = req.params;

    const backup = await DeletedCommunityBackup.findById(backupId);
    if (!backup) {
      return res.status(404).json({ success: false, message: 'Backup not found' });
    }

    if (backup.status === 'restored') {
      return res.status(400).json({ success: false, message: 'Community already restored' });
    }

    if (backup.status === 'permanently_deleted') {
      return res.status(400).json({ success: false, message: 'Backup permanently deleted, cannot restore' });
    }

    if (new Date() > backup.permanentDeleteAt) {
      return res.status(400).json({ success: false, message: 'Backup expired, cannot restore' });
    }

    logger.info(`Starting community restoration from backup: ${backupId}`, { adminEmail: req.user.email });

    // Import models
    const Community = (await import('../../models/communities.js')).default;
    const Resident = (await import('../../models/resident.js')).default;
    const Issue = (await import('../../models/issues.js')).default;
    const Worker = (await import('../../models/workers.js')).default;
    const Security = (await import('../../models/security.js')).default;
    const CommunityManager = (await import('../../models/cManager.js')).default;
    const Amenity = (await import('../../models/Amenities.js')).default;
    const CommonSpace = (await import('../../models/commonSpaces.js')).default;
    const Payment = (await import('../../models/payment.js')).default;
    const CommunitySubscription = (await import('../../models/communitySubscription.js')).default;
    const Visitor = (await import('../../models/visitors.js')).default;
    const PreApproval = (await import('../../models/preapproval.js')).default;
    const Notification = (await import('../../models/Notifications.js')).default;
    const Ad = (await import('../../models/Ad.js')).default;

    const { communityData } = backup;
    const restoredCounts = {};

    // Restore community
    const community = await Community.create(communityData.community);
    restoredCounts.community = 1;

    // Restore related data
    if (communityData.residents?.length) {
      await Resident.insertMany(communityData.residents);
      restoredCounts.residents = communityData.residents.length;
    }
    if (communityData.issues?.length) {
      await Issue.insertMany(communityData.issues);
      restoredCounts.issues = communityData.issues.length;
    }
    if (communityData.workers?.length) {
      await Worker.insertMany(communityData.workers);
      restoredCounts.workers = communityData.workers.length;
    }
    if (communityData.securities?.length) {
      await Security.insertMany(communityData.securities);
      restoredCounts.securities = communityData.securities.length;
    }
    if (communityData.managers?.length) {
      await CommunityManager.insertMany(communityData.managers);
      restoredCounts.managers = communityData.managers.length;
    }
    if (communityData.amenities?.length) {
      await Amenity.insertMany(communityData.amenities);
      restoredCounts.amenities = communityData.amenities.length;
    }
    if (communityData.commonSpaces?.length) {
      await CommonSpace.insertMany(communityData.commonSpaces);
      restoredCounts.commonSpaces = communityData.commonSpaces.length;
    }
    if (communityData.payments?.length) {
      await Payment.insertMany(communityData.payments);
      restoredCounts.payments = communityData.payments.length;
    }
    if (communityData.subscriptions?.length) {
      await CommunitySubscription.insertMany(communityData.subscriptions);
      restoredCounts.subscriptions = communityData.subscriptions.length;
    }
    if (communityData.visitors?.length) {
      await Visitor.insertMany(communityData.visitors);
      restoredCounts.visitors = communityData.visitors.length;
    }
    if (communityData.preapprovals?.length) {
      await PreApproval.insertMany(communityData.preapprovals);
      restoredCounts.preapprovals = communityData.preapprovals.length;
    }
    if (communityData.notifications?.length) {
      await Notification.insertMany(communityData.notifications);
      restoredCounts.notifications = communityData.notifications.length;
    }
    if (communityData.ads?.length) {
      await Ad.insertMany(communityData.ads);
      restoredCounts.ads = communityData.ads.length;
    }

    // Update backup status
    backup.status = 'restored';
    backup.restoredAt = new Date();
    backup.restoredBy = req.user.id;
    await backup.save();

    // Invalidate cache
    cache.del('admin_dashboard');

    // Audit log
    await createAuditLog({
      adminId: req.user.id,
      adminEmail: req.user.email,
      action: 'restore_community',
      targetType: 'Community',
      targetId: community._id,
      targetName: community.name,
      metadata: { backupId, restoredCounts },
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    logger.info(`Community restored successfully: ${community.name}`, { restoredCounts });

    res.json({
      success: true,
      message: 'Community restored successfully',
      community: { _id: community._id, name: community.name, location: community.location },
      restored: restoredCounts
    });
  } catch (err) {
    logger.error('Restore community error:', err);
    res.status(500).json({ success: false, message: 'Failed to restore community', error: err.message });
  }
};
