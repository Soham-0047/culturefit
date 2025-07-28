const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/auth');
const User = require('../models/User');
const axios = require('axios');

// LLM Service Configuration with Fallback Models
class LLMService {
  constructor() {
    this.openRouterConfig = {
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'X-Title': 'CultureSense AI'
      }
    };
    
    this.togetherConfig = {
      baseURL: 'https://api.together.xyz/v1',
      headers: {
        'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    // Define primary and fallback models
    this.models = {
      openrouter: {
        primary: 'anthropic/claude-3.5-sonnet',
        fallback: process.env.OPENROUTER_DEFAULT_MODEL || 'moonshotai/kimi-k2:free'
      },
      together: {
        primary: 'meta-llama/Llama-3-70b-chat-hf',
        fallback: process.env.TOGETHER_DEFAULT_MODEL || 'Qwen/Qwen3-Coder-480B-A35B-Instruct-FP8'
      }
    };
  }

  async callOpenRouter(messages, model = null, retryCount = 0) {
    const maxRetries = 2;
    const modelToUse = model || (retryCount === 0 ? this.models.openrouter.primary : this.models.openrouter.fallback);
    
    try {
      console.log(`Attempting OpenRouter call with model: ${modelToUse} (attempt ${retryCount + 1})`);
      
      const response = await axios.post(`${this.openRouterConfig.baseURL}/chat/completions`, {
        model: modelToUse,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      }, { 
        headers: this.openRouterConfig.headers,
        timeout: 30000 // 30 second timeout
      });
      
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenRouter API');
      }
      
      console.log(`OpenRouter call successful with model: ${modelToUse}`);
      return content;
      
    } catch (error) {
      console.error(`OpenRouter API Error (attempt ${retryCount + 1}):`, {
        model: modelToUse,
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      // If primary model fails and we haven't tried fallback yet
      if (retryCount === 0 && modelToUse === this.models.openrouter.primary) {
        console.log('Retrying with fallback model...');
        return this.callOpenRouter(messages, null, retryCount + 1);
      }
      
      // If fallback also fails or max retries reached
      if (retryCount < maxRetries) {
        console.log(`Retrying with same model after ${(retryCount + 1) * 2} seconds...`);
        await this.delay((retryCount + 1) * 2000);
        return this.callOpenRouter(messages, modelToUse, retryCount + 1);
      }
      
      throw new Error(`Failed to generate AI analysis after ${maxRetries + 1} attempts. Last error: ${error.message}`);
    }
  }

  async callTogether(messages, model = null, retryCount = 0) {
    const maxRetries = 2;
    const modelToUse = model || (retryCount === 0 ? this.models.together.primary : this.models.together.fallback);
    
    try {
      console.log(`Attempting Together AI call with model: ${modelToUse} (attempt ${retryCount + 1})`);
      
      const response = await axios.post(`${this.togetherConfig.baseURL}/chat/completions`, {
        model: modelToUse,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: false
      }, { 
        headers: this.togetherConfig.headers,
        timeout: 30000 // 30 second timeout
      });
      
      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from Together AI API');
      }
      
      console.log(`Together AI call successful with model: ${modelToUse}`);
      return content;
      
    } catch (error) {
      console.error(`Together AI API Error (attempt ${retryCount + 1}):`, {
        model: modelToUse,
        error: error.response?.data || error.message,
        status: error.response?.status
      });
      
      // If primary model fails and we haven't tried fallback yet
      if (retryCount === 0 && modelToUse === this.models.together.primary) {
        console.log('Retrying with fallback model...');
        return this.callTogether(messages, null, retryCount + 1);
      }
      
      // If fallback also fails or max retries reached
      if (retryCount < maxRetries) {
        console.log(`Retrying with same model after ${(retryCount + 1) * 2} seconds...`);
        await this.delay((retryCount + 1) * 2000);
        return this.callTogether(messages, modelToUse, retryCount + 1);
      }
      
      throw new Error(`Failed to generate AI analysis after ${maxRetries + 1} attempts. Last error: ${error.message}`);
    }
  }

  // Hybrid call method - try both services with their fallbacks
  async callHybrid(messages, preferredService = 'openrouter') {
    try {
      if (preferredService === 'openrouter') {
        return await this.callOpenRouter(messages);
      } else {
        return await this.callTogether(messages);
      }
    } catch (error) {
      console.log(`Primary service ${preferredService} failed, trying alternative...`);
      
      try {
        if (preferredService === 'openrouter') {
          return await this.callTogether(messages);
        } else {
          return await this.callOpenRouter(messages);
        }
      } catch (fallbackError) {
        console.error('Both services failed:', {
          primary: error.message,
          fallback: fallbackError.message
        });
        throw new Error('All AI services are currently unavailable. Please try again later.');
      }
    }
  }

  // Utility method for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Method to get available models
  getAvailableModels() {
    return {
      openrouter: this.models.openrouter,
      together: this.models.together
    };
  }

  // Method to validate JSON response
  validateAndParseJSON(content, fallbackValue = {}) {
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON response:', error.message);
      console.log('Raw content:', content);
      
      // Try to extract JSON from markdown code blocks
      const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[1]);
        } catch (parseError) {
          console.error('Failed to parse extracted JSON:', parseError.message);
        }
      }
      
      // Return fallback value or try to create a structured response
      return fallbackValue || {
        error: 'Failed to parse AI response',
        rawContent: content.substring(0, 500) // Truncate for safety
      };
    }
  }
}

const llmService = new LLMService();

// AI-Powered Personality Analysis
router.get('/personality-analysis', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    
    // Gather user data for analysis
    const userData = {
      preferences: user.preferences || {},
      favorites: user.favorites?.slice(0, 10).map(fav => ({
        type: fav.category,
        title: fav.title,
        genre: fav.subcategory,
        tags: fav.tags,
        rating: fav.rating
      })) || [],
      culturalProfile: user.culturalProfile || {},
      recentActivity: user.recentActivity?.slice(0, 20) || []
    };

    const analysisPrompt = [
      {
        role: 'system',
        content: `You are a cultural psychology expert analyzing user preferences. Provide insights into their personality, taste evolution, and cultural identity based on their data. Be insightful but respectful. Always respond with valid JSON.`
      },
      {
        role: 'user',
        content: `Analyze this user's cultural profile and provide a detailed personality analysis:

User Data: ${JSON.stringify(userData, null, 2)}

Please provide a JSON response with:
{
  "coreTraits": ["trait1", "trait2", "trait3"],
  "tasteEvolution": {
    "pattern": "expanding|focusing|stable|exploring",
    "direction": "description",
    "confidence": 85
  },
  "hiddenInterests": ["interest1", "interest2"],
  "culturalIdentity": {
    "primary": "identity",
    "influences": ["influence1", "influence2"]
  },
  "growthRecommendations": ["rec1", "rec2", "rec3"],
  "confidence": 90
}`
      }
    ];

    const analysis = await llmService.callHybrid(analysisPrompt, 'openrouter');
    const parsedAnalysis = llmService.validateAndParseJSON(analysis, {
      coreTraits: ["Cultural Explorer", "Open-minded", "Curious"],
      tasteEvolution: { pattern: "exploring", direction: "diverse interests", confidence: 75 },
      hiddenInterests: ["experimental art", "world music"],
      culturalIdentity: { primary: "eclectic", influences: ["contemporary", "traditional"] },
      growthRecommendations: ["explore new genres", "attend cultural events"],
      confidence: 75
    });
    
    // Update user's AI insights
    user.aiInsights.lastPersonalityAnalysis = new Date();
    user.aiInsights.personalityScore = parsedAnalysis.confidence || 75;
    await user.save();
    
    res.json({
      success: true,
      analysis: parsedAnalysis,
      generatedAt: new Date().toISOString(),
      model: 'hybrid'
    });

  } catch (error) {
    console.error('Personality analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate personality analysis',
      message: error.message,
      fallbackAvailable: true
    });
  }
});

// Trend Prediction with AI
router.get('/trend-predictions', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { timeframe = '6months', categories = 'all' } = req.query;

    // Get current trending data
    const trendingData = await getTrendingData(categories);
    
    const predictionPrompt = [
      {
        role: 'system',
        content: `You are a cultural trend analyst with expertise in predicting future cultural movements. Analyze current trends and user preferences to make accurate predictions. Always respond with valid JSON.`
      },
      {
        role: 'user',
        content: `Based on current cultural trends and this user's preferences, predict future trends for the next ${timeframe}:

Current Trends: ${JSON.stringify(trendingData, null, 2)}
User Preferences: ${JSON.stringify(user.preferences, null, 2)}

Provide JSON response with:
{
  "predictions": [
    {
      "trend": "trend name",
      "category": "category",
      "confidence": 85,
      "timeline": "3-6 months",
      "reasoning": "explanation",
      "userRelevance": 90
    }
  ],
  "riskFactors": ["factor1", "factor2"],
  "opportunities": ["opportunity1", "opportunity2"]
}`
      }
    ];

    const predictions = await llmService.callHybrid(predictionPrompt, 'together');
    const parsedPredictions = llmService.validateAndParseJSON(predictions, {
      predictions: [{
        trend: "AI-Generated Art Mainstream Adoption",
        category: "art",
        confidence: 80,
        timeline: "3-6 months",
        reasoning: "Growing acceptance and integration",
        userRelevance: 75
      }],
      riskFactors: ["market volatility", "cultural resistance"],
      opportunities: ["early adoption advantage", "new creative tools"]
    });
    
    // Update user's AI insights
    user.aiInsights.lastTrendPrediction = new Date();
    await user.save();
    
    res.json({
      success: true,
      predictions: parsedPredictions,
      timeframe,
      generatedAt: new Date().toISOString(),
      model: 'hybrid'
    });

  } catch (error) {
    console.error('Trend prediction error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate trend predictions',
      message: error.message
    });
  }
});

// Smart Recommendations Engine
router.post('/smart-recommendations', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites');
    const { mood, context, exclusions = [] } = req.body;

    const recommendationPrompt = [
      {
        role: 'system',
        content: `You are an expert cultural curator with deep knowledge across all art forms. Generate highly personalized recommendations based on user data, current mood, and context. Always respond with valid JSON.`
      },
      {
        role: 'user',
        content: `Generate personalized cultural recommendations for this user:

User Profile: ${JSON.stringify({
  preferences: user.preferences,
  favorites: user.favorites?.slice(0, 10),
  culturalProfile: user.culturalProfile
}, null, 2)}

Current Context:
- Mood: ${mood}
- Context: ${context}
- Exclude: ${exclusions.join(', ')}

Provide JSON response with:
{
  "recommendations": [
    {
      "title": "title",
      "creator": "creator",
      "category": "category",
      "reasoning": "why recommended",
      "moodMatch": 95,
      "discoveryLevel": "mainstream|niche|underground",
      "tags": ["tag1", "tag2"]
    }
  ]
}`
      }
    ];

    const recommendations = await llmService.callHybrid(recommendationPrompt, 'openrouter');
    const parsedRecommendations = llmService.validateAndParseJSON(recommendations, {
      recommendations: [{
        title: "Recommendation unavailable",
        creator: "System",
        category: "general",
        reasoning: "Service temporarily unavailable",
        moodMatch: 50,
        discoveryLevel: "mainstream",
        tags: ["fallback"]
      }]
    });
    
    // Add recommendations to user's history
    if (parsedRecommendations.recommendations) {
      parsedRecommendations.recommendations.forEach(rec => {
        if (user.recommendations.length < 200) {
          user.recommendations.push({
            title: rec.title,
            description: rec.reasoning,
            category: rec.category,
            tags: rec.tags || [],
            confidence: rec.moodMatch || 75,
            source: 'ai_generated',
            metadata: { mood, context, creator: rec.creator }
          });
        }
      });
      await user.save();
    }
    
    res.json({
      success: true,
      recommendations: parsedRecommendations,
      context: { mood, context },
      generatedAt: new Date().toISOString(),
      model: 'hybrid'
    });

  } catch (error) {
    console.error('Smart recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate smart recommendations',
      message: error.message
    });
  }
});

// Cultural Compatibility Analysis
router.post('/compatibility-analysis', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { targetUserId, culturalItems } = req.body;

    let targetData = {};
    if (targetUserId) {
      const targetUser = await User.findById(targetUserId).populate('favorites');
      targetData = {
        preferences: targetUser.preferences,
        favorites: targetUser.favorites?.slice(0, 10)
      };
    } else if (culturalItems) {
      targetData = { culturalItems };
    }

    const compatibilityPrompt = [
      {
        role: 'system',
        content: `You are a cultural compatibility analyst. Analyze compatibility between users or between a user and specific cultural items. Always respond with valid JSON.`
      },
      {
        role: 'user',
        content: `Analyze cultural compatibility:

User 1 Profile: ${JSON.stringify({
  preferences: user.preferences,
  favorites: user.favorites?.slice(0, 10)
}, null, 2)}

${targetUserId ? 'User 2 Profile:' : 'Target Cultural Items:'} ${JSON.stringify(targetData, null, 2)}

Provide JSON response with:
{
  "compatibilityScore": 85,
  "sharedInterests": ["interest1", "interest2"],
  "complementaryDifferences": ["difference1", "difference2"],
  "conflictAreas": ["conflict1"],
  "recommendations": ["rec1", "rec2"],
  "growthOpportunities": ["opportunity1", "opportunity2"]
}`
      }
    ];

    const compatibility = await llmService.callHybrid(compatibilityPrompt, 'together');
    const parsedCompatibility = llmService.validateAndParseJSON(compatibility, {
      compatibilityScore: 75,
      sharedInterests: ["contemporary art", "indie music"],
      complementaryDifferences: ["different genres", "varied perspectives"],
      conflictAreas: ["pacing preferences"],
      recommendations: ["explore together", "share favorites"],
      growthOpportunities: ["learn from differences", "expand horizons"]
    });
    
    res.json({
      success: true,
      compatibility: parsedCompatibility,
      generatedAt: new Date().toISOString(),
      model: 'hybrid'
    });

  } catch (error) {
    console.error('Compatibility analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate compatibility analysis',
      message: error.message
    });
  }
});

// Cultural Journey Generator
router.post('/cultural-journey', requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { goal, duration, intensity = 'moderate' } = req.body;

    const journeyPrompt = [
      {
        role: 'system',
        content: `You are a cultural education specialist who creates personalized learning journeys. Design comprehensive cultural exploration paths. Always respond with valid JSON.`
      },
      {
        role: 'user',
        content: `Create a personalized cultural journey:

User Profile: ${JSON.stringify(user.preferences, null, 2)}
Goal: ${goal}
Duration: ${duration}
Intensity: ${intensity}

Provide JSON response with:
{
  "journey": {
    "title": "journey title",
    "description": "journey description",
    "weeks": [
      {
        "week": 1,
        "theme": "theme",
        "activities": ["activity1", "activity2"],
        "goals": ["goal1", "goal2"],
        "resources": ["resource1", "resource2"]
      }
    ]
  },
  "milestones": ["milestone1", "milestone2"],
  "measurements": ["metric1", "metric2"]
}`
      }
    ];

    const journey = await llmService.callHybrid(journeyPrompt, 'openrouter');
    const parsedJourney = llmService.validateAndParseJSON(journey, {
      journey: {
        title: "Cultural Exploration Journey",
        description: "A personalized path to expand your cultural horizons",
        weeks: [{
          week: 1,
          theme: "Foundation Building",
          activities: ["Explore your current favorites", "Identify preferences"],
          goals: ["Understand your taste", "Set learning objectives"],
          resources: ["Online galleries", "Music platforms"]
        }]
      },
      milestones: ["Complete week 1", "Discover new interest"],
      measurements: ["Engagement level", "Diversity score"]
    });
    
    res.json({
      success: true,
      journey: parsedJourney,
      goal,
      duration,
      generatedAt: new Date().toISOString(),
      model: 'hybrid'
    });

  } catch (error) {
    console.error('Cultural journey error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate cultural journey',
      message: error.message
    });
  }
});

// Content Analysis and Insights
router.post('/analyze-content', requireAuth, async (req, res) => {
  try {
    const { contentData, analysisType = 'comprehensive' } = req.body;
    const user = await User.findById(req.user.id);

    const analysisPrompt = [
      {
        role: 'system',
        content: `You are a cultural critic and analyst with expertise across all art forms. Provide deep, insightful analysis of cultural content. Always respond with valid JSON.`
      },
      {
        role: 'user',
        content: `Provide ${analysisType} analysis of this cultural content:

Content: ${JSON.stringify(contentData, null, 2)}
User Context: ${JSON.stringify(user.preferences, null, 2)}

Provide JSON response with:
{
  "analysis": {
    "significance": "cultural significance",
    "context": "historical context",
    "technical": "technical assessment",
    "emotional": "emotional impact",
    "relevance": 85,
    "similarWorks": ["work1", "work2"],
    "learningOpportunities": ["opportunity1", "opportunity2"]
  },
  "scores": {
    "artistic": 90,
    "cultural": 85,
    "personal": 80
  }
}`
      }
    ];

    const analysis = await llmService.callHybrid(analysisPrompt, 'together');
    const parsedAnalysis = llmService.validateAndParseJSON(analysis, {
      analysis: {
        significance: "Culturally significant work",
        context: "Contemporary context",
        technical: "Well-executed",
        emotional: "Emotionally engaging",
        relevance: 75,
        similarWorks: ["Similar Work 1", "Similar Work 2"],
        learningOpportunities: ["Explore genre", "Study technique"]
      },
      scores: {
        artistic: 75,
        cultural: 75,
        personal: 75
      }
    });
    
    res.json({
      success: true,
      analysis: parsedAnalysis,
      contentData,
      analysisType,
      generatedAt: new Date().toISOString(),
      model: 'hybrid'
    });

  } catch (error) {
    console.error('Content analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze content',
      message: error.message
    });
  }
});

// Service health check endpoint
router.get('/health', async (req, res) => {
  try {
    const models = llmService.getAvailableModels();
    
    res.json({
      success: true,
      status: 'healthy',
      services: {
        openrouter: {
          available: !!process.env.OPENROUTER_API_KEY,
          models: models.openrouter
        },
        together: {
          available: !!process.env.TOGETHER_API_KEY,
          models: models.together
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error.message
    });
  }
});

// Helper function to get trending data
async function getTrendingData(categories) {
  // This should fetch actual trending data from your database
  // For now, returning mock data structure
  return {
    categories: categories === 'all' ? ['music', 'film', 'art', 'literature'] : [categories],
    trends: [
      { name: 'Minimalist Design', growth: 45, category: 'art', confidence: 85 },
      { name: 'Neo-Soul Revival', growth: 38, category: 'music', confidence: 78 },
      { name: 'Sustainable Fashion', growth: 52, category: 'design', confidence: 92 },
      { name: 'Interactive Storytelling', growth: 41, category: 'literature', confidence: 73 }
    ],
    timeframe: 'last_30_days',
    updated: new Date().toISOString()
  };
}

module.exports = router;