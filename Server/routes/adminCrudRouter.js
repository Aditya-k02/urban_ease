import express from "express";
import auth from "../controllers/auth.js";
import { authorizeRoles } from "../controllers/authorization.js";

// Import CRUD helpers for all models from the central index
import {
  // Ad
  createAd,
  listAds,
  getAdById,
  updateAdById,
  deleteAdById,
  // Admin
  createAdmin,
  listAdmins,
  getAdminById,
  updateAdminById,
  deleteAdminById,
  // Amenities
  createAmenity,
  listAmenities,
  getAmenityById,
  updateAmenityById,
  deleteAmenityById,
  // Community Manager
  createCommunityManager,
  listCommunityManagers,
  getCommunityManagerById,
  updateCommunityManagerById,
  deleteCommunityManagerById,
  // Common Spaces
  createCommonSpace,
  listCommonSpaces,
  getCommonSpaceById,
  updateCommonSpaceById,
  deleteCommonSpaceById,
  // Communities
  createCommunity,
  listCommunities,
  getCommunityById,
  updateCommunityById,
  deleteCommunityById,
  // Community Subscriptions
  createCommunitySubscription,
  listCommunitySubscriptions,
  getCommunitySubscriptionById,
  updateCommunitySubscriptionById,
  deleteCommunitySubscriptionById,
  // Interest forms
  createInterestForm,
  listInterestForms,
  getInterestFormById,
  updateInterestFormById,
  deleteInterestFormById,
  // Issues
  createIssue,
  listIssues,
  getIssueById,
  updateIssueById,
  deleteIssueById,
  // Notifications
  createNotification,
  listNotifications,
  getNotificationById,
  updateNotificationById,
  deleteNotificationById,
  // Payments
  createPayment,
  listPayments,
  getPaymentById,
  updatePaymentById,
  deletePaymentById,
  // Preapprovals
  createPreapproval,
  listPreapprovals,
  getPreapprovalById,
  updatePreapprovalById,
  deletePreapprovalById,
  // Residents
  createResident,
  listResidents,
  getResidentById,
  updateResidentById,
  deleteResidentById,
  // Security
  createSecurity,
  listSecurities,
  getSecurityById,
  updateSecurityById,
  deleteSecurityById,

  // Visitors
  createVisitor,
  listVisitors,
  getVisitorById,
  updateVisitorById,
  deleteVisitorById,
  // Workers
  createWorker,
  listWorkers,
  getWorkerById,
  updateWorkerById,
  deleteWorkerById,
} from "../crud/index.js";

const router = express.Router();

// Apply auth + admin role to every route in this router
router.use(auth, authorizeRoles("admin", "/AdminLogin"));

// Helper to bind standard CRUD endpoints for a given base path
const bindCrudRoutes = (basePath, { create, list, getById, updateById, deleteById }) => {
  // Create
  router.post(basePath, async (req, res) => {
    try {
      const doc = await create(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (error) {
      console.error(`[CRUD][CREATE] ${basePath}:`, error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // List
  router.get(basePath, async (req, res) => {
    try {
      const docs = await list({});
      res.json({ success: true, data: docs });
    } catch (error) {
      console.error(`[CRUD][LIST] ${basePath}:`, error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Get by id
  router.get(`${basePath}/:id`, async (req, res) => {
    try {
      const doc = await getById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      res.json({ success: true, data: doc });
    } catch (error) {
      console.error(`[CRUD][GET] ${basePath}:`, error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Update by id
  router.put(`${basePath}/:id`, async (req, res) => {
    try {
      const doc = await updateById(req.params.id, req.body);
      if (!doc) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      res.json({ success: true, data: doc });
    } catch (error) {
      console.error(`[CRUD][UPDATE] ${basePath}:`, error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Delete by id
  router.delete(`${basePath}/:id`, async (req, res) => {
    try {
      const doc = await deleteById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: "Not found" });
      }
      res.json({ success: true, message: "Deleted successfully" });
    } catch (error) {
      console.error(`[CRUD][DELETE] ${basePath}:`, error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });
};

// Bind CRUD routes for each model under /admin/api/*
bindCrudRoutes("/ads", {
  create: createAd,
  list: listAds,
  getById: getAdById,
  updateById: updateAdById,
  deleteById: deleteAdById,
});

bindCrudRoutes("/admins", {
  create: createAdmin,
  list: listAdmins,
  getById: getAdminById,
  updateById: updateAdminById,
  deleteById: deleteAdminById,
});

bindCrudRoutes("/amenities", {
  create: createAmenity,
  list: listAmenities,
  getById: getAmenityById,
  updateById: updateAmenityById,
  deleteById: deleteAmenityById,
});

bindCrudRoutes("/community-managers", {
  create: createCommunityManager,
  list: listCommunityManagers,
  getById: getCommunityManagerById,
  updateById: updateCommunityManagerById,
  deleteById: deleteCommunityManagerById,
});

bindCrudRoutes("/common-spaces", {
  create: createCommonSpace,
  list: listCommonSpaces,
  getById: getCommonSpaceById,
  updateById: updateCommonSpaceById,
  deleteById: deleteCommonSpaceById,
});

bindCrudRoutes("/communities", {
  create: createCommunity,
  list: listCommunities,
  getById: getCommunityById,
  updateById: updateCommunityById,
  deleteById: deleteCommunityById,
});

bindCrudRoutes("/community-subscriptions", {
  create: createCommunitySubscription,
  list: listCommunitySubscriptions,
  getById: getCommunitySubscriptionById,
  updateById: updateCommunitySubscriptionById,
  deleteById: deleteCommunitySubscriptionById,
});

bindCrudRoutes("/interest-forms", {
  create: createInterestForm,
  list: listInterestForms,
  getById: getInterestFormById,
  updateById: updateInterestFormById,
  deleteById: deleteInterestFormById,
});

bindCrudRoutes("/issues", {
  create: createIssue,
  list: listIssues,
  getById: getIssueById,
  updateById: updateIssueById,
  deleteById: deleteIssueById,
});

bindCrudRoutes("/notifications", {
  create: createNotification,
  list: listNotifications,
  getById: getNotificationById,
  updateById: updateNotificationById,
  deleteById: deleteNotificationById,
});

bindCrudRoutes("/payments", {
  create: createPayment,
  list: listPayments,
  getById: getPaymentById,
  updateById: updatePaymentById,
  deleteById: deletePaymentById,
});

bindCrudRoutes("/preapprovals", {
  create: createPreapproval,
  list: listPreapprovals,
  getById: getPreapprovalById,
  updateById: updatePreapprovalById,
  deleteById: deletePreapprovalById,
});

bindCrudRoutes("/residents", {
  create: createResident,
  list: listResidents,
  getById: getResidentById,
  updateById: updateResidentById,
  deleteById: deleteResidentById,
});

bindCrudRoutes("/security", {
  create: createSecurity,
  list: listSecurities,
  getById: getSecurityById,
  updateById: updateSecurityById,
  deleteById: deleteSecurityById,
});


bindCrudRoutes("/visitors", {
  create: createVisitor,
  list: listVisitors,
  getById: getVisitorById,
  updateById: updateVisitorById,
  deleteById: deleteVisitorById,
});

bindCrudRoutes("/workers", {
  create: createWorker,
  list: listWorkers,
  getById: getWorkerById,
  updateById: updateWorkerById,
  deleteById: deleteWorkerById,
});

export default router;
