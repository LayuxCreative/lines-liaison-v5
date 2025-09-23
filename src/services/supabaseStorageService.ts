import { supabase } from "../config/unifiedSupabase";
import { getStorageBucket } from "../config/supabaseConfig";
import { STORAGE_QUERIES } from "../config/supabaseSchema";
import { v4 as uuidv4 } from "uuid";
import { activityLogger } from "../utils/activityLogger";

export interface StorageFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  uploadedAt: Date;
  projectId?: string;
}

export interface UploadProgress {
  fileId?: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  projectId: string;
  uploadedAt: Date;
}

export interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void;
  maxSize?: number;
  allowedTypes?: string[];
}

class SupabaseStorageService {
  private readonly BUCKET_NAME = getStorageBucket();

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File,
    projectId?: string,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<StorageFile> {
    try {
      await activityLogger.log("file_upload", "info", "Starting file upload to storage", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        projectId
      });

      // Generate unique file path
      const fileId = uuidv4();
      const fileExtension = file.name.split(".").pop();
      const fileName = `${fileId}.${fileExtension}`;
      const filePath = projectId
        ? `projects/${projectId}/${fileName}`
        : `general/${fileName}`;

      onProgress?.({ progress: 10, status: "uploading" });

      // Upload file to Supabase Storage
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      onProgress?.({ progress: 70, status: "uploading" });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      onProgress?.({ progress: 90, status: "uploading" });

      // Save file metadata to database
      const fileMetadata = {
        id: fileId,
        name: file.name,
        original_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        project_id: projectId,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
        status: "completed",
        version: 1,
        is_public: true,
      };

      const { error: dbError } = await supabase
        .from("files")
        .insert(fileMetadata)
        .select()
        .single();

      if (dbError) {
        // If database insert fails, clean up the uploaded file
        try {
          await supabase.storage.from(this.BUCKET_NAME).remove([filePath]);
        } catch (cleanupError) {
          console.warn('Failed to cleanup uploaded file after database error:', cleanupError);
        }
        throw new Error(`Database error: ${dbError.message}`);
      }

      onProgress?.({ progress: 100, status: "completed" });

      await activityLogger.log("file_upload", "success", "File uploaded to storage successfully", {
        fileId,
        fileName: file.name,
        fileSize: file.size,
        projectId,
        filePath
      });

      return {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        path: filePath,
        uploadedAt: new Date(),
        projectId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Upload failed";
      
      await activityLogger.log("file_upload", "error", "File upload to storage failed", {
        fileName: file.name,
        fileSize: file.size,
        projectId,
        error: errorMessage
      });

      onProgress?.({ progress: 0, status: "error", error: errorMessage });
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: FileList | File[],
    projectId?: string,
    onProgress?: (fileId: string, progress: UploadProgress) => void,
  ): Promise<{
    successful: StorageFile[];
    failed: { file: File; error: string }[];
  }> {
    const successful: StorageFile[] = [];
    const failed: { file: File; error: string }[] = [];

    for (const file of Array.from(files)) {
      try {
        const fileId = uuidv4();
        const uploadedFile = await this.uploadFile(
          file,
          projectId,
          (progress) => onProgress?.(fileId, progress),
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
   * Delete a file from storage
   */
  async deleteFile(fileName: string): Promise<{ success: boolean; error?: string }> {
    try {
      await activityLogger.log("file_delete", "info", "Starting file deletion from storage", {
        fileName
      });

      // Check if file exists first
      const { data: fileExists } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list('', { search: fileName });

      if (!fileExists || fileExists.length === 0) {
        await activityLogger.log("file_delete", "warning", "File not found in storage", {
          fileName
        });
        return { success: true }; // Consider it successful if file doesn't exist
      }

      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([fileName]);

      if (error) {
        console.error('Error deleting file:', error);
        
        await activityLogger.log("file_delete", "error", "File deletion from storage failed", {
          fileName,
          error: error.message
        });

        return { success: false, error: error.message };
      }

      await activityLogger.log("file_delete", "success", "File deleted from storage successfully", {
        fileName
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting file:', error);
      
      await activityLogger.log("file_delete", "error", "File deletion from storage failed", {
        fileName,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      return { success: false, error: 'Failed to delete file' };
    }
  }

  /**
   * List files in storage bucket using safe SQL query
   */
  async listFiles(): Promise<{ success: boolean; files?: StorageFile[]; error?: string }> {
    try {
      const query = STORAGE_QUERIES.LIST_OBJECTS(this.BUCKET_NAME);
      const { data, error } = await supabase.rpc('execute_sql', { query });

      if (error) {
        console.error('Error listing files:', error);
        return { success: false, error: error.message };
      }

      return { success: true, files: data || [] };
    } catch (error) {
      console.error('Error listing files:', error);
      return { success: false, error: 'Failed to list files' };
    }
  }

  /**
   * Check if bucket exists using safe SQL query
   */
  async checkBucketExists(): Promise<{ success: boolean; exists?: boolean; error?: string }> {
    try {
      const query = STORAGE_QUERIES.CHECK_BUCKET_EXISTS(this.BUCKET_NAME);
      const { data, error } = await supabase.rpc('execute_sql', { query });

      if (error) {
        console.error('Error checking bucket:', error);
        return { success: false, error: error.message };
      }

      const exists = data?.[0]?.bucket_exists || false;
      return { success: true, exists };
    } catch (error) {
      console.error('Error checking bucket:', error);
      return { success: false, error: 'Failed to check bucket' };
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(filePath: string): string {
    const { data } = supabase.storage
      .from(this.BUCKET_NAME)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * Download file
   */
  async downloadFile(filePath: string): Promise<Blob> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .download(filePath);

    if (error) {
      throw new Error(`Download failed: ${error.message}`);
    }

    return data;
  }

  /**
   * List files in a folder
   */
  async listFilesInFolder(folderPath: string = ""): Promise<unknown[]> {
    const { data, error } = await supabase.storage
      .from(this.BUCKET_NAME)
      .list(folderPath);

    if (error) {
      throw new Error(`List failed: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{ totalSize: number; fileCount: number }> {
    try {
      const { data, error } = await supabase
        .from("files")
        .select("file_size")
        .eq("status", "completed");

      if (error) {
        throw new Error(`Stats failed: ${error.message}`);
      }

      const totalSize =
        data?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0;
      const fileCount = data?.length || 0;

      return { totalSize, fileCount };
    } catch (error) {
      console.error("Error getting storage stats:", error);
      return { totalSize: 0, fileCount: 0 };
    }
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";

    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  /**
   * Validate file before upload
   */
  validateFile(
    file: File,
    maxSize: number = 50 * 1024 * 1024,
  ): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: `File size exceeds ${this.formatFileSize(maxSize)} limit`,
      };
    }

    // Check file type (basic validation)
    const allowedTypes = [
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
      "application/zip",
      "application/x-zip-compressed",
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: "File type not supported",
      };
    }

    return { isValid: true };
  }

  /**
   * Get file icon based on file type
   */
  getFileIcon(mimeType: string): string {
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet"))
      return "📊";
    if (mimeType.includes("zip") || mimeType.includes("compressed"))
      return "🗜️";
    if (mimeType.startsWith("text/")) return "📃";
    return "📁";
  }
}

export const supabaseStorageService = new SupabaseStorageService();
export default supabaseStorageService;
