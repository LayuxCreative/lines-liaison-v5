import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  BarChart3,
  FolderOpen,
  Clock,
  CheckCircle,
  AlertCircle,
  Pause,
  ArrowRight,
} from "lucide-react";
import { Project } from "../../types";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const navigate = useNavigate();

  const handleProjectClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/dashboard/projects/${project.id}`);
  };

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:border-blue-200"
      onClick={handleProjectClick}
    >
      <div className="p-6 relative">
        {/* Priority Indicator */}
        <div
          className={`absolute top-4 right-4 w-3 h-3 rounded-full ${getPriorityColor(project.priority)}`}
        ></div>

        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatusColor(project.status)} shadow-lg`}
            >
              <StatusIcon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              <p className="text-sm text-blue-600 font-medium mt-1">
                {project.category}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-6 line-clamp-2 leading-relaxed">
          {project.description}
        </p>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-blue-600">
              <Users className="w-4 h-4" />
              <span className="text-sm font-bold">
                {project.teamMembers.length}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Team</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-green-600">
              <FolderOpen className="w-4 h-4" />
              <span className="text-sm font-bold">{project.files.length}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Files</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1 text-orange-600">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm font-bold">
                {project.budget
                  ? `$${(project.budget / 1000).toFixed(0)}k`
                  : "N/A"}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">Budget</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600 font-medium">
              {format(project.startDate, "MMM dd, yyyy")}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(project.status)} border`}
            >
              {project.status.replace("_", " ").toUpperCase()}
            </span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Hover Effect Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl pointer-events-none"></div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
