import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
  type: String,
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceType: String,
  createdAt: { type: Date, default: Date.now },

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  }
});

notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Notifications", notificationSchema);

