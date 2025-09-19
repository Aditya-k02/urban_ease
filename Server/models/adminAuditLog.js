import mongoose from "mongoose";

const adminAuditLogSchema = new mongoose.Schema({
  adminId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'admin', 
    required: true 
  },
  adminEmail: { type: String, required: true }, // Denormalized for quick queries
  action: { 
    type: String, 
    required: true,
    enum: [
      'login',
      'logout',
      'failed_login',
      'create_community',
      'update_community',
      'delete_community',
      'restore_community',
      'create_user',
      'update_user',
      'delete_user',
      'approve_application',
      'reject_application',
      'update_payment',
      'update_subscription',
      'change_password',
      'update_profile',
      'system_config_change',
      'bulk_operation',
      'other'
    ]
  },
  targetType: { 
    type: String,
    enum: ['Community', 'Resident', 'Security', 'Worker', 'CommunityManager', 'InterestForm', 'Payment', 'Subscription', 'Admin', 'System', 'Other']
  },
  targetId: { type: mongoose.Schema.Types.ObjectId },
  targetName: { type: String }, // Denormalized for display
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  metadata: mongoose.Schema.Types.Mixed, // Additional context (e.g., deletion counts, reason)
  ip: { type: String },
  userAgent: { type: String },
  status: { 
    type: String, 
    enum: ['success', 'failed', 'partial'], 
    default: 'success' 
  },
  errorMessage: { type: String }
}, { 
  timestamps: true 
});

// Indexes for efficient querying
adminAuditLogSchema.index({ adminId: 1, createdAt: -1 });
adminAuditLogSchema.index({ action: 1, createdAt: -1 });
adminAuditLogSchema.index({ targetType: 1, targetId: 1 });
adminAuditLogSchema.index({ createdAt: -1 }); // For recent actions

const AdminAuditLog = mongoose.model("AdminAuditLog", adminAuditLogSchema);

export default AdminAuditLog;
