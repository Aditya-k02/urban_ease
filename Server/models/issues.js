import mongoose from "mongoose";

const { Schema } = mongoose;

const issueSchema = new Schema({
  issueID: {
    type: String,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },

  status: {
    type: String,
    enum: [
      "Pending Assignment",
      "Assigned",
      "In Progress",
      "On Hold",
      "Resolved (Awaiting Confirmation)",
      "Closed",
      "Auto-Closed",
      "Reopened",
      "Rejected",
      "Payment Pending",
      "Payment Completed"
    ],
    default: "Pending Assignment",
  },

  // -------------------------
  // ⭐ MINIMAL NEW FIELDS ADDED
  // -------------------------

  attachments: [
    {
      type: String, // photo/video file names or URLs
    }
  ],

  priority: {
    type: String,
    enum: ["Normal", "High", "Urgent"],
    default: "Normal",
  },

  autoAssigned: {
    type: Boolean,
    default: false,
  },

  // -------------------------

  categoryType: {
    type: String,
    enum: ["Resident", "Community"],
    required: true,
  },

  category: {
    type: String,
    enum: [
      // Resident
      "Plumbing",
      "Electrical",
      "Security",
      "Maintenance",
      "Pest Control",
      "Waste Management",
      "Other",

      // Community
      "Streetlight",
      "Elevator",
      "Garden",
      "Common Area",
      "Other Community"
    ],
    required: true,
    trim: true,
  },

  otherCategory: {
    type: String,
    trim: true,
    default: null,
    validate: {
      validator: function (v) {
        if (this.category === "Other" || this.category === "Other Community")
          return v && v.length > 0;
        return !v;
      },
      message: "Custom category allowed only when category is 'Other'."
    }
  },

  resident: {
    type: Schema.Types.ObjectId,
    ref: "Resident",
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  workerAssigned: {
    type: Schema.Types.ObjectId,
    ref: "Worker",
    default: null,
  },

  misassignedBy: [{
    type: Schema.Types.ObjectId,
    ref: "Worker",
  }],

  resolvedAt: {
    type: String,
    default: null,
  },

  deadline: {
    type: String,
    required: false,
  },

  payment: {
    type: Schema.Types.ObjectId,
    ref: "Payment",
    default: null,
  },

  community: {
    type: Schema.Types.ObjectId,
    ref: "Community",
  },

  paymentStatus: {
    type: String,
    default: "Pending",
  },

  estimatedCost: {
    type: Number,
    default: 0,
    min: 0,
  },

  feedback: String,
  rating: Number,
}, { timestamps: true });


// ----------------------------------
// ⭐ LOCATION LOGIC (UNCHANGED)
// ----------------------------------
issueSchema.pre("save", async function (next) {
  this.updatedAt = Date.now();

  if (this.categoryType === "Resident") {
    const Resident = mongoose.model("Resident");
    const resident = await Resident.findById(this.resident);
    if (resident?.uCode) this.location = resident.uCode;
  }

  if (this.categoryType === "Community" && !this.location) {
    return next(new Error("Location is required for community issues."));
  }

  next();
});

const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
