import Ad from "../../models/Ad.js";
import { sendError, sendSuccess } from "./helpers.js";

export const getAdvertisements = async (req, res) => {
    try {
        const communityId = req.user.community;
        const ads = await Ad.find({ community: communityId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            ads: ads.map((ad) => ({
                _id: ad._id,
                title: ad.title,
                startDate: ad.startDate.toISOString().split("T")[0],
                endDate: ad.endDate.toISOString().split("T")[0],
                link: ad.link,
                imagePath: ad.imagePath,
                status: ad.status,
                createdAt: ad.createdAt,
                updatedAt: ad.updatedAt,
            })),
        });
    } catch (error) {
        console.error("Error fetching advertisements:", error);
        return sendError(res, 500, "Failed to fetch advertisements", error);
    }
};

export const createAdvertisement = async (req, res) => {
    try {
        const { title, startDate, endDate, link } = req.body;

        if (!title || !startDate || !endDate) {
            return sendError(res, 400, "Title, start date, and end date are required");
        }

        if (!req.file || !req.file.path) {
            return sendError(res, 400, "Advertisement image is required");
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
            return sendError(res, 400, "Invalid start or end date format");
        }

        if (parsedStartDate >= parsedEndDate) {
            return sendError(res, 400, "Start date must be before end date");
        }

        const newAd = await Ad.create({
            title: title.trim(),
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            link: link || null,
            imagePath: req.file.path,
            community: req.user.community,
            status: "Active",
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        const formattedAd = {
            _id: newAd._id,
            title: newAd.title,
            startDate: newAd.startDate.toISOString().split("T")[0],
            endDate: newAd.endDate.toISOString().split("T")[0],
            link: newAd.link,
            imagePath: newAd.imagePath,
            status: newAd.status,
            createdAt: newAd.createdAt,
            updatedAt: newAd.updatedAt,
        };

        return sendSuccess(res, "Advertisement created successfully", { ad: formattedAd }, 201);
    } catch (error) {
        console.error("Error creating advertisement:", error);
        return sendError(res, 500, "Failed to create advertisement", error);
    }
};

export const updateAdvertisement = async (req, res) => {
    try {
        const adId = req.params.id;
        const { title, startDate, endDate, link } = req.body;

        if (!adId || !adId.match(/^[0-9a-fA-F]{24}$/)) {
            return sendError(res, 400, "Invalid advertisement ID format");
        }

        const ad = await Ad.findById(adId);
        if (!ad) {
            return sendError(res, 404, "Advertisement not found");
        }

        if (title) {
            if (title.trim().length === 0) {
                return sendError(res, 400, "Title cannot be empty");
            }
            ad.title = title.trim();
        }

        if (startDate && endDate) {
            const parsedStartDate = new Date(startDate);
            const parsedEndDate = new Date(endDate);

            if (Number.isNaN(parsedStartDate.getTime()) || Number.isNaN(parsedEndDate.getTime())) {
                return sendError(res, 400, "Invalid start or end date format");
            }

            if (parsedStartDate >= parsedEndDate) {
                return sendError(res, 400, "Start date must be before end date");
            }

            ad.startDate = parsedStartDate;
            ad.endDate = parsedEndDate;
        }

        if (link !== undefined) {
            ad.link = link || null;
        }

        if (req.file && req.file.path) {
            ad.imagePath = req.file.path;
        }

        ad.updatedAt = new Date();
        ad.updateStatus();
        await ad.save();

        const formattedAd = {
            _id: ad._id,
            title: ad.title,
            startDate: ad.startDate.toISOString().split("T")[0],
            endDate: ad.endDate.toISOString().split("T")[0],
            link: ad.link,
            imagePath: ad.imagePath,
            status: ad.status,
            createdAt: ad.createdAt,
            updatedAt: ad.updatedAt,
        };

        return sendSuccess(res, "Advertisement updated successfully", { ad: formattedAd });
    } catch (error) {
        console.error("Error updating advertisement:", error);
        return sendError(res, 500, "Failed to update advertisement", error);
    }
};

export const deleteAdvertisement = async (req, res) => {
    try {
        const adId = req.params.id;

        if (!adId || !adId.match(/^[0-9a-fA-F]{24}$/)) {
            return sendError(res, 400, "Invalid advertisement ID format");
        }

        const ad = await Ad.findById(adId);
        if (!ad) {
            return sendError(res, 404, "Advertisement not found");
        }

        const deletedAd = await Ad.findByIdAndDelete(adId);

        if (!deletedAd) {
            return sendError(res, 500, "Failed to delete advertisement");
        }

        return sendSuccess(res, "Advertisement deleted successfully", { deletedAdId: adId });
    } catch (error) {
        console.error("Error deleting advertisement:", error);
        return sendError(res, 500, "Failed to delete advertisement", error);
    }
};
