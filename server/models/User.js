const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  // Authentication fields
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
    // Required only if no OAuth provider
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
  
  // OAuth provider data
  authProviders: {
    google: {
      id: String,
      accessToken: String,
      refreshToken: String,
      lastLogin: Date
    },
    // Future providers can be added here
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
  
  // User preferences
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
    }
  },
  
  // Taste profile and AI data
  tasteProfile: {
    compatibility_score: {
      type: Number,
      min: 0,
      max: 10,
      default: 0
    },
    cultural_evolution: [{
      date: {
        type: Date,
        default: Date.now
      },
      preferences: [String],
      score: {
        type: Number,
        min: 0,
        max: 10
      },
      insights: String
    }],
    recommendations_history: [{
      item_id: String,
      title: String,
      category: String,
      type: String,
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      interaction_type: {
        type: String,
        enum: ['viewed', 'liked', 'disliked', 'saved', 'shared', 'rated', 'commented'],
        required: true
      },
      timestamp: {
        type: Date,
        default: Date.now
      },
      source: {
        type: String,
        enum: ['qloo', 'manual', 'imported'],
        default: 'qloo'
      },
      metadata: {
        external_ids: {
          imdb: String,
          spotify: String,
          goodreads: String
        },
        tags: [String],
        mood: String,
        context: String
      }
    }],
    mood_analytics: {
      current_mood: {
        type: String,
        enum: ['happy', 'sad', 'energetic', 'calm', 'adventurous', 'romantic', 'nostalgic', 'experimental'],
        default: 'calm'
      },
      mood_history: [{
        mood: String,
        date: Date,
        triggers: [String],
        recommendations_given: Number
      }],
      personality_traits: {
        openness: { type: Number, min: 0, max: 10, default: 5 },
        conscientiousness: { type: Number, min: 0, max: 10, default: 5 },
        extraversion: { type: Number, min: 0, max: 10, default: 5 },
        agreeableness: { type: Number, min: 0, max: 10, default: 5 },
        neuroticism: { type: Number, min: 0, max: 10, default: 5 }
      }
    }
  },
  
  // App settings
  settings: {
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      recommendations: {
        type: Boolean,
        default: true
      },
      trends: {
        type: Boolean,
        default: true
      }
    },
    privacy: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public'
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    data_sharing: {
      analytics: {
        type: Boolean,
        default: true
      },
      recommendations: {
        type: Boolean,
        default: true
      },
      research: {
        type: Boolean,
        default: false
      }
    }
  },
  
  // Social features
  social: {
    friends: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      status: {
        type: String,
        enum: ['pending', 'accepted', 'blocked'],
        default: 'pending'
      },
      connectedAt: {
        type: Date,
        default: Date.now
      }
    }],
    followers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    public_lists: [{
      name: String,
      description: String,
      items: [String],
      category: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Account status
  status: {
    isActive: {
      type: Boolean,
      default: true
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    lastLogin: {
      type: Date,
      default: Date.now
    },
    loginCount: {
      type: Number,
      default: 0
    },
    subscription: {
      type: String,
      enum: ['free', 'premium', 'enterprise'],
      default: 'free'
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
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