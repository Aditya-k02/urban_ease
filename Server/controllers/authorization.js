// Shared helper: respond with JSON for API calls, redirect for others
const handleForbidden = (req, res, redirectPath) => {
    if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
        return res.status(403).json({ message: "Forbidden" });
    }
    return res.redirect(redirectPath);
};

// Factory to build single-role authorizers (keeps existing behaviour)
const buildAuthorize = (requiredUserType, redirectPath) => {
    return (req, res, next) => {
        if (req.user?.userType !== requiredUserType) {
            return handleForbidden(req, res, redirectPath);
        }
        next();
    };
};

// Existing specific middlewares (backwards-compatible)
const authorizeR = buildAuthorize("Resident", "/login");
const authorizeS = buildAuthorize("Security", "/login");
const authorizeW = buildAuthorize("Worker", "/login");
const authorizeC = buildAuthorize("CommunityManager", "/login");
const authorizeA = buildAuthorize("admin", "/AdminLogin");

// New: generic role-based authorizer for specific routes
// Usage examples:
//   router.get('/api/admin-or-manager', auth, authorizeRoles(['admin', 'CommunityManager']), handler);
//   router.post('/api/admin-only', auth, authorizeRoles('admin', '/AdminLogin'), handler);
const authorizeRoles = (roles, redirectPath = "/login") => {
    const allowed = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        const userType = req.user?.userType;

        if (!userType || !allowed.includes(userType)) {
            return handleForbidden(req, res, redirectPath);
        }

        next();
    };
};

export { authorizeR, authorizeS, authorizeW, authorizeC, authorizeA, authorizeRoles };