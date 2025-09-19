import Resident from "../../models/resident.js";
import Worker from "../../models/workers.js";
import Issue from "../../models/issues.js";
import CommonSpaces from "../../models/commonSpaces.js";
import Payment from "../../models/payment.js";
import visitor from "../../models/visitors.js";
import Ad from "../../models/Ad.js";
import CommunityManager from "../../models/cManager.js";
import { sendError } from "./helpers.js";

export const getDashboardData = async (req, res) => {
    try {
        const communityId = req.user.community;

        // Fetch all required data in parallel for better performance
        const [
            residents,
            workers,
            issues,
            commonSpacesBookings,
            payments,
            visitors,
            advertisements,
        ] = await Promise.all([
            Resident.find({ community: communityId }).populate("notifications").lean(),
            Worker.find({ community: communityId }).lean(),
            Issue.find({ community: communityId })
                .populate("resident", "residentFirstname residentLastname email")
                .lean(),
            CommonSpaces.find({ community: communityId })
                .populate("bookedBy", "residentFirstname residentLastname email")
                .lean(),
            Payment.find({ community: communityId }).lean(),
            visitor.find({ community: communityId }).lean(),
            Ad.find({ community: communityId })
                .select("title status startDate endDate")
                .lean(),
        ]);

        const notifications = await CommunityManager.findById(req.user.id).populate("notifications").lean();

        // Calculate statistics
        const totalResidents = residents.length;
        const totalWorkers = workers.length;
        const totalAdvisitorsCount = visitors.length;
        const totalActiveBookings = commonSpacesBookings.length;
        const totalPayments = payments.length;

        // Calculate payment statistics
        const paidPayments = payments.filter(
            (p) => p.status === "Completed"
        ).length;
        const pendingPayments = payments.filter(
            (p) => p.status === "Pending"
        ).length;
        const overduePayments = payments.filter(
            (p) => p.status === "Overdue"
        ).length;

        // Calculate payment amounts
        const paidAmount = payments
            .filter((p) => p.status === "Completed")
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        const pendingAmount = payments
            .filter((p) => p.status === "Pending")
            .reduce((sum, p) => sum + (p.amount || 0), 0);
        const overdueAmount = payments
            .filter((p) => p.status === "Overdue")
            .reduce((sum, p) => sum + (p.amount || 0), 0);

        // Calculate issue statistics
        const pendingIssues = issues.filter(
            (issue) => issue.status === "Pending" || issue.status === "Assigned"
        ).length;
        const resolvedIssues = issues.filter(
            (issue) => issue.status === "Resolved"
        ).length;
        const urgentIssues = issues.filter(
            (issue) => issue.priority === "High" && issue.status !== "Resolved"
        ).length;

        // Get recent issues (last 5)
        const recentIssues = [...issues]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map((issue) => ({
                _id: issue._id,
                title: issue.title || "No Title",
                status: issue.status,
                priority: issue.priority,
                resident: issue.resident
                    ? `${issue.resident.residentFirstname} ${issue.resident.residentLastname}`
                    : "Unknown",
                createdAt: issue.createdAt,
            }));

        // Get recent bookings (last 5)
        const recentBookings = [...commonSpacesBookings]
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5)
            .map((booking) => ({
                _id: booking._id,
                name: booking.name || "No Name",
                status: booking.status,
                date: booking.Date,
                bookedBy: booking.bookedBy
                    ? `${booking.bookedBy.residentFirstname} ${booking.bookedBy.residentLastname}`
                    : "Unknown",
                createdAt: booking.createdAt,
            }));

        // Get revenue data for charts
        const revenueData = [
            { name: "Paid", value: paidAmount, count: paidPayments },
            { name: "Pending", value: pendingAmount, count: pendingPayments },
            { name: "Overdue", value: overdueAmount, count: overduePayments },
        ];

        // Calculate ad statistics
        const now = new Date();
        const activeAds = advertisements.filter((ad) => {
            const startDate = new Date(ad.startDate);
            const endDate = new Date(ad.endDate);
            return startDate <= now && now <= endDate;
        }).length;

        const pendingAds = advertisements.filter((ad) => {
            const startDate = new Date(ad.startDate);
            return startDate > now;
        }).length;

        const expiredAds = advertisements.filter((ad) => {
            const endDate = new Date(ad.endDate);
            return endDate < now;
        }).length;

        // Prepare response
        res.status(200).json({
            success: true,
            data: {
                notifications: notifications?.notifications || [],
                summary: {
                    totalResidents,
                    totalWorkers,
                    totalVisitors: totalAdvisitorsCount,
                    totalActiveBookings,
                },
                issues: {
                    pending: pendingIssues,
                    resolved: resolvedIssues,
                    urgent: urgentIssues,
                    recent: recentIssues,
                },
                bookings: {
                    total: totalActiveBookings,
                    pending: commonSpacesBookings.filter((b) => b.status === "Pending")
                        .length,
                    approved: commonSpacesBookings.filter((b) => b.status === "Approved")
                        .length,
                    recent: recentBookings,
                },
                payments: {
                    total: totalPayments,
                    paid: paidPayments,
                    pending: pendingPayments,
                    overdue: overduePayments,
                    revenueData,
                    amounts: {
                        paid: paidAmount,
                        pending: pendingAmount,
                        overdue: overdueAmount,
                    },
                },
                advertisements: {
                    active: activeAds,
                    pending: pendingAds,
                    expired: expiredAds,
                    total: advertisements.length,
                },
                visitors: {
                    today: totalAdvisitorsCount,
                },
            },
            message: "Dashboard data fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return sendError(res, 500, "Failed to fetch dashboard data", error);
    }
};
