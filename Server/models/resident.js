import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

// Initialize AutoIncrement
const connection = mongoose.connection;
const AutoIncrement = AutoIncrementFactory(connection);

const residentSchema = new mongoose.Schema(
  {
    residentFirstname: { type: String, required: true },
    residentLastname: { type: String, required: true },
    uCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: /^[A-Za-z0-9]{1,4}-[A-Za-z0-9]{1,4}$/, // format: BLOCK-HOUSENUMBER
    },
    email: { type: String, required: true, unique: true },
    password: String,
    image: String,
    contact: { type: String },
    preApprovedVisitors: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Visitor" },
    ],
    bookedCommonSpaces: [
      { type: mongoose.Schema.Types.ObjectId, ref: "CommonSpaces" },
    ],
    raisedIssues: [{ type: mongoose.Schema.Types.ObjectId, ref: "Issue" }],
    paymentHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: "Payment" }],
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
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

const MAX_RESIDENTS_PER_EMAIL = 3;

residentSchema.pre("save", async function (next) {
  try {
    const existingCount = await this.constructor.countDocuments({
      email: this.email,
    });

    if (existingCount >= MAX_RESIDENTS_PER_EMAIL) {
      return next(
        new Error(
          `Limit of ${MAX_RESIDENTS_PER_EMAIL} residents reached for ${this.email}`
        )
      );
    }
    next();
  } catch (err) {
    next(err);
  }
});

const Resident = mongoose.model("Resident", residentSchema);

export default Resident;
