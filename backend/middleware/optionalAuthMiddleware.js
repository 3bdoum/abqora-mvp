const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { getJwtSecret } = require('../config/auth');

const optionalAuth = async (req, res, next) => {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return next();

    try {
        const decoded = jwt.verify(header.slice(7), getJwtSecret());
        req.user = await User.findById(decoded.id).select('-password');
    } catch {
        req.user = null;
    }
    return next();
};

module.exports = optionalAuth;
