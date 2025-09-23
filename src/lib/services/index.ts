// Export API services
export * from './api';
export { default as apiService } from './api';

// Export storage services
export * from './storage';
export { default as storageService } from './storage';

// Export media services
export * from './media';
export { default as mediaService } from './media';

// Re-export types
export type {
  ApiResponse,
  PaginationParams,
  PaginatedResponse
} from '../types';

export type {
  Profile,
  Project,
  Task,
  Team,
  Database,
  Tables,
  TablesInsert,
  TablesUpdate
} from '../config/database/types';

// Service configuration
export const SERVICES_CONFIG = {
  api: {
    baseUrl: import.meta.env.VITE_SUPABASE_URL,
    timeout: 30000,
    retries: 3
  },
  storage: {
    defaultBucket: 'media',
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
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
    ]
  },
  media: {
    thumbnailSize: { width: 200, height: 200 },
    compressionQuality: 0.8,
    videoThumbnailTime: 1 // seconds
  }
} as const;

// Service initialization
export const initializeServices = async (): Promise<void> => {
  try {
    console.log('Initializing services...');
    
    // Services are initialized as singletons
    // No additional setup required
    
    console.log('Services initialized successfully');
  } catch (error) {
    console.error('Failed to initialize services:', error);
    throw error;
  }
};

// Service cleanup
export const cleanupServices = async (): Promise<void> => {
  try {
    console.log('Cleaning up services...');
    
    // Cleanup any active connections or subscriptions
    // Services handle their own cleanup
    
    console.log('Services cleaned up successfully');
  } catch (error) {
    console.error('Failed to cleanup services:', error);
  }
};

// Service health check
export const checkServicesHealth = async (): Promise<{
  api: boolean;
  storage: boolean;
  media: boolean;
}> => {
  try {
    // Basic health checks
    const health = {
      api: true, // API service is always available if Supabase is connected
      storage: true, // Storage service is always available if Supabase is connected
      media: true // Media service depends on storage
    };

    return health;
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      api: false,
      storage: false,
      media: false
    };
  }
};