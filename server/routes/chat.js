// server/routes/chat.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../config/auth');
// Uncomment if using Node.js < 18
// const fetch = require('node-fetch');

// Try to initialize Gemini AI
let genAI;
try {
  if (process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log('Gemini AI initialized successfully');
  }
} catch (error) {
  console.error('Failed to initialize Gemini AI:', error);
}

// In-memory chat history storage (in production, use a database)
const chatHistories = new Map();

// Cultural context for CultureSense AI
const CULTURAL_CONTEXT = `
You are CultureSense AI, an advanced cultural discovery assistant. Your expertise includes:
- Analyzing cultural preferences and taste patterns
- Recommending movies, music, books, art, and design
- Identifying cultural trends and influences
- Providing personalized cultural insights
- Understanding aesthetic preferences and artistic movements

Always respond in a helpful, knowledgeable, and culturally aware manner. When users ask about their preferences, provide thoughtful analysis and suggestions. Keep responses conversational but informative.
`;

// Gemini AI API call function
async function callGeminiAPI(prompt) {
  if (!genAI) {
    throw new Error('Gemini AI not initialized');
  }
  
  const model = genAI.getGenerativeModel({ model: 'models/gemini-1.0-pro-latest' });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Mistral AI API call function
async function callMistralAPI(prompt) {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error('MISTRAL_API_KEY is not set');
  }

  const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1000,
      temperature: 0.7
    })
  });
  console.log(response,"Here")
  if (!response.ok) {
    throw new Error(`Mistral API error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// Get static fallback response
function getStaticResponse(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('music')) {
    return "I'd love to help you explore music! While I'm experiencing some technical issues, I can suggest checking out trending artists on platforms like Spotify, Apple Music, or discovering new genres through music blogs and reviews.";
  } else if (lowerMessage.includes('movie') || lowerMessage.includes('film')) {
    return "Movies are a fantastic cultural medium! Consider exploring different film genres, international cinema, or checking out film festivals. Platforms like Letterboxd can also help you discover new films based on your taste.";
  } else if (lowerMessage.includes('book')) {
    return "Books offer incredible cultural insights! Try exploring different literary genres, contemporary authors, or classic literature. Goodreads can be a great platform for discovering books similar to your preferences.";
  } else if (lowerMessage.includes('art')) {
    return "Art is such a rich cultural expression! Consider visiting local galleries, exploring different art movements online, or discovering contemporary artists through platforms like Instagram or art magazines.";
  } else {
    return "I'm here to help you discover amazing cultural content! While I'm experiencing some technical difficulties, I'd love to assist you with exploring music, movies, books, art, and cultural trends. What interests you most?";
  }
}

// AI response function with fallbacks
async function getAIResponse(prompt) {
  console.log('Attempting AI response...');
  
  // Try Gemini first
  if (genAI && process.env.GEMINI_API_KEY) {
    try {
      console.log('Trying Gemini AI...');
      const response = await callGeminiAPI(prompt);
      console.log('Gemini AI succeeded');
      return response;
    } catch (error) {
      console.error('Gemini AI failed:', error.message);
    }
  }
  
  // Try Mistral as fallback
  if (process.env.MISTRAL_API_KEY) {
    try {
      console.log('Trying Mistral AI...');
      const response = await callMistralAPI(prompt);
      console.log('Mistral AI succeeded');
      return response;
    } catch (error) {
      console.error('Mistral AI failed:', error.message);
    }
  }
  
  // Static fallback
  console.log('Using static fallback response');
  const userMessage = prompt.split('User: ').pop().split('\n\nCultureSense AI:')[0];
  return getStaticResponse(userMessage || 'help');
}

// POST /chat/message - Send message to AI
router.post('/message', requireAuth, async (req, res) => {
  try {
    console.log('Received chat message request from user:', req.user._id);

    const { message, context } = req.body;
    const userId = req.user._id.toString();

    // Validate input
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get or create chat history for user
    let chatHistory = chatHistories.get(userId) || [];

    // Add user message to history
    const userMessage = {
      id: Date.now().toString(),
      content: message,
      sender: 'user',
      timestamp: new Date()
    };
    chatHistory.push(userMessage);

    // Prepare context for AI with user's actual data
    let contextPrompt = CULTURAL_CONTEXT;
    
    // Add user's preferences safely
    if (req.user.preferences) {
      try {
        contextPrompt += `\n\nUser Preferences: ${JSON.stringify({
          categories: req.user.preferences.categories || [],
          favoriteGenres: req.user.preferences.favoriteGenres || [],
          culturalTags: req.user.preferences.culturalTags || [],
          moodPreferences: req.user.preferences.moodPreferences || []
        })}`;
      } catch (error) {
        console.error('Error processing preferences:', error);
      }
    }
    
    if (req.user.tasteProfile?.compatibility_score) {
      contextPrompt += `\n\nUser Taste Profile: Compatibility Score: ${req.user.tasteProfile.compatibility_score}`;
    }
    
    if (context) {
      contextPrompt += `\n\nAdditional Context: ${JSON.stringify(context)}`;
    }

    // Get recent chat history for context
    const recentHistory = chatHistory.slice(-8);
    const conversationContext = recentHistory
      .map(msg => `${msg.sender}: ${msg.content}`)
      .join('\n');

    // Create full prompt
    const fullPrompt = `${contextPrompt}\n\nConversation History:\n${conversationContext}\n\nUser: ${message}\n\nCultureSense AI:`;

    // Get AI response with fallbacks
    const aiResponseText = await getAIResponse(fullPrompt);

    // Generate contextual suggestions
    const suggestions = generateSuggestions(message, aiResponseText);

    // Create AI response
    const aiMessage = {
      id: (Date.now() + 1).toString(),
      content: aiResponseText,
      sender: 'ai',
      timestamp: new Date(),
      suggestions: suggestions
    };

    // Add to history and limit size
    chatHistory.push(aiMessage);
    if (chatHistory.length > 50) {
      chatHistory = chatHistory.slice(-50);
    }
    chatHistories.set(userId, chatHistory);

    res.json({
      success: true,
      message: aiMessage
    });

  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process message'
    });
  }
});

// Helper function to generate contextual suggestions
function generateSuggestions(userMessage, aiResponse) {
  try {
    const suggestions = [];
    const lowerMessage = userMessage.toLowerCase();
    const lowerResponse = aiResponse.toLowerCase();
    
    if (lowerMessage.includes('music') || lowerResponse.includes('music')) {
      suggestions.push('Analyze my music taste', 'Find similar artists');
    }
    if (lowerMessage.includes('movie') || lowerMessage.includes('film') || lowerResponse.includes('movie')) {
      suggestions.push('Recommend movies', 'Analyze film preferences');
    }
    if (lowerMessage.includes('book') || lowerResponse.includes('book')) {
      suggestions.push('Discover new books', 'Literary recommendations');
    }
    if (lowerMessage.includes('art') || lowerResponse.includes('art')) {
      suggestions.push('Explore art styles', 'Find similar artists');
    }
    if (lowerMessage.includes('trend') || lowerResponse.includes('trend')) {
      suggestions.push('Cultural trend analysis', 'What\'s trending now?');
    }
    
    suggestions.push('Tell me more', 'Show recommendations');
    
    return [...new Set(suggestions)].slice(0, 4);
  } catch (error) {
    return ['Tell me more', 'Show recommendations'];
  }
}

// GET /chat/history - Get chat history for authenticated user
router.get('/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const history = chatHistories.get(userId) || [];
    res.json({ success: true, messages: history });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
  }
});

// POST /chat/clear - Clear chat history
router.post('/clear', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id.toString();
    chatHistories.delete(userId);
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (error) {
    console.error('Error clearing chat history:', error);
    res.status(500).json({ success: false, error: 'Failed to clear chat history' });
  }
});

// GET /chat/suggestions - Get contextual suggestions
router.get('/suggestions', requireAuth, async (req, res) => {
  try {
    const suggestions = [
      'Analyze my cultural preferences',
      'What are the latest trends?',
      'Recommend something new',
      'Explain my taste profile',
      'Find similar content',
      'Cultural insights',
      'Discover emerging artists',
      'Compare cultural movements'
    ];
    res.json({ success: true, suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch suggestions' });
  }
});

module.exports = router;