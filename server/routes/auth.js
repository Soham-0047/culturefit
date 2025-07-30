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

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  async (req, res) => {
    try {
      // Update user's last login
      await User.findByIdAndUpdate(req.user._id, {
        lastLogin: new Date(),
        $inc: { loginCount: 1 }
      });

      // Redirect to frontend with success
      const redirectUrl = `${process.env.FRONTEND_URL}/discover`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect('/');
    }
  }
);

// Check authentication status
router.get('/status', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        picture: req.user.avatar,
        preferences: req.user.preferences,
        culturalProfile: req.user.culturalProfile,
        memberSince: req.user.createdAt
      }
    });
  } else {
    res.json({
      authenticated: false,
      user: null
    });
  }
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

module.exports = router;