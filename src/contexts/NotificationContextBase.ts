import { createContext } from 'react';
import {
  EnhancedNotification,
  NotificationSettings,
  NotificationCategory,
  NotificationPriority,
} from '../types';

export interface NotificationState {
  notifications: EnhancedNotification[];
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  toastNotifications: EnhancedNotification[];
}

export type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: EnhancedNotification[] }
  | { type: 'ADD_NOTIFICATION'; payload: EnhancedNotification }
  | { type: 'UPDATE_NOTIFICATION'; payload: { id: string; updates: Partial<EnhancedNotification> } }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_SETTINGS'; payload: NotificationSettings }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationSettings> }
  | { type: 'ADD_TOAST'; payload: EnhancedNotification }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'CLEAR_TOASTS' };

export interface NotificationContextType {
  state: NotificationState;
  dispatch: React.Dispatch<NotificationAction>;
  addNotification: (
    notification: Omit<EnhancedNotification, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  showToast: (
    notification: Omit<EnhancedNotification, 'id' | 'createdAt' | 'updatedAt'>,
  ) => void;
  removeToast: (id: string) => void;
  getFilteredNotifications: (filters?: {
    category?: NotificationCategory;
    priority?: NotificationPriority;
    status?: 'read' | 'unread';
    search?: string;
  }) => EnhancedNotification[];
  loadNotifications: () => Promise<void>;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);