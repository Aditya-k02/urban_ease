import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true },
    password: { type: String , required: true },
    role: { 
      type: String, 
      enum: ['super-admin', 'admin', 'support'], 
      default: 'admin' 
    },
    lastLogin: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    activeSessions: [{
      sessionId: String,
      device: String,
      ip: String,
      lastActivity: Date,
      expiresAt: Date
    }]
  },
  { timestamps: true }
);

const admin = mongoose.model("admin", adminSchema);

export default admin;
