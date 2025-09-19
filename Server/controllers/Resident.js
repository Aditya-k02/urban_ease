// controllers/residentController.js
import Resident from "../models/resident.js";
import Visitor from "../models/visitors.js";
import Ad from "../models/Ad.js";
import CommonSpaces from "../models/commonSpaces.js";
import Community from "../models/communities.js";
import Payment from "../models/payment.js";
import Issue from "../models/issues.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { getTimeAgo } from "../utils/residentHelpers.js";

const getCommonSpace = async (req, res) => {
  try {
    const bookings = await CommonSpaces
      .find({ bookedBy: req.user.id })
      .sort({ createdAt: -1 });

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const community = await Community.findById(req.user.community);
    const availableSpaces = community ? community.commonSpaces : [];

    const pendingBookings = await CommonSpaces.countDocuments({
      bookedBy: req.user.id,
      community: req.user.community,
      status: "Pending",
    });

    const allBookings = await CommonSpaces.countDocuments({
      bookedBy: req.user.id,
      community: req.user.community,
    });

    return res.json({
      success: true,
      bookings,
      ads,
      availableSpaces,
      stats: {
        pendingBookings,
        allBookings,
      }
    });

  } catch (error) {
    console.error("Error fetching common space data:", error);
    return res.status(500).json({
      success: false,
      message: "Error loading common space data",
      error: error.message,
    });
  }
};

// const getPaymentData = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const ads = await Ad.find({
//       community: req.user.community,
//       startDate: { $lte: new Date() },
//       endDate: { $gte: new Date() },
//     });

//     console.log(ads);

//     const payments = await Payment.find({ sender: userId }).populate(
//       "receiver",
//       "name"
//     );
//     console.log(payments);
//     // sort the payments  so that object with status overdue at first next with status pending and next with status completed , and in there are multiple objects with same status they should be in ascending order of paymentdeadline
//     payments.sort((a, b) => {
//       const statusOrder = { Overdue: 1, Pending: 2, Completed: 3 };
//       if (statusOrder[a.status] !== statusOrder[b.status]) {
//         return statusOrder[a.status] - statusOrder[b.status];
//       }

//       return new Date(a.paymentDeadline) - new Date(b.paymentDeadline);
//     });

//     payments.forEach((p) => {
//       if (
//         p.status === "Pending" &&
//         p.paymentDeadline &&
//         new Date(p.paymentDeadline) < new Date()
//       ) {
//         p.status = "Overdue";
//       }
//     });

//     const overduePayments = payments.filter((p) => p.status === "Overdue");
//     const pendingPayments = payments.filter((p) => p.status === "Pending");
//     const completedPayments = payments.filter((p) => p.status === "Completed");

//     const stats = {
//       overdueCount: overduePayments.length,
//       pendingCount: pendingPayments.length,
//       completedCount: completedPayments.length,
//       totalBills: payments.length,

//       // sums
//       overdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
//       pendingAmount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
//       completedAmount: completedPayments.reduce((sum, p) => sum + p.amount, 0),
//       totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
//     };

//     res.render("resident/payments", { path: "p", payments, ads, stats });
//   } catch (error) {
//     console.error("Error fetching payments:", error);
//     req.flash("message", "Failed to load payment data");
//     res.redirect("/dashboard");
//   }
// };
const getPaymentData = async (req, res) => {
  try {
    const userId = req.user.id;

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    let payments = await Payment.find({ sender: userId }).populate("receiver", "name");

    payments.sort((a, b) => {
      const order = { Overdue: 1, Pending: 2, Completed: 3 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return new Date(a.paymentDeadline) - new Date(b.paymentDeadline);
    });

    payments.forEach(p => {
      if (p.status === "Pending" && p.paymentDeadline < new Date()) {
        p.status = "Overdue";
      }
    });

    const overduePayments = payments.filter(p => p.status === "Overdue");
    const pendingPayments = payments.filter(p => p.status === "Pending");
    const completedPayments = payments.filter(p => p.status === "Completed");

    const stats = {
      overdueCount: overduePayments.length,
      pendingCount: pendingPayments.length,
      completedCount: completedPayments.length,
      totalBills: payments.length,
      overdueAmount: overduePayments.reduce((s, p) => s + p.amount, 0),
      pendingAmount: pendingPayments.reduce((s, p) => s + p.amount, 0),
      completedAmount: completedPayments.reduce((s, p) => s + p.amount, 0),
      totalAmount: payments.reduce((s, p) => s + p.amount, 0),
    };

    return res.json({
      success: true,
      payments,
      ads,
      stats
    });

  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load payment data",
      error: error.message
    });
  }
};


// const getIssueData = async (req, res) => {
//   try {
//     const resident = await Resident.findOne({ email: req.user.email }).populate(
//       {
//         path: "raisedIssues",
//         populate: {
//           path: "workerAssigned",
//         },
//       }
//     );
//     const ads = await Ad.find({
//       community: req.user.community,
//       startDate: { $lte: new Date() },
//       endDate: { $gte: new Date() },
//     });
//     console.log(ads);

//     if (!resident) {
//       return res.status(404).json({ error: "Resident not found." });
//     }

//     const issues = await resident.raisedIssues;

//     const issueCounts = {
//       pending: 0,
//       inProgress: 0,
//       resolved: 0,
//     };

//     issues.forEach((issue) => {
//       const status = issue.status.toLowerCase();
//       if (status === "pending") issueCounts.pending += 1;
//       else if (status === "assigned") issueCounts.inProgress += 1;
//       else if (status === "payment pending" || status === "paid")
//         issueCounts.resolved += 1;
//     });

//     console.log(issueCounts.pending);

//     res.render("resident/issueRaising", {
//       path: "ir",
//       i: issues,
//       ads,
//       issueCounts,
//     });
//   } catch (error) {
//     console.error("Error fetching issues:", error);
//     return res.status(500).json({ error: "Internal server error." });
//   }
// };
const getIssueData = async (req, res) => {
  try {
    const resident = await Resident.findOne({ email: req.user.email })
      .populate({
        path: "raisedIssues",
        populate: { path: "workerAssigned" }
      });

    if (!resident) {
      return res.status(404).json({ success: false, message: "Resident not found" });
    }

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    const issues = resident.raisedIssues;

    const issueCounts = { pending: 0, inProgress: 0, resolved: 0 };

    issues.forEach((issue) => {
      const s = issue.status.toLowerCase();
      if (s === "pending") issueCounts.pending++;
      else if (s === "assigned") issueCounts.inProgress++;
      else if (s === "payment pending" || s === "paid") issueCounts.resolved++;
    });

    return res.json({
      success: true,
      issues,
      ads,
      issueCounts
    });

  } catch (error) {
    console.error("Error fetching issues:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};



export { getCommonSpace, getIssueData, getPaymentData };
