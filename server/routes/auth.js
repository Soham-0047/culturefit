const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const { requireAuth } = require('../config/auth');

const router = express.Router();

// Google OAuth routes
router.get('/google', 
  passport.authenticate('google', { 
    scope: ['profile', 'email'] 
  })
);

// Google OAuth callback
// Enhanced OAuth callback - replace your existing one
router.get('/google/callback',
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL}/?auth=failed`,
    failureMessage: true 
  }),
  async (req, res) => {
    try {
      console.log('=== OAUTH CALLBACK START ===');
      console.log('✅ Passport authentication successful');
      console.log('req.user exists:', !!req.user);
      console.log('req.user details:', req.user ? {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        googleId: req.user.googleId
      } : 'NO USER');
      console.log('req.isAuthenticated() before save:', req.isAuthenticated());
      console.log('Session before save:', JSON.stringify(req.session, null, 2));
      console.log('Session.passport before save:', req.session?.passport);

      if (!req.user) {
        console.error('❌ No user found in callback after passport authentication');
        return res.redirect(`${process.env.FRONTEND_URL}/?auth=failed&error=no_user`);
      }

      // Update user's last login
      const updatedUser = await User.findByIdAndUpdate(req.user._id, {
        lastLogin: new Date(),
        $inc: { loginCount: 1 }
      }, { new: true });

      console.log('✅ User updated in database:', updatedUser ? 'success' : 'failed');
      
      // Force session save and wait
      console.log('💾 Saving session...');
      await new Promise((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            console.error('❌ Session save error:', err);
            reject(err);
          } else {
            console.log('✅ Session saved successfully');
            console.log('Session after save:', JSON.stringify(req.session, null, 2));
            console.log('Session.passport after save:', req.session?.passport);
            console.log('req.isAuthenticated() after save:', req.isAuthenticated());
            resolve();
          }
        });
      });
      
      // Small delay to ensure session is persisted
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🚀 Redirecting to frontend...');
      console.log('Redirect URL:', `${process.env.FRONTEND_URL}/discover?auth=success`);
      res.redirect(`${process.env.FRONTEND_URL}/discover?auth=success`);
      console.log('=== OAUTH CALLBACK END ===');
      
    } catch (error) {
      console.error('❌ Auth callback error:', error);
      console.error('Error stack:', error.stack);
      res.redirect(`${process.env.FRONTEND_URL}/?auth=failed&error=server_error`);
    }
  }
);

// Check authentication status
router.get('/status', (req, res) => {
  console.log('=== AUTH STATUS CHECK ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Is authenticated:', req.isAuthenticated());
  console.log('User exists:', !!req.user);
  console.log('User email:', req.user ? req.user.email : 'No user');
  console.log('Cookie header:', req.headers.cookie);
  console.log('Passport session:', req.session ? req.session.passport : 'No passport session');
  
  const isAuthenticated = req.isAuthenticated();
  
  const response = {
    isAuthenticated, // Make sure this matches what frontend expects
    user: isAuthenticated && req.user ? {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar
    } : null,
    sessionId: req.sessionID,
    debug: {
      hasSession: !!req.session,
      hasCookie: !!req.headers.cookie,
      passportSession: req.session ? !!req.session.passport : false
    }
  };

  console.log('Response being sent:', response);
  res.json(response);
});

// Get current user profile
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.avatar,
        preferences: user.preferences,
        culturalProfile: user.culturalProfile,
        favorites: user.favorites,
        recommendations: user.recommendations,
        stats: {
          totalRecommendations: user.recommendations.length,
          totalFavorites: user.favorites.length,
          memberSince: user.createdAt,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount
        }
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
});

// GET /api/user/preferences - Get user preferences
router.get('/preferences', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user preferences based on your schema
    const preferences = {
      categories: user.preferences?.categories || [],
      favoriteGenres: user.preferences?.favoriteGenres || [],
      culturalTags: user.preferences?.culturalTags || [],
      moodPreferences: user.preferences?.moodPreferences || [],
      location: user.preferences?.location || { country: null, city: null, timezone: null }
    };

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// POST /api/user/preferences - Save user preferences
router.post('/preferences', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({ message: 'Preferences are required' });
    }

    const { categories, favoriteGenres, culturalTags, moodPreferences, location } = preferences;

    // Validate required fields
    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ message: 'At least one category is required' });
    }

    // Validate categories against enum values
    const validCategories = ['all', 'film', 'music', 'literature', 'art', 'design'];
    const invalidCategories = categories.filter(cat => !validCategories.includes(cat));
    if (invalidCategories.length > 0) {
      return res.status(400).json({ 
        message: `Invalid categories: ${invalidCategories.join(', ')}` 
      });
    }

    // Validate mood preferences if provided
    if (moodPreferences && moodPreferences.length > 0) {
      const validMoods = ['energetic', 'calm', 'adventurous', 'romantic', 'mysterious', 'uplifting', 'nostalgic', 'experimental'];
      const invalidMoods = moodPreferences.filter(mood => !validMoods.includes(mood));
      if (invalidMoods.length > 0) {
        return res.status(400).json({ 
          message: `Invalid mood preferences: ${invalidMoods.join(', ')}` 
        });
      }
    }

    // Prepare update object
    const updateData = {
      'preferences.categories': categories,
      'preferences.favoriteGenres': favoriteGenres || [],
      'preferences.culturalTags': culturalTags || [],
      'preferences.moodPreferences': moodPreferences || []
    };

    // Add location if provided
    if (location) {
      if (location.country) updateData['preferences.location.country'] = location.country;
      if (location.city) updateData['preferences.location.city'] = location.city;
      if (location.timezone) updateData['preferences.location.timezone'] = location.timezone;
    }

    // Update user preferences
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Preferences saved successfully',
      preferences: user.preferences 
    });
  } catch (error) {
    console.error('Error saving user preferences:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// PUT /api/user/preferences - Update specific preference fields
router.put('/preferences', async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updateFields = req.body;
    const updateData = {};

    // Build update object based on provided fields
    if (updateFields.categories) {
      updateData['preferences.categories'] = updateFields.categories;
    }
    if (updateFields.favoriteGenres) {
      updateData['preferences.favoriteGenres'] = updateFields.favoriteGenres;
    }
    if (updateFields.culturalTags) {
      updateData['preferences.culturalTags'] = updateFields.culturalTags;
    }
    if (updateFields.moodPreferences) {
      updateData['preferences.moodPreferences'] = updateFields.moodPreferences;
    }
    if (updateFields.location) {
      if (updateFields.location.country !== undefined) {
        updateData['preferences.location.country'] = updateFields.location.country;
      }
      if (updateFields.location.city !== undefined) {
        updateData['preferences.location.city'] = updateFields.location.city;
      }
      if (updateFields.location.timezone !== undefined) {
        updateData['preferences.location.timezone'] = updateFields.location.timezone;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Preferences updated successfully',
      preferences: user.preferences 
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update cultural profile
router.put('/cultural-profile', requireAuth, async (req, res) => {
  try {
    const { culturalProfile } = req.body;
    
    if (!culturalProfile || typeof culturalProfile !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid cultural profile format'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        culturalProfile: {
          ...req.user.culturalProfile,
          ...culturalProfile
        },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Cultural profile updated successfully',
      culturalProfile: user.culturalProfile
    });
  } catch (error) {
    console.error('Cultural profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cultural profile'
    });
  }
});

// Add to favorites
router.post('/favorites', requireAuth, async (req, res) => {
  try {
    const { itemId, itemType, title, description, image, url, category, tags} = req.body;
    
    if (!itemId || !itemType || !title) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: itemId, itemType, title'
      });
    }

    const user = await User.findById(req.user._id);
    
    // Check if already in favorites
    const existingFavorite = user.favorites.find(fav => 
      fav.itemId === itemId && fav.itemType === itemType
    );
    
    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: 'Item already in favorites'
      });
    }

    user.favorites.push({
      itemId,
      itemType,
      title,
      description,
      image,
      url,
      category,
      tags,
      addedAt: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: 'Added to favorites',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Add to favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites'
    });
  }
});

// Remove from favorites
router.delete('/favorites/:itemId', requireAuth, async (req, res) => {
  try {
    const { itemId } = req.params;
    
    const user = await User.findById(req.user._id);
    user.favorites = user.favorites.filter(fav => fav.itemId !== itemId);
    
    await user.save();

    res.json({
      success: true,
      message: 'Removed from favorites',
      favorites: user.favorites
    });
  } catch (error) {
    console.error('Remove from favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites'
    });
  }
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to logout'
      });
    }
    
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to destroy session'
        });
      }
      
      res.clearCookie('connect.sid');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
});

// Delete account
router.delete('/account', requireAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);
    
    req.logout((err) => {
      if (err) {
        console.error('Logout after delete error:', err);
      }
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy after delete error:', err);
        }
        
        res.clearCookie('connect.sid');
        res.json({
          success: true,
          message: 'Account deleted successfully'
        });
      });
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete account'
    });
  }
});


// Add this to your routes/auth.js file

// Cookie test endpoint
router.get('/cookie-test', (req, res) => {
  console.log('=== COOKIE TEST ===');
  console.log('Request headers:', req.headers);
  console.log('Received cookies:', req.headers.cookie || 'No cookies');
  console.log('Session ID:', req.sessionID);
  console.log('Session exists:', !!req.session);
  console.log('Is authenticated:', req.isAuthenticated ? req.isAuthenticated() : false);
  
  // Set a test cookie
  res.cookie('test-cookie', 'test-value-' + Date.now(), {
    secure: true,
    httpOnly: true,
    sameSite: 'none',
    maxAge: 60000 // 1 minute
  });
  
  // Also set a simple cookie for comparison
  res.cookie('simple-test', 'simple-value', {
    maxAge: 60000
  });
  
  res.json({
    success: true,
    message: 'Test cookies set successfully',
    debug: {
      receivedCookies: req.headers.cookie || 'No cookies received',
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin,
      referer: req.headers.referer,
      sessionInfo: {
        sessionID: req.sessionID,
        sessionExists: !!req.session,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user ? req.user.email : null
      },
      cookiesBeingSet: [
        'test-cookie (secure, httpOnly, sameSite=none)',
        'simple-test (basic cookie)'
      ]
    }
  });
});

// Second endpoint to check if cookies were received
router.get('/cookie-check', (req, res) => {
  console.log('=== COOKIE CHECK ===');
  console.log('All cookies received:', req.headers.cookie);
  
  res.json({
    success: true,
    cookiesReceived: req.headers.cookie || 'No cookies',
    parsedCookies: req.cookies || {},
    sessionInfo: {
      sessionID: req.sessionID,
      sessionExists: !!req.session,
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
    }
  });
});


// Debug session state
router.get('/session-debug', (req, res) => {
  console.log('=== SESSION DEBUG ===');
  console.log('Session ID:', req.sessionID);
  console.log('Session data:', JSON.stringify(req.session, null, 2));
  console.log('Session passport:', req.session?.passport);
  console.log('req.user:', req.user ? {
    id: req.user._id,
    email: req.user.email,
    name: req.user.name
  } : 'NO USER');
  console.log('req.isAuthenticated():', req.isAuthenticated());
  
  res.json({
    sessionID: req.sessionID,
    sessionData: req.session,
    passportSession: req.session?.passport,
    user: req.user,
    isAuthenticated: req.isAuthenticated(),
    debug: {
      hasSession: !!req.session,
      hasPassportData: !!(req.session?.passport),
      passportUser: req.session?.passport?.user,
      sessionKeys: req.session ? Object.keys(req.session) : [],
      userFromPassport: req.user ? 'exists' : 'missing'
    }
  });
});

// Test endpoint to manually set session (for testing)
router.get('/test-session', async (req, res) => {
  try {
    // Find any user for testing
    const testUser = await User.findOne();
    if (!testUser) {
      return res.json({ error: 'No users found in database' });
    }

    // Manually log in this user
    req.login(testUser, (err) => {
      if (err) {
        console.error('Manual login error:', err);
        return res.json({ error: 'Failed to manually log in user', details: err.message });
      }
      
      console.log('✅ Manually logged in user:', testUser.email);
      res.json({
        success: true,
        message: 'User manually logged in',
        user: {
          id: testUser._id,
          email: testUser.email,
          name: testUser.name
        },
        isAuthenticated: req.isAuthenticated()
      });
    });
  } catch (error) {
    console.error('Test session error:', error);
    res.json({ error: 'Test session failed', details: error.message });
  }
});

module.exports = router;