import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  X,
  File,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
  HardDrive,
  FolderOpen
} from 'lucide-react';
import { localFileService, LocalFile } from '../../services/localFileService';

interface LocalFileUploadProps {
  projectId?: string;
  onFileUploaded?: (file: LocalFile) => void;
  onFileDeleted?: (fileId: string) => void;
  maxFiles?: number;
  className?: string;
}

interface FileWithProgress {
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
  id?: string;
}

const LocalFileUpload: React.FC<LocalFileUploadProps> = ({
  projectId,
  onFileUploaded,
  onFileDeleted,
  maxFiles = 10,
  className = ''
}) => {
  const [files, setFiles] = useState<FileWithProgress[]>([]);
  const [storedFiles, setStoredFiles] = useState<LocalFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showStoredFiles, setShowStoredFiles] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load stored files
  const loadStoredFiles = useCallback(async () => {
    const result = await localFileService.getFiles(projectId);
    if (result.success && result.files) {
      setStoredFiles(result.files);
    }
  }, [projectId]);

  React.useEffect(() => {
    loadStoredFiles();
  }, [loadStoredFiles]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const uploadFiles = useCallback(async (filesToUpload: FileWithProgress[]) => {
    setIsUploading(true);

    for (const fileWithProgress of filesToUpload) {
      try {
        // Simulate progress
        setFiles(prev => prev.map(f => 
          f.file === fileWithProgress.file 
            ? { ...f, progress: 30 }
            : f
        ));

        const result = await localFileService.uploadFile(fileWithProgress.file, projectId);

        if (result.success && result.file) {
          setFiles(prev => prev.map(f => 
            f.file === fileWithProgress.file 
              ? { ...f, progress: 100, status: 'completed', id: result.file!.id }
              : f
          ));

          onFileUploaded?.(result.file);
          await loadStoredFiles(); // Refresh stored files list
        } else {
          setFiles(prev => prev.map(f => 
            f.file === fileWithProgress.file 
              ? { ...f, status: 'error', error: result.error }
              : f
          ));
        }
      } catch {
          setFiles(prev => prev.map(f => 
            f.file === fileWithProgress.file 
              ? { ...f, status: 'error', error: 'Upload failed' }
              : f
          ));
        }
    }

    setIsUploading(false);
  }, [projectId, onFileUploaded, loadStoredFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const fileList = Array.from(e.dataTransfer.files);
      const newFiles = fileList.slice(0, maxFiles - files.length).map(file => ({
        file,
        progress: 0,
        status: 'uploading' as const
      }));

      setFiles(prev => [...prev, ...newFiles]);
      uploadFiles(newFiles);
    }
  }, [files.length, maxFiles, uploadFiles]);

  const handleFiles = useCallback((fileList: File[]) => {
    const newFiles = fileList.slice(0, maxFiles - files.length).map(file => ({
      file,
      progress: 0,
      status: 'uploading' as const
    }));

    setFiles(prev => [...prev, ...newFiles]);
    uploadFiles(newFiles);
  }, [files.length, maxFiles, uploadFiles]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const deleteStoredFile = useCallback(async (fileId: string) => {
    const result = await localFileService.deleteFile(fileId);
    if (result.success) {
      onFileDeleted?.(fileId);
      await loadStoredFiles();
    }
  }, [onFileDeleted, loadStoredFiles]);

  const downloadFile = useCallback(async (fileId: string) => {
    await localFileService.downloadFile(fileId);
  }, []);

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('document') || type.includes('word')) return '📝';
    if (type.includes('sheet') || type.includes('excel')) return '📊';
    return '📁';
  };

  const storageInfo = localFileService.getStorageInfo();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFiles(Array.from(e.target.files));
            }
          }}
        />

        <div className="text-center">
          <HardDrive className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Save Files Locally
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Drag files here or click to select
          </p>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            <Upload className="w-4 h-4 mr-2" />
            Select Files
          </button>
        </div>
      </div>

      {/* Storage Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>Saved Files: {storageInfo.totalFiles}</span>
          <span>Used Space: {storageInfo.usedSpace}</span>
        </div>
      </div>

      {/* Upload Progress */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {files.map((fileWithProgress, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center justify-between p-3 bg-white border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">
                    {getFileIcon(fileWithProgress.file.type)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {fileWithProgress.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {localFileService.formatFileSize(fileWithProgress.file.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {fileWithProgress.status === 'uploading' && (
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${fileWithProgress.progress}%` }}
                      />
                    </div>
                  )}

                  {fileWithProgress.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}

                  {fileWithProgress.status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}

                  <button
                    onClick={() => removeFile(index)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stored Files Toggle */}
      <button
        onClick={() => setShowStoredFiles(!showStoredFiles)}
        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
      >
        <FolderOpen className="w-4 h-4" />
        <span>
          {showStoredFiles ? 'Hide' : 'Show'} Saved Files ({storedFiles.length})
        </span>
      </button>

      {/* Stored Files List */}
      <AnimatePresence>
        {showStoredFiles && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {storedFiles.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No saved files
              </p>
            ) : (
              storedFiles.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {getFileIcon(file.type)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {localFileService.formatFileSize(file.size)} • {' '}
                        {new Date(file.createdAt).toLocaleDateString('ar')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadFile(file.id)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                      title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteStoredFile(file.id)}
                        className="p-1 text-red-600 hover:text-red-800 transition-colors"
                        title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LocalFileUpload;