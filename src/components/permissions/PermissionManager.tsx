import React, { useState, useEffect, useCallback } from "react";
import {
  Permission,
  UserPermissions,
  PermissionAction,
  User,
} from "../../types";

// Permission Context and State Management
interface PermissionState {
  permissions: Permission[];
  userPermissions: Record<string, UserPermissions>;
  isLoading: boolean;
  error: string | null;
}

interface PermissionManagerProps {
  currentUser: User;
  users: User[];
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  currentUser,
  users,
}) => {
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    userPermissions: {},
    isLoading: true,
    error: null,
  });

  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "roles" | "restrictions"
  >("overview");

  // Initialize with empty data - permissions should come from Supabase
  useEffect(() => {
    setState({
      permissions: [],
      userPermissions: {},
      isLoading: false,
      error: null,
    });
  }, []);

  const hasPermission = useCallback(
    (userId: string, resource: string, action: PermissionAction): boolean => {
      const userPerms = state.userPermissions[userId];
      if (!userPerms) return false;

      const allPermissions = [
        ...userPerms.rolePermissions,
        ...userPerms.customPermissions,
      ];

      return allPermissions.some(
        (perm) => perm.resource === resource && perm.actions.includes(action),
      );
    },
    [state.userPermissions],
  );









  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Permission Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Permissions
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {state.permissions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg
                className="w-6 h-6 text-green-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Object.keys(state.userPermissions).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg
                className="w-6 h-6 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-semibold text-gray-900">
                {new Set(state.permissions.map((p) => p.category)).size}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <svg
                className="w-6 h-6 text-red-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Restrictions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Object.values(state.userPermissions).reduce(
                  (acc, user) => acc + user.restrictions.length,
                  0,
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Permission Changes */}
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">
            Recent Permission Changes
          </h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {Object.entries(state.userPermissions)
              .slice(0, 5)
              .map(([userId, userPerms]) => {
                const user = users.find((u) => u.id === userId);
                return (
                  <div
                    key={userId}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user?.name?.charAt(0) || "?"}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user?.name || "Unknown User"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {userPerms.rolePermissions.length +
                            userPerms.customPermissions.length}{" "}
                          permissions
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {userPerms.updatedAt.toLocaleDateString()}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <svg
            className="w-5 h-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading permissions
            </h3>
            <p className="text-sm text-red-700 mt-1">{state.error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Permission Management
          </h2>
          <p className="text-gray-600">
            Manage user permissions and access control
          </p>
        </div>

        {hasPermission(currentUser.id, "permissions", "create") && (
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Create Permission
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: "overview", name: "Overview", icon: "📊" },
            { id: "users", name: "Users", icon: "👥" },
            { id: "roles", name: "Roles", icon: "🏷️" },
            { id: "restrictions", name: "Restrictions", icon: "🔒" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as "overview" | "users" | "roles" | "restrictions")}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm transition-colors
                ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && renderOverviewTab()}

      {activeTab === "users" && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            User Permissions
          </h3>
          <p className="text-gray-600">
            User permissions management will be implemented here.
          </p>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Role Management
          </h3>
          <p className="text-gray-600">
            Role management will be implemented here.
          </p>
        </div>
      )}

      {activeTab === "restrictions" && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Permission Restrictions
          </h3>
          <p className="text-gray-600">
            Permission restrictions will be implemented here.
          </p>
        </div>
      )}
    </div>
  );
};

export default PermissionManager;
