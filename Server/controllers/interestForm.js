import Interest from '../models/interestForm.js';
import CommunityManager from '../models/cManager.js';
import admin from '../models/admin.js';
import Community from '../models/communities.js';
import SubscriptionPlan from '../models/subscriptionPlan.js';
import CommunitySubscription from '../models/communitySubscription.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import mongoose from 'mongoose';
import cloudinary from '../configs/cloudinary.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Lightweight router for direct submit with Cloudinary uploads
import express from 'express';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });


// Helper: Upload buffer to Cloudinary (uses existing cloudinary config)
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'communities' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });
};

// Named export router to avoid breaking existing controller exports
export const interestUploadRouter = (() => {
  const router = express.Router();

  // POST /submit: Accept photos and upload to Cloudinary, return URLs
  router.post('/submit', upload.array('photos', 5), async (req, res) => {
    try {
      const photoUrls = [];

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const result = await uploadToCloudinary(file.buffer);
          photoUrls.push(result.secure_url);
        }
      }

      const interestData = {
        ...req.body,
        photos: photoUrls,
      };

      // If you want to persist immediately, uncomment:
      // await Interest.create(interestData);

      res.json({
        success: true,
        message: 'Submitted successfully',
        photoCount: photoUrls.length,
        data: interestData,
      });
    } catch (error) {
      console.error('Direct submit error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
})();

// Upload photo to Cloudinary
export const uploadPhoto = async (req, res) => {
  try {
    console.log('Upload photo endpoint hit');
    console.log('File received:', !!req.file);

    if (!req.file) {
      console.log('No file provided');
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'interest-applications',
          transformation: [
            { width: 1024, crop: 'limit' },
            { quality: 'auto:good' }
          ],
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );

      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      url: result.secure_url
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};
// Email transporter setup - Simplified version
const emailTransporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Display interest form (Public)
export const showInterestForm = (req, res) => {
  res.render('interestForms', {
    title: 'Community Manager Application',
    message: req.flash('message') || '',
    formData: req.flash('formData')[0] || {}
  });
};



export const submitInterestForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, communityName, location, description } = req.body;

    // Required fields validation
    if (!firstName || !lastName || !email || !phone || !communityName || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled.',
        receivedFields: {
          firstName: !!firstName,
          lastName: !!lastName,
          email: !!email,
          phone: !!phone,
          communityName: !!communityName,
          location: !!location,
          description: !!description
        }
      });
    }

    // Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Phone validation
    if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
    }

    // Check for existing application by email
    const emailExists = await Interest.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email already exists. Please check your email for further communication.'
      });
    }

    // Check for duplicate community + location combination
    const communityLocationExists = await Interest.findOne({
      communityName: validator.escape(communityName.trim()),
      location: validator.escape(location.trim())
    });

    if (communityLocationExists) {
      return res.status(409).json({
        success: false,
        message: `An application for the community "${communityName}" in "${location}" already exists.`
      });
    }

    // Process and upload photos to Cloudinary
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Upload to Cloudinary using buffer from memory storage
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'interest-applications',
                transformation: [
                  { width: 1024, crop: 'limit' },
                  { quality: 'auto:good' }
                ],
                resource_type: 'image'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );

            // Write file buffer to upload stream
            uploadStream.end(file.buffer);
          });

          // Store Cloudinary URL
          photoUrls.push(result.secure_url);

        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          throw new Error('Failed to upload photo to cloud storage');
        }
      }
    }

    // Create new interest application
    const newApplication = new Interest({
      firstName: validator.escape(firstName.trim()),
      lastName: validator.escape(lastName.trim()),
      email: email.toLowerCase().trim(),
      phone: validator.escape(phone.trim()),
      communityName: validator.escape(communityName.trim()),
      location: validator.escape(location.trim()),
      description: validator.escape(description.trim()),
      photos: photoUrls,
      status: 'pending',
      submittedAt: new Date()
    });

    const savedApplication = await newApplication.save();

    res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully! We will review it and get back to you soon.',
      data: {
        applicationId: savedApplication._id,
        submittedAt: savedApplication.submittedAt,
        status: savedApplication.status,
        photosCount: photoUrls.length
      }
    });

  } catch (error) {
    console.error('Error in submitInterestForm:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your application. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




// Admin: Get all applications
// ✅ JSON version for React (no res.render, no req.flash)
export const getAllApplications = async (req, res) => {
  try {
    // 1️⃣ Fetch data
    const interests = await Interest.find()
      .sort({ createdAt: -1 })
      .populate('approvedBy rejectedBy', 'name email');

    console.log("Fetched interests:", interests.length);

    // 2️⃣ Safely format results for React
    const formatted = interests.map((app) => ({
      _id: app._id,
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      communityName: app.communityName,
      location: app.location,
      description: app.description,
      photos: app.photos || [],
      status: app.status || "pending",
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      approvedBy: app.approvedBy,
      rejectedBy: app.rejectedBy,
      approvedAt: app.approvedAt,
      rejectedAt: app.rejectedAt,
      approvedAt: app.approvedAt,
      rejectedAt: app.rejectedAt,
      rejectionReason: app.rejectionReason,
      paymentStatus: app.paymentStatus || 'pending'
    }));

    // 3️⃣ Send JSON response
    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    // 4️⃣ Proper logging
    console.error("❌ Error fetching community interest applications:", error.message);
    console.error(error.stack);

    // 5️⃣ Safe error response
    res.status(500).json({
      success: false,
      message: "Server error while fetching applications",
      error: error.message,
    });
  }
};


// Admin: Get all applications as JSON
export const getAllApplicationsJSON = async (req, res) => {
  try {
    const interests = await Interest.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      interests
    });
  } catch (error) {
    console.error('Get interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
};


export const approveApplication = async (req, res) => {
  console.log("=== Approve Application Request ===");
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("User:", req.user);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Generate onboarding token (secure hex string)
    const onboardingToken = crypto.randomBytes(32).toString('hex');
    const onboardingTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // Case: Valid for 7 days

    // 2. Update interest status and set token
    const interest = await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: Date.now(),
        paymentStatus: 'pending',
        onboardingToken,
        onboardingTokenExpires
      },
      { new: true, session }
    );

    if (!interest) {
      throw new Error('Application not found');
    }

    // 3. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 4. Get admin name for email
    const adminUser = await admin.findById(req.user.id);
    const adminName = adminUser?.name || 'Admin';

    // 5. Send Email with Payment Link
    const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
    const paymentLink = `${clientUrl}/onboarding/payment?token=${onboardingToken}`;

    console.log("[Approval] Sending payment link to:", interest.email);

    await sendStatusEmail(
      interest.email,
      'approved',
      adminName,
      `Your application has been approved! <br/><br/><strong>Next Step:</strong> Please complete your subscription payment to activate your account and receive your login credentials.<br/><br/><a href="${paymentLink}" class="btn" style="color: white; text-decoration: none;">Complete Payment & Activate Account</a>`,
      null // No password yet
    );

    res.json({
      success: true,
      message: 'Application approved. Onboarding link sent to applicant.',
      data: {
        interestId: interest._id,
        status: interest.status,
        paymentStatus: interest.paymentStatus
      }
    });

  } catch (error) {
    console.error("[ERROR] Approval process failed:", error);

    // Rollback
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: 'Error approving application',
      error: error.message
    });
  }
};



export const rejectApplication = async (req, res) => {
  try {
    if (!req.body.reason || req.body.reason.trim().length <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason must be provided'
      });
    }

    const interest = await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectedBy: req.user.id,
        rejectedAt: Date.now(),
        rejectionReason: validator.escape(req.body.reason.trim())
      },
      { new: true, runValidators: true }
    );

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get admin name for email
    const adminUser = await admin.findById(req.user.id);
    const adminName = adminUser?.name || 'Admin';

    await sendStatusEmail(
      interest.email,
      'rejected',
      adminName,
      validator.escape(req.body.reason.trim())
    );

    res.json({
      success: true,
      message: 'Application rejected successfully',
      data: {
        applicationId: interest._id,
        rejectionReason: interest.rejectionReason
      }
    });

  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError'
        ? 'Invalid rejection data'
        : 'Error rejecting application'
    });
  }
};
// Admin: Suspend application







const sendStatusEmail = async (email, status, adminName, reason = '', password = '') => {
  const subject = status === 'approved'
    ? 'Your Application Has Been Approved'
    : status === 'rejected'
      ? 'Your Application Has Been Rejected'
      : 'Your Application Status Update';

  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
<style>
  body { margin:0; padding:0; background:#f4f6f8; font-family:'Segoe UI', Tahoma, sans-serif; color:#333 }
  .container { max-width:600px; margin:30px auto; background:#fff; border-radius:10px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08) }
  .header { padding:36px 20px; text-align:center; color:#fff; }
  .header.approved { background: linear-gradient(135deg, #4CAF50, #2e7d32); }
  .header.activated { background: linear-gradient(135deg, #2196F3, #1976D2); }
  .header.rejected { background: linear-gradient(135deg, #e53935, #b71c1c); }
  .header.pending  { background: linear-gradient(135deg, #fb8c00, #ef6c00); }
  .icon { font-size:40px; margin-bottom:10px }
  .content { padding:28px 24px; line-height:1.6; font-size:16px; color:#444 }
  .credentials { background:#e3f2fd; border:1px solid #90caf9; padding:18px; border-radius:6px; margin:18px 0 }
  .credentials code { background:#f1f3f4; padding:4px 8px; border-radius:4px; font-family:monospace; font-size:14px; color: #d32f2f; font-weight: bold; }
  .btn { display:inline-block; padding:14px 24px; margin-top:18px; background:#4CAF50; color:#fff !important; text-decoration:none; border-radius:6px; font-weight:600; text-transform:uppercase; font-size:14px; box-shadow:0 3px 6px rgba(0,0,0,0.2) }
  .btn:hover { opacity:0.9 }
  .footer { text-align:center; font-size:12px; color:#888; padding:16px; background:#f1f3f4 }
  @media (max-width:600px){ .container{ margin:0; border-radius:0 } .content{ padding:20px } }
</style>
</head>
<body>
  <div class="container">
    <div class="header ${status}">
      <div class="icon">
        ${status === 'approved' ? '✅' : status === 'rejected' ? '❌' : status === 'activated' ? '🚀' : '🔔'}
      </div>
      <h1 style="margin:0; font-size:24px;">
        ${status === 'approved' ? 'Application Approved!' : status === 'rejected' ? 'Application Status' : status === 'activated' ? 'Welcome to UrbanEase!' : 'Notification'}
      </h1>
    </div>
    <div class="content">
      <p>Hello,</p>
      
      ${reason ? `<div style="margin-bottom:20px;">${reason}</div>` : ''}

      ${status === 'activated' ? `
      <div class="credentials">
        <h3 style="margin-top:0; color:#1565c0;">🚀 Account Activated!</h3>
        <p style="margin:5px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin:5px 0;"><strong>Password:</strong> <code>${password}</code></p>
      </div>
      <p style="text-align: center;">Please login and change your password immediately.</p>
      <div style="text-align:center;">
        <a class="btn" href="${process.env.CLIENT_BASE_URL || 'http://localhost:5173'}/SignIn">Login to Dashboard</a>
      </div>
      ` : ''}

      ${(status === 'approved' && !password) ? `
       <div style="text-align:center; margin-top: 20px;">
          <a class="btn" href="#" style="background: #1976d2; pointer-events: none; cursor: default;">Awaiting Payment</a>
       </div>
      ` : ''}

    </div>
    <div class="footer">
      This is an automated message from Urban Ease.<br />
      Need help? Contact <a href="mailto:support@urbaneaseapp.com" style="color:#1976d2;text-decoration:none;">support@urbaneaseapp.com</a>
    </div>
  </div>
</body>
</html>`;

  try {
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html: htmlTemplate
    });
    console.log('Status email sent to:', email);
  } catch (error) {
    console.error('Error sending status email:', error);
  }
};


// ---------------------------------------------------------
// NEW ONBOARDING ENDPOINTS
// ---------------------------------------------------------

// Smart Resend: Link if pending, Credentials if completed
export const resendPaymentLink = async (req, res) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (interest.status !== 'approved' && interest.status !== 'onboarded') {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend info. Application is rejected or pending.'
      });
    }

    // CASE 1: ALREADY COMPLETED -> ERROR (Feature removed)
    if (interest.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed. Account is active.'
      });
    }

    // CASE 2: PENDING -> RESEND PAYMENT LINK
    // Generate new token
    const onboardingToken = crypto.randomBytes(32).toString('hex');
    const onboardingTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now

    interest.onboardingToken = onboardingToken;
    interest.onboardingTokenExpires = onboardingTokenExpires;
    await interest.save();

    // Send email
    const adminUser = await admin.findById(req.user.id);
    const adminName = adminUser?.name || 'Admin';
    const clientUrl = process.env.CLIENT_BASE_URL || 'http://localhost:5173';
    const paymentLink = `${clientUrl}/onboarding/payment?token=${onboardingToken}`;

    await sendStatusEmail(
      interest.email,
      'approved', // Keep as 'approved' template or customized
      adminName,
      `<strong>Payment Link Resent:</strong><br/>Please use the link below to complete your account setup.<br/><br/><a href="${paymentLink}" class="btn" style="color: white; text-decoration: none;">Complete Payment & Activate Account</a>`,
      null
    );

    res.json({
      success: true,
      message: 'Payment link resent successfully',
      data: {
        interestId: interest._id,
        newExpiry: onboardingTokenExpires
      }
    });

  } catch (error) {
    console.error('Error resending info:', error);
    res.status(500).json({ success: false, message: 'Error performing resend action' });
  }
};

// Public: Get onboarding details by token
export const getOnboardingDetails = async (req, res) => {
  try {
    const { token } = req.params;

    // Find interest by token and check expiry
    const interest = await Interest.findOne({
      onboardingToken: token,
      onboardingTokenExpires: { $gt: Date.now() } // Must not be expired
    });

    if (!interest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired onboarding link. Please contact support.'
      });
    }

    if (interest.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This account has already been activated. Please login directly.'
      });
    }

    // Fetch available plans from database
    const activePlans = await SubscriptionPlan.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    // Transform plans into client-friendly format
    const plans = activePlans.reduce((acc, plan) => {
      acc[plan.planKey] = {
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        features: plan.features,
        maxResidents: plan.maxResidents
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        firstName: interest.firstName,
        lastName: interest.lastName,
        email: interest.email,
        communityName: interest.communityName,
        paymentStatus: interest.paymentStatus,
        plans // Return plans here
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Public: Complete Onboarding Payment & Activate Account
export const completeOnboardingPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token, paymentDetails } = req.body;

    // 1. Validate Token
    const interest = await Interest.findOne({
      onboardingToken: token,
      onboardingTokenExpires: { $gt: Date.now() }
    }).session(session);

    if (!interest) {
      throw new Error('Invalid or expired onboarding session');
    }

    if (interest.paymentStatus === 'completed') {
      throw new Error('Account already activated');
    }

    // 2. Validate Plan
    const planDoc = await SubscriptionPlan.findOne({
      planKey: paymentDetails?.plan,
      isActive: true
    }).session(session);

    if (!planDoc) {
      throw new Error('Invalid or inactive subscription plan selected');
    }

    // 3. "Process" Payment 
    // In a real app, you'd verify Stripe/Razorpay signature here.
    // For now, we assume success if this endpoint is called with paymentDetails.
    console.log(`[Payment] Processing payment for ${interest.email}`, paymentDetails);

    // 4. Generate Credentials
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    // 5. Create Manager
    const newManager = await CommunityManager.create(
      [{
        name: `${interest.firstName} ${interest.lastName}`,
        email: interest.email,
        password: hashedPassword,
        contact: interest.phone || "0000000000",
        subscriptionStatus: 'active' // Important: they just paid!
      }],
      { session }
    );

    // 6. Calculate plan end date based on plan duration
    const daysToAdd = planDoc.duration === 'yearly' ? 365 : 30;
    const planEndDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    // 7. Create Community
    const newCommunity = await Community.create(
      [{
        name: interest.communityName?.trim() || '',
        location: interest.location?.trim() || '',
        description: interest.description?.trim() || '',
        totalMembers: 0,
        communityManager: newManager[0]._id,
        subscriptionStatus: 'active',
        subscriptionPlan: planDoc.planKey,
        planStartDate: new Date(),
        planEndDate: planEndDate
      }],
      { session }
    );

    // Link community
    newManager[0].assignedCommunity = newCommunity[0]._id;
    await newManager[0].save({ session });

    // 8. Create CommunitySubscription record for billing
    await CommunitySubscription.create(
      [{
        communityId: newCommunity[0]._id,
        transactionId: paymentDetails?.transactionId || `TXN-${Date.now()}`,
        planName: planDoc.name,
        planType: planDoc.planKey,
        amount: planDoc.price,
        paymentMethod: paymentDetails?.paymentMethod || 'online',
        paymentDate: new Date(),
        planStartDate: new Date(),
        planEndDate: planEndDate,
        duration: planDoc.duration,
        status: 'completed',
        isRenewal: false,
        metadata: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress
        }
      }],
      { session }
    );

    // 9. Update Interest Status
    interest.paymentStatus = 'completed';
    // interest.status = 'onboarded'; // Optional: change status or keep 'approved'
    interest.onboardingToken = undefined; // Clear token
    interest.onboardingTokenExpires = undefined;
    await interest.save({ session });

    // 10. Commit
    await session.commitTransaction();
    session.endSession();

    // 11. Send Welcome Email with Credentials
    const communityCode = newCommunity[0].communityCode;

    await sendStatusEmail(
      interest.email,
      'activated', // New status for Welcome email
      'UrbanEase Team',
      `<p>Your payment was successful and your account is now active.</p>
       <p><strong>Community Code:</strong> ${communityCode}</p>
       <p>You can now manage your community, residents, and maintain requests.</p>`,
      randomPassword // Pass password to trigger credentials block
    );

    res.json({
      success: true,
      message: 'Account activated successfully! Check your email for login credentials.',
      data: {
        managerId: newManager[0]._id
      }
    });

  } catch (error) {
    console.error('[Onboarding Error]', error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};