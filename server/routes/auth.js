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
  passport.authenticate('google', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      // Update user's last login
      await User.findByIdAndUpdate(req.user._id, {
        lastLogin: new Date(),
        $inc: { loginCount: 1 }
      });

      // Redirect to frontend with success
      const redirectUrl = process.env.NODE_ENV === 'production' 
        ? `${process.env.CLIENT_URL}/dashboard?auth=success`
        : 'http://localhost:3000/dashboard?auth=success';
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Auth callback error:', error);
      res.redirect('/login?error=server_error');
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
        picture: req.user.picture,
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
        picture: user.picture,
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

// Update user preferences
router.put('/preferences', requireAuth, async (req, res) => {
  try {
    const { preferences } = req.body;
    
    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Invalid preferences format'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        preferences: {
          ...req.user.preferences,
          ...preferences
        },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences
    });
  } catch (error) {
    console.error('Preferences update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
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
    const { itemId, itemType, title, description, image } = req.body;
    
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