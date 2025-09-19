// controllers/security/profile.controller.js

import Security from "../../models/security.js";
import Ad from "../../models/Ad.js";
import cloudinary from "../../configs/cloudinary.js";
import bcrypt from "bcrypt";

/**
 * GET /security/profile
 */
export const getProfile = async (req, res) => {
  try {
    const security = await Security.findById(req.user.id)
      .select("name email contact address image Shift workplace joiningDate community");

    if (!security) {
      return res.status(404).json({
        success: false,
        message: "Security not found",
      });
    }

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({
      success: true,
      security,
      ads,
    });
  } catch (err) {
    console.error("Error loading security profile:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * POST /security/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { name, email, contact, address } = req.body;

    const security = await Security.findById(req.user.id);
    if (!security) {
      return res.status(404).json({
        success: false,
        message: "Security not found",
      });
    }

    if (name) security.name = name;
    if (email) security.email = email;
    if (contact) security.contact = contact;
    if (address) security.address = address;

    if (req.file?.buffer) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "profiles/security",
              resource_type: "image",
              transformation: [
                { width: 512, height: 512, crop: "limit" },
                { quality: "auto:good" },
              ],
            },
            (err, result) => {
              if (err) reject(err);
              else resolve(result);
            }
          );

          stream.end(req.file.buffer);
        });

        security.image = result.secure_url;
        security.imagePublicId = result.public_id;
      } catch (err) {
        console.error("Profile image upload error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image",
        });
      }
    }

    await security.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      security,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * POST /security/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const security = await Security.findById(req.user.id);
    if (!security) {
      return res
        .status(404)
        .json({ success: false, message: "Security not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      security.password
    );

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password does not match",
      });
    }

    security.password = await bcrypt.hash(newPassword, 10);
    await security.save();

    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Password change error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
