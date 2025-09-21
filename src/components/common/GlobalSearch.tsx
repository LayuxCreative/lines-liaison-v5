import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Search,
  X,
  FolderOpen,
  FileText,
  Users,
  MessageSquare,
  Clock,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useData } from "../../contexts/DataContext";

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: "project" | "file" | "message" | "user";
  url: string;
  metadata?: {
    status?: string;
    category?: string;
    date?: Date;
    size?: string;
  };
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { getProjectsByUser } = useData();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedResult, setSelectedResult] = useState(0);

  const userProjects = getProjectsByUser(user?.id || "", user?.role || "");

  // Search data from Supabase
  const searchData = useMemo(() => {
    const results: SearchResult[] = [];

    // Add projects from Supabase
    userProjects.forEach((project) => {
      results.push({
        id: project.id,
        title: project.name,
        description: project.description,
        type: "project",
        url: `/dashboard/projects/${project.id}`,
        metadata: {
          status: project.status,
          category: project.category,
          date: project.startDate,
        },
      });
    });

    // Add files from Supabase
    userProjects.forEach((project) => {
      project.files.forEach((file) => {
        results.push({
          id: file.id,
          title: file.name,
          description: `File in ${project.name}`,
          type: "file",
          url: `/dashboard/files`,
          metadata: {
            category: file.category,
            size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
            date: file.uploadedAt,
          },
        });
      });
    });

    return results;
  }, [userProjects]);

  // Filter results based on search term and type
  const filteredResults = useMemo(() => {
    let filtered = searchData;

    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (result) =>
          result.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (selectedType !== "all") {
      filtered = filtered.filter((result) => result.type === selectedType);
    }

    return filtered.slice(0, 10); // Limit to 10 results
  }, [searchData, searchTerm, selectedType]);

  const handleResultClick = useCallback((result: SearchResult) => {
    navigate(result.url);
    onClose();
    setSearchTerm("");
  }, [navigate, onClose, setSearchTerm]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedResult((prev) =>
            Math.min(prev + 1, filteredResults.length - 1),
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedResult((prev) => Math.max(prev - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (filteredResults[selectedResult]) {
            handleResultClick(filteredResults[selectedResult]);
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredResults, selectedResult, onClose, handleResultClick]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedResult(0);
  }, [filteredResults]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case "project":
        return FolderOpen;
      case "file":
        return FileText;
      case "message":
        return MessageSquare;
      case "user":
        return Users;
      default:
        return Search;
    }
  };

  const getResultColor = (type: string) => {
    switch (type) {
      case "project":
        return "from-blue-500 to-blue-600";
      case "file":
        return "from-green-500 to-green-600";
      case "message":
        return "from-purple-500 to-purple-600";
      case "user":
        return "from-orange-500 to-orange-600";
      default:
        return "from-gray-500 to-gray-600";
    }
  };

  const typeOptions = [
    { value: "all", label: "All" },
    { value: "project", label: "Projects" },
    { value: "file", label: "Files" },
    { value: "message", label: "Messages" },
    ...(user?.role === "admin" || user?.role === "project_manager"
      ? [{ value: "user", label: "Team" }]
      : []),
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-Screen Backdrop with Cross-Browser Support */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/20"
            style={{
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)", // Safari support
            }}
            onClick={onClose}
          />

          {/* Search Modal - Positioned above backdrop */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 z-[60] overflow-hidden"
            style={{
              maxWidth: "32rem",
              margin: "0 1rem",
            }}
          >
            {/* Search Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search projects, files, messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 text-lg bg-transparent border-none outline-none placeholder-gray-500"
                  autoFocus
                />
                <button
                  onClick={onClose}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Type Filter */}
              <div className="flex items-center space-x-2 mt-3">
                <Filter className="w-4 h-4 text-gray-400" />
                <div className="flex space-x-1">
                  {typeOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedType(option.value)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        selectedType === option.value
                          ? "bg-blue-100 text-blue-700"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {filteredResults.length > 0 ? (
                <div className="py-2">
                  {filteredResults.map((result, index) => {
                    const IconComponent = getResultIcon(result.type);
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                          index === selectedResult
                            ? "bg-blue-50 border-r-2 border-blue-500"
                            : ""
                        }`}
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 bg-gradient-to-br ${getResultColor(result.type)} rounded-lg flex items-center justify-center`}
                          >
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-medium text-gray-900 truncate">
                              {result.title}
                            </h3>
                            <p className="text-sm text-gray-600 truncate">
                              {result.description}
                            </p>
                            {result.metadata && (
                              <div className="flex items-center space-x-2 mt-1">
                                {result.metadata.status && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                                    {result.metadata.status}
                                  </span>
                                )}
                                {result.metadata.category && (
                                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                    {result.metadata.category}
                                  </span>
                                )}
                                {result.metadata.size && (
                                  <span className="text-xs text-gray-500">
                                    {result.metadata.size}
                                  </span>
                                )}
                                {result.metadata.date && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {result.metadata.date.toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? "No results found" : "Start typing to search"}
                  </h3>
                  <p className="text-gray-600">
                    {searchTerm
                      ? "Try adjusting your search terms or filters"
                      : "Search across projects, files, messages, and team members"}
                  </p>
                </div>
              )}
            </div>

            {/* Search Footer */}
            {filteredResults.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>
                    {filteredResults.length} result
                    {filteredResults.length !== 1 ? "s" : ""} found
                  </span>
                  <div className="flex items-center space-x-2">
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                      ↑↓
                    </kbd>
                    <span>to navigate</span>
                    <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs">
                      Enter
                    </kbd>
                    <span>to select</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GlobalSearch;
