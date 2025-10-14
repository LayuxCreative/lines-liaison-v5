export interface User {
  id: string;
  name?: string; // For backward compatibility
  full_name: string; // Primary name field matching database
  email: string;
  role: "admin" | "project_manager" | "team_member" | "client";
  avatar?: string;
  avatar_url?: string; // Database field
  company?: string;
  department?: string; // Database field
  position?: string; // Database field
  phone?: string;
  status?: UserStatusType;
  last_seen?: Date; // Database field
  preferences?: Record<string, unknown>; // Database field
  additionalPermissions?: string[];
  // Two-Factor Authentication fields
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
  twoFactorBackupCodes?: string[];
  createdAt?: Date;
  created_at?: Date; // Database field
  updated_at?: Date; // Database field
}

export interface Project {
  id: string;
  name: string;
  description: string;
  projectCode: string;
  status: "planning" | "active" | "review" | "completed" | "on_hold";
  priority: "low" | "medium" | "high" | "critical";
  clientId: string;
  managerId: string;
  teamMembers: string[];
  startDate: Date;
  endDate: Date;
  progress: number;
  budget?: number;
  spent?: number;
  contractId?: string;
  category:
    | "BIM"
    | "ICE"
    | "Structural"
    | "MEP"
    | "Civil"
    | "Industrial"
    | "Training";
  files: ProjectFile[];
  createdAt: Date;
}

export interface FileActivity {
  id: string;
  userId: string;
  userName: string;
  action: "upload" | "view" | "edit" | "download" | "rename" | "replace";
  timestamp: Date;
  details?: string;
}

export interface FileVersion {
  id: string;
  version: number;
  name: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  changeDescription?: string;
}

export interface ProjectFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  projectId: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  lastModifiedBy: string;
  category:
    | "drawing"
    | "model"
    | "document"
    | "image"
    | "dwg"
    | "rvt"
    | "other";
  isApproved: boolean;
  version: number;
  thumbnail?: string;
  isExternal?: boolean;
  externalUrl?: string;
  description?: string;
  tags?: string[];
  activity: FileActivity[];
  versions: FileVersion[];
  viewCount: number;
  downloadCount: number;
}

export interface Message {
  id: string;
  projectId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  type: "message" | "file" | "system";
  attachments?: string[];
}

export interface Activity {
  id: string;
  projectId: string;
  userId: string;
  action: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, string | number | boolean>;
}

export interface Invoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  description: string;
  items: InvoiceItem[];
  taxAmount: number;
  totalAmount: number;
  clientId: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Contract {
  id: string;
  projectId: string;
  contractNumber: string;
  title: string;
  type: "service_agreement" | "consulting" | "maintenance" | "training";
  status: "draft" | "active" | "completed" | "terminated";
  startDate: Date;
  endDate: Date;
  value: number;
  currency: string;
  clientId: string;
  signedDate?: Date;
  documentUrl: string;
  terms: string[];
  createdAt: Date;
}

export interface Report {
  id: string;
  projectId: string;
  title: string;
  type: "progress" | "financial" | "technical" | "milestone" | "final";
  status: "draft" | "review" | "approved" | "published";
  content: string;
  attachments: string[];
  generatedBy: string;
  generatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  clientVisible: boolean;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "completed" | "blocked";
  priority: "low" | "medium" | "high" | "urgent";
  assigneeId: string;
  assigneeName: string;
  createdBy: string;
  createdAt: Date;
  dueDate: Date;
  completedAt?: Date;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  attachedFiles: string[];
  dependencies: string[];
  comments: TaskComment[];
  clickUpTaskId?: string;
  clickUpUrl?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: Date;
  attachments?: string[];
}

// Enhanced Dashboard Types
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  permissions: string[];
  isVisible: boolean;
  isCustomizable: boolean;
  refreshInterval?: number;
  lastUpdated: Date;
}

export type WidgetType =
  | "overview"
  | "notifications"
  | "inbox"
  | "calendar"
  | "tasks"
  | "projects"
  | "recent_activities"
  | "team_status"
  | "financial_summary"
  | "reports"
  | "files"
  | "custom";

export interface WidgetPosition {
  x: number;
  y: number;
  row: number;
  col: number;
}

export interface WidgetSize {
  width: number;
  height: number;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface WidgetConfig {
  theme?: Record<string, unknown>;
  showHeader?: Record<string, unknown>;
  showFooter?: boolean;
  autoRefresh?: boolean;
  filters?: Record<string, unknown>;
  [key: string]: string | number | boolean | Record<string, unknown> | undefined;
}

export interface DashboardLayout {
  id: string;
  userId: string;
  name: string;
  isDefault: boolean;
  widgets: DashboardWidget[];
  gridConfig: GridConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface GridConfig {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
  breakpoints: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
}

// Enhanced User Status System
export interface UserStatus {
  id: string;
  userId: string;
  status: UserStatusType;
  customMessage?: string;
  availableUntil?: Date;
  autoReply?: string;
  showToTeam: boolean;
  showToClients: boolean;
  updatedAt: Date;
}

export type UserStatusType =
  | "available"
  | "busy"
  | "away"
  | "in_meeting"
  | "on_break"
  | "out_of_office"
  | "vacation"
  | "sick_leave"
  | "custom";

// Enhanced Permission System
export interface Permission {
  id: string;
  name: string;
  description: string;
  category: PermissionCategory;
  level: PermissionLevel;
  resource: string;
  actions: PermissionAction[];
}

export type PermissionCategory =
  | "dashboard"
  | "projects"
  | "tasks"
  | "files"
  | "reports"
  | "financial"
  | "users"
  | "settings"
  | "communication";

export type PermissionLevel = "none" | "read" | "write" | "admin";

export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "share";

export interface UserPermissions {
  userId: string;
  rolePermissions: Permission[];
  customPermissions: Permission[];
  restrictions: PermissionRestriction[];
  inheritedFrom: string[];
  updatedAt: Date;
}

export interface PermissionRestriction {
  id: string;
  type: "time_based" | "ip_based" | "project_based" | "custom";
  conditions: Record<string, string | number | boolean>;
  isActive: boolean;
  expiresAt?: Date;
}

// Enhanced Notification System
export interface EnhancedNotification {
  id: string;
  userId: string;
  type: NotificationType;
  category: NotificationCategory;
  title: string;
  message: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  metadata: NotificationMetadata;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
}

export type NotificationType =
  | "system"
  | "project_update"
  | "task_assignment"
  | "deadline_reminder"
  | "approval_request"
  | "message"
  | "file_upload"
  | "payment"
  | "security"
  | "custom";

export type NotificationCategory =
  | "urgent"
  | "work"
  | "administrative"
  | "social"
  | "financial"
  | "security"
  | "system";

export type NotificationPriority = "low" | "medium" | "high" | "critical";

export type NotificationStatus = "unread" | "read" | "archived" | "dismissed";

export interface NotificationMetadata {
  projectId?: string;
  taskId?: string;
  senderId?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  customData?: Record<string, string | number | boolean>;
}

export interface NotificationSettings {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  categories: Record<NotificationCategory, boolean>;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  frequency: "immediate" | "hourly" | "daily" | "weekly";
  updatedAt: Date;
}

// Dashboard Analytics
export interface DashboardAnalytics {
  userId: string;
  widgetUsage: Record<string, number>;
  timeSpent: Record<string, number>;
  lastAccessed: Record<string, Date>;
  customizations: number;
  layoutChanges: number;
  period: AnalyticsPeriod;
  generatedAt: Date;
}

export type AnalyticsPeriod = "daily" | "weekly" | "monthly" | "yearly";

// Calendar Integration
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  type: CalendarEventType;
  projectId?: string;
  taskId?: string;
  attendees: string[];
  location?: string;
  isRecurring: boolean;
  recurrenceRule?: string;
  reminders: EventReminder[];
  createdBy: string;
  createdAt: Date;
}

export type CalendarEventType =
  | "meeting"
  | "deadline"
  | "milestone"
  | "review"
  | "training"
  | "vacation"
  | "personal"
  | "other";

export interface EventReminder {
  id: string;
  type: "email" | "push" | "popup";
  minutesBefore: number;
  isActive: boolean;
}

// File Upload Types
export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  projectId?: string;
  userId: string;
  uploadedAt: Date;
  category: FileCategory;
  isPublic: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export type FileCategory =
  | "document"
  | "image"
  | "video"
  | "audio"
  | "archive"
  | "drawing"
  | "model"
  | "dwg"
  | "rvt"
  | "other";

export interface FileUploadConfig {
  maxFileSize: number;
  allowedTypes: string[];
  maxFiles: number;
  enableDragDrop: boolean;
  enablePreview: boolean;
}

export interface PermissionGroup {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Role {
  id: string;
  name: string;
  display_name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PermissionItem {
  id: string;
  name: string;
  display_name: string;
  description: string;
  category: string;
  resource: string;
  action: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Realtime Types
export interface RealtimeMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'file' | 'system' | 'typing' | 'update';
  metadata?: Record<string, unknown>;
}

export interface RealtimeUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: Date;
}

export interface ProjectChannel {
  id: string;
  projectId: string;
  projectName: string;
  participants: string[];
  lastActivity: Date;
  isActive: boolean;
}

export interface TaskChannel {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  assignees: string[];
  participants: string[];
  lastActivity: Date;
  isActive: boolean;
}
