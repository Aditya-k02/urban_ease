import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import multer from "multer";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";

// SOCKET.IO NEW IMPORTS
import http from "http";
import { Server } from "socket.io";
import { setIO } from "./utils/socket.js";

// Logger
import logger from "./utils/logger.js";

import auth from "./controllers/auth.js";
import {
  authorizeR,
  authorizeS,
  authorizeW,
  authorizeC,
  authorizeA,
} from "./controllers/authorization.js";

import {
  AuthenticateC,
  AuthenticateR,
  AuthenticateS,
  AuthenticateW,
  AuthenticateA,
  VerifyA,
  VerifyC,
  VerifyR,
  VerifyS,
  VerifyW,
} from "./controllers/loginController.js";

import {
  sendLoginOtp,
  verifyOtp,
  resendOtp,
  sendTemporaryPassword,
} from "./utils/otp.js";

import bcrypt from "bcryptjs";

import AdminRouter from "./routes/adminRouter.js";
import residentRouter from "./routes/residentRouter.js";
import securityRouter from "./routes/securityRouter.js";
import workerRouter from "./routes/workerRouter.js";
import managerRouter from "./routes/managerRouter.js";
import interestRouter from "./routes/InterestRouter.js";
import Ad from "./models/Ad.js";
import { interestUploadRouter } from "./controllers/interestForm.js";
import { initializeDefaultPlans } from "./controllers/subscriptionPlanController.js";

import Resident from "./models/resident.js";
import Community from "./models/communities.js";

dotenv.config();

// --- Environment Variable Validation ---
const requiredEnvVars = [
  'JWT_SECRET',
  'MONGO_URI1',
  'EMAIL_USER',
  'EMAIL_PASS'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

// Validate JWT_SECRET strength
if (process.env.JWT_SECRET.length < 32) {
  logger.warn('JWT_SECRET should be at least 32 characters long for security');
}

logger.info('Environment variables validated successfully');

// --- DB Connection ---
mongoose
  .connect(process.env.MONGO_URI1)
  .then(() => {
    logger.info('✅ Database connected');
    // Initialize default subscription plans
    initializeDefaultPlans();
  })
  .catch((err) => {
    logger.error('❌ Database connection failed:', err);
    process.exit(1);
  });

const app = express();
const PORT = 3000;

// SOCKET SERVER CREATION
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// expose io to other modules (via utils/socket.js)
setIO(io);

// helper: extract JWT token from socket handshake (auth, cookies, or query)
function getTokenFromSocketHandshake(socket) {
  // Priority 1: auth object (sent via socket.io-client config)
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  // Priority 2: cookies (httpOnly cookie)
  const cookieHeader = socket.handshake.headers?.cookie;
  if (cookieHeader) {
    const tokenCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="));

    if (tokenCookie) {
      const token = tokenCookie.split("=")[1];
      if (token && token !== "undefined") return token;
    }
  }

  return null;
}

io.on("connection", (socket) => {
  console.log("🔥 Socket connected:", socket.id);

  try {
    const token = getTokenFromSocketHandshake(socket);
    console.log("🔍 Token extracted:", token ? "✅ Found" : "❌ Not found");

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified. Payload:", {
        id: payload.id,
        email: payload.email,
        userType: payload.userType,
        community: payload.community,
      });

      if (payload.userType === "CommunityManager" && payload.community) {
        const room = `community_${payload.community}`;
        socket.join(room);
        socket.data.communityId = payload.community;
        socket.data.userId = payload.id;
        socket.data.userType = payload.userType;

        console.log(`✅ Manager (${payload.id}) joined room: ${room}`);
      } else if (payload.userType === "Resident") {
        const room = `resident_${payload.id}`;
        socket.join(room);
        socket.data.userId = payload.id;
        socket.data.userType = payload.userType;

        if (payload.community) {
          socket.data.communityId = payload.community;
        }

        console.log(`✅ Resident (${payload.id}) joined room: ${room}`);
      } else if (payload.userType === "Worker") {
        const room = `worker_${payload.id}`;
        socket.join(room);
        socket.data.userId = payload.id;
        socket.data.userType = payload.userType;

        if (payload.community) {
          socket.data.communityId = payload.community;
        }

        console.log(`✅ Worker (${payload.id}) joined room: ${room}`);
      } else if (!payload.community) {
        console.log(`⚠️ No community ID found in token, skipping room join`);
      } else {
        console.log(
          `ℹ️ User type '${payload.userType}' does not have a room mapping`
        );
      }
    } else {
      console.warn("⚠️ No token provided in socket handshake");
    }
  } catch (err) {
    console.warn("❌ Socket auth failed:", err.message);
  }

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Security & Performance Middleware ---
// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to avoid breaking existing app
  crossOriginEmbedderPolicy: false
}));

// Compression for response optimization
app.use(compression());

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "Public")));

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// ROUTES
app.use("/admin", auth, authorizeA, AdminRouter);
app.use("/resident", auth, authorizeR, residentRouter);
app.use("/security", auth, authorizeS, securityRouter);
app.use("/worker", auth, authorizeW, workerRouter);
app.use("/manager", auth, authorizeC, managerRouter);

app.use("/interest", interestRouter);




app.use("/interest", interestUploadRouter);

// ---------------- RATE LIMITERS FOR AUTH ENDPOINTS ----------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`, { 
      path: req.path, 
      email: req.body?.email 
    });
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again after 15 minutes'
    });
  }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per window
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ---------------- PUBLIC RESIDENT REGISTRATION APIS ----------------

app.post("/resident-register/request-otp", otpLimiter, async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email)
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });

    const existing = await Resident.findOne({ email });
    if (existing && existing.password) {
      return res
        .status(409)
        .json({ success: false, message: "Account already exists" });
    }

    await sendLoginOtp(email);
    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("[REQ-OTP] Error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
});

app.post("/resident-register/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP required" });

    const isValid = await verifyOtp(email, otp);
    if (!isValid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid or expired OTP" });

    return res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("[VERIFY-OTP] Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/resident-register/complete", async (req, res) => {
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
    if (!community)
      return res
        .status(404)
        .json({ success: false, message: "Invalid community code" });

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
    } else {
      resident.residentFirstname = residentFirstname;
      resident.residentLastname = residentLastname;
      resident.uCode = uCode;
      resident.contact = contact;
      resident.community = community._id;
    }

    const tempPassword = Math.random().toString(36).slice(-10);
    const hashed = await bcrypt.hash(tempPassword, 12);
    resident.password = hashed;

    await resident.save();
    await sendTemporaryPassword(email, tempPassword);

    return res.json({
      success: true,
      message: "Resident registered. Temporary password emailed.",
      residentId: resident._id,
    });
  } catch (err) {
    console.error("Complete registration error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// --- Logout route for all users (clears auth cookie) ---
app.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    logger.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

// ---------------- ADMIN LOGIN ----------------

app.post("/AdminLogin", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await AuthenticateA(email, password, res);
    if (!result) {
      logger.logAuth('admin_login_failed', email, false, { ip: req.ip });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Update last login time
    const Admin = (await import('./models/admin.js')).default;
    await Admin.findByIdAndUpdate(result.user.id, { 
      lastLogin: new Date(),
      $inc: { failedLoginAttempts: -999 } // Reset failed attempts on successful login
    });

    res.cookie("token", result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    logger.logAuth('admin_login_success', email, true, { ip: req.ip });

    return res.json({
      success: true,
      user: result.user,
      token: result.token,
      redirect: "/admin/dashboard",
    });
  } catch (error) {
    logger.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ---------------- ADS FETCH ----------------

app.get("/ads", auth, async (req, res) => {
  try {
    const communityId = req.user?.community;
    if (!communityId)
      return res
        .status(400)
        .json({ success: false, message: "Community not found" });

    const ads = await Ad.find({
      community: communityId,
      status: "Active",
    })
      .select("_id title imagePath link status startDate endDate")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, ads });
  } catch (err) {
    console.error("Error fetching ads:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch ads" });
  }
});

// ---------------- USER LOGIN (2FA) ----------------

app.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password, userType } = req.body;

    let verified;
    if (userType === "Resident") verified = await VerifyR(email, password);
    else if (userType === "Security") verified = await VerifyS(email, password);
    else if (userType === "Worker") verified = await VerifyW(email, password);
    else if (userType === "communityManager")
      verified = await VerifyC(email, password);
    else if (userType === "Admin")
      verified = await VerifyA(email, password);
    else return res.status(400).json({ message: "Invalid user type" });

    if (!verified) {
      logger.logAuth(`${userType}_login_failed`, email, false, { ip: req.ip });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await sendLoginOtp(email);

    const tempToken = jwt.sign(
      { ...verified.userPayload, purpose: "2fa" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ requiresOtp: true, user: verified.userPayload, tempToken });
  } catch (err) {
    console.error("/login error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------------- OTP VERIFY ----------------

app.post("/verify-otp", async (req, res) => {
  try {
    const { otp, tempToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    if (payload.purpose !== "2fa")
      return res.status(400).json({ message: "Invalid token purpose" });

    const result = verifyOtp(payload.email, otp);
    if (!result.ok) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Determine subscription status for any user tied to a community
    let subscriptionStatus = "active";
    if (payload.community) {
      try {
        const community = await Community.findById(payload.community).select(
          "subscriptionStatus"
        );
        if (community && community.subscriptionStatus) {
          subscriptionStatus = community.subscriptionStatus;
        }
      } catch (e) {
        console.error("Error fetching community subscription status", e);
      }
    }

    const finalToken = jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        userType: payload.userType,
        community: payload.community ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", finalToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    return res.json({
      token: finalToken,
      user: {
        id: payload.id,
        email: payload.email,
        userType: payload.userType,
        community: payload.community ?? null,
        subscriptionStatus,
      },
    });
  } catch (err) {
    console.error("/verify-otp error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------------- RESEND OTP ----------------

app.post("/resend-otp", async (req, res) => {
  try {
    const { tempToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    if (payload.purpose !== "2fa")
      return res.status(400).json({ message: "Invalid token purpose" });

    await resendOtp(payload.email);
    return res.json({ success: true });
  } catch (err) {
    console.error("/resend-otp error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------------- AUTH CHECK ----------------

app.get("/api/auth/getUser", auth, async (req, res) => {
  const cookie = req.cookies.token;

  try {
    const data = jwt.verify(cookie, process.env.JWT_SECRET);

    // Fetch subscription status for any user associated with a community
    // Fetch subscription and structure status for any user associated with a community
    let subscriptionStatus = "active";
    let hasStructure = true; // Default to true for non-managers to avoid redirect loops

    if (data.community) {
      const community = await Community.findById(data.community).select(
        "subscriptionStatus hasStructure"
      );
      if (community) {
        if (community.subscriptionStatus) subscriptionStatus = community.subscriptionStatus;
        if (community.hasStructure !== undefined) hasStructure = community.hasStructure;
      }
    }

    return res.json({ user: { ...data, subscriptionStatus, hasStructure } });
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// ---------------- AD STATUS AUTO UPDATE ----------------

async function changeAdStatuses() {
  try {
    const ads = await Ad.find({});
    const now = new Date();

    for (let ad of ads) {
      let newStatus = ad.status;

      if (ad.startDate <= now && now <= ad.endDate) {
        newStatus = "Active";
      } else if (now < ad.startDate) {
        newStatus = "Pending";
      } else if (now > ad.endDate) {
        newStatus = "Expired";
      }

      if (ad.status !== newStatus) {
        ad.status = newStatus;
        await ad.save();

        // 🔥 REAL-TIME UPDATE
        io.emit("ads:update", {
          id: ad._id,
          status: newStatus,
        });
      }
    }
  } catch (err) {
    console.error("Error changing ad statuses:", err);
  }
}

setInterval(changeAdStatuses, 60 * 60 * 1000); // Every hour

// ---------------- START SERVER WITH SOCKET.IO ----------------

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
