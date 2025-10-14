import { supabase } from '../lib/supabase';

export interface FileUploadResult {
  url: string;
  path: string;
  size: number;
  type: string;
}

export interface UploadResult {
  url: string;
  path: string;
}

export interface StorageFile {
  name: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, unknown>;
}

export const storageService = {
  // Upload any type of file
  async uploadFile(
    file: File, 
    bucketName: string = 'files', 
    folder: string = '',
    options?: { cacheControl?: string; upsert?: boolean }
  ): Promise<FileUploadResult> {
    try {
      const fileName = `${folder}${folder ? '/' : ''}${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: options?.cacheControl || '3600',
          upsert: options?.upsert || false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path,
        size: file.size,
        type: file.type
      };
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  },

  // Upload image specifically
  async uploadImage(file: File, bucketName: string = 'files', path: string = ''): Promise<UploadResult> {
    try {
      const fileName = `${path}${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(data.path);

      return {
        url: urlData.publicUrl,
        path: data.path
      };
    } catch (error) {
      console.error('Image upload failed:', error);
      throw error;
    }
  },

  async uploadMultipleFiles(
    files: File[], 
    bucketName: string = 'files', 
    folder: string = ''
  ): Promise<FileUploadResult[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, bucketName, folder));
    return Promise.all(uploadPromises);
  },

  async deleteFile(filePath: string, bucketName: string = 'files'): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
      }
    } catch (error) {
      console.error('File delete failed:', error);
      throw error;
    }
  },

  async deleteMultipleFiles(filePaths: string[], bucketName: string = 'files'): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove(filePaths);

      if (error) {
        console.error('Delete multiple files error:', error);
        throw new Error(`Failed to delete files: ${error.message}`);
      }
    } catch (error) {
      console.error('Multiple files delete failed:', error);
      throw error;
    }
  },

  async getFileUrl(filePath: string, bucketName: string = 'files'): Promise<string> {
    try {
      const { data } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Get file URL failed:', error);
      throw error;
    }
  },

  async getSignedUrl(
    filePath: string, 
    expiresIn: number = 3600, 
    bucketName: string = 'files'
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Signed URL error:', error);
        throw new Error(`Failed to create signed URL: ${error.message}`);
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Get signed URL failed:', error);
      throw error;
    }
  },

  async listFiles(
    bucketName: string = 'files', 
    folder: string = '',
    options?: { limit?: number; offset?: number }
  ): Promise<StorageFile[]> {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(folder, {
          limit: options?.limit || 100,
          offset: options?.offset || 0
        });

      if (error) {
        console.error('List files error:', error);
        throw new Error(`Failed to list files: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('List files failed:', error);
      throw error;
    }
  },

  async getFileInfo(filePath: string, bucketName: string = 'files'): Promise<StorageFile | null> {
    try {
      const folder = filePath.substring(0, filePath.lastIndexOf('/'));
      const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
      
      const files = await this.listFiles(bucketName, folder);
      return files.find(file => file.name === fileName) || null;
    } catch (error) {
      console.error('Get file info failed:', error);
      return null;
    }
  },

  async createBucket(bucketName: string, isPublic: boolean = true): Promise<void> {
    try {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: isPublic
      });

      if (error && !error.message.includes('already exists')) {
        console.error('Create bucket error:', error);
        throw new Error(`Failed to create bucket: ${error.message}`);
      }
    } catch (error) {
      console.error('Create bucket failed:', error);
      throw error;
    }
  },

  async getStorageUsage(bucketName: string = 'files'): Promise<{ size: number; fileCount: number }> {
    try {
      const files = await this.listFiles(bucketName);
      const totalSize = files.reduce((sum, file) => sum + (file.metadata?.size as number || 0), 0);
      
      return {
        size: totalSize,
        fileCount: files.length
      };
    } catch (error) {
      console.error('Get storage usage failed:', error);
      return { size: 0, fileCount: 0 };
    }
  }
};

// Specialized services for different file types
export const documentStorageService = {
  async uploadDocument(file: File): Promise<FileUploadResult> {
    return storageService.uploadFile(file, 'files', 'documents');
  },

  async listDocuments(): Promise<StorageFile[]> {
    return storageService.listFiles('files', 'documents');
  }
};

export const mediaStorageService = {
  async uploadMedia(file: File): Promise<FileUploadResult> {
    return storageService.uploadFile(file, 'files', 'media');
  },

  async listMedia(): Promise<StorageFile[]> {
    return storageService.listFiles('files', 'media');
  }
};

// Legacy exports for backward compatibility
export const fileStorageService = storageService;
export const imageStorageService = {
  uploadImage: storageService.uploadImage,
  deleteImage: storageService.deleteFile,
  getImageUrl: storageService.getFileUrl,
  listImages: (bucketName?: string, folder?: string) => storageService.listFiles(bucketName, folder)
};