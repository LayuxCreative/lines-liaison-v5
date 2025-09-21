// Supabase Configuration Constants
// This file contains all Supabase connection data to avoid repeated API calls

export const SUPABASE_CONFIG = {
  // Project Information
  PROJECT_ID: import.meta.env.VITE_SUPABASE_PROJECT_ID || 'ymstntjoewkyissepjbc',
  PROJECT_URL: import.meta.env.VITE_SUPABASE_URL || 'https://ymstntjoewkyissepjbc.supabase.co',
  
  // API Keys
  ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3RudGpvZXdreWlzc2VwamJjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNDA0ODgsImV4cCI6MjA3MjgxNjQ4OH0.4wKfqHYlxFE0OWm4VN6rNXqH5tCkjbp7FmF8xDodWjk',
  SERVICE_ROLE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inltc3RudGpvZXdreWlzc2VwamJjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI0MDQ4OCwiZXhwIjoyMDcyODE2NDg4fQ.vkqwX6bBBp53ZrFztwrudmn7hhWCVrLafnPUS9QTkjY',
  
  // Storage Configuration
  STORAGE: {
    BUCKET_NAME: 'uploads',
    PUBLIC_URL: 'https://ymstntjoewkyissepjbc.supabase.co/storage/v1/object/public/uploads/'
  },
  
  // Database Configuration
  DATABASE: {
    REGION: 'eu-west-1',
    STATUS: 'ACTIVE_HEALTHY'
  },
  
  // Connection Settings
  CONNECTION: {
    REALTIME_ENABLED: true,
    AUTO_REFRESH_TOKEN: true,
    PERSIST_SESSION: true
  }
} as const;

// Helper functions for easy access
export const getSupabaseUrl = () => SUPABASE_CONFIG.PROJECT_URL;
export const getSupabaseAnonKey = () => SUPABASE_CONFIG.ANON_KEY;
export const getProjectId = () => SUPABASE_CONFIG.PROJECT_ID;
export const getBucketName = () => SUPABASE_CONFIG.STORAGE.BUCKET_NAME;
export const getStoragePublicUrl = () => SUPABASE_CONFIG.STORAGE.PUBLIC_URL;

// Type definitions
export type SupabaseConfig = typeof SUPABASE_CONFIG;
export type StorageConfig = typeof SUPABASE_CONFIG.STORAGE;
export type DatabaseConfig = typeof SUPABASE_CONFIG.DATABASE;