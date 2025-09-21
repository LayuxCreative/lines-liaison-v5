import React from "react";
import { motion } from "framer-motion";
import {
  FileText,
  Image,
  Film,
  Archive,
  File,
  Building2,
  Eye,
  User,
  Calendar,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import { format } from "date-fns";

interface FileDisplayData {
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

interface FileDisplayFooterProps {
  file: FileDisplayData | null;
  isVisible: boolean;
  onClose: () => void;
}

const FileDisplayFooter: React.FC<FileDisplayFooterProps> = ({
  file,
  isVisible,
  onClose,
}) => {
  if (!file || !isVisible) return null;

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

  const FileIcon = getFileIcon(file.type, file.category);

  return (
    <motion.div
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 100 }}
      transition={{ duration: 0.3 }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* File Info */}
          <div className="flex items-center space-x-4 flex-1">
            {/* File Icon */}
            <div
              className={`w-12 h-12 bg-gradient-to-br ${getFileTypeColor(file.type, file.category)} rounded-lg flex items-center justify-center flex-shrink-0`}
            >
              <FileIcon className="w-6 h-6 text-white" />
            </div>

            {/* File Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">
                  {file.name}
                </h3>
                <div className="flex items-center space-x-1">
                  {file.isApproved ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                  {file.viewCount > 0 && (
                    <Eye className="w-4 h-4 text-blue-500" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>Uploaded by {file.uploadedBy}</span>
                </div>

                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(file.uploadedAt, "MMM dd, yyyy HH:mm")}</span>
                </div>

                <div>
                  <span className="font-medium">Project:</span>{" "}
                  {file.projectName}
                </div>

                <div>
                  <span className="font-medium">Size:</span>{" "}
                  {formatFileSize(file.size)}
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-gray-500 mt-2">
                <div>
                  <span className="font-medium">Version:</span> v{file.version}
                </div>

                <div>
                  <span className="font-medium">Views:</span> {file.viewCount}
                </div>

                {file.lastViewedBy && file.lastViewedAt && (
                  <div>
                    <span className="font-medium">Last viewed by:</span>{" "}
                    {file.lastViewedBy} on{" "}
                    {format(file.lastViewedAt, "MMM dd, HH:mm")}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="ml-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default FileDisplayFooter;
