import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  Play,
  MoreVertical,
  Tag,
  Paperclip,
  MessageSquare,
  ExternalLink,
  Target,
  TrendingUp,
  Users,
  FolderOpen,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";
import { Task } from "../../types";
import { format, formatDistanceToNow } from "date-fns";

// Utility function to check if a task is overdue
const isOverdue = (dueDate: Date): boolean => {
  return new Date() > dueDate;
};

const Tasks: React.FC = () => {
  const { user } = useAuth();
  const { getProjectsByUser, getTasksByUser, tasks } = useData();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [sortBy, setSortBy] = useState("dueDate");

  const userProjects = user ? getProjectsByUser(user.id, user.role) : [];

  if (!user) return null;

  const getStatusIcon = (status: string) => {
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

  const getStatusColor = (status: string) => {
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

  const getPriorityColor = (priority: string) => {
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

  const filteredTasks = useMemo(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.tags.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase()),
          ),
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((task) => task.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((task) => task.priority === priorityFilter);
    }

    // Apply assignee filter
    if (assigneeFilter !== "all") {
      filtered = filtered.filter((task) => task.assigneeId === assigneeFilter);
    }

    // Apply project filter
    if (projectFilter !== "all") {
      filtered = filtered.filter((task) => task.projectId === projectFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "dueDate":
          return a.dueDate.getTime() - b.dueDate.getTime();
        case "priority": {
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        case "status":
          return a.status.localeCompare(b.status);
        case "title":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    tasks,
    searchTerm,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    projectFilter,
    sortBy,
  ]);

  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const overdue = tasks.filter(
      (t) => t.status !== "completed" && isOverdue(t.dueDate),
    ).length;

    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "todo", label: "To Do" },
    { value: "in_progress", label: "In Progress" },
    { value: "review", label: "In Review" },
    { value: "completed", label: "Completed" },
    { value: "blocked", label: "Blocked" },
  ];

  const priorityOptions = [
    { value: "all", label: "All Priorities" },
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];

  const sortOptions = [
    { value: "dueDate", label: "Due Date" },
    { value: "priority", label: "Priority" },
    { value: "status", label: "Status" },
    { value: "title", label: "Title" },
  ];

  const uniqueAssignees = Array.from(
    new Set(tasks.map((t) => ({ id: t.assigneeId, name: t.assigneeName }))),
  ).filter(
    (assignee, index, self) =>
      self.findIndex((a) => a.id === assignee.id) === index,
  );

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
              <h1 className="text-3xl font-bold text-gray-900">Tasks</h1>
              <p className="text-gray-600 mt-2">
                Manage and track all project tasks with ClickUp integration
              </p>
            </div>
            {(user.role === "admin" || user.role === "project_manager") && (
              <button
                onClick={() =>
                  alert("Create Task functionality will be implemented")
                }
                className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                New Task
              </button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    Total Tasks
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {taskStats.total}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">
                    In Progress
                  </p>
                  <p className="text-2xl font-bold text-blue-600 mt-1">
                    {taskStats.inProgress}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold text-green-600 mt-1">
                    {taskStats.completed}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Overdue</p>
                  <p className="text-2xl font-bold text-red-600 mt-1">
                    {taskStats.overdue}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
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
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              </div>
            </div>

            {/* Project Filter */}
            <div>
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
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

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {priorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={assigneeFilter}
                onChange={(e) => setAssigneeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                <option value="all">All Assignees</option>
                {uniqueAssignees.map((assignee) => (
                  <option key={assignee.id} value={assignee.id}>
                    {assignee.name}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-600">
                {filteredTasks.length} tasks found
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

        {/* Tasks Display */}
        {filteredTasks.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map((task, index) => {
                  const StatusIcon = getStatusIcon(task.status);
                  const isTaskOverdue =
                    task.status !== "completed" && isOverdue(task.dueDate);
                  const project = userProjects.find(
                    (p) => p.id === task.projectId,
                  );

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.6 }}
                      className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 border-blue-500"
                    >
                      <div className="p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-3">
                            <div
                              className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} mt-2`}
                            ></div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                                {task.title}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {project?.name}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                            >
                              {task.status.replace("_", " ").toUpperCase()}
                            </span>
                            <button className="p-1 text-gray-400 hover:text-gray-600">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {task.description}
                        </p>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {task.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span
                                key={tagIndex}
                                className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{task.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Assignee and Due Date */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {task.assigneeName}
                            </span>
                          </div>
                          <div
                            className={`flex items-center space-x-1 ${isTaskOverdue ? "text-red-600" : "text-gray-600"}`}
                          >
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">
                              {format(task.dueDate, "MMM dd")}
                            </span>
                          </div>
                        </div>

                        {/* Progress and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
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
                          <div className="text-xs text-gray-500">
                            {task.estimatedHours}h est.
                          </div>
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
                          Task
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Project
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Assignee
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Status
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Priority
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Due Date
                        </th>
                        <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredTasks.map((task) => {
                        const StatusIcon = getStatusIcon(task.status);
                        const isTaskOverdue =
                          task.status !== "completed" &&
                          isOverdue(task.dueDate);
                        const project = userProjects.find(
                          (p) => p.id === task.projectId,
                        );

                        return (
                          <tr
                            key={task.id}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-start space-x-3">
                                <div
                                  className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} mt-2 flex-shrink-0`}
                                ></div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-gray-900 truncate">
                                    {task.title}
                                  </h3>
                                  <p className="text-sm text-gray-500 truncate">
                                    {task.description}
                                  </p>
                                  {task.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {task.tags
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
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {project?.name}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {task.assigneeName}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <StatusIcon className="w-4 h-4" />
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}
                                >
                                  {task.status.replace("_", " ").toUpperCase()}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`}
                                ></div>
                                <span className="text-sm text-gray-900 capitalize">
                                  {task.priority}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className={`text-sm ${isTaskOverdue ? "text-red-600 font-medium" : "text-gray-900"}`}
                              >
                                {format(task.dueDate, "MMM dd, yyyy")}
                                {isTaskOverdue && (
                                  <span className="block text-xs text-red-500">
                                    {formatDistanceToNow(task.dueDate)} overdue
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
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
                                    className="p-1 text-blue-600 hover:text-blue-700"
                                    title="Open in ClickUp"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </a>
                                )}
                                <button className="p-1 text-gray-400 hover:text-gray-600">
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
              <Target className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No tasks found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm ||
              statusFilter !== "all" ||
              priorityFilter !== "all" ||
              assigneeFilter !== "all" ||
              projectFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Create your first task to get started with project management."}
            </p>
            {(user.role === "admin" || user.role === "project_manager") && (
              <button
                onClick={() =>
                  alert("Create Task functionality will be implemented")
                }
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-teal-700 transition-all duration-300"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create New Task
              </button>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
