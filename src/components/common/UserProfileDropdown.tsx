import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { UserStatusType } from "../../types";
import UserStatusIndicator from "./UserStatusIndicator";
import UserStatusSelector from "./UserStatusSelector";

interface UserProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout, updateUserStatus } = useAuth();
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);

  const handleStatusChange = (status: UserStatusType) => {
    if (updateUserStatus) {
      updateUserStatus(status);
    }
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrator";
      case "manager":
        return "Manager";
      case "employee":
        return "Employee";
      case "client":
        return "Client";
      default:
        return role;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-Screen Backdrop with Cross-Browser Support */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)", // Safari support
            }}
            onClick={onClose}
          />

          {/* User Profile Dropdown - Positioned above backdrop */}
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: "auto",
            }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 z-[60] overflow-hidden transition-all duration-300 ${isStatusSelectorOpen ? "min-h-[400px]" : "min-h-[280px]"}`}
            style={{ height: "auto" }}
          >
            {/* User Info Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <img
                    src={
                      user?.avatar ||
                      `https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=48&h=48&fit=crop`
                    }
                    alt={user?.name || "User"}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <UserStatusIndicator status={user?.status} size="md" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.name}
                  </p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                  <p className="text-xs text-blue-600 font-medium">
                    {getRoleDisplayName(user?.role || "")}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <UserStatusSelector
                currentStatus={user?.status}
                onStatusChange={handleStatusChange}
                onDropdownToggle={setIsStatusSelectorOpen}
              />
              <Link
                to="/dashboard/profile"
                className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <User className="w-4 h-4 mr-3 text-gray-400" />
                Profile
              </Link>
              <Link
                to="/dashboard/settings"
                className="flex items-center px-6 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                onClick={onClose}
              >
                <Settings className="w-4 h-4 mr-3 text-gray-400" />
                Settings
              </Link>
              <hr className="my-2 border-gray-100" />
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-6 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default UserProfileDropdown;
