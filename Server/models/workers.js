import mongoose from "mongoose";

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },

  email: { type: String, required: true, unique: true },
  password: {
    type: String,
  },
  jobRole: { type: [String], required: true },
  contact: { type: String, required: true },

  address: { type: String, required: true },

  

  // 🔥 REQUIRED for Auto-Assign
  jobRole: {
    type: [String],
    enum: [
      "Plumber",        // Match existing database data
      "Electrician",    // Match existing database data
      "Plumbing",       // Keep for backwards compatibility
      "Electrical",     // Keep for backwards compatibility
      "Security",
      "Maintenance",
      "Pest Control",
      "Waste Management",
      "Other"
    ],
    required: true,
  },

  // 🔥 REQUIRED for Auto-Assign Cron
  isActive: {
    type: Boolean,
    default: true,
  },

  image: { type: String },

  salary: { type: Number, required: true },

  joiningDate: { type: Date, default: Date.now },

  // 🔥 A worker always belongs to one community (for filtering)
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
    required: true,
  },

  // 🔥 Auto-Assign depends on this to calculate workload
  assignedIssues: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Issue" }
  ],
  notifications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notifications",
  }]
  
}, { timestamps: true });

const Worker = mongoose.model("Worker", workerSchema);

export default Worker;
