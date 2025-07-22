const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { requireAuth, optionalAuth } = require('../config/auth');

const router = express.Router();

// Get cultural discoveries with enhanced preference-based personalization
router.get('/insights', optionalAuth, async (req, res) => {
  try {
    const {
      category = 'all',
      limit = 10,
      page = 1,
      sortBy = 'relevance',
      tags,
      minRating,
      maxRating,
      releaseYear
    } = req.query;

    // Category mapping for API calls
    const categoryMap = {
      all: 'urn:entity:movie',
      film: 'urn:entity:movie',
      music: 'urn:entity:music',
      literature: 'urn:entity:book',
      art: 'urn:entity:art',
      design: 'urn:entity:design'
    };

    // Get user preferences for enhanced filtering
    let userPreferences = null;
    if (req.user) {
      const user = await User.findById(req.user._id);
      userPreferences = user.preferences;
    }

    // Build API parameters with preference-based defaults
    const apiParams = buildPreferenceBasedParams({
      category,
      limit: Math.min(parseInt(limit), 50),
      offset: (parseInt(page) - 1) * parseInt(limit),
      releaseYear,
      tags,
      minRating,
      maxRating
    }, userPreferences, categoryMap);

    // Make API call to Qloo
    const response = await axios.get(`${process.env.QLOO_API_URL}/v2/insights`, {
      params: apiParams,
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Process and format the response with preference scoring
    const discoveries = await processDiscoveriesData(response.data, userPreferences);
    
    // Apply preference-based sorting
    const sortedDiscoveries = sortByPreferences(discoveries, userPreferences, sortBy);

    // Add to user's recommendation history if authenticated
    if (req.user) {
      await addToUserHistory(req.user._id, sortedDiscoveries.slice(0, 5));
    }

    res.json({
      success: true,
      discoveries: sortedDiscoveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: response.data.total || sortedDiscoveries.length,
        hasMore: sortedDiscoveries.length === parseInt(limit)
      },
      filters: {
        category,
        sortBy,
        tags,
        minRating,
        maxRating,
        releaseYear
      },
      personalization: userPreferences ? {
        appliedPreferences: getAppliedPreferences(userPreferences),
        preferenceMatch: true
      } : null
    });

  } catch (error) {
    console.error('Discover insights error:', error);
    
    // Return fallback data if API fails
    const fallbackData = generateFallbackData(req.query);
    
    res.json({
      success: true,
      discoveries: fallbackData,
      fallback: true,
      message: 'Using cached cultural discoveries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get personalized recommendations based purely on preferences
router.get('/personalized', requireAuth, async (req, res) => {
  try {
    const { limit = 15, excludeViewed = true, preferenceWeight = 'high' } = req.query;
    
    const user = await User.findById(req.user._id);
    const userPreferences = user.preferences;

    if (!userPreferences || Object.keys(userPreferences).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'User preferences not found. Please update your preferences first.',
        requiresSetup: true
      });
    }

    // Build highly personalized query based on user preferences
    const personalizedParams = buildAdvancedPreferenceQuery(userPreferences, preferenceWeight);

    // Exclude previously viewed items
    let excludeIds = [];
    if (excludeViewed) {
      excludeIds = user.recommendations.map(rec => rec.itemId).filter(Boolean);
    }

    const response = await axios.get(`${process.env.QLOO_API_URL}/v2/recommendations`, {
      params: {
        ...personalizedParams,
        limit: parseInt(limit) * 2, // Get more results to filter
        exclude: excludeIds.join(',')
      },
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const recommendations = await processDiscoveriesData(response.data, userPreferences);

    // Calculate detailed preference scores
    const scoredRecommendations = recommendations.map(rec => ({
      ...rec,
      preferenceScore: calculateDetailedPreferenceScore(rec, userPreferences),
      preferenceBreakdown: getPreferenceBreakdown(rec, userPreferences)
    }))
    .filter(rec => rec.preferenceScore > 0.3) // Only show items with decent preference match
    .sort((a, b) => b.preferenceScore - a.preferenceScore)
    .slice(0, parseInt(limit));

    res.json({
      success: true,
      recommendations: scoredRecommendations,
      personalization: {
        basedOn: {
          preferences: getPreferencesSummary(userPreferences),
          totalPreferences: Object.keys(userPreferences).length,
          history: user.recommendations.length,
          preferenceWeight
        },
        averageScore: scoredRecommendations.reduce((sum, rec) => sum + rec.preferenceScore, 0) / scoredRecommendations.length || 0
      }
    });

  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personalized recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// New route: Update user preferences
router.post('/preferences', requireAuth, async (req, res) => {
  try {
    const {
      favoriteGenres,
      preferredDecades,
      favoriteDirectors,
      favoriteArtists,
      preferredLanguages,
      minRating,
      maxRating,
      contentTypes,
      moodPreferences,
      themePreferences,
      excludedTags
    } = req.body;

    const user = await User.findById(req.user._id);
    
    // Update preferences
    user.preferences = {
      ...user.preferences,
      favoriteGenres: favoriteGenres || user.preferences?.favoriteGenres || [],
      preferredDecades: preferredDecades || user.preferences?.preferredDecades || [],
      favoriteDirectors: favoriteDirectors || user.preferences?.favoriteDirectors || [],
      favoriteArtists: favoriteArtists || user.preferences?.favoriteArtists || [],
      preferredLanguages: preferredLanguages || user.preferences?.preferredLanguages || [],
      minRating: minRating !== undefined ? minRating : user.preferences?.minRating || 3.0,
      maxRating: maxRating !== undefined ? maxRating : user.preferences?.maxRating || 10.0,
      contentTypes: contentTypes || user.preferences?.contentTypes || [],
      moodPreferences: moodPreferences || user.preferences?.moodPreferences || [],
      themePreferences: themePreferences || user.preferences?.themePreferences || [],
      excludedTags: excludedTags || user.preferences?.excludedTags || [],
      lastUpdated: new Date()
    };

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences,
      recommendationsWillImprove: true
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// New route: Get user preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      preferences: user.preferences || {},
      hasPreferences: user.preferences && Object.keys(user.preferences).length > 0,
      lastUpdated: user.preferences?.lastUpdated || null
    });

  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get trending discoveries with preference enhancement
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { category = 'all', limit = 20, preferenceBoost = true } = req.query;

    const categoryMap = {
      all: ['urn:entity:movie', 'urn:entity:music', 'urn:entity:book'],
      film: ['urn:entity:movie'],
      music: ['urn:entity:music'],
      literature: ['urn:entity:book'],
      art: ['urn:entity:art'],
      design: ['urn:entity:design']
    };

    const types = categoryMap[category] || categoryMap.all;
    const allTrending = [];

    // Get user preferences for boosting
    let userPreferences = null;
    if (req.user && preferenceBoost === 'true') {
      const user = await User.findById(req.user._id);
      userPreferences = user.preferences;
    }

    // Fetch trending for each type
    for (const type of types) {
      try {
        const response = await axios.get(`${process.env.QLOO_API_URL}/v2/insights`, {
          params: {
            'filter.type': type,
            'filter.trending': true,
            'filter.release_year.min': '2023',
            limit: Math.ceil(parseInt(limit) / types.length),
            sort: 'relevance_score'
          },
          headers: {
            'X-API-Key': process.env.QLOO_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        });

        const processed = await processDiscoveriesData(response.data, userPreferences);
        allTrending.push(...processed);
      } catch (typeError) {
        console.warn(`Failed to fetch trending for type ${type}:`, typeError.message);
      }
    }

    // Sort by relevance and apply preference boosting
    let trending = allTrending
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

    // Apply preference boosting if user is authenticated and has preferences
    if (userPreferences && preferenceBoost === 'true') {
      trending = trending.map(item => ({
        ...item,
        preferenceScore: calculateDetailedPreferenceScore(item, userPreferences),
        originalRank: trending.indexOf(item) + 1
      })).sort((a, b) => {
        // Combine trending relevance with preference score
        const aScore = (a.relevanceScore || 0) * 0.7 + (a.preferenceScore || 0) * 0.3;
        const bScore = (b.relevanceScore || 0) * 0.7 + (b.preferenceScore || 0) * 0.3;
        return bScore - aScore;
      });
    }

    trending = trending.slice(0, parseInt(limit));

    res.json({
      success: true,
      trending,
      category,
      count: trending.length,
      preferencesBoosted: userPreferences && preferenceBoost === 'true',
      personalization: userPreferences && preferenceBoost === 'true' ? {
        averagePreferenceScore: trending.reduce((sum, item) => sum + (item.preferenceScore || 0), 0) / trending.length,
        appliedPreferences: getAppliedPreferences(userPreferences)
      } : null
    });

  } catch (error) {
    console.error('Trending discoveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending discoveries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get discovery details with enhanced information
router.get('/details/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const response = await axios.get(`${process.env.QLOO_API_URL}/v2/entities/${id}`, {
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });

    const details = await processDiscoveryDetails(response.data, req.user?.preferences);

    // Get related recommendations
    const relatedResponse = await axios.get(`${process.env.QLOO_API_URL}/v2/recommendations`, {
      params: {
        seed: id,
        limit: 6
      },
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });

    const related = await processDiscoveriesData(relatedResponse.data, req.user?.preferences);

    // Add preference scores if user is authenticated
    if (req.user) {
      const user = await User.findById(req.user._id);
      if (user.preferences) {
        details.preferenceScore = calculateDetailedPreferenceScore(details, user.preferences);
        details.preferenceBreakdown = getPreferenceBreakdown(details, user.preferences);
      }
    }

    res.json({
      success: true,
      details,
      related
    });

  } catch (error) {
    console.error('Discovery details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discovery details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get discovery stats with preference insights
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const stats = {
      totalDiscoveries: 8470,
      categories: {
        film: 1560,
        music: 2340,
        literature: 890,
        art: 1450,
        design: 2230
      },
      trending: 230,
      recentlyAdded: 450,
      averageRating: 4.6,
      userEngagement: {
        averageViews: 350,
        averageFavorites: 45,
        averageShares: 12
      }
    };

    // Add user-specific stats if authenticated
    if (req.user) {
      const user = await User.findById(req.user._id);
      
      // Calculate preference-based stats
      const preferenceStats = user.preferences ? calculatePreferenceStats(user.preferences, user.recommendations) : null;
      
      stats.user = {
        totalViewed: user.recommendations.length,
        totalFavorites: user.favorites?.length || 0,
        topCategories: getTopCategories(user.recommendations),
        joinDate: user.createdAt,
        preferences: {
          hasPreferences: user.preferences && Object.keys(user.preferences).length > 0,
          preferenceCount: user.preferences ? Object.keys(user.preferences).length : 0,
          lastUpdated: user.preferences?.lastUpdated || null,
          stats: preferenceStats
        }
      };

      // Add preference matching insights
      if (user.preferences && user.recommendations.length > 0) {
        const recentRecommendations = user.recommendations.slice(-20);
        const preferenceMatches = recentRecommendations.map(rec => 
          calculateDetailedPreferenceScore(rec, user.preferences)
        );
        
        stats.user.preferenceInsights = {
          averageMatchScore: preferenceMatches.reduce((a, b) => a + b, 0) / preferenceMatches.length,
          highMatches: preferenceMatches.filter(score => score > 0.7).length,
          lowMatches: preferenceMatches.filter(score => score < 0.3).length,
          recommendationImprovement: preferenceMatches.length > 10 ? 
            'Good preference data available' : 'More interactions needed for better recommendations'
        };
      }
    }

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Discovery stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch discovery stats'
    });
  }
});

// Enhanced search with preference boosting
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, category, limit = 20, page = 1, usePreferences = true } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchParams = {
      q: q.trim(),
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    if (category && category !== 'all') {
      const categoryMap = {
        film: 'urn:entity:movie',
        music: 'urn:entity:music',
        literature: 'urn:entity:book',
        art: 'urn:entity:art',
        design: 'urn:entity:design'
      };
      searchParams['filter.type'] = categoryMap[category];
    }

    // Apply user preferences to search if requested and user is authenticated
    let userPreferences = null;
    if (req.user && usePreferences === 'true') {
      const user = await User.findById(req.user._id);
      userPreferences = user.preferences;
      
      // Enhance search with preference filters
      if (userPreferences) {
        searchParams = enhanceSearchWithPreferences(searchParams, userPreferences);
      }
    }

    const response = await axios.get(`${process.env.QLOO_API_URL}/v2/search`, {
      params: searchParams,
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    let results = await processDiscoveriesData(response.data, userPreferences);

    // Boost results based on preferences
    if (userPreferences && usePreferences === 'true') {
      results = results.map(result => ({
        ...result,
        preferenceScore: calculateDetailedPreferenceScore(result, userPreferences)
      })).sort((a, b) => b.preferenceScore - a.preferenceScore);
    }

    res.json({
      success: true,
      results,
      query: q,
      category,
      preferencesBoosted: userPreferences && usePreferences === 'true',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: response.data.total || results.length
      }
    });

  } catch (error) {
    console.error('Search discoveries error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search discoveries',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper functions

function buildPreferenceBasedParams(baseParams, userPreferences, categoryMap) {
  const apiParams = {
    'filter.type': categoryMap[baseParams.category] || categoryMap.all,
    'filter.release_year.min': baseParams.releaseYear || '2022',
    limit: baseParams.limit,
    offset: baseParams.offset
  };

  // Apply user preferences if available
  if (userPreferences) {
    // Genre preferences
    if (userPreferences.favoriteGenres?.length) {
      apiParams['filter.genre'] = userPreferences.favoriteGenres.slice(0, 3).join(',');
    }

    // Rating preferences
    if (userPreferences.minRating) {
      apiParams['filter.rating.min'] = Math.max(baseParams.minRating || 0, userPreferences.minRating);
    }
    if (userPreferences.maxRating) {
      apiParams['filter.rating.max'] = Math.min(baseParams.maxRating || 10, userPreferences.maxRating);
    }

    // Language preferences
    if (userPreferences.preferredLanguages?.length) {
      apiParams['filter.language'] = userPreferences.preferredLanguages.join(',');
    }

    // Exclude unwanted content
    if (userPreferences.excludedTags?.length) {
      apiParams['filter.exclude_tags'] = userPreferences.excludedTags.join(',');
    }
  }

  // Override with explicit parameters
  if (baseParams.tags) {
    apiParams['filter.tags'] = baseParams.tags;
  }
  if (baseParams.minRating) {
    apiParams['filter.rating.min'] = baseParams.minRating;
  }
  if (baseParams.maxRating) {
    apiParams['filter.rating.max'] = baseParams.maxRating;
  }

  return apiParams;
}

function buildAdvancedPreferenceQuery(userPreferences, weight = 'high') {
  const params = {};
  
  // Apply stronger preference filtering based on weight
  const maxItems = weight === 'high' ? 5 : weight === 'medium' ? 8 : 10;
  
  if (userPreferences.favoriteGenres?.length) {
    params['filter.genre'] = userPreferences.favoriteGenres.slice(0, maxItems).join(',');
  }
  
  if (userPreferences.preferredDecades?.length) {
    const decades = userPreferences.preferredDecades.map(d => `${d}s`).slice(0, 3).join(',');
    params['filter.decade'] = decades;
  }
  
  if (userPreferences.favoriteDirectors?.length) {
    params['filter.director'] = userPreferences.favoriteDirectors.slice(0, 3).join(',');
  }
  
  if (userPreferences.favoriteArtists?.length) {
    params['filter.artist'] = userPreferences.favoriteArtists.slice(0, 3).join(',');
  }
  
  if (userPreferences.minRating) {
    params['filter.rating.min'] = userPreferences.minRating;
  }
  
  if (userPreferences.preferredLanguages?.length) {
    params['filter.language'] = userPreferences.preferredLanguages.join(',');
  }
  
  if (userPreferences.moodPreferences?.length) {
    params['filter.mood'] = userPreferences.moodPreferences.slice(0, 3).join(',');
  }
  
  return params;
}

function calculateDetailedPreferenceScore(item, preferences) {
  if (!preferences) return 0.5; // Default score for non-personalized
  
  let score = 0;
  let maxScore = 0;
  
  // Genre matching (weight: 0.25)
  if (preferences.favoriteGenres?.length) {
    maxScore += 0.25;
    const genreMatch = preferences.favoriteGenres.some(genre => 
      item.tags.some(tag => tag.toLowerCase().includes(genre.toLowerCase())) ||
      item.category.toLowerCase().includes(genre.toLowerCase())
    );
    if (genreMatch) score += 0.25;
  }
  
  // Rating preference (weight: 0.20)
  if (preferences.minRating !== undefined) {
    maxScore += 0.20;
    if (item.rating >= preferences.minRating) {
      const ratingBonus = Math.min((item.rating - preferences.minRating) / 2, 0.20);
      score += ratingBonus;
    }
  }
  
  // Mood/Theme matching (weight: 0.20)
  if (preferences.moodPreferences?.length || preferences.themePreferences?.length) {
    maxScore += 0.20;
    const allMoodThemes = [...(preferences.moodPreferences || []), ...(preferences.themePreferences || [])];
    const moodMatch = allMoodThemes.some(mood => 
      item.tags.some(tag => tag.toLowerCase().includes(mood.toLowerCase())) ||
      item.description.toLowerCase().includes(mood.toLowerCase())
    );
    if (moodMatch) score += 0.20;
  }
  
  // Content type preference (weight: 0.15)
  if (preferences.contentTypes?.length) {
    maxScore += 0.15;
    const typeMatch = preferences.contentTypes.some(type => 
      item.category.toLowerCase().includes(type.toLowerCase())
    );
    if (typeMatch) score += 0.15;
  }
  
  // Trending bonus (weight: 0.10)
  maxScore += 0.10;
  if (item.trending) score += 0.10;
  
  // High rating bonus (weight: 0.10)
  maxScore += 0.10;
  if (item.rating >= 4.5) score += 0.10;
  
  // Penalty for excluded tags
  if (preferences.excludedTags?.length) {
    const hasExcludedTag = preferences.excludedTags.some(excludedTag => 
      item.tags.some(tag => tag.toLowerCase().includes(excludedTag.toLowerCase()))
    );
    if (hasExcludedTag) score *= 0.5; // Reduce score by half
  }
  
  return maxScore > 0 ? Math.min(score / maxScore, 1.0) : 0.5;
}

function getPreferenceBreakdown(item, preferences) {
  const breakdown = {
    genreMatch: false,
    ratingMatch: false,
    moodMatch: false,
    contentTypeMatch: false,
    trending: item.trending || false,
    highRating: item.rating >= 4.5,
    excludedContent: false
  };
  
  if (preferences.favoriteGenres?.length) {
    breakdown.genreMatch = preferences.favoriteGenres.some(genre => 
      item.tags.some(tag => tag.toLowerCase().includes(genre.toLowerCase()))
    );
  }
  
  if (preferences.minRating !== undefined) {
    breakdown.ratingMatch = item.rating >= preferences.minRating;
  }
  
  if (preferences.moodPreferences?.length) {
    const allMoods = [...(preferences.moodPreferences || []), ...(preferences.themePreferences || [])];
    breakdown.moodMatch = allMoods.some(mood => 
      item.tags.some(tag => tag.toLowerCase().includes(mood.toLowerCase()))
    );
  }
  
  if (preferences.excludedTags?.length) {
    breakdown.excludedContent = preferences.excludedTags.some(excludedTag => 
      item.tags.some(tag => tag.toLowerCase().includes(excludedTag.toLowerCase()))
    );
  }
  
  return breakdown;
}

function sortByPreferences(discoveries, preferences, sortBy) {
  if (!preferences || sortBy === 'relevance') {
    return discoveries;
  }
  
  switch (sortBy) {
    case 'preference_match':
      return discoveries.sort((a, b) => 
        calculateDetailedPreferenceScore(b, preferences) - calculateDetailedPreferenceScore(a, preferences)
      );
    case 'rating_preference':
      return discoveries.sort((a, b) => {
        const aScore = calculateDetailedPreferenceScore(a, preferences) + (a.rating / 10);
        const bScore = calculateDetailedPreferenceScore(b, preferences) + (b.rating / 10);
        return bScore - aScore;
      });
    default:
      return discoveries;
  }
}

function getAppliedPreferences(preferences) {
  const applied = [];
  
  if (preferences.favoriteGenres?.length) applied.push(`${preferences.favoriteGenres.length} favorite genres`);
  if (preferences.minRating) applied.push(`minimum rating: ${preferences.minRating}`);
  if (preferences.preferredLanguages?.length) applied.push(`${preferences.preferredLanguages.length} preferred languages`);
  if (preferences.moodPreferences?.length) applied.push(`${preferences.moodPreferences.length} mood preferences`);
  if (preferences.excludedTags?.length) applied.push(`${preferences.excludedTags.length} excluded tags`);
  
  return applied;
}

function getPreferencesSummary(preferences) {
  return {
    genres: preferences.favoriteGenres?.length || 0,
    decades: preferences.preferredDecades?.length || 0,
    directors: preferences.favoriteDirectors?.length || 0,
    artists: preferences.favoriteArtists?.length || 0,
    languages: preferences.preferredLanguages?.length || 0,
    moods: preferences.moodPreferences?.length || 0,
    themes: preferences.themePreferences?.length || 0,
    minRating: preferences.minRating || null,
    excluded: preferences.excludedTags?.length || 0
  };
}

function enhanceSearchWithPreferences(searchParams, preferences) {
  const enhanced = { ...searchParams };
  
  // Add preference-based boosts to search
  if (preferences.favoriteGenres?.length) {
    enhanced['boost.genre'] = preferences.favoriteGenres.slice(0, 3).join(',');
  }
  
  if (preferences.minRating) {
    enhanced['filter.rating.min'] = Math.max(enhanced['filter.rating.min'] || 0, preferences.minRating);
  }
  
  if (preferences.preferredLanguages?.length) {
    enhanced['boost.language'] = preferences.preferredLanguages.join(',');
  }
  
  return enhanced;
}

function calculatePreferenceStats(preferences, recommendations) {
  const stats = {
    totalPreferences: Object.keys(preferences).length,
    breakdown: {
      genres: preferences.favoriteGenres?.length || 0,
      decades: preferences.preferredDecades?.length || 0,
      directors: preferences.favoriteDirectors?.length || 0,
      artists: preferences.favoriteArtists?.length || 0,
      languages: preferences.preferredLanguages?.length || 0,
      moods: preferences.moodPreferences?.length || 0,
      themes: preferences.themePreferences?.length || 0,
      excluded: preferences.excludedTags?.length || 0
    },
    ratingRange: {
      min: preferences.minRating || null,
      max: preferences.maxRating || null
    }
  };

  // Analyze how preferences align with viewing history
  if (recommendations.length > 0) {
    const categoryCount = {};
    recommendations.forEach(rec => {
      categoryCount[rec.category] = (categoryCount[rec.category] || 0) + 1;
    });
    
    const topViewedCategory = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
    
    stats.alignment = {
      topViewedCategory,
      totalViewed: recommendations.length,
      averageRating: recommendations.reduce((sum, rec) => sum + (rec.rating || 0), 0) / recommendations.length,
      preferencesLastUpdated: preferences.lastUpdated
    };
  }

  return stats;
}

async function processDiscoveryDetails(apiData, userPreferences) {
  const item = apiData.entity || apiData;
  
  return {
    id: item.id,
    title: item.name,
    description: item.properties?.description,
    category: item.subtype?.split(':').pop(),
    rating: extractRating(item),
    image: item.properties?.image?.url,
    tags: item.tags || [],
    website: item.properties?.websites?.[0],
    releaseYear: item.properties?.release_year,
    details: {
      genre: item.properties?.genre,
      director: item.properties?.director,
      cast: item.properties?.cast,
      duration: item.properties?.duration,
      language: item.properties?.language,
      country: item.properties?.country
    },
    external: item.external,
    fullProperties: item.properties
  };
}

function extractRating(item) {
  const ratings = [];
  
  if (item.external?.imdb?.[0]?.user_rating) {
    ratings.push(parseFloat(item.external.imdb[0].user_rating));
  }
  
  if (item.external?.metacritic?.[0]?.user_rating) {
    ratings.push(parseFloat(item.external.metacritic[0].user_rating) / 10);
  }
  
  if (item.external?.rottentomatoes?.find(r => r.user_rating)) {
    ratings.push(parseFloat(item.external.rottentomatoes.find(r => r.user_rating).user_rating) / 10);
  }
  
  return ratings.length 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : (4.0 + Math.random() * 1.0).toFixed(1);
}

// Keep existing helper functions from original code
async function processDiscoveriesData(apiData, userPreferences) {
  const entities = apiData.results?.entities || apiData.entities || [];
  
  return entities.map((item, index) => {
    const parseNumber = (val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    };

    // Extract ratings
    const imdbRating = parseNumber(item.external?.imdb?.[0]?.user_rating);
    const metacriticRating = parseNumber(item.external?.metacritic?.[0]?.user_rating);
    const rtRating = parseNumber(item.external?.rottentomatoes?.find(r => r.user_rating)?.user_rating);

    // Normalize ratings
    const normalizedRatings = [
      imdbRating,
      metacriticRating ? metacriticRating / 10 : null,
      rtRating ? rtRating / 10 : null
    ].filter(r => r !== null);

    const averageRating = normalizedRatings.length
      ? (normalizedRatings.reduce((a, b) => a + b, 0) / normalizedRatings.length).toFixed(1)
      : (4.0 + Math.random() * 1.0).toFixed(1);

    const subtype = item.subtype?.split(':').pop();
    const tags = Array.isArray(item.tags)
      ? item.tags.map(tag => typeof tag === 'object' && tag.name ? tag.name : tag)
      : ["Curated", "Cultural"];

    return {
      id: item.id,
      title: item.name || `Discovery ${index + 1}`,
      description: item.properties?.description || `Explore this ${subtype || 'cultural item'}.`,
      category: subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : "Unknown",
      rating: Number(averageRating),
      trending: item.relevance_score ? item.relevance_score > 0.75 : Math.random() > 0.7,
      image: item.properties?.image?.url || generateFallbackImage(index),
      tags,
      website: item.properties?.websites?.[0] || null,
      releaseYear: item.properties?.release_year,
      relevanceScore: item.relevance_score || Math.random(),
      metadata: {
        type: item.type,
        subtype: item.subtype,
        external: item.external,
        properties: item.properties
      }
    };
  });
}

function generateFallbackImage(index) {
  const images = [
    'https://images.unsplash.com/photo-1489599510096-93ee2a83c1bc?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop'
  ];
  return images[index % images.length];
}

function generateFallbackData(query) {
  const categories = ['Film', 'Music', 'Literature', 'Art', 'Design'];
  const titles = [
    'The Cinematic Journey', 'Melodic Discoveries', 'Literary Treasures',
    'Artistic Visions', 'Design Innovations', 'Cultural Explorations',
    'Creative Expressions', 'Modern Masterpieces', 'Timeless Classics'
  ];
  
  return Array.from({ length: 10 }, (_, i) => ({
    id: `fallback-${i}`,
    title: titles[i % titles.length],
    description: `Discover amazing cultural content in ${categories[i % categories.length].toLowerCase()}.`,
    category: categories[i % categories.length],
    rating: (4.0 + Math.random() * 1.0).toFixed(1),
    trending: i % 3 === 0,
    image: generateFallbackImage(i),
    tags: ['Curated', 'Cultural', 'Trending'],
    website: null,
    fallback: true
  }));
}

async function addToUserHistory(userId, discoveries) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    discoveries.forEach(discovery => {
      user.recommendations.push({
        itemId: discovery.id,
        title: discovery.title,
        description: discovery.description,
        category: discovery.category,
        rating: discovery.rating,
        image: discovery.image,
        tags: discovery.tags,
        source: 'discover',
        metadata: discovery.metadata || {},
        createdAt: new Date()
      });
    });

    // Keep only last 1000 recommendations
    if (user.recommendations.length > 1000) {
      user.recommendations = user.recommendations.slice(-1000);
    }

    await user.save();
  } catch (error) {
    console.error('Error adding to user history:', error);
  }
}

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

module.exports = router;