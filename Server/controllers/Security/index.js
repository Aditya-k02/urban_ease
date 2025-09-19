// controllers/security/index.js
export {getProfile, changePassword, updateProfile} from "./profile.controller.js";
// Visitor management
export {updateVisitorStatus, getVisitorsApi, getVisitorManagementPage} from "./visitormanagement.controller.js"
// pre-approval
export {getPreApprovals, updatePreApprovalStatus, verifyQr} from "./preapproval.controller.js";