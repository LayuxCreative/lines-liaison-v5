import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  FolderOpen,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Calendar,
  FileText,
  MessageSquare,
  Building2,
  LogIn,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { useActivity } from "../../contexts/ActivityContext";
import { formatDistanceToNow } from "date-fns";
import supabaseService from "../../services/supabaseService";
import { Project } from "../../types";


const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { getProjectsByUser } = useData();
  const { activities, loadActivities } = useActivity();
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  // Reload activities when user changes (login/logout)
  useEffect(() => {
    if (user) {
      loadActivities();
    }
  }, [user, loadActivities]);

  // Load user names for activities
  useEffect(() => {
    const loadUserNames = async () => {
      const uniqueUserIds = [...new Set(activities.map(activity => activity.userId))];
      const names: Record<string, string> = {};
      
      for (const userId of uniqueUserIds) {
        if (userId === user?.id) {
          names[userId] = user.name || 'Current User';
        } else {
          try {
            const userData = await supabaseService.getUserById(userId);
            names[userId] = userData?.name || 'Unknown User';
          } catch (error) {
            console.error('Error loading user:', error);
            names[userId] = 'Unknown User';
          }
        }
      }
      
      setUserNames(names);
    };
    
    if (activities.length > 0 && user) {
      loadUserNames();
    }
  }, [activities, user]);

  if (!user) return null;

  const userProjects = getProjectsByUser(user.id, user.role);
  
  // Add safety checks for projects data
  if (!userProjects || !Array.isArray(userProjects)) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Dashboard...</h2>
          <p className="text-gray-600">Please wait while we load your data.</p>
        </div>
      </div>
    );
  }

  const activeProjects = userProjects.filter((p: Project) => p.status === "active");
  const completedProjects = userProjects.filter(
    (p: Project) => p.status === "completed",
  );
  const totalBudget = userProjects.reduce((sum: number, p: Project) => sum + (p.budget || 0), 0);
  const totalSpent = userProjects.reduce((sum: number, p: Project) => sum + (p.spent || 0), 0);

  const stats = [
    {
      title: "Total Projects",
      value: userProjects.length.toString(),
      change: "+0%",
      trend: "neutral",
      icon: FolderOpen,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Active Projects",
      value: activeProjects.length.toString(),
      change: "+0%",
      trend: "neutral",
      icon: Clock,
      color: "from-teal-500 to-teal-600",
    },
    {
      title: "Completed Projects",
      value: completedProjects.length.toString(),
      change: "+0%",
      trend: "neutral",
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Budget Utilization",
      value: totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : "0%",
      change: "+0%",
      trend: "neutral",
      icon: BarChart3,
      color: "from-orange-500 to-orange-600",
    },
  ];



  // Get recent activities from DataContext
  const recentActivities = activities.slice(0, 5).map(activity => ({
    id: activity.id,
    type: activity.action,
    description: activity.description,
    time: formatDistanceToNow(activity.timestamp, { addSuffix: true }),
    user: userNames[activity.userId] || 'Loading...'
  }));

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "file_upload":
        return FileText;
      case "project_update":
        return CheckCircle;
      case "message":
        return MessageSquare;
      case "approval":
        return CheckCircle;
      case "user_login":
        return LogIn;
      case "user_logout":
        return LogOut;
      default:
        return AlertCircle;
    }
  };

  const getRoleSpecificGreeting = () => {
    switch (user.role) {
      case "admin":
        return "Admin Dashboard";
      case "project_manager":
        return "Project Manager Dashboard";
      case "team_member":
        return "Team Dashboard";
      case "client":
        return "Client Portal";
      default:
        return "Dashboard";
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
          className="mb-8 bg-white rounded-xl shadow-lg p-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.name}
              </h1>
              <p className="text-gray-600 mt-2">
                {getRoleSpecificGreeting()} -{" "}
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-teal-600 rounded-xl shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  LiNES AND LiAiSON
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  Engineering Excellence
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-green-500 text-sm font-medium">
                      {stat.change}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">
                      vs last month
                    </span>
                  </div>
                </div>
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center`}
                >
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Projects */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2 bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Projects
              </h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {userProjects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    to={`/dashboard/projects/${project.id}`}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          project.status === "active"
                            ? "bg-blue-100 text-blue-600"
                            : project.status === "completed"
                              ? "bg-green-100 text-green-600"
                              : project.status === "planning"
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <FolderOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {project.name}
                        </h3>
                        <p className="text-sm text-gray-600 capitalize">
                          {project.status} • {project.category}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-600">
                          {project.progress}%
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Recent Activity
              </h2>
              <Link 
                to="/dashboard/reports"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                View All
              </Link>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentActivities.map((activity) => {
                  const IconComponent = getActivityIcon(activity.type);
                  return (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.time} • {activity.user}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>



        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-8 bg-white rounded-xl shadow-lg p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/dashboard/projects"
              className="flex items-center justify-center space-x-2 p-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <FolderOpen className="w-5 h-5" />
              <span>View All Projects</span>
            </Link>
            <Link
              to="/dashboard/files"
              className="flex items-center justify-center space-x-2 p-4 bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Upload Files</span>
            </Link>
            <Link
              to="/dashboard/communication"
              className="flex items-center justify-center space-x-2 p-4 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span>Team Communication</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
