import Resident from "../../models/resident.js";
import Community from "../../models/communities.js";
import { OTP, verify } from "../OTP.js";

export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const existing = await Resident.findOne({ email });
    if (existing && existing.password) {
      return res
        .status(409)
        .json({ success: false, message: "Account already exists" });
    }

    await OTP(email);
    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("OTP request error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP required" });
    }

    const isValid = verify(email, otp);
    if (!isValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid OTP" });
    }

    return res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const completeRegistration = async (req, res) => {
  try {
    const {
      residentFirstname,
      residentLastname,
      uCode,
      contact,
      email,
      communityCode,
    } = req.body;

    if (
      !residentFirstname ||
      !residentLastname ||
      !uCode ||
      !email ||
      !communityCode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const community = await Community.findOne({ communityCode });
    if (!community) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid community code" });
    }

    const rotated = await community.rotateCodeIfExpired();
    if (rotated) {
      return res.status(400).json({
        success: false,
        message:
          "Community code expired. Please request a new code from the manager.",
      });
    }

    let resident = await Resident.findOne({ email });

    if (!resident) {
      resident = new Resident({
        residentFirstname,
        residentLastname,
        uCode,
        contact,
        email,
        community: community._id,
      });
    }

    await resident.save();

    return res.json({
      success: true,
      message: "Resident registered",
      residentId: resident._id,
    });
  } catch (err) {
    console.error("Complete registration error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
