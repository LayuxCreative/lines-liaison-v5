import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import {
  EnhancedNotification,
  NotificationSettings,
  NotificationCategory,
  NotificationPriority,
} from "../../types";

// Notification Context Types
interface NotificationState {
  notifications: EnhancedNotification[];
  settings: NotificationSettings;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  toastNotifications: EnhancedNotification[];
}

type NotificationAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_NOTIFICATIONS"; payload: EnhancedNotification[] }
  | { type: "ADD_NOTIFICATION"; payload: EnhancedNotification }
  | {
      type: "UPDATE_NOTIFICATION";
      payload: { id: string; updates: Partial<EnhancedNotification> };
    }
  | { type: "DELETE_NOTIFICATION"; payload: string }
  | { type: "MARK_AS_READ"; payload: string }
  | { type: "MARK_ALL_AS_READ" }
  | { type: "SET_SETTINGS"; payload: NotificationSettings }
  | { type: "UPDATE_SETTINGS"; payload: Partial<NotificationSettings> }
  | { type: "ADD_TOAST"; payload: EnhancedNotification }
  | { type: "REMOVE_TOAST"; payload: string }
  | { type: "CLEAR_TOASTS" };

interface NotificationContextType {
  state: NotificationState;
  dispatch: React.Dispatch<NotificationAction>;
  // Helper functions
  addNotification: (
    notification: Omit<EnhancedNotification, "id" | "createdAt" | "updatedAt">,
  ) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  showToast: (
    notification: Omit<EnhancedNotification, "id" | "createdAt" | "updatedAt">,
  ) => void;
  removeToast: (id: string) => void;
  getFilteredNotifications: (filters?: {
    category?: NotificationCategory;
    priority?: NotificationPriority;
    status?: "read" | "unread";
    search?: string;
  }) => EnhancedNotification[];
}

// Initial state
const initialState: NotificationState = {
  notifications: [],
  settings: {
    userId: "",
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
      startTime: "22:00",
      endTime: "08:00",
    },
    frequency: "immediate",
    updatedAt: new Date(),
  },
  isLoading: false,
  error: null,
  unreadCount: 0,
  toastNotifications: [],
};

// Reducer
const notificationReducer = (
  state: NotificationState,
  action: NotificationAction,
): NotificationState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "SET_NOTIFICATIONS": {
      const notifications = action.payload;
      const unreadCount = notifications.filter(
        (n) => n.status === "unread",
      ).length;
      return { ...state, notifications, unreadCount, isLoading: false };
    }

    case "ADD_NOTIFICATION": {
      const newNotification = action.payload;
      const notifications = [newNotification, ...state.notifications];
      const unreadCount = notifications.filter(
        (n) => n.status === "unread",
      ).length;
      return { ...state, notifications, unreadCount };
    }

    case "UPDATE_NOTIFICATION": {
      const { id, updates } = action.payload;
      const notifications = state.notifications.map((n) =>
        n.id === id ? { ...n, ...updates } : n,
      );
      const unreadCount = notifications.filter(
        (n) => n.status === "unread",
      ).length;
      return { ...state, notifications, unreadCount };
    }

    case "DELETE_NOTIFICATION": {
      const notifications = state.notifications.filter(
        (n) => n.id !== action.payload,
      );
      const unreadCount = notifications.filter(
        (n) => n.status === "unread",
      ).length;
      return { ...state, notifications, unreadCount };
    }

    case "MARK_AS_READ": {
      const notifications = state.notifications.map((n) =>
        n.id === action.payload ? { ...n, status: "read" as const } : n,
      );
      const unreadCount = notifications.filter(
        (n) => n.status === "unread",
      ).length;
      return { ...state, notifications, unreadCount };
    }

    case "MARK_ALL_AS_READ": {
      const notifications = state.notifications.map((n) =>
        n.status === "unread" ? { ...n, status: "read" as const } : n,
      );
      return { ...state, notifications, unreadCount: 0 };
    }

    case "SET_SETTINGS":
      return { ...state, settings: action.payload };

    case "UPDATE_SETTINGS": {
      const settings = {
        ...state.settings,
        ...action.payload,
        updatedAt: new Date(),
      };
      return { ...state, settings };
    }

    case "ADD_TOAST": {
      const toastNotifications = [...state.toastNotifications, action.payload];
      return { ...state, toastNotifications };
    }

    case "REMOVE_TOAST": {
      const toastNotifications = state.toastNotifications.filter(
        (n) => n.id !== action.payload,
      );
      return { ...state, toastNotifications };
    }

    case "CLEAR_TOASTS":
      return { ...state, toastNotifications: [] };

    default:
      return state;
  }
};

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

// Provider Props
interface NotificationProviderProps {
  children: React.ReactNode;
  userId?: string;
  initialNotifications?: EnhancedNotification[];
  initialSettings?: Partial<NotificationSettings>;
}

// Provider Component
export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
  userId = "",
  initialNotifications = [],
  initialSettings = {},
}) => {
  const [state, dispatch] = useReducer(notificationReducer, {
    ...initialState,
    notifications: initialNotifications,
    settings: {
      ...initialState.settings,
      userId,
      ...initialSettings,
    },
    unreadCount: initialNotifications.filter((n) => n.status === "unread")
      .length,
  });

  // Helper function to generate unique IDs
  const generateId = useCallback(() => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Helper function to check if notifications are allowed during quiet hours
  const isQuietHours = useCallback(() => {
    if (!state.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = state.settings.quietHours.startTime
      .split(":")
      .map(Number);
    const [endHour, endMin] = state.settings.quietHours.endTime
      .split(":")
      .map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }, [state.settings.quietHours]);

  // Helper function to check if notification should be shown
  const shouldShowNotification = useCallback(
    (notification: EnhancedNotification) => {
      // Check if category is enabled
      if (!state.settings.categories[notification.category]) {
        return false;
      }

      // During quiet hours, only show critical notifications
      if (isQuietHours() && notification.priority !== "critical") {
        return false;
      }

      return true;
    },
    [state.settings.categories, isQuietHours],
  );

  // Helper functions
  const addNotification = useCallback(
    (notificationData: Omit<EnhancedNotification, "id" | "createdAt">) => {
      const notification: EnhancedNotification = {
        ...notificationData,
        id: generateId(),
        createdAt: new Date(),
      };

      dispatch({ type: "ADD_NOTIFICATION", payload: notification });

      // Show toast if in-app notifications are enabled and notification should be shown
      if (
        state.settings.inAppNotifications &&
        shouldShowNotification(notification)
      ) {
        dispatch({ type: "ADD_TOAST", payload: notification });
      }
    },
    [generateId, state.settings.inAppNotifications, shouldShowNotification],
  );

  const markAsRead = useCallback((id: string) => {
    dispatch({ type: "MARK_AS_READ", payload: id });
  }, []);

  const markAllAsRead = useCallback(() => {
    dispatch({ type: "MARK_ALL_AS_READ" });
  }, []);

  const deleteNotification = useCallback((id: string) => {
    dispatch({ type: "DELETE_NOTIFICATION", payload: id });
    dispatch({ type: "REMOVE_TOAST", payload: id });
  }, []);

  const updateSettings = useCallback(
    (settings: Partial<NotificationSettings>) => {
      dispatch({ type: "UPDATE_SETTINGS", payload: settings });
    },
    [],
  );

  const showToast = useCallback(
    (notificationData: Omit<EnhancedNotification, "id" | "createdAt">) => {
      const notification: EnhancedNotification = {
        ...notificationData,
        id: generateId(),
        createdAt: new Date(),
      };

      if (shouldShowNotification(notification)) {
        dispatch({ type: "ADD_TOAST", payload: notification });
      }
    },
    [generateId, shouldShowNotification],
  );

  const removeToast = useCallback((id: string) => {
    dispatch({ type: "REMOVE_TOAST", payload: id });
  }, []);

  const getFilteredNotifications = useCallback(
    (
      filters: {
        category?: NotificationCategory;
        priority?: NotificationPriority;
        status?: "read" | "unread";
        search?: string;
      } = {},
    ) => {
      let filtered = state.notifications;

      if (filters.category) {
        filtered = filtered.filter((n) => n.category === filters.category);
      }

      if (filters.priority) {
        filtered = filtered.filter((n) => n.priority === filters.priority);
      }

      if (filters.status) {
        filtered = filtered.filter((n) => n.status === filters.status);
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(
          (n) =>
            n.title.toLowerCase().includes(searchLower) ||
            n.message.toLowerCase().includes(searchLower),
        );
      }

      return filtered;
    },
    [state.notifications],
  );

  // Load notifications and settings on mount
  useEffect(() => {
    // In a real app, you would load from API or localStorage
    // For now, we'll use the initial data
    dispatch({ type: "SET_LOADING", payload: false });
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (state.settings.userId) {
      try {
        localStorage.setItem(
          `notification_settings_${state.settings.userId}`,
          JSON.stringify(state.settings),
        );
      } catch (error) {
        console.warn("Failed to save notification settings:", error);
      }
    }
  }, [state.settings]);

  const contextValue: NotificationContextType = {
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
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notification context
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
};

// Hook for toast notifications specifically
export const useToastNotifications = () => {
  const { state, removeToast } = useNotifications();

  return {
    toasts: state.toastNotifications,
    removeToast,
  };
};

// Hook for notification settings
export const useNotificationSettings = () => {
  const { state, updateSettings } = useNotifications();

  return {
    settings: state.settings,
    updateSettings,
  };
};

// Hook for unread notifications count
export const useUnreadCount = () => {
  const { state } = useNotifications();
  return state.unreadCount;
};

// Custom hook for notification actions
export const useNotificationActions = () => {
  const {
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showToast,
  } = useNotifications();

  return {
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    showToast,
  };
};
