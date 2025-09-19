import express from "express";
const managerRouter = express.Router();

import bcrypt from "bcrypt";
import multer from "multer";
import mongoose from "mongoose";

import fs from "fs";
import Issue from "../models/issues.js";
import Worker from "../models/workers.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Community from "../models/communities.js";
import CommonSpaces from "../models/commonSpaces.js";
import PaymentController from "../controllers/payments.js";
import CommunityManager from "../models/cManager.js";
import Ad from "../models/Ad.js";
import Payment from "../models/payment.js";
import Amenity from "../models/Amenities.js";
import visitor from "../models/visitors.js";

import cloudinary from "../configs/cloudinary.js";

import { createCommunitySubscription } from "../crud/index.js";

import { sendPassword } from "../controllers/OTP.js";
import {
  checkAuth, checkSubscription, sendError, sendSuccess,
  getCommonSpaces, getCommonSpaceBookings, getBookingDetails, rejectBooking,
  createSpace, updateSpace, deleteSpace,
  getUserManagement, createResident, getResident, deleteResident,
  createSecurity, getSecurity, deleteSecurity,
  createWorker, getWorker, deleteWorker, getWorkers,
  getManagerProfile, getProfileWithCommunity, updateManagerProfile, changePassword,
  updateBookingRules, getSpaces, rotateCommunityCode, setupCommunityStructure, getCommunityStructure,
  getAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement,
  getPaymentsData, getSubscriptionPlans, changePlan,
  getCommunityDetails, processSubscriptionPayment, getSubscriptionHistory, getSubscriptionStatus,
  getDashboardData
} from "../controllers/Manager/index.js";

function generateCustomID(userEmail, facility, countOrRandom = null) {
  const id = userEmail.toUpperCase().slice(0, 2);

  const facilityCode = facility.toUpperCase().slice(0, 2);

  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));

  return `UE-${id}${facilityCode}${suffix}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + ".png";
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });


managerRouter.get("/commonSpace", getCommonSpaces);


managerRouter.get("/commonSpace/api/bookings", getCommonSpaceBookings);


managerRouter.get("/commonSpace/details/:id", getBookingDetails);


managerRouter.post("/commonSpace/reject/:id", rejectBooking);


managerRouter.post("/spaces", checkAuth, createSpace);


managerRouter.put("/spaces/:id", checkAuth, updateSpace);


managerRouter.delete("/spaces/:id", checkAuth, deleteSpace);


managerRouter.post("/api/community/booking-rules", checkAuth, updateBookingRules);




managerRouter.get("/api/community/spaces", checkAuth, getSpaces);

// Apply checkSubscription middleware to all routes except excluded ones
managerRouter.use(checkSubscription);


// Get community details with subscription info

// Get community details with subscription info
managerRouter.get("/community-details", getCommunityDetails);


// Handle subscription payment
managerRouter.post("/subscription-payment", processSubscriptionPayment);


managerRouter.get("/subscription-history", getSubscriptionHistory);


managerRouter.get("/subscription-status", getSubscriptionStatus);

// Cloudinary upload helper for community images
const uploadCommunityImageToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "communities",
        resource_type: "image",
        transformation: [
          { width: 1600, crop: "limit" },
          { quality: "auto:good" },
        ],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
};

// Multer memory storage for community image uploads (Cloudinary handled in route)
const upload2 = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
  },
});

managerRouter.get("/new-community", (req, res) => {
  res.render("communityManager/new-community");
});

// Create new community with photo upload
managerRouter.post("/communities", upload2.array("photos", 10), async (req, res) => {
  try {
    const managerId = req.session?.managerId || req.user?.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Community manager not found.",
      });
    }

    // Upload photos to Cloudinary if provided
    const photoUrls = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        try {
          const result = await uploadCommunityImageToCloudinary(file.buffer);
          photoUrls.push({
            url: result.secure_url,
            publicId: result.public_id,
          });
        } catch (err) {
          console.error("Error uploading community image:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to upload community images.",
          });
        }
      }
    }

    // Create community document with Cloudinary photo URLs in profile.photos
    const communityData = {
      ...req.body,
      communityManager: manager._id,
      profile: {
        ...(req.body.profile || {}),
        photos: photoUrls,
      },
    };

    const community = await Community.create(communityData);

    res.status(201).json({
      success: true,
      message: "Community created successfully!",
      data: community,
    });
  } catch (error) {
    console.error("Error updating community:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while creating the community.",
    });
  }
});

// Get community details
managerRouter.get("/communities/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("communityManager", "name email")
      .lean();

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found.",
      });
    }

    res.json({
      success: true,
      data: community,
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching community details.",
    });
  }
});

// Get all communities for the logged-in manager
managerRouter.get("/communities", async (req, res) => {
  try {
    const managerId = req.session?.managerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = managerId ? { communityManager: managerId } : {};

    const communities = await Community.find(query)
      .select(
        "name location email status totalMembers subscriptionPlan subscriptionStatus planEndDate profile.photos"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Community.countDocuments(query);

    res.json({
      success: true,
      data: {
        communities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching communities.",
    });
  }
});

// Payment stats endpoint
managerRouter.get("/payment-stats", async (req, res) => {
  try {
    const managerId = req.session?.managerId;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const matchCondition = {
      "subscriptionHistory.paymentDate": { $gte: firstDayOfMonth },
    };

    if (managerId) {
      matchCondition.communityManager = managerId;
    }

    const stats = await Community.aggregate([
      { $match: matchCondition },
      { $unwind: "$subscriptionHistory" },
      {
        $match: {
          "subscriptionHistory.paymentDate": { $gte: firstDayOfMonth },
          "subscriptionHistory.status": "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$subscriptionHistory.amount" },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$subscriptionHistory.status", "pending"] },
                "$subscriptionHistory.amount",
                0,
              ],
            },
          },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalAmount: 0,
        pendingAmount: 0,
        totalTransactions: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching payment statistics.",
    });
  }
});
function getSubscriptionPlanName(planType) {
  const planNames = {
    basic: "Basic Plan",
    standard: "Standard Plan",
    premium: "Premium Plan",
  };
  return planNames[planType] || "Unknown Plan";
}
// Helper function to get plan price
function getPlanPrice(planType) {
  const planPrices = {
    basic: 999,
    standard: 1999,
    premium: 3999,
  };
  return planPrices[planType] || 0;
}

managerRouter.get("/all-payments", PaymentController.getAllPayments);

// Create a new payment
managerRouter.post("/payments", PaymentController.createPayment);

// Get all residents
managerRouter.get("/residents", PaymentController.getAllResidents);

// Get current logged-in user information
managerRouter.get("/currentcManager", PaymentController.getCurrentcManager);

// Get a specific payment by ID
managerRouter.get("/payments/:id", PaymentController.getPaymentById);

// Update a payment status
managerRouter.put("/payments/:id", PaymentController.updatePayment);

// Delete a payment
managerRouter.delete("/payments/:id", PaymentController.deletePayment);


managerRouter.get("/userManagement", getUserManagement);


managerRouter.post("/userManagement/resident", createResident);


managerRouter.get("/userManagement/resident/:id", getResident);


managerRouter.delete("/userManagement/resident/:id", deleteResident);


managerRouter.post("/userManagement/security", createSecurity);


managerRouter.get("/userManagement/security/:id", getSecurity);
managerRouter.delete("/userManagement/security/:id", deleteSecurity);


managerRouter.post("/userManagement/worker", createWorker);


managerRouter.get("/userManagement/worker/:id", getWorker);


managerRouter.delete("/userManagement/worker/:id", deleteWorker);


managerRouter.get("/api/dashboard", getDashboardData);


/*---------------------------------------------------------------------------------------------------- */
managerRouter.get("/issueResolving", async (req, res) => {
  try {
    const data = await getIssueResolvingData(req);
    res.render("communityManager/issueResolving", {
      path: "ir",
      ...data,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

import { assignIssue, getManagerIssues, reassignIssue, closeIssueByManager, getIssueById, getRejectedPendingIssues, getIssueResolvingApiIssues, getIssueResolvingData } from "../controllers/issueController.js";
managerRouter.get("/issue/myIssues", getManagerIssues);
managerRouter.post("/issue/assign/:id", assignIssue);
managerRouter.post("/issue/reassign/:id", reassignIssue);
managerRouter.post("/issue/close/:id", closeIssueByManager);
managerRouter.get("/issue/:id", getIssueById);

// API endpoint to fetch issues data for auto-refresh
managerRouter.get("/issueResolving/api/issues", getIssueResolvingApiIssues);
// NEW: Route for handling rejected auto-assigned issues (resident rejects → goes to manager)
managerRouter.get("/issue/rejected/pending", getRejectedPendingIssues);


managerRouter.get("/workers", getWorkers);

/*---------------------------------------------------------------------------------------------------- */

managerRouter.get("/api/payments", getPaymentsData);

// Helper: plan capacity (max residents); null = unlimited
const PLAN_CAPACITY = {
  basic: 50,
  standard: 200,
  premium: null,
};

// Get available subscription plans

managerRouter.get("/subscription-plans", getSubscriptionPlans);

// Handle plan change request

managerRouter.post("/change-plan", changePlan);


managerRouter.get("/api/ad", getAdvertisements);


managerRouter.post("/api/ad", upload.single("image"), createAdvertisement);

// Update advertisement

managerRouter.put("/api/ad/:id", upload.single("image"), updateAdvertisement);

// Delete advertisement

managerRouter.delete("/ad/:id", deleteAdvertisement);


managerRouter.get("/profile/api", getProfileWithCommunity);


managerRouter.post("/profile", upload.single("image"), updateManagerProfile);


managerRouter.post("/profile/changePassword", changePassword);



managerRouter.post("/community/rotate-code", rotateCommunityCode);

managerRouter.get("/get-structure", getCommunityStructure);
managerRouter.post("/setup-structure", setupCommunityStructure);

export default managerRouter;

