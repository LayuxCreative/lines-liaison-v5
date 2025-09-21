import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { supabase } from "../config/supabase";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  timestamp: Date;
  isRead: boolean;
  userId: string;
  projectId?: string;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp" | "isRead">,
  ) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

// Supabase data conversion functions
const convertSupabaseNotification = (data: {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read?: boolean;
  user_id: string;
  project_id?: string;
  action_url?: string;
}): Notification => ({
  id: data.id,
  title: data.title,
  message: data.message,
  type: (['error', 'success', 'warning', 'info'].includes(data.type) ? data.type : 'info') as Notification['type'],
  timestamp: new Date(data.created_at),
  isRead: data.read || false,
  userId: data.user_id,
  projectId: data.project_id,
  actionUrl: data.action_url,
});

// Fix Fast Refresh compatibility - move export to top level
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setLoading] = useState(true);

  // Load notifications from Supabase
  const loadNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );

      const queryPromise = supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50); // Limit to prevent large data loads

      const result = await Promise.race([queryPromise, timeoutPromise]);
      const { data, error } = result as { data: unknown; error: unknown };

      if (error) {
        throw error;
      }

      const convertedNotifications =
        Array.isArray(data) ? data.map(convertSupabaseNotification) : [];
      setNotifications(convertedNotifications);
    } catch (error) {
      console.error("Error loading notifications:", error);
      // Set empty array on error to prevent UI issues
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (isMounted) {
        await loadNotifications();
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user?.id]); // Only depend on user.id to prevent unnecessary re-renders

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const addNotification = async (
    notificationData: Omit<Notification, "id" | "timestamp" | "isRead">,
  ) => {
    // Add notification locally first for immediate UI feedback
    const fallbackNotification: Notification = {
      id: `temp-${Date.now()}`,
      ...notificationData,
      timestamp: new Date(),
      isRead: false,
    };
    setNotifications((prev) => [fallbackNotification, ...prev]);

    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      const insertPromise = supabase
        .from("notifications")
        .insert({
          title: notificationData.title,
          message: notificationData.message,
          type: notificationData.type,
          user_id: notificationData.userId,
          project_id: notificationData.projectId,
          action_url: notificationData.actionUrl,
          read: false,
        })
        .select()
        .single();

      const result = await Promise.race([insertPromise, timeoutPromise]);
      const { data, error } = result as { data: unknown; error: unknown };

      if (error) {
        throw error;
      }

      // Replace temp notification with real one
      if (data) {
        const newNotification = convertSupabaseNotification(data as any);
        setNotifications((prev) => 
          prev.map(n => n.id === fallbackNotification.id ? newNotification : n)
        );
      }
    } catch (error) {
      console.error("Error adding notification:", error);
      // Keep the fallback notification if database fails
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .or(`user_id.eq.${user.id},user_id.eq.all`);

      if (error) throw error;

      setNotifications((prev) =>
        prev.map((notification) => ({ ...notification, isRead: true })),
      );
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", notificationId);

      if (error) throw error;

      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId),
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .or(`user_id.eq.${user.id},user_id.eq.all`);

      if (error) throw error;

      setNotifications([]);
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAllNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

NotificationProvider.displayName = 'NotificationProvider';

export default NotificationProvider;
