import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity, 
  Target,
  Calendar,
  Users,
  Heart,
  Star,
  Eye,
  Zap
} from "lucide-react";

const Insights = () => {
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("engagement");

  const keyMetrics = [
    {
      title: "Cultural Engagement",
      value: "94.3%",
      change: "+12.5%",
      changeType: "positive",
      icon: <Heart className="w-5 h-5" />,
      description: "Your active participation in cultural discoveries"
    },
    {
      title: "Trend Accuracy",
      value: "87.2%",
      change: "+5.7%",
      changeType: "positive", 
      icon: <Target className="w-5 h-5" />,
      description: "How well your predictions align with actual trends"
    },
    {
      title: "Discovery Rate",
      value: "156",
      change: "+23.1%",
      changeType: "positive",
      icon: <Zap className="w-5 h-5" />,
      description: "New cultural items discovered this month"
    },
    {
      title: "Influence Score",
      value: "8.2K",
      change: "-2.1%",
      changeType: "negative",
      icon: <Users className="w-5 h-5" />,
      description: "People influenced by your taste recommendations"
    }
  ];

  const categoryBreakdown = [
    { category: "Visual Arts", percentage: 32, value: 847, color: "bg-primary" },
    { category: "Music", percentage: 28, value: 742, color: "bg-secondary" },
    { category: "Film & Cinema", percentage: 18, value: 476, color: "bg-accent-rose" },
    { category: "Literature", percentage: 12, value: 318, color: "bg-accent-amber" },
    { category: "Design", percentage: 10, value: 265, color: "bg-accent-purple" }
  ];

  const trendAnalysis = [
    {
      trend: "Minimalist Aesthetics",
      growth: "+45%",
      prediction: "Continued growth",
      confidence: 92,
      timeframe: "Next 6 months"
    },
    {
      trend: "Sustainable Design",
      growth: "+38%", 
      prediction: "Accelerating adoption",
      confidence: 89,
      timeframe: "Next 3 months"
    },
    {
      trend: "Neo-Soul Revival",
      growth: "+29%",
      prediction: "Peak approaching",
      confidence: 76,
      timeframe: "Next 2 months"
    },
    {
      trend: "Digital Art Integration",
      growth: "+52%",
      prediction: "Emerging mainstream",
      confidence: 84,
      timeframe: "Next 4 months"
    }
  ];

  const compareData = [
    { metric: "Aesthetic Preference", you: 92, peers: 78 },
    { metric: "Trend Sensitivity", you: 87, peers: 65 },
    { metric: "Cultural Diversity", you: 84, peers: 72 },
    { metric: "Discovery Rate", you: 91, peers: 68 },
    { metric: "Influence Factor", you: 76, peers: 58 }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-6 pill-button bg-primary/10 text-primary border-primary/20 animate-fade-in-scale">
              <BarChart3 className="w-3 h-3 mr-1 animate-pulse" />
              Advanced Analytics
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold font-poppins text-foreground mb-6">
              <span className="gradient-text animate-glow">Cultural</span> Insights
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-inter">
              Deep analytics powered by AI to reveal your taste evolution and cultural impact patterns
            </p>
            
            <div className="flex items-center justify-center gap-4 mt-8">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 glass-card border-primary/20 bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-primary/20">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="pill-glass" className="hover-lift">
                <Calendar className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {keyMetrics.map((metric, index) => (
              <Card key={index} className="glass-card hover-lift group animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-foreground mb-2">{metric.value}</div>
                  <div className="flex items-center space-x-2">
                    <Badge className={`${
                      metric.changeType === "positive" 
                        ? "bg-secondary/20 text-secondary border-secondary/30" 
                        : "bg-destructive/20 text-destructive border-destructive/30"
                    } rounded-full px-3 py-1`}>
                      {metric.changeType === "positive" ? 
                        <TrendingUp className="w-3 h-3 mr-1" /> : 
                        <TrendingDown className="w-3 h-3 mr-1" />
                      }
                      <span className="font-medium">{metric.change}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">vs last period</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{metric.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Analytics */}
          <Tabs defaultValue="breakdown" className="space-y-8">
            <div className="flex justify-center">
              <TabsList className="glass-card p-2 bg-white/5 border-primary/20 rounded-2xl backdrop-blur-xl">
                <TabsTrigger 
                  value="breakdown" 
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  Category Breakdown
                </TabsTrigger>
                <TabsTrigger 
                  value="trends" 
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  Trend Analysis
                </TabsTrigger>
                <TabsTrigger 
                  value="comparison" 
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  Peer Comparison
                </TabsTrigger>
                <TabsTrigger 
                  value="evolution" 
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  Taste Evolution
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Category Breakdown */}
            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                      </div>
                      Cultural Interest Distribution
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Breakdown of your cultural engagement by category
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {categoryBreakdown.map((category, index) => (
                      <div key={index} className="space-y-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{category.category}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono">{category.value}</span>
                            <Badge 
                              variant="secondary" 
                              className="bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-1 font-bold"
                            >
                              {category.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <Progress value={category.percentage} className="h-3 bg-muted/30" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center">
                        <Activity className="w-5 h-5 text-white" />
                      </div>
                      Engagement Heatmap
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Your cultural activity patterns over the past 7 weeks
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-7 gap-2 p-4 rounded-xl bg-white/5">
                      {Array.from({ length: 49 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-4 h-4 rounded-lg transition-all duration-300 hover:scale-125 ${
                            Math.random() > 0.3 ? 
                            Math.random() > 0.7 ? 'bg-gradient-primary shadow-card' : 'bg-primary/60' : 'bg-muted/50'
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded bg-muted/50"></div>
                        <span className="text-sm text-muted-foreground">Less active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">More active</span>
                        <div className="w-3 h-3 rounded bg-gradient-primary"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Trend Analysis */}
            <TabsContent value="trends" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Cultural Trend Predictions
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis of emerging cultural trends based on your taste profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {trendAnalysis.map((trend, index) => (
                      <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-foreground">{trend.trend}</h3>
                            <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                              {trend.growth}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{trend.prediction}</p>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Confidence:</span>
                              <Progress value={trend.confidence} className="w-16 h-1" />
                              <span className="text-xs font-medium text-foreground">{trend.confidence}%</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{trend.timeframe}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Peer Comparison */}
            <TabsContent value="comparison" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Taste Profile Comparison
                  </CardTitle>
                  <CardDescription>
                    How your cultural preferences compare to similar users
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {compareData.map((item, index) => (
                    <div key={index} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{item.metric}</span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-primary font-medium">You: {item.you}%</span>
                          <span className="text-muted-foreground">Peers: {item.peers}%</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-primary w-8">You</span>
                          <Progress value={item.you} className="h-2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-8">Avg</span>
                          <Progress value={item.peers} className="h-2 opacity-50" />
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Taste Evolution */}
            <TabsContent value="evolution" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Cultural Taste Evolution
                  </CardTitle>
                  <CardDescription>
                    Timeline of how your preferences have evolved over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {/* Simplified evolution chart representation */}
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-px bg-border"></div>
                      <div className="space-y-6">
                        {[
                          { period: "Q1 2024", change: "Discovered minimalist design", impact: "High" },
                          { period: "Q2 2024", change: "Shifted to sustainable fashion", impact: "Medium" },
                          { period: "Q3 2024", change: "Embraced neo-soul music", impact: "High" },
                          { period: "Q4 2024", change: "Developed art collecting interest", impact: "Very High" }
                        ].map((event, index) => (
                          <div key={index} className="relative flex items-center gap-4">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{event.period}</span>
                                <Badge variant="outline" className="text-xs">{event.impact} Impact</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{event.change}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Insights;