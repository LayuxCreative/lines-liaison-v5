import { supabase } from '../../config/database';
import { STORAGE_CONFIG } from '../../config/storage';
import type { FileInfo } from '../../types';

// Storage service types
export interface UploadOptions {
  bucket: string;
  path?: string;
  upsert?: boolean;
  cacheControl?: string;
  contentType?: string;
}

export interface UploadResult {
  success: boolean;
  data?: {
    path: string;
    fullPath: string;
    publicUrl: string;
  };
  error?: string;
}

export interface DownloadResult {
  success: boolean;
  data?: Blob;
  error?: string;
}

// File validation
export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > STORAGE_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds ${STORAGE_CONFIG.maxFileSize / (1024 * 1024)}MB limit`
    };
  }

  // Check file type
  if (!STORAGE_CONFIG.allowedFileTypes.includes(file.type as any)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`
    };
  }

  return { isValid: true };
};

// Generate unique file path
export const generateFilePath = (file: File, userId?: string, folder?: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const fileExtension = file.name.split('.').pop();
  const fileName = `${timestamp}-${randomString}.${fileExtension}`;
  
  let path = '';
  if (folder) {
    path += `${folder}/`;
  }
  if (userId) {
    path += `${userId}/`;
  }
  path += fileName;
  
  return path;
};

// Storage service class
export class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  // Upload file
  async uploadFile(
    file: File, 
    options: UploadOptions,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        };
      }

      // Generate file path
      const filePath = options.path || generateFilePath(file);
      
      // Upload file
      const { data, error } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          upsert: options.upsert || false,
          cacheControl: options.cacheControl || '3600',
          contentType: options.contentType || file.type
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(options.bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        data: {
          path: data.path,
          fullPath: data.fullPath,
          publicUrl: urlData.publicUrl
        }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Upload failed'
      };
    }
  }

  // Upload multiple files
  async uploadFiles(
    files: File[],
    options: UploadOptions,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const result = await this.uploadFile(
        file,
        {
          ...options,
          path: generateFilePath(file)
        },
        (progress) => onProgress?.(i, progress)
      );
      results.push(result);
    }
    
    return results;
  }

  // Download file
  async downloadFile(bucket: string, path: string): Promise<DownloadResult> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Download failed'
      };
    }
  }

  // Delete file
  async deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  // Delete multiple files
  async deleteFiles(bucket: string, paths: string[]): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Delete failed'
      };
    }
  }

  // Get public URL
  getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  // Get signed URL
  async getSignedUrl(
    bucket: string, 
    path: string, 
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        url: data.signedUrl
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create signed URL'
      };
    }
  }

  // List files in bucket
  async listFiles(
    bucket: string, 
    folder?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    }
  ): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: options?.limit,
          offset: options?.offset,
          sortBy: options?.sortBy
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        files: data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list files'
      };
    }
  }

  // Get file info
  async getFileInfo(bucket: string, path: string): Promise<{ success: boolean; info?: any; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      const fileInfo = data.find(file => file.name === path.split('/').pop());
      
      return {
        success: true,
        info: fileInfo
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to get file info'
      };
    }
  }

  // Create bucket
  async createBucket(
    name: string, 
    options?: { public?: boolean; allowedMimeTypes?: string[] }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage.createBucket(name, {
        public: options?.public || false,
        allowedMimeTypes: options?.allowedMimeTypes
      });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to create bucket'
      };
    }
  }

  // Delete bucket
  async deleteBucket(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage.deleteBucket(name);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to delete bucket'
      };
    }
  }

  // List buckets
  async listBuckets(): Promise<{ success: boolean; buckets?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.storage.listBuckets();

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        buckets: data
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to list buckets'
      };
    }
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Utilities are already exported above

// Export default
export default storageService;