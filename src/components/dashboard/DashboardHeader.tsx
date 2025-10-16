import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Building2,
  ChevronDown,
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  FileText,
  MessageSquare,
  BarChart3,
  Receipt,
  FileText as FileContract,
  Users,
  Calendar,
  Clock,
  Target,
  Briefcase,
  Archive,
  Send,
  Inbox,
  Star,
  TrendingUp,
  PieChart,
  Activity,
  DollarSign,
  CreditCard,
  FileCheck,
  Shield,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationDropdown from "../common/NotificationDropdown";
import GlobalSearch from "../common/GlobalSearch";
import UserProfileDropdown from "../common/UserProfileDropdown";
import UserStatusIndicator from "../common/UserStatusIndicator";
import MegaMenuPopup from "./MegaMenuPopup";

const DashboardHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
    setIsNotificationOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Escape to close modals
      if (e.key === "Escape") {
        setIsNotificationOpen(false);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      console.log("DashboardHeader: Starting logout process...");
      setIsProfileOpen(false);
      await logout();
      console.log("DashboardHeader: Logout successful, navigating to /logout");
      navigate("/logout");
    } catch (error) {
      console.error("DashboardHeader: Logout failed:", error);
      // Force navigation even if logout fails
      navigate("/logout");
    }
  };

  const megaMenuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      description: "Overview and analytics",
      items: [
        {
          label: "Overview",
          path: "/dashboard",
          icon: Activity,
          description: "Main dashboard view",
        },
        {
          label: "Analytics",
          path: "/dashboard/analytics",
          icon: TrendingUp,
          description: "Performance metrics",
        },
        {
          label: "Performance",
          path: "/dashboard/performance",
          icon: Activity,
          description: "System performance monitoring",
        },
        {
          label: "Quick Actions",
          path: "/dashboard/quick",
          icon: Target,
          description: "Shortcuts and tools",
        },
      ],
    },
    {
      id: "projects",
      label: "Projects",
      icon: Briefcase,
      path: "/dashboard/projects",
      description: "Manage your projects",
      items: [
        {
          label: "All Projects",
          path: "/dashboard/projects",
          icon: FolderOpen,
          description: "View all projects",
        },
        {
          label: "Active Projects",
          path: "/dashboard/projects/active",
          icon: Star,
          description: "Currently active projects",
        },
        {
          label: "Archived",
          path: "/dashboard/projects/archived",
          icon: Archive,
          description: "Completed projects",
        },
        {
          label: "Team Projects",
          path: "/dashboard/projects/team",
          icon: Users,
          description: "Collaborative projects",
        },
      ],
    },
    {
      id: "tasks",
      label: "Tasks",
      icon: CheckSquare,
      path: "/dashboard/tasks",
      description: "Task management",
      items: [
        {
          label: "My Tasks",
          path: "/dashboard/tasks",
          icon: CheckSquare,
          description: "Personal task list",
        },
        {
          label: "Team Tasks",
          path: "/dashboard/tasks/team",
          icon: Users,
          description: "Team assignments",
        },
        {
          label: "Calendar",
          path: "/dashboard/tasks/calendar",
          icon: Calendar,
          description: "Task timeline",
        },
        {
          label: "Deadlines",
          path: "/dashboard/tasks/deadlines",
          icon: Clock,
          description: "Upcoming deadlines",
        },
      ],
    },
    {
      id: "communication",
      label: "Messages",
      icon: MessageSquare,
      path: "/dashboard/communication",
      description: "Communication hub",
      items: [
        {
          label: "Inbox",
          path: "/dashboard/communication",
          icon: Inbox,
          description: "All messages",
        },
        {
          label: "Sent",
          path: "/dashboard/communication/sent",
          icon: Send,
          description: "Sent messages",
        },
        {
          label: "Team Chat",
          path: "/dashboard/communication/chat",
          icon: MessageSquare,
          description: "Team discussions",
        },
        {
          label: "Notifications",
          path: "/dashboard/communication/notifications",
          icon: Bell,
          description: "System alerts",
        },
      ],
    },
    {
      id: "files",
      label: "Files",
      icon: FileText,
      path: "/dashboard/files",
      description: "Document management",
      items: [
        {
          label: "All Files",
          path: "/dashboard/files",
          icon: FileText,
          description: "Browse all files",
        },
        {
          label: "Recent",
          path: "/dashboard/files/recent",
          icon: Clock,
          description: "Recently accessed",
        },
        {
          label: "Shared",
          path: "/dashboard/files/shared",
          icon: Users,
          description: "Shared documents",
        },
        {
          label: "Templates",
          path: "/dashboard/files/templates",
          icon: FileCheck,
          description: "Document templates",
        },
      ],
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      path: "/dashboard/reports",
      description: "Analytics and reports",
      items: [
        {
          label: "Overview",
          path: "/dashboard/reports",
          icon: BarChart3,
          description: "General reports",
        },
        {
          label: "Performance",
          path: "/dashboard/reports/performance",
          icon: TrendingUp,
          description: "Performance metrics",
        },
        {
          label: "Financial",
          path: "/dashboard/reports/financial",
          icon: DollarSign,
          description: "Financial reports",
        },
        {
          label: "Custom Reports",
          path: "/dashboard/reports/custom",
          icon: PieChart,
          description: "Custom analytics",
        },
      ],
    },
    {
      id: "financial",
      label: "Financial",
      icon: DollarSign,
      path: "/dashboard/invoices",
      description: "Financial management",
      items: [
        {
          label: "Invoices",
          path: "/dashboard/invoices",
          icon: Receipt,
          description: "Billing and invoices",
        },
        {
          label: "Payments",
          path: "/dashboard/payments",
          icon: CreditCard,
          description: "Payment tracking",
        },
        {
          label: "Contracts",
          path: "/dashboard/contracts",
          icon: FileContract,
          description: "Legal agreements",
        },
        {
          label: "Compliance",
          path: "/dashboard/compliance",
          icon: Shield,
          description: "Regulatory compliance",
        },
      ],
    },
  ];

  // Removed unused state variables

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "project_manager":
        return "Project Manager";
      case "team_member":
        return "Team Member";
      case "client":
        return "Client";
      default:
        return role;
    }
  };

  if (!user) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 shadow-lg border-b border-gray-200"
          : "bg-white/90 border-b border-gray-100"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center space-x-3 group">
            <motion.div
              className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Building2 className="w-6 h-6 text-white" />
            </motion.div>
            <div className="hidden sm:block min-w-0">
              <h1 className="text-lg font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors whitespace-nowrap">
                LiNES AND LiAiSON
              </h1>
              <p className="text-xs text-gray-600 -mt-0.5 font-medium whitespace-nowrap">
                Dashboard
              </p>
            </div>
          </Link>

          {/* Desktop Navigation with Popup Menu Button */}
          <nav className="hidden lg:flex items-center space-x-4">
            <button
              onClick={() => setIsMegaMenuOpen(true)}
              className="relative flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 group text-gray-700 hover:text-blue-600 hover:bg-blue-50"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="relative z-10">Dashboard Menu</span>
              <Menu className="w-4 h-4" />
            </button>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="hidden md:flex items-center justify-center p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  console.log('Notification button clicked, current state:', isNotificationOpen);
                  setIsNotificationOpen(!isNotificationOpen);
                }}
                className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
              <NotificationDropdown
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
              />
            </div>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-all duration-300"
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                    {(user.avatar_url || user.avatar) ? (
                      <img
                        src={user.avatar_url || user.avatar}
                        alt={user.full_name || user.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      (user.full_name || user.name)?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  <UserStatusIndicator status={user.status} size="sm" />
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user.full_name || user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {getRoleDisplayName(user.role)}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <UserProfileDropdown
                isOpen={isProfileOpen}
                onClose={() => setIsProfileOpen(false)}
              />
            </div>

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                {isMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </motion.div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden border-t border-gray-200 py-4 bg-white/95"
            >
              <nav className="flex flex-col space-y-1">
                {megaMenuItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                        location.pathname === item.path ||
                        location.pathname.startsWith(item.path + "/")
                          ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  );
                })}

                {/* Mobile Dashboard User Menu */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-base font-semibold">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </div>
                        <UserStatusIndicator status={user.status} size="md" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getRoleDisplayName(user.role)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4 mr-3 text-gray-400" />
                    Profile
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Settings className="w-4 h-4 mr-3 text-gray-400" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Logout
                  </button>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />

      {/* Mega Menu Popup */}
      <MegaMenuPopup
        isOpen={isMegaMenuOpen}
        onClose={() => setIsMegaMenuOpen(false)}
      />
    </header>
  );
};

export default DashboardHeader;
