import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import QRCode from "qrcode";

import Resident from "../../models/resident.js";
import Visitor from "../../models/visitors.js";
import { OTP } from "../OTP.js";
import { generateCustomID, formatDate } from "../../utils/residentHelpers.js";


export const createPreApproval = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { visitorName, contactNumber, dateOfVisit, timeOfVisit, purpose } =
      req.body;

    if (
      !visitorName ||
      !contactNumber ||
      !dateOfVisit ||
      !timeOfVisit ||
      !purpose
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const resident = await Resident.findById(req.user.id).populate("community");
    if (!resident) {
      return res.status(404).json({ message: "Resident not found" });
    }

    const scheduledAt = new Date(`${dateOfVisit}T${timeOfVisit}`);
    const tempId = new mongoose.Types.ObjectId();
    const uniqueId = generateCustomID(tempId.toString(), "PA");

    const visitor = new Visitor({
      _id: tempId,
      ID: uniqueId,
      name: visitorName,
      contactNumber,
      purpose,
      scheduledAt,
      approvedBy: resident._id,
      community: resident.community._id,
      otp: OTP(),
    });

    const token = jwt.sign(
      {
        visitorId: visitor._id.toString(),
        name: visitorName,
        contactNumber,
        purpose,
        scheduledAt,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    visitor.qrToken = token;
    visitor.qrCode = await QRCode.toDataURL(token);

    await visitor.save({ session });
    resident.preApprovedVisitors.push(visitor._id);
    await resident.save({ session });

    await session.commitTransaction();

    return res.status(201).json({
      success: true,
      preapproval: {
        _id: visitor._id,
        ID: uniqueId,
        visitorName,
        contactNumber,
        dateOfVisit: formatDate(dateOfVisit),
        timeOfVisit,
        purpose,
        status: "approved",
        qrToken: visitor.qrToken,
        qrCode: visitor.qrCode,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    console.error("Error in pre-approving visitor:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  } finally {
    session.endSession();
  }
};


export const cancelPreApproval = async (req, res) => {
  const requestId = req.params.id;

  try {
    const result = await Visitor.findByIdAndDelete(requestId);

    if (!result) {
      return res.status(404).json({ error: "Request not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Request canceled successfully",
    });
  } catch (error) {
    console.error("Error canceling request:", error);
    return res.status(500).json({ error: "Failed to cancel request" });
  }
};


export const getPreApprovals = async (req, res) => {
  try {
    const resident = await Resident.findById(req.user.id).populate("preApprovedVisitors");

    if (!resident) {
      return res.status(404).json({ success: false, message: "Resident not found" });
    }

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const visitors = await Visitor.find({ approvedBy: resident._id }).lean();

    const stats = await Visitor.aggregate([
      { $match: { approvedBy: resident._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const counts = { Pending: 0, Approved: 0, Rejected: 0 };
    stats.forEach((s) => counts[s._id] = s.count);

    return res.json({
      success: true,
      visitors,
      ads,
      counts
    });

  } catch (err) {
    console.error("Error loading visitor history:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch visitor data",
      error: err.message
    });
  }
};

export const getQRcode = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor)
      return res.status(404).json({ success: false, message: "Visitor not found" });

    if (!visitor.qrCode)
      return res.status(400).json({ success: false, message: "QR not generated" });

    return res.json({
      success: true,
      qrCodeBase64: visitor.qrCode,
      name: visitor.name,
      purpose: visitor.purpose,
      scheduledAt: visitor.scheduledAt,
      status: visitor.status
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};













