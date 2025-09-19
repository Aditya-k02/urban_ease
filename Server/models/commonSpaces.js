import mongoose from "mongoose";
import Community from "./communities.js";

const commonSpacesSchema = new mongoose.Schema({
  ID: String,

  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  Date: {
    type: String,
    required: true,
  },

  from: {
    type: String,
    required: true,
  },

  Type:{
    type:String,
    required : true
  },

  to: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: [
      "Pending",
      "Available",
      "Active",
      "Approved",
      "Booked",
      "Pending Payment",
      "Paid",
      "Cancelled By Resident",
      "Cancelled By Manager",
      "Completed",
      "Expired",
      "Rejected"
    ],
    default: "Pending",
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Success", "Failed", "Refunded"],
    default: "Pending",
  },

  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },

  amount: {
    type: Number,
  },

  refundId: {
    type: String,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  
  availability: {
    type: String,
  },

  auditTrail: [
    {
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["Resident", "Manager", "System"] },
      action: String,
      timestamp: { type: Date, default: Date.now },
      notes: String,
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },

  updatedAt: {
    type: Date,
    default: Date.now,
  },

  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resident",
  },

  feedback: String,

  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },

  cancelledAt: {
    type: Date,
  },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resident",
  },

  cancellationReason: {
    type: String,
  },

  notificationsSent: {
    type: Boolean,
    default: false,
  },
});

const CommonSpaces = mongoose.model("CommonSpaces", commonSpacesSchema);
export default CommonSpaces;
