import mongoose from "mongoose";

const deletedCommunityBackupSchema = new mongoose.Schema({
  originalCommunityId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    index: true
  },
  communityData: {
    community: mongoose.Schema.Types.Mixed,
    residents: [mongoose.Schema.Types.Mixed],
    issues: [mongoose.Schema.Types.Mixed],
    workers: [mongoose.Schema.Types.Mixed],
    securities: [mongoose.Schema.Types.Mixed],
    managers: [mongoose.Schema.Types.Mixed],
    amenities: [mongoose.Schema.Types.Mixed],
    commonSpaces: [mongoose.Schema.Types.Mixed],
    payments: [mongoose.Schema.Types.Mixed],
    subscriptions: [mongoose.Schema.Types.Mixed],
    visitors: [mongoose.Schema.Types.Mixed],
    preapprovals: [mongoose.Schema.Types.Mixed],
    notifications: [mongoose.Schema.Types.Mixed],
    ads: [mongoose.Schema.Types.Mixed]
  },
  deletionMetadata: {
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'admin', required: true },
    deletedByEmail: String,
    deletedAt: { type: Date, default: Date.now },
    reason: String,
    counts: {
      residents: Number,
      issues: Number,
      workers: Number,
      securities: Number,
      managers: Number,
      amenities: Number,
      commonSpaces: Number,
      payments: Number,
      subscriptions: Number,
      visitors: Number,
      preapprovals: Number,
      notifications: Number,
      ads: Number
    }
  },
  permanentDeleteAt: { 
    type: Date, 
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'restored', 'permanently_deleted'],
    default: 'pending'
  },
  restoredAt: Date,
  restoredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'admin' }
}, { timestamps: true });

// Index for cleanup queries
deletedCommunityBackupSchema.index({ permanentDeleteAt: 1, status: 1 });

const DeletedCommunityBackup = mongoose.model("DeletedCommunityBackup", deletedCommunityBackupSchema);

export default DeletedCommunityBackup;
