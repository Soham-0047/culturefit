import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import Index from "./pages/Index";
import Chat from "./pages/Chat";
import Discover from "./pages/Discover";
import Insights from "./pages/Insights";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { useUserPreferences } from "./hooks/useUserPreferences";
import UserPreferencesForm from "./components/UserPresencesForm";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const {
    hasPreferences,
    loading: preferencesLoading,
    error,
    refetch
  } = useUserPreferences();

  if (authLoading || preferencesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect if user is not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Redirect if preferences fetching failed (e.g. user deleted from DB)
  if (error) {
    console.error("User not found or deleted from DB:", error);
    return <Navigate to="/" replace />;
  }

  // Show preferences form if user hasn't filled it out
  if (!hasPreferences) {
    return (
      <UserPreferencesForm
        onComplete={() => {
          refetch();
        }}
      />
    );
  }

  return <>{children}</>;
};


// Public Route Component (redirects to chat if authenticated)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/chat" replace /> : <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    {/* Public route - redirects to /chat if authenticated */}
    <Route path="/" element={<PublicRoute><Index /></PublicRoute>} />
    
    {/* Protected routes */}
    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
    <Route path="/discover" element={<ProtectedRoute><Discover /></ProtectedRoute>} />
    <Route path="/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    
    {/* Catch-all route */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;