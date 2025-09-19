import express from "express";
import Issue from "../models/issues.js";
const workerRouter = express.Router();
import Ad from "../models/Ad.js";
import Worker from "../models/workers.js";
import checkSubscriptionStatus from "../middleware/subcriptionStatus.js";

import multer from "multer";
import bcrypt from "bcrypt";
import { noop } from "chart.js/helpers";
import cloudinary from "../configs/cloudinary.js";

// Multer memory storage for worker profile images (Cloudinary in handler)
const upload = multer({ storage: multer.memoryStorage() });

// Block access for workers when community subscription is inactive/expired
workerRouter.use(checkSubscriptionStatus);

workerRouter.get("/getDashboardData", async (req, res) => {

  try {
    const t = await Worker.findById(req.user.id);
    console.log(req.user.id);

    const Issues = await Issue.find({ workerAssigned: req.user.id })

    const ads = await Ad.find({ community: req.user.community, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

    console.log(Issues);

    return res.json({ success: true, worker: t, issues: Issues, ads })
  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" })
  }

});


workerRouter.get("/history", async (req, res) => {
  try {
    const issues = await Issue.find({
      workerAssigned: req.user.id,
      status: { $nin: ["Assigned", "Pending"] },
    })
      .populate("workerAssigned")
      .populate("resident");

    console.log("Worker history issues:", issues.length);

    return res.json({ success: true, issues });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while fetching history" });
  }
});


// JSON API endpoint for worker's active tasks (Assigned, In Progress, Reopened)
workerRouter.get("/api/tasks", getWorkerTasks);

import {startIssue,resolveIssue,misassignedIssue,getWorkerTasks}from "../controllers/issueController.js";

workerRouter.post("/issue/start/:id", startIssue);
workerRouter.post("/issue/resolve/:id", resolveIssue);
workerRouter.post("/issue/misassigned/:id", misassignedIssue);

workerRouter.get("/profile", async (req, res) => {
 const ads = await Ad.find({ community: req.user.community,startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });

    const r = await Worker.findById(req.user.id);
  
  try {
    return res.json({ success: true, worker: r, ads: ads })
  } catch (err) {
    console.log(err);
    return res.json({ success: false, message: "Server error" });
  }
});

workerRouter.post("/profile", upload.single("image"), async (req, res) => {
  const { name, email, contact, address } = req.body;

  console.log("Got data in backend for profile");


  const r = await Worker.findById(req.user.id);
  
  let image = r.image;

  if (req.file && req.file.buffer) {
    try {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: "profiles/worker",
            resource_type: "image",
            transformation: [
              { width: 512, height: 512, crop: "limit" },
              { quality: "auto:good" },
            ],
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );

        uploadStream.end(req.file.buffer);
      });

      image = result.secure_url;
      r.imagePublicId = result.public_id;
    } catch (err) {
      console.error("Worker profile image upload error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile image.",
      });
    }
  }

  r.name = name;
  r.email = email;
  r.contact = contact;
  r.address = address;

  if (image) {
    r.image = image;
    console.log(image);
    await r.save();
  }

  await r.save();

  return res.json({ success: true, message: "Profile updated successfully", r });
});

workerRouter.post("/change-password", async (req, res) => {
  const { cp, np } = req.body;
  const security = await Worker.findById(req.user.id);

  if (!security) {
    return res.json({ success: false, message: "Security not found." });
  }

  const isMatch = await bcrypt.compare(cp, security.password);
  if (!isMatch) {
    return res.json({
      success: false,
      message: "Current password does not match.",
    });
  }

  const salt = await bcrypt.genSalt(10);
  security.password = await bcrypt.hash(np, salt);
  await security.save();

  res.json({ success: true, message: "Password changed successfully." });
});

export default workerRouter;
