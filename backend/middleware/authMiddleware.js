// backend/middleware/authMiddleware.js 
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const Clerk = require('../models/clerkModel');

// In-memory rate limiting map (per-process)
const rateLimit = new Map();

/**
 * Auth protection middleware
 * - Verifies JWT (header or cookie)
 * - Applies basic IP-based rate limiting
 * - Loads Clerk document and checks status
 */
const protect = asyncHandler(async (req, res, next) => {
  try {
    // -----------------------------
    // Rate limiting (per IP)
    // -----------------------------
    const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 100;

    if (rateLimit.has(clientIp)) {
      const attempts = rateLimit.get(clientIp);
      if (attempts.count >= maxAttempts && attempts.resetTime > now) {
        return res.status(429).json({
          success: false,
          message: 'Too many requests. Please try again later.',
        });
      }

      // Window expired => reset counter
      if (attempts.resetTime <= now) {
        rateLimit.delete(clientIp);
      }
    }

    // -----------------------------
    // Extract token
    // -----------------------------
    let token;

    // Priority: Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Optional: cookie fallback
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      incrementRateLimit(clientIp, windowMs);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, no token',
      });
    }

    // -----------------------------
    // Verify token
    // -----------------------------
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      incrementRateLimit(clientIp, windowMs);

      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired. Please login again.',
          code: 'TOKEN_EXPIRED',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized',
        code: 'AUTH_ERROR',
      });
    }

    // -----------------------------
    // Load Clerk from DB
    // -----------------------------
    const clerk = await Clerk.findById(decoded.id)
      .select('-password -clerkSecret -refreshTokens')
      .populate('createdBy', 'email name');

    if (!clerk) {
      incrementRateLimit(clientIp, windowMs);
      return res.status(401).json({
        success: false,
        message: 'Clerk not found',
      });
    }

    // -----------------------------
    // Account status checks
    // -----------------------------
    if (clerk.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact administrator.',
        code: 'ACCOUNT_DEACTIVATED',
      });
    }


    if (typeof clerk.isLocked === 'function' && clerk.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed attempts',
        code: 'ACCOUNT_LOCKED',
      });
    }

    // -----------------------------
    // Attach to req and continue
    // -----------------------------
    req.clerk = clerk;
    req.token = token;

    // Successful auth → reset rate limit for this IP
    rateLimit.delete(clientIp);

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// ----------------------------------------
// Role-based authorization
// ----------------------------------------
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.clerk) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.clerk.role)) {
      return res.status(403).json({
        success: false,
        message: `Insufficient permissions. Required roles: ${roles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
      });
    }

    next();
  };
};

// ----------------------------------------
// Permission-based authorization
// ----------------------------------------
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.clerk) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    // Admins / super admins bypass permission checks
    if (req.clerk.role === 'admin' || req.clerk.isSuperAdmin) {
      return next();
    }

    if (!Array.isArray(req.clerk.permissions) || !req.clerk.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `Permission denied. Required: ${permission}`,
        code: 'PERMISSION_DENIED',
      });
    }

    next();
  };
};

// ----------------------------------------
// Helper: increment rate limit
// ----------------------------------------
function incrementRateLimit(clientIp, windowMs) {
  if (!rateLimit.has(clientIp)) {
    rateLimit.set(clientIp, {
      count: 1,
      resetTime: Date.now() + windowMs,
    });
  } else {
    const attempts = rateLimit.get(clientIp);
    attempts.count += 1;
  }
}

module.exports = {
  protect,
  requireRole,
  requirePermission,
};
