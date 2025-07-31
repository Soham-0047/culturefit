import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Settings,
  Heart,
  Star,
  TrendingUp,
  Calendar,
  Bell,
  Eye,
  MessageSquare,
  Edit,
  Loader2,
  RefreshCw,
  ExternalLink,
  X,
} from "lucide-react";
import UserPreferencesForm from "@/components/UserPresencesForm";
import { api } from "@/utils/api";

const Profile = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [userAnalytics, setUserAnalytics] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [showForm, setShowForm] = useState(false);

  // Settings state
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [aiInsights, setAiInsights] = useState(true);
  const [updating, setUpdating] = useState(false);

  // API base URL - adjust based on your setup
  const API_BASE = import.meta.env.VITE_APP_BACKEND_URL;

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
  try {
    setLoading(true);
    setError(null);

    // Check auth status
    await api.get('/auth/status');

    let profile, preferences, analytics, favoritesData, recommendationsData;

    // 1. Fetch Profile
    try {
      const profileRes = await api.get('/auth/profile');
      profile = await profileRes.json();
      setUserProfile(profile.user);
    } catch (profileError) {
      console.error("Profile error:", profileError);
      profile = {
        name: "Cultural Explorer",
        bio: "Welcome to your cultural journey",
        avatar: null,
        tier: "Explorer",
      };
      setUserProfile(profile);
    }

    // 2. Fetch Preferences
    try {
      const preferencesRes = await api.get('/auth/preferences');
      preferences = await preferencesRes.json();
      setUserPreferences(preferences);

      if (preferences.settings) {
        setNotifications(preferences.settings.notifications ?? true);
        setPublicProfile(preferences.settings.publicProfile ?? false);
        setAiInsights(preferences.settings.aiInsights ?? true);
      }
    } catch (prefError) {
      console.error("Preferences error:", prefError);
      preferences = {
        culturalProfile: {},
        settings: {
          notifications: true,
          publicProfile: false,
          aiInsights: true,
        },
      };
      setUserPreferences(preferences);
    }

    // 3. Optional Analytics
    try {
      const analyticsRes = await api.get('/user/analytics');
      analytics = await analyticsRes.json();
      setUserAnalytics(analytics);
    } catch (analyticsError) {
      console.error("Analytics error:", analyticsError);
      setUserAnalytics({ stats: {} });
    }

    // 4. Optional Favorites
    try {
      const favoritesRes = await api.get('/user/favorites');
      favoritesData = await favoritesRes.json();
      setFavorites(favoritesData.favorites || []);
    } catch (favError) {
      console.error("Favorites error:", favError);
      setFavorites([]);
    }

    // 5. Optional Recommendations
    try {
      const recRes = await api.get('/user/recommendations');
      recommendationsData = await recRes.json();
      setRecommendations(recommendationsData);
    } catch (recError) {
      console.error("Recommendations error:", recError);
      setRecommendations([]);
    }

  } catch (err: any) {
    setError(err.message || "Failed to fetch user data");
    console.error("Error fetching user data:", err);

    setUserProfile({
      name: "Guest User",
      bio: "Please log in to view your profile",
      avatar: null,
      tier: "Guest",
    });
    setUserPreferences({
      culturalProfile: {},
      settings: {
        notifications: true,
        publicProfile: false,
        aiInsights: true,
      },
    });
    setUserAnalytics({ stats: {} });
    setFavorites([]);
    setRecommendations([]);
  } finally {
    setLoading(false);
  }
};


  const updatePreferences = async (updates) => {
  try {
    setUpdating(true);
    
    const response = await api.put('/auth/preferences', updates);
    
    const updatedPreferences = await response.json();
    setUserPreferences(updatedPreferences);
    
  } catch (err: any) {
    console.error("Error updating preferences:", err);
    setError("Failed to update preferences");
  } finally {
    setUpdating(false);
  }
};


  const handleSettingChange = async (setting, value) => {
    const updates = {
      settings: {
        ...userPreferences?.settings,
        [setting]: value,
      },
    };

    // Update local state immediately for better UX
    switch (setting) {
      case "notifications":
        setNotifications(value);
        break;
      case "publicProfile":
        setPublicProfile(value);
        break;
      case "aiInsights":
        setAiInsights(value);
        break;
    }

    // Update backend
    await updatePreferences(updates);
  };

  // Generate stats from analytics data
  const generateStats = () => {
    if (!userAnalytics?.stats) {
      return [
        {
          label: "Cultural Discoveries",
          value: "0",
          icon: <Heart className="w-5 h-5" />,
        },
        {
          label: "AI Conversations",
          value: "0",
          icon: <MessageSquare className="w-5 h-5" />,
        },
        {
          label: "Trend Predictions",
          value: "0%",
          icon: <TrendingUp className="w-5 h-5" />,
        },
        {
          label: "Profile Views",
          value: "0",
          icon: <Eye className="w-5 h-5" />,
        },
      ];
    }

    const stats = userAnalytics.stats;
    return [
      {
        label: "Cultural Discoveries",
        value: stats.totalDiscoveries?.toLocaleString() || "0",
        icon: <Heart className="w-5 h-5" />,
      },
      {
        label: "AI Conversations",
        value: stats.totalConversations?.toString() || "0",
        icon: <MessageSquare className="w-5 h-5" />,
      },
      {
        label: "Recommendation Accuracy",
        value: `${stats.recommendationAccuracy || 0}%`,
        icon: <TrendingUp className="w-5 h-5" />,
      },
      {
        label: "Profile Views",
        value: stats.profileViews
          ? stats.profileViews > 1000
            ? `${(stats.profileViews / 1000).toFixed(1)}K`
            : stats.profileViews.toString()
          : "0",
        icon: <Eye className="w-5 h-5" />,
      },
    ];
  };

  function generateUserPreferencesWithStrengths(userPreference) {
    function getRandomStrength(max = 100) {
      return Math.floor(Math.random() * max);
    }

    const colorPalette = [
      "bg-primary",
      "bg-secondary",
      "bg-accent-rose",
      "bg-accent-amber",
      "bg-accent-purple",
      "bg-accent-green",
      "bg-accent-blue",
      "bg-accent-cyan",
      "bg-accent-pink",
      "bg-muted",
    ];
    const combinedItems = [
      ...(userPreference.categories || []),
      ...(userPreference.favoriteGenres || []),
    ];

    const preferences = combinedItems
      .map((item, index) => ({
        category: item.charAt(0).toUpperCase() + item.slice(1),
        strength: getRandomStrength(),
        color: colorPalette[index % colorPalette.length],
      }))
      .filter((pref) => pref.strength > 0);

    return preferences;
  }

  // Generate recent activity from recommendations and favorites
  const generateRecentActivity = () => {
    const activities = [];

    // Add recent recommendations
    if (recommendations.length > 0) {
      recommendations.slice(0, 2).forEach((rec, index) => {
        activities.push({
          description: `Discovered ${rec.title || "new recommendation"}`,
          time: rec.createdAt
            ? new Date(rec.createdAt).toLocaleDateString()
            : "Recently",
          color: index === 0 ? "bg-secondary" : "bg-accent-rose",
        });
      });
    }

    // Add recent favorites
    if (favorites.length > 0) {
      favorites.slice(0, 2).forEach((fav, index) => {
        activities.push({
          description: `Added ${fav.title || "item"} to favorites`,
          time: fav.addedAt
            ? new Date(fav.addedAt).toLocaleDateString()
            : "Recently",
          color: index === 0 ? "bg-accent-amber" : "bg-primary",
        });
      });
    }

    // Default activities if no data
    if (activities.length === 0) {
      return [
        {
          description: "Welcome to your cultural journey",
          time: "Today",
          color: "bg-primary",
        },
        {
          description: "Start exploring to see activity",
          time: "Get started",
          color: "bg-secondary",
        },
      ];
    }

    return activities.slice(0, 4);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-24 md:pb-8">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                <p className="text-muted-foreground">
                  Loading your cultural profile...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = generateStats();
  const preferences = generateUserPreferencesWithStrengths(userPreferences);
  const recentActivity = generateRecentActivity();

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="pt-20 pb-24 md:pb-8">
          <div className="container mx-auto px-6 max-w-6xl">
            <Alert className="max-w-md mx-auto mt-8">
              <AlertDescription>
                {error}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => fetchUserData()}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    );
  }
  console.log(favorites, "Laduba");
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-6 max-w-6xl">
          {/* Profile Header */}
          <div className="mb-12">
            <Card className="glass-card">
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-primary/30">
                      <AvatarImage
                        src={userProfile?.picture || "/placeholder.svg"}
                      />
                      <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                        {userProfile?.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="status-online w-6 h-6 rounded-full absolute -bottom-1 -right-1 border-2 border-card"></div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                      <h1 className="text-3xl font-bold text-foreground">
                        {userProfile?.name || "Cultural Explorer"}
                      </h1>
                      <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                        <Star className="w-3 h-3 mr-1" />
                        {userProfile?.tier || "Explorer"}
                      </Badge>
                    </div>

                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      {userProfile?.bio ||
                        "AI-powered cultural analyst with a passion for discovering emerging trends and connecting diverse artistic expressions."}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                          <div className="flex items-center justify-center text-primary mb-2">
                            {stat.icon}
                          </div>
                          <div className="text-xl font-bold text-foreground">
                            {stat.value}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="default"
                        onClick={() => setShowForm(true)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Preferences
                      </Button>
                      {/* <Button variant="glass">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Share Profile
                      </Button> */}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Taste Profile */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-primary" />
                    Cultural Taste Profile
                  </CardTitle>
                  <CardDescription>
                    Your preference strength across different cultural
                    categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {preferences.length > 0 ? (
                    preferences.map((pref, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {pref.category}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {pref.strength}%
                          </span>
                        </div>
                        <Progress value={pref.strength} className="h-2" />
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Heart className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        Start exploring cultural content to build your taste
                        profile
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Favorites Section */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Recent Favorites
                  </CardTitle>
                  <CardDescription>
                    Your recently added cultural discoveries
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {favorites.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favorites.slice(0, 4).map((favorite, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors"
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-primary/10 flex-shrink-0">
                            {favorite.image ? (
                              <img
                                src={favorite.image}
                                alt={favorite.title}
                                className="w-full h-full object-cover"
                                onError={(e: any) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{
                                display: favorite.image ? "none" : "flex",
                              }}
                            >
                              <Heart className="w-6 h-6 text-primary" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate mb-1">
                              {favorite.title || "Cultural Item"}
                            </p>
                            <p className="text-xs text-muted-foreground mb-1">
                              {favorite.category ||
                                favorite.itemType ||
                                "Culture"}
                            </p>
                            {favorite.description && (
                              <p className="text-xs text-muted-foreground/80 line-clamp-2">
                                {favorite.description}
                              </p>
                            )}
                          </div>
                          {favorite.url && (
                            <a
                              href={favorite.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">
                        No favorites yet. Start exploring to add some!
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Settings */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    Profile Settings
                    {updating && <Loader2 className="w-4 h-4 animate-spin" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">
                        Notifications
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Receive AI insights and recommendations
                      </p>
                    </div>
                    <Switch
                      checked={notifications}
                      onCheckedChange={(value) =>
                        handleSettingChange("notifications", value)
                      }
                      disabled={updating}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">
                        Public Profile
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Allow others to discover your taste profile
                      </p>
                    </div>
                    <Switch
                      checked={publicProfile}
                      onCheckedChange={(value) =>
                        handleSettingChange("publicProfile", value)
                      }
                      disabled={updating}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-foreground">
                        AI Insights
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Enable advanced cultural analysis
                      </p>
                    </div>
                    <Switch
                      checked={aiInsights}
                      onCheckedChange={(value) =>
                        handleSettingChange("aiInsights", value)
                      }
                      disabled={updating}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 ${activity.color} rounded-full`}
                      ></div>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start">
                    <Bell className="w-4 h-4 mr-2" />
                    Notification Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Privacy Settings
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Heart className="w-4 h-4 mr-2" />
                    Export Preferences
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => window.open("/discover", "_blank")}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Explore Culture
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowForm(false)}
              className="absolute right-4 top-4 p-1 rounded-sm opacity-70 hover:opacity-100"
            >
              <X className="h-5 w-5 bg-white" />
              <span className="sr-only">Close</span>
            </button>
            <UserPreferencesForm
              onComplete={() => setShowForm(false)}
              isEditing={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
