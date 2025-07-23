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
    averageRating: 0,
    totalDiscoveries: 0,
    trending: 0,
    categoriesTotal: 0,
    recentlyAdded: 0
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [loadMoreLoading, setLoadMoreLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const ITEMS_PER_PAGE = 20;

  // Backend API base URL
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  // Fetch discovery stats
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/discover/stats`);
      if (response.data.success) {
        const statsData = response.data.stats;
        
        // Calculate total categories from categories object
        const categoriesTotal = statsData.categories 
          ? Object.keys(statsData.categories).length 
          : 0;

        setStats({
          averageRating: statsData.averageRating || 0,
          totalDiscoveries: statsData.totalDiscoveries || 0,
          trending: statsData.trending || 0,
          categoriesTotal: categoriesTotal,
          recentlyAdded: statsData.recentlyAdded || 0
        });

        // Build categories array from backend data
        if (statsData.categories) {
          const categoriesArray = [
            {
              id: "all",
              label: "All Categories",
              count: statsData.totalDiscoveries || 0,
              type: "all",
              defaultTag: null,
            },
            ...Object.entries(statsData.categories).map(([key, count]) => ({
              id: key,
              label: key.charAt(0).toUpperCase() + key.slice(1),
              count: count,
              type: key,
              defaultTag: getDefaultTagForCategory(key),
            }))
          ];
          setCategories(categoriesArray);
        }
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  // Helper function to get default tags for categories
  const getDefaultTagForCategory = (category) => {
    const tagMap = {
      film: "minimalist",
      music: "soulful", 
      literature: "nonfiction",
      art: "contemporary",
      design: "sustainable"
    };
    return tagMap[category] || null;
  };

  // Fetch trending discoveries
  const fetchTrendingDiscoveries = async (categoryId, append = false) => {
    try {
      const category = categories.find(cat => cat.id === categoryId);
      const params = { 
        ...(categoryId !== "all" ? { type: category?.type } : {}),
        page: append ? Math.ceil(trendingDiscoveries.length / ITEMS_PER_PAGE) + 1 : 1,
        limit: ITEMS_PER_PAGE
      };
      
      const response = await axios.get(`${API_BASE_URL}/discover/trending`, { params });

      if (response.data.success) {
        const formattedTrending = response.data.trending.map(formatDiscoveryItem);
        if (append) {
          setTrendingDiscoveries(prev => [...prev, ...formattedTrending]);
        } else {
          setTrendingDiscoveries(formattedTrending);
        }
        
        // Check if there's more data
        setHasMoreData(formattedTrending.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error("Failed to fetch trending discoveries:", err);
    }
  };

  // Fetch personalized discoveries
  const fetchPersonalizedDiscoveries = async (categoryId, append = false) => {
    try {
      const category = categories.find(cat => cat.id === categoryId);
      const params = { 
        ...(categoryId !== "all" ? { type: category?.type } : {}),
        page: append ? Math.ceil(personalizedDiscoveries.length / ITEMS_PER_PAGE) + 1 : 1,
        limit: ITEMS_PER_PAGE
      };

      const response = await axios.get(`${API_BASE_URL}/discover/personalized`, {
        params,
        withCredentials: true,
      });

      if (response.data.success) {
        // Handle the nested structure: response.data.data.recommendations
        const recommendations = response.data.data?.recommendations || response.data.data || [];
        const formattedPersonalized = recommendations.map(formatDiscoveryItem);
        
        if (append) {
          setPersonalizedDiscoveries(prev => [...prev, ...formattedPersonalized]);
        } else {
          setPersonalizedDiscoveries(formattedPersonalized);
        }
        
        // Check if there's more data
        if (!append || formattedPersonalized.length < ITEMS_PER_PAGE) {
          setHasMoreData(formattedPersonalized.length === ITEMS_PER_PAGE);
        }
      }
    } catch (err) {
      console.error("Failed to fetch personalized discoveries:", err);
      if (!append) {
        fetchInsights(); // Fallback only for initial load
      }
    }
  };

  // Fetch general insights (fallback)
  const fetchInsights = async (append = false) => {
    try {
      const selectedCategory = categories.find((cat) => cat.id === activeCategory) || categories[0];
      if (!selectedCategory) return;

      const params = {
        type: selectedCategory.type,
        limit: ITEMS_PER_PAGE,
        page: append ? Math.ceil(discoveries.length / ITEMS_PER_PAGE) + 1 : 1,
      };

      if (activeCategory !== "all" && selectedCategory.defaultTag) {
        params.tags = selectedCategory.defaultTag;
      }

      const response = await axios.get(`${API_BASE_URL}/discover/insights`, { params });

      if (response.data.success) {
        const formattedDiscoveries = response.data.discoveries.map(formatDiscoveryItem);
        if (append) {
          setDiscoveries(prev => [...prev, ...formattedDiscoveries]);
        } else {
          setDiscoveries(formattedDiscoveries);
        }
        
        // Check if there's more data
        if (!append || formattedDiscoveries.length < ITEMS_PER_PAGE) {
          setHasMoreData(formattedDiscoveries.length === ITEMS_PER_PAGE);
        }
      }
    } catch (err) {
      console.error("Failed to fetch insights:", err);
      setError(err.response?.data?.message || err.message);
    }
  };

  // Search discoveries
  const handleSearch = async (query, append = false) => {
    if (!query.trim()) {
      setSearchQuery("");
      return;
    }

    if (!append) setSearchLoading(true);
    try {
      const params = {
        q: query,
        type: activeCategory !== "all" ? categories.find(cat => cat.id === activeCategory)?.type : undefined,
        limit: ITEMS_PER_PAGE,
        page: append ? Math.ceil(discoveries.length / ITEMS_PER_PAGE) + 1 : 1
      };

      const response = await axios.get(`${API_BASE_URL}/discover/search`, { params });

      if (response.data.success) {
        const formattedResults = response.data.results.map(formatDiscoveryItem);
        if (append) {
          setDiscoveries(prev => [...prev, ...formattedResults]);
        } else {
          setDiscoveries(formattedResults);
        }
        
        // Check if there's more data
        setHasMoreData(formattedResults.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error("Search failed:", err);
      setError(err.response?.data?.message || err.message);
    } finally {
      if (!append) setSearchLoading(false);
    }
  };

  // Format discovery item to match component expectations
  const formatDiscoveryItem = (item, index = 0) => {
    return {
      id: item._id || item.id,
      title: item.title || item.name || `Discovery ${index + 1}`,
      description: item.description || `Explore this ${item.category || 'cultural item'}.`,
      category: item.category || "Unknown",
      rating: parseFloat(item.rating) || item.preferenceScore || (4.5 + Math.random() * 0.5),
      trending: item.trending || item.isTrending || false,
      image: item.image || item.imageUrl || `https://images.unsplash.com/photo-1489599510096-93ee2a83c1bc?w=400&h=300&fit=crop`,
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

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    setCurrentPage(1);
    setHasMoreData(true);

    try {
      // First fetch stats to get categories
      await fetchStats();
      
      // Then fetch other data after categories are loaded
      await Promise.allSettled([
        fetchTrendingDiscoveries(activeCategory, false),
        fetchPersonalizedDiscoveries(activeCategory, false),
      ]);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load more data function
  const loadMoreData = async () => {
    if (loadMoreLoading || !hasMoreData) return;

    setLoadMoreLoading(true);
    try {
      if (searchQuery.trim()) {
        // Load more search results
        await handleSearch(searchQuery, true);
      } else {
        // Load more personalized or trending discoveries
        if (personalizedDiscoveries.length > 0) {
          await fetchPersonalizedDiscoveries(activeCategory, true);
        } else if (discoveries.length > 0) {
          await fetchInsights(true);
        }
      }
      setCurrentPage(prev => prev + 1);
    } catch (err) {
      console.error("Failed to load more data:", err);
    } finally {
      setLoadMoreLoading(false);
    }
  };

  // Handle category change
  const handleCategoryChange = async (categoryId) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
    setLoading(true);
    setCurrentPage(1);
    setHasMoreData(true);

    try {
      await Promise.allSettled([
        fetchTrendingDiscoveries(categoryId, false),
        fetchPersonalizedDiscoveries(categoryId, false),
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
        setCurrentPage(1);
        setHasMoreData(true);
        handleSearch(searchQuery, false);
      } else if (searchQuery === "") {
        // Reset to category data when search is cleared
        setCurrentPage(1);
        setHasMoreData(true);
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
      console.log(categories,allDiscoveries);
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
          {categories.length > 0 && (
  <div className="flex flex-col gap-4 mb-8 sm:mb-12 lg:mb-16">
    {/* Mobile: Vertical scroll, Tablet+: Horizontal scroll with fade edges */}
    <div className="relative">
      {/* Fade gradient for larger screens */}
      <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      
      {/* Scrollable container */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 overflow-x-auto sm:overflow-x-scroll scrollbar-hide pb-2 sm:pb-4 px-1">
        {categories.map((category) => (
          <Button
            key={category.id}
            variant={activeCategory === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => handleCategoryChange(category.id)}
            className={`
              group relative flex-shrink-0 w-full sm:w-auto
              px-4 sm:px-6 lg:px-8 
              py-2.5 sm:py-3 lg:py-4 
              rounded-xl sm:rounded-2xl 
              transition-all duration-300 ease-out
              text-sm sm:text-base lg:text-lg
              font-medium
              ${
                activeCategory === category.id
                  ? "bg-gradient-primary text-white shadow-lg shadow-primary/25 border-0 scale-[1.02] sm:scale-105"
                  : "glass-card border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:scale-[1.01] sm:hover:scale-102 hover:shadow-md"
              }
            `}
          >
            {/* Button content with proper spacing */}
            <div className="flex items-center justify-between sm:justify-center gap-2 sm:gap-3 w-full sm:w-auto">
              <span className="truncate">{category.label}</span>
              <Badge
                variant="secondary"
                className={`
                  flex-shrink-0 text-xs rounded-full px-2 py-0.5
                  transition-all duration-300
                  ${
                    activeCategory === category.id
                      ? "bg-white/20 text-white border-0"
                      : "bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/15"
                  }
                `}
              >
                {category.count}
              </Badge>
            </div>
            
            {/* Active indicator for mobile */}
            {activeCategory === category.id && (
              <div className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full" />
            )}
          </Button>
        ))}
      </div>
    </div>
    
    {/* Optional: Category count summary for mobile */}
    <div className="sm:hidden flex items-center justify-center gap-2 text-xs text-muted-foreground">
      <span>
        {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}
      </span>
      <span>•</span>
      <span>
        {categories.reduce((sum, cat) => sum + cat.count, 0)} total items
      </span>
    </div>
  </div>
)}

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            <Card className="glass-card text-center p-8 hover-lift">
              <Star className="w-10 h-10 text-accent-amber mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.averageRating.toFixed(1)}
              </div>
              <div className="text-muted-foreground">Average Rating</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <Heart className="w-10 h-10 text-accent-rose mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.totalDiscoveries.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Curated Items</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <TrendingUp className="w-10 h-10 text-secondary mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.trending}
              </div>
              <div className="text-muted-foreground">Trending Now</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <Grid2X2 className="w-10 h-10 text-primary mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">
                {stats.categoriesTotal}
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
          {!loading && !error && allDiscoveries.length > 0 && hasMoreData && (
            <div className="text-center mt-12">
              <Button
                variant="outline"
                size="lg"
                className="hover-lift"
                onClick={loadMoreData}
                disabled={loadMoreLoading}
              >
                {loadMoreLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full mr-2"></div>
                    Loading More...
                  </>
                ) : (
                  <>
                    Load More Discoveries
                    <TrendingUp className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {/* End of Results */}
          {!loading && !error && allDiscoveries.length > 0 && !hasMoreData && (
            <div className="text-center mt-12">
              <div className="text-muted-foreground">
                🎉 You've seen all available discoveries! 
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => loadAllData()}
              >
                Refresh for new content
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Discover;