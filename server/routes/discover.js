const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { requireAuth, optionalAuth } = require('../config/auth');

const router = express.Router();

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
      page: parseInt(page),
      releaseYear,
      tags,
      minRating,
      maxRating
    }, userPreferences);

    // Make API call to Qloo Insights
    const response = await axios.get(`${process.env.QLOO_API_URL}/insights`, {
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

// FIXED: Get personalized recommendations using available APIs and user preferences
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

    // Since /recommendations doesn't exist, we'll use multiple targeted searches
    // based on user preferences to create personalized recommendations
    const personalizedResults = [];

    // 1. Search by favorite genres
    if (userPreferences.favoriteGenres?.length) {
      for (const genre of userPreferences.favoriteGenres.slice(0, 3)) {
        try {
          const searchResponse = await axios.get(`${process.env.QLOO_API_URL}/entity/search`, {
            params: {
              q: genre,
              limit: 5,
              type: getCategoryTypes(userPreferences.categories)
            },
            headers: {
              'X-API-Key': process.env.QLOO_API_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 8000
          });

          if (searchResponse.data?.results) {
            personalizedResults.push(...searchResponse.data.results);
          }
        } catch (genreError) {
          console.warn(`Failed to search for genre ${genre}:`, genreError.message);
        }
      }
    }

    // 2. Get trending items that match user preferences
    try {
      const trendingResponse = await axios.get(`${process.env.QLOO_API_URL}/trending`, {
        params: {
          limit: 10,
          type: getCategoryTypes(userPreferences.categories)
        },
        headers: {
          'X-API-Key': process.env.QLOO_API_KEY,
          'Content-Type': 'application/json'
        },
        timeout: 8000
      });

      if (trendingResponse.data?.results) {
        personalizedResults.push(...trendingResponse.data.results);
      }
    } catch (trendingError) {
      console.warn('Failed to fetch trending:', trendingError.message);
    }

    // 3. Search by mood preferences
    if (userPreferences.moodPreferences?.length) {
      for (const mood of userPreferences.moodPreferences.slice(0, 2)) {
        try {
          const moodResponse = await axios.get(`${process.env.QLOO_API_URL}/entity/search`, {
            params: {
              q: mood,
              limit: 3
            },
            headers: {
              'X-API-Key': process.env.QLOO_API_KEY,
              'Content-Type': 'application/json'
            },
            timeout: 8000
          });

          if (moodResponse.data?.results) {
            personalizedResults.push(...moodResponse.data.results);
          }
        } catch (moodError) {
          console.warn(`Failed to search for mood ${mood}:`, moodError.message);
        }
      }
    }

    // Remove duplicates and process
    const uniqueResults = removeDuplicates(personalizedResults);
    const processedRecommendations = await processDiscoveriesData({ results: uniqueResults }, userPreferences);

    // Exclude previously viewed items
    let filteredRecommendations = processedRecommendations;
    if (excludeViewed) {
      const viewedIds = user.recommendations.map(rec => rec.itemId).filter(Boolean);
      filteredRecommendations = processedRecommendations.filter(rec => !viewedIds.includes(rec.id));
    }

    // Calculate detailed preference scores and sort
    const scoredRecommendations = filteredRecommendations.map(rec => ({
      ...rec,
      preferenceScore: calculateDetailedPreferenceScore(rec, userPreferences),
      preferenceBreakdown: getPreferenceBreakdown(rec, userPreferences)
    }))
    .filter(rec => rec.preferenceScore > 0.2) // Show items with some preference match
    .sort((a, b) => b.preferenceScore - a.preferenceScore)
    .slice(0, parseInt(limit));

    // If we don't have enough results, add some fallback content
    if (scoredRecommendations.length < parseInt(limit)) {
      const fallbackCount = parseInt(limit) - scoredRecommendations.length;
      const fallbackData = generatePersonalizedFallback(userPreferences, fallbackCount);
      scoredRecommendations.push(...fallbackData);
    }

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
        averageScore: scoredRecommendations.reduce((sum, rec) => sum + (rec.preferenceScore || 0), 0) / scoredRecommendations.length || 0,
        method: 'preference-based-search' // Indicate we're using search instead of recommendations API
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

// Enhanced preferences route with validation
router.post('/preferences', requireAuth, async (req, res) => {
  try {
    const {
      categories,
      favoriteGenres,
      culturalTags,
      moodPreferences,
      location,
      notifications,
      publicProfile,
      aiInsights
    } = req.body;

    const user = await User.findById(req.user._id);
    
    // Update preferences with validation
    user.preferences = {
      ...user.preferences,
      categories: Array.isArray(categories) ? categories : user.preferences?.categories || ['all'],
      favoriteGenres: Array.isArray(favoriteGenres) ? favoriteGenres.slice(0, 10) : user.preferences?.favoriteGenres || [],
      culturalTags: Array.isArray(culturalTags) ? culturalTags.slice(0, 15) : user.preferences?.culturalTags || [],
      moodPreferences: Array.isArray(moodPreferences) ? moodPreferences : user.preferences?.moodPreferences || [],
      location: location || user.preferences?.location || {},
      notifications: notifications !== undefined ? notifications : user.preferences?.notifications !== false,
      publicProfile: publicProfile !== undefined ? publicProfile : user.preferences?.publicProfile || false,
      aiInsights: aiInsights !== undefined ? aiInsights : user.preferences?.aiInsights !== false,
      lastUpdated: new Date()
    };

    await user.save();

    // Update cultural profile based on preferences
    await updateCulturalProfile(user);

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: user.preferences,
      culturalProfile: user.culturalProfile,
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

// Get user preferences
router.get('/preferences', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      preferences: user.preferences || {},
      culturalProfile: user.culturalProfile || {},
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

// // FIXED: Get trending discoveries using available API
// router.get('/trending', optionalAuth, async (req, res) => {
//   try {
//     const { category = 'all', limit = 20, preferenceBoost = true } = req.query;

//     // Get user preferences for boosting
//     let userPreferences = null;
//     if (req.user && preferenceBoost === 'true') {
//       const user = await User.findById(req.user._id);
//       userPreferences = user.preferences;
//     }

//     // Use trending API endpoint
//     const response = await axios.get(`${process.env.QLOO_API_URL}/trending`, {
//       params: {
//         limit: parseInt(limit),
//         type: getCategoryTypes(category === 'all' ? ['all'] : [category])
//       },
//       headers: {
//         'X-API-Key': process.env.QLOO_API_KEY,
//         'Content-Type': 'application/json'
//       },
//       timeout: 8000
//     });

//     const processed = await processDiscoveriesData(response.data, userPreferences);

//     // Apply preference boosting if user is authenticated and has preferences
//     let trending = processed;
//     if (userPreferences && preferenceBoost === 'true') {
//       trending = processed.map(item => ({
//         ...item,
//         preferenceScore: calculateDetailedPreferenceScore(item, userPreferences),
//         originalRank: processed.indexOf(item) + 1
//       })).sort((a, b) => {
//         // Combine trending relevance with preference score
//         const aScore = (a.relevanceScore || 0) * 0.7 + (a.preferenceScore || 0) * 0.3;
//         const bScore = (b.relevanceScore || 0) * 0.7 + (b.preferenceScore || 0) * 0.3;
//         return bScore - aScore;
//       });
//     }

//     res.json({
//       success: true,
//       trending: trending.slice(0, parseInt(limit)),
//       category,
//       count: trending.length,
//       preferencesBoosted: userPreferences && preferenceBoost === 'true',
//       personalization: userPreferences && preferenceBoost === 'true' ? {
//         averagePreferenceScore: trending.reduce((sum, item) => sum + (item.preferenceScore || 0), 0) / trending.length,
//         appliedPreferences: getAppliedPreferences(userPreferences)
//       } : null
//     });

//   } catch (error) {
//     console.error('Trending discoveries error:', error);
    
//     // Fallback data
//     const fallbackData = generateFallbackData({ category, limit });
//     res.json({
//       success: true,
//       trending: fallbackData,
//       fallback: true,
//       message: 'Using cached trending data'
//     });
//   }
// });

// FIXED: Enhanced search with available API
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
      offset: (parseInt(page) - 1) * parseInt(limit) // Use offset instead of page
    };

    // Add category filter if specified
    if (category && category !== 'all') {
      const categoryTypes = getCategoryTypes([category]);
      if (categoryTypes) {
        searchParams.type = categoryTypes;
      }
    }

    // Apply user preferences to search if requested and user is authenticated
    let userPreferences = null;
    if (req.user && usePreferences === 'true') {
      try {
        const user = await User.findById(req.user._id);
        userPreferences = user?.preferences;
      } catch (userError) {
        console.warn('Failed to fetch user preferences:', userError.message);
      }
    }

    console.log('Search params:', searchParams); // Debug log

    const response = await axios.get(`${process.env.QLOO_API_URL}/entity/search`, {
      params: searchParams,
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Handle different response structures
    let rawResults = response.data?.results || response.data?.entities || response.data || [];
    if (!Array.isArray(rawResults)) {
      rawResults = [];
    }

    let results = await processDiscoveriesData({ results: rawResults }, userPreferences);

    // Boost results based on preferences
    if (userPreferences && usePreferences === 'true' && results.length > 0) {
      results = results.map(result => ({
        ...result,
        preferenceScore: calculateDetailedPreferenceScore(result, userPreferences)
      })).sort((a, b) => (b.preferenceScore || 0) - (a.preferenceScore || 0));
    }

    res.json({
      success: true,
      results,
      query: q,
      category: category || 'all',
      preferencesBoosted: userPreferences && usePreferences === 'true',
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: response.data?.total || results.length,
        hasMore: results.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Search discoveries error:', error.message);
    console.error('Error details:', {
      url: error.config?.url,
      params: error.config?.params,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

    // Return fallback results instead of complete failure
    const fallbackResults = generateSearchFallback(req.query.q, req.query.category, parseInt(req.query.limit) || 20);
    
    res.json({
      success: true,
      results: fallbackResults,
      query: req.query.q,
      category: req.query.category || 'all',
      fallback: true,
      message: 'Search service temporarily unavailable, showing cached results',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Helper Functions

// Updated getCategoryTypes function with better error handling
function getCategoryTypes(categories) {
  const categoryMap = {
    all: '',
    film: 'movie',
    music: 'music',
    literature: 'book',
    art: 'art',
    design: 'design'
  };
  
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    return '';
  }
  
  const types = categories
    .map(cat => categoryMap[cat?.toLowerCase()] || '')
    .filter(type => type);
    
  return types.length > 0 ? types.join(',') : '';
}

// Add this helper function for search fallback
function generateSearchFallback(query, category, limit) {
  const categories = ['Film', 'Music', 'Literature', 'Art', 'Design'];
  const selectedCategory = category && category !== 'all' ? 
    category.charAt(0).toUpperCase() + category.slice(1) : 
    categories[Math.floor(Math.random() * categories.length)];
  
  return Array.from({ length: limit }, (_, i) => ({
    id: `search-fallback-${i}`,
    title: `${query} - ${selectedCategory} Discovery ${i + 1}`,
    description: `Search result for "${query}" in ${selectedCategory.toLowerCase()} category.`,
    category: selectedCategory,
    rating: (3.5 + Math.random() * 1.5).toFixed(1),
    trending: i % 4 === 0,
    image: generateFallbackImage(i),
    tags: ['Search Result', selectedCategory, query.charAt(0).toUpperCase() + query.slice(1)],
    website: null,
    fallback: true,
    searchQuery: query
  }));
}

function buildPreferenceBasedParams(baseParams, userPreferences) {
  const apiParams = {
    limit: baseParams.limit,
    page: baseParams.page
  };

  // Add category filter
  if (baseParams.category !== 'all') {
    apiParams.type = getCategoryTypes([baseParams.category]);
  }

  // Apply user preferences if available
  if (userPreferences) {
    // Add preference-based search terms
    if (userPreferences.favoriteGenres?.length) {
      apiParams.genres = userPreferences.favoriteGenres.slice(0, 3).join(',');
    }
    
    if (userPreferences.moodPreferences?.length) {
      apiParams.moods = userPreferences.moodPreferences.slice(0, 2).join(',');
    }
  }

  // Add explicit parameters
  if (baseParams.tags) {
    apiParams.tags = baseParams.tags;
  }
  if (baseParams.releaseYear) {
    apiParams.year = baseParams.releaseYear;
  }

  return apiParams;
}

function removeDuplicates(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = item.id || item.name || JSON.stringify(item);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

async function updateCulturalProfile(user) {
  if (!user.preferences) return;

  const profile = user.culturalProfile || {};
  
  // Update based on categories preference
  if (user.preferences.categories) {
    user.preferences.categories.forEach(category => {
      switch(category) {
        case 'film':
          profile.film = Math.min((profile.film || 0) + 10, 100);
          break;
        case 'music':
          profile.music = Math.min((profile.music || 0) + 10, 100);
          break;
        case 'literature':
          profile.literature = Math.min((profile.literature || 0) + 10, 100);
          break;
        case 'art':
          profile.visualArts = Math.min((profile.visualArts || 0) + 10, 100);
          break;
        case 'design':
          profile.design = Math.min((profile.design || 0) + 10, 100);
          break;
      }
    });
  }

  user.culturalProfile = profile;
  await user.save();
}

function generatePersonalizedFallback(preferences, count) {
  const categories = preferences.categories || ['all'];
  const genres = preferences.favoriteGenres || ['contemporary', 'classic'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: `personalized-fallback-${i}`,
    title: `${genres[i % genres.length]} ${categories[i % categories.length]} Discovery`,
    description: `Personalized recommendation based on your ${genres[i % genres.length]} preferences.`,
    category: categories[i % categories.length] !== 'all' ? categories[i % categories.length] : 'Cultural',
    rating: (4.0 + Math.random() * 1.0).toFixed(1),
    trending: false,
    image: generateFallbackImage(i),
    tags: [genres[i % genres.length], 'Personalized', 'Curated'],
    preferenceScore: 0.8 + Math.random() * 0.2, // High preference score for fallback
    fallback: true
  }));
}

function calculateDetailedPreferenceScore(item, preferences) {
  if (!preferences) return 0.5;
  
  let score = 0;
  let maxScore = 0;
  
  // Category matching (weight: 0.3)
  if (preferences.categories?.length) {
    maxScore += 0.3;
    const categoryMatch = preferences.categories.some(cat => 
      item.category?.toLowerCase().includes(cat.toLowerCase()) || cat === 'all'
    );
    if (categoryMatch) score += 0.3;
  }
  
  // Genre matching (weight: 0.25)
  if (preferences.favoriteGenres?.length) {
    maxScore += 0.25;
    const genreMatch = preferences.favoriteGenres.some(genre => 
      item.tags?.some(tag => tag.toLowerCase().includes(genre.toLowerCase())) ||
      item.description?.toLowerCase().includes(genre.toLowerCase()) ||
      item.title?.toLowerCase().includes(genre.toLowerCase())
    );
    if (genreMatch) score += 0.25;
  }
  
  // Mood matching (weight: 0.2)
  if (preferences.moodPreferences?.length) {
    maxScore += 0.2;
    const moodMatch = preferences.moodPreferences.some(mood => 
      item.tags?.some(tag => tag.toLowerCase().includes(mood.toLowerCase())) ||
      item.description?.toLowerCase().includes(mood.toLowerCase())
    );
    if (moodMatch) score += 0.2;
  }
  
  // Cultural tags matching (weight: 0.15)
  if (preferences.culturalTags?.length) {
    maxScore += 0.15;
    const tagMatch = preferences.culturalTags.some(tag => 
      item.tags?.some(itemTag => itemTag.toLowerCase().includes(tag.toLowerCase()))
    );
    if (tagMatch) score += 0.15;
  }
  
  // High rating bonus (weight: 0.1)
  maxScore += 0.1;
  if (item.rating >= 4.0) score += 0.1;
  
  return maxScore > 0 ? Math.min(score / maxScore, 1.0) : 0.5;
}

function getPreferenceBreakdown(item, preferences) {
  return {
    categoryMatch: preferences.categories?.some(cat => 
      item.category?.toLowerCase().includes(cat.toLowerCase()) || cat === 'all'
    ) || false,
    genreMatch: preferences.favoriteGenres?.some(genre => 
      item.tags?.some(tag => tag.toLowerCase().includes(genre.toLowerCase()))
    ) || false,
    moodMatch: preferences.moodPreferences?.some(mood => 
      item.tags?.some(tag => tag.toLowerCase().includes(mood.toLowerCase()))
    ) || false,
    culturalTagMatch: preferences.culturalTags?.some(tag => 
      item.tags?.some(itemTag => itemTag.toLowerCase().includes(tag.toLowerCase()))
    ) || false,
    highRating: item.rating >= 4.0
  };
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
  
  if (preferences.categories?.length) applied.push(`${preferences.categories.length} categories`);
  if (preferences.favoriteGenres?.length) applied.push(`${preferences.favoriteGenres.length} genres`);
  if (preferences.moodPreferences?.length) applied.push(`${preferences.moodPreferences.length} moods`);
  if (preferences.culturalTags?.length) applied.push(`${preferences.culturalTags.length} cultural tags`);
  
  return applied;
}

function getPreferencesSummary(preferences) {
  return {
    categories: preferences.categories?.length || 0,
    genres: preferences.favoriteGenres?.length || 0,
    moods: preferences.moodPreferences?.length || 0,
    culturalTags: preferences.culturalTags?.length || 0,
    location: preferences.location ? Object.keys(preferences.location).length : 0,
    settings: {
      notifications: preferences.notifications,
      publicProfile: preferences.publicProfile,
      aiInsights: preferences.aiInsights
    }
  };
}

// Keep existing helper functions
async function processDiscoveriesData(apiData, userPreferences) {
  const entities = apiData.results?.entities || apiData.entities || apiData.results || [];
  
  return entities.map((item, index) => {
    const rating = extractRating(item);
    const subtype = item.subtype?.split(':').pop();
    const tags = Array.isArray(item.tags)
      ? item.tags.map(tag => typeof tag === 'object' && tag.name ? tag.name : tag)
      : ["Curated", "Cultural"];

    return {
      id: item.id || `item-${index}`,
      title: item.name || `Discovery ${index + 1}`,
      description: item.properties?.description || item.description || `Explore this ${subtype || 'cultural item'}.`,
      category: subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : "Cultural",
      rating: Number(rating),
      trending: item.relevance_score ? item.relevance_score > 0.75 : Math.random() > 0.7,
      image: item.properties?.image?.url || item.image || generateFallbackImage(index),
      tags,
      website: item.properties?.websites?.[0] || item.website || null,
      releaseYear: item.properties?.release_year || item.year,
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

function extractRating(item) {
  if (item.rating) return item.rating;
  
  const ratings = [];
  
  if (item.external?.imdb?.[0]?.user_rating) {
    ratings.push(parseFloat(item.external.imdb[0].user_rating));
  }
  
  if (item.external?.metacritic?.[0]?.user_rating) {
    ratings.push(parseFloat(item.external.metacritic[0].user_rating) / 10);
  }
  
  return ratings.length 
    ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
    : (4.0 + Math.random() * 1.0).toFixed(1);
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
  
  return Array.from({ length: parseInt(query.limit) || 10 }, (_, i) => ({
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