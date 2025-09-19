import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    planKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: String,
      required: true,
      enum: ["monthly", "yearly"],
    },
    maxResidents: {
      type: Number,
      default: null, // null = unlimited
    },
    features: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for performance
subscriptionPlanSchema.index({ planKey: 1 });
subscriptionPlanSchema.index({ isActive: 1 });
subscriptionPlanSchema.index({ displayOrder: 1 });

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
