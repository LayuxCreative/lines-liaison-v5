import React, { useReducer, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabaseService, type NotificationData } from '../services/supabaseService';
import { EnhancedNotification, NotificationSettings, NotificationCategory, NotificationPriority, NotificationType, NotificationStatus } from '../types';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { NotificationContext, type NotificationContextType, type NotificationAction, type NotificationState } from './NotificationContextBase';

const initialState: NotificationState = {
  notifications: [],
  settings: {
    userId: '',
    emailNotifications: true,
    pushNotifications: true,
    inAppNotifications: true,
    categories: {
      urgent: true,
      work: true,
      administrative: true,
      social: true,
      financial: true,
      security: true,
      system: true,
    },
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
    },
    frequency: 'immediate',
    updatedAt: new Date(),
  },
  isLoading: false,
  error: null,
  unreadCount: 0,
  toastNotifications: [],
};

const notificationReducer = (
  state: NotificationState,
  action: NotificationAction,
): NotificationState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'SET_NOTIFICATIONS': {
      const notifications = action.payload;
      const unreadCount = notifications.filter((n) => n.status === 'unread').length;
      return { ...state, notifications, unreadCount, isLoading: false };
    }
    case 'ADD_NOTIFICATION': {
      const newNotification = action.payload;
      const notifications = [newNotification, ...state.notifications];
      const unreadCount = notifications.filter((n) => n.status === 'unread').length;
      return { ...state, notifications, unreadCount };
    }
    case 'UPDATE_NOTIFICATION': {
      const { id, updates } = action.payload;
      const notifications = state.notifications.map((n) => (n.id === id ? { ...n, ...updates } : n));
      const unreadCount = notifications.filter((n) => n.status === 'unread').length;
      return { ...state, notifications, unreadCount };
    }
    case 'DELETE_NOTIFICATION': {
      const notifications = state.notifications.filter((n) => n.id !== action.payload);
      const unreadCount = notifications.filter((n) => n.status === 'unread').length;
      return { ...state, notifications, unreadCount };
    }
    case 'MARK_AS_READ': {
      const notifications = state.notifications.map((n) => (n.id === action.payload ? { ...n, status: 'read' } : n));
      const unreadCount = notifications.filter((n) => n.status === 'unread').length;
      return { ...state, notifications, unreadCount };
    }
    case 'MARK_ALL_AS_READ': {
      const notifications = state.notifications.map((n) => (n.status === 'unread' ? { ...n, status: 'read' } : n));
      return { ...state, notifications, unreadCount: 0 };
    }
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload };
    case 'UPDATE_SETTINGS': {
      const settings = { ...state.settings, ...action.payload, updatedAt: new Date() };
      return { ...state, settings };
    }
    case 'ADD_TOAST': {
      const toastNotifications = [...state.toastNotifications, action.payload];
      return { ...state, toastNotifications };
    }
    case 'REMOVE_TOAST': {
      const toastNotifications = state.toastNotifications.filter((n) => n.id !== action.payload);
      return { ...state, toastNotifications };
    }
    case 'CLEAR_TOASTS':
      return { ...state, toastNotifications: [] };
    default:
      return state;
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  const generateId = useCallback(() => `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, []);

  const parseTime = useCallback((time: string) => {
    const [hStr, mStr] = (time ?? '').split(':');
    const h = Number(hStr);
    const m = Number(mStr);
    return {
      hours: Number.isFinite(h) && h >= 0 ? h : 0,
      minutes: Number.isFinite(m) && m >= 0 ? m : 0,
    };
  }, []);

  const isQuietHours = useCallback(() => {
    if (!state.settings.quietHours.enabled) return false;
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const { hours: startHour, minutes: startMin } = parseTime(state.settings.quietHours.startTime || '00:00');
    const { hours: endHour, minutes: endMin } = parseTime(state.settings.quietHours.endTime || '00:00');
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    }
    return currentTime >= startTime || currentTime <= endTime; // spans midnight
  }, [state.settings.quietHours, parseTime]);

  const shouldShowNotification = useCallback(
    (notification: EnhancedNotification) => {
      if (!state.settings.categories[notification.category]) return false;
      if (isQuietHours() && notification.priority !== 'critical') return false;
      return true;
    },
    [state.settings.categories, isQuietHours],
  );

  const convertSupabaseNotification = useCallback(
    (api: NotificationData): EnhancedNotification => {
      const obj: EnhancedNotification = {
        id: api.id ?? generateId(),
        userId: api.user_id,
        type: (api.type ?? 'system') as NotificationType,
        category: 'system',
        title: api.title,
        message: api.message,
        priority: 'medium',
        status: (api.read ? 'read' : 'unread') as NotificationStatus,
        actionRequired: false,
        metadata: {},
        createdAt: api.created_at ? new Date(api.created_at) : new Date(),
      };
      if (api.read) {
        obj.readAt = api.created_at ? new Date(api.created_at) : new Date();
      }
      return obj;
    },
    [generateId],
  );

  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await supabaseService.getNotifications(user.id);
      if (response.success && response.data) {
        const converted = (response.data as NotificationData[]).map(convertSupabaseNotification);
        dispatch({ type: 'SET_NOTIFICATIONS', payload: converted });
      } else {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user?.id, convertSupabaseNotification]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.id) return;
    let subscription: RealtimeChannel | { unsubscribe?: () => void } | null = null;
    const setup = async () => {
      try {
        subscription = await supabaseService.subscribeToNotifications(user.id, (payload: Record<string, unknown>) => {
          const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE' | undefined;
          const newRow = payload.new as NotificationData | undefined;
          const oldRow = payload.old as NotificationData | undefined;
          if (eventType === 'INSERT' && newRow) {
            dispatch({ type: 'ADD_NOTIFICATION', payload: convertSupabaseNotification(newRow) });
          } else if (eventType === 'UPDATE' && newRow) {
            const updated = convertSupabaseNotification(newRow);
            dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id: updated.id, updates: updated } });
          } else if (eventType === 'DELETE' && oldRow?.id) {
            dispatch({ type: 'DELETE_NOTIFICATION', payload: oldRow.id });
          }
        });
      } catch (err) {
        console.warn('Realtime subscription error:', err);
      }
    };
    setup();
    return () => {
      if (subscription) {
        supabaseService.unsubscribe(subscription);
      }
    };
  }, [user?.id, convertSupabaseNotification]);

  const addNotification = useCallback(
    (notificationData: Omit<EnhancedNotification, 'id' | 'createdAt' | 'updatedAt'>) => {
      const notification: EnhancedNotification = {
        ...notificationData,
        id: generateId(),
        createdAt: new Date(),
      } as EnhancedNotification;
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
      if (state.settings.inAppNotifications && shouldShowNotification(notification)) {
        dispatch({ type: 'ADD_TOAST', payload: notification });
      }
      if (user?.id) {
        supabaseService
          .createNotification({
            title: notification.title,
            message: notification.message,
            type: notification.type,
            user_id: user.id,
          })
          .catch((error) => {
            console.error('Error creating notification:', error);
            dispatch({ type: 'DELETE_NOTIFICATION', payload: notification.id });
          });
      }
    },
    [generateId, state.settings.inAppNotifications, shouldShowNotification, user?.id],
  );

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: id });
    supabaseService.markNotificationAsRead(id).catch((error) => {
      console.error('Error marking notification as read:', error);
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
    if (user?.id) {
      supabaseService.markAllNotificationsAsRead(user.id).catch((error) => {
        console.error('Error marking all notifications as read:', error);
      });
    }
  }, [user?.id]);

  const deleteNotification = useCallback((id: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', payload: id });
    dispatch({ type: 'REMOVE_TOAST', payload: id });
    supabaseService.deleteNotification(id).catch((error) => {
      console.error('Error deleting notification:', error);
    });
  }, []);

  const updateSettings = useCallback((settings: Partial<NotificationSettings>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  }, []);

  const showToast = useCallback(
    (notificationData: Omit<EnhancedNotification, 'id' | 'createdAt' | 'updatedAt'>) => {
      const notification: EnhancedNotification = {
        ...notificationData,
        id: generateId(),
        createdAt: new Date(),
      } as EnhancedNotification;
      if (shouldShowNotification(notification)) {
        dispatch({ type: 'ADD_TOAST', payload: notification });
      }
    },
    [generateId, shouldShowNotification],
  );

  const removeToast = useCallback((id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  }, []);

  const getFilteredNotifications = useCallback(
    (filters: { category?: NotificationCategory; priority?: NotificationPriority; status?: 'read' | 'unread'; search?: string } = {}) => {
      let filtered = state.notifications;
      if (filters.category) filtered = filtered.filter((n) => n.category === filters.category);
      if (filters.priority) filtered = filtered.filter((n) => n.priority === filters.priority);
      if (filters.status) filtered = filtered.filter((n) => n.status === filters.status);
      if (filters.search) {
        const q = filters.search.toLowerCase();
        filtered = filtered.filter((n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
      }
      return filtered;
    },
    [state.notifications],
  );

  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`notification_settings_${user.id}`, JSON.stringify({ ...state.settings, userId: user.id }));
      } catch (err) {
        console.warn('Failed to save notification settings:', err);
      }
    }
  }, [state.settings, user?.id]);

  const contextValue: NotificationContextType = useMemo(
    () => ({
      state,
      dispatch,
      addNotification,
      markAsRead,
      markAllAsRead,
      deleteNotification,
      updateSettings,
      showToast,
      removeToast,
      getFilteredNotifications,
      loadNotifications,
    }),
    [state, addNotification, markAsRead, markAllAsRead, deleteNotification, updateSettings, showToast, removeToast, getFilteredNotifications, loadNotifications],
  );

  return <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>;
};

export default NotificationProvider;
