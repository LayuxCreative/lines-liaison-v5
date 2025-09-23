// Application Constants
export const APP_CONFIG = {
  NAME: 'Lines Liaison',
  VERSION: '5.0.0',
  DESCRIPTION: 'Professional Project Management Platform',
} as const;

// API Configuration
export const API_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// UI Constants
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  TOAST_DURATION: 5000,
  MODAL_Z_INDEX: 1000,
} as const;

// File Upload Constants
export const FILE_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
} as const;

// Theme Constants
export const THEME_CONFIG = {
  COLORS: {
    PRIMARY: '#3B82F6',
    PRIMARY_DARK: '#1D4ED8',
    SECONDARY: '#8B5CF6',
    SECONDARY_DARK: '#7C3AED',
    ACCENT: '#10B981',
    ACCENT_DARK: '#059669',
    SUCCESS: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#3B82F6',
  },
  BREAKPOINTS: {
    SM: '640px',
    MD: '768px',
    LG: '1024px',
    XL: '1280px',
    '2XL': '1536px',
  },
} as const;

// Route Constants
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LOGOUT: '/logout',
  DASHBOARD: '/dashboard',
  PROJECTS: '/dashboard/projects',
  FILES: '/dashboard/files',
  TASKS: '/dashboard/tasks',
  COMMUNICATION: '/dashboard/communication',
  SETTINGS: '/dashboard/settings',
  PROFILE: '/dashboard/profile',
  REPORTS: '/dashboard/reports',
} as const;

// Permission Constants
export const PERMISSIONS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  MANAGE_USERS: 'manage_users',
  MANAGE_PROJECTS: 'manage_projects',
  MANAGE_FILES: 'manage_files',
} as const;

// Status Constants
export const STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// Priority Constants
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;