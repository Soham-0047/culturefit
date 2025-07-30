import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";

interface RecommendationCardProps {
  id: string; // Make sure this is passed from parent
  title: string;
  description: string;
  category: string;
  rating: number;
  trending?: boolean;
  image?: string;
  tags: string[];
  website?: string;
  isFavorited?: boolean; // Optional prop to indicate if already favorited
  onFavoriteChange?: (id: string, isFavorited: boolean) => void; // Callback for parent component
}

const RecommendationCard = ({
  id,
  title,
  description,
  category,
  rating,
  trending,
  image,
  tags,
  website,
  isFavorited = false,
  onFavoriteChange
}: RecommendationCardProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [favorited, setFavorited] = useState(isFavorited);
  const { toast } = useToast();
  
  // Backend API base URL
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  const handleFavoriteToggle = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      if (favorited) {
        // Remove from favorites
        await axios.delete(`${API_BASE_URL}/auth/favorites/${id}`, {
          withCredentials: true
        });
        
        setFavorited(false);
        toast({
          title: "Removed from favorites",
          description: `${title} has been removed from your favorites.`,
        });
      } else {
        // Add to favorites
        const favoriteData = {
          title,
          description,
          category,
          itemType: category, // Using category as itemType
          rating,
          image,
          url: website,
          tags,
          itemId: id // This will be used as the unique identifier
        };

        await axios.post(`${API_BASE_URL}/auth/favorites`, favoriteData, {
          withCredentials: true
        });
        
        setFavorited(true);
        toast({
          title: "Added to favorites",
          description: `${title} has been added to your favorites.`,
        });
      }
      
      // Notify parent component of the change
      onFavoriteChange?.(id, !favorited);
      
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="glass-card hover-lift group overflow-hidden">
      {image && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
          {trending && (
            <Badge className="absolute top-3 right-3 bg-accent-amber text-card border-0">
              <TrendingUp className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          )}
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Badge variant="secondary" className="mb-2 text-xs">
              {category}
            </Badge>
            <CardTitle className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
              {title}
            </CardTitle>
          </div>
          <div className="flex items-center space-x-1 text-accent-amber">
            <Star className="w-4 h-4 fill-current" />
            <span className="text-sm font-medium">{rating}</span>
          </div>
        </div>
        <CardDescription className="text-muted-foreground line-clamp-2">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.slice(0, 3).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2"
            onClick={handleFavoriteToggle}
            disabled={isLoading}
          >
            <Heart 
              className={`w-4 h-4 transition-colors ${
                favorited 
                  ? "fill-red-500 text-red-500" 
                  : "text-muted-foreground hover:text-red-500"
              } ${isLoading ? "opacity-50" : ""}`}
            />
          </Button>
          <Button 
            variant="pill" 
            size="sm"
            onClick={() => {
              if (website) {
                window.open(website, "_blank");
              } else {
                toast({
                  title: "No website available",
                  description: "This item doesn't have an associated website.",
                  variant: "destructive",
                });
              }
            }}
          >
            Explore
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;