import { useState, useEffect } from "react";
import Navigation from "@/components/Navigation";
import RecommendationCard from "@/components/RecommendationCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Star, Heart, TrendingUp, Grid2X2 } from "lucide-react";
import axios from "axios";

const Discover = () => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [discoveries, setDiscoveries] = useState([]);
  const [trendingDiscoveries, setTrendingDiscoveries] = useState([]);
  const [personalizedDiscoveries, setPersonalizedDiscoveries] = useState([]);
  const [stats, setStats] = useState({
    averageRating: 4.8,
    totalItems: 847,
    trendingCount: 23,
    categories: 156
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Backend API base URL
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  const categories = [
    {
      id: "all",
      label: "All Categories",
      count: 847,
      type: "all",
      defaultTag: null,
    },
    {
      id: "film",
      label: "Film & Cinema",
      count: 156,
      type: "movie",
      defaultTag: "minimalist",
    },
    {
      id: "music",
      label: "Music",
      count: 234,
      type: "music",
      defaultTag: "soulful",
    },
    {
      id: "literature",
      label: "Literature",
      count: 89,
      type: "book",
      defaultTag: "nonfiction",
    },
    {
      id: "art",
      label: "Visual Arts",
      count: 145,
      type: "art",
      defaultTag: "contemporary",
    },
    {
      id: "design",
      label: "Design",
      count: 223,
      type: "design",
      defaultTag: "sustainable",
    },
  ];

  // Fetch discovery stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/discover/stats`);
      if (response.data.success) {
        setStats({
          averageRating: response.data.data.averageRating || 4.8,
          totalItems: response.data.data.totalItems || 847,
          trendingCount: response.data.data.trendingCount || 23,
          categories: response.data.data.categories || 156
        });
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Fetch trending discoveries
  const fetchTrendingDiscoveries = async () => {
    try {
      const params = activeCategory !== "all" ? { type: categories.find(cat => cat.id === activeCategory)?.type } : {};
      const response = await axios.get(`${API_BASE_URL}/discover/trending`, { params });
      
      if (response.data.success) {
        const formattedTrending = response.data.data.map(formatDiscoveryItem);
        setTrendingDiscoveries(formattedTrending);
      }
    } catch (err) {
      console.error("Failed to fetch trending discoveries:", err);
    }
  };

  // Fetch personalized discoveries
  const fetchPersonalizedDiscoveries = async () => {
    try {
      const params = activeCategory !== "all" ? { type: categories.find(cat => cat.id === activeCategory)?.type } : {};
      const response = await axios.get(`${API_BASE_URL}/discover/personalized`, { 
        params,
        withCredentials: true,
      });
      
      if (response.data.success) {
        const formattedPersonalized = response.data.data.map(formatDiscoveryItem);
        setPersonalizedDiscoveries(formattedPersonalized);
      }
    } catch (err) {
      console.error("Failed to fetch personalized discoveries:", err);
      // If not authenticated, fetch general insights instead
      fetchInsights();
    }
  };

  // Fetch general insights (fallback)
  const fetchInsights = async () => {
    try {
      const selectedCategory = categories.find((cat) => cat.id === activeCategory) || categories[0];
      const params = {
        type: selectedCategory.type,
        limit: 20,
      };

      if (activeCategory !== "all" && selectedCategory.defaultTag) {
        params.tags = selectedCategory.defaultTag;
      }

      const response = await axios.get(`${API_BASE_URL}/discover/insights`, { params });

      if (response.data.success) {
        const formattedDiscoveries = response.data.data.map(formatDiscoveryItem);
        setDiscoveries(formattedDiscoveries);
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  // Search discoveries
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchQuery("");
      return;
    }

    setSearchLoading(true);
    try {
      const params = {
        q: query,
        type: activeCategory !== "all" ? categories.find(cat => cat.id === activeCategory)?.type : undefined,
        limit: 20
      };

      const response = await axios.get(`${API_BASE_URL}/discover/search`, { params });

      if (response.data.success) {
        const formattedResults = response.data.data.map(formatDiscoveryItem);
        setDiscoveries(formattedResults);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Format discovery item to match component expectations
  const formatDiscoveryItem = (item, index = 0) => {
    return {
      id: item._id || item.id,
      title: item.title || item.name || `Discovery ${index + 1}`,
      description: item.description || `Explore this ${item.category || 'cultural item'}.`,
      category: item.category || "Unknown",
      rating: item.rating || (4.5 + Math.random() * 0.5),
      trending: item.trending || item.isTrending || false,
      image: item.image || item.imageUrl || `https://images.unsplash.com/photo-1489599510096?w=400&h=300&fit=crop`,
      tags: Array.isArray(item.tags) ? item.tags : ["Curated", "Cultural"],
      website: item.website || item.externalUrl || null,
      releaseYear: item.releaseYear,
      genre: item.genre
    };
  };

  // Get discovery details
  const getDiscoveryDetails = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/discover/details/${id}`);
      return response.data.success ? response.data.data : null;
    } catch (err) {
      console.error("Failed to fetch discovery details:", err);
      return null;
    }
  };

  // Load all data
  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.allSettled([
        fetchStats(),
        fetchTrendingDiscoveries(),
        fetchPersonalizedDiscoveries(),
      ]);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = async (categoryId) => {
    setActiveCategory(categoryId);
    setSearchQuery(""); // Clear search when changing category
    setLoading(true);
    
    try {
      await Promise.allSettled([
        fetchTrendingDiscoveries(),
        fetchPersonalizedDiscoveries(),
      ]);
    } catch (err) {
      console.error("Failed to load category data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else if (searchQuery === "") {
        // Reset to category data when search is cleared
        loadAllData();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    loadAllData();
  }, []);

  // Combine discoveries for display
  const allDiscoveries = searchQuery 
    ? discoveries 
    : [...trendingDiscoveries, ...personalizedDiscoveries, ...discoveries].reduce((acc, current) => {
        // Remove duplicates based on id
        const exists = acc.find(item => item.id === current.id);
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-6 pill-button bg-accent-rose/10 text-accent-rose border-accent-rose/20 animate-fade-in-scale">
              <Heart className="w-3 h-3 mr-1 animate-pulse" />
              Cultural Discovery Engine
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold font-poppins text-foreground mb-6">
              <span className="gradient-text animate-glow">Discover</span>{" "}
              Culture
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-inter">
              AI-powered cultural discoveries tailored to your unique taste
              profile
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search cultural discoveries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg rounded-2xl glass-card border-primary/20"
              />
              {searchLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 sm:gap-8 mb-12 sm:mb-16">
            <div className="flex items-start sm:items-center gap-4 overflow-x-auto sm:overflow-visible pb-4 sm:pb-0 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    activeCategory === category.id ? "default" : "outline"
                  }
                  size="lg"
                  onClick={() => handleCategoryChange(category.id)}
                  className={`
          whitespace-nowrap px-6 sm:px-8 py-3 sm:py-4 rounded-2xl transition-all duration-300 min-w-fit text-sm sm:text-base
          ${
            activeCategory === category.id
              ? "bg-gradient-primary text-white shadow-hover border-0 scale-105"
              : "glass-card border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:scale-102"
          }
        `}
                >
                  <span className="font-medium">{category.label}</span>
                  <Badge
                    variant="secondary"
                    className={`ml-2 sm:ml-3 text-xs rounded-full px-2 py-1 ${
                      activeCategory === category.id
                        ? "bg-white/20 text-white border-0"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}
                  >
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Card className="glass-card text-center p-8 hover-lift">
              <Star className="w-10 h-10 text-accent-amber mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.averageRating}
              </div>
              <div className="text-muted-foreground">Average Rating</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <Heart className="w-10 h-10 text-accent-rose mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.totalItems}
              </div>
              <div className="text-muted-foreground">Curated Items</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <TrendingUp className="w-10 h-10 text-secondary mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.trendingCount}
              </div>
              <div className="text-muted-foreground">Trending Now</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <Grid2X2 className="w-10 h-10 text-primary mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.categories}
              </div>
              <div className="text-muted-foreground">Categories</div>
            </Card>
          </div>

          {/* Loading/Error States */}
          {loading && (
            <div className="text-center text-muted-foreground py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              Loading cultural discoveries...
            </div>
          )}
          
          {error && (
            <div className="text-center py-12">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 max-w-md mx-auto">
                <p className="text-destructive mb-4">Error: {error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => loadAllData()}
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* Trending Section */}
          {!loading && !error && trendingDiscoveries.length > 0 && !searchQuery && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    <span className="gradient-text">Trending</span> Discoveries
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    Popular cultural finds among users with similar taste
                    profiles
                  </p>
                </div>
                <Badge className="bg-accent-amber/20 text-accent-amber border-accent-amber/30 px-4 py-2 hover-lift">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Hot Cultural Trends
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {trendingDiscoveries.slice(0, 6).map((discovery, index) => (
                  <div
                    key={discovery.id || index}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <RecommendationCard {...discovery} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Discoveries */}
          {!loading && !error && allDiscoveries.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    {searchQuery ? `Search Results for "${searchQuery}"` : "Personalized Discoveries"}
                  </h2>
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? `Found ${allDiscoveries.length} results`
                      : "Curated based on your taste evolution and preference patterns"
                    }
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    Sort
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allDiscoveries.map((discovery, index) => (
                  <div
                    key={discovery.id || index}
                    className="animate-scale-in"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <RecommendationCard {...discovery} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {!loading && !error && allDiscoveries.length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">No discoveries found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? `No results found for "${searchQuery}". Try a different search term.`
                  : "No discoveries available for this category right now."
                }
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                  className="mr-4"
                >
                  Clear Search
                </Button>
              )}
              <Button onClick={() => loadAllData()}>
                Refresh Discoveries
              </Button>
            </div>
          )}

          {/* Load More */}
          {!loading && !error && allDiscoveries.length > 0 && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                className="hover-lift"
                onClick={() => loadAllData()}
              >
                Load More Discoveries
                <TrendingUp className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;