const getJwtSecret = () => {
    if (process.env.JWT_SECRET) {
        return process.env.JWT_SECRET;
    }

    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET is required when NODE_ENV=production');
    }

    return 'secret123';
};

module.exports = { getJwtSecret };
