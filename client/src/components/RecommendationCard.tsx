import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Star, TrendingUp } from "lucide-react";

interface RecommendationCardProps {
  title: string;
  description: string;
  category: string;
  rating: number;
  trending?: boolean;
  image?: string;
  tags: string[];
}

const RecommendationCard = ({
  title,
  description,
  category,
  rating,
  trending,
  image,
  tags,
  website
}: RecommendationCardProps) => {

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
          <Button variant="ghost" size="sm" className="p-2">
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="pill" size="sm"
            onClick={() => {
              if (website) {
                window.open(website, "_blank");
              } else {
                alert("No website available");
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