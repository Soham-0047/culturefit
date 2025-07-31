const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configure Google OAuth Strategy for JWT (no sessions)
const configureGoogleAuth = () => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google OAuth Profile:', profile);

      // Check if user already exists
      let user = await User.findOne({
        $or: [
          { googleId: profile.id },
          { email: profile.emails[0]?.value }
        ]
      });

      if (user) {
        // Update existing user with Google data
        user.googleId = profile.id;
        user.name = profile.displayName;
        user.avatar = profile.photos[0]?.value || user.avatar;
        user.email = profile.emails[0]?.value || user.email;

        // Update OAuth tokens
        user.authProviders = user.authProviders || {};
        user.authProviders.google = {
          id: profile.id,
          accessToken: accessToken,
          refreshToken: refreshToken,
          lastLogin: new Date()
        };

        await user.save();
        console.log('Updated existing user:', user.email);
        return done(null, user);
      }

      // Create new user
      user = new User({
        googleId: profile.id,
        name: profile.displayName,
        email: profile.emails[0]?.value,
        avatar: profile.photos[0]?.value || '',
        authProviders: {
          google: {
            id: profile.id,
            accessToken: accessToken,
            refreshToken: refreshToken,
            lastLogin: new Date()
          }
        },
        preferences: {
          categories: ['all'],
          favoriteGenres: [],
          culturalTags: [],
          moodPreferences: []
        },
        tasteProfile: {
          compatibility_score: 0,
          cultural_evolution: [],
          recommendations_history: []
        },
        settings: {
          notifications: {
            email: true,
            push: true,
            recommendations: true,
            trends: true
          }
        }
      });

      await user.save();
      console.log('Created new user:', user.email);
      return done(null, user);
    } catch (error) {
      console.error('Google OAuth error:', error);
      return done(error, null);
    }
  }));

  // No serialization needed for JWT - sessions are disabled
};

// JWT verification middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      error: 'No token provided',
      authenticated: false 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('JWT verification error:', err);
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        authenticated: false 
      });
    }

    try {
      const user = await User.findById(decoded.userId);
      if (!user) {
        return res.status(404).json({ 
          error: 'User not found',
          authenticated: false 
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Database error in verifyToken:', error);
      return res.status(500).json({ 
        error: 'Database error',
        authenticated: false 
      });
    }
  });
};

// Optional JWT verification (doesn't require auth)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    try {
      const user = await User.findById(decoded.userId);
      req.user = user || null;
      next();
    } catch (error) {
      req.user = null;
      next();
    }
  });
};

// Admin auth middleware (JWT-based)
const requireAdmin = (req, res, next) => {
  // First verify JWT token
  verifyToken(req, res, (err) => {
    if (err) return; // verifyToken already sent response
    
    if (req.user && req.user.role === 'admin') {
      return next();
    }
    
    res.status(403).json({ 
      error: 'Admin access required',
      authenticated: !!req.user 
    });
  });
};

// Check authentication status (JWT-based)
const checkAuthStatus = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.locals.isAuthenticated = false;
    res.locals.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      res.locals.isAuthenticated = false;
      res.locals.user = null;
      return next();
    }

    try {
      const user = await User.findById(decoded.userId);
      res.locals.isAuthenticated = !!user;
      res.locals.user = user;
      next();
    } catch (error) {
      res.locals.isAuthenticated = false;
      res.locals.user = null;
      next();
    }
  });
};

// Legacy middleware wrapper (for backward compatibility)
// DEPRECATED: Use verifyToken instead
const requireAuth = (req, res, next) => {
  console.warn('⚠️  requireAuth is deprecated. Use verifyToken instead.');
  return verifyToken(req, res, next);
};

// Utility function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      name: user.name
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Utility function to verify JWT token (for use in other modules)
const verifyTokenSync = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  configureGoogleAuth,
  verifyToken,
  optionalAuth,
  requireAdmin,
  checkAuthStatus,
  generateToken,
  verifyTokenSync,
  // Legacy exports (deprecated)
  requireAuth
};