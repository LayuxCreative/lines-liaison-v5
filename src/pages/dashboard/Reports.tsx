import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  Search,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const Reports: React.FC = () => {
  const { user } = useAuth();
  const { getProjectsByUser } = useData();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (!user) return null;

  const userProjects = getProjectsByUser(user.id, user.role);

  // Reports will be loaded from Supabase via DataContext
  const reports: Array<{
    id: string;
    title: string;
    type: string;
    status: string;
    projectId: string;
    projectName: string;
    description: string;
    generatedBy: string;
    generatedAt: Date;
    fileSize: string;
    pages: number;
  }> = [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "published":
        return CheckCircle;
      case "review":
        return Clock;
      case "draft":
        return AlertCircle;
      default:
        return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800";
      case "review":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "progress":
        return TrendingUp;
      case "financial":
        return BarChart3;
      case "technical":
        return FileText;
      case "milestone":
        return CheckCircle;
      case "final":
        return FileText;
      default:
        return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "progress":
        return "from-blue-500 to-blue-600";
      case "financial":
        return "from-green-500 to-green-600";
      case "technical":
        return "from-purple-500 to-purple-600";
      case "milestone":
        return "from-orange-500 to-orange-600";
      case "final":
        return "from-red-500 to-red-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesProject =
      selectedProject === "all" || report.projectId === selectedProject;
    const matchesType = reportType === "all" || report.type === reportType;
    const matchesSearch =
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesType && matchesSearch;
  });

  const reportTypes = [
    { value: "all", label: "All Types" },
    { value: "progress", label: "Progress Reports" },
    { value: "financial", label: "Financial Reports" },
    { value: "technical", label: "Technical Reports" },
    { value: "milestone", label: "Milestone Reports" },
    { value: "final", label: "Final Reports" },
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
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-2">
            Access and download project reports and documentation
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search reports..."
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

            {/* Type Filter */}
            <div>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {reportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Reports Grid */}
        {filteredReports.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredReports.map((report, index) => {
              const StatusIcon = getStatusIcon(report.status);
              const TypeIcon = getTypeIcon(report.type);

              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.6 }}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(report.type)} rounded-lg flex items-center justify-center`}
                        >
                          <TypeIcon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {report.title}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {report.projectName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}
                      >
                        {report.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {report.description}
                    </p>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Generated By</p>
                        <p className="font-medium text-gray-900">
                          {report.generatedBy}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Date</p>
                        <p className="font-medium text-gray-900">
                          {report.generatedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">File Size</p>
                        <p className="font-medium text-gray-900">
                          {report.fileSize}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Pages</p>
                        <p className="font-medium text-gray-900">
                          {report.pages}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-3">
                      <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors">
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
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
              No reports found
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedProject !== "all" || reportType !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Reports will appear here once they are generated for your projects."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Reports;
