import React, { useState } from "react";
import { useNotifications } from "./NotificationManager";
import { NotificationCategory, NotificationPriority } from "../../types";
import { activityLogger } from "../../utils/activityLogger";

interface NotificationSettingsProps {
  onClose?: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  onClose,
}) => {
  const { state, updateSettings } = useNotifications();
  const [settings, setSettings] = useState(state.settings);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    setHasChanges(true);
  };

  const handleCategoryToggle = (
    category: NotificationCategory,
    enabled: boolean,
  ) => {
    const newCategories = {
      ...settings.categories,
      [category]: enabled,
    };

    handleSettingChange("categories", newCategories);
  };

  // Priority filtering is handled at the application level, not in user settings

  const handleQuietHoursChange = (field: "start" | "end", value: string) => {
    const fieldMap = { start: "startTime", end: "endTime" };
    const newQuietHours = {
      ...settings.quietHours,
      [fieldMap[field]]: value,
    };
    handleSettingChange("quietHours", newQuietHours);
  };

  const handleSave = async () => {
    try {
      await activityLogger.log("notification_settings_save", "info", "Saving notification settings", {
        settings: JSON.stringify(settings),
        hasChanges
      });

      updateSettings(settings);
      setHasChanges(false);
      if (onClose) onClose();

      await activityLogger.log("notification_settings_save", "success", "Notification settings saved successfully", {
        settings: JSON.stringify(settings)
      });
    } catch (error) {
      await activityLogger.log("notification_settings_save", "error", "Failed to save notification settings", {
        settings: JSON.stringify(settings),
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  const handleReset = () => {
    setSettings(state.settings);
    setHasChanges(false);
  };

  const categories: {
    key: NotificationCategory;
    label: string;
    description: string;
  }[] = [
    {
      key: "urgent",
      label: "Urgent",
      description: "Critical notifications that require immediate attention",
    },
    {
      key: "work",
      label: "Work",
      description: "Project updates, deadlines, and work-related notifications",
    },
    {
      key: "social",
      label: "Social",
      description: "Messages, comments, and social interactions",
    },
    {
      key: "financial",
      label: "Financial",
      description: "Invoices, payments, and financial updates",
    },
    {
      key: "security",
      label: "Security",
      description: "Security alerts and account notifications",
    },
    {
      key: "system",
      label: "System",
      description: "System updates and maintenance notifications",
    },
  ];

  const priorities: {
    key: NotificationPriority;
    label: string;
    color: string;
  }[] = [
    { key: "critical", label: "Critical", color: "text-red-600" },
    { key: "high", label: "High", color: "text-orange-600" },
    { key: "medium", label: "Medium", color: "text-yellow-600" },
    { key: "low", label: "Low", color: "text-green-600" },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Notification Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-8">
        {/* Delivery Methods */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Delivery Methods
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Email Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive notifications via email
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.emailNotifications}
                  onChange={(e) =>
                    handleSettingChange("emailNotifications", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Push Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Receive browser push notifications
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.pushNotifications}
                  onChange={(e) =>
                    handleSettingChange("pushNotifications", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  In-App Notifications
                </label>
                <p className="text-sm text-gray-500">
                  Show notifications within the application
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.inAppNotifications}
                  onChange={(e) =>
                    handleSettingChange("inAppNotifications", e.target.checked)
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Notification Categories
          </h3>
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category.key} className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id={`category-${category.key}`}
                  checked={settings.categories[category.key] || false}
                  onChange={(e) =>
                    handleCategoryToggle(category.key, e.target.checked)
                  }
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  <label
                    htmlFor={`category-${category.key}`}
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {category.label}
                  </label>
                  <p className="text-sm text-gray-500">
                    {category.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note: Priority filtering is handled at the application level */}

        {/* Digest Settings */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Digest Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digest Frequency
              </label>
              <select
                value={settings.frequency}
                onChange={(e) =>
                  handleSettingChange("frequency", e.target.value)
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quiet Hours */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quiet Hours
          </h3>
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Enable Quiet Hours
              </label>
              <p className="text-sm text-gray-500">
                Reduce notifications during specified hours
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.quietHours.enabled}
                onChange={(e) =>
                  handleSettingChange("quietHours", {
                    ...settings.quietHours,
                    enabled: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {settings.quietHours.enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={settings.quietHours.startTime}
                  onChange={(e) =>
                    handleQuietHoursChange("start", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={settings.quietHours.endTime}
                  onChange={(e) =>
                    handleQuietHoursChange("end", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
