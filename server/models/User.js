const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Your existing authentication fields (keep all of them)
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    minlength: 6,
    required: function() {
      return !this.googleId;
    }
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  
  // OAuth provider data (keep your existing structure)
  authProviders: {
    google: {
      id: String,
      accessToken: String,
      refreshToken: String,
      lastLogin: Date
    },
    microsoft: {
      id: String,
      accessToken: String,
      refreshToken: String,
      lastLogin: Date
    },
    github: {
      id: String,
      accessToken: String,
      refreshToken: String,
      lastLogin: Date
    },
    apple: {
      id: String,
      accessToken: String,
      refreshToken: String,
      lastLogin: Date
    }
  },
  
  // KEEP your existing preferences structure but ADD these new fields:
  preferences: {
    categories: [{
      type: String,
      enum: ['all', 'film', 'music', 'literature', 'art', 'design'],
      default: 'all'
    }],
    favoriteGenres: [{
      type: String,
      trim: true
    }],
    culturalTags: [{
      type: String,
      trim: true
    }],
    moodPreferences: [{
      type: String,
      enum: ['energetic', 'calm', 'adventurous', 'romantic', 'mysterious', 'uplifting', 'nostalgic', 'experimental'],
      trim: true
    }],
    location: {
      country: String,
      city: String,
      timezone: String
    },
    // ADD THESE NEW PREFERENCE FIELDS for your frontend:
    notifications: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: false
    },
    aiInsights: {
      type: Boolean,
      default: true
    }
  },

  // ADD THESE NEW FIELDS to match your frontend expectations:
  
  // Profile fields
  bio: {
    type: String,
    default: "AI-powered cultural analyst with a passion for discovering emerging trends"
  },
  tier: {
    type: String,
    enum: ['Guest', 'Explorer', 'Curator', 'Expert'],
    default: 'Explorer'
  },
  picture: {
    type: String,
    default: ''
  },
  
  // Cultural profile for taste analysis
  culturalProfile: {
    visualArts: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    music: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    film: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    literature: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    design: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    fashion: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },
  
  // User activity tracking
  profileViews: {
    type: Number,
    default: 0
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginCount: {
    type: Number,
    default: 0
  },
  
  // Recommendations history
  recommendations: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    category: {
      type: String,
      required: true
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0
    },
    image: String,
    tags: [String],
    source: String,
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Favorites list
  favorites: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    category: String,
    itemType: String,
    rating: Number,
    image: String,
    url: String,
    tags: [String],
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Conversation history (for analytics)
  conversationHistory: [{
    sessionId: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageCount: {
      type: Number,
      default: 1
    }
  }]
  
}, {
  timestamps: true, // Automatically handle createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ 'preferences.categories': 1 });
userSchema.index({ 'tasteProfile.compatibility_score': -1 });
userSchema.index({ 'status.lastLogin': -1 });
userSchema.index({ createdAt: -1 });

// Virtual for user's full profile
userSchema.virtual('profile').get(function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    preferences: this.preferences,
    compatibilityScore: this.tasteProfile.compatibility_score,
    memberSince: this.createdAt,
    lastActive: this.status.lastLogin
  };
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  // Hash password if it's new or modified
  if (this.isModified('password') && this.password) {
    try {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    } catch (error) {
      return next(error);
    }
  }
  
  // Update timestamps
  this.updatedAt = Date.now();
  
  // Increment login count if lastLogin is being updated
  if (this.isModified('status.lastLogin')) {
    this.status.loginCount += 1;
  }
  
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateCompatibilityScore = function() {
  const history = this.tasteProfile.recommendations_history;
  if (history.length === 0) return;
  
  const ratedItems = history.filter(item => item.rating);
  const avgRating = ratedItems.reduce((sum, item) => sum + item.rating, 0) / ratedItems.length;
  const interactionBonus = Math.min(2, history.length * 0.01);
  
  this.tasteProfile.compatibility_score = Math.min(10, avgRating * 2 + interactionBonus);
};

userSchema.methods.addRecommendationInteraction = function(interaction) {
  this.tasteProfile.recommendations_history.push(interaction);
  this.updateCompatibilityScore();
  return this.save();
};

userSchema.methods.getRecommendationStats = function() {
  const history = this.tasteProfile.recommendations_history;
  const categoryStats = {};
  
  history.forEach(item => {
    if (!categoryStats[item.category]) {
      categoryStats[item.category] = { count: 0, avgRating: 0, totalRating: 0 };
    }
    categoryStats[item.category].count++;
    if (item.rating) {
      categoryStats[item.category].totalRating += item.rating;
      categoryStats[item.category].avgRating = 
        categoryStats[item.category].totalRating / categoryStats[item.category].count;
    }
  });
  
  return {
    totalInteractions: history.length,
    categoryBreakdown: categoryStats,
    compatibilityScore: this.tasteProfile.compatibility_score,
    recentActivity: history.slice(-5)
  };
};

// Static methods
userSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.findByGoogleId = function(googleId) {
  return this.findOne({ googleId });
};

userSchema.statics.getActiveUsers = function(days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    'status.isActive': true,
    'status.lastLogin': { $gte: cutoffDate }
  });
};

userSchema.statics.getUsersByCompatibility = function(minScore = 7) {
  return this.find({
    'tasteProfile.compatibility_score': { $gte: minScore }
  }).sort({ 'tasteProfile.compatibility_score': -1 });
};

const User = mongoose.model('User', userSchema);

module.exports = User;