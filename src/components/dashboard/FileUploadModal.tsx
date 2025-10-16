import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useData } from "../../hooks/useData";
import { useNotifications } from "../../hooks/useNotifications";
import { activityLogger } from "../../utils/activityLogger";
import { fileStorageService } from "../../services/storageService";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileUploaded?: (fileData: FileFooterData) => void;
}

// Minimal summary type for footer display (matches Files.tsx FooterFileData)
interface FileFooterData {
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

interface UploadFile {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  id: string;
}

export const FileUploadModal: React.FC<FileUploadModalProps> = ({
  isOpen,
  onClose,
  onFileUploaded,
}) => {
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { projects, addProjectFile } = useData();
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      handleFiles(files);
    },
    [handleFiles],
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      if (!selectedProject) {
        addNotification({
          type: "file_upload",
          category: "system",
          title: "Project Required",
          message: "Please select a project before uploading files",
          priority: "medium",
          status: "unread",
          actionRequired: false,
          userId: user?.id ?? "",
          metadata: { customData: { reason: "missing_project", hasSelectedProject: !!selectedProject } },
        });
        return;
      }

      const newUploadFiles: UploadFile[] = files.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const,
        id: Math.random().toString(36).substr(2, 9),
      }));

      setUploadFiles((prev) => [...prev, ...newUploadFiles]);

      // Upload files to Supabase Storage
      newUploadFiles.forEach((uploadFile) => {
        realUpload(uploadFile);
      });
    },
    [selectedProject, addNotification, realUpload, user?.id],
  );

  const realUpload = useCallback(
    async (uploadFile: UploadFile) => {
      const { file, id } = uploadFile;

      try {
        await activityLogger.log("file_upload", "info", "Starting file upload", {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          projectId: selectedProject,
          userId: user?.id
        });

        // Update progress to show upload starting
        setUploadFiles((prev) =>
          prev.map((uf) => (uf.id === id ? { ...uf, progress: 10 } : uf)),
        );

        // Upload to Supabase Storage
        const uploadResult = await fileStorageService.uploadFile(
          file,
          'files',
          `projects/${selectedProject}`
        );

        // Update progress to show upload completing
        setUploadFiles((prev) =>
          prev.map((uf) => (uf.id === id ? { ...uf, progress: 90 } : uf)),
        );

        // Add file to project using DataContext signature and await for consistency
        const convertedFile = await addProjectFile(selectedProject, file);

        // Mark as completed
        setUploadFiles((prev) =>
          prev.map((uf) =>
            uf.id === id ? { ...uf, status: "completed" as const, progress: 100 } : uf,
          ),
        );

        await activityLogger.log("file_upload", "success", "File uploaded successfully", {
          fileName: file.name,
          fileSize: file.size,
          projectId: selectedProject,
          userId: user?.id,
          storageUrl: uploadResult.url
        });

        const uploadedFileData: FileFooterData = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedBy: user?.name || "Unknown",
          uploadedAt: new Date(),
          projectName:
            projects.find((p) => p.id === selectedProject)?.name ||
            "Unknown Project",
          category: getFileCategory(file.type),
          viewCount: 0,
          isApproved: false,
          version: 1,
          lastViewedBy: undefined,
          lastViewedAt: undefined,
        };

        // Show success notification (EnhancedNotification)
        addNotification({
          type: "file_upload",
          category: "work",
          title: "File Uploaded Successfully",
          message: `${file.name} uploaded to Supabase Storage`,
          priority: "medium",
          status: "unread",
          actionRequired: false,
          userId: user?.id ?? "",
          metadata: { projectId: selectedProject, relatedEntityType: 'file', relatedEntityId: (convertedFile?.id ?? uploadedFileData.id), customData: { storageUrl: uploadResult.url, fileName: file.name } },
        });

        // Call the callback to show file in footer
        if (onFileUploaded) {
          onFileUploaded({ ...uploadedFileData, id: convertedFile?.id ?? uploadedFileData.id });
        }
      } catch (error) {
        console.error("Upload failed:", error);

        await activityLogger.log("file_upload", "error", "File upload failed", {
          fileName: file.name,
          fileSize: file.size,
          projectId: selectedProject,
          userId: user?.id,
          error: error instanceof Error ? error.message : "Unknown error"
        });

        setUploadFiles((prev) =>
          prev.map((uf) =>
            uf.id === id
              ? {
                  ...uf,
                  status: "error" as const,
                  error: "Upload failed",
                }
              : uf,
          ),
        );

        addNotification({
          type: "file_upload",
          category: "system",
          title: "Upload Failed",
          message: `Failed to upload ${file.name}`,
          priority: "high",
          status: "unread",
          actionRequired: false,
          userId: user?.id ?? "",
          metadata: { projectId: selectedProject, relatedEntityType: 'file', relatedEntityId: id, customData: { error: (error instanceof Error ? error.message : "Unknown error"), fileName: file.name } },
        });
      }
    },
    [selectedProject, user, addProjectFile, addNotification, projects, onFileUploaded],
  );

  const getFileCategory = (
    mimeType: string,
  ): "image" | "document" | "dwg" | "rvt" | "other" | "drawing" | "model" => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.includes("pdf")) return "document";
    if (mimeType.includes("dwg")) return "dwg";
    if (mimeType.includes("rvt")) return "rvt";
    return "other";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleClose = () => {
    setUploadFiles([]);
    setSelectedProject("");
    onClose();
  };

  const allCompleted =
    uploadFiles.length > 0 &&
    uploadFiles.every((f) => f.status === "completed");

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Upload Files</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Project Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Project *
              </label>
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Choose a project...</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                isDragOver
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-gray-600 hover:border-gray-500"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">
                Drag and drop files here
              </h3>
              <p className="text-gray-400 mb-4">or click to select files</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                disabled={!selectedProject}
              >
                Choose Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Upload Progress */}
            {uploadFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-white mb-4">
                  Upload Progress
                </h3>
                <div className="space-y-3">
                  {uploadFiles.map((uploadFile) => (
                    <div
                      key={uploadFile.id}
                      className="bg-gray-800 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <File className="w-5 h-5 text-gray-400" />
                          <span className="text-white font-medium">
                            {uploadFile.file.name}
                          </span>
                          <span className="text-gray-400 text-sm">
                            {formatFileSize(uploadFile.file.size)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          {uploadFile.status === "completed" && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {uploadFile.status === "error" && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                          <span className="text-sm text-gray-400">
                            {uploadFile.progress}%
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            uploadFile.status === "completed"
                              ? "bg-green-500"
                              : uploadFile.status === "error"
                                ? "bg-red-500"
                                : "bg-blue-500"
                          }`}
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>

                      {uploadFile.error && (
                        <p className="text-red-400 text-sm mt-2">
                          {uploadFile.error}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            {allCompleted && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-green-400 font-medium">
                    All files uploaded successfully!
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {allCompleted ? "Done" : "Cancel"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
