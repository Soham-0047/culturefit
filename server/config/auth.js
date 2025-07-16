const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Configure Google OAuth Strategy
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
};

// Serialize user for session
passport.serializeUser((user, done) => {
  console.log('Serializing user:', user._id);
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    console.log('Deserializing user:', user ? user.email : 'User not found');
    done(null, user);
  } catch (error) {
    console.error('User deserialization error:', error);
    done(error, null);
  }
});

// Authentication middleware
const requireAuth = (req, res, next) => {
  console.log('Auth check - User:', req.user ? req.user.email : 'Not authenticated');
  console.log('Auth check - Session:', req.session ? 'Session exists' : 'No session');

  if (req.isAuthenticated()) {
    return next();
  }

  res.status(401).json({
    error: 'Authentication required',
    authenticated: false
  });
};

// Optional auth middleware (doesn't block if not authenticated)
const optionalAuth = (req, res, next) => {
  // User data will be available in req.user if authenticated
  next();
};

// Admin auth middleware
const requireAdmin = (req, res, next) => {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Admin access required' });
};

// Check authentication status
const checkAuthStatus = (req, res, next) => {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user;
  next();
};

module.exports = {
  configureGoogleAuth,
  requireAuth,
  optionalAuth,
  requireAdmin,
  checkAuthStatus
};