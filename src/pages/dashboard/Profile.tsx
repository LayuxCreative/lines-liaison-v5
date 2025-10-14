import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Building2,
  Calendar,
  MapPin,
  Edit3,
  Save,
  X,
  Camera,
  Shield,
  Award,
  Clock,
  FileText,
  Users,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { format } from "date-fns";
import ImageUploader from "../../components/common/ImageUploader";
import { useNotifications } from "../../hooks/useNotifications";

const Profile: React.FC = () => {
  const { user, updateUserProfile, refreshUserProfile } = useAuth();
  const { projects, tasks } = useData();
  const { addNotification } = useNotifications();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [showImageUploader, setShowImageUploader] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      if (editedUser) {
        await updateUserProfile(editedUser);
        await refreshUserProfile();
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    setEditedUser(user);
    setIsEditing(false);
  };

  const handleUpdateAvatar = async (result: { url?: string; path?: string }) => {
    try {
      // Update profile in profiles table
      await updateUserProfile({ 
        avatar: result.url,
        avatar_url: result.url 
      });
      
      addNotification({
        type: 'success',
        title: 'Update Successful',
        message: 'Profile picture updated successfully',
        userId: user.id
      });
      setShowImageUploader(false);
    } catch (error) {
        console.error('Error updating avatar:', error);
        addNotification({
           type: 'error',
           title: 'Update Failed',
           message: 'Failed to update profile picture',
           userId: user.id
         });
      }
   };

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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "project_manager":
        return "bg-blue-100 text-blue-800";
      case "team_member":
        return "bg-green-100 text-green-800";
      case "client":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "N/A";
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return format(dateObj, "PPP");
  };

  const userProjects = projects?.filter(
    (project) => project.teamMembers?.includes(user.id)
  ) || [];
  const userTasks = tasks?.filter((task) => task.assigneeId === user.id) || [];
  const completedTasks = userTasks.filter((task) => task.status === "completed");

  const stats = [
    {
      label: "Active Projects",
      value: userProjects.length,
      icon: FileText,
      color: "from-blue-500 to-blue-600",
    },
    {
      label: "Completed Tasks",
      value: completedTasks.length,
      icon: Award,
      color: "from-green-500 to-green-600",
    },
    {
      label: "Total Tasks",
      value: userTasks.length,
      icon: BarChart3,
      color: "from-purple-500 to-purple-600",
    },
    {
      label: "Team Members",
      value: 12,
      icon: Users,
      color: "from-purple-500 to-purple-600",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-teal-600 rounded-3xl p-8 mb-8 shadow-2xl"
        >
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="flex items-center space-x-6 mb-6 md:mb-0">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {user.avatar_url || user.avatar ? (
                      <img
                        src={user.avatar_url || user.avatar}
                        alt={user.name}
                        className="w-24 h-24 rounded-full object-cover shadow-lg"
                      />
                    ) : (
                      user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'
                    )}
                  </div>
                  {isEditing && (
                    <button 
                      onClick={() => setShowImageUploader(true)}
                      className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="text-white">
                  <h2 className="text-3xl font-bold">{user.name}</h2>
                  <div className="flex items-center space-x-3 mt-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)} bg-white/20 text-white border border-white/30`}
                    >
                      {getRoleDisplayName(user.role)}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Shield className="w-4 h-4" />
                      <span className="text-sm">Verified Account</span>
                    </div>
                  </div>
                  <p className="text-blue-100 mt-2">
                    Member since {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-all duration-300 border border-white/30"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSave}
                      className="flex items-center space-x-2 px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">
                      {stat.label}
                    </p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-r ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Profile Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Personal Information */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <User className="w-6 h-6 mr-3 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser?.name || ""}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser!, name: e.target.value })
                    }
                    autoComplete="name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <User className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.name}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedUser?.email || ""}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser!, email: e.target.value })
                    }
                    autoComplete="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.email}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedUser?.phone || ""}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser!, phone: e.target.value })
                    }
                    autoComplete="tel"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.phone || "Not provided"}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser?.company || ""}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser!, company: e.target.value })
                    }
                    autoComplete="organization"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.company || "Not provided"}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedUser?.position || ""}
                    onChange={(e) =>
                      setEditedUser({ ...editedUser!, position: e.target.value })
                    }
                    autoComplete="organization-title"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  />
                ) : (
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-900">{user.position || "Not provided"}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-900">{formatDate(user.createdAt)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Activity Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          >
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Clock className="w-6 h-6 mr-3 text-blue-600" />
              Activity Summary
            </h3>
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-700">
                    Projects
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    {userProjects.length}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min((userProjects.length / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-700">
                    Completed Tasks
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    {completedTasks.length}
                  </span>
                </div>
                <div className="w-full bg-green-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-700">
                    Total Tasks
                  </span>
                  <span className="text-2xl font-bold text-purple-600">
                    {userTasks.length}
                  </span>
                </div>
                <div className="w-full bg-purple-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full"
                    style={{ width: `${Math.min((userTasks.length / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Image Uploader Modal */}
      {showImageUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update Profile Picture</h3>
              <button
                onClick={() => setShowImageUploader(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ImageUploader
              currentImageUrl={user?.avatar}
              onImageUpload={handleUpdateAvatar}
              userId={user?.id}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
