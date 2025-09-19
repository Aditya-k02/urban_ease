import mongoose from "mongoose";
import CommonSpaces from "./commonSpaces.js";
import Issue from "./issues.js";
import Payment from "./payment.js";
import VisitorPreApproval from "./preapproval.js";
import Resident from "./resident.js";
import Worker from "./workers.js";
import Security from "./security.js";
import Community from "./communities.js"; // you missed this

const communityManagerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    image: String,
    password: { type: String, required: true },
    contact: { type: String, required: true },
    assignedCommunity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Notifications",
      }
    ],
  },
  { timestamps: true }
);

// Cascade delete middleware
communityManagerSchema.pre("findOneAndDelete", async function (next) {
  try {
    const manager = await this.model.findOne(this.getFilter());
    if (!manager) return next();

    // Find all communities created by this manager
    const communities = await Community.find({ managerId: manager._id });
    const communityIds = communities.map((c) => c._id);

    if (communityIds.length > 0) {
      await CommonSpaces.deleteMany({ community: { $in: communityIds } });
      await Issue.deleteMany({ community: { $in: communityIds } });
      await Payment.deleteMany({ communityId: { $in: communityIds } });
      await Resident.deleteMany({ community: { $in: communityIds } });
      await Security.deleteMany({ communityAssigned: { $in: communityIds } });
      await Worker.deleteMany({ communityAssigned: { $in: communityIds } });
      await VisitorPreApproval.deleteMany({ community: { $in: communityIds } });

      // Finally delete communities
      await Community.deleteMany({ managerId: manager._id });
    }

    next();
  } catch (err) {
    next(err);
  }
});

const CommunityManager = mongoose.model(
  "CommunityManager",
  communityManagerSchema
);

export default CommunityManager;
