
import mongoose from "mongoose";

const visitorSchema = new mongoose.Schema(
  {
   
    ID: { type: String },

    
    name: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true },
    email: { type: String },

    purpose: { type: String },
    vehicleNumber: { type: String },

    
    qrCode: { type: String }, 
    qrToken: { type: String }, 

    
    scheduledAt: { type: Date }, 
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Resident" },

    
    isCheckedIn: { type: Boolean, default: false },
    checkInAt: { type: Date },
    checkOutAt: { type: Date },

    
    status: {
      type: String,
      enum: ["Pending", "Approved", "Active", "Rejected", "Unactive", "CheckedOut"],
      default: "Pending",
    },
    verifiedByResident: { type: Boolean, default: false },

    
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Security" }, // security/admin who added visitor
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
  },
  { timestamps: true }
);

const Visitor = mongoose.model("Visitor", visitorSchema);

export default Visitor;
