import mongoose from "mongoose";
import bcrypt from "bcrypt";

// Import Models
import CommunityManager from "../models/cManager.js";
import Community from "../models/communities.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Worker from "../models/workers.js";
import Ad from "../models/Ad.js";
import CommonSpace from "../models/commonSpaces.js";
import Issue from "../models/issues.js";
import Payment from "../models/payment.js";
import PreApproval from "../models/preapproval.js";
import Visitor from "../models/visitors.js";
import Interest from "../models/interestForm.js";
import CommunitySubscription from "../models/communitySubscription.js";

const MONGODB_URI =
  "mongodb+srv://sathvikchiluka:UE123@urbanease.8evt9ty.mongodb.net/urbanEase?retryWrites=true&w=majority&appName=UrbanEase";

async function insertSampleData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    // 1. CLEAR OLD DATA
    console.log("🧹 Clearing old data...");
    await Promise.all([
      Interest.deleteMany({}),
      CommunityManager.deleteMany({}),
      Community.deleteMany({}),
      Resident.deleteMany({}),
      Security.deleteMany({}),
      Worker.deleteMany({}),
      Ad.deleteMany({}),
      CommonSpace.deleteMany({}),
      Issue.deleteMany({}),
      Payment.deleteMany({}),
      PreApproval.deleteMany({}),
      Visitor.deleteMany({}),
      CommunitySubscription.deleteMany({})
    ]);

    // 2. Password + Dates
    const today = new Date();
    const nextYear = new Date(new Date().setFullYear(today.getFullYear() + 1));
    const hashedPass = await bcrypt.hash("123456", 10);

    // 3. COMMUNITY
    console.log("🏗️ Creating Community...");
    const community = await Community.create({
      name: "Urban Heights",
      location: "Hyderabad, India",
      description: "Premium Gated Community",
      status: "Active",
      totalMembers: 150,

      profile: {
        photos: [
          {
            filename: "entrance.jpg",
            originalName: "entrance.jpg",
            path: "/uploads/dummy/entrance.jpg",
            size: 5000,
            mimeType: "image/jpeg",
            uploadedAt: today,
          },
        ],
        logo: {
          filename: "logo.png",
          originalName: "logo.png",
          path: "/uploads/dummy/logo.png",
          size: 5000,
          mimeType: "image/png",
          uploadedAt: today,
        },
      },

      subscriptionPlan: "standard",
      subscriptionStatus: "active",
      planStartDate: today,
      planEndDate: nextYear,
    });

    // 4. CREATE A SUBSCRIPTION RECORD (New Schema)
    console.log("💳 Creating Subscription Record...");
    await CommunitySubscription.create({
      communityId: community._id,
      transactionId: "TXN_001",
      planName: "Standard",
      planType: "standard",
      amount: 12000,

      paymentMethod: "Card",
      paymentDate: today,

      planStartDate: today,
      planEndDate: nextYear,
      duration: "yearly",

      status: "completed",
      isRenewal: false,

      metadata: {
        userAgent: "dummy-agent",
        ipAddress: "127.0.0.1",
      },
    });

    // 5. MANAGER
    console.log("👨‍💼 Creating Manager...");
    await CommunityManager.create({
      name: "Ravi Kumar",
      email: "manager@urbanheights.com",
      contact: "9876543210",
      password: hashedPass,
      community: community._id,
    });

    // 6. RESIDENTS
    console.log("🏠 Creating Residents...");
    const residents = await Resident.insertMany([
      {
        residentFirstname: "Sathvik",
        residentLastname: "Chiluka",
        uCode: "BLK1-101",
        email: "sathvik@example.com",
        password: hashedPass,
        contact: "9988776655",
        community: community._id,
      },
      {
        residentFirstname: "Priya",
        residentLastname: "Sharma",
        uCode: "BLK2-202",
        email: "priya@example.com",
        password: hashedPass,
        contact: "9988776644",
        community: community._id,
      },
    ]);

    // 7. SECURITY
    console.log("👮 Creating Security...");
    const securityGuards = await Security.insertMany([
      {
        name: "Arun Singh",
        email: "arun.security@urban.com",
        password: hashedPass,
        contact: "8877665544",
        address: "Plot 4, Near Metro Stn, Hyd",
        Shift: "Day",
        community: community._id,
      },
      {
        name: "Deepak Verma",
        email: "deepak.security@urban.com",
        password: hashedPass,
        contact: "8877665533",
        address: "Plot 9, Old City, Hyd",
        Shift: "Night",
        community: community._id,
      },
    ]);

    // 8. WORKERS
    console.log("🛠️ Creating Workers...");
    await Worker.insertMany([
      {
        name: "Kiran The Electrician",
        email: "kiran@worker.com",
        password: hashedPass,
        jobRole: "Electrician",
        salary: 15000,
        contact: "7766554433",
        address: "Labor Colony, Hyd",
        community: community._id,
        communityAssigned: community._id,
      },
      {
        name: "Sunil The Plumber",
        email: "sunil@worker.com",
        password: hashedPass,
        jobRole: "Plumber",
        salary: 14000,
        contact: "7766554422",
        address: "Labor Colony, Hyd",
        community: community._id,
        communityAssigned: community._id,
      },
    ]);

    // 9. VISITORS
    console.log("👋 Creating Visitors...");
    await Visitor.insertMany([
      {
        name: "Zomato Delivery",
        contactNumber: "6655443322",
        purpose: "Food Delivery",
        status: "Pending",
        community: community._id,
        approvedBy: residents[0]._id,
      },
      {
        name: "Guest: Rahul",
        contactNumber: "6655443311",
        purpose: "Family Visit",
        status: "CheckedOut",
        community: community._id,
        approvedBy: residents[1]._id,
        addedBy: securityGuards[0]._id,
        checkInAt: today,
        checkOutAt: today,
      },
    ]);

    console.log("🎉 DATA INSERTION COMPLETE!");
    console.log("-----------------------------------");
    console.log("🔑 Password for all users: 123456");
    console.log(`🏠 Residents created: ${residents.length}`);
    console.log(`👮 Security created: ${securityGuards.length}`);
    console.log("-----------------------------------");

  } catch (error) {
    console.error("❌ Error inserting data:");
    if (error.errors) {
      for (const key in error.errors) {
        console.error(
          `-> Field: ${key}, Message: ${error.errors[key].message}`
        );
      }
    } else {
      console.error(error);
    }
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB Atlas");
  }
}

insertSampleData();
