import React from "react";
import { EnhancedNotification } from "../../types";

interface NotificationBadgeProps {
  notifications: EnhancedNotification[];
  showCount?: boolean;
  showDot?: boolean;
  size?: "sm" | "md" | "lg";
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  className?: string;
  onClick?: () => void;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  notifications,
  showCount = true,
  showDot = false,
  size = "md",
  position = "top-right",
  className = "",
  onClick,
}) => {
  const unreadNotifications = notifications.filter(
    (n) => n.status === "unread",
  );
  const unreadCount = unreadNotifications.length;
  const hasCritical = unreadNotifications.some(
    (n) => n.priority === "critical",
  );
  const hasHigh = unreadNotifications.some((n) => n.priority === "high");

  if (unreadCount === 0 && !showDot) {
    return null;
  }

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          badge: "h-4 w-4 text-xs",
          dot: "h-2 w-2",
        };
      case "lg":
        return {
          badge: "h-7 w-7 text-sm",
          dot: "h-4 w-4",
        };
      default:
        return {
          badge: "h-5 w-5 text-xs",
          dot: "h-3 w-3",
        };
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case "top-left":
        return "-top-1 -left-1";
      case "bottom-right":
        return "-bottom-1 -right-1";
      case "bottom-left":
        return "-bottom-1 -left-1";
      default:
        return "-top-1 -right-1";
    }
  };

  const getPriorityColor = () => {
    if (hasCritical) {
      return "bg-red-500 text-white";
    }
    if (hasHigh) {
      return "bg-orange-500 text-white";
    }
    return "bg-blue-500 text-white";
  };

  const sizeClasses = getSizeClasses();
  const positionClasses = getPositionClasses();
  const colorClasses = getPriorityColor();

  if (showDot && unreadCount === 0) {
    return (
      <div
        className={`
          absolute ${positionClasses} ${sizeClasses.dot}
          bg-gray-400 rounded-full
          ${className}
        `}
      />
    );
  }

  return (
    <div
      className={`
        absolute ${positionClasses} ${sizeClasses.badge}
        ${colorClasses}
        rounded-full flex items-center justify-center
        font-semibold leading-none
        transform transition-all duration-200
        ${onClick ? "cursor-pointer hover:scale-110" : ""}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {showCount && unreadCount > 0 && (
        <span className="select-none">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </div>
  );
};

// Notification Icon with Badge Component
interface NotificationIconProps {
  notifications: EnhancedNotification[];
  onClick?: () => void;
  className?: string;
  iconClassName?: string;
  badgeProps?: Partial<NotificationBadgeProps>;
}

export const NotificationIcon: React.FC<NotificationIconProps> = ({
  notifications,
  onClick,
  className = "",
  iconClassName = "",
  badgeProps = {},
}) => {
  const unreadCount = notifications.filter((n) => n.status === "unread").length;
  const hasCritical = notifications.some(
    (n) => n.status === "unread" && n.priority === "critical",
  );

  return (
    <div className={`relative inline-flex ${className}`}>
      <button
        onClick={onClick}
        className={`
          p-2 rounded-lg transition-colors duration-200
          ${
            hasCritical
              ? "text-red-600 hover:bg-red-50"
              : unreadCount > 0
                ? "text-blue-600 hover:bg-blue-50"
                : "text-gray-400 hover:bg-gray-50"
          }
          ${iconClassName}
        `}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Pulse animation for critical notifications */}
        {hasCritical && (
          <div className="absolute inset-0 rounded-lg animate-pulse bg-red-200 opacity-25" />
        )}
      </button>

      <NotificationBadge notifications={notifications} {...badgeProps} />
    </div>
  );
};

// Mini Notification Summary Component
interface NotificationSummaryProps {
  notifications: EnhancedNotification[];
  className?: string;
}

export const NotificationSummary: React.FC<NotificationSummaryProps> = ({
  notifications,
  className = "",
}) => {
  const unreadNotifications = notifications.filter(
    (n) => n.status === "unread",
  );
  const criticalCount = unreadNotifications.filter(
    (n) => n.priority === "critical",
  ).length;
  const highCount = unreadNotifications.filter(
    (n) => n.priority === "high",
  ).length;
  const totalUnread = unreadNotifications.length;

  if (totalUnread === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No unread notifications
      </div>
    );
  }

  return (
    <div className={`text-sm ${className}`}>
      <div className="flex items-center space-x-4">
        <span className="text-gray-700">
          {totalUnread} unread notification{totalUnread !== 1 ? "s" : ""}
        </span>

        {criticalCount > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            {criticalCount} critical
          </span>
        )}

        {highCount > 0 && (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            {highCount} high priority
          </span>
        )}
      </div>
    </div>
  );
};

// Notification Status Indicator
interface NotificationStatusProps {
  notification: EnhancedNotification;
  size?: "sm" | "md" | "lg";
  showPriority?: boolean;
}

export const NotificationStatus: React.FC<NotificationStatusProps> = ({
  notification,
  size = "md",
  showPriority = true,
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return "w-2 h-2";
      case "lg":
        return "w-4 h-4";
      default:
        return "w-3 h-3";
    }
  };

  const getStatusColor = () => {
    if (notification.status === "unread") {
      switch (notification.priority) {
        case "critical":
          return "bg-red-500";
        case "high":
          return "bg-orange-500";
        case "medium":
          return "bg-yellow-500";
        case "low":
          return "bg-green-500";
        default:
          return "bg-blue-500";
      }
    }
    return "bg-gray-300";
  };

  return (
    <div className="flex items-center space-x-2">
      <div
        className={`
          ${getSizeClasses()} ${getStatusColor()}
          rounded-full flex-shrink-0
          ${notification.status === "unread" ? "animate-pulse" : ""}
        `}
      />

      {showPriority && (
        <span
          className={`
          text-xs font-medium capitalize
          ${notification.status === "unread" ? "text-gray-900" : "text-gray-500"}
        `}
        >
          {notification.priority}
        </span>
      )}
    </div>
  );
};
