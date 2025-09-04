const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

// User registration validation
const validateUserRegistration = [
    body('phone')
        .isMobilePhone()
        .withMessage('Valid phone number is required'),
    body('address')
        .isLength({ min: 5 })
        .withMessage('Address must be at least 5 characters long'),
    handleValidationErrors
];

// Job posting validation
const validateJobPosting = [
    body('title')
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),
    body('description')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),
    body('location')
        .isLength({ min: 5 })
        .withMessage('Valid location is required'),
    handleValidationErrors
];

// Freelancer profile validation
const validateFreelancerProfile = [
    body('bio')
        .isLength({ min: 20, max: 1000 })
        .withMessage('Bio must be between 20 and 1000 characters'),
    body('experience_years')
        .isInt({ min: 0 })
        .withMessage('Experience years must be a positive number'),
    body('hourly_rate_min')
        .isFloat({ min: 0 })
        .withMessage('Minimum hourly rate must be a positive number'),
    body('hourly_rate_max')
        .isFloat({ min: 0 })
        .withMessage('Maximum hourly rate must be a positive number'),
    handleValidationErrors
];

module.exports = {
    validateUserRegistration,
    validateJobPosting,
    validateFreelancerProfile,
    handleValidationErrors
};
