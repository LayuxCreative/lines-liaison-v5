import { storageService } from '../storage';

// Media service types
export interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnail?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaUploadOptions {
  generateThumbnail?: boolean;
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  folder?: string;
}

export interface MediaProcessingResult {
  success: boolean;
  file?: MediaFile;
  thumbnail?: string;
  error?: string;
}

// Image processing utilities
export const createImageThumbnail = (
  file: File,
  maxWidth: number = 200,
  maxHeight: number = 200,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// Video processing utilities
export const getVideoThumbnail = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = 1; // Get frame at 1 second
    };

    video.onseeked = () => {
      ctx?.drawImage(video, 0, 0);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create video thumbnail'));
          }
        },
        'image/jpeg',
        0.8
      );
    };

    video.onerror = () => reject(new Error('Failed to load video'));
    video.src = URL.createObjectURL(file);
  });
};

// Audio processing utilities
export const getAudioMetadata = (file: File): Promise<Record<string, unknown>> => {
  return new Promise((resolve, reject) => {
    const audio = document.createElement('audio');
    
    audio.onloadedmetadata = () => {
      resolve({
        duration: audio.duration,
        hasAudio: true
      });
    };

    audio.onerror = () => reject(new Error('Failed to load audio'));
    audio.src = URL.createObjectURL(file);
  });
};

// Media service class
export class MediaService {
  private static instance: MediaService;

  static getInstance(): MediaService {
    if (!MediaService.instance) {
      MediaService.instance = new MediaService();
    }
    return MediaService.instance;
  }

  // Upload media file with processing
  async uploadMedia(
    file: File,
    options: MediaUploadOptions = {}
  ): Promise<MediaProcessingResult> {
    try {
      const bucket = 'media';
      let thumbnailUrl: string | undefined;

      // Generate thumbnail if requested
      if (options.generateThumbnail && file.type.startsWith('image/')) {
        try {
          const thumbnailBlob = await createImageThumbnail(
            file,
            options.maxWidth,
            options.maxHeight,
            options.quality
          );
          
          const thumbnailFile = new File(
            [thumbnailBlob],
            `thumb_${file.name}`,
            { type: 'image/jpeg' }
          );

          const thumbnailResult = await storageService.uploadFile(thumbnailFile, {
            bucket,
            path: `thumbnails/${Date.now()}_${thumbnailFile.name}`
          });

          if (thumbnailResult.success && thumbnailResult.data) {
            thumbnailUrl = thumbnailResult.data.publicUrl;
          }
        } catch (error) {
          console.warn('Failed to generate thumbnail:', error);
        }
      }

      // Upload original file
      const uploadResult = await storageService.uploadFile(file, {
        bucket,
        path: options.folder ? `${options.folder}/${Date.now()}_${file.name}` : undefined
      });

      if (!uploadResult.success || !uploadResult.data) {
        return {
          success: false,
          error: uploadResult.error || 'Upload failed'
        };
      }

      // Get metadata based on file type
      let metadata: Record<string, unknown> = {};
      
      if (file.type.startsWith('image/')) {
        metadata.type = 'image';
      } else if (file.type.startsWith('video/')) {
        metadata.type = 'video';
        try {
          const videoThumbnail = await getVideoThumbnail(file);
          const thumbnailFile = new File([videoThumbnail], `video_thumb_${file.name}.jpg`, { type: 'image/jpeg' });
          const thumbnailResult = await storageService.uploadFile(thumbnailFile, {
            bucket,
            path: `thumbnails/video_${Date.now()}_${thumbnailFile.name}`
          });
          if (thumbnailResult.success && thumbnailResult.data) {
            thumbnailUrl = thumbnailResult.data.publicUrl;
          }
        } catch (error) {
          console.warn('Failed to generate video thumbnail:', error);
        }
      } else if (file.type.startsWith('audio/')) {
        metadata.type = 'audio';
        try {
          const audioMetadata = await getAudioMetadata(file);
          metadata = { ...metadata, ...audioMetadata };
        } catch (error) {
          console.warn('Failed to get audio metadata:', error);
        }
      } else {
        metadata.type = 'document';
      }

      const mediaFile: MediaFile = {
        id: uploadResult.data.path,
        name: file.name,
        type: file.type,
        size: file.size,
        url: uploadResult.data.publicUrl,
        thumbnail: thumbnailUrl,
        metadata,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      return {
        success: true,
        file: mediaFile,
        thumbnail: thumbnailUrl
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Media upload failed'
      };
    }
  }

  // Upload multiple media files
  async uploadMultipleMedia(
    files: File[],
    options: MediaUploadOptions = {},
    onProgress?: (index: number, result: MediaProcessingResult) => void
  ): Promise<MediaProcessingResult[]> {
    const results: MediaProcessingResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const result = await this.uploadMedia(files[i], options);
      results.push(result);
      onProgress?.(i, result);
    }

    return results;
  }

  // Delete media file
  async deleteMedia(mediaFile: MediaFile): Promise<{ success: boolean; error?: string }> {
    try {
      const bucket = 'media';
      const filesToDelete = [mediaFile.id];

      // Add thumbnail to deletion list if exists
      if (mediaFile.thumbnail) {
        const thumbnailPath = this.extractPathFromUrl(mediaFile.thumbnail);
        if (thumbnailPath) {
          filesToDelete.push(thumbnailPath);
        }
      }

      const result = await storageService.deleteFiles(bucket, filesToDelete);
      return result;
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Media deletion failed'
      };
    }
  }

  // Get media file info
  async getMediaInfo(path: string): Promise<{ success: boolean; info?: unknown; error?: string }> {
    return storageService.getFileInfo('media', path);
  }

  // List media files
  async listMedia(
    folder?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: { column: string; order: 'asc' | 'desc' };
    }
  ): Promise<{ success: boolean; files?: unknown[]; error?: string }> {
    return storageService.listFiles('media', folder, options);
  }

  // Get signed URL for private media
  async getSignedMediaUrl(
    path: string,
    expiresIn: number = 3600
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return storageService.getSignedUrl('media', path, expiresIn);
  }

  // Compress image
  async compressImage(
    file: File,
    quality: number = 0.8,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<{ success: boolean; file?: File; error?: string }> {
    try {
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File is not an image'
        };
      }

      const compressedBlob = await createImageThumbnail(
        file,
        maxWidth || 1920,
        maxHeight || 1080,
        quality
      );

      const compressedFile = new File(
        [compressedBlob],
        file.name,
        { type: 'image/jpeg' }
      );

      return {
        success: true,
        file: compressedFile
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image compression failed'
      };
    }
  }

  // Convert image format
  async convertImageFormat(
    file: File,
    targetFormat: 'jpeg' | 'png' | 'webp',
    quality: number = 0.9
  ): Promise<{ success: boolean; file?: File; error?: string }> {
    try {
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          error: 'File is not an image'
        };
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const convertedFile = new File(
                  [blob],
                  file.name.replace(/\.[^/.]+$/, `.${targetFormat}`),
                  { type: `image/${targetFormat}` }
                );
                resolve({
                  success: true,
                  file: convertedFile
                });
              } else {
                resolve({
                  success: false,
                  error: 'Conversion failed'
                });
              }
            },
            `image/${targetFormat}`,
            quality
          );
        };

        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image'
          });
        };

        img.src = URL.createObjectURL(file);
      });
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image format conversion failed'
      };
    }
  }

  // Extract file path from URL
  private extractPathFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const objectIndex = pathParts.findIndex(part => part === 'object');
      
      if (objectIndex !== -1 && objectIndex < pathParts.length - 2) {
        return pathParts.slice(objectIndex + 2).join('/');
      }
      
      return null;
    } catch {
      return null;
    }
  }

  // Validate media file
  validateMediaFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'application/pdf',
      'text/plain'
    ];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size exceeds 100MB limit'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `File type ${file.type} is not allowed`
      };
    }

    return { isValid: true };
  }

  // Get file type category
  getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'other' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf') || mimeType.includes('text')) return 'document';
    return 'other';
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Export singleton instance
export const mediaService = MediaService.getInstance();

// Utilities are already exported above

// Export default
export default mediaService;