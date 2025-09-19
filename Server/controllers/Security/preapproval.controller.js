import Visitor from "../../models/visitors.js";

/**
 * GET /security/preApproval
 */
export const getPreApprovals = async (req, res) => {
  try {
    const preApprovals = await Visitor.find({
      community: req.user.community,
    }).populate("approvedBy");

    return res.json({
      success: true,
      preApprovalList: preApprovals,
    });
  } catch (err) {
    console.error("PreApproval fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load pre-approvals",
    });
  }
};

/**
 * POST /security/preApproval/action
 */
export const updatePreApprovalStatus = async (req, res) => {
  try {
    const { ID, status } = req.body;

    const visitor = await Visitor.findById(ID).populate("approvedBy");

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Visitor not found",
      });
    }

    visitor.status = status;
    visitor.isCheckedIn = false;

    // if (visitor.approvedBy) {
    //   visitor.approvedBy.notifications.push({
    //     n: `Pre-approved visitor ${visitor.ID} is ${status}`,
    //     createdAt: new Date(),
    //     belongs: "PA",
    //   });
    //   await visitor.approvedBy.save();
    // }

    await visitor.save();

    return res.json({
      success: true,
      message: `Visitor ${status} successfully`,
    });
  } catch (err) {
    console.error("PreApproval update error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


/**
 * POST /security/verify-qr
 */
export const verifyQr = async (req, res) => {
  try {
    const { token } = req.body;

    const visitor = await Visitor.findOne({ qrToken: token }).populate(
      "approvedBy"
    );

    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: "Invalid QR token",
      });
    }

    if (!visitor.isCheckedIn) {
      visitor.isCheckedIn = true;
      visitor.checkInAt = new Date();
      visitor.status = "Active";
    } else {
      visitor.isCheckedIn = false;
      visitor.checkOutAt = new Date();
      visitor.status = "CheckedOut";
    }

    visitor.approvedBy?.notifications.push({
      n: `Visitor ${visitor.ID} is now ${visitor.status}`,
      createdAt: new Date(),
      belongs: "PA",
    });

    await visitor.save();
    if (visitor.approvedBy) await visitor.approvedBy.save();

    return res.json({
      success: true,
      visitor: {
        _id: visitor._id,
        name: visitor.name,
        status: visitor.status,
        checkInAt: visitor.checkInAt,
        checkOutAt: visitor.checkOutAt,
        isCheckedIn: visitor.isCheckedIn,
      },
    });
  } catch (err) {
    console.error("QR verification error:", err);
    return res.status(500).json({
      success: false,
      message: "QR verification failed",
    });
  }
};
