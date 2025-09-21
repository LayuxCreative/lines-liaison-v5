export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: Date;
  projectId?: string;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "pending" | "uploading" | "completed" | "error";
  error?: string;
}

export interface UploadOptions {
  maxFileSize?: number;
  allowedTypes?: string[];
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (file: UploadedFile) => void;
  onError?: (error: string) => void;
}

class SimpleFileUploadService {
  private readonly API_BASE_URL = "http://localhost:3001/api";
  private readonly DEFAULT_MAX_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly DEFAULT_ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ];

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    options: UploadOptions = {},
  ): { isValid: boolean; error?: string } {
    const maxSize = options.maxFileSize || this.DEFAULT_MAX_SIZE;
    const allowedTypes = options.allowedTypes || this.DEFAULT_ALLOWED_TYPES;

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds ${this.formatFileSize(maxSize)} limit`,
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`,
      };
    }

    return { isValid: true };
  }

  /**
   * Upload single file
   */
  async uploadFile(
    file: File,
    userId: string,
    projectId?: string,
    options: UploadOptions = {},
  ): Promise<UploadedFile> {
    // Validate file
    const validation = this.validateFile(file, options);
    if (!validation.isValid) {
      const error = validation.error || "File validation failed";
      options.onError?.(error);
      throw new Error(error);
    }

    const fileId = this.generateId();

    // Create progress tracker
    const updateProgress = (
      progress: number,
      status: UploadProgress["status"],
      error?: string,
    ) => {
      options.onProgress?.({
        fileId,
        fileName: file.name,
        progress,
        status,
        error,
      });
    };

    try {
      updateProgress(0, "pending");

      // Prepare form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      if (projectId) {
        formData.append("projectId", projectId);
      }

      updateProgress(10, "uploading");

      // Upload file with progress tracking
      const response = await fetch(`${this.API_BASE_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      updateProgress(90, "uploading");

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Upload failed");
      }

      const uploadedFile: UploadedFile = {
        id: result.file.id,
        name: result.file.name,
        size: result.file.size,
        type: result.file.type,
        url: result.file.url,
        uploadedAt: new Date(result.file.uploadedAt),
        projectId: result.file.projectId,
      };

      updateProgress(100, "completed");
      options.onComplete?.(uploadedFile);

      return uploadedFile;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      updateProgress(0, "error", errorMessage);
      options.onError?.(errorMessage);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: FileList | File[],
    userId: string,
    projectId?: string,
    options: UploadOptions = {},
  ): Promise<{
    successful: UploadedFile[];
    failed: { file: File; error: string }[];
  }> {
    const fileArray = Array.from(files);
    const successful: UploadedFile[] = [];
    const failed: { file: File; error: string }[] = [];

    // Upload files sequentially to avoid overwhelming the server
    for (const file of fileArray) {
      try {
        const uploadedFile = await this.uploadFile(
          file,
          userId,
          projectId,
          options,
        );
        successful.push(uploadedFile);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";
        failed.push({ file, error: errorMessage });
      }
    }

    return { successful, failed };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Get file type icon
   */
  getFileIcon(type: string): string {
    if (type.startsWith("image/")) return "🖼️";
    if (type === "application/pdf") return "📄";
    if (type.startsWith("text/")) return "📝";
    if (type.includes("word")) return "📄";
    if (type.includes("excel") || type.includes("sheet")) return "📊";
    if (type.includes("powerpoint") || type.includes("presentation"))
      return "📊";
    if (type.startsWith("video/")) return "🎥";
    if (type.startsWith("audio/")) return "🎵";
    if (type.includes("zip") || type.includes("rar")) return "📦";
    return "📁";
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Check if server is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const simpleFileUploadService = new SimpleFileUploadService();
export default simpleFileUploadService;
