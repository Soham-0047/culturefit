import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ModeToggle } from "@/components/ModeToggle";
import {
  Bell,
  Search,
  Settings,
  User,
  Grid2X2,
  MessageSquare,
  Heart,
  TrendingUp,
  Eye,
} from "lucide-react";
import axios from "axios";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

const Navigation = () => {
  const location = useLocation();
  const [hasNotifications, setHasNotifications] = useState(true);

  const { 
  user
} = useAuth();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleProfileClick = (e) => {
    e.preventDefault(); // prevent NavLink from navigating
    setDropdownOpen((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_APP_BACKEND_URL}/auth/logout`,
        {},
        { withCredentials: true } // 👈 important for cookie/session support
      );

      if (response.data.success) {
        // Clear local state if needed
        // Redirect to login or home page
        navigate("/");
      } else {
        console.error("Logout failed:", response.data.message);
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { path: "/chat", label: "AI Chat", icon: MessageSquare },
    { path: "/discover", label: "Discover", icon: Heart },
    { path: "/insights", label: "Insights", icon: TrendingUp },
    { path: "/profile", label: "Profile", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50 h-16">
      <div className="container mx-auto flex items-center justify-between h-full px-6">
        {/* Logo & Brand */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Eye className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">CultureSense</h1>
              <p className="text-xs text-muted-foreground">AI Taste Analysis</p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-5 py-3 rounded-xl transition-all duration-300 ${
                  isActive(item.path)
                    ? "bg-gradient-primary text-white shadow-card border border-primary/20 scale-105"
                    : "glass-card border-white/10 text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/30 hover:scale-102"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-3">
          {/* Search */}
          {/* <Button variant="glass" size="sm" className="hidden sm:flex">
            <Search className="w-4 h-4" />
          </Button> */}

          {/* Notifications */}
          {/* <div className="relative">
            <Button variant="glass" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            {hasNotifications && (
              <Badge className="absolute -top-2 -right-2 w-5 h-5 p-0 bg-accent-rose border-0 status-processing">
                <span className="text-xs">3</span>
              </Badge>
            )}
          </div> */}

          {/* Settings */}
          <ModeToggle />

          {/* <Button variant="glass" size="sm">
            <Settings className="w-4 h-4" />
          </Button> */}

          {/* Profile */}
          <div className="relative" ref={dropdownRef}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="glass" size="sm" className="relative">
                  <Avatar className="w-8 h-8 border-2 border-primary/30 cursor-pointer">
                    <AvatarImage src={user && user?.picture} />
                    <AvatarFallback className="bg-gradient-primary text-white">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="glass-card border-0">
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  My Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 glass-nav border-t border-white/10">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-all duration-300 ${
                  isActive(item.path)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
