// models/Community.js
import mongoose from "mongoose";
import Amenity from "./Amenities.js";

const CommunitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    description: { type: String },

    // Unique short code used to route sign-ups to this community
    // used for inviting people using residnet registration
    communityCode: { type: String, required: true, unique: true, index: true },
    communityCodeLastRotatedAt: { type: Date, default: Date.now },

    status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
    totalMembers: { type: Number, default: 0 },

    profile: {
      photos: [
        {
          filename: { type: String, required: true },
          originalName: { type: String, required: true },
          path: { type: String, required: true },
          size: { type: Number, required: true },
          mimeType: { type: String, required: true },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      logo: {
        filename: String,
        originalName: String,
        path: String,
        size: Number,
        mimeType: String,
        uploadedAt: Date,
      },
    },

    // CURRENT subscription status only
    subscriptionPlan: {
      type: String,
      default: null,
    },
    subscriptionStatus: {
      type: String,
      enum: ["active", "pending", "expired"],
      default: "pending",
    },
    planStartDate: Date,
    planEndDate: Date,

    // Community Structure (Blocks & Flats)
    hasStructure: { type: Boolean, default: false },
    blocks: [
      {
        name: { type: String, required: true }, // e.g., "Block A"
        totalFloors: { type: Number, required: true },
        flatsPerFloor: { type: Number, required: true },
        flats: [
          {
            flatNumber: { type: String, required: true }, // e.g., "A-101"
            floor: { type: Number, required: true },      // e.g., 1
            status: { type: String, enum: ["Vacant", "Occupied", "Owner"], default: "Vacant" },
            residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" }
          }
        ]
      }
    ],

    // legacy (optional)
    paymentHistory: [
      {
        date: Date,
        amount: Number,
        method: String,
        transactionId: String,
        invoiceUrl: String,
      },
    ],

    commonSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Amenity" }],

    communityManager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityManager",
    },
  },
  { timestamps: true },
);

CommunitySchema.index({ subscriptionStatus: 1, planEndDate: 1 });

// Helper to generate a readable unique community code
function normalize(str) {
  return String(str || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
}

async function generateUniqueCode(name, location) {
  const base = `${normalize(name)}-${normalize(location)}`.replace(/-$/, "");
  let attempt = 0;
  while (attempt < 10) {
    const suffix = Math.random()
      .toString(36)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "")
      .slice(0, 4);
    const code = `${base}-${suffix}`;
    // Ensure uniqueness
    // eslint-disable-next-line no-await-in-loop
    const exists = await mongoose
      .model("Community")
      .exists({ communityCode: code });
    if (!exists) return code;
    attempt += 1;
  }
  // Fallback ultra-random
  return `${normalize(name)}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// Pre-validate hook to auto-generate code if missing
CommunitySchema.pre("validate", async function (next) {
  if (!this.communityCode) {
    try {
      this.communityCode = await generateUniqueCode(this.name, this.location);
    } catch (e) {
      return next(e);
    }
  }
  return next();
});

// virtuals
CommunitySchema.virtual("isExpired").get(function () {
  if (!this.planEndDate) return true;
  return new Date() > new Date(this.planEndDate);
});

CommunitySchema.virtual("isExpiringSoon").get(function () {
  if (!this.planEndDate || this.subscriptionStatus !== "active") return false;
  const t = new Date();
  t.setDate(t.getDate() + 7);
  return new Date(this.planEndDate) <= t;
});

CommunitySchema.methods.updateSubscriptionStatus = function () {
  if (this.planEndDate && new Date() > new Date(this.planEndDate)) {
    this.subscriptionStatus = "expired";
  }
  return this;
};

CommunitySchema.methods.rotateCodeIfExpired = async function () {
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const last = this.communityCodeLastRotatedAt?.getTime() || 0;

  if (Date.now() - last >= SEVEN_DAYS) {
    this.communityCode = await generateUniqueCode(
      this.name,
      this.location
    );
    this.communityCodeLastRotatedAt = new Date();
    await this.save();
    return true;
  }

  return false;
};

CommunitySchema.methods.forceRotateCode = async function () {
  this.communityCode = await generateUniqueCode(this.name, this.location);
  this.communityCodeLastRotatedAt = new Date();
  await this.save();
  return this.communityCode;
};


const Community = mongoose.model("Community", CommunitySchema);
export default Community;
