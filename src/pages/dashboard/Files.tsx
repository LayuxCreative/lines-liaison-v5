import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Grid3X3,
  List,
  Eye,
  FileText,
  CheckCircle,
  Clock,
  MoreVertical,
  Upload,
  Star,
  Edit3,
  AlertCircle,
  Share2,
  File,
  Image,
  Film,
  Archive,
  Building2,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { ProjectFile } from "../../types";
import FileViewer from "../../components/dashboard/FileViewer";
// Removed simpleFileUploadService - using Supabase Storage instead
import SimpleToast, { useToast } from "../../components/common/SimpleToast";
import { formatDistanceToNow } from "date-fns";
// import { backendApiService } from "../../services/backendApiService";
import { FileUploadModal } from "../../components/dashboard/FileUploadModal";
import FileDisplayFooter from "../../components/dashboard/FileDisplayFooter";


interface ExtendedProjectFile extends ProjectFile {
  projectId: string;
  projectName: string;
  viewedByClient: boolean;
  lastViewedBy?: string;
  lastViewedAt?: Date;
  lastModifiedAt?: Date;
  comments: number;
  isStarred: boolean;
  tags: string[];
}

// Footer file data used by FileDisplayFooter
interface FooterFileData {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
  projectName: string;
  category: string;
  viewCount: number;
  isApproved: boolean;
  version: number;
  lastViewedBy?: string;
  lastViewedAt?: Date;
}

const Files: React.FC = () => {
  const { user } = useAuth();
  const { getProjectsByUser } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProject, setSelectedProject] = useState("1");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedFile, setSelectedFile] = useState<ExtendedProjectFile | null>(
    null,
  );
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // Remove legacy file input upload states
  // const [isUploading, setIsUploading] = useState(false);
  // const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [footerFile, setFooterFile] = useState<FooterFileData | null>(null);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { messages, removeToast } = useToast();
  const handleUploadClick = () => { setIsUploadModalOpen(true); };
  // legacy upload flow removed in favor of FileUploadModal


  // Keep hooks order stable; do not early-return
  const userProjects = useMemo(() => {
    if (!user) return [] as ReturnType<typeof getProjectsByUser>;
    return getProjectsByUser(user.id, user.role);
  }, [user, getProjectsByUser]);

  // Extended files data with real tracking information
  const extendedFiles: ExtendedProjectFile[] = useMemo(() => {
    const files: ExtendedProjectFile[] = [];

    userProjects.forEach((project) => {
      project.files.forEach((file) => {
        files.push({
          ...file,
          projectId: project.id,
          projectName: project.name,
          viewedByClient: file.viewCount > 0,
          lastViewedBy: file.lastModifiedBy,
          lastViewedAt: file.lastModified,
          lastModifiedAt: file.lastModified,
          comments: file.activity?.length || 0,
          isStarred: false,
          tags: file.tags || [],
        });
      });
    });

    return files;
  }, [userProjects]);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = extendedFiles;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (file) =>
          file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          file.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Apply category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((file) => file.category === categoryFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "approved") {
        filtered = filtered.filter((file) => file.isApproved);
      } else if (statusFilter === "pending") {
        filtered = filtered.filter((file) => !file.isApproved);
      } else if (statusFilter === "viewed") {
        filtered = filtered.filter((file) => file.viewedByClient);
      } else if (statusFilter === "unviewed") {
        filtered = filtered.filter((file) => !file.viewedByClient);
      }
    }

    // Apply project filter
    if (selectedProject !== "all") {
      filtered = filtered.filter((file) => file.projectId === selectedProject);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;

        case "size":
          comparison = b.size - a.size;
          break;
        case "project":
          comparison = a.projectName.localeCompare(b.projectName);
          break;

        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [
    extendedFiles,
    searchTerm,
    categoryFilter,
    statusFilter,
    selectedProject,
    sortBy,
    sortOrder,
  ]);

  const getFileIcon = (type: string, category?: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.startsWith("video/")) return Film;
    if (type.includes("pdf")) return FileText;
    if (category === "model" || type.includes("dwg") || type.includes("rvt"))
      return Building2;
    if (type.includes("zip") || type.includes("rar")) return Archive;
    return File;
  };

  const getFileTypeColor = (type: string, category?: string) => {
    if (type.startsWith("image/")) return "from-green-500 to-green-600";
    if (type.startsWith("video/")) return "from-purple-500 to-purple-600";
    if (type.includes("pdf")) return "from-red-500 to-red-600";
    if (category === "model" || type.includes("dwg") || type.includes("rvt"))
      return "from-blue-500 to-blue-600";
    if (type.includes("zip") || type.includes("rar"))
      return "from-yellow-500 to-yellow-600";
    return "from-gray-500 to-gray-600";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileView = (file: ExtendedProjectFile) => {
    setSelectedFile(file);
    setIsViewerOpen(true);
  };

  const handleStarToggle = (fileId: string) => {
    console.debug("Star toggle clicked for file:", fileId);
    alert("Star toggle functionality will be implemented");
  };

  const categoryOptions = [
    { value: "all", label: "All Categories" },
    { value: "document", label: "Documents" },
    { value: "image", label: "Images" },
    { value: "model", label: "3D Models" },
    { value: "drawing", label: "Drawings" },
    { value: "dwg", label: "DWG Files" },
    { value: "rvt", label: "Revit Files" },
    { value: "other", label: "Other" },
  ];

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "viewed", label: "Viewed by Client" },
    { value: "unviewed", label: "Not Viewed" },
  ];

  const sortOptions = [
    { value: "name", label: "Name" },
    { value: "size", label: "File Size" },
    { value: "project", label: "Project" },
  ];

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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Project Files
              </h1>
              <p className="text-gray-600 mt-2">
                Manage and organize all project files with advanced tracking and
                collaboration features
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              {/* Removed legacy hidden file input */}
              <button
                onClick={handleUploadClick}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Files
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Files
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {extendedFiles.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Viewed by Clients
                  </p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {extendedFiles.filter((f) => f.viewedByClient).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Pending Approval
                  </p>
                  <p className="text-2xl font-bold text-orange-600 mt-1">
                    {extendedFiles.filter((f) => !f.isApproved).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters and Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search files, projects, tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Project Filter */}
            <div>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Projects</option>
                {userProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split("-");
                  setSortBy(sort);
                  setSortOrder(order as "asc" | "desc");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {sortOptions.map((option) => (
                  <React.Fragment key={option.value}>
                    <option value={`${option.value}-asc`}>
                      {option.label} (A-Z)
                    </option>
                    <option value={`${option.value}-desc`}>
                      {option.label} (Z-A)
                    </option>
                  </React.Fragment>
                ))}
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {filteredAndSortedFiles.length} files found
              </span>
            </div>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <Grid3X3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Files Display */}
        {filteredAndSortedFiles.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.type, file.category);
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.6 }}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group"
                    >
                      <div className="p-6">
                        {/* File Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div
                            className={`w-12 h-12 bg-gradient-to-br ${getFileTypeColor(file.type, file.category)} rounded-lg flex items-center justify-center`}
                          >
                            <FileIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => handleStarToggle(file.id)}
                              className={`p-1 rounded transition-colors ${
                                file.isStarred
                                  ? "text-yellow-500"
                                  : "text-gray-300 hover:text-yellow-500"
                              }`}
                            >
                              <Star
                                className={`w-4 h-4 ${file.isStarred ? "fill-current" : ""}`}
                              />
                            </button>
                            <div className="flex items-center space-x-1">
                              {file.isApproved ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-yellow-500" />
                              )}
                              {file.viewedByClient && (
                                <Eye className="w-4 h-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* File Info */}
                        <h3
                          className="font-semibold text-gray-900 mb-2 truncate"
                          title={file.name}
                        >
                          {file.name}
                        </h3>

                        <p className="text-sm text-gray-600 mb-3 truncate">
                          {file.projectName}
                        </p>

                        {/* Tags */}
                        {file.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {file.tags.slice(0, 2).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {file.tags.length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{file.tags.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* File Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-4">
                          <div>
                            <span className="font-medium">Size:</span>{" "}
                            {formatFileSize(file.size)}
                          </div>
                          <div>
                            <span className="font-medium">Version:</span> v
                            {file.version}
                          </div>

                          <div>
                            <span className="font-medium">Comments:</span>{" "}
                            {file.comments}
                          </div>
                        </div>

                        {/* Activity Info */}
                        <div className="text-xs text-gray-500 mb-4 space-y-1">
                          {file.lastViewedBy && (
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span>Viewed by {file.lastViewedBy}</span>
                            </div>
                          )}
                          {file.lastModifiedBy && (
                            <div className="flex items-center space-x-1">
                              <Edit3 className="w-3 h-3" />
                              <span>Modified by {file.lastModifiedBy}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleFileView(file)}
                            className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View</span>
                          </button>
                          <button className="flex items-center justify-center p-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          File
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Project
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Size
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Status
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Activity
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAndSortedFiles.map((file) => {
                        const FileIcon = getFileIcon(file.type, file.category);
                        return (
                          <tr
                            key={file.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-10 h-10 bg-gradient-to-br ${getFileTypeColor(file.type, file.category)} rounded-lg flex items-center justify-center`}
                                >
                                  <FileIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <p className="font-medium text-gray-900 truncate">
                                      {file.name}
                                    </p>
                                    {file.isStarred && (
                                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <p className="text-sm text-gray-500">
                                      Version {file.version}
                                    </p>
                                    {file.tags.length > 0 && (
                                      <div className="flex space-x-1">
                                        {file.tags
                                          .slice(0, 2)
                                          .map((tag, index) => (
                                            <span
                                              key={index}
                                              className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                                            >
                                              {tag}
                                            </span>
                                          ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {file.projectName}
                                </p>
                                <p className="text-sm text-gray-500 capitalize">
                                  {file.category}
                                </p>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              <div>
                                <p>{formatFileSize(file.size)}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col space-y-1">
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
                                <div className="flex items-center space-x-2">
                                  {file.viewedByClient ? (
                                    <>
                                      <Eye className="w-4 h-4 text-blue-500" />
                                      <span className="text-xs text-blue-600">
                                        Client Viewed
                                      </span>
                                    </>
                                  ) : (
                                    <>
                                      <AlertCircle className="w-4 h-4 text-gray-400" />
                                      <span className="text-xs text-gray-500">
                                        Not Viewed
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs text-gray-500 space-y-1">
                                {file.lastViewedBy && file.lastViewedAt && (
                                  <div className="flex items-center space-x-1">
                                    <Eye className="w-3 h-3" />
                                    <span>
                                      Viewed{" "}
                                      {formatDistanceToNow(file.lastViewedAt, {
                                        addSuffix: true,
                                      })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleFileView(file)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="View file"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>

                                <button
                                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                  title="Share file"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                                <button
                                  className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                                  title="More options"
                                >
                                  <MoreVertical className="w-4 h-4" />
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
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No files found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ||
              categoryFilter !== "all" ||
              statusFilter !== "all" ||
              selectedProject !== "all"
                ? "Try adjusting your search or filter criteria."
                : user?.role === "client"
                  ? "Your project files will appear here once added by the team."
                  : "Your files will appear here once added."}
            </p>
          </motion.div>
        )}
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

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onFileUploaded={(fileData: FooterFileData) => {
          setFooterFile(fileData);
          setIsFooterVisible(true);
          setIsUploadModalOpen(false);
        }}
      />

      {/* File Display Footer */}
      <FileDisplayFooter
        file={footerFile}
        isVisible={isFooterVisible}
        onClose={() => {
          setIsFooterVisible(false);
          setFooterFile(null);
        }}
      />

      {/* Toast Notifications */}
      <SimpleToast
        messages={messages}
        onRemove={removeToast}
        position="top-right"
      />
    </div>
  );
};

export default Files;
