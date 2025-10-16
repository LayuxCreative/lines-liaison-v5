import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Download,
  FileText,
  Image,
  Film,
  Archive,
  File,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move3D,
  Settings,
  Layers,
} from "lucide-react";
import { ProjectFile } from "../../types";

interface FileViewerProps {
  file: ProjectFile | null;
  isOpen: boolean;
  onClose: () => void;
}

const FileViewer: React.FC<FileViewerProps> = ({ file, isOpen, onClose }) => {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  if (!file) return null;

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.startsWith("video/")) return Film;
    if (type.includes("pdf")) return FileText;
    if (type.includes("dwg")) return Layers;
    if (type.includes("rvt")) return Move3D;
    if (type.includes("zip") || type.includes("rar")) return Archive;
    return File;
  };

  const getFileTypeColor = (type: string) => {
    if (type.startsWith("image/")) return "from-green-500 to-green-600";
    if (type.startsWith("video/")) return "from-purple-500 to-purple-600";
    if (type.includes("pdf")) return "from-red-500 to-red-600";
    if (type.includes("dwg")) return "from-green-500 to-green-600";
    if (type.includes("rvt")) return "from-orange-500 to-orange-600";
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

  const FileIcon = getFileIcon(file.type);

  const renderFilePreview = () => {
    if (file.type.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg overflow-hidden">
          {file.url ? (
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transition: "transform 0.3s ease",
              }}
            />
          ) : (
            <div className="text-center text-gray-500">
              <Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No preview available</p>
            </div>
          )}
        </div>
      );
    }

    if (
      file.category === "model" ||
      file.name.includes(".rvt") ||
      file.name.includes(".dwg")
    ) {
      return (
        <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-50 to-teal-50 rounded-lg">
          <div className="text-center">
            <div
              className={`w-32 h-32 bg-gradient-to-br ${getFileTypeColor(file.type)} rounded-2xl flex items-center justify-center mx-auto mb-6`}
            >
              {file.name.includes(".rvt") ? (
                <Move3D className="w-16 h-16 text-white" />
              ) : file.name.includes(".dwg") ? (
                <Layers className="w-16 h-16 text-white" />
              ) : (
                <FileText className="w-16 h-16 text-white" />
              )}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {file.name.includes(".rvt")
                ? "Revit Model Viewer"
                : file.name.includes(".dwg")
                  ? "AutoCAD Drawing Viewer"
                  : "Engineering File Viewer"}
            </h3>
            <p className="text-gray-600 mb-4">
              {file.name.includes(".rvt")
                ? "Interactive BIM model preview"
                : file.name.includes(".dwg")
                  ? "Technical drawing preview"
                  : "Engineering file preview"}
            </p>
            <div className="bg-white rounded-lg p-4 shadow-lg max-w-sm mx-auto">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Format</p>
                  <p className="font-medium">
                    {file.name.split(".").pop()?.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Version</p>
                  <p className="font-medium">v{file.version}</p>
                </div>
                <div>
                  <p className="text-gray-500">Size</p>
                  <p className="font-medium">{formatFileSize(file.size)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <p
                    className={`font-medium ${file.isApproved ? "text-green-600" : "text-yellow-600"}`}
                  >
                    {file.isApproved ? "Approved" : "Pending"}
                  </p>
                </div>
              </div>

              {/* File-specific tools */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">Available Tools:</p>
                <div className="flex justify-center space-x-2">
                  {file.name.includes(".rvt") && (
                    <>
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Move3D className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Layers className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {file.name.includes(".dwg") && (
                    <>
                      <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                        <Layers className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                        <Settings className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <div className="text-center">
          <div
            className={`w-24 h-24 bg-gradient-to-br ${getFileTypeColor(file.type)} rounded-2xl flex items-center justify-center mx-auto mb-4`}
          >
            <FileIcon className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {file.name}
          </h3>
          <p className="text-gray-600">File preview not available</p>
          <p className="text-sm text-gray-500 mt-2">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${getFileTypeColor(file.type)} rounded-lg flex items-center justify-center`}
                >
                  <FileIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {file.name}
                  </h2>
                  <p className="text-sm text-gray-600">
                    {formatFileSize(file.size)} • Version {file.version} •
                    {file.isApproved ? " Approved" : " Pending Approval"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {file.type.startsWith("image/") && (
                  <>
                    <button
                      onClick={() => setZoom(Math.max(25, zoom - 25))}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ZoomOut className="w-5 h-5" />
                    </button>
                    <span className="text-sm text-gray-600 min-w-[60px] text-center">
                      {zoom}%
                    </span>
                    <button
                      onClick={() => setZoom(Math.min(300, zoom + 25))}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ZoomIn className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setRotation((rotation + 90) % 360)}
                      className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-5 h-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    // TODO: Implement file download
                    alert(`Downloading ${file.name}...`);
                  }}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Download className="w-5 h-5" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">{renderFilePreview()}</div>

            {/* Footer */}
            <div className="border-t border-gray-200 p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Category</p>
                  <p className="font-medium capitalize">{file.category}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Uploaded By</p>
                  <p className="font-medium">{file.uploadedBy}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Upload Date</p>
                  <p className="font-medium">
                    {file.uploadedAt.toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">File Type</p>
                  <p className="font-medium">{file.type}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FileViewer;
