import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import OAuthModal from "@/components/OAuthModal";
import { 
  Sparkles, 
  TrendingUp, 
  Music, 
  Coffee, 
  MapPin, 
  Users, 
  Star, 
  ArrowRight,
  Brain,
  Headphones,
  Camera,
  Play,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Zap,
  Globe,
  Shield,
  Infinity
} from "lucide-react";

const Index = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);

  const features = [
    {
      icon: <Headphones className="w-8 h-8" />,
      title: "Voice-Driven Discovery",
      description: "Simply tell us what you're in the mood for, and our AI will understand your desires and recommend the perfect cultural experiences.",
      color: "accent-amber"
    },
    {
      icon: <Brain className="w-8 h-8" />,
      title: "Cultural Compatibility Scores",
      description: "Get precise compatibility ratings for music, dining, travel, and entertainment based on your unique taste profile.",
      color: "primary"
    },
    {
      icon: <TrendingUp className="w-8 h-8" />,
      title: "Trend Prediction",
      description: "Stay ahead of cultural movements with AI that predicts what you'll love before it goes mainstream.",
      color: "secondary"
    }
  ];

  const platformBenefits = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Lightning Fast",
      description: "Get instant recommendations",
      color: "accent-amber"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Global Reach",
      description: "150+ countries supported",
      color: "secondary"
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Privacy First",
      description: "Your data stays secure",
      color: "primary"
    },
    {
      icon: <Infinity className="w-6 h-6" />,
      title: "Endless Discovery",
      description: "Never run out of options",
      color: "accent-rose"
    }
  ];

  useEffect(() => {
    localStorage.setItem("culturesense-ui-theme", "dark");
  },[])
  
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-hero-bg opacity-90" />
      <div className="fixed inset-0 bg-gradient-glass backdrop-blur-3xl" />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-8 pill-button bg-white/10 text-white border-white/20 animate-fade-in-scale backdrop-blur-md">
            <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
            Powered by Qloo's Taste AI™
          </Badge>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold font-poppins mb-8 leading-tight">
            <span className="text-white drop-shadow-2xl">Discover Your</span>
            <br />
            <span className="text-accent-amber drop-shadow-2xl animate-glow">Cultural World</span>
            <br />
            <span className="text-white drop-shadow-2xl">with CultureSense AI</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-4xl mx-auto leading-relaxed font-inter drop-shadow-lg">
            Personalized music, dining, and travel recommendations based on your unique tastes. 
            Our AI understands your cultural DNA to unlock experiences you'll love.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-16">
            <Button 
              onClick={() => setShowAuthModal(true)}
              className="ripple text-lg font-semibold px-8 py-4 h-auto rounded-2xl bg-gradient-primary text-white border-0 hover:scale-105 transition-all duration-300 shadow-elevation"
            >
              Get Started
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <Button 
              variant="outline"
              className="text-lg font-semibold px-8 py-4 h-auto rounded-2xl bg-white/10 text-white border-white/30 backdrop-blur-md hover:bg-white/20 hover:scale-105 transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              Watch Demo
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="glass-card bg-white/5 border-white/20 text-center p-6">
              <div className="text-3xl font-bold text-white mb-2">2M+</div>
              <div className="text-white/70">Cultural Connections</div>
            </div>
            <div className="glass-card bg-white/5 border-white/20 text-center p-6">
              <div className="text-3xl font-bold text-white mb-2">94.3%</div>
              <div className="text-white/70">Accuracy Rate</div>
            </div>
            <div className="glass-card bg-white/5 border-white/20 text-center p-6">
              <div className="text-3xl font-bold text-white mb-2">150K+</div>
              <div className="text-white/70">Active Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              <span className="gradient-text">Intelligent Cultural</span> Discovery
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Experience the future of personalized recommendations with AI that truly understands your taste
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="glass-card hover-lift group animate-scale-in border-white/20"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <CardHeader className="text-center pb-4">
                  <div className={`w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center bg-${feature.color}/20 group-hover:scale-110 transition-transform duration-300`}>
                    <div className={`text-${feature.color}`}>
                      {feature.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-bold text-foreground mb-4">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed text-center">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Category Icons */}
          <div className="flex items-center justify-center gap-12 mt-16 flex-wrap">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Music className="w-6 h-6 text-accent-amber" />
              <span className="font-medium">Music</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Coffee className="w-6 h-6 text-accent-rose" />
              <span className="font-medium">Dining</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-6 h-6 text-secondary" />
              <span className="font-medium">Travel</span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Camera className="w-6 h-6 text-primary" />
              <span className="font-medium">Arts</span>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Benefits Section */}
      <section className="relative py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              <span className="gradient-text">Why Choose</span> CultureSense?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Join millions of users who trust our platform for discovering their next favorite cultural experience
            </p>
          </div>

          {/* Animated Counter Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {platformBenefits.map((benefit, index) => (
              <Card 
                key={index}
                className="glass-card border-white/20 text-center p-6 hover-lift group animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center bg-${benefit.color}/20 group-hover:scale-110 transition-transform duration-300`}>
                  <div className={`text-${benefit.color}`}>
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="font-bold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </Card>
            ))}
          </div>

          {/* Interactive Demo Preview */}
          <div className="max-w-4xl mx-auto">
            <Card className="glass-card border-white/20 p-8 hover-lift">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-4">
                  Experience AI-Powered Recommendations
                </h3>
                <p className="text-muted-foreground">
                  See how our AI understands your taste and delivers personalized cultural discoveries
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h4 className="font-semibold text-foreground">Tell Us Your Preferences</h4>
                  <p className="text-sm text-muted-foreground">Share what you love - music genres, food types, travel styles</p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                    <Brain className="w-8 h-8 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-foreground">AI Analyzes Your Taste</h4>
                  <p className="text-sm text-muted-foreground">Our algorithm creates your unique cultural DNA profile</p>
                </div>
                
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent-amber/20 flex items-center justify-center mx-auto">
                    <Star className="w-8 h-8 text-accent-amber" />
                  </div>
                  <h4 className="font-semibold text-foreground">Discover Amazing Experiences</h4>
                  <p className="text-sm text-muted-foreground">Get curated recommendations you'll absolutely love</p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <Button 
                  onClick={() => setShowAuthModal(true)}
                  className="ripple bg-gradient-primary text-white hover:scale-105 transition-all duration-300"
                >
                  Start Your Cultural Journey
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-2xl font-bold gradient-text mb-4">CultureSense AI</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Discover your cultural world with AI-powered recommendations that understand your unique taste.
              </p>
              <div className="flex gap-4">
                <Button size="icon" variant="outline" className="glass-card border-white/20 hover:scale-110">
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="glass-card border-white/20 hover:scale-110">
                  <Instagram className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="glass-card border-white/20 hover:scale-110">
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="outline" className="glass-card border-white/20 hover:scale-110">
                  <Youtube className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">About</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Press</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Contact</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-secondary transition-colors">Help Center</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="my-8" />
          
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-muted-foreground text-sm">
              © 2024 CultureSense AI. All rights reserved.
            </p>
            <p className="text-muted-foreground text-sm">
              Powered by Qloo's Taste AI™ Technology
            </p>
          </div>
        </div>
      </footer>

      {/* OAuth Modal */}
      <OAuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
};

export default Index;