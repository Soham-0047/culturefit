const express = require('express');
const User = require('../models/User');
const { requireAuth, verifyToken } = require('../config/auth');

const router = express.Router();

// Get user dashboard data
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-__v');
    
    // Calculate user stats
    const stats = {
      totalRecommendations: user.recommendations.length,
      totalFavorites: user.favorites.length,
      recentActivity: user.recommendations.slice(-5).reverse(),
      topCategories: getTopCategories(user.recommendations),
      memberSince: user.createdAt,
      lastLogin: user.lastLogin,
      loginCount: user.loginCount
    };

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        preferences: user.preferences,
        culturalProfile: user.culturalProfile
      },
      stats,
      recommendations: user.recommendations.slice(-10).reverse(),
      favorites: user.favorites.slice(-10).reverse()
    });
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data'
    });
  }
});

// Get user's recommendation history
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    let recommendations = user.recommendations;

    // Filter by category if specified
    if (category && category !== 'all') {
      recommendations = recommendations.filter(rec => 
        rec.category.toLowerCase() === category.toLowerCase()
      );
    }

    // Sort recommendations
    recommendations.sort((a, b) => {
      if (sortBy === 'rating') {
        return b.rating - a.rating;
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

    // Paginate
    const total = recommendations.length;
    const paginatedRecommendations = recommendations.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      recommendations: paginatedRecommendations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Recommendations fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommendations'
    });
  }
});

// Get user's favorites
router.get('/favorites', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sortBy = 'addedAt' } = req.query;
    const skip = (page - 1) * limit;

    const user = await User.findById(req.user._id);
    let favorites = user.favorites;

    // Filter by category if specified
    if (category && category !== 'all') {
      favorites = favorites.filter(fav => 
        fav.itemType.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Sort favorites
    favorites.sort((a, b) => {
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      } else {
        return new Date(b.addedAt) - new Date(a.addedAt);
      }
    });

    // Paginate
    const total = favorites.length;
    const paginatedFavorites = favorites.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      favorites: paginatedFavorites,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Favorites fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites'
    });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, preferences, culturalProfile } = req.body;
    
    const updateData = { updatedAt: new Date() };
    
    if (name && name.trim()) {
      updateData.name = name.trim();
    }
    
    if (preferences) {
      updateData.preferences = {
        ...req.user.preferences,
        ...preferences
      };
    }
    
    if (culturalProfile) {
      updateData.culturalProfile = {
        ...req.user.culturalProfile,
        ...culturalProfile
      };
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.avatar,
        preferences: user.preferences,
        culturalProfile: user.name
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// Add recommendation to user's history
router.post('/recommendations', verifyToken, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      rating, 
      image, 
      tags, 
      source,
      metadata 
    } = req.body;
    
    if (!title || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title and category are required'
      });
    }

    const user = await User.findById(req.user._id);
    
    const recommendation = {
      title,
      description,
      category,
      rating: rating || 0,
      image,
      tags: tags || [],
      source,
      metadata: metadata || {},
      createdAt: new Date()
    };

    user.recommendations.push(recommendation);
    
    // Keep only last 1000 recommendations to prevent bloating
    if (user.recommendations.length > 1000) {
      user.recommendations = user.recommendations.slice(-1000);
    }

    await user.save();

    res.json({
      success: true,
      message: 'Recommendation added to history',
      recommendation
    });
  } catch (error) {
    console.error('Add recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add recommendation'
    });
  }
});

// Get user analytics
router.get('/analytics', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const analytics = {
      totalRecommendations: user.recommendations.length,
      totalFavorites: user.favorites.length,
      topCategories: getTopCategories(user.recommendations),
      recentActivity: getRecentActivity(user.recommendations, user.favorites),
      monthlyStats: getMonthlyStats(user.recommendations),
      ratingDistribution: getRatingDistribution(user.recommendations),
      culturalDiversity: getCulturalDiversity(user.recommendations),
      engagementMetrics: {
        averageRating: getAverageRating(user.recommendations),
        favoriteRate: user.favorites.length / Math.max(user.recommendations.length, 1),
        activeCategories: getActiveCategories(user.recommendations).length
      }
    };

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Analytics fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics'
    });
  }
});

// Helper functions
function getTopCategories(recommendations) {
  const categoryCount = {};
  recommendations.forEach(rec => {
    categoryCount[rec.category] = (categoryCount[rec.category] || 0) + 1;
  });
  
  return Object.entries(categoryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({ category, count }));
}

function getRecentActivity(recommendations, favorites) {
  const recent = [];
  
  recommendations.slice(-10).forEach(rec => {
    recent.push({
      type: 'recommendation',
      item: rec,
      timestamp: rec.createdAt
    });
  });
  
  favorites.slice(-10).forEach(fav => {
    recent.push({
      type: 'favorite',
      item: fav,
      timestamp: fav.addedAt
    });
  });
  
  return recent
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 10);
}

function getMonthlyStats(recommendations) {
  const monthlyCount = {};
  const last12Months = [];
  
  for (let i = 11; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyCount[monthKey] = 0;
    last12Months.push(monthKey);
  }
  
  recommendations.forEach(rec => {
    const date = new Date(rec.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (monthlyCount.hasOwnProperty(monthKey)) {
      monthlyCount[monthKey]++;
    }
  });
  
  return last12Months.map(month => ({
    month,
    count: monthlyCount[month]
  }));
}

function getRatingDistribution(recommendations) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  recommendations.forEach(rec => {
    const rating = Math.round(rec.rating);
    if (rating >= 1 && rating <= 5) {
      distribution[rating]++;
    }
  });
  
  return distribution;
}

function getCulturalDiversity(recommendations) {
  const categories = new Set();
  const tags = new Set();
  
  recommendations.forEach(rec => {
    categories.add(rec.category);
    if (rec.tags) {
      rec.tags.forEach(tag => tags.add(tag));
    }
  });
  
  return {
    uniqueCategories: categories.size,
    uniqueTags: tags.size,
    diversityScore: (categories.size * 0.6) + (tags.size * 0.4)
  };
}

function getAverageRating(recommendations) {
  if (recommendations.length === 0) return 0;
  
  const total = recommendations.reduce((sum, rec) => sum + (rec.rating || 0), 0);
  return (total / recommendations.length).toFixed(1);
}

function getActiveCategories(recommendations) {
  const categories = new Set();
  recommendations.forEach(rec => categories.add(rec.category));
  return Array.from(categories);
}

module.exports = router;