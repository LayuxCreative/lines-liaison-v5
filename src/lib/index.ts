// Lines Liaison Library - Main Export File
// Organized exports for the complete library

// Core Services
export * from './services';

// UI Components
export * from './components';

// Page Components and Utilities
export * from './pages';

// Library Metadata
export const LIBRARY_VERSION = '1.0.0';
export const LIBRARY_NAME = 'Lines Liaison Library';

// Library Configuration
export interface LibraryConfig {
  version: string;
  name: string;
  components: {
    ui: number;
    layout: number;
    forms: number;
    media: number;
  };
  pages: {
    auth: number;
    dashboard: number;
    public: number;
  };
  services: {
    api: number;
    auth: number;
    storage: number;
    utils: number;
  };
}

export const LIBRARY_CONFIG: LibraryConfig = {
  version: LIBRARY_VERSION,
  name: LIBRARY_NAME,
  components: {
    ui: 5, // Button, Input, Modal, Card, Badge
    layout: 7, // Header, Sidebar, Footer, Layout, Page, Grid, Navigation
    forms: 8, // Form, Field, Validation, File, Select, Checkbox, Radio, Submit
    media: 7 // Image, Video, Audio, File, Gallery, Player, Thumbnail
  },
  pages: {
    auth: 5, // Login, Register, Forgot, Reset, Verify
    dashboard: 9, // Dashboard, Projects, Tasks, Files, Communication, Reports, Settings, Profile, Details
    public: 7 // Home, About, Services, Contact, Pricing, Blog, BlogPost
  },
  services: {
    api: 6, // HTTP, Auth, Projects, Tasks, Files, Users
    auth: 4, // Login, Register, Token, Session
    storage: 3, // Local, Session, Cache
    utils: 8 // Validation, Format, Date, File, String, Number, Array, Object
  }
};

// Library Utilities
export const getLibraryInfo = () => ({
  version: LIBRARY_VERSION,
  name: LIBRARY_NAME,
  totalComponents: Object.values(LIBRARY_CONFIG.components).reduce((a, b) => a + b, 0),
  totalPages: Object.values(LIBRARY_CONFIG.pages).reduce((a, b) => a + b, 0),
  totalServices: Object.values(LIBRARY_CONFIG.services).reduce((a, b) => a + b, 0)
});

export const validateLibraryVersion = (requiredVersion: string): boolean => {
  const [major, minor, patch] = LIBRARY_VERSION.split('.').map(Number);
  const [reqMajor, reqMinor, reqPatch] = requiredVersion.split('.').map(Number);
  
  if (major > reqMajor) return true;
  if (major < reqMajor) return false;
  if (minor > reqMinor) return true;
  if (minor < reqMinor) return false;
  return patch >= reqPatch;
};

// Development Utilities
export const isDevelopment = () => process.env.NODE_ENV === 'development';
export const isProduction = () => process.env.NODE_ENV === 'production';

// Library Constants
export const LIBRARY_CONSTANTS = {
  VERSION: LIBRARY_VERSION,
  NAME: LIBRARY_NAME,
  AUTHOR: 'Lines Liaison Team',
  LICENSE: 'MIT',
  REPOSITORY: 'https://github.com/lines-liaison/library',
  DOCUMENTATION: 'https://docs.lines-liaison.com',
  SUPPORT: 'support@lines-liaison.com'
};