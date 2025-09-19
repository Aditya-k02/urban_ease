// mark this deletion don't use this use visitor.js model

import mongoose from "mongoose";

const visitorPreApprovalSchema = new mongoose.Schema(
  {
    ID: String,
    visitorName: { type: String, required: true },
    contactNumber: { type: String, required: true },
    dateOfVisit: { type: String, required: true },
    timeOfVisit: { type: String, required: true },
    purpose: { type: String },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
    isCheckedIn: { type: Boolean, default: false },
    status: {
      type: String,
      enum : ["Pending","Approved","Rejected"],
      default: "Pending",
    },
    vehicleNo: String,
    OTP: String,

    qrId: { type: String, unique: true, sparse: true },  // unique identifier
    qrToken: { type: String },                           // signed JWT token
    qrImage: { type: String },                           // base64 QR image
    qrStatus: {
      type: String,
      enum: ["Active", "Used", "Expired"],
      default: "Active",
    },
    qrExpiresAt: { type: Date },   
  },
  { timestamps: true }
);

const VisitorPreApproval = mongoose.model(
  "VisitorPreApproval",
  visitorPreApprovalSchema
);
export default VisitorPreApproval;
