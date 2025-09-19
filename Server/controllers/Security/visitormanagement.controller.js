import visitor from "../../models/visitors.js";
import Ad from "../../models/Ad.js";

/**
 * GET /visitorManagement
 * Initial load (visitors + ads)
 */
export const getVisitorManagementPage = async (req, res) => {
  try {
    const visitors = await visitor.find({
      community: req.user.community,
      addedBy: req.user.id,
    });

    visitors.sort(
      (a, b) =>
        new Date(b.entryDate || b.createdAt) -
        new Date(a.entryDate || a.createdAt)
    );

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({
      success: true,
      visitors,
      ads,
    });
  } catch (err) {
    console.error("VisitorManagement error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error loading visitor data",
    });
  }
};

/**
 * GET /visitorManagement/api/visitors
 * Auto-refresh visitor list + stats
 */
export const getVisitorsApi = async (req, res) => {
  try {
    const visitors = await visitor.find({
      community: req.user.community,
      addedBy: req.user.id,
    });

    visitors.sort((a, b) => {
      const dateA = new Date(a.entryDate || a.createdAt);
      const dateB = new Date(b.entryDate || b.createdAt);
      return dateB - dateA;
    });

    const stats = {
      total: visitors.length,
      active: visitors.filter(v => v.status === "Active").length,
      checkedOut: visitors.filter(v => v.status === "CheckedOut").length,
      pending: visitors.filter(v => v.status === "Pending").length,
    };

    return res.json({
      success: true,
      visitors,
      stats,
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching visitor data",
    });
  }
};

/**
 * GET /visitorManagement/:action/:id
 * Check-in / Check-out visitor
 */
export const updateVisitorStatus = async (req, res) => {
  const { action, id } = req.params;

  try {
    const v = await visitor.findById(id);

    if (!v) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    if (action === "checked-in") {
      v.status = "Active";
      v.checkInAt = new Date();
      v.isCheckedIn = true;
    } else if (action === "checked-out") {
      v.status = "CheckedOut";
      v.checkOutAt = new Date();
      v.isCheckedIn = false;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await v.save();

    return res.status(200).json({
      success: true,
      message: "Visitor updated",
      visitor: v,
    });
  } catch (error) {
    console.error("Error updating visitor status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
    