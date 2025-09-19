import CommunityManager from "../../models/cManager.js";
import Community from "../../models/communities.js";

export const getManagerCommunity = async (managerId) => {
    const manager = await CommunityManager.findById(managerId);
    if (!manager) {
        return { error: "Manager not found", manager: null, community: null };
    }

    const community = await Community.findById(manager.assignedCommunity);
    if (!community) {
        return { error: "Community not found", manager, community: null };
    }

    return { error: null, manager, community };
};

export const sendError = (res, statusCode, message, error = null) => {
    const response = {
        success: false,
        message,
    };

    if (error && process.env.NODE_ENV === "development") {
        response.error = error.message;
    }

    return res.status(statusCode).json(response);
};

export const sendSuccess = (res, message, data = null, statusCode = 200) => {
    const response = {
        success: true,
        message,
    };

    if (data) {
        Object.assign(response, data);
    }

    return res.status(statusCode).json(response);
};

export const handleNotFound = (res, resource = "Resource") => {
    return res.status(404).json({
        success: false,
        message: `${resource} not found`,
    });
};

export const validateFields = (fields, res) => {
    const missingFields = [];

    for (const [key, value] of Object.entries(fields)) {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
            missingFields.push(key);
        }
    }

    if (missingFields.length > 0) {
        res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}`,
        });
        return false;
    }

    return true;
};

export const checkAuth = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: No user authenticated",
        });
    }
    next();
};

export const checkSubscription = async (req, res, next) => {
    // Heuristic to detect API/XHR requests that expect JSON
    const wantsJSON = () => {
        const accept = req.get("Accept") || "";
        return (
            req.xhr ||
            accept.includes("application/json") ||
            req.path.startsWith("/api/") ||
            req.path.startsWith("/issue") // our issue endpoints are consumed by front-end via fetch
        );
    };

    try {
        // Skip check for payment-related routes and API endpoints
        if (
            req.path.startsWith("/payments") ||
            req.path.startsWith("/subscription") ||
            req.path.startsWith("/api/") ||
            req.path.startsWith("/issue") ||
            req.path === "/all-communities" ||
            req.path === "/residents" ||
            req.path === "/communities" ||
            req.path === "/currentcManager" ||
            req.path === "/community-details" ||
            req.path === "/subscription-status" ||
            req.path === "/subscription-payment" ||
            req.path === "/all-payments" ||
            req.path === "/new-community" ||
            req.path === "/create-with-payment" ||
            req.path === "/community/rotate-code"
        ) {
            return next();
        }

        // Get manager and community info
        const managerId = req.user?.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            if (wantsJSON()) {
                return res
                    .status(404)
                    .json({ success: false, message: "Community manager not found" });
            }
            return res
                .status(404)
                .render("error", { message: "Community manager not found" });
        }

        const community = await Community.findById(
            manager.assignedCommunity
        ).select("subscriptionStatus planEndDate");

        if (!community) {
            if (wantsJSON()) {
                return res
                    .status(404)
                    .json({ success: false, message: "Community not found" });
            }
            return res
                .status(404)
                .render("error", { message: "Community not found" });
        }

        // Check if subscription is active
        const now = new Date();
        const isExpired =
            community.planEndDate && new Date(community.planEndDate) < now;

        if (isExpired || community.subscriptionStatus !== "active") {
            // Store the original URL in session for redirecting back after payment
            req.session.returnTo = req.originalUrl;

            // Add a flash message
            req.flash(
                "warning",
                "Your subscription has expired or is inactive. Please complete the payment to continue."
            );

            if (wantsJSON()) {
                return res.status(402).json({
                    success: false,
                    code: "SUBSCRIPTION_REQUIRED",
                    message:
                        "Subscription inactive or expired. Please complete payment to continue.",
                    redirect: "/manager/payments",
                });
            }
            // Redirect to payment page for normal web requests
            return res.redirect("/manager/payments");
        }

        next();
    } catch (error) {
        console.error("Subscription check error:", error);
        if (wantsJSON()) {
            return res
                .status(500)
                .json({ success: false, message: "Error checking subscription status" });
        }
        res
            .status(500)
            .render("error", { message: "Error checking subscription status" });
    }
};
