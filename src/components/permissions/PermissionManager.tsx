import React, { useState, useEffect, useCallback } from "react";
import {
  Permission,
  UserPermissions,
  PermissionCategory,
  PermissionLevel,
  PermissionAction,
  PermissionRestriction,
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
  onPermissionUpdate?: (userId: string, permissions: UserPermissions) => void;
  onPermissionCreate?: (permission: Omit<Permission, "id">) => void;
  onPermissionDelete?: (permissionId: string) => void;
}

export const PermissionManager: React.FC<PermissionManagerProps> = ({
  currentUser,
  users,
  onPermissionUpdate,
  onPermissionCreate,
  onPermissionDelete,
}) => {
  const [state, setState] = useState<PermissionState>({
    permissions: [],
    userPermissions: {},
    isLoading: true,
    error: null,
  });

  const [selectedUser, setSelectedUser] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "overview" | "users" | "roles" | "restrictions"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<
    PermissionCategory | "all"
  >("all");

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

  const getPermissionLevel = useCallback(
    (userId: string, resource: string): PermissionLevel => {
      const userPerms = state.userPermissions[userId];
      if (!userPerms) return "none";

      const allPermissions = [
        ...userPerms.rolePermissions,
        ...userPerms.customPermissions,
      ];
      const resourcePermissions = allPermissions.filter(
        (perm) => perm.resource === resource,
      );

      if (resourcePermissions.some((p) => p.level === "admin")) return "admin";
      if (resourcePermissions.some((p) => p.level === "write")) return "write";
      if (resourcePermissions.some((p) => p.level === "read")) return "read";

      return "none";
    },
    [state.userPermissions],
  );

  const updateUserPermissions = useCallback(
    (userId: string, updates: Partial<UserPermissions>) => {
      setState((prev) => ({
        ...prev,
        userPermissions: {
          ...prev.userPermissions,
          [userId]: {
            ...prev.userPermissions[userId],
            ...updates,
            updatedAt: new Date(),
          },
        },
      }));

      if (onPermissionUpdate) {
        onPermissionUpdate(userId, {
          ...state.userPermissions[userId],
          ...updates,
          updatedAt: new Date(),
        });
      }
    },
    [state.userPermissions, onPermissionUpdate],
  );

  const addPermissionToUser = useCallback(
    (userId: string, permission: Permission) => {
      const userPerms = state.userPermissions[userId];
      if (!userPerms) return;

      const updatedCustomPermissions = [
        ...userPerms.customPermissions,
        permission,
      ];
      updateUserPermissions(userId, {
        customPermissions: updatedCustomPermissions,
      });
    },
    [state.userPermissions, updateUserPermissions],
  );

  const removePermissionFromUser = useCallback(
    (userId: string, permissionId: string) => {
      const userPerms = state.userPermissions[userId];
      if (!userPerms) return;

      const updatedCustomPermissions = userPerms.customPermissions.filter(
        (p) => p.id !== permissionId,
      );
      updateUserPermissions(userId, {
        customPermissions: updatedCustomPermissions,
      });
    },
    [state.userPermissions, updateUserPermissions],
  );

  const getFilteredPermissions = useCallback(() => {
    let filtered = state.permissions;

    if (searchTerm) {
      filtered = filtered.filter(
        (perm) =>
          perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          perm.description.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((perm) => perm.category === filterCategory);
    }

    return filtered;
  }, [state.permissions, searchTerm, filterCategory]);

  const getPermissionIcon = (category: PermissionCategory) => {
    switch (category) {
      case "dashboard":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
          </svg>
        );
      case "projects":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01.293.707V12a1 1 0 102 0V9a1 1 0 01.293-.707L13.586 6H12a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V7.414l-2.293 2.293A1 1 0 0112 10v2a3 3 0 11-6 0V8a1 1 0 01.293-.707L8.586 5H7a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "tasks":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "files":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
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

  const getLevelColor = (level: PermissionLevel) => {
    switch (level) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "write":
        return "bg-yellow-100 text-yellow-800";
      case "read":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

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
                          {user?.name.charAt(0) || "?"}
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
              onClick={() => setActiveTab(tab.id as any)}
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
