import React, { useState, useEffect } from "react";
import { User, UserStatusType } from "../../types";

interface UserStatusManagerProps {
  currentUser: User;
  onStatusUpdate?: (status: UserStatusType) => void;
  showStatusHistory?: boolean;
}

interface StatusHistory {
  id: string;
  status: UserStatusType;
  timestamp: Date;
  duration?: number; // in minutes
  note?: string;
}

const UserStatusManager: React.FC<UserStatusManagerProps> = ({
  onStatusUpdate,
  showStatusHistory = false,
}) => {
  // currentUser will be used for future implementation
  const [currentStatus, setCurrentStatus] =
    useState<UserStatusType>("available");
  const [customMessage, setCustomMessage] = useState("");
  const [autoAwayEnabled, setAutoAwayEnabled] = useState(true);
  const [autoAwayTime, setAutoAwayTime] = useState(15); // minutes
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [scheduledStatus, setScheduledStatus] = useState<{
    status: UserStatusType;
    startTime: string;
    endTime: string;
    message?: string;
  } | null>(null);

  // Initialize with empty status history - data should come from Supabase
  useEffect(() => {
    setStatusHistory([]);
  }, []);

  const statusOptions = [
    {
      value: "available" as UserStatusType,
      label: "Available",
      color: "bg-green-500",
      icon: "🟢",
      description: "Ready to collaborate",
    },
    {
      value: "busy" as UserStatusType,
      label: "Busy",
      color: "bg-red-500",
      icon: "🔴",
      description: "Focused work - limited availability",
    },
    {
      value: "away" as UserStatusType,
      label: "Away",
      color: "bg-yellow-500",
      icon: "🟡",
      description: "Temporarily unavailable",
    },
    {
      value: "in_meeting" as UserStatusType,
      label: "In Meeting",
      color: "bg-purple-500",
      icon: "🟣",
      description: "Currently in a meeting",
    },
    {
      value: "out_of_office" as UserStatusType,
      label: "Out of Office",
      color: "bg-gray-500",
      icon: "⚫",
      description: "Not available",
    },
  ];

  const handleStatusChange = (newStatus: UserStatusType) => {
    // Store previous status for potential rollback
    // const previousStatus = currentStatus;
    setCurrentStatus(newStatus);

    // Add to history
    const historyEntry: StatusHistory = {
      id: Date.now().toString(),
      status: newStatus,
      timestamp: new Date(),
      note: customMessage || undefined,
    };

    setStatusHistory((prev) => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10 entries

    if (onStatusUpdate) {
      onStatusUpdate(newStatus);
    }

    // Clear custom message after status change
    if (customMessage) {
      setCustomMessage("");
      setShowCustomMessage(false);
    }
  };

  const handleScheduleStatus = () => {
    if (scheduledStatus) {
      // Logic to schedule status change
  
      setScheduledStatus(null);
    }
  };

  const getCurrentStatusOption = () => {
    return statusOptions.find((option) => option.value === currentStatus);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0
      ? `${hours}h ${remainingMinutes}m`
      : `${hours}h`;
  };

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Current Status Display */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Status</h3>
          <div className="flex items-center space-x-2">
            <span
              className={`w-3 h-3 rounded-full ${getCurrentStatusOption()?.color}`}
            ></span>
            <span className="text-sm font-medium text-gray-700">
              {getCurrentStatusOption()?.label}
            </span>
          </div>
        </div>

        {customMessage && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Status message:</span>{" "}
              {customMessage}
            </p>
          </div>
        )}
      </div>

      {/* Status Selection */}
      <div className="p-6 border-b">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Change Status
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentStatus === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-lg">{option.icon}</span>
                <div className="text-left">
                  <div className="font-medium text-gray-900">
                    {option.label}
                  </div>
                  <div className="text-xs text-gray-500">
                    {option.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Message */}
        <div className="mt-4">
          <button
            onClick={() => setShowCustomMessage(!showCustomMessage)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            {showCustomMessage ? "Hide" : "Add"} custom message
          </button>

          {showCustomMessage && (
            <div className="mt-3">
              <input
                type="text"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="What are you working on?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {customMessage.length}/100 characters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Auto-Away Settings */}
      <div className="p-6 border-b">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Auto-Away Settings
        </h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable auto-away
              </label>
              <p className="text-xs text-gray-500">
                Automatically set status to 'Away' when inactive
              </p>
            </div>
            <button
              onClick={() => setAutoAwayEnabled(!autoAwayEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoAwayEnabled ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoAwayEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {autoAwayEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Set away after (minutes)
              </label>
              <select
                value={autoAwayTime}
                onChange={(e) => setAutoAwayTime(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Schedule Status */}
      <div className="p-6 border-b">
        <h4 className="text-md font-medium text-gray-900 mb-4">
          Schedule Status
        </h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={scheduledStatus?.status || ""}
                onChange={(e) =>
                  setScheduledStatus((prev) => ({
                    ...prev,
                    status: e.target.value as UserStatusType,
                    startTime: prev?.startTime || "",
                    endTime: prev?.endTime || "",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select status</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={scheduledStatus?.startTime || ""}
                onChange={(e) =>
                  setScheduledStatus((prev) => ({
                    ...prev,
                    status: prev?.status || ("busy" as UserStatusType),
                    startTime: e.target.value,
                    endTime: prev?.endTime || "",
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={scheduledStatus?.endTime || ""}
                onChange={(e) =>
                  setScheduledStatus((prev) => ({
                    ...prev,
                    status: prev?.status || ("busy" as UserStatusType),
                    startTime: prev?.startTime || "",
                    endTime: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {scheduledStatus?.status &&
            scheduledStatus?.startTime &&
            scheduledStatus?.endTime && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Scheduled:</span>{" "}
                  {scheduledStatus.status} from {scheduledStatus.startTime} to{" "}
                  {scheduledStatus.endTime}
                </div>
                <button
                  onClick={handleScheduleStatus}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Schedule
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Status History */}
      {showStatusHistory && (
        <div className="p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Recent Status Changes
          </h4>
          <div className="space-y-3">
            {statusHistory.map((entry) => {
              const statusOption = statusOptions.find(
                (opt) => opt.value === entry.status,
              );
              return (
                <div
                  key={entry.id}
                  className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${statusOption?.color}`}
                  ></span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {statusOption?.label}
                      </span>
                      {entry.duration && (
                        <span className="text-xs text-gray-500">
                          ({formatDuration(entry.duration)})
                        </span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-xs text-gray-600 mt-1">{entry.note}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(entry.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserStatusManager;
