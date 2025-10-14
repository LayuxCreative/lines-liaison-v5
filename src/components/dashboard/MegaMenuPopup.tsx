"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  MessageSquare,
  FileText,
  BarChart3,
  Settings,
  Users,
  Calendar,
  Bell,
  Search,
  Plus,
  X,
  HelpCircle,
  Clock,
  Bookmark,
  Receipt,
  FileCheck,
  MessageCircle,
} from "lucide-react";

interface MegaMenuPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const MegaMenuPopup: React.FC<MegaMenuPopupProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  // Navigation handlers
  const handleDashboardOverview = () => {
    navigate("/dashboard");
    onClose();
  };

  const handleDashboardAnalytics = () => {
    navigate("/dashboard/reports");
    onClose();
  };

  const handleProjectsAll = () => {
    navigate("/dashboard/projects");
    onClose();
  };

  const handleProjectsActive = () => {
    navigate("/dashboard/projects");
    onClose();
  };

  const handleTasksMy = () => {
    navigate("/dashboard/tasks");
    onClose();
  };

  const handleTasksTeam = () => {
    navigate("/dashboard/tasks");
    onClose();
  };

  const handleQuickSearch = () => {

    // Add your search logic here
  };

  const handleAddNew = () => {

    // Add your add new logic here
  };

  const handleMessagesInbox = () => {
    navigate("/dashboard/communication");
    onClose();
  };

  const handleCommunicationHub = () => {
    navigate("/dashboard/communication-hub");
    onClose();
  };

  const handleFilesRecent = () => {
    navigate("/dashboard/files");
    onClose();
  };

  const handleFilesShared = () => {
    navigate("/dashboard/files");
    onClose();
  };

  const handleReportsGenerate = () => {
    navigate("/dashboard/reports");
    onClose();
  };

  const handleReportsView = () => {
    navigate("/dashboard/reports");
    onClose();
  };

  const handleInvoices = () => {
    navigate("/dashboard/invoices");
    onClose();
  };

  const handleContracts = () => {
    navigate("/dashboard/contracts");
    onClose();
  };

  const handleSettingsProfile = () => {
    navigate("/dashboard/profile");
    onClose();
  };

  const handleSettingsSystem = () => {
    navigate("/dashboard/settings");
    onClose();
  };

  const handleCalendarToday = () => {
    navigate("/dashboard/tasks");
    onClose();
  };

  const handleCalendarEvents = () => {
    navigate("/dashboard/tasks");
    onClose();
  };

  const handleNotificationsAll = () => {
    navigate("/dashboard");
    onClose();
  };

  const handleNotificationsUnread = () => {
    navigate("/dashboard");
    onClose();
  };

  const handleHelpDocs = () => {
    window.open("https://docs.example.com", "_blank");
    onClose();
  };

  const handleHelpSupport = () => {
    navigate("/contact");
    onClose();
  };

  const handleUsersActivity = () => {
    navigate("/dashboard/users-activity");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with smooth blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 z-40"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
            onClick={onClose}
          />

          {/* Popup Window - Compact and centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              duration: 0.3,
            }}
            className="fixed inset-x-0 top-16 mx-auto w-[calc(100%-2rem)] max-w-5xl z-50"
            onClick={(e) => e.target === e.currentTarget && onClose()}
          >
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header - Compact */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white relative z-10">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Dashboard Navigation
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Access all dashboard sections and features
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              {/* Content Grid - Compact without scroll */}
              <div className="p-4">
                {/* Main Sections - 5 Columns Grid */}
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {/* Dashboard Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-blue-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-200">
                    <div className="flex items-center space-x-2">
                      <LayoutDashboard className="w-5 h-5 text-blue-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Dashboard
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleDashboardOverview}
                        className="flex items-center space-x-2 p-1.5 hover:bg-blue-50 rounded-md transition-colors group w-full text-left"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        <span className="text-sm text-gray-700 group-hover:text-blue-600">
                          Overview
                        </span>
                      </button>
                      <button
                        onClick={handleDashboardAnalytics}
                        className="flex items-center space-x-2 p-1.5 hover:bg-blue-50 rounded-md transition-colors group w-full text-left"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                        <span className="text-sm text-gray-700 group-hover:text-blue-600">
                          Analytics
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-green-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-green-200">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-5 h-5 text-green-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Projects
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleProjectsAll}
                        className="flex items-center space-x-2 p-1.5 hover:bg-green-50 rounded-md transition-colors group w-full text-left"
                      >
                        <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                        <span className="text-sm text-gray-700 group-hover:text-green-600">
                          All Projects
                        </span>
                      </button>
                      <button
                        onClick={handleProjectsActive}
                        className="flex items-center space-x-2 p-1.5 hover:bg-green-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Plus className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                        <span className="text-sm text-gray-700 group-hover:text-green-600">
                          Active Projects
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Tasks Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-purple-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-purple-200">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="w-5 h-5 text-purple-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Tasks
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleTasksMy}
                        className="flex items-center space-x-2 p-1.5 hover:bg-purple-50 rounded-md transition-colors group w-full text-left"
                      >
                        <CheckSquare className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                        <span className="text-sm text-gray-700 group-hover:text-purple-600">
                          My Tasks
                        </span>
                      </button>
                      <button
                        onClick={handleTasksTeam}
                        className="flex items-center space-x-2 p-1.5 hover:bg-purple-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Users className="w-4 h-4 text-gray-400 group-hover:text-purple-600" />
                        <span className="text-sm text-gray-700 group-hover:text-purple-600">
                          Team Tasks
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Messages Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-orange-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-orange-200">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-orange-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Messages
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleMessagesInbox}
                        className="flex items-center space-x-2 p-1.5 hover:bg-orange-50 rounded-md transition-colors group w-full text-left"
                      >
                        <MessageSquare className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                        <span className="text-sm text-gray-700 group-hover:text-orange-600">
                          Inbox
                        </span>
                      </button>
                      <button
                        onClick={handleCommunicationHub}
                        className="flex items-center space-x-2 p-1.5 hover:bg-orange-50 rounded-md transition-colors group w-full text-left"
                      >
                        <MessageCircle className="w-4 h-4 text-gray-400 group-hover:text-orange-600" />
                        <span className="text-sm text-gray-700 group-hover:text-orange-600">
                          Communication Hub
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Files Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-indigo-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-indigo-200">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Files
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleFilesRecent}
                        className="flex items-center space-x-2 p-1.5 hover:bg-indigo-50 rounded-md transition-colors group w-full text-left"
                      >
                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                        <span className="text-sm text-gray-700 group-hover:text-indigo-600">
                          My Files
                        </span>
                      </button>
                      <button
                        onClick={handleFilesShared}
                        className="flex items-center space-x-2 p-1.5 hover:bg-indigo-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Users className="w-4 h-4 text-gray-400 group-hover:text-indigo-600" />
                        <span className="text-sm text-gray-700 group-hover:text-indigo-600">
                          Shared
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Reports Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-red-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-red-200">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-red-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Reports
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleReportsGenerate}
                        className="flex items-center space-x-2 p-1.5 hover:bg-red-50 rounded-md transition-colors group w-full text-left"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                        <span className="text-sm text-gray-700 group-hover:text-red-600">
                          Overview
                        </span>
                      </button>
                      <button
                        onClick={handleReportsView}
                        className="flex items-center space-x-2 p-1.5 hover:bg-red-50 rounded-md transition-colors group w-full text-left"
                      >
                        <BarChart3 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                        <span className="text-sm text-gray-700 group-hover:text-red-600">
                          Performance
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Financial Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-emerald-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-emerald-200">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Financial
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleInvoices}
                        className="flex items-center space-x-2 p-1.5 hover:bg-emerald-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Receipt className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                        <span className="text-sm text-gray-700 group-hover:text-emerald-600">
                          Invoices
                        </span>
                      </button>
                      <button
                        onClick={handleContracts}
                        className="flex items-center space-x-2 p-1.5 hover:bg-emerald-50 rounded-md transition-colors group w-full text-left"
                      >
                        <FileCheck className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
                        <span className="text-sm text-gray-700 group-hover:text-emerald-600">
                          Contracts
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Settings Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-gray-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-gray-200">
                    <div className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-gray-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Settings
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleSettingsProfile}
                        className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Users className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-600">
                          Profile
                        </span>
                      </button>
                      <button
                        onClick={handleSettingsSystem}
                        className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Settings className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-600">
                          System
                        </span>
                      </button>
                      <button
                        onClick={handleUsersActivity}
                        className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Users className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                        <span className="text-sm text-gray-700 group-hover:text-gray-600">
                          Users & Activity
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Calendar Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-teal-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-teal-200">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-teal-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Calendar
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleCalendarToday}
                        className="flex items-center space-x-2 p-1.5 hover:bg-teal-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Calendar className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                        <span className="text-sm text-gray-700 group-hover:text-teal-600">
                          Today
                        </span>
                      </button>
                      <button
                        onClick={handleCalendarEvents}
                        className="flex items-center space-x-2 p-1.5 hover:bg-teal-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Clock className="w-4 h-4 text-gray-400 group-hover:text-teal-600" />
                        <span className="text-sm text-gray-700 group-hover:text-teal-600">
                          Upcoming
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Notifications Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-yellow-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-yellow-200">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-5 h-5 text-yellow-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Notifications
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleNotificationsAll}
                        className="flex items-center space-x-2 p-1.5 hover:bg-yellow-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Bell className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
                        <span className="text-sm text-gray-700 group-hover:text-yellow-600">
                          Recent
                        </span>
                      </button>
                      <button
                        onClick={handleNotificationsUnread}
                        className="flex items-center space-x-2 p-1.5 hover:bg-yellow-50 rounded-md transition-colors group w-full text-left"
                      >
                        <Bookmark className="w-4 h-4 text-gray-400 group-hover:text-yellow-600" />
                        <span className="text-sm text-gray-700 group-hover:text-yellow-600">
                          Saved
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Help Section */}
                  <div className="space-y-1.5 p-2.5 border border-gray-100 rounded-lg bg-gradient-to-br from-pink-50/50 to-white shadow-sm hover:shadow-md transition-all duration-200 hover:border-pink-200">
                    <div className="flex items-center space-x-2">
                      <HelpCircle className="w-5 h-5 text-pink-600" />
                      <h3 className="text-base font-semibold text-gray-900">
                        Help
                      </h3>
                    </div>
                    <div className="space-y-1">
                      <button
                        onClick={handleHelpSupport}
                        className="flex items-center space-x-2 p-1.5 hover:bg-pink-50 rounded-md transition-colors group w-full text-left"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-400 group-hover:text-pink-600" />
                        <span className="text-sm text-gray-700 group-hover:text-pink-600">
                          Support
                        </span>
                      </button>
                      <button
                        onClick={handleHelpDocs}
                        className="flex items-center space-x-2 p-1.5 hover:bg-pink-50 rounded-md transition-colors group w-full text-left"
                      >
                        <FileText className="w-4 h-4 text-gray-400 group-hover:text-pink-600" />
                        <span className="text-sm text-gray-700 group-hover:text-pink-600">
                          Docs
                        </span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Elegant Separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                  <div className="px-3">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                </div>

                {/* Quick Actions Footer - Compact */}
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-gray-600">
                          System Connected
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Bell className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          3 new notifications
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleQuickSearch}
                        className="flex items-center space-x-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        <Search className="w-3 h-3" />
                        <span className="text-xs">Quick Search</span>
                      </button>
                      <button
                        onClick={handleAddNew}
                        className="flex items-center space-x-1 px-2 py-1 bg-green-50 text-green-600 rounded-md hover:bg-green-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span className="text-xs">Add New</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MegaMenuPopup;
