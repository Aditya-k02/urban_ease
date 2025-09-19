import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import CommunityManager from '../models/cManager.js';
import Resident from '../models/resident.js';
import Security from '../models/security.js';
import Worker from '../models/workers.js';
import Admin from '../models/admin.js';

async function authenticateUser(model, email, password, res) {
    const user = await model.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const userType = model.modelName;

    const userPayload = {
        id: user._id,
        email: user.email,
        userType
    };

    if(userType === 'Resident' || userType === 'Security' || userType === 'Worker'){
        userPayload.community = user.community;
    }else if(userType === 'CommunityManager'){
        userPayload.community = user.assignedCommunity;
    }else{
        userPayload.community = null;
    }

    const token = jwt.sign(
        userPayload,
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );

    res.cookie('token', token, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax'
    });


    return {
        token,
        user: userPayload
    };
}

// New: Verify credentials only, without issuing token/cookie (for 2FA step 1)
async function verifyCredentials(model, email, password) {
    const user = await model.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const userType = model.modelName;

    const userPayload = {
        id: user._id,
        email: user.email,
        userType
    };

    if(userType === 'Resident' || userType === 'Security' || userType === 'Worker'){
        userPayload.community = user.community;
    }else if(userType === 'CommunityManager'){
        userPayload.community = user.assignedCommunity;
    }else{
        userPayload.community = null;
    }

    return { user, userPayload };
}
export async function AuthenticateR(email, password, res) {
    return authenticateUser(Resident, email, password, res);
}

export async function AuthenticateS(email, password, res) {
    return authenticateUser(Security, email, password, res);
}

export async function AuthenticateW(email, password, res) {
    return authenticateUser(Worker, email, password, res);
}

export async function AuthenticateA(email, password, res) {
    return authenticateUser(Admin, email, password, res);
}

export async function AuthenticateC(email, password, res) {
    return authenticateUser(CommunityManager, email, password, res);
}

// 2FA: per-role verify-only functions
export async function VerifyR(email, password) {
    return verifyCredentials(Resident, email, password);
}

export async function VerifyS(email, password) {
    return verifyCredentials(Security, email, password);
}

export async function VerifyW(email, password) {
    return verifyCredentials(Worker, email, password);
}

export async function VerifyA(email, password) {
    return verifyCredentials(Admin, email, password);
}

export async function VerifyC(email, password) {
    return verifyCredentials(CommunityManager, email, password);
}
