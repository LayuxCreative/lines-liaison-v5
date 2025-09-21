import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Settings as SettingsIcon,
  User,
  Shield
} from "lucide-react";

import { useNotifications } from "../../contexts/NotificationContext";
import { supabaseService } from "../../services/supabaseService";
import { User as UserType, PermissionGroup } from "../../types";
import UserManagement from "../../components/dashboard/UserManagement";
import GeneralSettings from "../../components/dashboard/GeneralSettings";
import SecuritySettings from "../../components/dashboard/SecuritySettings";

const Settings: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = searchParams.get("tab");
    const savedTab = localStorage.getItem("settings-active-tab");
    return urlTab || savedTab || "general";
  });

  // Settings state
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage or use defaults
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (error) {
        console.error("Error parsing saved settings:", error);
      }
    }

    // Default settings
    return {
      // General Settings
      theme: "system",
      language: "en",
      timezone: "Asia/Dubai",
      notifications: {
        email: true,
        push: false,
        sms: true,
      },
      privacy: {
        profileVisibility: "public",
        showEmail: false,
        showPhone: false,
        allowMessages: true,
      },
      // Security Settings
      twoFactorEnabled: false,
      sessionTimeout: 30,
      loginNotifications: true,
    };
  });

  // Users state for user management
  const [users, setUsers] = useState<UserType[]>([]);
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  const { addNotification } = useNotifications();

  // Load data on component mount
  useEffect(() => {
    if (activeTab === "users" || activeTab === "permissions") {
      loadUsers();
      loadPermissionGroups();
    }
  }, [activeTab]);

  // Update URL when tab changes
  useEffect(() => {
    setSearchParams({ tab: activeTab });
    localStorage.setItem("settings-active-tab", activeTab);
  }, [activeTab, setSearchParams]);

  const loadUsers = async () => {
    try {
      const usersData = await supabaseService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading users:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to load users",
        userId: "system",
        priority: "high"
      });
    }
  };

  const loadPermissionGroups = async () => {
    try {
      const groupsData = await supabaseService.getPermissionGroups();
      setPermissionGroups(groupsData);
    } catch (error) {
      console.error("Error loading permission groups:", error);
      addNotification({
        type: "error",
        title: "Error",
        message: "Failed to load permission groups",
        userId: "system",
        priority: "high"
      });
    }
  };

  const handleSettingChange = (key: string, value: string | boolean) => {
    const newSettings = { ...settings };
    
    // Handle nested settings
    if (key.includes('.')) {
      const keys = key.split('.');
      let current = newSettings;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
    } else {
      newSettings[key] = value;
    }
    
    setSettings(newSettings);
    
    // Save to localStorage
    localStorage.setItem('userSettings', JSON.stringify(newSettings));
  };



  const tabs = [
    {
      id: "general",
      label: "General",
      icon: SettingsIcon,
      description: "Basic application settings",
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      description: "Security and privacy settings",
    },
    {
      id: "users",
      label: "User Management",
      icon: User,
      description: "Manage users, roles, and permissions",
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <GeneralSettings 
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        );
      case "privacy":
        return (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Visibility
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Who can see your profile?
                  </label>
                  <select 
                    value={settings.privacy?.profileVisibility || 'public'}
                    onChange={(e) => handleSettingChange('privacy.profileVisibility', e.target.value)}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Everyone</option>
                    <option value="contacts">Contacts Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );
      case "security":
        return (
          <SecuritySettings 
            settings={settings}
            onSettingChange={handleSettingChange}
            onPasswordChange={async () => {
              console.log('Password change requested');
            }}
          />
        );
      case "users":
        return (
          <UserManagement 
            users={users}
            setUsers={setUsers}
            permissionGroups={permissionGroups}
            isLoadingUsers={false}
            setIsLoadingUsers={() => {}}
            showConfirmation={() => {}}
          />
        );
      default:
        return (
          <GeneralSettings 
            settings={settings}
            onSettingChange={handleSettingChange}
          />
        );
    }
  };



  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">
              Manage your account settings and preferences
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white rounded-xl shadow-lg p-6 sticky top-8"
            >
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? "bg-blue-50 border border-blue-200 text-blue-700"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs text-gray-500">
                          {tab.description}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-xl shadow-lg p-6"
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
