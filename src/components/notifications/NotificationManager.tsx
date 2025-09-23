import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { useAuth } from '../../contexts/AuthContext';

// Types
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  notificationType: 'system' | 'user' | 'project' | 'task';
  userId: string;
  priority: 'low' | 'medium' | 'high';
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationState {
  notifications: Notification[];
  isLoading: boolean;
  error: string | null;
  settings: {
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableSoundNotifications: boolean;
    notificationFrequency: 'immediate' | 'hourly' | 'daily';
  };
}

export type NotificationAction =
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'> }
  | { type: 'UPDATE_NOTIFICATION'; payload: Partial<Notification> & { id: string } }
  | { type: 'DELETE_NOTIFICATION'; payload: { id: string } }
  | { type: 'MARK_AS_READ'; payload: { id: string } }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<NotificationState['settings']> };

const initialState: NotificationState = {
  notifications: [],
  isLoading: false,
  error: null,
  settings: {
    enablePushNotifications: true,
    enableEmailNotifications: true,
    enableSoundNotifications: true,
    notificationFrequency: 'immediate',
  },
};

const notificationReducer = (state: NotificationState, action: NotificationAction): NotificationState => {
  switch (action.type) {
    case 'SET_NOTIFICATIONS':
      return {
        ...state,
        notifications: action.payload,
        error: null,
      };

    case 'ADD_NOTIFICATION': {
      const newNotification: Notification = {
        ...action.payload,
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date(),
        isRead: false,
      };
      return {
        ...state,
        notifications: [newNotification, ...state.notifications],
      };
    }

    case 'UPDATE_NOTIFICATION': {
      const updatedNotifications = state.notifications.map(notification =>
        notification.id === action.payload.id
          ? { ...notification, ...action.payload, updatedAt: new Date() }
          : notification
      );
      return {
        ...state,
        notifications: updatedNotifications,
      };
    }

    case 'DELETE_NOTIFICATION': {
      const filteredNotifications = state.notifications.filter(
        notification => notification.id !== action.payload.id
      );
      return {
        ...state,
        notifications: filteredNotifications,
      };
    }

    case 'MARK_AS_READ': {
      const markedNotifications = state.notifications.map(notification =>
        notification.id === action.payload.id
          ? { ...notification, isRead: true, updatedAt: new Date() }
          : notification
      );
      return {
        ...state,
        notifications: markedNotifications,
      };
    }

    case 'MARK_ALL_AS_READ': {
      const allMarkedNotifications = state.notifications.map(notification => ({
        ...notification,
        isRead: true,
        updatedAt: new Date(),
      }));
      return {
        ...state,
        notifications: allMarkedNotifications,
      };
    }

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload,
        },
      };

    default:
      return state;
  }
};

// Context
const NotificationContext = createContext<{
  state: NotificationState;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  deleteNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  updateSettings: (settings: Partial<NotificationState['settings']>) => void;
  getNotificationsByCategory: (category: string) => Notification[];
  getNotificationsByPriority: (priority: 'low' | 'medium' | 'high') => Notification[];
} | null>(null);

// Provider
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user } = useAuth();

  // Add notification
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt' | 'isRead'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  // Update notification
  const updateNotification = (id: string, updates: Partial<Notification>) => {
    dispatch({ type: 'UPDATE_NOTIFICATION', payload: { id, ...updates } });
  };

  // Delete notification
  const deleteNotification = (id: string) => {
    dispatch({ type: 'DELETE_NOTIFICATION', payload: { id } });
  };

  // Mark as read
  const markAsRead = (id: string) => {
    dispatch({ type: 'MARK_AS_READ', payload: { id } });
  };

  // Mark all as read
  const markAllAsRead = () => {
    dispatch({ type: 'MARK_ALL_AS_READ' });
  };

  // Update settings
  const updateSettings = (settings: Partial<NotificationState['settings']>) => {
    dispatch({ type: 'UPDATE_SETTINGS', payload: settings });
  };

  // Get notifications by category
  const getNotificationsByCategory = (category: string): Notification[] => {
    return state.notifications.filter(notification => notification.category === category);
  };

  // Get notifications by priority
  const getNotificationsByPriority = (priority: 'low' | 'medium' | 'high'): Notification[] => {
    return state.notifications.filter(notification => notification.priority === priority);
  };

  // Load notifications on mount
  useEffect(() => {
    if (!user) return;

    const loadNotifications = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const notifications = await supabaseService.getNotifications(user.id);
         dispatch({ type: 'SET_NOTIFICATIONS', payload: notifications as unknown as Notification[] });
      } catch (loadError) {
        console.error('Failed to load notifications:', loadError);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load notifications' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadNotifications();
  }, [user]);

  // Setup realtime subscription
  useEffect(() => {
    if (!user) return;

    let subscription: any = null;

    const setupSubscription = async () => {
      try {
        subscription = await supabaseService.subscribeToNotifications(
          user.id,
          (payload: any) => {
            if (payload.eventType === 'INSERT') {
              const newNotification = payload.new as Notification;
              dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
            } else if (payload.eventType === 'UPDATE') {
              const updatedNotification = payload.new as Notification;
              dispatch({ type: 'UPDATE_NOTIFICATION', payload: updatedNotification });
            } else if (payload.eventType === 'DELETE') {
              const deletedNotification = payload.old as Notification;
              dispatch({ type: 'DELETE_NOTIFICATION', payload: { id: deletedNotification.id } });
            }
          }
        );
      } catch (subscriptionError) {
        console.warn('Realtime subscription error:', subscriptionError);
      }
    };

    setupSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        supabaseService.unsubscribe(subscription);
      }
    };
  }, [user]);

  const value = {
    state,
    addNotification,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAllAsRead,
    updateSettings,
    getNotificationsByCategory,
    getNotificationsByPriority,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationProvider;
