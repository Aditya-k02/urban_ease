import express from "express";
const residentRouter = express.Router();
import bcrypt from "bcrypt";
import mongoose from "mongoose";
// move them to controller when requried as they are serving only post of preapproval
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

import Issue from "../models/issues.js";
import Notifications from "../models/Notifications.js";
import Resident from "../models/resident.js";
import CommonSpaces from "../models/commonSpaces.js";
import Payment from "../models/payment.js";
import Visitor from "../models/visitors.js";
import Community from "../models/communities.js";
import auth from "../controllers/auth.js";
import { authorizeR } from "../controllers/authorization.js";
import { getIO } from "../utils/socket.js";
import Ad from "../models/Ad.js";
import PaymentController from "../controllers/payments.js";
// import { OTP } from "../controllers/OTP.js";
// import { verify } from "../controllers/OTP.js";
import {
  getCommonSpace,
  getIssueData,
  getPaymentData,
} from "../controllers/Resident.js";

import * as ResidentController from "../controllers/Resident/index.js";
// The imports are Profile : updateProfile, changePassword, getResidentProfile
// Preapproval : createPreApproval, cancelPreApproval, getPreApprovals, getQRcode
// Registration : requestOtp,verifyOtp,completeRegistration


import {
  getTimeAgo,
  getPaymentRemainders,
  setPenalties,
} from "../utils/residentHelpers.js";

import multer from "multer";
import cloudinary from "../configs/cloudinary.js";
import cron from "node-cron";
import checkSubscriptionStatus from "../middleware/subcriptionStatus.js";
import Amenity from "../models/Amenities.js";

residentRouter.use(checkSubscriptionStatus);
// Resident Self-Registration (OTP + Community Code)
// residentRouter.post("/register/request-otp", async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email)
//       return res
//         .status(400)
//         .json({ success: false, message: "Email is required" });

//     const existing = await Resident.findOne({ email });
//     if (existing && existing.password) {
//       return res
//         .status(409)
//         .json({ success: false, message: "Account already exists" });
//     }

//     await OTP(email);
//     return res.json({ success: true, message: "OTP sent to email" });
//   } catch (err) {
//     console.error("OTP request error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// residentRouter.post("/register/verify-otp", async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     if (!email || !otp)
//       return res
//         .status(400)
//         .json({ success: false, message: "Email and OTP required" });

//     const isValid = verify(email, otp);
//     if (!isValid)
//       return res.status(401).json({ success: false, message: "Invalid OTP" });

//     return res.json({ success: true, message: "OTP verified" });
//   } catch (err) {
//     console.error("Verify OTP error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// residentRouter.post("/register/complete", async (req, res) => {
//   try {
//     const {
//       residentFirstname,
//       residentLastname,
//       uCode,
//       contact,
//       email,
//       communityCode,
//     } = req.body;
//     if (
//       !residentFirstname ||
//       !residentLastname ||
//       !uCode ||
//       !email ||
//       !communityCode
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields" });
//     }

//     const community = await Community.findOne({ communityCode });
//     if (!community) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Invalid community code" });
//     }

//     const rotated = await community.rotateCodeIfExpired();
//     if (rotated) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Community code expired. Please request a new code from the manager.",
//       });
//     }


//     let resident = await Resident.findOne({ email });
//     if (!resident) {
//       resident = new Resident({
//         residentFirstname,
//         residentLastname,
//         uCode,
//         contact,
//         email,
//         community: community._id,
//       });
//     } 

//     await resident.save();
//     return res.json({
//       success: true,
//       message: "Resident registered",
//       residentId: resident._id,
//     });
//   } catch (err) {
//     console.error("Complete registration error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });
residentRouter.post("/register/request-otp", ResidentController.requestOtp);
residentRouter.post("/register/verify-otp", ResidentController.verifyOtp);
residentRouter.post("/register/complete", ResidentController.completeRegistration);


function generateCustomID(userEmail, facility, countOrRandom = null) {
  console.log("userEmail:", userEmail);

  // Clean the userEmail (remove spaces)
  const code = userEmail.toUpperCase().trim();

  const facilityCode = facility.toUpperCase().slice(0, 2);

  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));

  return `${code}-${facilityCode}-${suffix}`;
}

// Multer memory storage for resident profile images (Cloudinary in handler)
const upload = multer({ storage: multer.memoryStorage() });

residentRouter.get("/payment/community", async (req, res) => {
  try {
    const user = await Community.findById(req.user.community);

    if (!user) {
      return res.status(404).json({ message: "community not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res
      .status(500)
      .json({ message: "Error fetching user data", error: error.message });
  }
});


residentRouter.get("/ad", async (req, res) => {
  try {
    const ads = await Ad.find({
      community: req.user?.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({
      success: true,
      ads,
    });
  } catch (err) {
    console.error("Ads fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ads",
    });
  }
});

residentRouter.get("/commonSpace", async (req, res) => {
  try {
    const bookings = await CommonSpaces.find({
      bookedBy: req.user.id, // Fixed: use req.user.id instead of hardcoded
    })
      .populate("payment")
      .sort({ createdAt: -1 });
    const spaces = await Amenity.find({
      community: req.user.community, // Fixed: use req.user.community instead of hardcoded
    });

    return res.json({
      success: true,
      bookings: bookings,
      spaces: spaces,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

residentRouter.post("/commonSpace/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const commonspace = await CommonSpaces.findById(bookingId).populate(
      "payment"
    );
    if (!commonspace) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (commonspace.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    console.log("Commonspace Data:", commonspace);
    res.status(200).json({ commonspace: commonspace });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

residentRouter.post("/commonSpace", async (req, res) => {
  try {
    const uid = req.user.id; // Fixed: use req.user.id instead of hardcoded
    console.log(req.body);

    const {
      facility,
      fid,
      purpose,
      Date: dateString,
      from,
      to,
      Type,
    } = req.body.newBooking;
    const { bill, amount, paymentMethod } = req.body.data;

    const Space = await Amenity.findById(fid);

    if (!facility || !dateString) {
      return res.json({
        success: false,
        message: "Facility, date, and time are required fields.",
      });
    }

    // Use the new variable name here
    const bookingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.json({
        success: false,
        message: "Cannot book for past dates.",
      });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if ((!timeRegex.test(from) || !timeRegex.test(to)) && Type === "Slot") {
      console.log("invalid time format");

      return res.json({ success: false, message: "Invalid time format." });
    }

    const [fromHour, fromMin] = from.split(":").map(Number);
    const [toHour, toMin] = to.split(":").map(Number);
    const fromMinutes = fromHour * 60 + fromMin;
    const toMinutes = toHour * 60 + toMin;

    if (toMinutes && fromMinutes && toMinutes <= fromMinutes) {
      return res.json({
        success: false,
        message: "End time must be after start time.",
      });
    }

    const b = await CommonSpaces.create({
      name: facility,
      description: purpose || "No purpose specified",
      Date: new Date(dateString),
      from,
      to,
      Type,
      amount,
      status: Type === "Slot" ? "Booked" : "Active",
      availability: null,
      bookedBy: uid,
      community: new mongoose.Types.ObjectId(req.user.community), // Fixed: use req.user.community
    });

    let uniqueId = generateCustomID(b._id.toString(), "CS", null);
    b.ID = uniqueId;
    await b.save();

    if (Type === "Slot") {
      const bookingDateStr = new Date(dateString).toISOString().split("T")[0];
      const requestTimeSlots = req.body.newBooking.timeSlots;

      if (requestTimeSlots.length === 0) {
        return res.json({
          success: false,
          message: "Selected time range is invalid.",
        });
      }

      let existingBooking = Space.bookedSlots.find(
        (b) => new Date(b.date).toISOString().split("T")[0] === bookingDateStr
      );

      if (existingBooking) {
        const newSlots = requestTimeSlots.filter(
          (slot) => !existingBooking.slots.includes(slot)
        );
        existingBooking.slots.push(...newSlots);
      } else {
        // Use the new variable name here
        Space.bookedSlots.push({
          date: new Date(dateString),
          slots: requestTimeSlots,
        });
      }

      await Space.save();
    }

    uniqueId = generateCustomID(b._id.toString(), "PY", null);

    const payment = await Payment.create({
      title: b._id,
      sender: b.bookedBy._id,
      receiver: new mongoose.Types.ObjectId(req.user.community), // Fixed: use req.user.community
      amount: amount,
      paymentDate: new Date(),
      paymentMethod: paymentMethod,
      status: "Completed",
      remarks: null,
      ID: uniqueId,
      belongTo: "CommonSpaces",
      community: new mongoose.Types.ObjectId(req.user.community), // Fixed: use req.user.community
      belongToId: b._id,
    });

    b.paymentstatus = "Paid";
    b.payment = payment._id;
    await b.save();

    const user = await Resident.findById(uid);
    if (user) {
      user.bookedCommonSpaces.push(b._id);
      await user.save();
    }

    await b.populate("payment");

    // Emit booking notification to community managers of this community
    try {
      const io = getIO();

      const user = await CommunityManager.find({ assignedCommunity: req.user.community }).populate("notifications");

      console.log("community manager : ", user);
      
      let isN=[];

      if (user[0].notifications.length > 0) {
        isN = user?.notifications?.filter(
          (n) => n.title !== "New Common Space Bookings"
        );
      }

      const payload = new Notifications({
        type: "CommonSpaceBooking",
        title: "New Common Space Bookings",
        message: "There are new common space bookings",
        referenceId: b._id,
        referenceType: "CommonSpaces",
      });

      await payload.save();

      user[0].notifications = [...isN, payload];

      await user[0].save();


      if (io) {
        const communityId = req.user.community;
        const room = `community_${communityId}`;
        io.to(room).emit("booking:new", payload);
        console.log(`✅ Booking emission sent successfully`);
      } else {
        console.error("❌ Socket.IO instance not available");
      }
    } catch (emitErr) {
      console.error("❌ Failed to emit booking:new:", emitErr);
    }

    return res.json({
      success: true,
      message: "Booking request submitted successfully!",
      space: b,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

residentRouter.put("/booking/cancel/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const residentId = req.user.id; // Fixed: use req.user.id instead of hardcoded

    const booking = await CommonSpaces.findOne({
      _id: bookingId,
      bookedBy: residentId,
    });

    if (!booking) {
      return res
        .status(404)
        .json({ error: "Booking not found or unauthorized cancellation." });
    }

    const bookingDate = new Date(booking.Date);
    const now = new Date();

    if (bookingDate < now) {
      return res
        .status(400)
        .json({ error: "Cannot cancel past or ongoing bookings." });
    }

    const diffHours = Math.abs((bookingDate - now) / (1000 * 60 * 60));
    const amount = Number(booking?.amount || 0);
    console.log("booking : ", booking);

    if (isNaN(amount)) {
      return res.status(400).json({ error: "Invalid booking amount." });
    }

    console.log(diffHours);

    let refundAmount = booking?.amount;
    if (diffHours >= 48) {
      refundAmount = amount;
      console.log("greater than 48", refundAmount);
    } else if (diffHours >= 24) {
      refundAmount = amount * 0.75;
      console.log("greater than 24", refundAmount);
    } else if (diffHours >= 4) {
      refundAmount = amount * 0.25;
      console.log("greater than 4", refundAmount);
    } else {
      console.log("greater than 0");
      refundAmount = 0;
    }

    const refundId = generateCustomID(String(booking._id), "RF", null);
    console.log("After block : ", refundAmount);

    await CommonSpaces.findByIdAndUpdate(bookingId, {
      refundId,
      status: "Cancelled",
      cancelledBy: residentId,
      cancelledAt: new Date(),
      cancellationReason: "Cancelled by resident",
      refundAmount: Math.round(refundAmount),
    });

    await Resident.findByIdAndUpdate(residentId, {
      $pull: { bookedCommonSpaces: bookingId },
    });

    return res.json({
      success: true,
      message: "Booking cancelled successfully",
      refundAmount: Math.round(refundAmount),
      refundId,
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

residentRouter.get("/api/facilities", async (req, res) => {
  try {
    const community = await Community.findById(req.user.community).select(
      "commonSpaces"
    ); // Fixed: use req.user.community
    const facilities = community.commonSpaces || [];

    console.log("Raw facilities from database:", facilities);

    res.json({
      success: true,
      facilities: facilities,
    });
  } catch (error) {
    console.error("Error fetching facilities:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch facilities data",
    });
  }
});

residentRouter.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await CommonSpaces.find({ bookedBy: req.user.id });
    return res.json({ success: true, bookings });
  } catch (err) {
    console.log(err);
  }
});



residentRouter.get("/api/dashboard", async (req, res) => {
  try {
    const recents = [];

    // Fetch base data
    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    const issues = await Issue.find({ resident: req.user.id });
    const commonSpaces = await CommonSpaces.find({ bookedBy: req.user.id });
    const payments = await Payment.find({ sender: req.user.id });
    const preApp = await Visitor.find({ approvedBy: req.user.id });

    const resident = await Resident.findById(req.user.id);

    // Build recents list
    recents.push(
      ...issues.map((issue) => ({
        type: "Issue",
        title: issue.issueID,
        date: issue.createdAt,
      })),
      ...preApp.map((i) => ({
        type: "PreApproval",
        title: i._id,
        date: i.createdAt,
      })),
      ...commonSpaces.map((space) => ({
        type: "CommonSpace",
        title: space.name,
        date: space.createdAt,
      })),
      ...payments.map((payment) => ({
        type: "Payment",
        title: payment.title,
        date: payment.paymentDate,
      }))
    );

    // Sort by newest
    recents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Handle pending/overdue payments
    const pendingPayments = await Payment.find({
      sender: req.user.id,
      status: { $in: ["Pending", "Overdue"] },
    });

    for (const p of pendingPayments) {
      if (new Date(p.paymentDeadline) < new Date()) {
        p.status = "Overdue";
        await p.save();
      }
    }

    // Penalties
    const overdues = pendingPayments.filter((p) => p.status === "Overdue");
    setPenalties(overdues);

    // Apply payment reminders
    getPaymentRemainders(pendingPayments, resident.notifications);

    // Add timeAgo to notifications
    resident.notifications.forEach((n) => {
      n.timeAgo = getTimeAgo(n.createdAt);
    });

    // Sort newest first
    resident.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Keep only last 24 hours notifications
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const trimmedNotifications = resident.notifications.filter((n) => {
      return new Date(n.createdAt) >= oneDayAgo;
    });

    // Save final trimmed notifications
    resident.notifications = trimmedNotifications;
    await resident.save();

    return res.json({
      success: true,
      ads,
      recents,
      notifications: trimmedNotifications,
      pendingPayments,
    });
  } catch (err) {
    console.error("Dashboard JSON API Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

residentRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});
/*---------------------------------------------------------------------------------------------------- */
import {
  confirmIssue,
  rejectIssueResolution,
  raiseIssue,
  deleteIssue,
  getResidentIssues,
  getIssueDataById,
  submitFeedback,
} from "../controllers/issueController.js";
import CommunityManager from "../models/cManager.js";

residentRouter.post("/issue/confirmIssue/:id", confirmIssue);
residentRouter.post("/issue/rejectIssueResolution/:id", rejectIssueResolution);
residentRouter.post("/issue/raise", raiseIssue);
residentRouter.delete("/issue/delete/:issueID", deleteIssue);
residentRouter.get("/issue/data", getResidentIssues);
residentRouter.get("/issue/data/:id", getIssueDataById);
residentRouter.post("/issue/submitFeedback", submitFeedback);
/*---------------------------------------------------------------------------------------------------- */
// Payment routes - corrected version
residentRouter.get("/payments", getPaymentData);
residentRouter.patch("/payment/:id", PaymentController.updateResidentPayment);

residentRouter.get("/payment/receipt/:id", async (req, res) => {
  const Id = req.params.id;

  try {
    const payment = await Payment.findById(Id)
      .populate("receiver")
      .populate("sender");

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    return res.json({ success: true, payment });
  } catch (err) {
    console.error("Payment receipt fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment receipt",
    });
  }
});

residentRouter.get("/payment/:paymentId", async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentId = req.params.paymentId;

    const payment = await Payment.findOne({
      _id: paymentId,
      sender: userId,
    })
      .populate("receiver")
      .populate("sender");

    if (!payment) {
      return res.status(404).json({ error: "Payment receipt not found" });
    }
    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

//Preapproval routes
residentRouter.get("/preApprovals", auth, authorizeR, ResidentController.getPreApprovals);
residentRouter.post("/preapproval", auth, authorizeR,ResidentController.createPreApproval);
residentRouter.delete("/preapproval/cancel/:id",ResidentController.cancelPreApproval);
residentRouter.get("/preapproval/qr/:id", auth, authorizeR, ResidentController.getQRcode);


// Profile Routes
residentRouter.get("/profile", auth, authorizeR, ResidentController.getResidentProfile);
residentRouter.post("/profile", auth, authorizeR, upload.single("image"), ResidentController.updateProfile);
residentRouter.post("/change-password", auth, authorizeR, ResidentController.changePassword);

residentRouter.get("/clearNotification", async (req, res) => {
  const resi = await Resident.updateOne(
    { _id: req.user.id },
    { $set: { notifications: [] } }
  );

  console.log(resi.notifications);

  res.json({ ok: true });
});

export default residentRouter;
