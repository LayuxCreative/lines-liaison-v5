// Dashboard Pages - Organized dashboard page types and utilities

// Dashboard page types
export interface DashboardPageProps {
  user: User;
  projects: Project[];
  tasks: Task[];
  notifications: Notification[];
  loading?: boolean;
  error?: string;
}

export interface ProjectsPageProps {
  projects: Project[];
  onCreateProject: (project: CreateProjectData) => Promise<void>;
  onUpdateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface ProjectDetailsPageProps {
  project: Project;
  tasks: Task[];
  files: ProjectFile[];
  team: TeamMember[];
  onUpdateProject: (updates: Partial<Project>) => Promise<void>;
  onCreateTask: (task: CreateTaskData) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface TasksPageProps {
  tasks: Task[];
  projects: Project[];
  onCreateTask: (task: CreateTaskData) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface FilesPageProps {
  files: ProjectFile[];
  projects: Project[];
  onUploadFile: (file: File, projectId: string) => Promise<void>;
  onDeleteFile: (id: string) => Promise<void>;
  onDownloadFile: (id: string) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface CommunicationPageProps {
  rooms: ChatRoom[];
  messages: Message[];
  onSendMessage: (roomId: string, content: string) => Promise<void>;
  onCreateRoom: (room: CreateRoomData) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface ReportsPageProps {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  onGenerateReport: (config: ReportConfig) => Promise<void>;
  loading?: boolean;
  error?: string;
}

export interface SettingsPageProps {
  user: User;
  preferences: UserPreferences;
  onUpdateProfile: (updates: Partial<User>) => Promise<void>;
  onUpdatePreferences: (preferences: UserPreferences) => Promise<void>;
  loading?: boolean;
  error?: string;
}

// Additional data types
export interface TimeEntry {
  id: string;
  taskId: string;
  userId: string;
  hours: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface ReportConfig {
  type: 'project' | 'task' | 'time' | 'financial';
  dateRange: {
    start: string;
    end: string;
  };
  projectIds?: string[];
  userIds?: string[];
  format: 'pdf' | 'excel' | 'csv';
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    desktop: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    itemsPerPage: number;
  };
}

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface ProfilePageProps {
  user: User;
  projects: Project[];
  tasks: Task[];
  onUpdateProfile: (updates: Partial<User>) => Promise<void>;
  onUploadAvatar: (file: File) => Promise<void>;
  loading?: boolean;
  error?: string;
}

// Dashboard data types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  endDate?: string;
  budget?: number;
  progress: number;
  ownerId: string;
  teamIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  projectId: string;
  uploadedBy: string;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  userId: string;
  projectId: string;
  role: TeamRole;
  joinedAt: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: RoomType;
  projectId?: string;
  memberIds: string[];
  lastMessage?: Message;
  createdAt: string;
}

export interface Message {
  id: string;
  content: string;
  type: MessageType;
  roomId: string;
  senderId: string;
  replyToId?: string;
  attachments?: MessageAttachment[];
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

// Enums
export type UserRole = 'admin' | 'manager' | 'user' | 'client';
export type UserStatus = 'active' | 'inactive' | 'pending';
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
export type RoomType = 'project' | 'direct' | 'group';
export type MessageType = 'text' | 'file' | 'image' | 'system';
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

// Create data types
export interface CreateProjectData {
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  priority: Priority;
  teamIds?: string[];
}

export interface CreateTaskData {
  title: string;
  description: string;
  projectId: string;
  assigneeId?: string;
  dueDate?: string;
  priority: Priority;
  estimatedHours?: number;
  tags?: string[];
}

export interface CreateRoomData {
  name: string;
  type: RoomType;
  projectId?: string;
  memberIds: string[];
}

// Dashboard utilities
export const getDashboardPageClasses = (page: string) => {
  const baseClasses = 'min-h-screen bg-gray-50 dark:bg-gray-900';
  
  const pageClasses: Record<string, string> = {
    dashboard: 'p-6',
    projects: 'p-6',
    tasks: 'p-6',
    files: 'p-6',
    communication: 'p-4',
    reports: 'p-6',
    settings: 'p-6 max-w-4xl mx-auto',
    profile: 'p-6 max-w-3xl mx-auto'
  };
  
  return `${baseClasses} ${pageClasses[page] || 'p-6'}`;
};

export const getPageHeaderClasses = () => {
  return 'flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700';
};

export const getPageTitleClasses = () => {
  return 'text-2xl font-bold text-gray-900 dark:text-white';
};

export const getPageContentClasses = () => {
  return 'space-y-6';
};

export const getCardClasses = (variant: 'default' | 'elevated' | 'bordered' = 'default') => {
  const baseClasses = 'bg-white dark:bg-gray-800 rounded-lg shadow-sm';
  
  const variants = {
    default: 'p-6',
    elevated: 'p-6 shadow-lg',
    bordered: 'p-6 border border-gray-200 dark:border-gray-700'
  };
  
  return `${baseClasses} ${variants[variant]}`;
};

// Status utilities
export const getStatusColor = (status: ProjectStatus | TaskStatus): string => {
  const colors: Record<string, string> = {
    // Project statuses
    planning: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    on_hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    
    // Task statuses
    todo: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
  };
  
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getPriorityColor = (priority: Priority): string => {
  const colors: Record<Priority, string> = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
  };
  
  return colors[priority];
};

export const getRoleColor = (role: UserRole | TeamRole): string => {
  const colors: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    user: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    client: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    owner: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    member: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    viewer: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300'
  };
  
  return colors[role] || 'bg-gray-100 text-gray-800';
};

// Data formatting utilities
export const formatProgress = (progress: number): string => {
  return `${Math.round(progress)}%`;
};

export const formatBudget = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(date));
};

export const formatDateTime = (date: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Dashboard constants
export const DASHBOARD_CONSTANTS = {
  ITEMS_PER_PAGE: 20,
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  SUPPORTED_FILE_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  NOTIFICATION_TYPES: ['info', 'success', 'warning', 'error'] as const,
  REFRESH_INTERVALS: {
    NOTIFICATIONS: 30000, // 30 seconds
    MESSAGES: 5000, // 5 seconds
    DASHBOARD: 60000 // 1 minute
  }
};