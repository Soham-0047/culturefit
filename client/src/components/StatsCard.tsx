import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: React.ReactNode;
  description?: string;
}

const StatsCard = ({ title, value, change, changeType, icon, description }: StatsCardProps) => {
  const changeIcon = changeType === "positive" ? TrendingUp : TrendingDown;
  const ChangeIcon = changeIcon;

  return (
    <Card className="glass-card hover-lift">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
          <div className={cn(
            "flex items-center space-x-1",
            changeType === "positive" && "text-secondary",
            changeType === "negative" && "text-destructive",
            changeType === "neutral" && "text-muted-foreground"
          )}>
            <ChangeIcon className="w-3 h-3" />
            <span>{change}</span>
          </div>
          <span>from last month</span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-2">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatsCard;