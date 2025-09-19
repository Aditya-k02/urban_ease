import { body, param, validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Validation rules for community operations
 */
export const validateCommunity = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Community name must be between 3 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('location')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('Location must be between 5 and 200 characters')
    .escape(),
  body('contact')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Contact must be a valid 10-digit phone number'),
  handleValidationErrors
];

/**
 * Validation rules for user operations
 */
export const validateUser = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('contact')
    .optional()
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage('Contact must be a valid 10-digit phone number'),
  handleValidationErrors
];

/**
 * Validation rules for login
 */
export const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .trim()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidationErrors
];

/**
 * Validation rules for password change
 */
export const validatePasswordChange = [
  body('currentPassword')
    .trim()
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .trim()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*])/)
    .withMessage('Password must contain at least one uppercase, one lowercase, and one number or special character'),
  body('confirmPassword')
    .trim()
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match'),
  handleValidationErrors
];

/**
 * Validation rules for ObjectId parameters
 */
export const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

/**
 * Validation rules for application approval/rejection
 */
export const validateApplicationAction = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters')
    .escape(),
  handleValidationErrors
];

/**
 * Validation rules for issue creation
 */
export const validateIssue = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters')
    .escape(),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters')
    .escape(),
  body('category')
    .trim()
    .isIn(['Plumbing', 'Electrical', 'Maintenance', 'Security', 'Cleaning', 'Other'])
    .withMessage('Invalid category'),
  handleValidationErrors
];

/**
 * Sanitize text input to prevent XSS
 */
export const sanitizeTextInput = (text) => {
  if (typeof text !== 'string') return text;
  
  return text
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
};

export default {
  validateCommunity,
  validateUser,
  validateLogin,
  validatePasswordChange,
  validateObjectId,
  validateApplicationAction,
  validateIssue,
  sanitizeTextInput,
  handleValidationErrors
};
