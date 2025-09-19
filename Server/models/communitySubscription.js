// models/CommunitySubscription.js
import mongoose from "mongoose";

const CommunitySubscriptionSchema = new mongoose.Schema({
  communityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true
  },

  transactionId: { type: String, required: true },
  planName: { type: String, required: true },
  planType: { type: String, required: true },
  amount: { type: Number, required: true },

  paymentMethod: { type: String, required: true },
  paymentDate: { type: Date, required: true },

  planStartDate: { type: Date, required: true },
  planEndDate: { type: Date, required: true },

  duration: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly",
  },

  status: {
    type: String,
    enum: ["completed", "pending", "failed"],
    default: "pending",
  },

  isRenewal: { type: Boolean, default: false },

  metadata: {
    userAgent: String,
    ipAddress: String
  }
}, { timestamps: true });

CommunitySubscriptionSchema.index({ communityId: 1, paymentDate: -1 });
CommunitySubscriptionSchema.index({ planEndDate: 1 });

const CommunitySubscription = mongoose.model(
  "CommunitySubscription",
  CommunitySubscriptionSchema
);

export default CommunitySubscription;
