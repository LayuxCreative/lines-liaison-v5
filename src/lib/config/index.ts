// Main configuration exports
export { supabase, DATABASE_CONFIG } from './database';
export { DatabaseConnectionManager } from './database';
export { storageService, STORAGE_CONFIG, STORAGE_QUERIES } from './storage';
export { authService, AUTH_CONFIG, validatePassword, validateEmail } from './auth';

// Re-export types
export type { Database, Profile, Project, Task, Team, Message, Room } from './database/types';
export type { 
  AuthState, 
  SignUpData, 
  SignInData, 
  ResetPasswordData, 
  UpdatePasswordData, 
  UpdateProfileData 
} from './auth';

// Application configuration
export const APP_CONFIG = {
  name: 'Lines Liaison',
  version: '5.0.0',
  environment: import.meta.env.MODE as 'development' | 'staging' | 'production',
  debug: import.meta.env.DEV,
  api: {
    timeout: 30000,
    retries: 3,
    baseUrl: import.meta.env.VITE_API_BASE_URL || ''
  },
  ui: {
    theme: {
      default: 'dark',
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#10B981',
        background: '#0F172A',
        surface: '#1E293B'
      }
    },
    animation: {
      duration: 300,
      easing: 'ease-in-out'
    }
  },
  features: {
    realtime: true,
    fileUpload: true,
    videoCalls: true,
    notifications: true,
    darkMode: true
  },
  limits: {
    fileUpload: {
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    },
    message: {
      maxLength: 2000
    },
    room: {
      maxMembers: 100
    }
  }
} as const;

// Environment validation
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required environment variables
  if (!import.meta.env.VITE_SUPABASE_URL) {
    errors.push('VITE_SUPABASE_URL is required');
  }
  
  if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
    errors.push('VITE_SUPABASE_ANON_KEY is required');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Initialize application
export const initializeApp = async (): Promise<void> => {
  // Validate environment
  const envValidation = validateEnvironment();
  if (!envValidation.isValid) {
    throw new Error(`Environment validation failed: ${envValidation.errors.join(', ')}`);
  }
  
  console.log('✅ Application initialized successfully');
};

// Cleanup function
export const cleanupApp = (): void => {
  console.log('🧹 Application cleanup completed');
};

// Export default configuration
export default APP_CONFIG;