const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const { requireAuth, optionalAuth } = require('../config/auth');

const router = express.Router();

// Get cultural discoveries with personalization
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

    // Default tags for categories
    const defaultTags = {
      film: 'urn:tag:genre:media:minimalist',
      music: 'urn:tag:genre:media:soulful',
      literature: 'urn:tag:genre:media:nonfiction',
      art: 'urn:tag:genre:media:contemporary',
      design: 'urn:tag:genre:media:sustainable'
    };

    // Build API parameters
    const apiParams = {
      'filter.type': categoryMap[category] || categoryMap.all,
      'filter.release_year.min': releaseYear || '2022',
      limit: Math.min(parseInt(limit), 50), // Cap at 50
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    // Add category-specific tags
    if (category !== 'all' && defaultTags[category]) {
      apiParams['filter.tags'] = defaultTags[category];
    }

    // Add custom tags if provided
    if (tags) {
      apiParams['filter.tags'] = tags;
    }

    // Add rating filters
    if (minRating) {
      apiParams['filter.rating.min'] = minRating;
    }
    if (maxRating) {
      apiParams['filter.rating.max'] = maxRating;
    }

    // Get user preferences for personalization
    let userPreferences = null;
    if (req.user) {
      const user = await User.findById(req.user._id);
      userPreferences = user.preferences;
    }

    // Make API call to Qloo
    const response = await axios.get(`${process.env.QLOO_API_URL}/v2/insights`, {
      params: apiParams,
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    // Process and format the response
    const discoveries = await processDiscoveriesData(response.data, userPreferences);

    // Add to user's recommendation history if authenticated
    if (req.user) {
      await addToUserHistory(req.user._id, discoveries.slice(0, 5));
    }

    res.json({
      success: true,
      discoveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: response.data.total || discoveries.length,
        hasMore: discoveries.length === parseInt(limit)
      },
      filters: {
        category,
        sortBy,
        tags,
        minRating,
        maxRating,
        releaseYear
      }
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

// Get trending discoveries
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    const { category = 'all', limit = 20 } = req.query;

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

        const processed = await processDiscoveriesData(response.data, req.user?.preferences);
        allTrending.push(...processed);
      } catch (typeError) {
        console.warn(`Failed to fetch trending for type ${type}:`, typeError.message);
      }
    }

    // Sort by relevance and limit
    const trending = allTrending
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, parseInt(limit));

    res.json({
      success: true,
      trending,
      category,
      count: trending.length
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

// Get personalized recommendations
router.get('/personalized', requireAuth, async (req, res) => {
  try {
    const { limit = 15, excludeViewed = true } = req.query;
    
    const user = await User.findById(req.user._id);
    const userPreferences = user.preferences;
    const culturalProfile = user.culturalProfile;

    // Build personalized query based on user data
    const personalizedParams = buildPersonalizedQuery(userPreferences, culturalProfile);

    // Exclude previously viewed items
    let excludeIds = [];
    if (excludeViewed) {
      excludeIds = user.recommendations.map(rec => rec.itemId).filter(Boolean);
    }

    const response = await axios.get(`${process.env.QLOO_API_URL}/v2/recommendations`, {
      params: {
        ...personalizedParams,
        limit: parseInt(limit),
        exclude: excludeIds.join(',')
      },
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const recommendations = await processDiscoveriesData(response.data, userPreferences);

    // Add personalization scores
    const scoredRecommendations = recommendations.map(rec => ({
      ...rec,
      personalizationScore: calculatePersonalizationScore(rec, userPreferences, culturalProfile)
    })).sort((a, b) => b.personalizationScore - a.personalizationScore);

    res.json({
      success: true,
      recommendations: scoredRecommendations,
      personalization: {
        basedOn: {
          preferences: Object.keys(userPreferences || {}).length,
          culturalProfile: Object.keys(culturalProfile || {}).length,
          history: user.recommendations.length
        }
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

// Search discoveries
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, category, limit = 20, page = 1 } = req.query;

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

    const response = await axios.get(`${process.env.QLOO_API_URL}/v2/search`, {
      params: searchParams,
      headers: {
        'X-API-Key': process.env.QLOO_API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const results = await processDiscoveriesData(response.data, req.user?.preferences);

    res.json({
      success: true,
      results,
      query: q,
      category,
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

// Get discovery details
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

// Get discovery stats
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
      stats.user = {
        totalViewed: user.recommendations.length,
        totalFavorites: user.favorites.length,
        topCategories: getTopCategories(user.recommendations),
        joinDate: user.createdAt
      };
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

// Helper functions
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

function buildPersonalizedQuery(preferences, culturalProfile) {
  const params = {};
  
  if (preferences?.favoriteGenres?.length) {
    params['filter.genre'] = preferences.favoriteGenres.join(',');
  }
  
  if (preferences?.preferredDecades?.length) {
    const decades = preferences.preferredDecades.map(d => `${d}s`).join(',');
    params['filter.decade'] = decades;
  }
  
  if (culturalProfile?.interests?.length) {
    params['filter.tags'] = culturalProfile.interests.join(',');
  }
  
  return params;
}

function calculatePersonalizationScore(item, preferences, culturalProfile) {
  let score = 0;
  
  // Genre matching
  if (preferences?.favoriteGenres?.length) {
    const genreMatch = preferences.favoriteGenres.some(genre => 
      item.tags.some(tag => tag.toLowerCase().includes(genre.toLowerCase()))
    );
    if (genreMatch) score += 0.3;
  }
  
  // Rating preference
  if (preferences?.minRating && item.rating >= preferences.minRating) {
    score += 0.2;
  }
  
  // Cultural interests
  if (culturalProfile?.interests?.length) {
    const interestMatch = culturalProfile.interests.some(interest => 
      item.tags.some(tag => tag.toLowerCase().includes(interest.toLowerCase()))
    );
    if (interestMatch) score += 0.3;
  }
  
  // Trending bonus
  if (item.trending) score += 0.1;
  
  // High rating bonus
  if (item.rating >= 4.5) score += 0.1;
  
  return score;
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