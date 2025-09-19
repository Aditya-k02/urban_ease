import logger from '../utils/logger.js';

/**
 * RBAC Permission Matrix
 * Define what each role can do
 */
export const PERMISSIONS = {
  'super-admin': ['*'], // All permissions
  
  'admin': [
    // Read permissions
    'read:communities',
    'read:users',
    'read:applications',
    'read:payments',
    'read:issues',
    'read:analytics',
    
    // Write permissions
    'write:communities',
    'write:users',
    'write:applications',
    'write:issues',
    
    // Delete permissions (non-critical)
    'delete:users',
    'delete:issues',
    
    // Cannot delete communities (critical operation)
  ],
  
  'support': [
    // Read-only access to most resources
    'read:communities',
    'read:users',
    'read:applications',
    'read:issues',
    
    // Can manage issues and applications
    'write:issues',
    'write:applications',
  ]
};

/**
 * Check if a user role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} - Whether role has permission
 */
export function hasPermission(role, permission) {
  const rolePermissions = PERMISSIONS[role] || [];
  
  // Super admin has all permissions
  if (rolePermissions.includes('*')) {
    return true;
  }
  
  // Check for exact permission match
  if (rolePermissions.includes(permission)) {
    return true;
  }
  
  // Check for wildcard permission (e.g., 'read:*' matches 'read:communities')
  const [action, resource] = permission.split(':');
  const wildcardPermission = `${action}:*`;
  if (rolePermissions.includes(wildcardPermission)) {
    return true;
  }
  
  return false;
}

/**
 * Express middleware to require specific permission
 * @param {string} permission - Required permission
 * @returns {Function} Express middleware
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'admin'; // Default to 'admin' for backward compatibility
    
    if (!hasPermission(userRole, permission)) {
      logger.warn(`Permission denied: ${userRole} attempted ${permission}`, {
        userId: req.user?.id,
        email: req.user?.email,
        ip: req.ip
      });
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permission,
        userRole
      });
    }
    
    next();
  };
}

/**
 * Express middleware to require one of multiple permissions
 * @param {string[]} permissions - Array of acceptable permissions
 * @returns {Function} Express middleware
 */
export function requireAnyPermission(permissions) {
  return (req, res, next) => {
    const userRole = req.user?.role || 'admin';
    
    const hasAnyPermission = permissions.some(permission => 
      hasPermission(userRole, permission)
    );
    
    if (!hasAnyPermission) {
      logger.warn(`Permission denied: ${userRole} attempted one of [${permissions.join(', ')}]`, {
        userId: req.user?.id,
        email: req.user?.email,
        ip: req.ip
      });
      
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        required: permissions,
        userRole
      });
    }
    
    next();
  };
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permissions
 */
export function getRolePermissions(role) {
  return PERMISSIONS[role] || [];
}

/**
 * Check if role can perform action on resource type
 * @param {string} role - User role
 * @param {string} action - Action (read, write, delete)
 * @param {string} resourceType - Resource type (communities, users, etc.)
 * @returns {boolean}
 */
export function canPerformAction(role, action, resourceType) {
  const permission = `${action}:${resourceType}`;
  return hasPermission(role, permission);
}

export default {
  PERMISSIONS,
  hasPermission,
  requirePermission,
  requireAnyPermission,
  getRolePermissions,
  canPerformAction
};
