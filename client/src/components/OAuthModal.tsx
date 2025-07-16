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
}

const OAuthModal = ({ open, onOpenChange }: OAuthModalProps) => {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { toast } = useToast();

  // API base URL - adjust according to your backend setup
  const API_BASE_URL = import.meta.env.VITE_APP_BACKEND_URL;

  // Check for authentication success/failure on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const error = urlParams.get('error');

    if (authStatus === 'success') {
      toast({
        title: "Success!",
        description: "Successfully signed in with Google",
      });
      onOpenChange(false);
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);

      // Optionally refresh user data or redirect
      window.location.reload(); // or call a function to fetch user data
    }

    if (error) {
      let errorMessage = "Authentication failed";
      if (error === 'server_error') {
        errorMessage = "Server error occurred during authentication";
      }

      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive"
      });

      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, onOpenChange]);

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(provider.toLowerCase());

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
        toast({
          title: "Welcome back!",
          description: "Successfully signed in with email",
        });
        onOpenChange(false);
        window.location.reload(); // or call a function to fetch user data
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

          {/* <Button
              onClick={() => handleOAuthLogin("Microsoft")}
              disabled={!!isLoading}
              className="oauth-button oauth-microsoft w-full text-white font-semibold h-14"
            >
              {isLoading === "microsoft" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
                  </svg>
                  Continue with Microsoft
                </>
              )}
            </Button>

            <Button
              onClick={() => handleOAuthLogin("GitHub")}
              disabled={!!isLoading}
              className="oauth-button oauth-github w-full text-white font-semibold h-14"
            >
              {isLoading === "github" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Continue with GitHub
                </>
              )}
            </Button>

            <Button
              onClick={() => handleOAuthLogin("Apple")}
              disabled={!!isLoading}
              className="oauth-button oauth-apple w-full text-white font-semibold h-14"
            >
              {isLoading === "apple" ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Continue with Apple
                </>
              )}
            </Button> */}

          {/* Email Form */}
          {/* <div className="relative">
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
          </form> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OAuthModal;