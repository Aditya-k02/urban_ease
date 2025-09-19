import Resident from "../../models/resident.js";
import bcrypt from "bcrypt";
import cloudinary from "../../configs/cloudinary.js";


export const updateProfile = async (req, res) => {
  const resident = await Resident.findById(req.user.id);
  if (!resident) {
    return res.status(404).json({ message: "Resident not found" });
  }

  const { firstName, lastName, contact, email } = req.body;

  if (req.file?.buffer) {
    const result = await cloudinary.uploader.upload_stream({
      folder: "profiles/resident",
      transformation: [{ width: 512, height: 512, crop: "limit" }],
    });

    resident.image = result.secure_url;
    resident.imagePublicId = result.public_id;
  }

  resident.residentFirstname = firstName;
  resident.residentLastname = lastName;
  resident.contact = contact;
  resident.email = email;

  await resident.save();

  res.json({ success: true, resident });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const resident = await Resident.findById(req.user.id);

  if (!await bcrypt.compare(currentPassword, resident.password)) {
    return res.status(400).json({ message: "Incorrect password" });
  }

  resident.password = await bcrypt.hash(newPassword, 10);
  await resident.save();

  res.json({ success: true });
};

export const getResidentProfile = async (req, res) => {
  try {
    const resident = await Resident.findById(req.user.id)
      .populate("community");

    if (!resident) {
      return res.json({
        success: false,
        message: "Resident not found"
      });
    }

    return res.json({
      success: true,
      resident: {
        firstname: resident.residentFirstname,
        lastname: resident.residentLastname,
        email: resident.email,
        contact: resident.contact,
        uCode: resident.uCode,
        communityName: resident.community?.name || "",
        image: resident.image || null
      }
    });

  } catch (err) {
    console.error("Error fetching profile:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



















































