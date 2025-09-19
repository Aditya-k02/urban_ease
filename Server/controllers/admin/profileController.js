import cloudinary from '../../configs/cloudinary.js';
import bcrypt from 'bcrypt';
import { listAdmins, updateAdminById } from '../../crud/index.js';

export const getProfile = async (req, res) => {
  try {
    const admin = (await listAdmins({}, '-password'))[0];
    if (!admin) return res.status(404).json({ message: 'Admin not found' });

    res.json({
      success: true,
      admin: {
        name: admin.name,
        email: admin.email,
        image: admin.image || '/default-profile.png',
      },
    });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ success: false, message: 'Name and email are required' });

    const admin = (await listAdmins({}, null))[0];
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    if (email !== admin.email) {
      const exists = (await listAdmins({ email, _id: { $ne: admin._id } }, null)).length > 0;
      if (exists) return res.status(400).json({ success: false, message: 'Email already exists' });
    }

    const updates = { name, email };

    if (req.file && req.file.buffer) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: 'profiles/admin',
              resource_type: 'image',
              transformation: [
                { width: 512, height: 512, crop: 'limit' },
                { quality: 'auto:good' },
              ],
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          uploadStream.end(req.file.buffer);
        });

        updates.image = result.secure_url;
        updates.imagePublicId = result.public_id;
      } catch (uploadError) {
        console.error('Admin profile image upload error:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload profile image.',
        });
      }
    }

    const updatedAdmin = await updateAdminById(admin._id, updates);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      admin: { name: updatedAdmin.name, email: updatedAdmin.email, image: updatedAdmin.image },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ success: false, message: 'Failed to update profile' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    const admin = (await listAdmins({}, null))[0];
    if (!admin) return res.status(404).json({ success: false, message: 'Admin not found' });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const same = await bcrypt.compare(newPassword, admin.password);
    if (same)
      return res.status(400).json({ success: false, message: 'New password must differ' });

    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;
    if (!strong.test(newPassword))
      return res.status(400).json({ success: false, message: 'Password must include upper, lower, number/special char (min 8 chars)' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await updateAdminById(admin._id, { password: hashedPassword });

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    console.error('Password change error:', err);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};
