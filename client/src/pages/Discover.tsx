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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = import.meta.env.VITE_APP_QLOO_API_KEY || "fallback-key-here";
  const API_URL = import.meta.env.VITE_APP_QLOO_API_URL || "https://hackathon.api.qloo.com";


 const categories = [
    { id: "all", label: "All Categories", count: 847, type: "urn:entity:movie", defaultTag: null },
    { id: "film", label: "Film & Cinema", count: 156, type: "urn:entity:movie", defaultTag: "urn:tag:genre:media:minimalist" },
    { id: "music", label: "Music", count: 234, type: "urn:entity:music", defaultTag: "urn:tag:genre:media:soulful" },
    { id: "literature", label: "Literature", count: 89, type: "urn:entity:book", defaultTag: "urn:tag:genre:media:nonfiction" },
    { id: "art", label: "Visual Arts", count: 145, type: "urn:entity:art", defaultTag: "urn:tag:genre:media:contemporary" },
    { id: "design", label: "Design", count: 223, type: "urn:entity:design", defaultTag: "urn:tag:genre:media:sustainable" },
  ];

  const fetchInsights = async (category = "all") => {
    setLoading(true);
    setError(null);
    try {
      const selectedCategory = categories.find((cat) => cat.id === category) || categories[0];
      const params = {
        "filter.type": selectedCategory.type,
        "filter.release_year.min": "2022",
        limit: 10,
      };

      if (category !== "all" && selectedCategory.defaultTag) {
        params["filter.tags"] = selectedCategory.defaultTag;
      }

      const response = await axios.get(`${API_URL}/v2/insights`, {
        params,
        headers: {
          "X-API-Key": API_KEY,
          "Content-Type": "application/json",
        },
      });

      processData(response.data);
    } catch (err) {
      const errorMessage = err.response?.data?.errors?.[0]?.message || err.message;
      console.error("API Error:", errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const processData = (data) => {
    console.log("API Response:", data);
     const formattedDiscoveries = data.results?.entities?.map((item, index) => {
    // Helper: Parse numeric rating safely
    const parseNumber = (val) => {
      const num = typeof val === 'string' ? parseFloat(val) : val;
      return isNaN(num) ? null : num;
    };

    // Extract ratings from known platforms
    const imdbRating = parseNumber(item.external?.imdb?.[0]?.user_rating);
    const metacriticRating = parseNumber(item.external?.metacritic?.[0]?.user_rating) * 10; // scale to 100
    const rtRating = parseNumber(item.external?.rottentomatoes?.find(r => r.user_rating)?.user_rating);

    // Normalize to a 10-point scale
    const normalizedRatings = [
      imdbRating,
      metacriticRating ? metacriticRating / 10 : null,
      rtRating ? rtRating / 10 : null
    ].filter(r => r !== null); // Remove nulls

    // Calculate average rating if possible
    const averageRating = normalizedRatings.length
      ? (normalizedRatings.reduce((a, b) => a + b, 0) / normalizedRatings.length).toFixed(1)
      : (4.5 + Math.random() * 0.5).toFixed(1); // fallback
    const subtype = item.subtype?.split(':').pop();
    // Ensure tags is an array
    const tags = Array.isArray(item.tags)
      ? item.tags.map(tag => typeof tag === 'object' && tag.name ? tag.name : tag)
      : ["Curated", "Cultural"];
    console.log(item,"Jodi");
    return {
      title: item.name || `Recommendation ${index + 1}`,
      description: item.properties.description || `Explore cultural items in ${item.type?.split(':').pop() || 'this category'}.`,
      category: subtype ? subtype.charAt(0).toUpperCase() + subtype.slice(1) : "Unknown",
      rating: Number(averageRating),
      trending: item.relevance_score ? item.relevance_score > 0.8 : index % 2 === 0,
      image: item.properties.image?.url || `https://images.unsplash.com/photo-${index % 5 === 0 ? "1489599510096" : "1493225457124"}?w=400&h=300&fit=crop`,
      tags,
      website: item.properties.websites?.[0] || item.properties.websites?.[1] || null,
    };
  }) || [];
    console.log("Formatted Discoveries:", formattedDiscoveries);
    setDiscoveries(formattedDiscoveries);
  };

  useEffect(() => {
    fetchInsights(activeCategory);
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
              <span className="gradient-text animate-glow">Discover</span> Culture
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-inter">
              AI-powered cultural discoveries tailored to your unique taste profile
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row items-center gap-8 mb-16">
            <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  size="lg"
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    whitespace-nowrap px-8 py-4 rounded-2xl transition-all duration-300 min-w-fit
                    ${activeCategory === category.id 
                      ? "bg-gradient-primary text-white shadow-hover border-0 scale-105" 
                      : "glass-card border-primary/20 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:scale-102"
                    }
                  `}
                >
                  <span className="font-medium">{category.label}</span>
                  <Badge 
                    variant="secondary" 
                    className={`ml-3 text-xs rounded-full px-2 py-1 ${
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
              <div className="text-3xl font-bold text-foreground mb-2">4.8</div>
              <div className="text-muted-foreground">Average Rating</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <Heart className="w-10 h-10 text-accent-rose mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">847</div>
              <div className="text-muted-foreground">Curated Items</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <TrendingUp className="w-10 h-10 text-secondary mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">23</div>
              <div className="text-muted-foreground">Trending Now</div>
            </Card>
            <Card className="glass-card text-center p-8 hover-lift">
              <Grid2X2 className="w-10 h-10 text-primary mx-auto mb-4 hover-glow" />
              <div className="text-3xl font-bold text-foreground mb-2">156</div>
              <div className="text-muted-foreground">Categories</div>
            </Card>
          </div>

          {/* Loading/Error States */}
          {loading && <div className="text-center text-muted-foreground">Loading cultural discoveries...</div>}
          {error && (
            <div className="text-center text-destructive">
              Error: {error}. Using fallback data.
            </div>
          )}

          {/* Trending Section */}
          {!loading && !error && (
            <div className="mb-16">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-3">
                    <span className="gradient-text">Trending</span> Discoveries
                  </h2>
                  <p className="text-lg text-muted-foreground max-w-2xl">
                    Popular cultural finds among users with similar taste profiles
                  </p>
                </div>
                <Badge className="bg-accent-amber/20 text-accent-amber border-accent-amber/30 px-4 py-2 hover-lift">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Hot Cultural Trends
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {discoveries.filter((d) => d.trending).map((discovery, index) => (
                  <div key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <RecommendationCard {...discovery}/>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Discoveries */}
          {!loading && !error && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Personalized Discoveries
                  </h2>
                  <p className="text-muted-foreground">
                    Curated based on your taste evolution and preference patterns
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
                {discoveries.map((discovery, index) => (
                  <div key={index} className="animate-scale-in" style={{ animationDelay: `${index * 0.15}s` }}>
                    <RecommendationCard {...discovery} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Load More */}
          <div className="text-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="hover-lift"
              onClick={() => fetchInsights(activeCategory)}
            >
              Load More Discoveries
              <TrendingUp className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Discover;