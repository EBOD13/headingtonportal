const jwt = require("jsonwebtoken");
const asyncHandler = require('express-async-handler');
const Clerk = require('../models/clerkModel');

const protect = asyncHandler(async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.clerk = await Clerk.findById(decoded.id).select('-password');
            if (!req.clerk) {
                throw new Error("Clerk not found");
            }
            next();
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error("You are not authorized");
        }
    } else {
        res.status(401);
        throw new Error("Not authorized, no token");
    }
});

module.exports = { protect };
