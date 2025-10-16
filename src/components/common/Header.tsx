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
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";
import GlobalSearch from "./GlobalSearch";
import UserStatusIndicator from "./UserStatusIndicator";

const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
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
  const isDashboard = location.pathname.startsWith("/dashboard");
  const isLoginPage = location.pathname === "/login";

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/logout");
      setIsProfileOpen(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const publicNavItems = [
    { path: "/", label: "Home" },
    { path: "/services", label: "Services" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const dashboardNavItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/dashboard/projects", label: "Projects" },
    { path: "/dashboard/tasks", label: "Tasks" },
    { path: "/dashboard/files", label: "Files" },
    { path: "/dashboard/communication", label: "Messages" },
    { path: "/dashboard/reports", label: "Reports" },
    { path: "/dashboard/invoices", label: "Invoices" },
    { path: "/dashboard/contracts", label: "Contracts" },
  ];

  const getRoleSpecificNavItems = () => {
    if (user && isDashboard) {
      return dashboardNavItems;
    }
    return publicNavItems;
  };

  const navItems = getRoleSpecificNavItems();

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

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled || isDashboard
          ? "bg-white/95 backdrop-blur-md shadow-lg border-b border-gray-200"
          : "bg-white/90 backdrop-blur-sm border-b border-gray-100"
      }`}
      style={{
        backdropFilter:
          isScrolled || isDashboard ? "blur(16px) saturate(180%)" : "blur(8px)",
        WebkitBackdropFilter:
          isScrolled || isDashboard ? "blur(16px) saturate(180%)" : "blur(8px)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
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
                Engineering Excellence
              </p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group ${
                  location.pathname === item.path
                    ? "text-blue-600 bg-blue-50"
                    : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                }`}
              >
                <span className="relative z-10">{item.label}</span>
                {location.pathname === item.path && (
                  <motion.div
                    className="absolute inset-0 bg-blue-50 rounded-lg border border-blue-200"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    exit={{ scaleX: 0 }}
                    transition={{
                      type: "spring",
                      bounce: 0.1,
                      duration: 0.3,
                    }}
                    style={{
                      transformOrigin: "left center",
                    }}
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {isDashboard && user && (
              <>
                {/* Search - Hidden on mobile */}
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
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-300"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <motion.span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </motion.span>
                    )}
                  </button>

                  <NotificationDropdown
                    isOpen={isNotificationOpen}
                    onClose={() => setIsNotificationOpen(false)}
                  />
                </div>

                {/* Profile Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50 transition-all duration-300 group"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-semibold ring-2 ring-transparent group-hover:ring-blue-200 transition-all duration-300">
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
                      <UserStatusIndicator status={user?.status} size="sm" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                        {(user.full_name || user.name)?.split(" ")[0] || "User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getRoleDisplayName(user.role)}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                        isProfileOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                          <p className="text-sm font-medium text-gray-900">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-blue-600 font-medium mt-1">
                            {getRoleDisplayName(user.role)}
                          </p>
                        </div>
                        <Link
                          to="/dashboard/profile"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4 mr-3 text-gray-400" />
                          Profile
                        </Link>
                        <Link
                          to="/dashboard/settings"
                          className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Settings className="w-4 h-4 mr-3 text-gray-400" />
                          Settings
                        </Link>
                        <hr className="my-2 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}

            {/* Client Portal Button - Only show when logged in and NOT on dashboard */}
            {user && !isDashboard && (
              <Link
                to="/dashboard"
                className="hidden sm:inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Client Portal
              </Link>
            )}

            {/* Login/Get Started - Only show when NOT logged in and NOT on login page */}
            {!user && !isLoginPage && (
              <div className="hidden sm:flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors px-3 py-2 rounded-lg hover:bg-gray-50"
                >
                  Login
                </Link>
                <Link
                  to="/login"
                  className="bg-gradient-to-r from-blue-600 to-teal-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  Get Started
                </Link>
              </div>
            )}

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
              className="lg:hidden border-t border-gray-200 py-4 bg-white/95 backdrop-blur-md"
            >
              <nav className="flex flex-col space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                      location.pathname === item.path
                        ? "text-blue-600 bg-blue-50 border-r-4 border-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <div className="flex justify-between items-center">
                      <span>{item.label}</span>
                    </div>
                  </Link>
                ))}

                {/* Mobile Client Portal Button - Only show when logged in and NOT on dashboard */}
                {user && !isDashboard && (
                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-300 text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Client Portal
                    </Link>
                  </div>
                )}

                {/* Mobile Login/Get Started - Only show when NOT logged in and NOT on login page */}
                {!user && !isLoginPage && (
                  <div className="pt-4 border-t border-gray-200 space-y-2">
                    <Link
                      to="/login"
                      className="block px-4 py-3 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-lg transition-colors text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Login
                    </Link>
                    <Link
                      to="/login"
                      className="block px-4 py-3 text-sm font-medium bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all duration-300 text-center"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Get Started
                    </Link>
                  </div>
                )}

                {/* Mobile Dashboard User Menu - Only show when logged in and ON dashboard */}
                {user && isDashboard && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg mb-2">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            user.avatar ||
                            `https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=40&h=40&fit=crop`
                          }
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
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
                )}
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
    </header>
  );
};

export default Header;
