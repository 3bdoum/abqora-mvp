const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { getJwtSecret } = require('../config/auth');

const protect = async (req, res, next) => {
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ message: 'غير مصرح' });
    }

    try {
        const decoded = jwt.verify(token, getJwtSecret());
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
            return res.status(401).json({ message: 'المستخدم غير موجود' });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: 'رمز غير صالح' });
    }
};

module.exports = protect;
