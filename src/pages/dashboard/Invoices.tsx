import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Receipt,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

const Invoices: React.FC = () => {
  const { user } = useAuth();
  const { getProjectsByUser } = useData();
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  if (!user) return null;

  const userProjects = getProjectsByUser(user.id, user.role);

  // TODO: Replace with actual invoices data from API
  const invoices = [
    {
      id: "1",
      projectId: "1",
      projectName: "Dubai Marina Tower BIM Implementation",
      invoiceNumber: "INV-2024-001",
      amount: 125000,
      currency: "AED",
      status: "paid",
      issueDate: new Date("2024-01-15T00:00:00"),
      dueDate: new Date("2024-02-15T00:00:00"),
      paidDate: new Date("2024-01-28T00:00:00"),
      description: "BIM Modeling Services - Phase 1 (Structural)",
      taxAmount: 6250,
      totalAmount: 131250,
      items: [
        {
          id: "1",
          description: "Structural BIM Modeling",
          quantity: 1,
          unitPrice: 85000,
          totalPrice: 85000,
        },
        {
          id: "2",
          description: "Clash Detection & Resolution",
          quantity: 1,
          unitPrice: 25000,
          totalPrice: 25000,
        },
        {
          id: "3",
          description: "Technical Documentation",
          quantity: 1,
          unitPrice: 15000,
          totalPrice: 15000,
        },
      ],
    },
    {
      id: "2",
      projectId: "1",
      projectName: "Dubai Marina Tower BIM Implementation",
      invoiceNumber: "INV-2024-002",
      amount: 95000,
      currency: "AED",
      status: "sent",
      issueDate: new Date("2024-01-30T00:00:00"),
      dueDate: new Date("2024-02-28T00:00:00"),
      description: "MEP Systems Integration - Phase 2",
      taxAmount: 4750,
      totalAmount: 99750,
      items: [
        {
          id: "1",
          description: "MEP BIM Modeling",
          quantity: 1,
          unitPrice: 65000,
          totalPrice: 65000,
        },
        {
          id: "2",
          description: "System Coordination",
          quantity: 1,
          unitPrice: 30000,
          totalPrice: 30000,
        },
      ],
    },
    {
      id: "3",
      projectId: "2",
      projectName: "Abu Dhabi Convention Center Analysis",
      invoiceNumber: "INV-2024-003",
      amount: 75000,
      currency: "AED",
      status: "overdue",
      issueDate: new Date("2024-01-10T00:00:00"),
      dueDate: new Date("2024-01-25T00:00:00"),
      description: "Feasibility Study & Risk Assessment",
      taxAmount: 3750,
      totalAmount: 78750,
      items: [
        {
          id: "1",
          description: "Feasibility Analysis",
          quantity: 1,
          unitPrice: 45000,
          totalPrice: 45000,
        },
        {
          id: "2",
          description: "Risk Assessment Report",
          quantity: 1,
          unitPrice: 30000,
          totalPrice: 30000,
        },
      ],
    },
    {
      id: "4",
      projectId: "1",
      projectName: "Dubai Marina Tower BIM Implementation",
      invoiceNumber: "INV-2024-004",
      amount: 180000,
      currency: "AED",
      status: "draft",
      issueDate: new Date("2024-02-01T00:00:00"),
      dueDate: new Date("2024-03-01T00:00:00"),
      description: "Final Phase - Integration & Documentation",
      taxAmount: 9000,
      totalAmount: 189000,
      items: [
        {
          id: "1",
          description: "Final BIM Integration",
          quantity: 1,
          unitPrice: 120000,
          totalPrice: 120000,
        },
        {
          id: "2",
          description: "Project Documentation",
          quantity: 1,
          unitPrice: 35000,
          totalPrice: 35000,
        },
        {
          id: "3",
          description: "Training & Handover",
          quantity: 1,
          unitPrice: 25000,
          totalPrice: 25000,
        },
      ],
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return CheckCircle;
      case "sent":
        return Clock;
      case "overdue":
        return AlertTriangle;
      case "draft":
        return Receipt;
      default:
        return Receipt;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "sent":
        return "bg-blue-100 text-blue-800";
      case "overdue":
        return "bg-red-100 text-red-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
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

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesProject =
      selectedProject === "all" || invoice.projectId === selectedProject;
    const matchesStatus =
      statusFilter === "all" || invoice.status === statusFilter;
    const matchesSearch =
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProject && matchesStatus && matchesSearch;
  });

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "draft", label: "Draft" },
    { value: "sent", label: "Sent" },
    { value: "paid", label: "Paid" },
    { value: "overdue", label: "Overdue" },
  ];

  const totalAmount = filteredInvoices.reduce(
    (sum, invoice) => sum + invoice.totalAmount,
    0,
  );
  const paidAmount = filteredInvoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const pendingAmount = totalAmount - paidAmount;

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
          <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-2">
            View and manage your project invoices and payments
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
                <p className="text-gray-600 text-sm font-medium">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {formatCurrency(totalAmount, "AED")}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Receipt className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {formatCurrency(paidAmount, "AED")}
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
                <p className="text-gray-600 text-sm font-medium">
                  Pending Amount
                </p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {formatCurrency(pendingAmount, "AED")}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search invoices..."
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
          </div>
        </motion.div>

        {/* Invoices List */}
        {filteredInvoices.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="bg-white rounded-xl shadow-lg overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                      Invoice
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                      Project
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                      Amount
                    </th>
                    <th className="text-left px-6 py-4 text-sm font-medium text-gray-900">
                      Status
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
                  {filteredInvoices.map((invoice) => {
                    const StatusIcon = getStatusIcon(invoice.status);
                    return (
                      <tr
                        key={invoice.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                              <Receipt className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {invoice.invoiceNumber}
                              </p>
                              <p className="text-sm text-gray-500">
                                {invoice.issueDate.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {invoice.projectName}
                            </p>
                            <p className="text-sm text-gray-500 line-clamp-1">
                              {invoice.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(
                                invoice.totalAmount,
                                invoice.currency,
                              )}
                            </p>
                            <p className="text-sm text-gray-500">
                              +
                              {formatCurrency(
                                invoice.taxAmount,
                                invoice.currency,
                              )}{" "}
                              tax
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="w-4 h-4" />
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}
                            >
                              {invoice.status.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">
                            {invoice.dueDate.toLocaleDateString()}
                          </p>
                          {invoice.paidDate && (
                            <p className="text-xs text-green-600">
                              Paid: {invoice.paidDate.toLocaleDateString()}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
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
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="text-center py-12"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Receipt className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No invoices found
            </h3>
            <p className="text-gray-600">
              {searchTerm || selectedProject !== "all" || statusFilter !== "all"
                ? "Try adjusting your search or filter criteria."
                : "Invoices will appear here once they are generated for your projects."}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Invoices;
