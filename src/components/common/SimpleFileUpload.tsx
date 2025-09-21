import React, { useState, useRef, useCallback } from "react";
import { Upload, X, CheckCircle, AlertCircle, File } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  supabaseStorageService,
  UploadedFile,
  UploadProgress,
  UploadOptions,
} from "../../services/supabaseStorageService";

interface SimpleFileUploadProps {
  userId: string;
  projectId?: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onClose?: () => void;
  options?: UploadOptions;
  className?: string;
}

interface FileWithProgress {
  file: File;
  progress: UploadProgress;
}

export const SimpleFileUpload: React.FC<SimpleFileUploadProps> = ({
  userId,
  projectId,
  onUploadComplete,
  onClose,
  options = {},
  className = "",
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const droppedFiles = Array.from(e.dataTransfer.files);
    addFiles(droppedFiles);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const selectedFiles = Array.from(e.target.files);
        addFiles(selectedFiles);
      }
    },
    [],
  );

  const addFiles = useCallback((newFiles: File[]) => {
    const filesWithProgress: FileWithProgress[] = newFiles.map((file) => ({
      file,
      progress: {
        fileId: Date.now().toString() + Math.random().toString(36),
        fileName: file.name,
        progress: 0,
        status: "uploading",
      },
    }));

    setFiles((prev) => [...prev, ...filesWithProgress]);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.progress.fileId !== fileId));
  }, []);

  const updateFileProgress = useCallback(
    (fileId: string, progress: UploadProgress) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.progress.fileId === fileId ? { ...f, progress } : f,
        ),
      );
    },
    [],
  );

  const startUpload = useCallback(async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    const uploadedFiles: UploadedFile[] = [];

    try {
      for (const fileWithProgress of files) {
        if (fileWithProgress.progress.status === "completed") continue;

        try {
          // Validate file before upload
          const validation = supabaseStorageService.validateFile(
            fileWithProgress.file,
          );
          if (!validation.isValid) {
            throw new Error(validation.error);
          }

          const uploadedFile = await supabaseStorageService.uploadFile(
            fileWithProgress.file,
            projectId || "",
            (progress) =>
              updateFileProgress(fileWithProgress.progress.fileId || "", {
                ...progress,
                fileId: fileWithProgress.progress.fileId,
              }),
          );

          const fileData = {
            id: uploadedFile.id,
            name: uploadedFile.name,
            size: uploadedFile.size,
            type: uploadedFile.type,
            url: uploadedFile.url,
            projectId: projectId || "",
            uploadedAt: uploadedFile.uploadedAt,
          };

          uploadedFiles.push(fileData);
        } catch (error) {
          console.error(
            "Upload failed for file:",
            fileWithProgress.file.name,
            error,
          );
        }
      }

      if (uploadedFiles.length > 0) {
        onUploadComplete?.(uploadedFiles);
      }
    } finally {
      setIsUploading(false);
    }
  }, [files, userId, projectId, options, onUploadComplete, updateFileProgress]);

  const getStatusIcon = (status: UploadProgress["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case "uploading":
        return (
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <File className="w-5 h-5 text-gray-400" />;
    }
  };

  const completedFiles = files.filter(
    (f) => f.progress.status === "completed",
  ).length;
  const hasErrors = files.some((f) => f.progress.status === "error");
  const canUpload = files.length > 0 && !isUploading;

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Upload Files</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload
          className={`w-12 h-12 mx-auto mb-4 ${
            isDragOver ? "text-blue-500" : "text-gray-400"
          }`}
        />
        <p className="text-lg font-medium text-gray-700 mb-2">
          {isDragOver ? "Drop files here" : "Drag & drop files here"}
        </p>
        <p className="text-sm text-gray-500 mb-4">or click to browse files</p>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Browse Files
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept={options.allowedTypes?.join(",")}
      />

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6"
          >
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {files.map((fileWithProgress) => (
                <motion.div
                  key={fileWithProgress.progress.fileId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {getStatusIcon(fileWithProgress.progress.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {supabaseStorageService.getFileIcon(
                          fileWithProgress.file.type,
                        )}{" "}
                        {fileWithProgress.file.name}
                      </p>
                      <span className="text-xs text-gray-500">
                        {supabaseStorageService.formatFileSize(
                          fileWithProgress.file.size,
                        )}
                      </span>
                    </div>

                    {fileWithProgress.progress.status === "uploading" && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${fileWithProgress.progress.progress}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {Math.round(fileWithProgress.progress.progress)}%
                          uploaded
                        </p>
                      </div>
                    )}

                    {fileWithProgress.progress.error && (
                      <p className="text-xs text-red-500 mt-1">
                        {fileWithProgress.progress.error}
                      </p>
                    )}
                  </div>

                  {fileWithProgress.progress.status !== "uploading" && (
                    <button
                      onClick={() =>
                        removeFile(fileWithProgress.progress.fileId)
                      }
                      className="flex-shrink-0 p-1 hover:bg-gray-200 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Button */}
      {files.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {completedFiles > 0 && (
              <span className="text-green-600">
                {completedFiles} of {files.length} files uploaded
              </span>
            )}
            {hasErrors && (
              <span className="text-red-600 ml-2">
                Some files failed to upload
              </span>
            )}
          </div>

          <button
            onClick={startUpload}
            disabled={!canUpload}
            className={`
              px-6 py-2 rounded-lg font-medium transition-all duration-200
              ${
                canUpload
                  ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Uploading...</span>
              </div>
            ) : (
              `Upload ${files.length} file${files.length > 1 ? "s" : ""}`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SimpleFileUpload;
