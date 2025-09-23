// Pages Library - Organized page exports and utilities
// Re-export all from subdirectories
export * from './auth';
export type {
  DashboardPageProps,
  ProjectsPageProps,
  TasksPageProps,
  FilesPageProps,
  CommunicationPageProps,
  ReportsPageProps,
  SettingsPageProps,
  ProfilePageProps,
  ProjectDetailsPageProps,
  Project,
  Task,
  ProjectFile,
  TeamMember,
  ChatRoom,
  Message,
  Notification,
  User,
  TimeEntry,
  ReportConfig,
  UserPreferences,
  MessageAttachment,
  CreateProjectData,
  CreateTaskData,
  CreateRoomData,
  UserRole,
  UserStatus,
  ProjectStatus,
  TaskStatus,
  Priority,
  TeamRole,
  RoomType,
  MessageType,
  NotificationType
} from './dashboard';
export {
  getDashboardPageClasses,
  getPageHeaderClasses,
  getPageTitleClasses,
  getPageContentClasses,
  getCardClasses,
  getStatusColor,
  getPriorityColor,
  getRoleColor,
  formatProgress,
  formatBudget,
  formatDate,
  formatDateTime,
  formatFileSize,
  DASHBOARD_CONSTANTS
} from './dashboard';
export * from './public';

// Page categories
export type PageCategory = 'auth' | 'dashboard' | 'public';

// Page registry for dynamic imports and routing
export const PAGE_REGISTRY = {
  auth: {
    login: () => import('./auth'),
    register: () => import('./auth'),
    'forgot-password': () => import('./auth'),
    'reset-password': () => import('./auth'),
    'verify-email': () => import('./auth')
  },
  dashboard: {
    dashboard: () => import('./dashboard'),
    projects: () => import('./dashboard'),
    'project-details': () => import('./dashboard'),
    tasks: () => import('./dashboard'),
    files: () => import('./dashboard'),
    communication: () => import('./dashboard'),
    reports: () => import('./dashboard'),
    settings: () => import('./dashboard'),
    profile: () => import('./dashboard')
  },
  public: {
    home: () => import('./public'),
    about: () => import('./public'),
    services: () => import('./public'),
    contact: () => import('./public'),
    pricing: () => import('./public'),
    blog: () => import('./public'),
    'blog-post': () => import('./public')
  }
};

// Page metadata and configuration
export interface PageConfig {
  title: string;
  description: string;
  category: PageCategory;
  requiresAuth: boolean;
  roles?: string[];
  layout?: string;
  breadcrumbs?: Breadcrumb[];
}

export interface Breadcrumb {
  label: string;
  href?: string;
  active?: boolean;
}

export const PAGE_CONFIGS: Record<string, PageConfig> = {
  // Auth pages
  login: {
    title: 'Login',
    description: 'Sign in to your account',
    category: 'auth',
    requiresAuth: false
  },
  register: {
    title: 'Register',
    description: 'Create a new account',
    category: 'auth',
    requiresAuth: false
  },
  'forgot-password': {
    title: 'Forgot Password',
    description: 'Reset your password',
    category: 'auth',
    requiresAuth: false
  },
  'reset-password': {
    title: 'Reset Password',
    description: 'Set your new password',
    category: 'auth',
    requiresAuth: false
  },
  'verify-email': {
    title: 'Verify Email',
    description: 'Verify your email address',
    category: 'auth',
    requiresAuth: false
  },
  
  // Dashboard pages
  dashboard: {
    title: 'Dashboard',
    description: 'Overview of your projects and tasks',
    category: 'dashboard',
    requiresAuth: true,
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', active: true }
    ]
  },
  projects: {
    title: 'Projects',
    description: 'Manage your projects',
    category: 'dashboard',
    requiresAuth: true,
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Projects', active: true }
    ]
  },
  'project-details': {
    title: 'Project Details',
    description: 'View and manage project details',
    category: 'dashboard',
    requiresAuth: true,
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Projects', href: '/dashboard/projects' },
      { label: 'Project Details', active: true }
    ]
  },
  tasks: {
    title: 'Tasks',
    description: 'Manage your tasks',
    category: 'dashboard',
    requiresAuth: true,
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Tasks', active: true }
    ]
  },
  files: {
    title: 'Files',
    description: 'Manage project files',
    category: 'dashboard',
    requiresAuth: true,
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Files', active: true }
    ]
  },
  communication: {
    title: 'Communication',
    description: 'Team chat and messaging',
    category: 'dashboard',
    requiresAuth: true,
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Communication', active: true }
    ]
  },
  reports: {
    title: 'Reports',
    description: 'Generate and view reports',
    category: 'dashboard',
    requiresAuth: true,
    roles: ['admin', 'manager'],
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Reports', active: true }
    ]
  },
  settings: {
    title: 'Settings',
    description: 'Account and application settings',
    category: 'dashboard',
    requiresAuth: true,
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Settings', active: true }
    ]
  },
  profile: {
    title: 'Profile',
    description: 'View and edit your profile',
    category: 'dashboard',
    requiresAuth: true,
    layout: 'dashboard',
    breadcrumbs: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Profile', active: true }
    ]
  },
  
  // Public pages
  home: {
    title: 'Home',
    description: 'Welcome to Lines Liaison',
    category: 'public',
    requiresAuth: false,
    layout: 'public'
  },
  about: {
    title: 'About Us',
    description: 'Learn more about our company',
    category: 'public',
    requiresAuth: false,
    layout: 'public'
  },
  services: {
    title: 'Our Services',
    description: 'Discover our services',
    category: 'public',
    requiresAuth: false,
    layout: 'public'
  },
  contact: {
    title: 'Contact Us',
    description: 'Get in touch with us',
    category: 'public',
    requiresAuth: false,
    layout: 'public'
  },
  pricing: {
    title: 'Pricing',
    description: 'View our pricing plans',
    category: 'public',
    requiresAuth: false,
    layout: 'public'
  },
  blog: {
    title: 'Blog',
    description: 'Read our latest articles',
    category: 'public',
    requiresAuth: false,
    layout: 'public'
  },
  'blog-post': {
    title: 'Blog Post',
    description: 'Read the full article',
    category: 'public',
    requiresAuth: false,
    layout: 'public'
  }
};

// Page utilities
export const getPagesByCategory = (category: PageCategory) => {
  return PAGE_REGISTRY[category];
};

export const getAllPages = () => {
  return Object.values(PAGE_REGISTRY).reduce((acc, category) => {
    return { ...acc, ...category };
  }, {});
};

export const getPageConfig = (pageName: string): PageConfig | undefined => {
  return PAGE_CONFIGS[pageName];
};

export const isPageProtected = (pageName: string): boolean => {
  const config = getPageConfig(pageName);
  return config?.requiresAuth || false;
};

export const canUserAccessPage = (pageName: string, userRole?: string): boolean => {
  const config = getPageConfig(pageName);
  if (!config) return false;
  
  if (!config.requiresAuth) return true;
  if (!userRole) return false;
  if (!config.roles) return true;
  
  return config.roles.includes(userRole);
};

export const generateBreadcrumbs = (pageName: string, params?: Record<string, string>): Breadcrumb[] => {
  const config = getPageConfig(pageName);
  if (!config?.breadcrumbs) return [];
  
  return config.breadcrumbs.map(breadcrumb => {
    if (params && breadcrumb.href) {
      // Replace parameters in href
      let href = breadcrumb.href;
      Object.entries(params).forEach(([key, value]) => {
        href = href.replace(`:${key}`, value);
      });
      return { ...breadcrumb, href };
    }
    return breadcrumb;
  });
};

// Page loading utilities
export const loadPage = async (category: PageCategory, pageName: string) => {
  const categoryPages = PAGE_REGISTRY[category];
  if (categoryPages && categoryPages[pageName as keyof typeof categoryPages]) {
    return await categoryPages[pageName as keyof typeof categoryPages]();
  }
  throw new Error(`Page ${pageName} not found in category ${category}`);
};

export const preloadPage = (category: PageCategory, pageName: string) => {
  const categoryPages = PAGE_REGISTRY[category];
  if (categoryPages && categoryPages[pageName as keyof typeof categoryPages]) {
    // Preload the page module
    categoryPages[pageName as keyof typeof categoryPages]();
  }
};

// Route generation utilities
export const generateRoute = (pageName: string, params?: Record<string, string>): string => {
  const config = getPageConfig(pageName);
  if (!config) return '/';
  
  let route = '';
  
  switch (config.category) {
    case 'auth':
      route = `/auth/${pageName}`;
      break;
    case 'dashboard':
      route = pageName === 'dashboard' ? '/dashboard' : `/dashboard/${pageName}`;
      break;
    case 'public':
      route = pageName === 'home' ? '/' : `/${pageName}`;
      break;
  }
  
  // Replace parameters in route
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      route = route.replace(`:${key}`, value);
    });
  }
  
  return route;
};

export const parseRoute = (pathname: string): { category: PageCategory; pageName: string; params?: Record<string, string> } | null => {
  // Remove leading slash
  const path = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  const segments = path.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return { category: 'public', pageName: 'home' };
  }
  
  if (segments[0] === 'auth') {
    return {
      category: 'auth',
      pageName: segments[1] || 'login'
    };
  }
  
  if (segments[0] === 'dashboard') {
    return {
      category: 'dashboard',
      pageName: segments[1] || 'dashboard'
    };
  }
  
  // Public pages
  return {
    category: 'public',
    pageName: segments[0]
  };
};

// Page transition utilities
export interface PageTransition {
  enter: string;
  exit: string;
  duration: number;
}

export const PAGE_TRANSITIONS: Record<string, PageTransition> = {
  default: {
    enter: 'opacity-0 translate-y-4',
    exit: 'opacity-100 translate-y-0',
    duration: 300
  },
  slide: {
    enter: 'opacity-0 translate-x-full',
    exit: 'opacity-100 translate-x-0',
    duration: 400
  },
  fade: {
    enter: 'opacity-0',
    exit: 'opacity-100',
    duration: 200
  },
  scale: {
    enter: 'opacity-0 scale-95',
    exit: 'opacity-100 scale-100',
    duration: 300
  }
};

export const getPageTransition = (pageName: string): PageTransition => {
  const config = getPageConfig(pageName);
  
  // Different transitions for different page categories
  switch (config?.category) {
    case 'auth':
      return PAGE_TRANSITIONS.fade;
    case 'dashboard':
      return PAGE_TRANSITIONS.slide;
    case 'public':
      return PAGE_TRANSITIONS.default;
    default:
      return PAGE_TRANSITIONS.default;
  }
};

// Page constants
export const PAGE_CONSTANTS = {
  DEFAULT_TITLE: 'Lines Liaison',
  TITLE_SEPARATOR: ' - ',
  DEFAULT_DESCRIPTION: 'Project management and team collaboration platform',
  DEFAULT_LAYOUT: 'default',
  PROTECTED_REDIRECT: '/auth/login',
  UNAUTHORIZED_REDIRECT: '/dashboard',
  HOME_REDIRECT: '/',
  DASHBOARD_REDIRECT: '/dashboard',
  TRANSITION_DURATION: 300,
  PRELOAD_DELAY: 100
};