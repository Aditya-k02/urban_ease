import Community from "../../models/communities.js";
import CommunityManager from "../../models/cManager.js";
import { sendError, sendSuccess } from "./helpers.js";

export const updateBookingRules = async (req, res) => {
    try {
        if (req.body.rules === undefined) {
            return sendError(res, 400, "Booking rules are required");
        }

        const community = await Community.findById(req.user.community);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        const sanitizedRules = req.body.rules ? req.body.rules.trim() : "";
        community.bookingRules = sanitizedRules;
        community.updatedAt = new Date();

        await community.save();

        return sendSuccess(res, "Booking rules updated successfully", { rules: sanitizedRules });
    } catch (error) {
        console.error("Error updating booking rules:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};

export const getSpaces = async (req, res) => {
    try {
        const community = await Community.findById(req.user.community);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        return sendSuccess(res, "Spaces fetched successfully", {
            spaces: community.commonSpaces,
            totalSpaces: community.commonSpaces.length,
        });
    } catch (error) {
        console.error("Error fetching spaces:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};

export const rotateCommunityCode = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager || !manager.assignedCommunity) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(manager.assignedCommunity);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        const newCode = await community.forceRotateCode();

        return sendSuccess(res, "Community code rotated successfully", {
            communityCode: newCode,
            rotatedAt: community.communityCodeLastRotatedAt,
        });
    } catch (err) {
        console.error("Rotate community code error:", err);
        return sendError(res, 500, "Failed to rotate community code", err);
    }
};

export const getCommunityStructure = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager || !manager.assignedCommunity) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(manager.assignedCommunity).select('blocks hasStructure name');
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        // Transform blocks to frontend format (just the config, not the flats)
        const blocksConfig = (community.blocks || []).map(block => ({
            name: block.name,
            totalFloors: block.totalFloors,
            flatsPerFloor: block.flatsPerFloor
        }));

        return sendSuccess(res, "Community structure fetched successfully", {
            hasStructure: community.hasStructure,
            blocks: blocksConfig,
            totalBlocks: blocksConfig.length
        });
    } catch (err) {
        console.error("Get community structure error:", err);
        return sendError(res, 500, "Failed to fetch community structure", err);
    }
};

export const setupCommunityStructure = async (req, res) => {
    try {
        const { blocks } = req.body;
        console.log('📦 Setup structure called with blocks:', JSON.stringify(blocks, null, 2));

        if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
            console.log('❌ Invalid blocks configuration');
            return sendError(res, 400, "Invalid blocks configuration");
        }

        const managerId = req.user.id;
        console.log('👤 Manager ID:', managerId);
        const manager = await CommunityManager.findById(managerId);

        if (!manager || !manager.assignedCommunity) {
            console.log('❌ Manager or community not found');
            return sendError(res, 404, "Community not found");
        }

        console.log('🏘️ Community ID:', manager.assignedCommunity);
        const community = await Community.findById(manager.assignedCommunity);
        if (!community) {
            console.log('❌ Community document not found');
            return sendError(res, 404, "Community not found");
        }

        // Check if this is an update BEFORE modifying blocks
        const isUpdate = community.blocks && community.blocks.length > 0;
        console.log('🔄 Is update:', isUpdate, '(existing blocks:', community.blocks?.length || 0, ')');

        // Allow updates - no longer blocking if hasStructure is true
        const generatedBlocks = blocks.map(block => {
            const { name, totalFloors, flatsPerFloor } = block;
            const flats = [];

            for (let floor = 1; floor <= totalFloors; floor++) {
                for (let flat = 1; flat <= flatsPerFloor; flat++) {
                    let flatNumberSuffix = (floor * 100) + flat;
                    const flatNumber = `${name}-${flatNumberSuffix}`;

                    flats.push({
                        flatNumber,
                        floor,
                        status: "Vacant"
                    });
                }
            }

            return {
                name,
                totalFloors,
                flatsPerFloor,
                flats
            };
        });

        community.blocks = generatedBlocks;
        community.hasStructure = true;
        console.log('💾 Saving community with', generatedBlocks.length, 'blocks');
        await community.save();
        console.log('✅ Community saved successfully');

        const successMessage = isUpdate 
            ? "Community structure updated successfully!" 
            : "Community structure setup successfully!";

        console.log('📤 Sending success response:', successMessage);
        return sendSuccess(res, successMessage, {
            totalBlocks: generatedBlocks.length,
            redirect: "/manager/dashboard"
        });

    } catch (err) {
        console.error("Setup structure error:", err);
        return sendError(res, 500, "Server error during setup", err);
    }
};
