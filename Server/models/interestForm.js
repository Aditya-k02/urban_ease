import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import crypto from 'crypto';
import admin from '../models/admin.js';


const InterestSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email address is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  communityName: {
    type: String,
    required: [true, 'Community name is required'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Community location is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Community description is required'],
    trim: true
  },
  photos: [{
    type: String // Store filenames of uploaded images
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'admin'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  onboardingToken: {
    type: String,
    index: true // Indexed for faster lookups
  },
  onboardingTokenExpires: {
    type: Date
  },
  rejectedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'admin'
  },
  approvedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
InterestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Query middleware to populate admin fields
InterestSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'approvedBy rejectedBy',
    select: 'name email'
  });
  next();
});


// Password encryption middleware
InterestSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = Date.now() - 1000; // Ensures token is created after password change
  next();
});
// Generate verification token
InterestSchema.methods.createVerificationToken = function () {
  const verificationToken = crypto.randomBytes(32).toString('hex');

  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  this.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return verificationToken;
};

// Generate password reset token
InterestSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Generate temporary password
InterestSchema.methods.generateTemporaryPassword = function () {
  const tempPassword = crypto.randomBytes(4).toString('hex');
  this.temporaryPassword = tempPassword;
  this.passwordChangedAt = Date.now();
  return tempPassword;
};

// Check password
InterestSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password was changed after token was issued
InterestSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Query middleware to populate approvedBy admin
InterestSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'approvedBy rejectedBy',
    select: 'name email'
  });
  next();
});

const Interest = mongoose.model('Interest', InterestSchema);
export default Interest;