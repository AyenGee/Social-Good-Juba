const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Verify Google token
const verifyGoogleToken = async (token) => {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        return { payload: ticket.getPayload(), success: true };
    } catch (error) {
        return { error: 'Invalid token', success: false };
    }
};

// Generate JWT token
const generateToken = (user) => {
    return jwt.sign(
        { 
            id: user.id, 
            email: user.email, 
            role: user.role,
            admin_status: user.admin_status
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Verify JWT token middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
    if (!req.user.admin_status) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

module.exports = {
    verifyGoogleToken,
    generateToken,
    authenticateToken,
    requireAdmin
};
