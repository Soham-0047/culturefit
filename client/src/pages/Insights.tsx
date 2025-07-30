import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Zap,
  Brain,
  Sparkles,
  Compass,
  Lightbulb,
  MessageCircle,
  RefreshCw,
  Download,
  Share2,
} from "lucide-react";
import Navigation from "@/components/Navigation";

const EnhancedInsights = () => {
 
    const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("engagement");
  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [aiInsights, setAiInsights] = useState({
    personality: null,
    predictions: null,
    recommendations: null,
    journey: null,
  });
  const [error, setError] = useState(null);
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  // Export functionality
  const exportToPDF = (data) => {
    const reportContent = generateReportContent(data);
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI Cultural Insights Report</title>
        <style>
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            margin: 0; 
            padding: 20px; 
            color: #333;
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #e0e0e0;
            padding-bottom: 20px;
          }
          .section { 
            margin-bottom: 25px; 
            page-break-inside: avoid;
          }
          .section h2 { 
            color: #2563eb; 
            border-left: 4px solid #2563eb;
            padding-left: 15px;
            margin-bottom: 15px;
          }
          .metric-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 15px; 
            margin-bottom: 20px;
          }
          .metric-card { 
            border: 1px solid #e0e0e0; 
            border-radius: 8px; 
            padding: 15px;
            background: #f9f9f9;
          }
          .trait-item { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 10px;
            padding: 8px;
            background: white;
            border-radius: 4px;
          }
          .prediction-item { 
            border: 1px solid #e0e0e0; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 15px;
            background: white;
          }
          .recommendation-item { 
            border: 1px solid #e0e0e0; 
            border-radius: 8px; 
            padding: 15px; 
            margin-bottom: 15px;
            background: white;
          }
          .category-item { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 10px;
            padding: 10px;
            background: white;
            border-radius: 4px;
          }
          .footer { 
            text-align: center; 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        ${reportContent}
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const exportToCSV = (data) => {
    const csvData = [];
    
    // Add headers
    csvData.push(['Section', 'Item', 'Value', 'Details']);
    
    // Add personality data
    if (data.personality?.analysis?.coreTraits) {
      Object.entries(data.personality.analysis.coreTraits).forEach(([trait, score]) => {
        csvData.push(['Personality', trait, typeof score === 'number' ? `${score}%` : score, 'Core trait analysis']);
      });
    }
    
    // Add predictions data
    if (data.predictions && Array.isArray(data.predictions)) {
      data.predictions.forEach((pred, index) => {
        csvData.push(['Predictions', `Prediction ${index + 1}`, pred.trend, pred.reasoning]);
      });
    }
    
    // Add recommendations data
    const recommendations = getRecommendationsArray();
    recommendations.forEach((rec, index) => {
      csvData.push(['Recommendations', `Recommendation ${index + 1}`, rec.title, rec.reasoning]);
    });
    
    // Convert to CSV format
    const csvContent = csvData.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ai-insights-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (data) => {
    const exportData = {
      exportDate: new Date().toISOString(),
      timeRange,
      insights: data,
      metadata: {
        version: "1.0",
        source: "AI Cultural Insights Platform"
      }
    };
    
    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ai-insights-data-${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateReportContent = (data) => {
    const currentDate = new Date().toLocaleDateString();
    const recommendations = getRecommendationsArray();
    const predictions = getPredictionsArray();
    
    return `
      <div class="header">
        <h1>AI Cultural Insights Report</h1>
        <p>Generated on ${currentDate} | Time Range: ${timeRange}</p>
      </div>

      <div class="section">
        <h2>Executive Summary</h2>
        <p>This report provides comprehensive AI-powered analysis of your cultural preferences, behavioral patterns, and personalized recommendations based on advanced machine learning algorithms.</p>
      </div>

      <div class="section">
        <h2>Key Metrics</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <h4>AI Personality Score</h4>
            <p><strong>${data.personality?.analysis?.confidence ? `${data.personality.analysis.confidence}%` : '0%'}</strong></p>
            <small>AI-analyzed cultural personality traits</small>
          </div>
          <div class="metric-card">
            <h4>Trend Prediction Accuracy</h4>
            <p><strong>${predictions.length > 0 ? `${Math.round(predictions.reduce((acc, pred) => acc + (pred.confidence || 0), 0) / predictions.length)}%` : '0%'}</strong></p>
            <small>How well AI predictions match your interests</small>
          </div>
          <div class="metric-card">
            <h4>Smart Discovery Rate</h4>
            <p><strong>${recommendations.length}</strong></p>
            <small>AI-recommended items discovered this month</small>
          </div>
        </div>
      </div>

      ${data.personality?.analysis?.coreTraits ? `
      <div class="section">
        <h2>Personality Analysis</h2>
        <p>AI-analyzed personality traits based on your cultural preferences:</p>
        ${Object.entries(data.personality.analysis.coreTraits).map(([trait, score]) => `
          <div class="trait-item">
            <span>${trait.replace(/([A-Z])/g, ' $1')}</span>
            <span><strong>${typeof score === 'number' ? `${score}%` : score}</strong></span>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${predictions.length > 0 ? `
      <div class="section">
        <h2>AI Trend Predictions</h2>
        <p>Machine learning analysis of emerging cultural trends:</p>
        ${predictions.map((pred, index) => `
          <div class="prediction-item">
            <h4>${index + 1}. ${pred.trend}</h4>
            <p><strong>Category:</strong> ${pred.category}</p>
            <p><strong>Reasoning:</strong> ${pred.reasoning}</p>
            <p><strong>Confidence:</strong> ${pred.confidence || 0}% | <strong>Timeline:</strong> ${pred.timeline}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}

      ${recommendations.length > 0 ? `
      <div class="section">
        <h2>AI Recommendations</h2>
        <p>Context-aware cultural recommendations powered by advanced AI:</p>
        ${recommendations.map((rec, index) => `
          <div class="recommendation-item">
            <h4>${rec.title}</h4>
            <p><strong>Creator:</strong> ${rec.creator}</p>
            <p><strong>Category:</strong> ${rec.category}</p>
            <p><strong>Reasoning:</strong> ${rec.reasoning}</p>
            ${rec.moodMatch ? `<p><strong>Mood Match:</strong> ${rec.moodMatch}%</p>` : ''}
          </div>
        `).join('')}
      </div>
      ` : ''}

      <div class="section">
        <h2>Category Analysis</h2>
        <p>Distribution of your cultural interests with AI confidence scores:</p>
        ${categoryBreakdown.map(category => `
          <div class="category-item">
            <div>
              <strong>${category.category}</strong>
              <br><small>AI Confidence: ${category.aiConfidence}%</small>
            </div>
            <div>
              <strong>${category.percentage}%</strong>
              <br><small>${category.value} items</small>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <p>This report was generated by AI Cultural Insights Platform using advanced machine learning algorithms.</p>
        <p>For questions or support, please contact our team.</p>
      </div>
    `;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      // Simulate a brief loading time for better UX
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const exportData = {
        personality: aiInsights.personality,
        predictions: aiInsights.predictions,
        recommendations: aiInsights.recommendations,
        journey: aiInsights.journey,
        timeRange,
        exportDate: new Date().toISOString()
      };

      switch (exportFormat) {
        case 'pdf':
          exportToPDF(exportData);
          break;
        case 'csv':
          exportToCSV(exportData);
          break;
        case 'json':
          exportToJSON(exportData);
          break;
        default:
          exportToPDF(exportData);
      }
    } catch (error) {
      setError('Failed to export report. Please try again.');
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Fetch AI-powered insights
  const fetchAIInsights = async (type) => {
    setLoading(true);
    setError(null);

    try {
      let response;
      switch (type) {
        case "personality":
          response = await fetch(
            `${API_BASE_URL}/ai-insights/personality-analysis`,
            {
              credentials: "include",
            }
          );
          break;
        case "predictions":
          response = await fetch(
            `${API_BASE_URL}/ai-insights/trend-predictions?timeframe=${timeRange}`,
            {
              credentials: "include",
            }
          );
          break;
        case "recommendations":
          response = await fetch(
            `${API_BASE_URL}/ai-insights/smart-recommendations`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                mood: "exploratory",
                context: "discovering new interests",
              }),
            }
          );
          break;
        case "journey":
          response = await fetch(
            `${API_BASE_URL}/ai-insights/cultural-journey`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                goal: "Expand cultural horizons",
                duration: "3 months",
                intensity: "moderate",
              }),
            }
          );
          break;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to fetch insights");
      }

      const data = await response.json();

      // Handle different response structures
      if (type === "predictions" && data.predictions) {
        setAiInsights((prev) => ({ ...prev, [type]: data.predictions }));
      } else {
        setAiInsights((prev) => ({ ...prev, [type]: data }));
      }
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${type} insights:`, err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    // Fetch all insights on component mount
    fetchAIInsights("personality");
    fetchAIInsights("predictions");
    fetchAIInsights("recommendations");
    fetchAIInsights("journey");
  }, []);

  // Helper function to safely get recommendations array
  const getRecommendationsArray = () => {
    if (!aiInsights.recommendations) return [];
    if (Array.isArray(aiInsights.recommendations))
      return aiInsights.recommendations;
    if (aiInsights.recommendations.recommendations.recommendations) {
      if (
        Array.isArray(
          aiInsights.recommendations.recommendations.recommendations
        )
      ) {
        return aiInsights.recommendations.recommendations.recommendations;
      }
    }
    return [];
  };

  // Helper function to safely get predictions array
  const getPredictionsArray = () => {
    if (!aiInsights.predictions) return [];
    if (Array.isArray(aiInsights.predictions)) return aiInsights.predictions;
    if (aiInsights.predictions.predictions) {
      if (Array.isArray(aiInsights.predictions.predictions)) {
        return aiInsights.predictions.predictions;
      }
    }
    return [];
  };

  const keyMetrics = [
    {
      title: "AI Personality Score",
      value: aiInsights.personality?.analysis?.confidence
        ? `${aiInsights.personality.analysis.confidence}%`
        : "0%",
      change: "+0%",
      changeType: "positive",
      icon: <Brain className="w-5 h-5" />,
      description: "AI-analyzed cultural personality traits",
    },
    {
      title: "Trend Prediction Accuracy",
      value:
        getPredictionsArray().length > 0
          ? `${Math.round(
              getPredictionsArray().reduce(
                (acc, pred) => acc + (pred.confidence || 0),
                0
              ) / getPredictionsArray().length
            )}%`
          : "0%",
      change: "+0%",
      changeType: "positive",
      icon: <Target className="w-5 h-5" />,
      description: "How well AI predictions match your interests",
    },
    {
      title: "Smart Discovery Rate",
      value: getRecommendationsArray().length,
      change: "+0%",
      changeType: "positive",
      icon: <Sparkles className="w-5 h-5" />,
      description: "AI-recommended items discovered this month",
    },
    {
      title: "Cultural Growth Index",
      value: "0K",
      change: "+0%",
      changeType: "positive",
      icon: <Compass className="w-5 h-5" />,
      description: "AI-measured cultural exploration progress",
    },
  ];

  const categoryBreakdown = [
    {
      category: "Visual Arts",
      percentage: 32,
      value: 847,
      color: "bg-primary",
      aiConfidence: 94,
    },
    {
      category: "Music",
      percentage: 28,
      value: 742,
      color: "bg-secondary",
      aiConfidence: 87,
    },
    {
      category: "Film & Cinema",
      percentage: 18,
      value: 476,
      color: "bg-accent-rose",
      aiConfidence: 91,
    },
    {
      category: "Literature",
      percentage: 12,
      value: 318,
      color: "bg-accent-amber",
      aiConfidence: 83,
    },
    {
      category: "Design",
      percentage: 10,
      value: 265,
      color: "bg-accent-purple",
      aiConfidence: 89,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-6 pill-button bg-primary/10 text-primary border-primary/20 animate-fade-in-scale">
              <Brain className="w-3 h-3 mr-1 animate-pulse" />
              AI-Powered Analytics
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold font-poppins text-foreground mb-6">
              <span className="gradient-text animate-glow">Intelligent</span>{" "}
              Insights
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-inter">
              Advanced AI analysis powered by multiple LLMs to reveal deep
              cultural patterns and personalized predictions
            </p>

            <div className="flex items-center justify-center gap-4 mt-8 flex-wrap">
              {/* <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 glass-card border-primary/20 bg-white/5 focus-visible:ring-2 focus-visible:ring-primary/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass-card border-primary/20">
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 3 months</SelectItem>
                  <SelectItem value="1y">Last year</SelectItem>
                </SelectContent>
              </Select> */}

              <Button
                variant="pill-glass"
                className="hover-lift"
                onClick={() => fetchAIInsights("personality")}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="w-4 h-4 mr-2" />
                )}
                Refresh AI Analysis
              </Button>

                <Button
                  variant="pill-glass"
                  className="hover-lift"
                  onClick={handleExport}
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isExporting ? "Exporting..." : "Export Report"}
                </Button>

              {/* <Button variant="pill-glass" className="hover-lift">
                <Share2 className="w-4 h-4 mr-2" />
                Share Insights
              </Button> */}
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="mb-8 border-destructive/50 bg-destructive/10">
              <AlertDescription className="text-destructive">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {keyMetrics.map((metric, index) => (
              <Card
                key={index}
                className="glass-card hover-lift group animate-scale-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {metric.title}
                  </CardTitle>
                  <div className="w-12 h-12 rounded-2xl bg-gradient-primary flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-300">
                    {metric.icon}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {metric.value}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge
                      className={`${
                        metric.changeType === "positive"
                          ? "bg-secondary/20 text-secondary border-secondary/30"
                          : "bg-destructive/20 text-destructive border-destructive/30"
                      } rounded-full px-3 py-1`}
                    >
                      {metric.changeType === "positive" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      <span className="font-medium">{metric.change}</span>
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      vs last period
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Main Analytics */}
          <Tabs defaultValue="ai-personality" className="space-y-8">
            <div className="flex justify-center overflow-x-auto overflow-y-hidden">
              <TabsList className="glass-card p-2 bg-white/5 border-primary/20 rounded-2xl backdrop-blur-xl">
                <TabsTrigger
                  value="ai-personality"
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  AI Personality
                </TabsTrigger>
                <TabsTrigger
                  value="predictions"
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Smart Predictions
                </TabsTrigger>
                <TabsTrigger
                  value="recommendations"
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI Recommendations
                </TabsTrigger>
                <TabsTrigger
                  value="journey"
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  <Compass className="w-4 h-4 mr-2" />
                  Cultural Journey
                </TabsTrigger>
                <TabsTrigger
                  value="breakdown"
                  className="rounded-xl px-6 py-3 data-[state=active]:bg-gradient-primary data-[state=active]:text-white data-[state=active]:shadow-card transition-all duration-300"
                >
                  Category Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            {/* AI Personality Analysis */}
            <TabsContent value="ai-personality" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      Cultural Personality Profile
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => fetchAIInsights("personality")}
                        disabled={loading}
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                      </Button>
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      AI-analyzed personality traits based on your cultural
                      preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {aiInsights.personality?.analysis ? (
                      <div className="space-y-4">
                        {Object.entries(
                          aiInsights.personality.analysis.coreTraits || {}
                        ).map(([trait, score], index) => (
                          <div
                            key={index}
                            className="space-y-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground capitalize">
                                {trait.replace(/([A-Z])/g, " $1")}
                              </span>
                              <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-1 font-bold">
                                {typeof score === "number"
                                  ? `${score}%`
                                  : typeof score === "string"
                                  ? score
                                  : ""}
                              </Badge>
                            </div>
                            {typeof score === "number" && (
                              <Progress
                                value={score}
                                className="h-2 bg-muted/30"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">
                          No personality analysis available yet
                        </p>
                        <Button
                          onClick={() => fetchAIInsights("personality")}
                          disabled={loading}
                        >
                          {loading ? "Analyzing..." : "Generate AI Analysis"}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center">
                        <Lightbulb className="w-5 h-5 text-white" />
                      </div>
                      Growth Insights
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      AI-suggested areas for cultural exploration and personal
                      development
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {aiInsights.personality?.analysis?.growthRecommendations ? (
                      Array.isArray(
                        aiInsights.personality.analysis.growthRecommendations
                      ) ? (
                        aiInsights.personality.analysis.growthRecommendations.map(
                          (opportunity, index) => (
                            <div
                              key={index}
                              className="p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                            >
                              <h4 className="font-medium text-foreground mb-2">
                                {opportunity}
                              </h4>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  AI Recommendation
                                </Badge>
                              </div>
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-center py-6">
                          <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">
                            No growth insights available
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-6">
                        <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">
                          Generate personality analysis to see growth insights
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Smart Predictions */}
            <TabsContent value="predictions" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-primary" />
                    AI-Powered Trend Predictions
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fetchAIInsights("predictions")}
                      disabled={loading}
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Machine learning analysis of emerging cultural trends
                    personalized for your taste profile
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {getPredictionsArray().length > 0 ? (
                      getPredictionsArray().map((prediction, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-6 p-5 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                        >
                          <div className="ml-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-bold text-lg">
                              #{index + 1}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="font-semibold text-foreground text-lg">
                                {prediction.trend}
                              </h3>
                              <Badge variant="outline" className="text-xs">
                                {prediction.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground mb-3 leading-relaxed">
                              {prediction.reasoning}
                            </p>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground font-medium">
                                  AI Confidence:
                                </span>
                                <Progress
                                  value={prediction.confidence || 0}
                                  className="w-20 h-2"
                                />
                                <span className="text-xs font-bold text-foreground">
                                  {prediction.confidence || 0}%
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {prediction.timeline}
                                </span>
                              </div>
                              {prediction.userRelevance && (
                                <div className="flex items-center gap-2">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs text-muted-foreground">
                                    Relevance: {prediction.userRelevance}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-12">
                        <Target className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                        <h3 className="text-xl font-semibold text-foreground mb-3">
                          AI Trend Analysis
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                          Generate personalized trend predictions based on your
                          cultural profile and global patterns
                        </p>
                        <Button
                          onClick={() => fetchAIInsights("predictions")}
                          disabled={loading}
                          size="lg"
                        >
                          {loading ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Analyzing Trends...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Predictions
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* AI Recommendations */}
            <TabsContent value="recommendations" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Intelligent Recommendations
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fetchAIInsights("recommendations")}
                      disabled={loading}
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Context-aware cultural recommendations powered by advanced
                    AI analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {getRecommendationsArray().length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getRecommendationsArray().map((rec, index) => (
                        <div
                          key={index}
                          className="p-5 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300 border border-white/10 group"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {rec.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {rec.creator}
                              </p>
                            </div>
                            <Badge className="bg-primary/20 text-primary border-primary/30 text-xs">
                              {rec.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            {rec.reasoning}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {rec.moodMatch && (
                                <div className="flex items-center gap-1">
                                  <Heart className="w-3 h-3 text-pink-400" />
                                  <span className="text-xs font-medium">
                                    {rec.moodMatch}%
                                  </span>
                                </div>
                              )}
                              {rec.discoveryLevel && (
                                <Badge variant="outline" className="text-xs">
                                  {rec.discoveryLevel}
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-primary hover:text-primary/80"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Explore
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Smart Recommendations
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Get personalized cultural recommendations based on your
                        current mood and context
                      </p>
                      <Button
                        onClick={() => fetchAIInsights("recommendations")}
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Get Recommendations
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cultural Journey */}
            <TabsContent value="journey" className="space-y-6">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Compass className="w-5 h-5 text-primary" />
                    Personalized Cultural Journey
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => fetchAIInsights("journey")}
                      disabled={loading}
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    AI-designed learning path to expand your cultural horizons
                    systematically
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {aiInsights.journey?.journey?.journey?.weeks ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="text-center p-4 rounded-xl bg-primary/10 border border-primary/20">
                          <Compass className="w-8 h-8 text-primary mx-auto mb-2" />
                          <div className="font-semibold text-foreground">
                            {aiInsights.journey.goal ||
                              "Expand cultural horizons"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Goal
                          </div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                          <Calendar className="w-8 h-8 text-secondary mx-auto mb-2" />
                          <div className="font-semibold text-foreground">
                            {aiInsights.journey.duration || "3 months"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Duration
                          </div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-accent-amber/10 border border-accent-amber/20">
                          <Activity className="w-8 h-8 text-accent-amber mx-auto mb-2" />
                          <div className="font-semibold text-foreground capitalize">
                            {aiInsights.journey.intensity || "Moderate"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Intensity
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {Array.isArray(aiInsights.journey.journey.weeks) ? (
                          aiInsights.journey.journey.weeks
                            .slice(0, 4)
                            .map((week, index) => (
                              <div
                                key={index}
                                className="p-6 rounded-xl bg-gradient-to-r from-white/5 to-white/10 border border-white/10"
                              >
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center text-white font-bold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground">
                                      Week {index + 1}: {week.theme}
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {week.focus ||
                                        "Weekly cultural exploration"}
                                    </p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <h5 className="font-medium text-foreground mb-2">
                                      Activities
                                    </h5>
                                    <ul className="space-y-1">
                                      {Array.isArray(week.activities) ? (
                                        week.activities
                                          .slice(0, 3)
                                          .map((activity, i) => (
                                            <li
                                              key={i}
                                              className="text-sm text-muted-foreground flex items-center gap-2"
                                            >
                                              <div className="w-1 h-1 rounded-full bg-primary"></div>
                                              {activity}
                                            </li>
                                          ))
                                      ) : (
                                        <li className="text-sm text-muted-foreground">
                                          Activities not available
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                  <div>
                                    <h5 className="font-medium text-foreground mb-2">
                                      Goals
                                    </h5>
                                    <div className="flex items-center gap-2 mb-2">
                                      <Progress
                                        value={week.completionTarget || 75}
                                        className="flex-1 h-2"
                                      />
                                      <span className="text-xs font-medium text-foreground">
                                        {week.completionTarget || 75}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                      {week.milestone || "Weekly milestone"}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))
                        ) : (
                          <div className="text-center py-8">
                            <Compass className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">
                              Journey data not available
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Compass className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                      <h3 className="text-xl font-semibold text-foreground mb-3">
                        Cultural Learning Journey
                      </h3>
                      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        Create a personalized learning path designed by AI to
                        systematically expand your cultural knowledge
                      </p>
                      <Button
                        onClick={() => fetchAIInsights("journey")}
                        disabled={loading}
                        size="lg"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Creating Journey...
                          </>
                        ) : (
                          <>
                            <Compass className="w-4 h-4 mr-2" />
                            Create My Journey
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Category Breakdown */}
            <TabsContent value="breakdown" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="glass-card hover-lift">
                  <CardHeader className="pb-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-primary flex items-center justify-center">
                        <PieChart className="w-5 h-5 text-white" />
                      </div>
                      AI-Enhanced Category Analysis
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Cultural interest distribution with AI confidence scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {categoryBreakdown.map((category, index) => (
                      <div
                        key={index}
                        className="space-y-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground">
                            {category.category}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground font-mono">
                              {category.value}
                            </span>
                            <Badge className="bg-primary/10 text-primary border-primary/20 rounded-full px-3 py-1 font-bold">
                              {category.percentage}%
                            </Badge>
                          </div>
                        </div>
                        <Progress
                          value={category.percentage}
                          className="h-3 bg-muted/30"
                        />
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            AI Analysis Confidence
                          </span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={category.aiConfidence}
                              className="w-16 h-1"
                            />
                            <span className="font-medium text-foreground">
                              {category.aiConfidence}%
                            </span>
                          </div>
                        </div>
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
                      AI-Powered Insights
                    </CardTitle>
                    <CardDescription className="text-base text-muted-foreground">
                      Machine learning analysis of your cultural patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20">
                        <div className="flex items-center gap-3 mb-2">
                          <Brain className="w-5 h-5 text-primary" />
                          <h4 className="font-semibold text-foreground">
                            Pattern Recognition
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          AI has identified strong preferences for minimalist
                          aesthetics and experimental sounds
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-secondary/5 border border-secondary/20">
                        <div className="flex items-center gap-3 mb-2">
                          <Target className="w-5 h-5 text-secondary" />
                          <h4 className="font-semibold text-foreground">
                            Prediction Accuracy
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Your taste predictions show 87% accuracy over the past
                          3 months
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-r from-accent-amber/10 to-accent-amber/5 border border-accent-amber/20">
                        <div className="flex items-center gap-3 mb-2">
                          <Lightbulb className="w-5 h-5 text-accent-amber" />
                          <h4 className="font-semibold text-foreground">
                            Growth Opportunity
                          </h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Consider exploring contemporary dance and digital art
                          for maximum cultural expansion
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default EnhancedInsights;
