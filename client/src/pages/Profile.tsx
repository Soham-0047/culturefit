import { useState } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Edit
} from "lucide-react";

const Profile = () => {
  const [notifications, setNotifications] = useState(true);
  const [publicProfile, setPublicProfile] = useState(false);
  const [aiInsights, setAiInsights] = useState(true);

  const tasteEvolution = [
    {
      period: "Jan 2024",
      description: "Discovered minimalist design principles",
      category: "Design",
      impact: "High"
    },
    {
      period: "Feb 2024", 
      description: "Developed appreciation for neo-soul music",
      category: "Music",
      impact: "Medium"
    },
    {
      period: "Mar 2024",
      description: "Shifted towards sustainable fashion",
      category: "Fashion",
      impact: "High"
    },
    {
      period: "Apr 2024",
      description: "Embraced Scandinavian aesthetics",
      category: "Lifestyle",
      impact: "Very High"
    }
  ];

  const preferences = [
    { category: "Visual Arts", strength: 92, color: "bg-primary" },
    { category: "Music", strength: 88, color: "bg-secondary" },
    { category: "Film", strength: 85, color: "bg-accent-rose" },
    { category: "Literature", strength: 78, color: "bg-accent-amber" },
    { category: "Design", strength: 95, color: "bg-accent-purple" }
  ];

  const stats = [
    { label: "Cultural Discoveries", value: "2,847", icon: <Heart className="w-5 h-5" /> },
    { label: "AI Conversations", value: "156", icon: <MessageSquare className="w-5 h-5" /> },
    { label: "Trend Predictions", value: "94.3%", icon: <TrendingUp className="w-5 h-5" /> },
    { label: "Profile Views", value: "1.2K", icon: <Eye className="w-5 h-5" /> }
  ];

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
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback className="bg-gradient-primary text-white text-2xl">
                        CS
                      </AvatarFallback>
                    </Avatar>
                    <div className="status-online w-6 h-6 rounded-full absolute -bottom-1 -right-1 border-2 border-card"></div>
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                      <h1 className="text-3xl font-bold text-foreground">
                        Cultural Explorer
                      </h1>
                      <Badge className="bg-secondary/20 text-secondary border-secondary/30">
                        <Star className="w-3 h-3 mr-1" />
                        Elite Curator
                      </Badge>
                    </div>
                    
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                      AI-powered cultural analyst with a passion for discovering emerging trends and connecting 
                      diverse artistic expressions. Specializing in minimalist aesthetics and sustainable design.
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      {stats.map((stat, index) => (
                        <div key={index} className="text-center">
                          <div className="flex items-center justify-center text-primary mb-2">
                            {stat.icon}
                          </div>
                          <div className="text-xl font-bold text-foreground">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="default">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                      <Button variant="outline">
                        <Settings className="w-4 h-4 mr-2" />
                        Preferences
                      </Button>
                      <Button variant="glass">
                        Share Profile
                      </Button>
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
                    Your preference strength across different cultural categories
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {preferences.map((pref, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{pref.category}</span>
                        <span className="text-sm text-muted-foreground">{pref.strength}%</span>
                      </div>
                      <Progress value={pref.strength} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Taste Evolution Timeline */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Taste Evolution Timeline
                  </CardTitle>
                  <CardDescription>
                    How your cultural preferences have evolved over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {tasteEvolution.map((event, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                          {index < tasteEvolution.length - 1 && (
                            <div className="w-px h-12 bg-border mt-2"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">{event.period}</span>
                            <Badge variant="outline" className="text-xs">
                              {event.category}
                            </Badge>
                            <Badge 
                              className={`text-xs ${
                                event.impact === "Very High" ? "bg-primary/20 text-primary" :
                                event.impact === "High" ? "bg-secondary/20 text-secondary" :
                                "bg-muted text-muted-foreground"
                              }`}
                            >
                              {event.impact}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
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
                      onCheckedChange={setNotifications}
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
                      onCheckedChange={setPublicProfile}
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
                      onCheckedChange={setAiInsights}
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
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-secondary rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Discovered new jazz collection</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-rose rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">AI conversation about film trends</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-accent-amber rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Updated design preferences</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">Joined minimalist community</p>
                      <p className="text-xs text-muted-foreground">1 week ago</p>
                    </div>
                  </div>
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
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="w-4 h-4 mr-2" />
                    Advanced Settings
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;