const jwt = require('jsonwebtoken');
const User = require('../models/User'); // To fetch user details from DB if needed

const protect = async (req, res, next) => {
    let token;

    // Check if token exists in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (e.g., "Bearer TOKEN")
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Attach user to the request object (without password)
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] } // Exclude password from the user object
            });

            if (!req.user) {
                return res.status(401).json({ msg: 'Not authorized, user not found' });
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error(error);
            res.status(401).json({ msg: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ msg: 'Not authorized, no token' });
    }
};

const authorizeBusinessOwner = (req, res, next) => {
    if (!req.user || !req.user.isBusinessOwner) {
        return res.status(403).json({ msg: 'Not authorized as a business owner' });
    }
    next();
};

module.exports = { protect, authorizeBusinessOwner };