import React from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getProjectsByUser } = useData();

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
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <p className="text-gray-600 mb-8">
              The project you're looking for doesn't exist or you don't have permission to view it.
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

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{project.name || 'Unnamed Project'}</h1>
              <p className="text-gray-600 mt-1">Project Code: {project.projectCode || 'N/A'}</p>
            </div>
            <Link
              to="/dashboard/projects"
              className="inline-flex items-center px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Projects
            </Link>
          </div>

          {/* Project Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Status</h3>
              <p className={`text-lg font-semibold mt-2 ${
                project.status === 'active' ? 'text-green-600' :
                project.status === 'completed' ? 'text-blue-600' :
                project.status === 'on_hold' ? 'text-yellow-600' :
                'text-gray-600'
              }`}>
                {project.status ? project.status.replace('_', ' ').toUpperCase() : 'UNKNOWN'}
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Priority</h3>
              <p className={`text-lg font-semibold mt-2 ${
                project.priority === 'critical' ? 'text-red-600' :
                project.priority === 'high' ? 'text-orange-600' :
                project.priority === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {project.priority ? project.priority.toUpperCase() : 'NORMAL'}
              </p>
            </div>

            <div className="bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Progress</h3>
              <div className="mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">{project.progress || 0}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${project.progress || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Category</h3>
              <p className="text-lg font-semibold text-gray-900 mt-2">{project.category || 'Uncategorized'}</p>
            </div>
          </div>

          {/* Project Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Information */}
            <div className="bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Information</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{project.description || 'No description available'}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Date</label>
                    <p className="text-gray-900 mt-1">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Date</label>
                    <p className="text-gray-900 mt-1">
                      {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>

                {project.budget && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Budget</label>
                      <p className="text-gray-900 mt-1">${project.budget.toLocaleString()}</p>
                    </div>
                    {project.spent && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Spent</label>
                        <p className="text-gray-900 mt-1">${project.spent.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Team Information */}
            <div className="bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Team</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Project Manager</label>
                  <p className="text-gray-900 mt-1">{project.managerId || 'Not assigned'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <p className="text-gray-900 mt-1">{project.clientId || 'Not assigned'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Team Members</label>
                  <div className="mt-2">
                    {project.teamMembers && project.teamMembers.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {project.teamMembers.map((memberId, index) => (
                          <span 
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                          >
                            {memberId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No team members assigned</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Files */}
          <div className="bg-white/70 backdrop-blur rounded-xl border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Files</h2>
            {project.files && Array.isArray(project.files) && project.files.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {project.files.slice(0, 6).map((file) => (
                  <div key={file.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {file.type?.split('/')[1]?.toUpperCase().slice(0, 3) || 'FILE'}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name || 'Unnamed file'}</p>
                        <p className="text-sm text-gray-500">{file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.00'} MB</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No files uploaded yet</p>
            )}
            
            {project.files && Array.isArray(project.files) && project.files.length > 6 && (
              <div className="mt-4 text-center">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  View all {project.files.length} files
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectDetails;
