const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'; // Token expires in 7 days

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'your_jwt_secret_key_change_in_production') {
  throw new Error('JWT_SECRET must be set in production');
}

// Generate JWT token
const generateToken = (userId, email, username, role) => {
  return jwt.sign(
    {
      userId,
      email,
      username,
      role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRY,
    }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

// JWT Middleware to verify token in requests
const authMiddleware = (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer token)
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization header must be "Bearer <token>"',
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = verifyToken(token);
    req.user = decoded; // Attach decoded token data to request
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'Token verification failed',
    });
  }
};

// Admin-only middleware (use after authMiddleware)
const adminMiddleware = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
  next();
};

module.exports = {
  generateToken,
  verifyToken,
  authMiddleware,
  adminMiddleware,
};
