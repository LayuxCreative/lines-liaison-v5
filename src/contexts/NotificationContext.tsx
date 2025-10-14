import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '../services/supabaseService';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  loadNotifications: () => Promise<void>;
}

interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  is_read: boolean;
  action_url?: string;
}

const convertSupabaseNotification = (apiNotification: ApiNotification): Notification => ({
  id: apiNotification.id,
  title: apiNotification.title,
  message: apiNotification.message,
  type: apiNotification.type as 'success' | 'error' | 'warning' | 'info',
  timestamp: new Date(apiNotification.created_at),
  isRead: apiNotification.is_read,
  actionUrl: apiNotification.action_url,
});

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Memoize the loadNotifications function to prevent unnecessary re-renders
  const loadNotifications = useCallback(async () => {
    if (isLoading) return; // Prevent multiple simultaneous loads
    
    try {
      setIsLoading(true);
      const response = await supabaseService.getNotifications();
      
      if (response.success && response.data) {
        const convertedNotifications = response.data.map(convertSupabaseNotification);
        setNotifications(convertedNotifications);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  // Load notifications on mount
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Memoize the addNotification function
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false,
    };

    // Optimistic UI update
    setNotifications(prev => [newNotification, ...prev]);

    // Sync with backend
    supabaseService.createNotification({
      title: notification.title,
      message: notification.message,
      type: notification.type,
      action_url: notification.actionUrl,
    }).catch(error => {
      console.error('Error creating notification:', error);
      // Revert optimistic update on error
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    });
  }, []);

  // Memoize the markAsRead function
  const markAsRead = useCallback(async (id: string) => {
    // Optimistic UI update
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );

    try {
      await supabaseService.markNotificationAsRead(id);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: false }
            : notification
        )
      );
    }
  }, []);

  // Memoize the markAllAsRead function
  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    
    if (unreadIds.length === 0) return;

    // Optimistic UI update
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );

    try {
      await supabaseService.markAllNotificationsAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      // Revert optimistic update on error
      setNotifications(prev => 
        prev.map(notification => 
          unreadIds.includes(notification.id)
            ? { ...notification, isRead: false }
            : notification
        )
      );
    }
  }, [notifications]);

  // Memoize the deleteNotification function
  const deleteNotification = useCallback(async (id: string) => {
    // Optimistic UI update
    const notificationToDelete = notifications.find(n => n.id === id);
    setNotifications(prev => prev.filter(notification => notification.id !== id));

    try {
      await supabaseService.deleteNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
      // Revert optimistic update on error
      if (notificationToDelete) {
        setNotifications(prev => [notificationToDelete, ...prev]);
      }
    }
  }, [notifications]);

  // Memoize the unread count calculation
  const unreadCount = useMemo(() => {
    return notifications.filter(notification => !notification.isRead).length;
  }, [notifications]);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loadNotifications,
  }), [notifications, unreadCount, addNotification, markAsRead, markAllAsRead, deleteNotification, loadNotifications]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Export the context for backward compatibility
export { NotificationContext };
