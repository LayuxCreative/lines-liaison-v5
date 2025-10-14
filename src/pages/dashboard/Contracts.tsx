import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Download,
  Eye,
  DollarSign,
  CheckCircle,
  FileCheck,
  Search,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const Contracts: React.FC = () => {
  const { user } = useAuth();
  const { getProjectsByUser } = useData();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (!user) return null;

  const userProjects = getProjectsByUser(user.id, user.role);

  // Contracts data will be loaded from Supabase
  const contracts: Array<{
    id: string;
    projectId: string;
    projectName: string;
    title: string;
    contractNumber: string;
    status: 'draft' | 'active' | 'completed' | 'terminated';
    type: string;
    value: number;
    currency: string;
    startDate: Date;
    endDate: Date;
    terms: string[];
  }> = [];

  // Remove unused getStatusIcon function
  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case "active":
  //       return CheckCircle;
  //     case "completed":
  //       return FileCheck;
  //     case "draft":
  //       return Clock;
  //     case "terminated":
  //       return AlertTriangle;
  //     default:
  //       return FileText;
  //   }
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "terminated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "service_agreement":
        return "from-blue-500 to-blue-600";
      case "consulting":
        return "from-purple-500 to-purple-600";
      case "maintenance":
        return "from-green-500 to-green-600";
      case "training":
        return "from-orange-500 to-orange-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesProject =
      selectedProject === "all" || contract.projectId === selectedProject;
    const matchesStatus =
      statusFilter === "all" || contract.status === statusFilter;
    const matchesType = typeFilter === "all" || contract.type === typeFilter;
    const matchesSearch =
      contract.contractNumber
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contract.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesStatus && matchesType && matchesSearch;
  });

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
    { value: "terminated", label: "Terminated" },
  ];

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "service_agreement", label: "Service Agreement" },
    { value: "consulting", label: "Consulting" },
    { value: "maintenance", label: "Maintenance" },
    { value: "training", label: "Training" },
  ];

  const totalValue = filteredContracts.reduce(
    (sum, contract) => sum + contract.value,
    0,
  );
  const activeContracts = filteredContracts.filter(
    (c) => c.status === "active",
  ).length;
  const completedContracts = filteredContracts.filter(
    (c) => c.status === "completed",
  ).length;

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
          <h1 className="text-3xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600 mt-2">
            View and manage your project contracts and agreements
          </p>
        </motion.div>

        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalValue, "AED")}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">
                  Active Contracts
                </p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {activeContracts}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Completed</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {completedContracts}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FileCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="bg-white rounded-xl shadow-lg p-6 mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search contracts..."
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

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Contracts Grid */}
        {filteredContracts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredContracts.map((contract, index) => {
              return (
                <motion.div
                  key={contract.id}
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
                          className={`w-12 h-12 bg-gradient-to-br ${getTypeColor(contract.type)} rounded-lg flex items-center justify-center`}
                        >
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {contract.contractNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {contract.projectName}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(contract.status)}`}
                      >
                        {contract.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="font-medium text-gray-900 mb-3 line-clamp-2">
                      {contract.title}
                    </h4>

                    {/* Contract Details */}
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Contract Value</p>
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(contract.value, contract.currency)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Type</p>
                        <p className="font-medium text-gray-900 capitalize">
                          {contract.type.replace("_", " ")}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Start Date</p>
                        <p className="font-medium text-gray-900">
                          {contract.startDate.toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">End Date</p>
                        <p className="font-medium text-gray-900">
                          {contract.endDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Terms Preview */}
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Key Terms:
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {contract.terms.slice(0, 3).map((term: string, index: number) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="line-clamp-1">{term}</span>
                          </li>
                        ))}
                        {contract.terms.length > 3 && (
                          <li className="text-blue-600 text-xs">
                            +{contract.terms.length - 3} more terms...
                          </li>
                        )}
                      </ul>
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
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No contracts found
            </h3>
            <p className="text-gray-600">
              {searchTerm ||
              selectedProject !== "all" ||
              statusFilter !== "all" ||
              typeFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Contracts will appear here once they are created for your projects."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Contracts;

// Remove unused StatusIcon variable
// const StatusIcon = status === 'active' ? CheckCircle : 
//                   status === 'pending' ? Clock : 
//                   status === 'completed' ? CheckCircle : AlertCircle;
