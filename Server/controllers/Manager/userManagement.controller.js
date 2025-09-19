import Resident from "../../models/resident.js";
import Worker from "../../models/workers.js";
import Security from "../../models/security.js";
import Ad from "../../models/Ad.js";
import bcrypt from "bcrypt";
import { sendPassword } from "../OTP.js";
import { sendError, sendSuccess } from "./helpers.js";

export const getUserManagement = async (req, res) => {
    const ads = await Ad.find({
        community: req.user.community,
        status: "Active",
    });

    const R = await Resident.find({ community: req.user.community });
    const W = await Worker.find({ community: req.user.community });
    const S = await Security.find({ community: req.user.community });

    res.json({ ads, R, W, S });
};

export const createResident = async (req, res) => {
    try {
        const { Rid, residentFirstname, residentLastname, email, uCode, contact } =
            req.body;

        if (Rid) {
            const r = await Resident.findById(Rid);
            if (!r) {
                return sendError(res, 404, `Resident with ID ${Rid} not found`);
            }

            r.residentFirstname = residentFirstname;
            r.residentLastname = residentLastname;
            r.email = email;
            r.uCode = uCode;
            r.contact = contact;

            await r.save();
            res.json({ success: true, resident: r, isUpdate: true });
        } else {
            const r = await Resident.create({
                residentFirstname,
                residentLastname,
                email,
                contact,
                uCode,
                community: req.user.community,
            });

            const password = await sendPassword({ email, userType: "Resident" });
            const hashedPassword = await bcrypt.hash(password, 10);
            r.password = hashedPassword;
            await r.save();

            res.json({ success: true, resident: r });
        }
    } catch (err) {
        console.error("Error in /userManagement/resident:", err);

        let flashMsg;
        if (err.name === "ValidationError") {
            flashMsg = Object.values(err.errors)
                .map((e) => e.message)
                .join(", ");
        } else if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
        } else {
            flashMsg = err.message || "Unexpected error occurred";
        }

        res.json({ success: false, message: flashMsg });
    }
};

export const getResident = async (req, res) => {
    const id = req.params.id;
    const r = await Resident.findById(id);
    res.status(200).json({ success: true, r });
};

export const deleteResident = async (req, res) => {
    const id = req.params.id;
    await Resident.deleteOne({ _id: id });
    res.status(200).json({ ok: true });
};

export const createSecurity = async (req, res) => {
    try {
        const {
            Sid,
            securityName,
            securityEmail,
            securityContact,
            securityAddress,
            securityShift,
            gate,
        } = req.body;

        if (Sid) {
            const s = await Security.findById(Sid);
            if (!s) {
                return sendError(res, 404, `Security staff with ID ${Sid} not found`);
            }

            s.name = securityName;
            s.email = securityEmail;
            s.contact = securityContact;
            s.address = securityAddress;
            s.shift = securityShift;
            s.workplace = gate;

            await s.save();
            res.json({ success: true, security: s, isUpdate: true });
        } else {
            const s = await Security.create({
                name: securityName,
                email: securityEmail,
                contact: securityContact,
                address: securityAddress,
                Shift: securityShift,
                workplace: gate,
                community: req.user.community,
            });

            const password = await sendPassword({
                email: securityEmail,
                userType: "Security",
            });
            const hashedPassword = await bcrypt.hash(password, 10);
            s.password = hashedPassword;
            await s.save();

            res.status(200).json({ success: true, security: s });
        }
    } catch (err) {
        console.error("Error in /userManagement/security:", err);

        let flashMsg;
        if (err.name === "ValidationError") {
            flashMsg = Object.values(err.errors)
                .map((e) => e.message)
                .join(", ");
        } else if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
        } else {
            flashMsg = err.message || "Unexpected error occurred";
        }
        res.status(400).json({ success: false, message: flashMsg });
    }
};

export const getSecurity = async (req, res) => {
    const id = req.params.id;
    const r = await Security.findById(id);
    res.status(200).json({ success: true, r });
};

export const deleteSecurity = async (req, res) => {
    const id = req.params.id;
    await Security.deleteOne({ _id: id });
    res.status(200).json({ ok: true });
};

export const createWorker = async (req, res) => {
    try {
        const {
            Wid,
            workerName,
            workerEmail,
            workerJobRole,
            workerContact,
            workerAddress,
            workerSalary,
        } = req.body;

        if (Wid) {
            const w = await Worker.findById(Wid);
            if (!w) {
                return sendError(res, 404, `Worker with ID ${Wid} not found`);
            }

            w.name = workerName;
            w.email = workerEmail;
            w.jobRole = workerJobRole;
            w.contact = workerContact;
            w.address = workerAddress;
            w.salary = workerSalary;
            await w.save();
            return res.json({ success: true, worker: w, isUpdate: true });
        } else {
            const w = await Worker.create({
                name: workerName,
                email: workerEmail,
                jobRole: workerJobRole,
                contact: workerContact,
                address: workerAddress,
                salary: workerSalary,
                community: req.user.community,
            });

            const password = await sendPassword({
                email: workerEmail,
                userType: "Worker",
            });

            const hashedPassword = await bcrypt.hash(password, 10);
            w.password = hashedPassword;
            await w.save();

            res.json({ success: true, worker: w });
        }
    } catch (err) {
        console.error("Error in /userManagement/worker:", err);

        let flashMsg;
        if (err.name === "ValidationError") {
            flashMsg = Object.values(err.errors)
                .map((e) => e.message)
                .join(", ");
        } else if (err.code === 11000) {
            const field = Object.keys(err.keyValue)[0];
            flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
        } else {
            flashMsg = err.message || "Unexpected error occurred";
        }

        res.status(400).json({ success: false, message: flashMsg });
    }
};

export const getWorker = async (req, res) => {
    const id = req.params.id;
    const r = await Worker.findById(id);
    res.status(200).json({ success: true, r });
};

export const deleteWorker = async (req, res) => {
    const id = req.params.id;
    await Worker.deleteOne({ _id: id });
    res.status(200).json({ ok: true });
};

export const getWorkers = async (req, res) => {
    try {
        const workers = await Worker.find({
            community: req.user.community,
            isActive: true
        }).select('name jobRole _id');
        res.json({ success: true, workers });
    } catch (error) {
        console.error("Error fetching workers:", error);
        return sendError(res, 500, "Server error", error);
    }
};
