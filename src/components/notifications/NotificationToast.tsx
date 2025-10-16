import React, { useState, useEffect, useCallback } from "react";
import {
  EnhancedNotification,
  NotificationPriority,
  NotificationCategory,
} from "../../types";

interface NotificationToastProps {
  notification: EnhancedNotification;
  onClose: () => void;
  onAction?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onAction,
  autoClose = true,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300); // Animation duration
  }, [onClose]);

  useEffect(() => {
    if (autoClose && duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, handleClose]);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }
    if (notification.actionUrl) {
      window.open(notification.actionUrl, "_blank");
    }
    handleClose();
  };

  const getPriorityStyles = (priority: NotificationPriority) => {
    switch (priority) {
      case "critical":
        return {
          bg: "bg-red-50 border-red-200",
          icon: "text-red-600",
          accent: "bg-red-500",
        };
      case "high":
        return {
          bg: "bg-orange-50 border-orange-200",
          icon: "text-orange-600",
          accent: "bg-orange-500",
        };
      case "medium":
        return {
          bg: "bg-yellow-50 border-yellow-200",
          icon: "text-yellow-600",
          accent: "bg-yellow-500",
        };
      case "low":
        return {
          bg: "bg-green-50 border-green-200",
          icon: "text-green-600",
          accent: "bg-green-500",
        };
      default:
        return {
          bg: "bg-blue-50 border-blue-200",
          icon: "text-blue-600",
          accent: "bg-blue-500",
        };
    }
  };

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "urgent":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "work":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h2zm4-1a1 1 0 00-1 1v1h2V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "social":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        );
      case "financial":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "security":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return date.toLocaleDateString();
  };

  const styles = getPriorityStyles(notification.priority);

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm w-full
        transform transition-all duration-300 ease-in-out
        ${
          isVisible && !isExiting
            ? "translate-x-0 opacity-100"
            : "translate-x-full opacity-0"
        }
      `}
    >
      <div
        className={`
        rounded-lg border shadow-lg p-4 ${styles.bg}
        relative overflow-hidden
      `}
      >
        {/* Priority Accent Bar */}
        <div className={`absolute top-0 left-0 w-1 h-full ${styles.accent}`} />

        {/* Progress Bar for Auto-close */}
        {autoClose && duration > 0 && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 overflow-hidden">
            <div
              className={`h-full ${styles.accent} transition-all ease-linear`}
              style={{
                width: "0%",
                animation: `shrinkProgress ${duration}ms linear forwards`,
              }}
            />
          </div>
        )}

        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            {getCategoryIcon(notification.category)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-gray-900 truncate">
                {notification.title}
              </h4>

              {/* Priority Badge */}
              <span
                className={`
                inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                ${styles.icon} ${styles.bg}
              `}
              >
                {notification.priority}
              </span>
            </div>

            <p className="text-sm text-gray-700 mb-2 line-clamp-2">
              {notification.message}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formatTimeAgo(notification.createdAt)}
              </span>

              {/* Action Button */}
              {(notification.actionRequired || notification.actionUrl) && (
                <button
                  onClick={handleAction}
                  className={`
                    text-xs font-medium px-3 py-1 rounded-md
                    ${styles.icon} hover:bg-white hover:bg-opacity-50
                    transition-colors duration-200
                  `}
                >
                  {notification.actionText || "View"}
                </button>
              )}
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-white hover:bg-opacity-50 transition-colors duration-200"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Inline styles for animation */}
      <style>
        {`
          @keyframes shrinkProgress {
            from {
              width: 100%;
            }
            to {
              width: 0%;
            }
          }
        `}
      </style>
    </div>
  );
};

// Toast Container Component
interface NotificationToastContainerProps {
  notifications: EnhancedNotification[];
  onRemove: (id: string) => void;
  maxToasts?: number;
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export const NotificationToastContainer: React.FC<
  NotificationToastContainerProps
> = ({ notifications, onRemove, maxToasts = 5, position = "top-right" }) => {
  const [toasts, setToasts] = useState<EnhancedNotification[]>([]);

  useEffect(() => {
    // Add new notifications to toasts
    const newToasts = notifications.slice(-maxToasts);
    setToasts(newToasts);
  }, [notifications, maxToasts]);

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "top-4 left-4";
      case "bottom-right":
        return "bottom-4 right-4";
      case "bottom-left":
        return "bottom-4 left-4";
      default:
        return "top-4 right-4";
    }
  };

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-2`}>
      {toasts.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            transform: `translateY(${index * 4}px)`,
            zIndex: 50 - index,
          }}
        >
          <NotificationToast
            notification={notification}
            onClose={() => onRemove(notification.id)}
            autoClose={notification.priority !== "critical"}
            duration={notification.priority === "critical" ? 0 : 5000}
          />
        </div>
      ))}
    </div>
  );
};
