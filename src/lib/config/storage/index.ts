import { supabase } from '../database';

// Storage configuration
export const STORAGE_CONFIG = {
  bucket: 'lines-liaison-storage',
  publicUrl: 'https://ymstntjoewkyissepjbc.supabase.co/storage/v1/object/public',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    // Text files
    'text/plain',
    'text/csv',
    'application/json',
    // Archives
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    // Audio
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    // Video
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv'
  ],
  folders: {
    avatars: 'avatars',
    documents: 'documents',
    images: 'images',
    videos: 'videos',
    audio: 'audio',
    temp: 'temp'
  }
} as const;

// Storage schema definitions
export const STORAGE_OBJECTS_COLUMNS = {
  id: 'uuid',
  bucket_id: 'text',
  name: 'text',
  owner: 'uuid',
  created_at: 'timestamp with time zone',
  updated_at: 'timestamp with time zone',
  last_accessed_at: 'timestamp with time zone',
  metadata: 'jsonb',
  path_tokens: 'ARRAY',
  version: 'text',
  owner_id: 'text',
  user_metadata: 'jsonb',
  level: 'integer'
} as const;

export const STORAGE_BUCKETS_COLUMNS = {
  id: 'text',
  name: 'text',
  owner: 'uuid',
  created_at: 'timestamp with time zone',
  updated_at: 'timestamp with time zone',
  public: 'boolean',
  avif_autodetection: 'boolean',
  file_size_limit: 'bigint',
  allowed_mime_types: 'ARRAY',
  owner_id: 'text'
} as const;

// Storage utility functions
export const getStorageUrl = (path: string): string => {
  return `${STORAGE_CONFIG.publicUrl}/${STORAGE_CONFIG.bucket}/${path}`;
};

export const getFileFolder = (fileType: string): string => {
  if (fileType.startsWith('image/')) return STORAGE_CONFIG.folders.images;
  if (fileType.startsWith('video/')) return STORAGE_CONFIG.folders.videos;
  if (fileType.startsWith('audio/')) return STORAGE_CONFIG.folders.audio;
  if (fileType === 'application/pdf' || fileType.includes('document') || fileType.includes('sheet') || fileType.includes('presentation')) {
    return STORAGE_CONFIG.folders.documents;
  }
  return STORAGE_CONFIG.folders.documents;
};

export const generateFileName = (originalName: string, userId: string): string => {
  const timestamp = Date.now();
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
  return `${userId}_${timestamp}_${sanitizedName}.${extension}`;
};

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > STORAGE_CONFIG.maxFileSize) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${STORAGE_CONFIG.maxFileSize / (1024 * 1024)}MB`
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

// Storage queries
export const STORAGE_QUERIES = {
  LIST_OBJECTS: (bucketId: string, limit: number = 50) => `
    SELECT 
      id,
      bucket_id,
      name,
      created_at,
      updated_at,
      metadata
    FROM storage.objects 
    WHERE bucket_id = '${bucketId}'
    ORDER BY created_at DESC
    LIMIT ${limit};
  `,
  
  LIST_BUCKETS: () => `
    SELECT 
      id,
      name,
      created_at,
      updated_at
    FROM storage.buckets
    ORDER BY created_at DESC;
  `,
  
  CHECK_BUCKET_EXISTS: (bucketId: string) => `
    SELECT EXISTS(
      SELECT 1 FROM storage.buckets WHERE id = '${bucketId}'
    ) as bucket_exists;
  `,
  
  GET_OBJECT_METADATA: (bucketId: string, objectName: string) => `
    SELECT 
      id,
      name,
      metadata,
      created_at,
      updated_at
    FROM storage.objects 
    WHERE bucket_id = '${bucketId}' AND name = '${objectName}';
  `
} as const;

// Storage service class
export class StorageService {
  private static instance: StorageService;

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadFile(file: File, userId: string, folder?: string): Promise<{ url: string; path: string }> {
    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    // Generate file path
    const targetFolder = folder || getFileFolder(file.type);
    const fileName = generateFileName(file.name, userId);
    const filePath = `${targetFolder}/${fileName}`;

    // Upload file
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .upload(filePath, file);

    if (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const url = getStorageUrl(filePath);

    return {
      url,
      path: filePath
    };
  }

  async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .remove([path]);

    if (error) {
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  async getFileUrl(path: string): Promise<string> {
    return getStorageUrl(path);
  }

  async listFiles(folder: string, limit: number = 50): Promise<any[]> {
    const { data, error } = await supabase.storage
      .from(STORAGE_CONFIG.bucket)
      .list(folder, {
        limit,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      throw new Error(`List files failed: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const storageService = StorageService.getInstance();

// Export configuration and utilities
export { STORAGE_CONFIG as default };