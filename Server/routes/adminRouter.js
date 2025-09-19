import express from "express";
import path from 'path';
import multer from 'multer';
import { requirePermission } from '../middleware/rbac.js';
import { validateCommunity, validateObjectId, validatePasswordChange } from '../middleware/validation.js';
import {
  getAllApplications,
  getAllApplicationsJSON,
  approveApplication,
  rejectApplication,
  resendPaymentLink
} from '../controllers/interestForm.js';
import {
  getDashboard,
  getCommunitiesOverview,
  getCommunityManagers,
  getPayments,
  getProfile,
  updateProfile,
  changePassword,
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getDeletePreview,
  getManagersList,
  getCommunityStats,
  bulkUpdateStatus,
  restoreCommunity,
  getAdminActivity,
  getFailedLogins,
} from '../controllers/adminController.js';
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/subscriptionPlanController.js';

const AdminRouter = express.Router();

// Multer config for admin image uploads (Cloudinary handled in controller)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Interest routes (kept as-is)
AdminRouter.get('/api/interests', getAllApplications);
AdminRouter.get('/interests', getAllApplications);
AdminRouter.post('/interests/:id/approve', approveApplication);
AdminRouter.post('/interests/:id/reject', rejectApplication);
AdminRouter.post('/interests/:id/resend-link', resendPaymentLink);

// Admin dashboard & overview routes (delegated to controller)
AdminRouter.get('/api/dashboard', getDashboard);
AdminRouter.get('/api/communities/overview', getCommunitiesOverview);
// Communities CRUD with RBAC
AdminRouter.get('/api/communities', requirePermission('read:communities'), getAllCommunities);
AdminRouter.get('/api/communities/stats', requirePermission('read:communities'), getCommunityStats);
AdminRouter.get('/api/communities/:id/delete-preview', requirePermission('delete:critical'), getDeletePreview);
AdminRouter.get('/api/communities/:id', requirePermission('read:communities'), getCommunityById);
AdminRouter.post('/api/communities', requirePermission('write:communities'), createCommunity);
AdminRouter.put('/api/communities/:id', requirePermission('write:communities'), updateCommunity);
AdminRouter.delete('/api/communities/:id', requirePermission('delete:critical'), deleteCommunity);

// Community restore
AdminRouter.post('/api/communities/:backupId/restore', requirePermission('delete:critical'), restoreCommunity);

AdminRouter.get('/api/community-managers', requirePermission('read:users'), getCommunityManagers);
AdminRouter.get('/api/payments', requirePermission('read:payments'), getPayments);

// Subscription Plans
AdminRouter.get('/api/subscription-plans', getAllPlans);
AdminRouter.get('/api/subscription-plans/:id', getPlanById);
AdminRouter.post('/api/subscription-plans', createPlan);
AdminRouter.put('/api/subscription-plans/:id', updatePlan);
AdminRouter.delete('/api/subscription-plans/:id', deletePlan);

// Managers list (lightweight)
AdminRouter.get('/api/managers', requirePermission('read:users'), getManagersList);

// Bulk operations
AdminRouter.post('/api/communities/bulk-update', requirePermission('write:communities'), bulkUpdateStatus);

// Admin activity & security monitoring
AdminRouter.get('/api/admin/activity', requirePermission('read:analytics'), getAdminActivity);
AdminRouter.get('/api/admin/security/failed-logins', requirePermission('read:analytics'), getFailedLogins);

// Profile routes
AdminRouter.get('/api/profile', getProfile);
AdminRouter.post('/api/profile/update', upload.single('image'), updateProfile);
AdminRouter.post('/api/profile/change-password', validatePasswordChange, changePassword);

export default AdminRouter;