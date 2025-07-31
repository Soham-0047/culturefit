import { useState, useRef, useEffect } from "react";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Mic, Heart, Star, TrendingUp, MessageSquare, RefreshCw, Trash2 } from "lucide-react";
import { api } from "@/utils/api";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  suggestions?: string[];
}

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // API base URL - adjust this to match your backend
  const API_BASE = import.meta.env.VITE_APP_BACKEND_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async () => {
  try {
    setIsLoading(true);

    const data: any = await api.get('/chat/history');

    if (data.success && data.messages.length > 0) {
      const formattedMessages = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }));
      setMessages(formattedMessages);
    } else {
      // Set initial welcome message if no history
      setMessages([{
        id: "welcome",
        content: "Hello! I'm your CultureSense AI assistant. I can help you discover new cultural preferences, analyze your taste patterns, and recommend personalized content. What would you like to explore today?",
        sender: "ai",
        timestamp: new Date(),
        suggestions: ["Analyze my music taste", "Find similar movies", "Discover new books", "Cultural trend analysis"]
      }]);
    }

  } catch (error: any) {
    console.error('Error loading chat history:', error);

    if (error.message.includes('401')) {
      setError('Please log in to use the chat feature');
    } else {
      setError('Failed to load chat history');
    }

    // Fallback message
    setMessages([{
      id: "welcome",
      content: "Hello! I'm your CultureSense AI assistant. I can help you discover new cultural preferences, analyze your taste patterns, and recommend personalized content. What would you like to explore today?",
      sender: "ai",
      timestamp: new Date(),
      suggestions: ["Analyze my music taste", "Find similar movies", "Discover new books", "Cultural trend analysis"]
    }]);
  } finally {
    setIsLoading(false);
  }
};



const handleSendMessage = async (content: string) => {
  if (!content.trim()) return;

  const newMessage: Message = {
    id: Date.now().toString(),
    content,
    sender: "user",
    timestamp: new Date()
  };

  setMessages(prev => [...prev, newMessage]);
  setInputValue("");
  setIsTyping(true);
  setError(null);

  try {
    const userContext = {
      currentPage: 'chat',
      timestamp: new Date().toISOString()
    };

    console.log('Sending message to API:', { message: content, context: userContext });

    const response :any = await api.post('/chat/message', {
      message: content,
      context: userContext
    });

    const data = await response.json();
    console.log('API Response:', data);

    if (data.success && data.message) {
      const aiResponse: Message = {
        ...data.message,
        timestamp: new Date(data.message.timestamp)
      };
      setMessages(prev => [...prev, aiResponse]);
    } else {
      throw new Error(data.error || 'Invalid response from server');
    }
  } catch (error: any) {
    console.error('Error sending message:', error);

    let errorMessage = 'Failed to send message. Please try again.';

    // Centralized apiCall already handles response.status codes, so rely on error.message
    if (error instanceof TypeError && error.message.includes('fetch')) {
      errorMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('401')) {
      errorMessage = 'Please log in to continue the conversation';
    } else if (error.message.includes('400')) {
      errorMessage = 'Invalid request. Please check your message.';
    } else if (error.message.includes('500')) {
      errorMessage = 'Server error. Please try again in a moment.';
    } else if (error.message.includes('AI service')) {
      errorMessage = 'AI service is temporarily unavailable. Please try again later.';
    } else if (error.message.includes('quota')) {
      errorMessage = 'Service is currently at capacity. Please try again in a few minutes.';
    }

    setError(errorMessage);

    const fallbackResponse: Message = {
      id: (Date.now() + 1).toString(),
      content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
      sender: "ai",
      timestamp: new Date(),
      suggestions: ["Try again", "Refresh chat"]
    };

    setMessages(prev => [...prev, fallbackResponse]);
  } finally {
    setIsTyping(false);
  }
};


  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const clearChat = async () => {
    try {
    await api.post(`/chat/clear`);
        setMessages([{
          id: "welcome",
          content: "Chat cleared! How can I help you explore culture today?",
          sender: "ai",
          timestamp: new Date(),
          suggestions: ["Analyze my music taste", "Find similar movies", "Discover new books", "Cultural trend analysis"]
        }]);
    } catch (error) {
      console.error('Error clearing chat:', error);
      setError('Failed to clear chat');
    }
  };

  const refreshChat = () => {
    loadChatHistory();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading your cultural conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-24 md:pb-8">
        <div className="container mx-auto px-6 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16">
            <Badge className="mb-6 pill-button bg-secondary/10 text-secondary border-secondary/20 animate-fade-in-scale">
              <MessageSquare className="w-3 h-3 mr-1 animate-pulse" />
              AI-Powered Cultural Chat
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold font-poppins text-foreground mb-6">
              <span className="gradient-text animate-glow">AI Cultural</span> Assistant
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-inter">
              Engage with our advanced AI to explore, refine, and expand your cultural taste profile through natural conversation
            </p>

            {/* Chat Controls */}
            <div className="flex justify-center gap-4 mt-8">
              <Button 
                variant="outline" 
                onClick={refreshChat}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                onClick={clearChat}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear Chat
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="space-y-8 mb-8">
            {messages.map((message) => (
              <div key={message.id} className="animate-slide-up">
                {message.sender === "ai" ? (
                  <div className="flex items-start space-x-6">
                    <Avatar className="w-12 h-12 border-2 border-primary/30 hover-glow">
                      <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                        AI
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 max-w-4xl">
                      <div className="rounded-3xl backdrop-blur-md bg-gradient-to-br from-primary/5 via-secondary/5 to-transparent border border-primary/10 p-6 shadow-hover micro-lift">
                        <p className="text-foreground leading-relaxed text-lg font-inter whitespace-pre-wrap">{message.content}</p>
                      </div>
                      
                      {message.suggestions && (
                        <div className="flex flex-wrap gap-3 mt-6">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleSuggestionClick(suggestion)}
                              className="text-sm micro-bounce animate-fade-in-scale hover:bg-primary/10"
                              style={{ animationDelay: `${index * 0.1}s` }}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start space-x-6 justify-end">
                    <div className="flex-1 max-w-3xl text-right">
                      <div className="rounded-3xl backdrop-blur-md bg-gradient-to-br from-secondary/10 via-accent-rose/5 to-transparent border border-secondary/15 p-6 shadow-hover micro-lift ml-auto inline-block">
                        <p className="text-foreground leading-relaxed text-lg font-inter whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                    <Avatar className="w-12 h-12 border-2 border-secondary/30 shadow-hover">
                      <AvatarFallback className="bg-gradient-to-br from-secondary to-accent-rose text-white text-sm font-semibold">
                        You
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-start space-x-6 animate-scale-in">
                <Avatar className="w-12 h-12 border-2 border-primary/30 hover-glow">
                  <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <Card className="glass-card">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 text-muted-foreground">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{animationDelay: "0.2s"}}></div>
                        <div className="w-3 h-3 bg-primary rounded-full animate-pulse" style={{animationDelay: "0.4s"}}></div>
                      </div>
                      <span className="text-base">CultureSense AI is analyzing your cultural patterns...</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Context Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-card p-6 text-center hover-lift">
              <Heart className="w-8 h-8 text-accent-rose mx-auto mb-4 hover-glow" />
              <h3 className="text-lg font-medium text-foreground mb-2">Active Preferences</h3>
              <p className="text-sm text-muted-foreground">Minimalist • Artistic • Sustainable</p>
              <div className="mt-3 flex justify-center">
                <Badge variant="secondary" className="text-xs">87% Match</Badge>
              </div>
            </Card>
            
            <Card className="glass-card p-6 text-center hover-lift">
              <Star className="w-8 h-8 text-accent-amber mx-auto mb-4 hover-glow" />
              <h3 className="text-lg font-medium text-foreground mb-2">Taste Refinement</h3>
              <p className="text-sm text-muted-foreground">Elite Cultural Curator</p>
              <div className="mt-3 flex justify-center">
                <Badge variant="secondary" className="text-xs">94.3% Accuracy</Badge>
              </div>
            </Card>
            
            <Card className="glass-card p-6 text-center hover-lift">
              <TrendingUp className="w-8 h-8 text-secondary mx-auto mb-4 hover-glow" />
              <h3 className="text-lg font-medium text-foreground mb-2">Trend Influence</h3>
              <p className="text-sm text-muted-foreground">Early Adopter Status</p>
              <div className="mt-3 flex justify-center">
                <Badge variant="secondary" className="text-xs">Top 5% Globally</Badge>
              </div>
            </Card>
          </div>

          {/* Input Area */}
          <Card className="glass-card fixed bottom-20 md:relative md:bottom-auto left-4 right-4 md:left-auto md:right-auto border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1 flex items-center space-x-3">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ask about your cultural preferences and patterns..."
                    className="border-0 bg-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground text-lg"
                    onKeyPress={(e) => e.key === "Enter" && !isTyping && handleSendMessage(inputValue)}
                    disabled={isTyping}
                  />
                </div>
                
                <div className="flex items-center space-x-3">
                  <Button variant="ghost" size="sm" className="p-3 hover-glow">
                    <Mic className="w-5 h-5" />
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={() => handleSendMessage(inputValue)}
                    disabled={!inputValue.trim() || isTyping}
                    className="px-6 py-3 hover-lift"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chat;