// @refresh reset
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { nodeApiService } from "../services/nodeApiService";
import { activityLogger } from "../utils/activityLogger";

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
interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read?: boolean;
  user_id: string;
  project_id?: string;
  action_url?: string;
}

const convertSupabaseNotification = (data: ApiNotification): Notification => ({
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

// Fix Fast Refresh compatibility - use function declaration
function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [, setLoading] = useState(true);

  // Load notifications via Node.js API
  const loadNotifications = async () => {
    if (!user?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await nodeApiService.getNotifications(user.id);
      if (response.success && response.data) {
        setNotifications((response.data as unknown as ApiNotification[]).map(convertSupabaseNotification));
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
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
    try {
      await activityLogger.log("notification_create", "info", "Creating new notification", {
        title: notificationData.title,
        type: notificationData.type,
        userId: notificationData.userId,
        projectId: notificationData.projectId,
      });

      // Optimistic UI update
      const fallbackNotification: Notification = {
        id: `temp-${Date.now()}`,
        ...notificationData,
        timestamp: new Date(),
        isRead: false,
      };
      setNotifications((prev) => [fallbackNotification, ...prev]);

      const response = await nodeApiService.createNotification({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        userId: notificationData.userId,
        projectId: notificationData.projectId,
        actionUrl: notificationData.actionUrl,
      });

      if (response.success && response.data) {
        const newNotification = convertSupabaseNotification(response.data as unknown as ApiNotification);
        setNotifications((prev) =>
          prev.map((n) => (n.id === fallbackNotification.id ? newNotification : n)),
        );

        await activityLogger.log(
          "notification_create",
          "success",
          "Notification created successfully",
          {
            notificationId: newNotification.id,
            title: notificationData.title,
            userId: notificationData.userId,
          },
        );
      }
    } catch (error) {
      console.error("Error adding notification:", error);
      await activityLogger.log(
        "notification_create",
        "error",
        "Failed to create notification",
        {
          title: notificationData.title,
          userId: notificationData.userId,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      );
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await nodeApiService.markNotificationAsRead(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;
    try {
      const response = await nodeApiService.markAllNotificationsAsRead(user.id);
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await nodeApiService.deleteNotification(notificationId);
      if (response.success) {
        setNotifications((prev) =>
          prev.filter((notification) => notification.id !== notificationId),
        );
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;
    try {
      const ids = notifications.map((n) => n.id);
      await Promise.all(ids.map((id) => nodeApiService.deleteNotification(id)));
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
}

function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}

NotificationProvider.displayName = 'NotificationProvider';

export { NotificationProvider, useNotifications };

export default NotificationProvider;
