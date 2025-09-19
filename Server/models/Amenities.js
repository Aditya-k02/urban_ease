import mongoose from "mongoose";

const Amenities = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Clubhouse",
        "Gym",
        "Banquet Hall",
        "Community Hall",
        "Swimming Pool",
        "Tennis Court",
        "Badminton Court",
        "Basketball Court",
        "Amphitheatre",
        "Guest Room",
        "Other",
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    Type:{
      type : String,
      enum : ["Slot","Subscription"]
    },
    bookable: { type: Boolean, default: true },
    bookingRules: { type: String },
    rent: Number,
    bookedSlots: [
      {
        date: { type: Date, required: true },
        slots: [{ type: String }],
      },
    ],
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
  },
  { timestamps: true }
);

const Amenity = mongoose.model("Amenity", Amenities);

export default Amenity;
