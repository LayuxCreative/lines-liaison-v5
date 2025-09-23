import React, { useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Users,
  BarChart3,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  Upload,
  Download,
  Eye,
  Send,
  MessageSquare,
  FileText,
  Image,
  File,
  Plus,
  Search,
  Grid3X3,
  List,
  MoreVertical,
  Star,
  Share2,
  Settings,
  Target,
  TrendingUp,
  DollarSign,
  Phone,
  Mail,
  Building2,
  User,
  Paperclip,
  ExternalLink,
  Tag,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { format } from "date-fns";
import FileViewer from "../../components/dashboard/FileViewer";
import { activityLogger } from "../../utils/activityLogger";


import { ProjectFile, Task } from "../../types";

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getProjectsByUser } = useData();

  const [activeTab, setActiveTab] = useState("overview");
  const [messageText, setMessageText] = useState("");
  const [feedbackText, setFeedbackText] = useState("");

  // Tasks will be loaded from Supabase via DataContext
  const tasks: Task[] = [];

  // Filter tasks for current project
  const projectTasks = tasks.filter((task) => task.projectId === id);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [fileViewMode, setFileViewMode] = useState<"grid" | "list">("grid");
  const [fileSearchTerm, setFileSearchTerm] = useState("");
  const [fileCategoryFilter, setFileCategoryFilter] = useState("all");

  // Upload progress state removed as not used
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Utility function to check if a task is overdue
  const isTaskOverdue = (dueDate: Date): boolean => {
    return new Date() > dueDate;
  };

  if (!user) return null;

  const userProjects = getProjectsByUser(user.id, user.role);
  const project = userProjects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Project Not Found
            </h1>
            <p className="text-gray-600 mb-8">
              The project you're looking for doesn't exist or you don't have
              permission to view it.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard/projects"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Projects
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
              >
                Dashboard Home
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return Clock;
      case "completed":
        return CheckCircle;
      case "on_hold":
        return Pause;
      case "planning":
        return FolderOpen;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "on_hold":
        return "bg-yellow-100 text-yellow-800";
      case "planning":
        return "bg-purple-100 text-purple-800";
      case "review":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const StatusIcon = getStatusIcon(project.status);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !user || !project) return;

    try {
      await activityLogger.log("message_send", "info", "Sending project message", {
        projectId: project.id,
        messageLength: messageText.trim().length
      });
      
      const newMessage: Omit<Message, "id" | "timestamp"> = {
        projectId: project.id,
        senderId: user.id,
        content: messageText.trim(),
        type: "text",
        attachments: [],
      };

      await addMessage(newMessage);
      setMessageText("");
      
      await activityLogger.log("message_send", "success", "Project message sent successfully", {
        projectId: project.id
      });
    } catch (error) {
      console.error("Error sending message:", error);
      await activityLogger.log("message_send", "error", "Failed to send project message", {
        projectId: project.id,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleSendFeedback = async () => {
    if (!feedbackText.trim()) return;

    try {
      await activityLogger.log("feedback_send", "info", "Sending project feedback", {
        projectId: project?.id,
        feedbackLength: feedbackText.trim().length
      });
      
      // console.log("Sending feedback:", feedbackText);
      setFeedbackText("");
      
      await activityLogger.log("feedback_send", "success", "Project feedback sent successfully", {
        projectId: project?.id
      });
      // Here you would typically send the feedback to your backend
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  };

  const handleFileUpload = async (files: File[]) => {
    if (!project || !user) return;

    try {
      await activityLogger.log("file_upload", "info", "Starting project file upload", {
        projectId: project.id,
        projectName: project.name,
        filesCount: files.length,
        userId: user.id
      });

      const uploadPromises = files.map(file => 
        addProjectFile(project.id, file)
      );
      
      const uploadedFiles = await Promise.all(uploadPromises);

      await activityLogger.log("file_upload", "success", "Project files uploaded successfully", {
        projectId: project.id,
        projectName: project.name,
        filesCount: files.length,
        uploadedFiles: uploadedFiles.length,
        userId: user.id
      });
      
      // console.log("Files uploaded successfully:", uploadedFiles);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      await activityLogger.log("file_upload", "error", "Project file upload failed", {
        projectId: project.id,
        projectName: project.name,
        filesCount: files.length,
        userId: user.id,
        error: errorMessage
      });
      
      console.error("Error uploading files:", error);
    }
  };

  // File management functions removed as not used

  const handleFileView = (file: ProjectFile) => {
    setSelectedFile(file);
    setIsViewerOpen(true);
  };

  const handleFileDownload = (file: ProjectFile) => {
    alert(`Downloading ${file.name}...`);
  };

  const getFileIcon = (type: string, category: string) => {
    if (category === "model") return FileText;
    if (type.includes("dwg")) return FileText;
    if (type.includes("rvt")) return FileText;
    if (type.startsWith("image/")) return Image;
    return File;
  };

  const getFileTypeColor = (type: string, category: string) => {
    if (category === "model") return "from-blue-500 to-blue-600";
    if (type.includes("dwg")) return "from-green-500 to-green-600";
    if (type.includes("rvt")) return "from-orange-500 to-orange-600";
    if (type.startsWith("image/")) return "from-green-500 to-green-600";
    if (type.includes("pdf")) return "from-red-500 to-red-600";
    return "from-gray-500 to-gray-600";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredFiles = project.files.filter((file) => {
    const matchesSearch = file.name
      .toLowerCase()
      .includes(fileSearchTerm.toLowerCase());
    const matchesCategory =
      fileCategoryFilter === "all" || file.category === fileCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categoryOptions = [
    { value: "all", label: "All Files" },
    { value: "model", label: "BIM Models" },
    { value: "drawing", label: "Drawings" },
    { value: "document", label: "Documents" },
    { value: "image", label: "Images" },
    { value: "other", label: "Other" },
  ];

  const tabs = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "files", label: "Files", icon: FolderOpen },
    { id: "tasks", label: "Tasks", icon: Target },
    { id: "team", label: "Team", icon: Users },
    { id: "communication", label: "Communication", icon: MessageSquare },
    ...(user.role === "client"
      ? [{ id: "feedback", label: "Feedback", icon: Star }]
      : []),
  ];

  // Project messages and team data will be loaded from Supabase when needed

  const getTaskStatusIcon = (status: string) => {
    switch (status) {
      case "todo":
        return Clock;
      case "in_progress":
        return Play;
      case "review":
        return AlertCircle;
      case "completed":
        return CheckCircle;
      case "blocked":
        return Pause;
      default:
        return Clock;
    }
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "todo":
        return "bg-gray-100 text-gray-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "blocked":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
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
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/dashboard/projects"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Projects
            </Link>
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center ${getStatusColor(project.status)} shadow-lg`}
                >
                  <StatusIcon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-3xl font-bold text-gray-900">
                      {project.name}
                    </h1>
                    <div
                      className={`w-4 h-4 rounded-full ${getPriorityColor(project.priority)}`}
                    ></div>
                  </div>
                  <p className="text-gray-600 text-lg mb-4">
                    {project.description}
                  </p>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span>{format(project.startDate, "MMM dd, yyyy")}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4" />
                      <span>{project.category}</span>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}
                    >
                      {project.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Project Progress
                </span>
                <span className="text-sm font-bold text-blue-600">
                  {project.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                <div
                  className="bg-gradient-to-r from-blue-500 to-teal-500 h-3 rounded-full transition-all duration-500 shadow-sm"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Team Members
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {project.teamMembers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Files</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {project.files.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Budget</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${project.budget ? (project.budget / 1000).toFixed(0) : "0"}k
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Progress</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {project.progress}%
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Project Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Start Date
                      </p>
                      <p className="text-gray-900">
                        {format(project.startDate, "MMMM dd, yyyy")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        End Date
                      </p>
                      <p className="text-gray-900">
                        {project.endDate
                          ? format(project.endDate, "MMMM dd, yyyy")
                          : "Not set"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Category
                      </p>
                      <p className="text-gray-900">{project.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Priority
                      </p>
                      <p className="text-gray-900 capitalize">
                        {project.priority}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Budget Overview
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-blue-600 mb-1">
                        Total Budget
                      </p>
                      <p className="text-2xl font-bold text-blue-900">
                        $
                        {project.budget ? project.budget.toLocaleString() : "0"}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-green-600 mb-1">
                        Spent
                      </p>
                      <p className="text-2xl font-bold text-green-900">
                        ${project.spent ? project.spent.toLocaleString() : "0"}
                      </p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4">
                      <p className="text-sm font-medium text-orange-600 mb-1">
                        Remaining
                      </p>
                      <p className="text-2xl font-bold text-orange-900">
                        $
                        {project.budget && project.spent
                          ? (project.budget - project.spent).toLocaleString()
                          : "0"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "files" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Project Files
                  </h3>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Files
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={(e) =>
                      e.target.files && handleFileUpload(e.target.files)
                    }
                    className="hidden"
                    accept=".dwg,.rvt,.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar"
                  />
                </div>

                {/* File Filters */}
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search files..."
                        value={fileSearchTerm}
                        onChange={(e) => setFileSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <select
                      value={fileCategoryFilter}
                      onChange={(e) => setFileCategoryFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    >
                      {categoryOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setFileViewMode("grid")}
                        className={`p-2 rounded-md transition-colors ${
                          fileViewMode === "grid"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setFileViewMode("list")}
                        className={`p-2 rounded-md transition-colors ${
                          fileViewMode === "list"
                            ? "bg-white text-blue-600 shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Files Display */}
                {filteredFiles.length > 0 ? (
                  fileViewMode === "grid" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredFiles.map((file) => {
                        const FileIcon = getFileIcon(file.type, file.category);
                        return (
                          <div
                            key={file.id}
                            className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div
                                className={`w-10 h-10 bg-gradient-to-br ${getFileTypeColor(file.type, file.category)} rounded-lg flex items-center justify-center`}
                              >
                                <FileIcon className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex items-center space-x-1">
                                {file.isApproved ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Clock className="w-4 h-4 text-yellow-500" />
                                )}
                              </div>
                            </div>
                            <h4
                              className="font-medium text-gray-900 mb-1 truncate"
                              title={file.name}
                            >
                              {file.name}
                            </h4>
                            <p className="text-sm text-gray-500 mb-3">
                              {formatFileSize(file.size)} • v{file.version}
                            </p>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleFileView(file)}
                                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                <span>View</span>
                              </button>
                              <button
                                onClick={() => handleFileDownload(file)}
                                className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-100 border-b border-gray-200">
                            <tr>
                              <th className="text-left px-4 py-3 text-sm font-medium text-gray-900">
                                Name
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-gray-900">
                                Size
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-gray-900">
                                Status
                              </th>
                              <th className="text-left px-4 py-3 text-sm font-medium text-gray-900">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {filteredFiles.map((file) => {
                              const FileIcon = getFileIcon(
                                file.type,
                                file.category,
                              );
                              return (
                                <tr
                                  key={file.id}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-3">
                                      <div
                                        className={`w-8 h-8 bg-gradient-to-br ${getFileTypeColor(file.type, file.category)} rounded-lg flex items-center justify-center`}
                                      >
                                        <FileIcon className="w-4 h-4 text-white" />
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-900">
                                          {file.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                          Version {file.version}
                                        </p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {formatFileSize(file.size)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      {file.isApproved ? (
                                        <>
                                          <CheckCircle className="w-4 h-4 text-green-500" />
                                          <span className="text-sm text-green-600">
                                            Approved
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <Clock className="w-4 h-4 text-yellow-500" />
                                          <span className="text-sm text-yellow-600">
                                            Pending
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleFileView(file)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                      >
                                        <Eye className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleFileDownload(file)}
                                        className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                      >
                                        <Download className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center py-8">
                    <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No files found
                    </h3>
                    <p className="text-gray-600">
                      {fileSearchTerm || fileCategoryFilter !== "all"
                        ? "Try adjusting your search or filter criteria."
                        : "Upload your first file to get started."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "tasks" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Project Tasks
                  </h3>
                  {(user.role === "admin" ||
                    user.role === "project_manager" ||
                    user.role === "team_member") && (
                    <button
                      onClick={() =>
                        alert("Create Task functionality will be implemented")
                      }
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Task
                    </button>
                  )}
                </div>

                {/* Task Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-600 text-sm font-medium">
                          Total Tasks
                        </p>
                        <p className="text-2xl font-bold text-blue-900">
                          {projectTasks.length}
                        </p>
                      </div>
                      <Target className="w-8 h-8 text-blue-600" />
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-yellow-600 text-sm font-medium">
                          In Progress
                        </p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {
                            projectTasks.filter(
                              (t) => t.status === "in_progress",
                            ).length
                          }
                        </p>
                      </div>
                      <Play className="w-8 h-8 text-yellow-600" />
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-600 text-sm font-medium">
                          Completed
                        </p>
                        <p className="text-2xl font-bold text-green-900">
                          {
                            projectTasks.filter((t) => t.status === "completed")
                              .length
                          }
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-red-600 text-sm font-medium">
                          Overdue
                        </p>
                        <p className="text-2xl font-bold text-red-900">
                          {
                            projectTasks.filter(
                              (t) =>
                                t.status !== "completed" &&
                                isTaskOverdue(t.dueDate),
                            ).length
                          }
                        </p>
                      </div>
                      <AlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                {projectTasks.length > 0 ? (
                  <div className="space-y-4">
                    {projectTasks.map((task) => {
                      const TaskStatusIcon = getTaskStatusIcon(task.status);
                      const isOverdue =
                        task.status !== "completed" &&
                        isTaskOverdue(task.dueDate);

                      return (
                        <div
                          key={task.id}
                          className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              <div
                                className={`w-3 h-3 rounded-full ${getTaskPriorityColor(task.priority)} mt-2 flex-shrink-0`}
                              ></div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-2">
                                  {task.title}
                                </h4>
                                <p className="text-gray-600 text-sm mb-3">
                                  {task.description}
                                </p>

                                {/* Tags */}
                                {task.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {task.tags.map((tag, index) => (
                                      <span
                                        key={index}
                                        className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full flex items-center space-x-1"
                                      >
                                        <Tag className="w-3 h-3" />
                                        <span>{tag}</span>
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-medium ${getTaskStatusColor(task.status)}`}
                              >
                                {task.status.replace("_", " ").toUpperCase()}
                              </span>
                              <button className="p-1 text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-gray-600">
                                {task.assigneeName}
                              </span>
                            </div>
                            <div
                              className={`flex items-center space-x-2 ${isOverdue ? "text-red-600" : "text-gray-600"}`}
                            >
                              <Calendar className="w-4 h-4" />
                              <span>
                                Due: {format(task.dueDate, "MMM dd, yyyy")}
                              </span>
                              {isOverdue && (
                                <span className="text-red-500 font-medium">
                                  (Overdue)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-gray-600">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{task.estimatedHours}h estimated</span>
                            </div>
                            <div className="flex items-center space-x-4">
                              {task.attachedFiles.length > 0 && (
                                <div className="flex items-center space-x-1 text-gray-500">
                                  <Paperclip className="w-4 h-4" />
                                  <span className="text-xs">
                                    {task.attachedFiles.length}
                                  </span>
                                </div>
                              )}
                              {task.comments.length > 0 && (
                                <div className="flex items-center space-x-1 text-gray-500">
                                  <MessageSquare className="w-4 h-4" />
                                  <span className="text-xs">
                                    {task.comments.length}
                                  </span>
                                </div>
                              )}
                              {task.clickUpUrl && (
                                <a
                                  href={task.clickUpUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="text-xs">ClickUp</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No tasks found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Create your first task to start managing project work.
                    </p>
                    {(user.role === "admin" ||
                      user.role === "project_manager" ||
                      user.role === "team_member") && (
                      <button
                        onClick={() =>
                          alert("Create Task functionality will be implemented")
                        }
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Task
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "team" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Members
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {project.teamMembers?.map((memberId) => {
                    // Find member details from project data or use placeholder
                    const member = {
                      id: memberId,
                      name: "Team Member",
                      role: "Team Member",
                      email: "member@example.com",
                      phone: "+1 (555) 000-0000",
                      expertise: "General",
                      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
                      status: "online"
                    };
                    
                    return (
                      <div key={member.id} className="bg-gray-50 rounded-lg p-6">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="relative">
                            <img
                              src={member.avatar}
                              alt={member.name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                            <div
                              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                                member.status === "online"
                                  ? "bg-green-500"
                                  : "bg-yellow-500"
                              }`}
                            ></div>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              {member.name}
                            </h4>
                            <p className="text-sm text-gray-600">{member.role}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{member.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">{member.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Target className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600">
                              {member.expertise}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }) || []}
                </div>
                {(!project.teamMembers || project.teamMembers.length === 0) && (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No team members assigned yet</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "communication" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Team Communication
                </h3>

                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="space-y-4">
                    {/* Real-time messages will be loaded from Supabase */}
                    <div className="text-center py-8">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Start a conversation with your team
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    placeholder="Type your message..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === "feedback" && user.role === "client" && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Client Feedback
                </h3>

                <div className="bg-blue-50 rounded-lg p-6">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Share Your Feedback
                  </h4>
                  <p className="text-blue-700 text-sm mb-4">
                    Your feedback helps us improve the project and deliver
                    better results.
                  </p>
                  <textarea
                    placeholder="Share your thoughts, suggestions, or concerns..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
                  />
                  <button
                    onClick={handleSendFeedback}
                    disabled={!feedbackText.trim()}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Send Feedback
                  </button>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">
                    Previous Feedback
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-medium text-gray-900">
                          Great progress on the structural modeling
                        </p>
                        <span className="text-xs text-gray-500">
                          2 days ago
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">
                        The team has done excellent work on the structural BIM
                        model. The level of detail is impressive.
                      </p>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Resolved
                        </span>
                        <span className="text-xs text-gray-500">
                          Response: Thank you for the positive feedback!
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* File Viewer Modal */}
      <FileViewer
        file={selectedFile}
        isOpen={isViewerOpen}
        onClose={() => {
          setIsViewerOpen(false);
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

export default ProjectDetails;
