import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthSuccess?: () => void; // Add callback for successful auth
}

const OAuthModal = ({ open, onOpenChange, onAuthSuccess }: OAuthModalProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // API base URL - adjust according to your backend setup
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  // Function to check authentication status
  const checkAuthStatus = async () => {
    try {
      console.log('Checking auth status...');
      const response = await fetch(`${API_BASE_URL}/auth/status`, {
        method: 'GET',
        credentials: 'include', // Important for session cookies
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Auth status response:', data);
        return data;
      } else {
        console.error('Auth status check failed:', response.status);
        return { isAuthenticated: false, user: null };
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      return { isAuthenticated: false, user: null };
    }
  };

  // Check for authentication success/failure on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const error = urlParams.get('error');

    console.log('URL params check:', { authStatus, error });

    if (authStatus === 'success') {
      console.log('Auth success detected, checking status...');
      
      // Wait a moment for session to be fully established, then check auth status
      setTimeout(async () => {
        const authData = await checkAuthStatus();
        
        if (authData.isAuthenticated) {
          toast({
            title: "Success!",
            description: "Successfully signed in with Google",
          });
          
          onOpenChange(false);
          
          // Call the success callback if provided
          if (onAuthSuccess) {
            onAuthSuccess();
          }
          
          // Clean up URL parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          
          // Don't reload the page - let the parent component handle the state update
        } else {
          console.error('User not authenticated despite success redirect');
          toast({
            title: "Authentication Error",
            description: "Session not established. Please try again.",
            variant: "destructive"
          });
        }
      }, 1500); // Give a bit more time for session to establish
    }

    if (error || authStatus === 'failed') {
      let errorMessage = "Authentication failed";
      if (error === 'server_error') {
        errorMessage = "Server error occurred during authentication";
      } else if (error === 'no_user') {
        errorMessage = "Unable to retrieve user information";
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, onOpenChange, onAuthSuccess]);

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(provider.toLowerCase());

    console.log('Initiating OAuth login for:', provider);
    console.log('Auth URL:', `${API_BASE_URL}/auth/google`);

    // Redirect to backend OAuth endpoint
    if (provider === "Google") {
      window.location.href = `${API_BASE_URL}/auth/google`;
    }

    // Note: The loading state will be reset when the page redirects
    // but we set it here for immediate UI feedback
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading("email");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const authData = await checkAuthStatus();
        
        if (authData.isAuthenticated) {
          toast({
            title: "Welcome back!",
            description: "Successfully signed in with email",
          });
          
          onOpenChange(false);
          
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Login Failed",
          description: errorData.message || "Invalid credentials",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Network error occurred",
        variant: "destructive"
      });
    }

    setIsLoading(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass-card border-2 border-white/20 bg-gradient-glass backdrop-blur-xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold gradient-text text-center">
            Join CultureSense AI
          </DialogTitle>
          <p className="text-muted-foreground mt-2 text-center">
            Discover your cultural world with AI-powered recommendations
          </p>
        </DialogHeader>
        <div className="space-y-4">
          <Button
            onClick={() => handleOAuthLogin("Google")}
            disabled={!!isLoading}
            className="oauth-button oauth-google w-full text-white font-semibold h-14"
          >
            {isLoading === "google" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </>
            )}
          </Button>

          {/* Email Form - Commented out as in original */}
          {/* 
          <div className="relative">
            <Separator className="my-6" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-background px-4 text-sm text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="glass-card border-white/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="glass-card border-white/20"
              />
            </div>

            <Button
              type="submit"
              disabled={!!isLoading}
              className="w-full h-12 bg-gradient-primary text-white font-semibold hover:scale-105 transition-all duration-300"
            >
              {isLoading === "email" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Mail className="w-5 h-5 mr-2" />
                  Sign In with Email
                </>
              )}
            </Button>
          </form>
          */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OAuthModal;