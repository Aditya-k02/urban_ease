// Example controller showing how to use the Community CRUD service

import {
  createCommunity,
  getCommunityById,
  listCommunities,
  updateCommunityById,
  aggregateCommunities,
  countCommunities,
  updateManyCommunities,
} from '../crud/communityCrudService.js';
import { listCommunityManagers } from '../crud/cManagerCrudService.js';
import { deleteCommunityCascade } from "../utils/communityCascadeDelete.js";

// POST /api/communities
export const createCommunityController = async (req, res) => {
  try {
    const community = await createCommunity(req.body);
    res.status(201).json({ success: true, community });
  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/communities
export const listCommunitiesController = async (req, res) => {
  try {
    const communities = await listCommunities({});
    res.json({ success: true, communities });
  } catch (error) {
    console.error('Error listing communities:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// GET /api/communities/:id
export const getCommunityController = async (req, res) => {
  try {
    const community = await getCommunityById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.json({ success: true, community });
  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// PUT /api/communities/:id
export const updateCommunityController = async (req, res) => {
  try {
    const community = await updateCommunityById(req.params.id, req.body);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    res.json({ success: true, community });
  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// DELETE /api/communities/:id
/**
 * BROWSER CONSOLE DELETE EXAMPLE:
 * 
 * // Step 1: Get your admin token (after logging in as admin)
 * const token = localStorage.getItem('adminToken');
 * 
 * // Step 2: Delete community (replace COMMUNITY_ID)
 * fetch('http://localhost:5000/api/communities/COMMUNITY_ID', {
 *   method: 'DELETE',
 *   headers: {
 *     'Authorization': `Bearer ${token}`,
 *     'Content-Type': 'application/json'
 *   }
 * })
 * .then(response => response.json())
 * .then(data => {
 *   console.log('✅ Deletion complete!');
 *   console.log('Deleted counts:', data.deleted);
 * })
 * .catch(err => console.error('❌ Error:', err));
 */
export const deleteCommunityController = async (req, res) => {
  try {
    const community = await getCommunityById(req.params.id);
    if (!community) {
      return res.status(404).json({ success: false, message: 'Community not found' });
    }
    const result = await deleteCommunityCascade(req.params.id);
    res.json({
      success: true,
      message: 'Community deleted successfully',
      deleted: result.deletedCounts,
    });
  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all communities with populate
export const getAllCommunities = async (req, res) => {
  try {
    const communities = await listCommunities({}, null, {
      populate: [{ path: "communityManager", select: "name email" }],
      sort: { createdAt: -1 }
    });
    res.json({ success: true, communities });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Get single community with populate
export const getSingleCommunity = async (req, res) => {
  try {
    const community = await getCommunityById(req.params.id, null, {
      populate: [{ path: "communityManager", select: "name email" }]
    });
    if (!community)
      return res.status(404).json({ success: false, error: "Community not found" });
    res.json({ success: true, community });
  } catch (error) {
    console.error("Error fetching community:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Create community with populate
export const createNewCommunity = async (req, res) => {
  try {
    const { name, location, description, communityManager, subscriptionStatus } = req.body;
    if (!name || !location)
      return res.status(400).json({ success: false, error: "Name and location are required" });

    const newCommunity = await createCommunity({
      name,
      location,
      description,
      communityManager: communityManager || null,
      subscriptionStatus: subscriptionStatus || "pending",
      totalMembers: 0,
    });

    const populatedCommunity = await getCommunityById(newCommunity._id, null, {
      populate: [{ path: "communityManager", select: "name email" }]
    });

    res.status(201).json({
      success: true,
      message: "Community created successfully",
      community: populatedCommunity,
    });
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Update community with populate
export const updateCommunity = async (req, res) => {
  try {
    const { name, location, description, communityManager, subscriptionStatus } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (location) updates.location = location;
    if (description !== undefined) updates.description = description;
    if (communityManager !== undefined) updates.communityManager = communityManager || null;
    if (subscriptionStatus) updates.subscriptionStatus = subscriptionStatus;

    const community = await updateCommunityById(req.params.id, updates, {
      populate: [{ path: "communityManager", select: "name email" }]
    });

    if (!community)
      return res.status(404).json({ success: false, error: "Community not found" });

    res.json({ success: true, message: "Community updated successfully", community });
  } catch (error) {
    console.error("Error updating community:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Delete community with check
export const deleteCommunity = async (req, res) => {
  try {
    const community = await getCommunityById(req.params.id);
    if (!community)
      return res.status(404).json({ success: false, error: "Community not found" });
    const result = await deleteCommunityCascade(req.params.id);
    res.json({
      success: true,
      message: "Community deleted successfully",
      deleted: result.deletedCounts,
    });
  } catch (error) {
    console.error("Error deleting community:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Get managers list
export const getManagersList = async (req, res) => {
  try {
    const managers = await listCommunityManagers({}, "name email", {
      sort: { name: 1 },
    });
    res.json({ success: true, managers });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Stats overview
export const getCommunityStats = async (req, res) => {
  try {
    const totalCommunities = await countCommunities();
    const activeCommunities = await countCommunities({
      subscriptionStatus: { $regex: /^active$/i },
    });
    const pendingCommunities = await countCommunities({
      subscriptionStatus: { $regex: /^pending$/i },
    });

    const topLocations = await aggregateCommunities([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const recentCommunities = await listCommunities({}, null, {
      sort: { createdAt: -1 },
      limit: 5,
      populate: [{ path: "communityManager", select: "name email" }]
    });

    res.json({
      success: true,
      stats: {
        totalCommunities,
        activeCommunities,
        pendingCommunities,
        topLocations,
        recentCommunities,
      },
    });
  } catch (error) {
    console.error("Error fetching community stats:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Bulk update status
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { communityIds, status } = req.body;
    if (!communityIds?.length)
      return res.status(400).json({ success: false, error: "Community IDs required" });

    if (!["active", "pending"].includes(status?.toLowerCase()))
      return res.status(400).json({ success: false, error: "Invalid status value" });

    const result = await updateManyCommunities(
      { _id: { $in: communityIds } },
      { $set: { subscriptionStatus: status } }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} communities`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error bulk updating:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
